import { HistoryDetailClient } from '../../_components/history-detail-client';
import { notFound } from 'next/navigation';

type RecommendationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecommendationDetailPage({
  params,
}: RecommendationDetailPageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  if (!Number.isFinite(id) || id < 1) {
    notFound();
  }

  return <HistoryDetailClient kind="recommendation" id={id} />;
}
