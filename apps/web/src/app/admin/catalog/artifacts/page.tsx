import type { Metadata } from 'next';
import { RelicSetsPanel } from '../_components/relic-sets-panel';
import {
  getAdminBackdropClassName,
  getAdminShellClassName,
} from '../../_components/admin-layout';

export const metadata: Metadata = {
  title: 'Artefactos | Administración | OmniGacha',
  description:
    'Alta, edición, estado editorial y splash art de los sets de artefacto.',
};

export default function AdminArtifactsPage() {
  return (
    <main className={getAdminShellClassName('wide')}>
      <div className={getAdminBackdropClassName('hero')} />
      <RelicSetsPanel type="ARTIFACT" />
    </main>
  );
}
