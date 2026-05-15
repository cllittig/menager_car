import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;






export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return browserClient;
}

export type RecoveryRedirectResult =
  | { handled: false }
  | { handled: true; error?: string };





export async function recoverSessionFromRecoveryRedirect(
  sb: SupabaseClient,
): Promise<RecoveryRedirectResult> {
  if (typeof window === 'undefined') {
    return { handled: false };
  }

  const urlObj = new URL(window.location.href);
  const oauthErr = urlObj.searchParams.get('error');
  const oauthDesc = urlObj.searchParams.get('error_description');
  if (oauthErr) {
    const msg = oauthDesc ? decodeURIComponent(oauthDesc.replace(/\+/g, ' ')) : oauthErr;
    return { handled: true, error: msg };
  }

  const code = urlObj.searchParams.get('code');
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      return { handled: true, error: error.message };
    }
    urlObj.searchParams.delete('code');
    const nextSearch = urlObj.searchParams.toString();
    window.history.replaceState(
      null,
      '',
      urlObj.pathname + (nextSearch ? `?${nextSearch}` : '') + urlObj.hash,
    );
    return { handled: true };
  }

  const hashRaw = urlObj.hash.replace(/^#/, '');
  if (hashRaw) {
    const hp = new URLSearchParams(hashRaw);
    const access_token = hp.get('access_token');
    const refresh_token = hp.get('refresh_token');
    const type = hp.get('type');
    if (access_token && refresh_token && type === 'recovery') {
      const { error } = await sb.auth.setSession({ access_token, refresh_token });
      if (error) {
        return { handled: true, error: error.message };
      }
      window.history.replaceState(null, '', urlObj.pathname + urlObj.search);
      return { handled: true };
    }
  }

  return { handled: false };
}
