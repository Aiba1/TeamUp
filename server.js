// TeamUp backend: Node http + SQLite (built-in, no npm install needed).
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const PORT = 3000;
const db = new DatabaseSync('teamup.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    max INTEGER NOT NULL,
    description TEXT DEFAULT '',
    owner_id INTEGER REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id),
    user_id INTEGER REFERENCES users(id),
    team TEXT NOT NULL,
    UNIQUE (event_id, team)
  );
`);

if (db.prepare('SELECT COUNT(*) AS n FROM events').get().n === 0) {
  const seed = [
    ['Campus Basketball Cup', 'Basketball', '2026-10-18', 'Almaty Sports Arena', 8, 'Annual university basketball cup. 5v5, FIBA rules.',
      ['North Stars', 'Falcons', 'Wildcats', 'Titans', 'Raptors', 'Wolves', 'Eagles']],
    ['Almaty Amateur League', 'Football', '2026-10-11', 'Central Football Field', 8, 'Weekend 7-a-side league for amateur teams.',
      ['FC Steppe', 'Red Lions', 'Atlas', 'Dynamo', 'Kairat Fans', 'Blue Hawks', 'Sunrise', 'Old Boys']],
    ['Weekend Volleyball Open', 'Volleyball', '2026-10-24', 'University Sports Hall', 16, 'Mixed teams welcome. Best of 3 sets.',
      ['Spikers', 'Net Ninjas', 'Block Party', 'Aces', 'Sky High', 'Dig Deep']],
    ['Doubles Tennis Day', 'Tennis', '2026-11-02', 'City Tennis Club', 4, 'One-day doubles knockout.', ['Kim / Lee', 'Smith / Ono']],
  ];
  const addEvent = db.prepare('INSERT INTO events (name, sport, date, location, max, description) VALUES (?, ?, ?, ?, ?, ?)');
  const addTeam = db.prepare('INSERT INTO registrations (event_id, team) VALUES (?, ?)');
  for (const [name, sport, date, location, max, description, teams] of seed) {
    const { lastInsertRowid } = addEvent.run(name, sport, date, location, max, description);
    teams.forEach(t => addTeam.run(lastInsertRowid, t));
  }
}

/* ---------- Auth helpers ---------- */
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
}
function checkPassword(password, stored) {
  const [salt] = stored.split(':');
  return hashPassword(password, salt) === stored;
}
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}
function currentUser(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  return db.prepare('SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(token);
}

function eventWithTeams(e) {
  const regs = db.prepare('SELECT team, user_id FROM registrations WHERE event_id = ? ORDER BY id').all(e.id);
  return { ...e, teams: regs.map(r => r.team), registrations: regs };
}

/* ---------- HTTP helpers ---------- */
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  try { return JSON.parse(body || '{}'); } catch { return {}; }
}

/* ---------- Routes ---------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const m = path.match(/^\/api\/events\/(\d+)(\/join)?$/);

  try {
    // Frontend
    if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync('teamup.html'));
    }

    // POST /api/register
    if (req.method === 'POST' && path === '/api/register') {
      const { name, email, password } = await readBody(req);
      if (!name || !email || !password) return send(res, 400, { error: 'Name, email and password are required' });
      if (password.length < 4) return send(res, 400, { error: 'Password must be at least 4 characters' });
      if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return send(res, 409, { error: 'Email already registered' });
      const { lastInsertRowid } = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashPassword(password));
      return send(res, 201, { token: createSession(lastInsertRowid), user: { id: Number(lastInsertRowid), name, email } });
    }

    // POST /api/login
    if (req.method === 'POST' && path === '/api/login') {
      const { email, password } = await readBody(req);
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email || '');
      if (!user || !checkPassword(password || '', user.password)) return send(res, 401, { error: 'Invalid email or password' });
      return send(res, 200, { token: createSession(user.id), user: { id: user.id, name: user.name, email: user.email } });
    }

    // POST /api/logout
    if (req.method === 'POST' && path === '/api/logout') {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return send(res, 200, { ok: true });
    }

    // GET /api/me
    if (req.method === 'GET' && path === '/api/me') {
      const user = currentUser(req);
      return user ? send(res, 200, user) : send(res, 401, { error: 'Not logged in' });
    }

    // GET /api/events
    if (req.method === 'GET' && path === '/api/events') {
      const events = db.prepare('SELECT * FROM events ORDER BY id DESC').all();
      return send(res, 200, events.map(eventWithTeams));
    }

    // POST /api/events  (auth)
    if (req.method === 'POST' && path === '/api/events') {
      const user = currentUser(req);
      if (!user) return send(res, 401, { error: 'Log in first' });
      const { name, sport, date, location, max, description = '' } = await readBody(req);
      if (!name || !sport || !date || !location || !max) return send(res, 400, { error: 'Fill in all fields' });
      const { lastInsertRowid } = db.prepare('INSERT INTO events (name, sport, date, location, max, description, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(name, sport, date, location, Number(max), description, user.id);
      return send(res, 201, eventWithTeams(db.prepare('SELECT * FROM events WHERE id = ?').get(lastInsertRowid)));
    }

    // GET /api/events/:id
    if (req.method === 'GET' && m && !m[2]) {
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(m[1]);
      return event ? send(res, 200, eventWithTeams(event)) : send(res, 404, { error: 'Event not found' });
    }

    // POST /api/events/:id/join  (auth)
    if (req.method === 'POST' && m && m[2]) {
      const user = currentUser(req);
      if (!user) return send(res, 401, { error: 'Log in first' });
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(m[1]);
      if (!event) return send(res, 404, { error: 'Event not found' });
      const { team } = await readBody(req);
      if (!team || !team.trim()) return send(res, 400, { error: 'Team name is required' });
      const e = eventWithTeams(event);
      if (e.teams.length >= e.max) return send(res, 400, { error: 'Event is full' });
      if (e.registrations.some(r => r.user_id === user.id)) return send(res, 409, { error: 'You are already registered' });
      if (e.teams.some(t => t.toLowerCase() === team.trim().toLowerCase())) return send(res, 409, { error: 'Team name already taken' });
      db.prepare('INSERT INTO registrations (event_id, user_id, team) VALUES (?, ?, ?)').run(event.id, user.id, team.trim());
      return send(res, 201, eventWithTeams(event));
    }

    send(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => console.log(`TeamUp running on http://localhost:${PORT}`));
