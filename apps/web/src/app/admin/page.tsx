import type { Metadata } from 'next';
import { AdminDashboardClient } from './_components/admin-dashboard-client';

export const metadata: Metadata = {
  title: 'Administración | OmniGacha',
  description:
    'Panel administrativo para usuarios, personajes, conos de luz y relic sets.',
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
