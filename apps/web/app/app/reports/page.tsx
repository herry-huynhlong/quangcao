'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';

type Insight = { date_start?: string; date_stop?: string; spend?: string; impressions?: string; reach?: string; clicks?: string; ctr?: string; cpc?: string; cpm?: string; actions?: { action_type: string; value: string }[] };
type ReportItem = { id: string; name: string; status: string; objective: string; executionAdAccountId: string | null; metaCampaignId: string | null; insights: Insight[]; unavailable: boolean; error?: string; lastSyncedAt: string | null };
type ReportsResponse = { items: ReportItem[] };
const fmt = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);

export default function Reports() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [since, setSince] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 6); return date.toISOString().slice(0, 10); });
  const [until, setUntil] = useState(() => new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await api<ReportsResponse>(`/v1/campaigns/reports?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`); setItems(result.items); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải báo cáo Meta.'); }
    finally { setLoading(false); }
  }, [since, until]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const accounts = useMemo(() => [...new Set(items.map((item) => item.executionAdAccountId).filter((id): id is string => Boolean(id)))], [items]);
  const filtered = items.filter((item) => account === 'ALL' || item.executionAdAccountId === account);
  const metricRows = filtered.flatMap((item) => item.insights.map((row) => ({ ...row, campaignName: item.name })));
  const total = metricRows.reduce((sum, row) => ({ spend: sum.spend + (Number(row.spend) || 0), impressions: sum.impressions + (Number(row.impressions) || 0), reach: sum.reach + (Number(row.reach) || 0), clicks: sum.clicks + (Number(row.clicks) || 0) }), { spend: 0, impressions: 0, reach: 0, clicks: 0 });
  const byDay = new Map<string, number>();
  for (const row of metricRows) if (row.date_start) byDay.set(row.date_start, (byDay.get(row.date_start) ?? 0) + (Number(row.spend) || 0));
  const maxDailySpend = Math.max(1, ...byDay.values());

  return <main className="content">
    <p className="eyebrow">BÁO CÁO META</p>
    <div className="page-header"><div><h1 className="page-title">Hiệu quả quảng cáo</h1><p className="muted">Chỉ số được tải từ Meta Insights. Bản nháp và chiến dịch chưa có dữ liệu sẽ không tạo số liệu thay thế.</p></div><button className="button secondary" disabled={loading} onClick={() => void load()}>{loading ? 'Đang đồng bộ…' : 'Tải lại báo cáo'}</button></div>
    {error && <section className="alert alert-error" role="alert">{error}</section>}
    <section className="card" style={{ marginTop: 16 }}><div className="filters"><label>Tài khoản quảng cáo<select value={account} onChange={(event) => setAccount(event.target.value)}><option value="ALL">Tất cả tài khoản QAVIO</option>{accounts.map((id) => <option key={id} value={id}>{id}</option>)}</select></label><label>Từ ngày<input type="date" value={since} onChange={(event) => setSince(event.target.value)} /></label><label>Đến ngày<input type="date" value={until} onChange={(event) => setUntil(event.target.value)} /></label></div></section>
    {loading ? <section className="card" style={{ marginTop: 16 }}><p className="muted">Đang lấy dữ liệu từ Meta…</p></section> : filtered.length === 0 ? <section className="card empty-state" style={{ marginTop: 16 }}><h2>Chưa có chiến dịch</h2><p>Tạo bản nháp trước hoặc kết nối Page và gửi chiến dịch lên Meta.</p><Link className="button" href="/app/campaigns">Mở Chiến dịch</Link></section> : metricRows.length === 0 ? <section className="card empty-state" style={{ marginTop: 16 }}><h2>Chưa có dữ liệu Meta Insights</h2><p>Meta chưa trả số liệu cho khoảng thời gian này, hoặc các chiến dịch hiện có vẫn là bản nháp. QAVIO không hiển thị số liệu giả.</p><Link className="button" href="/app/campaigns">Mở Chiến dịch</Link></section> : <>
      <div className="grid four" style={{ marginTop: 16 }}><section className="card"><span className="muted">Chi tiêu Meta</span><h2>{fmt(total.spend)} ₫</h2></section><section className="card"><span className="muted">Lượt hiển thị</span><h2>{fmt(total.impressions)}</h2></section><section className="card"><span className="muted">Tiếp cận</span><h2>{fmt(total.reach)}</h2></section><section className="card"><span className="muted">Clicks · CTR</span><h2>{fmt(total.clicks)} · {total.impressions ? (total.clicks / total.impressions * 100).toFixed(2) : '0.00'}%</h2></section></div>
      <section className="card" style={{ marginTop: 16 }}><h2>Chi tiêu theo ngày</h2><div className="grid" style={{ gap: 10 }}>{[...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, spend]) => <div key={day} className="status-row"><span>{day}</span><div style={{ flex: 1, height: 12, background: '#edf1f7', borderRadius: 10, overflow: 'hidden' }}><div style={{ width: `${Math.max(2, spend / maxDailySpend * 100)}%`, height: '100%', background: '#d4a13e' }} /></div><b>{fmt(spend)} ₫</b></div>)}</div></section>
      <section className="card" style={{ marginTop: 16 }}><h2>Chiến dịch</h2><div className="table-scroll"><table><thead><tr><th>Tên</th><th>Meta status</th><th>Chi tiêu</th><th>Impressions</th><th>Reach</th><th>Clicks</th><th>CTR</th><th>CPC</th><th>CPM</th></tr></thead><tbody>{filtered.map((item) => { const rows = item.insights; const spend = rows.reduce((sum, row) => sum + (Number(row.spend) || 0), 0); const impressions = rows.reduce((sum, row) => sum + (Number(row.impressions) || 0), 0); const reach = rows.reduce((sum, row) => sum + (Number(row.reach) || 0), 0); const clicks = rows.reduce((sum, row) => sum + (Number(row.clicks) || 0), 0); return <tr key={item.id}><td><Link href={`/app/campaigns/${item.id}`}>{item.name}</Link><br /><small>{item.metaCampaignId ? `Campaign ${item.metaCampaignId}` : 'Chưa gửi Meta'}</small></td><td>{item.status}</td><td>{rows.length ? `${fmt(spend)} ₫` : '—'}</td><td>{rows.length ? fmt(impressions) : '—'}</td><td>{rows.length ? fmt(reach) : '—'}</td><td>{rows.length ? fmt(clicks) : '—'}</td><td>{impressions ? `${(clicks / impressions * 100).toFixed(2)}%` : '—'}</td><td>{clicks ? `${fmt(spend / clicks)} ₫` : '—'}</td><td>{impressions ? `${fmt(spend / impressions * 1000)} ₫` : '—'}</td></tr>; })}</tbody></table></div>
      </section>
    </>}
    {filtered.some((item) => item.unavailable && item.error) && <section className="notice" style={{ marginTop: 16 }}>{filtered.filter((item) => item.unavailable && item.error).length} chiến dịch chưa lấy được Insights: {filtered.find((item) => item.unavailable && item.error)?.error}</section>}
  </main>;
}
