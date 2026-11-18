'use client';

import { Suspense } from 'react';
import { CampaignEditor } from '../campaign-editor';

export default function NewCampaign() { return <Suspense fallback={<main className="content"><section className="card">Đang mở trình tạo chiến dịch…</section></main>}><CampaignEditor /></Suspense>; }
