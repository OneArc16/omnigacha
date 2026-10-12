'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  apiRequest,
  AuthResponse,
  DashboardSummaryResponse,
  MeResponse,
} from '../../../lib/api';
import {
  clearAuthTokens,
  saveAuthTokens,
  useAuthTokens,
  useHydratedValue,
} from '../../../lib/auth-storage';
import { resolveErrorMessage } from '../../../lib/errors';
import { useSignOut } from '../../../lib/use-sign-out';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Ingresa un correo válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual.'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
});

export type AuthMode = 'login' | 'register';
export type AuthCredentials = { name: string; email: string; password: string };
export type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
};

export type SessionStatus = 'loading' | 'guest' | 'authenticated';

type RemoteSession = {
  token: string;
  me: MeResponse;
  summary: DashboardSummaryResponse;
};

function fetchDashboardSummary(token: string) {
  return apiRequest<DashboardSummaryResponse>('/dashboard/summary', { token });
}

export function useSession() {
  const { accessToken } = useAuthTokens();
  const isHydrated = useHydratedValue();
  const signOut = useSignOut();
  const [remote, setRemote] = useState<RemoteSession | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isHydrated || !accessToken) return;

    let active = true;

    Promise.all([
      apiRequest<MeResponse>('/auth/me', { token: accessToken }),
      fetchDashboardSummary(accessToken),
    ])
      .then(([me, summary]) => {
        if (!active) return;
        setRemote({ token: accessToken, me, summary });
        setError('');
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        toast.error(err.message);
        clearAuthTokens();
      });

    return () => {
      active = false;
    };
  }, [accessToken, isHydrated]);

  const refreshSummary = useCallback(async () => {
    if (!accessToken) return;
    const summary = await fetchDashboardSummary(accessToken);
    setRemote((current) =>
      current && current.token === accessToken ? { ...current, summary } : current,
    );
  }, [accessToken]);

  async function signIn(mode: AuthMode, credentials: AuthCredentials) {
    setError('');

    try {
      const response = await apiRequest<AuthResponse>(
        mode === 'register' ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          body:
            mode === 'register'
              ? registerSchema.parse(credentials)
              : loginSchema.parse(credentials),
        },
      );

      saveAuthTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      toast.success(
        mode === 'register' ? 'Cuenta creada con éxito.' : 'Sesión iniciada.',
      );
      return true;
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'No fue posible autenticar'));
      return false;
    }
  }

  async function changePassword(values: ChangePasswordValues) {
    if (!accessToken) return false;

    try {
      await apiRequest<{ success: boolean; message: string }>(
        '/auth/change-password',
        {
          method: 'POST',
          token: accessToken,
          body: changePasswordSchema.parse(values),
        },
      );
      toast.success(
        'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
      );
      return true;
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, 'No fue posible cambiar la contraseña'),
      );
      return false;
    }
  }

  // Los datos remotos solo valen para el token con el que se pidieron.
  const current = remote && remote.token === accessToken ? remote : null;
  const status: SessionStatus = !isHydrated
    ? 'loading'
    : accessToken
      ? 'authenticated'
      : 'guest';

  return {
    status,
    accessToken,
    me: current?.me ?? null,
    summary: current?.summary ?? null,
    error,
    signIn,
    signOut,
    changePassword,
    refreshSummary,
  };
}

export type Session = ReturnType<typeof useSession>;
