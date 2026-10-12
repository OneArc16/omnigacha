'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { Skeleton } from '../../../components/ui/skeleton';
import { WindowPanel } from '../../../components/ui/window-panel';
import { useAuthTokens, useHydratedValue } from '../../../lib/auth-storage';
import { apiRequest, MeResponse } from '../../../lib/api';
import { ADMIN_PANEL_HERO_GRID_CLASSNAME } from './admin-layout';

type AdminAccessGateProps = {
  title: string;
  subtitle: string;
  children: (context: { accessToken: string; me: MeResponse }) => ReactNode;
};

/**
 * Role-gates an /admin/* page: checks /auth/me client-side (no middleware
 * exists for this), then renders children only once the session belongs to
 * an ADMIN. Shared across every admin page so the hydrating/no-token/
 * loading/error/forbidden screens stay consistent without copy-paste.
 */
export function AdminAccessGate({ title, subtitle, children }: AdminAccessGateProps) {
  const { accessToken } = useAuthTokens();
  const isHydrated = useHydratedValue();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'ready' | 'forbidden' | 'error'
  >('idle');
  const [loadError, setLoadError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!isHydrated || !accessToken) {
      return;
    }

    let active = true;

    async function bootstrap() {
      setStatus('loading');
      setLoadError('');

      try {
        const profile = await apiRequest<MeResponse>('/auth/me', {
          token: accessToken,
        });

        if (!active) return;

        setMe(profile);
        setStatus(profile.role === 'ADMIN' ? 'ready' : 'forbidden');
      } catch (error) {
        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : 'No fue posible verificar la sesión administrativa.',
        );
        setStatus('error');
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken, isHydrated, retryNonce]);

  if (!isHydrated) {
    return (
      <WindowPanel
        title={title}
        subtitle="Recuperando datos del backoffice."
        action={<Badge variant="brand">Sincronizando</Badge>}
      >
        <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
          <div className="space-y-3">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-14 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl sm:col-span-2" />
          </div>
        </div>
      </WindowPanel>
    );
  }

  if (!accessToken) {
    return (
      <WindowPanel
        title={title}
        subtitle="Necesitas iniciar sesión como administrador para acceder al backoffice."
        action={<Badge variant="warning">Acceso requerido</Badge>}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-600)]">{subtitle}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/" className="w-full">
              Ir al espacio principal
            </ButtonLink>
            <ButtonLink href="/admin" variant="ghost" className="w-full">
              Volver al panel
            </ButtonLink>
          </div>
        </div>
      </WindowPanel>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <WindowPanel
        title={title}
        subtitle="Recuperando datos del backoffice."
        action={<Badge variant="brand">Sincronizando</Badge>}
      >
        <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
          <div className="space-y-3">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-14 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl sm:col-span-2" />
          </div>
        </div>
      </WindowPanel>
    );
  }

  if (status === 'error') {
    return (
      <WindowPanel
        title={title}
        subtitle="No pudimos cargar el backoffice."
        action={<Badge variant="danger">Error</Badge>}
      >
        <div className="space-y-4">
          <Alert tone="error">{loadError}</Alert>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setRetryNonce((current) => current + 1)}
            >
              Reintentar
            </Button>
            <ButtonLink href="/admin" variant="ghost">
              Volver al panel
            </ButtonLink>
          </div>
        </div>
      </WindowPanel>
    );
  }

  if (status === 'forbidden') {
    return (
      <WindowPanel
        title={title}
        subtitle="Tu sesión está activa, pero no tiene permisos administrativos."
        action={<Badge variant="warning">Sin permisos</Badge>}
      >
        <div className="space-y-4">
          <Alert tone="error">
            Esta cuenta no tiene rol ADMIN. Si necesitas entrar al backoffice,
            usa una cuenta administrativa.
          </Alert>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
              Sesión actual
            </p>
            <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">
              {me?.name ?? 'Usuario autenticado'}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-600)]">
              {me?.email ?? 'Correo no disponible'}
            </p>
          </div>
          <ButtonLink href="/" className="w-full sm:w-auto">
            Volver al espacio principal
          </ButtonLink>
        </div>
      </WindowPanel>
    );
  }

  if (!me) {
    return null;
  }

  return <>{children({ accessToken, me })}</>;
}
