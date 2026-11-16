'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';

type Request = {
  id: string; ad_account_id: string | null; ad_account_name: string | null; page_name: string;
  objective: string; daily_budget: string; currency: string; starts_at: string | null;
  ends_at: string | null; ad_text: string; destination_url: string | null;
  media_url: string | null; customer_note: string | null; status: string; admin_note: string | null; created_at: string;
};
const objectives = [['OUTCOME_AWARENESS','Nhận diện'],['OUTCOME_TRAFFIC','Lưu lượng truy cập'],['OUTCOME_ENGAGEMENT','Tương tác'],['OUTCOME_LEADS','Khách hàng tiềm năng'],['OUTCOME_SALES','Doanh số']];
const labels: Record<string,string> = { SUBMITTED:'Đã gửi cho QAVIO', ACCESS_PENDING:'Đang chờ cấp quyền trên Facebook', READY:'Đã đủ quyền, chờ thiết lập', IN_PROGRESS:'QAVIO đang thiết lập', NEEDS_INFO:'QAVIO cần thêm thông tin', COMPLETED:'Đã hoàn tất', REJECTED:'Không thể tiếp nhận' };
const empty = { adAccountId:'', adAccountName:'', pageName:'', objective:'OUTCOME_TRAFFIC', dailyBudget:'', startsAt:'', endsAt:'', adText:'', destinationUrl:'', mediaUrl:'', customerNote:'' };

export default function MetaManager() {
  const [items,setItems] = useState<Request[]>([]); const [form,setForm] = useState(empty);
  const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [notice,setNotice] = useState('');
  async function load() { try { setItems(await api<Request[]>('/v1/campaigns/service-requests')); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải yêu cầu.'); } }
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);
  function set<K extends keyof typeof empty>(key: K, value: string) { setForm(old => ({...old,[key]:value})); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await api('/v1/campaigns/service-requests',{method:'POST',body:JSON.stringify({...form,dailyBudget:Number(form.dailyBudget),startsAt:form.startsAt?new Date(form.startsAt).toISOString():undefined,endsAt:form.endsAt?new Date(form.endsAt).toISOString():undefined,destinationUrl:form.destinationUrl||undefined,mediaUrl:form.mediaUrl||undefined,customerNote:form.customerNote||undefined})});
      setForm(empty); setNotice('Đã gửi yêu cầu cho QAVIO. Bạn có thể theo dõi tiến độ bên dưới.'); await load();
    } catch(e) { setError(e instanceof Error?e.message:'Không thể gửi yêu cầu.'); } finally { setBusy(false); }
  }
  return <main className="content"><p className="eyebrow">FACEBOOK &amp; INSTAGRAM ADS</p><h1 className="page-title">Gửi yêu cầu thiết lập quảng cáo</h1>
    <section className="notice">Bạn gửi thông tin tài khoản và nội dung quảng cáo tại đây. QAVIO sẽ kiểm tra lời mời/cấp quyền trên Facebook, sau đó tự thiết lập quảng cáo giúp bạn. Trang này không cần System User token hay Facebook OAuth của khách hàng. Chỉ chạy quảng cáo sau khi quyền và ngân sách được xác nhận.</section>
    {error&&<section className="alert alert-error" style={{marginTop:16}}>{error}</section>}{notice&&<section className="alert alert-success" style={{marginTop:16}}>{notice}</section>}
    <form className="card form" style={{marginTop:16}} onSubmit={submit}><h2>Thông tin tài khoản và chiến dịch</h2>
      <div className="grid two"><label>Ad Account ID<input inputMode="numeric" value={form.adAccountId} onChange={e=>set('adAccountId',e.target.value)} placeholder="Không bắt buộc nếu nhập tên" /></label><label>Tên tài khoản quảng cáo<input value={form.adAccountName} onChange={e=>set('adAccountName',e.target.value)} placeholder="Cần ID hoặc tên tài khoản" /></label></div><p className="field-help">Có thể gửi ID hoặc tên tài khoản; gửi cả hai giúp QAVIO xác định nhanh và chính xác hơn.</p>
      <label>Tên Trang Facebook cần quảng cáo<input required value={form.pageName} onChange={e=>set('pageName',e.target.value)} placeholder="Tên Trang Facebook" /></label>
      <div className="grid two"><label>Mục tiêu<select value={form.objective} onChange={e=>set('objective',e.target.value)}>{objectives.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Ngân sách tối đa mỗi ngày (VND)<input required type="number" min="1" step="1000" value={form.dailyBudget} onChange={e=>set('dailyBudget',e.target.value)} placeholder="Ví dụ: 200000" /></label></div>
      <div className="grid two"><label>Ngày bắt đầu<input type="datetime-local" value={form.startsAt} onChange={e=>set('startsAt',e.target.value)} /></label><label>Ngày kết thúc<input type="datetime-local" value={form.endsAt} onChange={e=>set('endsAt',e.target.value)} /></label></div>
      <label>Nội dung quảng cáo<textarea required value={form.adText} onChange={e=>set('adText',e.target.value)} rows={5} placeholder="Mô tả sản phẩm/dịch vụ và nội dung muốn quảng cáo" /></label>
      <label>Liên kết đích (nếu có)<input type="url" value={form.destinationUrl} onChange={e=>set('destinationUrl',e.target.value)} placeholder="https://..." /></label>
      <label>Liên kết ảnh/video quảng cáo (nếu có)<input type="url" value={form.mediaUrl} onChange={e=>set('mediaUrl',e.target.value)} placeholder="Link tải hoặc xem file" /></label>
      <label>Ghi chú thêm<textarea value={form.customerNote} onChange={e=>set('customerNote',e.target.value)} rows={3} placeholder="Đối tượng khách hàng, khu vực, lưu ý về hình ảnh/video..." /></label>
      <button className="button" disabled={busy}>{busy?'Đang gửi…':'Gửi yêu cầu cho QAVIO'}</button>
    </form>
    <section className="card" style={{marginTop:16}}><div className="page-header"><h2>Yêu cầu của bạn</h2><button className="button secondary" type="button" onClick={()=>void load()}>Tải lại trạng thái</button></div>{!items.length?<p className="muted">Bạn chưa gửi yêu cầu nào.</p>:items.map(item=><article className="status-row" key={item.id}><span><b>{item.ad_account_name||'Tài khoản quảng cáo'}</b><br/><small>{item.ad_account_id?`Ad Account ${item.ad_account_id} · `:''}Trang {item.page_name} · Ngân sách/ngày {Number(item.daily_budget).toLocaleString('vi-VN')} {item.currency} · {new Date(item.created_at).toLocaleString('vi-VN')}</small>{item.admin_note&&<><br/><small>Phản hồi QAVIO: {item.admin_note}</small></>}</span><b>{labels[item.status]??item.status}</b></article>)}</section>
    <p className="muted">Bạn cũng có thể tự soạn trước nội dung trong <Link href="/app/campaigns">Bản nháp chiến dịch</Link>.</p>
  </main>;
}
