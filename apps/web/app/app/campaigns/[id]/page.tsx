'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { CampaignEditor } from '../campaign-editor';

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  return <Suspense fallback={<main className="content"><section className="card">Đang tải chiến dịch…</section></main>}><CampaignEditor initialCampaignId={id} /></Suspense>;
}
