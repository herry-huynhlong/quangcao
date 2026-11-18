'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api';

type Campaign = {
  id: string;
  name: string;
  objective: string;
  status: string;
  budget_type: 'DAILY' | 'LIFETIME';
  daily_budget: string | null;
  lifetime_budget: string | null;
  currency: string | null;
  updated_at: string;
  page_name: string | null;
  page_id: string | null;
};

const objectives: Record<string, string> = {
  OUTCOME_AWARENESS: 'Nhận diện',
  OUTCOME_TRAFFIC: 'Lưu lượng truy cập',
  OUTCOME_ENGAGEMENT: 'Tương tác',
  OUTCOME_LEADS: 'Khách hàng tiềm năng',
  OUTCOME_SALES: 'Doanh số',
};
const statuses: Record<string, string> = {
  DRAFT: 'Bản nháp QAVIO', PUBLISHING: 'Đang gửi Meta', META_PAUSED: 'Đã tạo trên Meta · tạm dừng',
  META_ACTIVE: 'Đã tạo trên Meta', META_REVIEW: 'Meta đang xét duyệt', META_SCHEDULED: 'Đã lên lịch',
  META_DELIVERING: 'Đang phân phối', META_COMPLETED: 'Hoàn tất', META_REJECTED: 'Meta từ chối',
  META_PARTIAL: 'Cần kiểm tra kết quả Meta', PAUSED: 'Đã tạm dừng', ERROR: 'Lỗi',
};
const money = (value: string | null) => value === null ? '—' : `${new Intl.NumberFormat('vi-VN').format(Number(value))} ₫`;

export default function Campaigns() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try { setItems(await api<Campaign[]>('/v1/campaigns')); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải chiến dịch.'); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function copy(item: Campaign) {
    setBusy(item.id); setError('');
    try {
      await api(`/v1/campaigns/${item.id}/copy`, { method: 'POST', body: '{}' });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể sao chép bản nháp.'); }
    finally { setBusy(''); }
  }

  async function remove(item: Campaign) {
    if (!window.confirm(`Xóa bản nháp “${item.name}”? Thao tác này không xóa quảng cáo đang chạy trên Meta.`)) return;
    setBusy(item.id); setError('');
    try { await api(`/v1/campaigns/${item.id}`, { method: 'DELETE' }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể xóa bản nháp.'); }
    finally { setBusy(''); }
  }

  return <main className="content">
    <p className="eyebrow">CHIẾN DỊCH</p>
    <div className="page-header"><div><h1 className="page-title">Chiến dịch của tôi</h1><p className="muted">Bản nháp được lưu trong QAVIO. Chỉ xác nhận phát hành mới gửi thao tác tới Meta.</p></div><Link className="button" href="/app/campaigns/new">Tạo chiến dịch</Link></div>
    {error && <section className="alert alert-error" role="alert">{error}</section>}
    {items.length === 0 ? <section className="card"><p className="muted">Chưa có chiến dịch. Bạn có thể tạo bản nháp trước khi kết nối Meta.</p><Link className="button" href="/app/campaigns/new">Tạo bản nháp</Link></section> : <section className="card" style={{ overflowX: 'auto' }}>
      <table><thead><tr><th>Tên chiến dịch</th><th>Mục tiêu</th><th>Trang</th><th>Ngân sách</th><th>Trạng thái</th><th>Cập nhật</th><th>Thao tác</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}>
        <td><Link href={`/app/campaigns/${item.id}`}>{item.name}</Link></td><td>{objectives[item.objective] ?? item.objective}</td><td>{item.page_name ?? 'Chưa chọn'}</td>
        <td>{item.budget_type === 'LIFETIME' ? `${money(item.lifetime_budget)} tổng` : `${money(item.daily_budget)} / ngày`}</td><td>{statuses[item.status] ?? item.status}</td>
        <td>{new Date(item.updated_at).toLocaleString('vi-VN')}</td><td><div className="page-actions"><Link className="button secondary" href={`/app/campaigns/${item.id}`}>Mở</Link>{item.status === 'DRAFT' && <><button className="button secondary" disabled={Boolean(busy)} onClick={() => void copy(item)}>Sao chép</button><button className="button secondary" disabled={Boolean(busy)} onClick={() => void remove(item)}>Xóa</button></>}</div></td>
      </tr>)}</tbody></table>
    </section>}
  </main>;
}
