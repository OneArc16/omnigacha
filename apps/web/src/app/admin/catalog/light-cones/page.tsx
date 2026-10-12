import type { Metadata } from 'next';
import { LightConesPanel } from './_components/light-cones-panel';

export const metadata: Metadata = {
  title: 'Conos de luz | Administración | OmniGacha',
  description: 'Alta, edición, estado editorial y splash art de los conos de luz.',
};

export default function AdminLightConesPage() {
  return <LightConesPanel />;
}
