import { useSyncExternalStore } from 'react';

export const ACCESS_TOKEN_KEY = 'omnigacha_access_token';
export const REFRESH_TOKEN_KEY = 'omnigacha_refresh_token';
const AUTH_CHANGE_EVENT = 'omnigacha-auth-change';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const EMPTY_AUTH_TOKENS: AuthTokens = {
  accessToken: '',
  refreshToken: '',
};

let cachedAuthTokens: AuthTokens = EMPTY_AUTH_TOKENS;

function readAuthTokensSnapshot(): AuthTokens {
  if (typeof window === 'undefined') {
    return EMPTY_AUTH_TOKENS;
  }

  const nextAccessToken =
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? EMPTY_AUTH_TOKENS.accessToken;
  const nextRefreshToken =
    window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? EMPTY_AUTH_TOKENS.refreshToken;

  if (
    cachedAuthTokens.accessToken === nextAccessToken &&
    cachedAuthTokens.refreshToken === nextRefreshToken
  ) {
    return cachedAuthTokens;
  }

  cachedAuthTokens = {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
  };

  return cachedAuthTokens;
}

function subscribeToAuthChanges(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener('storage', handleChange);
  window.addEventListener(AUTH_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, handleChange);
  };
}

function emitAuthChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function loadAuthTokens() {
  return readAuthTokensSnapshot();
}

export function saveAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  emitAuthChange();
}

export function clearAuthTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  emitAuthChange();
}

export function useAuthTokens() {
  return useSyncExternalStore(
    subscribeToAuthChanges,
    readAuthTokensSnapshot,
    () => EMPTY_AUTH_TOKENS,
  );
}

export function useHydratedValue() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
