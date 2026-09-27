const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://nojwjyvawqvfpiiqpegm.supabase.co';
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || 'sb_publishable_b-Z12UFtuEVHhK3AgGFDlg_ig8iZa4f';
const FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/tiktok-kura-api` : '';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY && FUNCTION_URL);
}

async function request(action: string, body: Record<string, unknown> = {}, adminToken?: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase yapılandırması eksik.');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY!,
    Authorization: `Bearer ${SUPABASE_KEY!}`,
  };
  if (adminToken) headers['X-Admin-Token'] = adminToken;

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Supabase isteği başarısız (${res.status}).`);
  return data;
}

export function publicState() { return request('public_state'); }
export function joinParticipant(username: string) { return request('join', { username }); }
export function checkParticipant(username: string) { return request('check', { username }); }
export function renameParticipant(oldUsername: string, newUsername: string, claimToken: string) {
  return request('rename', { oldUsername, newUsername, claimToken });
}

export function adminLogin(username: string, password: string) {
  return request('admin_login', { username, password });
}
export function adminState(token: string) { return request('admin_state', {}, token); }
export function adminSaveState(token: string, state: Record<string, unknown>) {
  return request('admin_save_state', { state }, token);
}
export function adminLogout(token: string) { return request('admin_logout', {}, token); }
