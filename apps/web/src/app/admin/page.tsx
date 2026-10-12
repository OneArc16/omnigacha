import type { Metadata } from 'next';
import { AdminDashboard } from './_components/admin-dashboard';

export const metadata: Metadata = {
  title: 'Administración | OmniGacha',
  description: 'Panel administrativo para usuarios, personajes, conos de luz y relic sets.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
