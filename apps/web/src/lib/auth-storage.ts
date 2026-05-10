export const ACCESS_TOKEN_KEY = 'omnigacha_access_token';
export const REFRESH_TOKEN_KEY = 'omnigacha_refresh_token';

export function loadAuthTokens() {
  if (typeof window === 'undefined') {
    return { accessToken: '', refreshToken: '' };
  }

  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? '',
    refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? '',
  };
}

export function saveAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAuthTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
