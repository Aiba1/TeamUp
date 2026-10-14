
export function singleElimination(teams) {
  let size = 1;
  while (size < teams.length) size *= 2;
  const seeded = [...teams, ...Array(size - teams.length).fill(null)];

  let order = [0];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n - 1 - s]);
  }

  const rounds = [];
  const first = [];
  for (let i = 0; i < size / 2; i++) {
    const a = seeded[order[i * 2]];
    const b = seeded[order[i * 2 + 1]];
    first.push({ a, b, winner: b === null ? a : a === null ? b : null });
  }
  rounds.push(first);
  for (let n = size / 4; n >= 1; n /= 2) {
    rounds.push(Array.from({ length: n }, () => ({ a: null, b: null, winner: null })));
  }
  return propagate(rounds);
}

export function propagate(rounds) {
  const next = rounds.map((r) => r.map((m) => ({ ...m })));
  for (let r = 1; r < next.length; r++) {
    next[r].forEach((m, i) => {
      const a = next[r - 1][i * 2].winner;
      const b = next[r - 1][i * 2 + 1].winner;
      if (m.a !== a || m.b !== b) {
        m.a = a;
        m.b = b;
        if (m.winner !== a && m.winner !== b) m.winner = null;
      }
    });
  }
  return next;
}

export function setWinner(rounds, r, i, team) {
  const next = rounds.map((round) => round.map((m) => ({ ...m })));
  const m = next[r][i];
  if (!m.a || !m.b) return rounds;
  m.winner = m.winner === team ? null : team;
  return propagate(next);
}

export function roundRobin(teams) {
  const list = teams.length % 2 ? [...teams, null] : [...teams];
  const n = list.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a && b) round.push({ a, b, winner: null });
    }
    rounds.push(round);
    list.splice(1, 0, list.pop());
  }
  return rounds;
}

export function standings(teams, rounds) {
  const table = Object.fromEntries(teams.map((t) => [t, { team: t, played: 0, wins: 0, losses: 0 }]));
  rounds.flat().forEach((m) => {
    if (!m.winner) return;
    const loser = m.winner === m.a ? m.b : m.a;
    table[m.winner].played++;
    table[m.winner].wins++;
    table[loser].played++;
    table[loser].losses++;
  });
  return Object.values(table).sort((x, y) => y.wins - x.wins || x.losses - y.losses);
}
