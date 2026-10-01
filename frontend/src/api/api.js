// src/api/api.js — Centralized Axios-free fetch wrapper

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('tms_token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

async function request(method, path, body) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  delete: (path)         => request('DELETE', path),
};

// ── Auth ────────────────────────────────────────────────
export const authApi = {
  login:    (data) => api.post('/auth/login',    data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

// ── Tournaments ─────────────────────────────────────────
export const tournamentApi = {
  getAll:  ()       => api.get('/tournaments'),
  getOne:  (id)     => api.get(`/tournaments/${id}`),
  create:  (data)   => api.post('/tournaments', data),
  update:  (id, d)  => api.put(`/tournaments/${id}`, d),
  remove:  (id)     => api.delete(`/tournaments/${id}`),
};

// ── Teams ───────────────────────────────────────────────
export const teamApi = {
  getAll:  (tid)    => api.get(`/teams${tid ? `?tournament_id=${tid}` : ''}`),
  getOne:  (id)     => api.get(`/teams/${id}`),
  create:  (data)   => api.post('/teams', data),
  update:  (id, d)  => api.put(`/teams/${id}`, d),
  remove:  (id)     => api.delete(`/teams/${id}`),
};

// ── Players ─────────────────────────────────────────────
export const playerApi = {
  getAll:  (q = {}) => api.get(`/players?${new URLSearchParams(q)}`),
  getOne:  (id)     => api.get(`/players/${id}`),
  create:  (data)   => api.post('/players', data),
  update:  (id, d)  => api.put(`/players/${id}`, d),
  remove:  (id)     => api.delete(`/players/${id}`),
};

// ── Venues ──────────────────────────────────────────────
export const venueApi = {
  getAll:  (tid)    => api.get(`/venues${tid ? `?tournament_id=${tid}` : ''}`),
  getOne:  (id)     => api.get(`/venues/${id}`),
  create:  (data)   => api.post('/venues', data),
  update:  (id, d)  => api.put(`/venues/${id}`, d),
  remove:  (id)     => api.delete(`/venues/${id}`),
};

// ── Umpires ─────────────────────────────────────────────
export const umpireApi = {
  getAll:  (tid)    => api.get(`/umpires${tid ? `?tournament_id=${tid}` : ''}`),
  getOne:  (id)     => api.get(`/umpires/${id}`),
  create:  (data)   => api.post('/umpires', data),
  update:  (id, d)  => api.put(`/umpires/${id}`, d),
  remove:  (id)     => api.delete(`/umpires/${id}`),
};

// ── Matches ─────────────────────────────────────────────
export const matchApi = {
  getAll:           (q = {}) => api.get(`/matches?${new URLSearchParams(q)}`),
  getOne:           (id)     => api.get(`/matches/${id}`),
  create:           (data)   => api.post('/matches', data),
  update:           (id, d)  => api.put(`/matches/${id}`, d),
  remove:           (id)     => api.delete(`/matches/${id}`),
  generateFixtures: (data)   => api.post('/matches/generate', data),
  clearFixtures:    (tid)    => api.delete(`/matches/clear/${tid}`),
};

// ── Results ─────────────────────────────────────────────
export const resultApi = {
  getOne:  (matchId) => api.get(`/results/${matchId}`),
  save:    (data)    => api.post('/results', data),
};

// ── Standings ────────────────────────────────────────────
export const standingApi = {
  get:     (tid) => api.get(`/standings?tournament_id=${tid}`),
  summary: (tid) => api.get(`/standings/summary?tournament_id=${tid}`),
};

// ── Stats ────────────────────────────────────────────────
export const statsApi = {
  players:     (tid, sort) => api.get(`/stats/players?tournament_id=${tid}${sort ? `&sort_by=${sort}` : ''}`),
  teams:       (tid) => api.get(`/stats/teams?tournament_id=${tid}`),
  leaderboard: (tid) => api.get(`/stats/leaderboard?tournament_id=${tid}`),
};

// ── Knockout ─────────────────────────────────────────────
export const knockoutApi = {
  get:          (tid)      => api.get(`/knockout?tournament_id=${tid}`),
  generate:     (data)     => api.post('/knockout/generate', data),
  recordWinner: (data)     => api.post('/knockout/record-winner', data),
  create:       (data)     => api.post('/knockout', data),
  update:       (id, data) => api.put(`/knockout/${id}`, data),
  clear:        (tid)      => api.delete(`/knockout/clear/${tid}`),
};
