'use client';

import { HeaderStripSkeleton } from '../components/layout/header-strip';
import { getAppShellClassName } from '../components/layout/page-shell';
import { GuestLanding } from './_components/workspace/guest-landing';
import { useSession } from './_components/workspace/use-session';
import { Workspace } from './_components/workspace/workspace';

export default function Home() {
  const session = useSession();

  return (
    <main className={getAppShellClassName('wide')}>
      {session.status === 'loading' ? <HeaderStripSkeleton /> : null}

      {session.status === 'guest' ? (
        <GuestLanding error={session.error} onSignIn={session.signIn} />
      ) : null}

      {session.status === 'authenticated' ? (
        <Workspace key={session.accessToken} session={session} />
      ) : null}
    </main>
  );
}
