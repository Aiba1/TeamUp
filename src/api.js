// Mock backend: stands in for the real Auth & Tournament API until it's wired up.
// Data lives in localStorage; tokens are fake (unsigned) JWTs.

const USERS_KEY = 'teamup_users';
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/=+$/, '');

function makeJwt(user) {
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({ sub: user.id, email: user.email, exp: Date.now() / 1000 + 3600 });
  return `${header}.${payload}.mock-signature`;
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

// POST /auth/register
export async function register({ username, email, password }) {
  await delay();
  const users = loadUsers();
  if (users.some((u) => u.email === email)) throw new Error('Email already registered');
  const user = { id: crypto.randomUUID(), username, email, password, game: 'Valorant', role: 'Duelist', rank: 'Gold' };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  const { password: _, ...safe } = user;
  return { token: makeJwt(user), user: safe };
}

// POST /auth/login
export async function login({ email, password }) {
  await delay();
  const user = loadUsers().find((u) => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');
  const { password: _, ...safe } = user;
  return { token: makeJwt(user), user: safe };
}

// Activities: esports, team sports and outdoor. The `game` field on users/players/tournaments holds one of these.
export const CATEGORIES = {
  Esports: ['Valorant', 'CS2', 'Dota 2', 'League of Legends'],
  'Team sports': ['Football', 'Volleyball', 'Basketball'],
  Outdoor: ['Hiking', 'Running', 'Cycling'],
};
export const GAMES = Object.values(CATEGORIES).flat();
export const ROLES = {
  Valorant: ['Duelist', 'Controller', 'Initiator', 'Sentinel'],
  CS2: ['Entry', 'AWPer', 'Support', 'IGL', 'Lurker'],
  'Dota 2': ['Carry', 'Mid', 'Offlane', 'Soft Support', 'Hard Support'],
  'League of Legends': ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
  Football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Hiking: ['Day hike', 'Multi-day trek', 'Summit climb'],
  Running: ['5K', '10K', 'Half marathon', 'Marathon', 'Trail'],
  Cycling: ['Road', 'Mountain bike', 'City rides'],
};
export const RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];
export const LEVELS = ['Beginner', 'Amateur', 'Intermediate', 'Advanced', 'Pro'];
export const levelsFor = (game) => (CATEGORIES.Esports.includes(game) ? RANKS : LEVELS);
export const ALL_LEVELS = [...RANKS, ...LEVELS];

// GET /players — seeded mock data for teammate search
const NAMES = [
  'Aibar', 'Dana', 'Nurs', 'Aru', 'Timur', 'Madi', 'Zhan', 'Alina', 'Yerlan', 'Sanzhar', 'Kamila', 'Dias',
  'Asel', 'Bekzat', 'Tomiris', 'Arman', 'Aigerim', 'Nurlan', 'Dilnaz', 'Erlan', 'Zarina', 'Ayan', 'Saule', 'Ruslan',
  'Akbota', 'Olzhas', 'Inkar', 'Daulet', 'Moldir', 'Alikhan',
];
export const PLAYERS = NAMES.map((name, i) => {
  const game = GAMES[i % GAMES.length];
  const levels = levelsFor(game);
  return {
    id: `p${i}`,
    name,
    game,
    role: ROLES[game][i % ROLES[game].length],
    rank: levels[(i * 7) % levels.length],
    lookingForTeam: i % 3 !== 0,
    lang: i % 2 ? 'RU / EN' : 'KZ / RU',
  };
});
