'use client';

import { usePathname } from 'next/navigation';
import { Fragment, ReactNode } from 'react';
import {
  HeaderStrip,
  HeaderStripActions,
  HeaderStripChip,
  HeaderStripChips,
  HeaderStripDivider,
  HeaderStripSkeleton,
} from '../../../components/layout/header-strip';
import { getAppShellClassName } from '../../../components/layout/page-shell';
import { SignInRequired } from '../../../components/layout/sign-in-required';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { NavTabs } from '../../../components/ui/nav-tabs';
import { Note } from '../../../components/ui/note';
import type { MeResponse } from '../../../lib/api';
import { useAuthTokens } from '../../../lib/auth-storage';
import { useCurrentUser } from '../../../lib/use-current-user';
import { useSignOut } from '../../../lib/use-sign-out';
import { ADMIN_SECTIONS, resolveActiveAdminHref } from './admin-sections';

export type AdminContext = {
  accessToken: string;
  me: MeResponse;
};

type AdminPageProps = {
  title: string;
  description: string;
  children: (context: AdminContext) => ReactNode;
};

const EYEBROW = 'Backoffice · Administración';

type AdminStripProps = Pick<AdminPageProps, 'title' | 'description'> & {
  me: MeResponse;
  isAdmin: boolean;
};

function AdminStrip({ title, description, me, isAdmin }: AdminStripProps) {
  const signOut = useSignOut();

  return (
    <HeaderStrip
      glyph={me.name.trim().charAt(0).toUpperCase() || '✦'}
      eyebrow={isAdmin ? EYEBROW : 'Backoffice · Sin permisos'}
      title={title}
      description={
        isAdmin
          ? description
          : 'Tu sesión está activa, pero esta cuenta no tiene rol ADMIN.'
      }
    >
      <HeaderStripChips>
        <HeaderStripChip label="Sesión" value={me.email} />
        <HeaderStripChip label="Rol" value={me.role} highlight />
      </HeaderStripChips>
      <HeaderStripDivider />
      <HeaderStripActions>
        <ButtonLink href="/">Espacio de trabajo</ButtonLink>
        <Button variant="ghost" onClick={signOut}>
          Cerrar sesión
        </Button>
      </HeaderStripActions>
    </HeaderStrip>
  );
}

/**
 * Armazón de toda página /admin/*: verifica en cliente que la sesión sea de un
 * ADMIN (no hay middleware que lo haga) y solo entonces renderiza el contenido,
 * con la franja de cabecera y la navegación entre secciones.
 */
export function AdminPage({ title, description, children }: AdminPageProps) {
  const pathname = usePathname();
  const { accessToken } = useAuthTokens();
  const currentUser = useCurrentUser();

  function renderContent() {
    switch (currentUser.status) {
      case 'loading':
        return <HeaderStripSkeleton />;
      case 'anonymous':
        return (
          <SignInRequired
            title={title}
            description="Necesitas iniciar sesión como administrador para acceder al backoffice."
          />
        );
      case 'error':
        return (
          <>
            <Alert tone="error">
              No fue posible verificar la sesión administrativa.
            </Alert>
            <div>
              <Button type="button" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </>
        );
      case 'ready': {
        const me = currentUser.profile;
        const isAdmin = me.role === 'ADMIN';

        return (
          <>
            <AdminStrip
              title={title}
              description={description}
              me={me}
              isAdmin={isAdmin}
            />

            {isAdmin ? (
              <>
                {me.mustChangePassword ? (
                  <Note tone="warning">
                    Tu cuenta requiere cambio de contraseña. El acceso al panel
                    sigue habilitado, pero conviene resolverlo cuanto antes.
                  </Note>
                ) : null}
                <NavTabs
                  label="Secciones de administración"
                  items={ADMIN_SECTIONS}
                  activeHref={resolveActiveAdminHref(pathname)}
                />
                <Fragment key={accessToken}>{children({ accessToken, me })}</Fragment>
              </>
            ) : (
              <Alert tone="error">
                Si necesitas entrar al backoffice, usa una cuenta administrativa.
              </Alert>
            )}
          </>
        );
      }
    }
  }

  return <main className={getAppShellClassName('wide')}>{renderContent()}</main>;
}
