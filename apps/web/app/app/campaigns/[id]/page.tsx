'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';

type Campaign = { id: string; name: string; objective: string; status: string; daily_budget: string | null; configuration: Record<string, unknown>; last_error: string | null };

export default function Campaign() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null); const [name, setName] = useState(''); const [budget, setBudget] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function load() { try { const value = await api<Campaign>(`/v1/campaigns/${id}`); setCampaign(value); setName(value.name); setBudget(value.daily_budget ?? ''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải bản nháp.'); } }
  useEffect(() => { void load(); }, [id]);
  async function save() { setBusy(true); setError(''); try { const value = await api<Campaign>(`/v1/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify({ name, dailyBudget: budget ? Number(budget) : undefined }) }); setCampaign(value); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu thay đổi.'); } finally { setBusy(false); } }
  async function copy() { setBusy(true); try { const value = await api<{ id: string }>(`/v1/campaigns/${id}/copy`, { method: 'POST' }); router.push(`/app/campaigns/${value.id}`); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể sao chép bản nháp.'); } finally { setBusy(false); } }
  async function remove() { if (!window.confirm('Xóa bản nháp này? Thao tác không ảnh hưởng chiến dịch Meta.')) return; setBusy(true); try { await api(`/v1/campaigns/${id}`, { method: 'DELETE' }); router.push('/app/campaigns'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể xóa bản nháp.'); } finally { setBusy(false); } }
  return <main className="content"><p className="eyebrow">CHIẾN DỊCH / BẢN NHÁP</p><h1 className="page-title">{campaign?.name ?? 'Đang tải…'}</h1>{error && <p className="error">{error}</p>}{campaign && <section className="card"><label>Tên chiến dịch<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Ngân sách hằng ngày<input type="number" min="1" value={budget} onChange={(event) => setBudget(event.target.value)} /></label><p>Mục tiêu: <b>{campaign.objective}</b></p><p>Trạng thái: <b>{campaign.status === 'DRAFT' ? 'Bản nháp QAVIO' : campaign.status}</b></p><p className="notice">Bản nháp chưa được gửi lên Meta. Không thể phát sinh chi phí từ trang này.</p><p className="page-actions"><Link className="button secondary" href="/app/campaigns">Quay lại</Link><button className="button secondary" disabled={busy} onClick={() => void copy()}>Sao chép</button><button className="button secondary" disabled={busy} onClick={() => void remove()}>Xóa</button><button className="button" disabled={busy} onClick={() => void save()}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></p></section>}</main>;
}
