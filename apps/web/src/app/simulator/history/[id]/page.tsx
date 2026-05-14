import { HistoryDetailClient } from '../../_components/history-detail-client';
import { notFound } from 'next/navigation';

type SimulationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SimulationDetailPage({
  params,
}: SimulationDetailPageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  if (!Number.isFinite(id) || id < 1) {
    notFound();
  }

  return <HistoryDetailClient kind="simulation" id={id} />;
}
