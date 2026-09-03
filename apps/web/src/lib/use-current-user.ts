'use client';

import { useEffect, useState } from 'react';
import { apiRequest, MeResponse } from './api';
import { useAuthTokens, useHydratedValue } from './auth-storage';

export type CurrentUserState =
  | { status: 'anonymous' }
  | { status: 'loading' }
  | { status: 'ready'; profile: MeResponse }
  | { status: 'error' };

type RemoteState =
  | { token: string; status: 'ready'; profile: MeResponse }
  | { token: string; status: 'error' };

let cachedToken: string | null = null;
let cachedPromise: Promise<MeResponse> | null = null;

function fetchMeOnce(token: string): Promise<MeResponse> {
  if (cachedToken === token && cachedPromise) {
    return cachedPromise;
  }

  cachedToken = token;
  cachedPromise = apiRequest<MeResponse>('/auth/me', { token });
  return cachedPromise;
}

export function useCurrentUser(): CurrentUserState {
  const { accessToken } = useAuthTokens();
  const isHydrated = useHydratedValue();
  const [remoteState, setRemoteState] = useState<RemoteState | null>(null);

  useEffect(() => {
    if (!isHydrated || !accessToken) {
      return;
    }

    let active = true;

    fetchMeOnce(accessToken)
      .then((profile) => {
        if (active) setRemoteState({ token: accessToken, status: 'ready', profile });
      })
      .catch(() => {
        if (active) setRemoteState({ token: accessToken, status: 'error' });
      });

    return () => {
      active = false;
    };
  }, [isHydrated, accessToken]);

  if (!isHydrated) {
    return { status: 'loading' };
  }

  if (!accessToken) {
    return { status: 'anonymous' };
  }

  if (remoteState && remoteState.token === accessToken) {
    return remoteState.status === 'ready'
      ? { status: 'ready', profile: remoteState.profile }
      : { status: 'error' };
  }

  return { status: 'loading' };
}
