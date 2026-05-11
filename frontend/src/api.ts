const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000/api';

function getAccess() { return localStorage.getItem('gf_access') || ''; }
export function saveTokens(tokens: any) {
  if (!tokens) return;
  if (tokens.access) localStorage.setItem('gf_access', tokens.access);
  if (tokens.refresh) localStorage.setItem('gf_refresh', tokens.refresh);
}
export function clearTokens() {
  localStorage.removeItem('gf_access');
  localStorage.removeItem('gf_refresh');
}

async function request(path: string, options: RequestInit = {}, auth = true) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any || {}) };
  const token = getAccess();
  // Ne jamais envoyer un ancien token sur login/register/reset public.
  // Sinon DRF peut retourner 401 avant même d'entrer dans la vue AllowAny.
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; }
  catch { throw new Error(`Réponse backend non JSON (${res.status}). Vérifie les migrations et l'URL API.`); }
  if (!res.ok) throw new Error(data?.detail || data?.email || data?.username || 'Erreur API');
  return data;
}

export const api = {
  login: (username: string, password: string) => request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }, false),
  register: (payload: any) => request('/auth/register/', { method: 'POST', body: JSON.stringify(payload) }, false),
  me: () => request('/auth/me/'),
  activate: () => request('/auth/activate/', { method: 'POST' }),
  directReset: (email: string, newPassword: string) => request('/auth/password-reset/direct/', { method: 'POST', body: JSON.stringify({ email, newPassword }) }, false),
  deposit: (amount: number, method: string, txRef: string) => request('/deposits/', { method: 'POST', body: JSON.stringify({ amount, method, txRef }) }),
  withdraw: (amount: number, method: string) => request('/withdrawals/', { method: 'POST', body: JSON.stringify({ amount, method }) }),
  tasks: () => request('/tasks/'),
  completeTask: (taskId: string | number) => request('/tasks/complete/', { method: 'POST', body: JSON.stringify({ taskId }) }),
  spin: (kind: 'signup'|'task', amount: number) => request('/wheel/spin/', { method: 'POST', body: JSON.stringify({ kind, amount }) }),
  referrals: () => request('/auth/referrals/'),
  adminUsers: () => request('/auth/admin/users/'),
  adminDeposits: () => request('/admin/deposits/'),
  adminWithdrawals: () => request('/admin/withdrawals/'),
  adminTasks: () => request('/admin/tasks/'),
  toggleUser: (id: string | number) => request(`/auth/admin/users/${id}/toggle/`, { method: 'POST' }),
  updateDeposit: (id: string | number, status: string) => request(`/admin/deposits/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateWithdrawal: (id: string | number, status: string) => request(`/admin/withdrawals/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  addTask: (task: any) => request('/admin/tasks/', { method: 'POST', body: JSON.stringify(task) }),
  deleteTask: (id: string | number) => request(`/admin/tasks/${id}/`, { method: 'DELETE' }),
};
