'use client';

import { HeaderStripSkeleton } from '../../components/layout/header-strip';
import { getAppShellClassName } from '../../components/layout/page-shell';
import { SignInRequired } from '../../components/layout/sign-in-required';
import { useAuthTokens, useHydratedValue } from '../../lib/auth-storage';
import { Simulator } from './_components/simulator';

export default function SimulatorPage() {
  const { accessToken } = useAuthTokens();
  const isAuthHydrated = useHydratedValue();

  return (
    <main className={getAppShellClassName('wide')}>
      {!isAuthHydrated ? (
        <HeaderStripSkeleton />
      ) : accessToken ? (
        <Simulator key={accessToken} accessToken={accessToken} />
      ) : (
        <SignInRequired
          title="Laboratorio de simulación"
          description="El simulador usa tu roster, tus historiales y tus stats guardados: inicia sesión para abrirlo."
        />
      )}
    </main>
  );
}
