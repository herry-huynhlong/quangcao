'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';

type Asset = { id: string; asset_name: string | null; external_asset_id: string };
type AudienceItem = { id: string; name: string; type?: string | null; countryCode?: string | null; region?: string | null };
type BudgetQuote = { currency: string; days: number; mediaBudget: number; feePercent: number; feeAmount: number; totalRequired: number; availableAmount: number; sufficientBalance: boolean };
type Campaign = { id: string; name: string; objective: string; status: string; budget_type: 'DAILY'|'LIFETIME'; daily_budget: string | null; lifetime_budget: string | null; starts_at: string | null; ends_at: string | null; page_asset_id: string | null; configuration: Record<string, any>; last_error: string | null; meta_campaign_id: string | null; meta_adset_id: string | null; meta_creative_id: string | null; meta_ad_id: string | null; meta_status: string | null; meta_effective_status: string | null; reserved_total_amount: string | null; fee_amount: string | null; meta_spend_amount: string | null };
type Form = { name: string; objective: string; pageAssetId: string; budgetType: 'DAILY'|'LIFETIME'; amount: string; startsAt: string; endsAt: string; ageMin: string; ageMax: string; gender: string; countries: string; platforms: string[]; interests: AudienceItem[]; regions: AudienceItem[]; cities: AudienceItem[]; instagramAccountId: string; primaryText: string; headline: string; description: string; destination: string; mediaUrl: string; existingPostId: string; cta: string; specialCategory: string };
const defaults: Form = { name: '', objective: 'OUTCOME_TRAFFIC', pageAssetId: '', budgetType: 'DAILY', amount: '', startsAt: '', endsAt: '', ageMin: '18', ageMax: '65', gender: 'ALL', countries: 'VN', platforms: ['facebook','instagram'], interests: [], regions: [], cities: [], instagramAccountId: '', primaryText: '', headline: '', description: '', destination: '', mediaUrl: '', existingPostId: '', cta: 'LEARN_MORE', specialCategory: 'NONE' };
const objectives = [['OUTCOME_AWARENESS','Nhận diện'],['OUTCOME_TRAFFIC','Lưu lượng truy cập'],['OUTCOME_ENGAGEMENT','Tương tác']];
const categories = [['NONE','Không thuộc danh mục đặc biệt'],['HOUSING','Nhà ở'],['EMPLOYMENT','Việc làm'],['CREDIT','Tín dụng'],['ISSUES_ELECTIONS_POLITICS','Vấn đề xã hội / bầu cử / chính trị']];
const statusNames: Record<string,string> = { DRAFT:'Bản nháp QAVIO', PUBLISHING:'Đang gửi Meta', META_PAUSED:'Meta đã tạo · đang tạm dừng', META_REVIEW:'Meta đang xét duyệt', META_SCHEDULED:'Meta đã lên lịch', META_DELIVERING:'Meta đang phân phối', META_REJECTED:'Meta từ chối', META_COMPLETED:'Đã hoàn tất', META_PARTIAL:'Cần kiểm tra kết quả Meta', PAUSED:'Đã tạm dừng' };
const fmt = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
const localDate = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function CampaignEditor({ initialCampaignId }: { initialCampaignId?: string }) {
  const router = useRouter(); const params = useSearchParams();
  const [pages, setPages] = useState<Asset[]>([]); const [instagrams, setInstagrams] = useState<Asset[]>([]);
  const [form, setForm] = useState<Form>(defaults); const [campaignId, setCampaignId] = useState(initialCampaignId ?? params.get('draft') ?? '');
  const [campaign, setCampaign] = useState<Campaign | null>(null); const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(Boolean(initialCampaignId || params.get('draft')));
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [quote, setQuote] = useState<BudgetQuote | null>(null);
  const [interestQuery, setInterestQuery] = useState(''); const [locationQuery, setLocationQuery] = useState(''); const [interestResults, setInterestResults] = useState<AudienceItem[]>([]); const [locationResults, setLocationResults] = useState<AudienceItem[]>([]);
  const idempotencyKey = useRef('');
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => { void Promise.all([api<Asset[]>('/v1/meta/assets?type=PAGE'),api<Asset[]>('/v1/meta/assets?type=INSTAGRAM')]).then(([p,i]) => { setPages(p); setInstagrams(i); }).catch(() => { setPages([]); setInstagrams([]); }); }, []);

  const requestedCampaignId = initialCampaignId ?? params.get('draft') ?? '';
  const requestedPageId = params.get('page') ?? '';

  useEffect(() => {
    if (!requestedCampaignId) { const timer = window.setTimeout(() => setLoading(false), 0); return () => window.clearTimeout(timer); }
    let active = true;
    void api<Campaign>(`/v1/campaigns/${requestedCampaignId}`).then((value) => {
      if (!active) return;
      setCampaign(value); setCampaignId(value.id); setStep(Number(value.configuration?.wizardStep)||1);
      const t = value.configuration?.targeting ?? {}; const c = value.configuration?.creative ?? {};
      setForm({ ...defaults, name: value.name, objective: value.objective, pageAssetId: value.page_asset_id ?? '', budgetType: value.budget_type ?? 'DAILY', amount: String(value.budget_type === 'LIFETIME' ? value.lifetime_budget ?? '' : value.daily_budget ?? ''), startsAt: localDate(value.starts_at), endsAt: localDate(value.ends_at), ageMin: String(t.ageMin ?? 18), ageMax: String(t.ageMax ?? 65), gender: t.gender ?? 'ALL', countries: Array.isArray(t.countries) ? t.countries.join(',') : 'VN', platforms: Array.isArray(t.platforms) ? t.platforms : ['facebook','instagram'], interests: Array.isArray(t.interests) ? t.interests : [], regions: Array.isArray(t.regions) ? t.regions : [], cities: Array.isArray(t.cities) ? t.cities : [], instagramAccountId: c.instagramAccountId ?? '', primaryText: c.primaryText ?? '', headline: c.headline ?? '', description: c.description ?? '', destination: c.destination ?? '', mediaUrl: c.mediaUrl ?? '', existingPostId: c.existingPostId ?? '', cta: c.cta ?? 'LEARN_MORE', specialCategory: value.configuration?.specialAdCategories?.[0] ?? 'NONE' });
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải bản nháp.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestedCampaignId]);

  useEffect(() => {
    if (requestedCampaignId || campaignId || form.pageAssetId || !requestedPageId) return;
    const asset = pages.find((item) => item.external_asset_id === requestedPageId);
    if (!asset) return;
    const timer = window.setTimeout(() => set('pageAssetId', asset.id), 0);
    return () => window.clearTimeout(timer);
  }, [requestedCampaignId, requestedPageId, campaignId, form.pageAssetId, pages]);

  const configuration = useMemo(() => ({ wizardStep: step, specialAdCategories: form.specialCategory === 'NONE' ? [] : [form.specialCategory], targeting: { ageMin: Number(form.ageMin), ageMax: Number(form.ageMax), gender: form.gender, countries: form.countries.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean), platforms: form.platforms, interests: form.interests.map(({ id, name }) => ({ id, name })), regions: form.regions.map(({ id, name }) => ({ id, name })), cities: form.cities.map(({ id, name }) => ({ id, name })) }, creative: { instagramAccountId: form.instagramAccountId || undefined, primaryText: form.primaryText, headline: form.headline, description: form.description, destination: form.destination, mediaUrl: form.mediaUrl, existingPostId: form.existingPostId, cta: form.cta } }), [form, step]);
  const liveCampaign = Boolean(campaign?.meta_campaign_id);

  async function persist(nextStep = step) {
    if (!form.name.trim()) throw new Error('Nhập tên chiến dịch trước khi lưu bản nháp.');
    const payload = { name: form.name.trim(), objective: form.objective, pageAssetId: form.pageAssetId || undefined, budgetType: form.budgetType, dailyBudget: form.budgetType === 'DAILY' && form.amount ? Number(form.amount) : undefined, lifetimeBudget: form.budgetType === 'LIFETIME' && form.amount ? Number(form.amount) : undefined, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined, configuration: { ...configuration, wizardStep: nextStep } };
    if (campaignId) {
      const result = await api<Campaign>(`/v1/campaigns/${campaignId}`, { method: 'PATCH', body: JSON.stringify(payload) }); setCampaign(result); setStep(nextStep); return result;
    }
    if (!idempotencyKey.current) { idempotencyKey.current = sessionStorage.getItem('qavio-campaign-draft-idempotency') || crypto.randomUUID(); sessionStorage.setItem('qavio-campaign-draft-idempotency', idempotencyKey.current); }
    const result = await api<Campaign>('/v1/campaigns', { method: 'POST', body: JSON.stringify({ ...payload, idempotencyKey: idempotencyKey.current }) });
    sessionStorage.removeItem('qavio-campaign-draft-idempotency');
    setCampaignId(result.id); setCampaign(result); setStep(nextStep);
    if (!initialCampaignId) router.replace(`/app/campaigns/new?draft=${result.id}`, { scroll: false });
    return result;
  }

  async function transition(nextStep: number) {
    setError(''); setNotice('');
    if (nextStep > step) {
      if (step === 1 && !form.name.trim()) return setError('Nhập tên chiến dịch trước khi tiếp tục.');
      if (step === 2) { const amount = Number(form.amount); if (!Number.isSafeInteger(amount) || amount <= 0) return setError('Ngân sách phải là số VND nguyên lớn hơn 0.'); if (!form.startsAt || !form.endsAt || new Date(form.endsAt) <= new Date(form.startsAt)) return setError('Chọn lịch bắt đầu và kết thúc hợp lệ.'); if (new Date(form.startsAt) <= new Date()) return setError('Thời điểm bắt đầu phải ở tương lai.'); }
      if (step === 3 && (Number(form.ageMin) > Number(form.ageMax) || !form.countries.trim())) return setError('Kiểm tra độ tuổi và quốc gia nhắm mục tiêu.');
      if (step === 4 && (form.primaryText.trim().length < 10 || (!form.mediaUrl.trim() && !form.existingPostId.trim()) || !/^https:\/\//i.test(form.destination))) return setError('Cần nội dung đầy đủ, ảnh công khai hoặc bài viết đã xác minh, và URL đích HTTPS.');
    }
    setBusy(true);
    try { await persist(nextStep); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu bước hiện tại.'); }
    finally { setBusy(false); }
  }

  async function saveDraft() { setBusy(true); setError(''); setNotice(''); try { await persist(step); setNotice('Bản nháp đã được lưu.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu bản nháp.'); } finally { setBusy(false); } }

  async function search(type: 'INTEREST'|'LOCATION') {
    const query = type === 'INTEREST' ? interestQuery : locationQuery; if (query.trim().length < 2) return;
    setError('');
    try { const results = await api<AudienceItem[]>(`/v1/campaigns/targeting/search?type=${type}&q=${encodeURIComponent(query)}`); type === 'INTEREST' ? setInterestResults(results) : setLocationResults(results); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tìm mục tiêu Meta.'); }
  }

  function addTarget(item: AudienceItem, type: 'INTEREST'|'LOCATION') {
    if (type === 'INTEREST') { if (!form.interests.some((current) => current.id === item.id)) set('interests', [...form.interests, item]); setInterestResults([]); return; }
    const category = (item.type ?? '').toLowerCase().includes('city') ? 'cities' : 'regions';
    const current = form[category]; if (!current.some((value) => value.id === item.id)) set(category, [...current, item]); setLocationResults([]);
  }

  useEffect(() => {
    if (step !== 5 || !form.amount || !form.startsAt || !form.endsAt) { const timer = window.setTimeout(() => setQuote(null), 0); return () => window.clearTimeout(timer); }
    const days = Math.ceil((new Date(form.endsAt).getTime() - new Date(form.startsAt).getTime()) / 86_400_000);
    if (days < 1 || days > 90) { const timer = window.setTimeout(() => setQuote(null), 0); return () => window.clearTimeout(timer); }
    let active = true; const timer = window.setTimeout(() => { void api<BudgetQuote>('/v1/wallet/campaign-quote', { method: 'POST', body: JSON.stringify({ budgetType: form.budgetType, amount: Number(form.amount), days }) }).then((value) => { if (active) setQuote(value); }).catch((reason) => { if (active) { setQuote(null); setError(reason instanceof Error ? reason.message : 'Không thể tính ngân sách.'); } }); }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [step, form.amount, form.startsAt, form.endsAt, form.budgetType]);

  async function launch() {
    if (!campaignId) { setError('Lưu bản nháp trước khi xác nhận chạy.'); return; }
    if (!quote?.sufficientBalance) { setError('Số dư khả dụng chưa đủ để giữ tổng ngân sách và phí.'); return; }
    const amount = `${fmt(quote.mediaBudget)} ₫ ngân sách Meta + ${fmt(quote.feeAmount)} ₫ phí = ${fmt(quote.totalRequired)} ₫ cần giữ`;
    if (!window.confirm(`XÁC NHẬN TẠO VÀ CHẠY QUẢNG CÁO META?\n${amount}\nBắt đầu: ${new Date(form.startsAt).toLocaleString('vi-VN')}\nKết thúc: ${new Date(form.endsAt).toLocaleString('vi-VN')}\nMeta có thể phân phối sau khi xét duyệt. Đây là thao tác thật và có thể phát sinh chi phí.`)) return;
    setBusy(true); setError('');
    try { await api(`/v1/campaigns/${campaignId}/publish`, { method: 'POST', body: JSON.stringify({ confirmed: true }) }); setCampaign(await api<Campaign>(`/v1/campaigns/${campaignId}`)); setNotice('Đã gửi yêu cầu tạo chiến dịch lên Meta. Trạng thái sẽ được đồng bộ từ Meta.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo chiến dịch trên Meta.'); }
    finally { setBusy(false); }
  }

  async function pause() { if (!window.confirm('Tạm dừng quảng cáo Meta này?')) return; setBusy(true); try { await api(`/v1/campaigns/${campaignId}/pause`, { method: 'POST', body: '{}' }); setCampaign(await api<Campaign>(`/v1/campaigns/${campaignId}`)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạm dừng.'); } finally { setBusy(false); } }
  async function resume() { if (!window.confirm('Tiếp tục phân phối quảng cáo và có thể tiếp tục phát sinh chi phí?')) return; setBusy(true); try { await api(`/v1/campaigns/${campaignId}/resume`, { method: 'POST', body: JSON.stringify({ confirmed: true }) }); setCampaign(await api<Campaign>(`/v1/campaigns/${campaignId}`)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tiếp tục.'); } finally { setBusy(false); } }

  if (loading) return <main className="content"><section className="card">Đang tải chiến dịch…</section></main>;
  if (campaignId && !campaign && error) return <main className="content"><section className="alert alert-error">{error}</section><Link className="button secondary" href="/app/campaigns">Quay lại danh sách</Link></main>;
  if (liveCampaign && campaign) return <main className="content"><p className="eyebrow">CHIẾN DỊCH META</p><h1 className="page-title">{campaign.name}</h1>{error&&<section className="alert alert-error">{error}</section>}<section className="card"><p>Trạng thái QAVIO: <b>{statusNames[campaign.status]??campaign.status}</b></p><p>Trạng thái Meta gần nhất: <b>{campaign.meta_effective_status??campaign.meta_status??'Chưa đồng bộ'}</b></p><p>Meta Campaign ID: <b>{campaign.meta_campaign_id}</b></p><p>Đã giữ: {campaign.reserved_total_amount?`${fmt(Number(campaign.reserved_total_amount))} ₫`: '—'} · Phí: {campaign.fee_amount?`${fmt(Number(campaign.fee_amount))} ₫`:'—'} · Chi tiêu Insights: {campaign.meta_spend_amount?`${fmt(Number(campaign.meta_spend_amount))} ₫`:'Chưa đồng bộ'}</p>{campaign.last_error&&<section className="alert alert-error">{campaign.last_error}</section>}<div className="page-actions"><Link className="button secondary" href="/app/campaigns">Quay lại</Link>{campaign.status==='PAUSED'||campaign.status==='META_PAUSED'?<button className="button" disabled={busy} onClick={()=>void resume()}>Tiếp tục phân phối</button>:<button className="button secondary" disabled={busy} onClick={()=>void pause()}>Tạm dừng quảng cáo</button>}<Link className="button secondary" href="/app/reports">Xem báo cáo</Link></div></section></main>;

  return <main className="content"><p className="eyebrow">CHIẾN DỊCH / {campaignId ? 'CHỈNH SỬA BẢN NHÁP' : 'TẠO MỚI'}</p><div className="page-header"><div><h1 className="page-title">{campaignId ? form.name || 'Chỉnh sửa bản nháp' : `Tạo chiến dịch · Bước ${step}/5`}</h1><p className="muted">Lưu bản nháp không gọi Meta API. Chỉ bước xác nhận cuối mới gửi yêu cầu tạo quảng cáo thật.</p></div><Link className="button secondary" href="/app/campaigns">Danh sách chiến dịch</Link></div>{error&&<section className="alert alert-error" role="alert">{error}</section>}{notice&&<section className="alert alert-success" role="status">{notice}</section>}
    <section className="card form">
      {step===1&&<><h2>1. Tài khoản và mục tiêu</h2><label>Tên chiến dịch<input maxLength={200} value={form.name} onChange={(event)=>set('name',event.target.value)} placeholder="Ví dụ: Khuyến mãi cuối năm" /></label><label>Mục tiêu<select value={form.objective} onChange={(event)=>set('objective',event.target.value)}>{objectives.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Trang Facebook đã xác minh<select value={form.pageAssetId} onChange={(event)=>set('pageAssetId',event.target.value)}><option value="">Chưa chọn — chỉ lưu nháp</option>{pages.map((page)=><option key={page.id} value={page.id}>{page.asset_name??page.external_asset_id}</option>)}</select></label><p className="notice">Ad Account chạy quảng cáo lấy từ cấu hình Super Admin. Người dùng không nhập Ad Account ID.</p><label>Danh mục quảng cáo đặc biệt<select value={form.specialCategory} onChange={(event)=>set('specialCategory',event.target.value)}>{categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>{form.specialCategory!=='NONE'&&<p className="alert alert-warning">Danh mục đặc biệt được lưu trong nháp, nhưng chưa thể phát hành tự động do Meta yêu cầu quy tắc targeting riêng QAVIO chưa hoàn thiện.</p>}</>}
      {step===2&&<><h2>2. Ngân sách và lịch</h2><div className="grid two"><label>Kiểu ngân sách<select value={form.budgetType} onChange={(event)=>set('budgetType',event.target.value as Form['budgetType'])}><option value="DAILY">Ngân sách mỗi ngày</option><option value="LIFETIME">Ngân sách trọn thời gian</option></select></label><label>{form.budgetType==='DAILY'?'Ngân sách mỗi ngày (VND)':'Tổng ngân sách quảng cáo (VND)'}<input type="number" min="1" step="1" value={form.amount} onChange={(event)=>set('amount',event.target.value)} placeholder="Nhập số VND" /></label></div><div className="grid two"><label>Bắt đầu<input type="datetime-local" value={form.startsAt} onChange={(event)=>set('startsAt',event.target.value)} /></label><label>Kết thúc<input type="datetime-local" value={form.endsAt} onChange={(event)=>set('endsAt',event.target.value)} /></label></div><p className="notice">QAVIO giữ tổng ngân sách dự kiến và phí trước khi gửi. Thời lượng phát hành hiện tối đa 90 ngày. Lịch quá khứ hoặc ngân sách không đủ sẽ bị chặn.</p></>}
      {step===3&&<><h2>3. Đối tượng và vị trí hiển thị</h2><div className="grid two"><label>Tuổi tối thiểu<input type="number" min="18" max="65" value={form.ageMin} onChange={(event)=>set('ageMin',event.target.value)} /></label><label>Tuổi tối đa<input type="number" min="18" max="65" value={form.ageMax} onChange={(event)=>set('ageMax',event.target.value)} /></label></div><label>Giới tính<select value={form.gender} onChange={(event)=>set('gender',event.target.value)}><option value="ALL">Tất cả</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select></label><label>Quốc gia (mã ISO 2 ký tự, dấu phẩy ngăn cách)<input value={form.countries} onChange={(event)=>set('countries',event.target.value)} placeholder="VN, TH" /></label><label>Sở thích được Meta hỗ trợ<div className="page-actions"><input value={interestQuery} onChange={(event)=>setInterestQuery(event.target.value)} placeholder="Tìm sở thích" /><button className="button secondary" type="button" onClick={()=>void search('INTEREST')}>Tìm</button></div></label>{interestResults.length>0&&<ul>{interestResults.map((item)=><li key={item.id}><button className="button secondary" type="button" onClick={()=>addTarget(item,'INTEREST')}>{item.name}</button></li>)}</ul>}<p className="field-help">{form.interests.map((item)=><button key={item.id} className="button secondary" type="button" onClick={()=>set('interests',form.interests.filter((value)=>value.id!==item.id))}>{item.name} ×</button>)}</p><label>Tỉnh/thành phố<select aria-label="Loại tìm kiếm vị trí" value={locationQuery.startsWith('CITY:')?'CITY':'REGION'} onChange={(event)=>setLocationQuery(`${event.target.value}:`)}><option value="REGION">Tỉnh / khu vực</option><option value="CITY">Thành phố</option></select><div className="page-actions"><input value={locationQuery.replace(/^(CITY|REGION):/,'')} onChange={(event)=>setLocationQuery(`${locationQuery.startsWith('CITY:')?'CITY':'REGION'}:${event.target.value}`)} placeholder="Tìm địa điểm Meta" /><button className="button secondary" type="button" onClick={()=>void search('LOCATION')}>Tìm</button></div></label>{locationResults.length>0&&<ul>{locationResults.map((item)=><li key={`${item.type}-${item.id}`}><button className="button secondary" type="button" onClick={()=>addTarget(item,'LOCATION')}>{item.name}{item.region?` · ${item.region}`:''}{item.countryCode?` · ${item.countryCode}`:''}</button></li>)}</ul>}<p>{[...form.regions.map((item)=>({...item,bucket:'regions'})),...form.cities.map((item)=>({...item,bucket:'cities'}))].map((item)=><button key={`${item.bucket}-${item.id}`} className="button secondary" type="button" onClick={()=>set(item.bucket as 'regions'|'cities',form[item.bucket as 'regions'|'cities'].filter((value)=>value.id!==item.id))}>{item.name} ×</button>)}</p><fieldset><legend>Nền tảng</legend>{[['facebook','Facebook'],['instagram','Instagram'],['messenger','Messenger'],['audience_network','Audience Network']].map(([value,label])=><label key={value}><input type="checkbox" checked={form.platforms.includes(value)} onChange={(event)=>set('platforms',event.target.checked?[...form.platforms,value]:form.platforms.filter((item)=>item!==value))} /> {label}</label>)}</fieldset><p className="notice">Custom Audience, Lookalike và tối ưu chuyển đổi chưa được bật tự động. QAVIO chỉ gửi vị trí/sở thích có ID trả về từ Meta.</p></>}
      {step===4&&<><h2>4. Trang, media và nội dung</h2><label>Tài khoản Instagram đã xác minh<select value={form.instagramAccountId} onChange={(event)=>set('instagramAccountId',event.target.value)}><option value="">Dùng danh tính Trang / không chọn</option>{instagrams.map((asset)=><option key={asset.id} value={asset.external_asset_id}>{asset.asset_name??asset.external_asset_id}</option>)}</select></label><label>Nội dung chính<textarea rows={5} maxLength={2200} value={form.primaryText} onChange={(event)=>set('primaryText',event.target.value)} placeholder="Viết nội dung quảng cáo đầy đủ" /></label><label>Tiêu đề<input maxLength={255} value={form.headline} onChange={(event)=>set('headline',event.target.value)} /></label><label>Mô tả<input maxLength={255} value={form.description} onChange={(event)=>set('description',event.target.value)} /></label><label>CTA<select value={form.cta} onChange={(event)=>set('cta',event.target.value)}><option value="LEARN_MORE">Tìm hiểu thêm</option><option value="SHOP_NOW">Mua ngay</option><option value="CONTACT_US">Liên hệ</option></select></label><label>URL đích HTTPS<input type="url" value={form.destination} onChange={(event)=>set('destination',event.target.value)} placeholder="https://..." /></label><label>URL ảnh HTTPS công khai<input type="url" value={form.mediaUrl} onChange={(event)=>set('mediaUrl',event.target.value)} placeholder="https://.../image.jpg" /></label>{form.mediaUrl&&<img src={form.mediaUrl} alt="Xem trước ảnh quảng cáo" style={{maxWidth:'100%',maxHeight:280,objectFit:'contain'}} />}<label>Bài viết có sẵn trên Trang (PageID_PostID, nếu dùng)<input value={form.existingPostId} onChange={(event)=>set('existingPostId',event.target.value)} placeholder="Chỉ bài viết trên Trang đã chọn" /></label><p className="notice">Upload video và tải file trực tiếp chưa được tích hợp; hiện hỗ trợ ảnh HTTPS công khai hoặc bài viết có sẵn trên đúng Trang.</p></>}
      {step===5&&<><h2>5. Xem trước và xác nhận</h2><section className="card"><p><b>{form.name||'Chưa đặt tên'}</b> · {objectives.find(([value])=>value===form.objective)?.[1]}</p><p>Trang: {pages.find((item)=>item.id===form.pageAssetId)?.asset_name??'Chưa chọn'}</p><p>Ngân sách: {fmt(Number(form.amount)||0)} ₫ · {form.budgetType==='DAILY'?'mỗi ngày':'trọn thời gian'}</p><p>Lịch: {form.startsAt?new Date(form.startsAt).toLocaleString('vi-VN'):'Chưa chọn'} – {form.endsAt?new Date(form.endsAt).toLocaleString('vi-VN'):'Chưa chọn'}</p><p>Đối tượng: {form.ageMin}–{form.ageMax} · {form.countries} · {form.interests.map((item)=>item.name).join(', ')||'Không chọn sở thích'}</p><p>{form.primaryText||'Chưa có nội dung'}</p>{form.mediaUrl&&<img src={form.mediaUrl} alt="Xem trước quảng cáo" style={{maxWidth:'100%',maxHeight:280,objectFit:'contain'}} />}<p>{form.destination}</p></section>{quote&&<section className={quote.sufficientBalance?'alert alert-success':'alert alert-warning'} style={{marginTop:14}}><b>Dự toán cần giữ: {fmt(quote.totalRequired)} ₫</b><br />Ngân sách Meta {fmt(quote.mediaBudget)} ₫ + phí dịch vụ {fmt(quote.feeAmount)} ₫ ({quote.feePercent}%). Số dư khả dụng: {fmt(quote.availableAmount)} ₫. {quote.sufficientBalance?'Đủ số dư theo ledger hiện tại.':'Chưa đủ tiền; cần nạp và xác nhận giao dịch trước.'}</section>}{!quote&&<p className="notice">Nhập ngân sách và lịch hợp lệ để QAVIO tính tiền cần giữ.</p>}{form.specialCategory!=='NONE'&&<p className="alert alert-warning">Danh mục quảng cáo đặc biệt chưa được hỗ trợ phát hành tự động.</p>}<p className="notice">Meta sẽ nhận Campaign/Ad Set/Creative/Ad ở trạng thái tạm dừng trước, sau đó QAVIO kích hoạt theo xác nhận của bạn. Nếu chưa đủ số dư hoặc thiếu quyền, không có quảng cáo nào được kích hoạt.</p></>}
      <div className="page-actions"><button className="button secondary" type="button" disabled={busy} onClick={()=>void saveDraft()}>{busy?'Đang lưu…':'Lưu bản nháp'}</button>{step>1&&<button className="button secondary" type="button" disabled={busy} onClick={()=>void transition(step-1)}>Quay lại</button>}{step<5?<button className="button" type="button" disabled={busy} onClick={()=>void transition(step+1)}>{busy?'Đang lưu bước…':'Tiếp tục'}</button>:<button className="button" type="button" disabled={busy||!quote?.sufficientBalance||form.specialCategory!=='NONE'} onClick={()=>void launch()}>{busy?'Đang xử lý…':'Xác nhận chạy quảng cáo'}</button>}</div>
    </section>
    {campaignId&&<p className="muted" style={{marginTop:12}}>Bản nháp được lưu tự động khi chuyển bước. Mã bản nháp: {campaignId}</p>}
  </main>;
}
