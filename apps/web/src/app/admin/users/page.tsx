import type { Metadata } from 'next';
import { UsersPanel } from './_components/users-panel';

export const metadata: Metadata = {
  title: 'Usuarios | Administración | OmniGacha',
  description: 'Alta, edición, activación y control de rol de usuarios del backoffice.',
};

export default function AdminUsersPage() {
  return <UsersPanel />;
}
