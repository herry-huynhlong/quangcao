'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../lib/api';

type PageOption = { id: string; name: string; tasks: string[]; instagram: { id?: string; username?: string } | null; connected: boolean };
type PageRequest = { id: string; page_id: string; page_name: string | null; instagram_account_id: string | null; instagram_account_name: string | null; status: string; last_error: string | null; last_permission_check_at: string | null };
type PageOptions = { connected: boolean; managerReady: boolean; managerReason: string | null; reason: string | null; executionAdAccountConfigured: boolean; pages: PageOption[] };

const statusLabels: Record<string, string> = {
  CONNECTED: 'Đã kết nối', WAITING_FOR_PERMISSION: 'Đang chờ cấp quyền cho QAVIO',
  PENDING_VERIFICATION: 'Đang kiểm tra quyền', PERMISSION_DENIED: 'Chưa đủ quyền trên Trang',
  TOKEN_EXPIRED: 'Kết nối Facebook hết hạn', NOT_CONFIGURED: 'QAVIO cần hoàn tất cấu hình', ERROR: 'Chưa kiểm tra được quyền',
};

export default function MetaManager() {
  const [options, setOptions] = useState<PageOptions | null>(null);
  const [requests, setRequests] = useState<PageRequest[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [nextOptions, nextRequests] = await Promise.all([
        api<PageOptions>('/v1/meta/manager/page-options'),
        api<PageRequest[]>('/v1/meta/manager/page-requests'),
      ]);
      setOptions(nextOptions);
      setRequests(nextRequests);
      if (!selectedPageId && nextOptions.pages.length) setSelectedPageId(nextOptions.pages[0].id);
      setLoading(false);
    } catch (reason) {
      setLoading(false);
      setError(reason instanceof Error ? reason.message : 'Không thể tải trạng thái kết nối.');
    }
  }, [selectedPageId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVisible);
    const params = new URLSearchParams(window.location.search);
    const oauthMessage = params.get('oauth') === 'success' ? 'Đã kết nối Facebook. Chọn Trang bạn muốn dùng cho quảng cáo.' : params.get('oauth') === 'error' || params.get('oauth') === 'denied' ? 'Facebook chưa hoàn tất cấp quyền. Bạn có thể thử lại; thông tin hiện có vẫn được giữ.' : '';
    const oauthTimer = oauthMessage ? window.setTimeout(() => params.get('oauth') === 'success' ? setNotice(oauthMessage) : setError(oauthMessage), 0) : null;
    return () => { window.clearTimeout(initialLoad); if (oauthTimer) window.clearTimeout(oauthTimer); window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  async function connectFacebook() {
    setBusy(true); setError('');
    try {
      const result = await api<{ authorizationUrl: string }>('/v1/meta/manager/pages/oauth/start');
      window.location.assign(result.authorizationUrl);
    } catch (reason) { setBusy(false); setError(reason instanceof Error ? reason.message : 'Không thể mở Facebook.'); }
  }

  async function linkPage() {
    if (!selectedPageId) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api<{ connected: boolean; reason?: string }>('/v1/meta/manager/page-requests', { method: 'POST', body: JSON.stringify({ pageId: selectedPageId }) });
      if (result.connected) setNotice('QAVIO đã xác nhận quyền trên Trang. Bạn có thể tiếp tục tạo bản nháp chiến dịch.');
      else setNotice(result.reason ?? 'Trang chưa đủ điều kiện; hãy xem hướng dẫn bên dưới.');
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể xác minh Trang.'); }
    finally { setBusy(false); }
  }

  async function retry(id: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api<{ connected: boolean; reason?: string }>(`/v1/meta/manager/page-requests/${id}/check`, { method: 'POST', body: '{}' });
      setNotice(result.connected ? 'Quyền Trang đã có hiệu lực.' : result.reason ?? 'Quyền chưa sẵn sàng.');
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể kiểm tra quyền.'); }
    finally { setBusy(false); }
  }

  const connected = requests.filter((item) => item.status === 'CONNECTED');
  const canLink = Boolean(options?.connected && options.managerReady && selectedPageId);

  return <main className="content">
    <p className="eyebrow">FACEBOOK &amp; INSTAGRAM ADS</p>
    <h1 className="page-title">Kết nối Trang Facebook</h1>
    <p className="muted">Kết nối Facebook một lần để chứng minh Trang thuộc quyền sử dụng của bạn. QAVIO kiểm tra riêng quyền của tài khoản quản lý trước khi mở chiến dịch.</p>

    {error && <section className="alert alert-error" role="alert" style={{ marginTop: 16 }}>{error}</section>}
    {notice && <section className="alert alert-success" role="status" style={{ marginTop: 16 }}>{notice}</section>}

    <section className="card form" style={{ marginTop: 16 }}>
      <h2>1. Kết nối Facebook của bạn</h2>
      <p className="muted">QAVIO không nhận mật khẩu. Meta trả về danh sách Trang và quyền mà tài khoản Facebook của bạn hiện có.</p>
      {options?.connected ? <p className="success">Facebook đã kết nối. Chọn Trang ở bước tiếp theo.</p> : <button className="button" type="button" disabled={busy} onClick={() => void connectFacebook()}>{busy ? 'Đang mở Facebook…' : 'Kết nối Facebook để chọn Trang'}</button>}
      {options?.reason && <p className="field-help">{options.reason}</p>}
      {options && !options.managerReady && <p className="notice">{options.managerReason ?? 'Tài khoản quản lý QAVIO chưa sẵn sàng.'} QAVIO cần hoàn tất quyền quản lý trước khi xác nhận Trang.</p>}
    </section>

    <section className="card form" style={{ marginTop: 16 }}>
      <h2>2. Chọn Trang để dùng quảng cáo</h2>
      {!options?.connected ? <p className="muted">Sau khi kết nối Facebook, các Trang bạn có quyền sẽ hiện ở đây.</p> : options.pages.length === 0 ? <p className="muted">Meta chưa trả Trang nào cho tài khoản này. Kiểm tra quyền Trang trong Facebook rồi tải lại.</p> : <>
        <label>Trang Facebook<select value={selectedPageId} onChange={(event) => setSelectedPageId(event.target.value)}><option value="">Chọn Trang</option>{options.pages.map((page) => <option key={page.id} value={page.id}>{page.name}{page.connected ? ' · Đã liên kết' : ''}</option>)}</select></label>
        {selectedPageId && (() => { const page = options.pages.find((item) => item.id === selectedPageId); return page ? <p className="field-help">Quyền tài khoản bạn: {page.tasks.length ? page.tasks.join(', ') : 'Meta chưa trả quyền chi tiết'}{page.instagram?.username ? ` · Instagram @${page.instagram.username}` : ''}</p> : null; })()}
        <div className="page-actions"><button className="button" type="button" disabled={!canLink || busy} onClick={() => void linkPage()}>{busy ? 'Đang kiểm tra quyền…' : 'Xác minh và liên kết Trang'}</button><button className="button secondary" type="button" disabled={busy} onClick={() => void load()}>Tải lại danh sách</button></div>
      </>}
      <div className="notice" style={{ marginTop: 16 }}><b>Quyền cần có:</b> bạn có quyền quảng cáo/quản lý Trang, và tài khoản quản lý Facebook QAVIO cũng có quyền quảng cáo trên cùng Trang. Quyền Trang không thay thế quyền trên Ad Account vận hành.</div>
      {options && !options.executionAdAccountConfigured && <p className="notice">QAVIO chưa chọn Ad Account vận hành. Trang có thể được xác minh, nhưng chưa thể gửi chiến dịch sang Meta.</p>}
    </section>

    <section className="card" style={{ marginTop: 16 }}>
      <div className="page-header"><div><h2>3. Trang đã liên kết</h2><p className="muted">Danh sách này chỉ gồm Trang đã được Meta xác minh cho bạn và QAVIO.</p></div><button className="button secondary" type="button" disabled={busy} onClick={() => void load()}>Tải lại trạng thái</button></div>
      {loading ? <p className="muted">Đang tải…</p> : connected.length === 0 ? <p className="muted">Chưa có Trang nào được xác minh.</p> : connected.map((item) => <article className="status-row" key={item.id}><span><b>{item.page_name ?? 'Trang Facebook'}</b>{item.instagram_account_name && <><br /><small>Instagram @{item.instagram_account_name}</small></>}<br /><small>Quyền đã xác minh · {item.last_permission_check_at ? new Date(item.last_permission_check_at).toLocaleString('vi-VN') : ''}</small></span><span className="page-actions"><b className="success">Đã kết nối</b><Link className="button" href={`/app/campaigns/new?page=${encodeURIComponent(item.page_id)}`}>Tạo chiến dịch</Link></span></article>)}
    </section>

    {requests.some((item) => item.status !== 'CONNECTED') && <section className="card" style={{ marginTop: 16 }}><h2>Trang cần xử lý</h2>{requests.filter((item) => item.status !== 'CONNECTED').map((item) => <article className="status-row" key={item.id}><span><b>{item.page_name ?? 'Trang Facebook'}</b><br /><small>{item.last_error ?? 'QAVIO chưa xác nhận đủ quyền.'}</small></span><span className="page-actions"><b>{statusLabels[item.status] ?? 'Đang kiểm tra'}</b><button className="button secondary" type="button" disabled={busy} onClick={() => void retry(item.id)}>Kiểm tra lại</button></span></article>)}</section>}

    <p className="muted" style={{ marginTop: 16 }}>Bạn có thể tạo và lưu bản nháp kể cả khi chưa kết nối Meta. <Link href="/app/campaigns">Mở Chiến dịch</Link> · <Link href="/app/reports">Xem báo cáo</Link></p>
  </main>;
}
