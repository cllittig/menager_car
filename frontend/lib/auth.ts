import Cookies from 'js-cookie';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';


const AUTH_COOKIE_PATH = '/';

function clientCookieBase(): Pick<
  Cookies.CookieAttributes,
  'path' | 'secure' | 'sameSite'
> {
  if (typeof window === 'undefined') {
    return { path: AUTH_COOKIE_PATH, secure: false, sameSite: 'lax' };
  }
  let secure = window.location.protocol === 'https:';
  if (process.env.NEXT_PUBLIC_COOKIE_SECURE === 'true') {
    secure = true;
  }
  if (process.env.NEXT_PUBLIC_COOKIE_SECURE === 'false') {
    secure = false;
  }
  return {
    path: AUTH_COOKIE_PATH,
    secure,
    sameSite: 'lax',
  };
}

const getCookieOptions = (isRefreshToken = false): Cookies.CookieAttributes => {
  const base = clientCookieBase();
  return {
    ...base,
    expires: isRefreshToken ? 30 : 7,
  };
};

export function getToken(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    let token = Cookies.get(TOKEN_KEY);

    if (!token) {
      token = sessionStorage.getItem(TOKEN_KEY) || undefined;
    }

    if (!token) {
      token = localStorage.getItem(TOKEN_KEY) || undefined;
      if (token) {
        saveToken(token);
        localStorage.removeItem(TOKEN_KEY);
      }
    }

    return token;
  } catch (error) {
    console.error('Erro ao recuperar token:', error);
    return undefined;
  }
}

export function getRefreshToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    return Cookies.get(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY) || undefined;
  } catch (error) {
    console.error('Erro ao recuperar refresh token:', error);
    return undefined;
  }
}


export function clearClientRefreshStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    Cookies.remove(REFRESH_TOKEN_KEY, { path: AUTH_COOKIE_PATH });
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {

  }
}

export function saveToken(token: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;

  try {
    const cookieOptions = getCookieOptions();
    const refreshCookieOptions = getCookieOptions(true);

    Cookies.set(TOKEN_KEY, token, cookieOptions);
    sessionStorage.setItem(TOKEN_KEY, token);

    if (refreshToken) {
      Cookies.set(REFRESH_TOKEN_KEY, refreshToken, refreshCookieOptions);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao salvar token:', error);
  }
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;

  try {
    const rm = clientCookieBase();
    Cookies.remove(TOKEN_KEY, rm);
    Cookies.remove(REFRESH_TOKEN_KEY, rm);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao remover token:', error);
  }
}






export async function clearSessionViaBff(): Promise<void> {
  if (typeof window === 'undefined') return;
  const refreshToken = getRefreshToken();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
  } catch {

  }
  removeToken();
}

export function isAuthenticated(): boolean {
  const token = getToken();
  return !!token;
}

export function isTokenExpiringSoon(token?: string): boolean {
  if (!token) token = getToken();
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp == null) {
      return false;
    }
    const exp = payload.exp * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return exp - now < fiveMinutes;
  } catch {
    return true;
  }
}




export async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const useHp = process.env.NEXT_PUBLIC_AUTH_USE_HTTPONLY_REFRESH === 'true';
    const refreshFromClient = getRefreshToken();
    if (!useHp && !refreshFromClient) {
      return false;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(useHp ? {} : { refreshToken: refreshFromClient }),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as {
      accessToken?: string;
      token?: string;
      refreshToken?: string;
    };
    const access = data.accessToken ?? data.token;
    if (!access) {
      return false;
    }

    saveToken(access, data.refreshToken);
    if (useHp) {
      clearClientRefreshStorage();
    }
    return true;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return false;
  }
}

export async function refreshTokenIfNeeded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const useHp = process.env.NEXT_PUBLIC_AUTH_USE_HTTPONLY_REFRESH === 'true';
  const refreshFromClient = getRefreshToken();
  const currentToken = getToken();

  if (!useHp && (!refreshFromClient || !currentToken)) {
    return false;
  }

  if (useHp && !currentToken) {
    return refreshAccessToken();
  }

  if (useHp && currentToken && !isTokenExpiringSoon(currentToken)) {
    return false;
  }

  if (!useHp && currentToken && !isTokenExpiringSoon(currentToken)) {
    return false;
  }

  return refreshAccessToken();
}
