import type { Metadata } from 'next';
import { CharactersPanel } from './_components/characters-panel';
import {
  getAdminBackdropClassName,
  getAdminShellClassName,
} from '../../_components/admin-layout';

export const metadata: Metadata = {
  title: 'Personajes | Administración | OmniGacha',
  description:
    'Alta, edición, estado editorial y splash art de los personajes del catálogo.',
};

export default function AdminCharactersPage() {
  return (
    <main className={getAdminShellClassName('wide')}>
      <div className={getAdminBackdropClassName('hero')} />
      <CharactersPanel />
    </main>
  );
}
