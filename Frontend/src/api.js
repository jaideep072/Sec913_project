// Frontend ↔ Gateway API helper
//
// Architecture:
//   React (Vite, :5173)  ──►  Python FastAPI gateway (:8000)  ──►  Spring Boot (:8001)
//
// All calls go to the gateway. CORS for :5173 is enabled in gateway/main.py.
// Override the base URL by adding to Frontend/.env.local:
//   VITE_API_BASE_URL=http://localhost:8000

let rawUrl = (import.meta.env && (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) || 'http://localhost:8000';
if (rawUrl && !rawUrl.startsWith('http')) {
  rawUrl = 'https://' + rawUrl;
}
const API_BASE_URL = rawUrl;
console.log("AKS Frontend booting up. Target Gateway API:", API_BASE_URL);

export const TOKEN_STORAGE_KEY = 'kp_jwt';

// ── token helpers ────────────────────────────────────────────

export function getStoredToken() {
  try { return localStorage.getItem(TOKEN_STORAGE_KEY) || ''; } catch { return ''; }
}
export function storeToken(token) {
  try { localStorage.setItem(TOKEN_STORAGE_KEY, token); } catch { /* ignore */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
}

// ── low-level HTTP ───────────────────────────────────────────

async function request(method, path, { body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getStoredToken();
    if (t) headers['Token'] = t;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // Try to parse JSON whether the call succeeded or not — the backend
  // returns {code, message} bodies even on error.
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    const msg = data && data.message ? data.message : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  // Some endpoints (signin, signup, /delete) wrap success as {code: 200, ...}
  // Treat non-200 application codes as errors too so callers don't have to.
  if (data && typeof data.code === 'number' && data.code >= 400) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// ── auth ─────────────────────────────────────────────────────

export async function signupUser({ fullname, phone, email, password, role }) {
  return request('POST', '/authservice/signup', {
    auth: false,
    body: { fullname, phone, email, password, role },
  });
}

export async function signinUser({ email, password }) {
  return request('POST', '/authservice/signin', {
    auth: false,
    body: { username: email, password },
  });
  // → { code: 200, jwt, role, fullname, id }
}

export async function fetchUserInfo() {
  return request('GET', '/authservice/uinfo');
  // → { code: 200, id, fullname, email, phone, role }
}

// ── sections ─────────────────────────────────────────────────

export const sectionsApi = {
  list:   ()           => request('GET',    '/sections'),
  create: (s)          => request('POST',   '/sections', { body: s }),
  update: (id, s)      => request('PUT',    `/sections/${encodeURIComponent(id)}`, { body: s }),
  remove: (id)         => request('DELETE', `/sections/${encodeURIComponent(id)}`),
};

// ── resources ────────────────────────────────────────────────

export const resourcesApi = {
  list:   (sectionId)  => {
    const q = sectionId ? `?sectionId=${encodeURIComponent(sectionId)}` : '';
    return request('GET', `/resources${q}`);
  },
  get:    (id)         => request('GET',    `/resources/${id}`),
  popular: ()          => request('GET',    '/resources/popular'),
  similar: (id)        => request('GET',    `/resources/${id}/similar`),
  search: (q)          => request('GET',    `/resources/search?q=${encodeURIComponent(q)}`),
  create: (r)          => request('POST',   '/resources', { body: r }),
  update: (id, r)      => request('PUT',    `/resources/${id}`, { body: r }),
  remove: (id)         => request('DELETE', `/resources/${id}`),
  setPublished: (id, published) =>
    request('PUT', `/resources/${id}/publish`, { body: { published } }),
};

// ── book requests (Student → Librarian sanction flow) ────────

export const requestsApi = {
  list:    (status)              => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request('GET', `/requests${q}`);
  },
  create:  (resourceId, notes)   => request('POST', '/requests', {
                                       body: { resourceId, notes: notes || '' },
                                     }),
  approve: (id, notes)           => request('PUT',  `/requests/${id}/approve`, {
                                       body: { notes: notes || '' },
                                     }),
  reject:  (id, notes)           => request('PUT',  `/requests/${id}/reject`, {
                                       body: { notes: notes || '' },
                                     }),
  cancel:  (id)                  => request('PUT',  `/requests/${id}/cancel`),
};

// ── External API imports (Librarian / Admin) ─────────────────

export const externalApi = {
  // Open Library (books)
  olSearch:  (q, limit = 10)  => request('GET',  `/external/books?q=${encodeURIComponent(q)}&limit=${limit}`),
  olImport:  (payload)        => request('POST', '/external/books/import',  { body: payload }),
  olRequest: (payload)        => request('POST', '/external/books/request', { body: payload }),

  // arXiv (papers — physics, math, CS, biology, finance)
  arxivSearch:  (q, limit = 10) => request('GET',  `/external/arxiv?q=${encodeURIComponent(q)}&limit=${limit}`),
  arxivImport:  (payload)       => request('POST', '/external/arxiv/import',  { body: payload }),
  arxivRequest: (payload)       => request('POST', '/external/arxiv/request', { body: payload }),
};

// ── admin (full powers) ──────────────────────────────────────

export const adminApi = {
  listUsers:     ()                  => request('GET',    '/admin/users'),
  setRole:       (id, role)          => request('PUT',    `/admin/users/${id}/role`,   { body: { role } }),
  setStatus:     (id, status)        => request('PUT',    `/admin/users/${id}/status`, { body: { status } }),
  deleteUser:    (id)                => request('DELETE', `/admin/users/${id}`),
  audit:         ()                  => request('GET',    '/admin/audit'),
};

// ── borrows ──────────────────────────────────────────────────

export const borrowsApi = {
  list:           ()                  => request('GET',    '/borrows'),
  create:         (b)                 => request('POST',   '/borrows', { body: b }),
  markReturned:   (id, returnedOn)    => request('PUT',    `/borrows/${id}/return`, {
                                            body: returnedOn ? { returnedOn } : {},
                                          }),
  remove:         (id)                => request('DELETE', `/borrows/${id}`),
};

// ── reviews (Node.js + MongoDB) ──────────────────────────────

export const reviewsApi = {
  list:   (resourceId) => request('GET', `/reviews?resourceId=${encodeURIComponent(resourceId)}`),
  create: (review)     => request('POST', '/reviews', { body: review }),
  remove: (id)         => request('DELETE', `/reviews/${id}`),
};
