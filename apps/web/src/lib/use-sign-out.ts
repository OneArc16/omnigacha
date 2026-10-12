'use client';

import { toast } from 'sonner';
import { apiRequest } from './api';
import { clearAuthTokens, useAuthTokens } from './auth-storage';
import { resolveErrorMessage } from './errors';

/** Revoca el refresh token en la API y limpia la sesión local pase lo que pase. */
export function useSignOut() {
  const { refreshToken } = useAuthTokens();

  return async function signOut() {
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      }
      toast.success('Sesión cerrada.');
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'No fue posible cerrar la sesión'));
    } finally {
      clearAuthTokens();
    }
  };
}
