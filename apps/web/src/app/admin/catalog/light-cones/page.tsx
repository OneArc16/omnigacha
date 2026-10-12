import type { Metadata } from 'next';
import { LightConesPanel } from './_components/light-cones-panel';
import {
  getAdminBackdropClassName,
  getAdminShellClassName,
} from '../../_components/admin-layout';

export const metadata: Metadata = {
  title: 'Conos de luz | Administración | OmniGacha',
  description:
    'Alta, edición, estado editorial y splash art de los conos de luz del catálogo.',
};

export default function AdminLightConesPage() {
  return (
    <main className={getAdminShellClassName('wide')}>
      <div className={getAdminBackdropClassName('hero')} />
      <LightConesPanel />
    </main>
  );
}
