'use client';

import { useState } from 'react';
import { WORKSPACE_OVERVIEW_GRID_CLASSNAME } from '../../../components/layout/page-shell';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { SegmentedTabs } from '../../../components/ui/segmented-tabs';
import { AccountView } from './account-view';
import { ControlPanel } from './control-panel';
import { DashboardBoard } from './dashboard-board';
import { RosterView } from './roster-view';
import {
  HeaderStrip,
  HeaderStripActions,
  HeaderStripChip,
  HeaderStripChips,
  HeaderStripDivider,
} from '../../../components/layout/header-strip';
import { useRoster } from './use-roster';
import type { Session } from './use-session';

type WorkspaceView = 'overview' | 'roster' | 'account';

const WORKSPACE_OPTIONS: {
  value: WorkspaceView;
  label: string;
  description: string;
}[] = [
  {
    value: 'overview',
    label: 'Resumen',
    description: 'Vista rápida del estado de tu cuenta',
  },
  {
    value: 'roster',
    label: 'Roster',
    description: 'Agregar, editar y ordenar personajes',
  },
  {
    value: 'account',
    label: 'Cuenta',
    description: 'Perfil, seguridad y cierre de sesión',
  },
];

/** Mesa de trabajo de una sesión autenticada. Se monta con `key={accessToken}`. */
export function Workspace({ session }: { session: Session }) {
  const { me, summary } = session;
  const roster = useRoster(session.accessToken, session.refreshSummary);
  const [selectedView, setSelectedView] = useState<WorkspaceView>('overview');

  // Una contraseña temporal bloquea la navegación hasta que se actualice.
  const view: WorkspaceView = me?.mustChangePassword ? 'account' : selectedView;
  const lastScore = summary?.lastRecommendation?.score;

  return (
    <>
      <HeaderStrip
        glyph={me?.name.trim().charAt(0).toUpperCase() || '✦'}
        eyebrow="Trazador · Sesión activa"
        title={me ? `${me.name}, tu mesa está lista` : 'Tu cuenta está lista'}
        description="Planea tu roster, evalúa pulls y simula daño desde una sola mesa."
      >
        <HeaderStripChips>
          <HeaderStripChip label="Cuenta" value={me?.email ?? '—'} />
          <HeaderStripChip
            label="Último puntaje"
            value={lastScore ?? 'Sin datos'}
            highlight
          />
        </HeaderStripChips>
        <HeaderStripDivider />
        <HeaderStripActions>
          <ButtonLink href="/simulator">Abrir simulador</ButtonLink>
          <Button variant="ghost" onClick={session.signOut}>
            Cerrar sesión
          </Button>
        </HeaderStripActions>
      </HeaderStrip>

      <SegmentedTabs
        value={view}
        onValueChange={setSelectedView}
        options={WORKSPACE_OPTIONS}
      />

      {view === 'overview' ? (
        <section className={`mt-1 ${WORKSPACE_OVERVIEW_GRID_CLASSNAME}`}>
          <ControlPanel
            characters={roster.characters}
            error={roster.error}
            onManageRoster={() => setSelectedView('roster')}
          />
          <DashboardBoard
            summary={summary}
            catalog={roster.catalog}
            onRegisterCharacter={() => setSelectedView('roster')}
          />
        </section>
      ) : null}

      {view === 'roster' ? <RosterView roster={roster} /> : null}

      {view === 'account' ? (
        <AccountView
          me={me}
          onChangePassword={session.changePassword}
          onSignOut={session.signOut}
          onBackToOverview={() => setSelectedView('overview')}
        />
      ) : null}
    </>
  );
}
