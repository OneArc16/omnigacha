import type { Metadata } from 'next';
import { RelicSetsPanel } from '../_components/relic-sets-panel';

export const metadata: Metadata = {
  title: 'Artefactos | Administración | OmniGacha',
  description: 'Alta, edición, estado editorial y splash art de los sets de artefacto.',
};

export default function AdminArtifactsPage() {
  return <RelicSetsPanel type="ARTIFACT" />;
}
