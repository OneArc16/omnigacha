import type { Metadata } from 'next';
import { RelicSetsPanel } from '../_components/relic-sets-panel';

export const metadata: Metadata = {
  title: 'Ornamentos | Administración | OmniGacha',
  description: 'Alta, edición, estado editorial y splash art de los sets de ornamento planar.',
};

export default function AdminOrnamentsPage() {
  return <RelicSetsPanel type="ORNAMENT" />;
}
