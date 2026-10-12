import type { Metadata } from 'next';
import { UsersPanel } from './_components/users-panel';
import { getAdminBackdropClassName, getAdminShellClassName } from '../_components/admin-layout';

export const metadata: Metadata = {
  title: 'Usuarios | Administración | OmniGacha',
  description: 'Alta, edición, activación y control de rol de usuarios del backoffice.',
};

export default function AdminUsersPage() {
  return (
    <main className={getAdminShellClassName('wide')}>
      <div className={getAdminBackdropClassName('hero')} />
      <UsersPanel />
    </main>
  );
}
