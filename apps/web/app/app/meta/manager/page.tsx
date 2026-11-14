'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../../../../lib/api';

type Config = { ready: boolean; adminName: string | null; reason: string | null };
type Item = { id: string; ad_account_id: string; ad_account_name: string | null; status: string; last_error: string | null };

const labels: Record<string, string> = {
  PENDING_VERIFICATION: 'Đang kiểm tra quyền',
  NEEDS_USER_OAUTH: 'Cần xác nhận chủ thể',
  CONNECTED: 'Đã kết nối',
  FAILED: 'Không thể xác minh',
  ACCESS_REVOKED: 'Quyền đã bị thu hồi',
};

const steps = [
  ['Bước 1 — Mở Trang Facebook', 'Mở Facebook, nhấn ảnh đại diện góc phải và chuyển sang Trang Facebook bạn muốn quảng cáo.', '/help/meta-manager/step-01-select-page.webp', 'Chọn Trang Facebook cần cấp quyền'],
  ['Bước 2 — Mở quyền truy cập Trang', 'Vào Cài đặt & quyền riêng tư → Cài đặt → Quyền truy cập Trang. Chọn Thêm mới.', '/help/meta-manager/step-02-page-access.webp', 'Trang quản lý và xem quyền truy cập'],
  ['Bước 3 — Thêm tài khoản quản lý', 'Chọn Thêm mới → Tiếp, dán tên QAVIO đã sao chép, chọn đúng tài khoản và bật quyền Quảng cáo. Không cần bật Toàn quyền kiểm soát.', '/help/meta-manager/step-03-grant-access.webp', 'Cửa sổ cấp quyền quảng cáo'],
] as const;

export default function MetaManager() {
  const [config, setConfig] = useState<Config | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [configResult, requestsResult] = await Promise.allSettled([
      api<Config>('/v1/meta/manager/config'),
      api<Item[]>('/v1/meta/manager/requests'),
    ]);
    const errors: string[] = [];
    if (configResult.status === 'fulfilled') setConfig(configResult.value);
    else errors.push(configResult.reason instanceof Error ? configResult.reason.message : 'Không thể tải thông tin tài khoản quản lý.');
    if (requestsResult.status === 'fulfilled') setItems(requestsResult.value);
    else errors.push(requestsResult.reason instanceof Error ? requestsResult.reason.message : 'Không thể tải trạng thái liên kết.');
    setError(errors.join(' '));
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  async function copy() {
    if (config?.adminName) await navigator.clipboard?.writeText(config.adminName);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const form = new FormData(event.currentTarget);
      await api('/v1/meta/manager/requests', { method: 'POST', body: JSON.stringify({ adAccountId: form.get('adAccountId') }) });
      setReveal(false);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi yêu cầu kiểm tra.');
    } finally {
      setBusy(false);
    }
  }

  async function checkNow(id: string) {
    setCheckingId(id);
    setError('');
    try {
      await api(`/v1/meta/manager/requests/${id}/check`, { method: 'POST' });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể kiểm tra quyền lúc này.');
      await load();
    } finally {
      setCheckingId(null);
    }
  }

  async function refreshConnection() {
    setBusy(true);
    setError('');
    try {
      await api('/v1/meta/manager/refresh', { method: 'POST' });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải lại trạng thái kết nối.');
    } finally {
      setBusy(false);
    }
  }

  const connected = items.filter((item) => item.status === 'CONNECTED');
  const pending = items.filter((item) => item.status !== 'CONNECTED');
  const canAddRequest = !pending.some((item) => item.status === 'PENDING_VERIFICATION');

  return <main className="content meta-manager">
    <p className="eyebrow">META ADS</p>
    <h1 className="page-title">Hướng dẫn cấp quyền quản lý quảng cáo</h1>
    <p className="muted">Sau khi Facebook cấp quyền, bấm kiểm tra ngay. QAVIO chỉ tự liên kết khi đồng thời xác minh được quyền của Facebook Admin và chủ thể USER.</p>

    {error && <section className="alert alert-error">{error} <button className="button secondary" onClick={() => void load()}>Thử lại</button></section>}

    <section className="card manager-account">
      <p className="eyebrow">TÀI KHOẢN QUẢN LÝ QAVIO</p>
      <div className="manager-account-row">
        <span className="manager-avatar">Q</span>
        <div><b>{config?.adminName ?? 'Thông tin tài khoản quản lý đang được tải'}</b><p className="muted">Tên tìm kiếm được lấy từ Facebook OAuth của QAVIO.</p></div>
        <button className="button secondary" disabled={!config?.ready} onClick={() => void copy()}>Sao chép</button>
      </div>
      {config && !config.ready && <p className="warning">{config.reason}</p>}
      {!config && <p className="muted">Hướng dẫn cấp quyền vẫn dùng được trong khi hệ thống tải trạng thái.</p>}
    </section>

    <section className="card manager-guide" style={{ marginTop: 16 }}>
      <h2>Thực hiện trên Facebook</h2>
      <div className="guide-grid">{steps.map(([title, description, src, alt]) => <article key={title}><h3>{title}</h3><p className="muted">{description}</p><a href={src} target="_blank" rel="noreferrer"><img src={src} alt={alt} /><small>Nhấn vào ảnh để phóng to</small></a></article>)}</div>
      <p className="notice">Quyền Quảng cáo trên Trang không thay thế quyền cho Ad Account. Khi cần, hãy cấp quyền quản lý quảng cáo cho cùng tài khoản QAVIO trong phần phân quyền Ad Account của Meta.</p>
    </section>

    <section className="card" style={{ marginTop: 16 }}>
      <h2>Kiểm tra và liên kết</h2>
      <p className="muted">Bấm tải lại sau khi Facebook xác nhận lời mời. QAVIO kiểm tra quyền Trang và Ad Account thực tế, sau đó cập nhật ngay danh sách bên dưới.</p>
      <button className="button secondary" disabled={busy} onClick={() => void refreshConnection()}>{busy ? 'Đang tải lại…' : 'Tải lại trạng thái kết nối'}</button>
      {canAddRequest && !reveal && <button className="button" disabled={!config?.ready} onClick={() => setReveal(true)}>Tôi đã cấp quyền — Khai báo Ad Account</button>}
      {reveal && <form className="form" onSubmit={submit}><label>Ad Account ID đã cấp quyền<input name="adAccountId" required inputMode="numeric" placeholder="Ví dụ: 123456789" /></label><button className="button" disabled={busy}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}</button></form>}
      {pending.map((item) => <div className="status-row" key={item.id}>
        <span><b>Ad Account {item.ad_account_id}</b>{item.last_error && <><br /><small>{item.last_error}</small></>}{item.status === 'NEEDS_USER_OAUTH' && <><br /><small>QAVIO chưa có bằng chứng liên kết tài khoản này với USER hiện tại. Không thể tự gán tài sản chỉ từ Account ID.</small></>}</span>
        <b>{labels[item.status] ?? item.status}</b>
        <button className="button secondary" disabled={checkingId === item.id} onClick={() => void checkNow(item.id)}>{checkingId === item.id ? 'Đang kiểm tra…' : 'Kiểm tra ngay'}</button>
      </div>)}
    </section>

    <section className="card" style={{ marginTop: 16 }}>
      <h2>Tài khoản quảng cáo đã kết nối</h2>
      {connected.length ? connected.map((item) => <div className="status-row" key={item.id}><span><b>{item.ad_account_name ?? 'Tài khoản quảng cáo'}</b><br /><small>Ad Account {item.ad_account_id} · đã xác minh quyền sử dụng</small></span><b className="ok">Đã kết nối</b><Link className="button" href="/app/campaigns/new">Tạo chiến dịch</Link></div>) : <p className="muted">Chưa có tài khoản nào được kết nối hợp lệ.</p>}
    </section>
    <p className="muted"><Link href="/app/meta/partner">Dùng Business Partner (tùy chọn)</Link></p>
  </main>;
}
