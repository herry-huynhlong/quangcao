'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';

type Asset = { id: string; asset_name: string | null; external_asset_id: string };
const objectives = [['OUTCOME_AWARENESS', 'Nhận diện'], ['OUTCOME_TRAFFIC', 'Lưu lượng truy cập'], ['OUTCOME_ENGAGEMENT', 'Tương tác'], ['OUTCOME_LEADS', 'Khách hàng tiềm năng'], ['OUTCOME_SALES', 'Doanh số']];

export default function NewCampaign() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ name: '', objective: 'OUTCOME_TRAFFIC', pageAssetId: '', dailyBudget: '', startsAt: '', endsAt: '', ageMin: '18', ageMax: '65', gender: 'ALL', countries: 'VN', platforms: 'facebook,instagram', placements: 'ADVANTAGE_PLUS', instagram: '', headline: '', description: '', primaryText: '', destination: '', cta: 'LEARN_MORE', specialAdCategory: 'NONE' });
  const set = (key: keyof typeof draft, value: string) => setDraft((old) => ({ ...old, [key]: value }));

  useEffect(() => { api<Asset[]>('/v1/meta/assets?type=PAGE').then(setAssets).catch(() => setAssets([])); }, []);
  function next() {
    if (step === 1 && !draft.name.trim()) return setError('Nhập tên chiến dịch trước khi tiếp tục.');
    if (step === 2 && draft.dailyBudget && Number(draft.dailyBudget) <= 0) return setError('Ngân sách phải lớn hơn 0.');
    setError(''); setStep((old) => Math.min(5, old + 1));
  }
  async function save() {
    if (!draft.name.trim()) return setError('Nhập tên chiến dịch để lưu bản nháp.');
    setSaving(true); setError('');
    try {
      const result = await api<{ id: string }>('/v1/campaigns', { method: 'POST', body: JSON.stringify({ name: draft.name, objective: draft.objective, pageAssetId: draft.pageAssetId || undefined, dailyBudget: draft.dailyBudget ? Number(draft.dailyBudget) : undefined, startsAt: draft.startsAt || undefined, endsAt: draft.endsAt || undefined, configuration: { wizardStep: step, specialAdCategory: draft.specialAdCategory, targeting: { ageMin: Number(draft.ageMin), ageMax: Number(draft.ageMax), gender: draft.gender, countries: draft.countries.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean), platforms: draft.platforms.split(',').map((value) => value.trim()).filter(Boolean), placementMode: draft.placements }, creative: { instagram: draft.instagram, primaryText: draft.primaryText, headline: draft.headline, description: draft.description, destination: draft.destination, cta: draft.cta } } }) });
      router.push(`/app/campaigns/${result.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu bản nháp.'); } finally { setSaving(false); }
  }
  return <main className="content"><p className="eyebrow">CHIẾN DỊCH / BẢN NHÁP</p><h1 className="page-title">Tạo chiến dịch · Bước {step}/5</h1><p className="muted">Lưu bản nháp không gọi Meta và không phát sinh chi phí.</p>{error && <p className="error">{error}</p>}<section className="card">
    {step === 1 && <><label>Tên chiến dịch<input value={draft.name} onChange={(event) => set('name', event.target.value)} placeholder="Ví dụ: Khuyến mãi tháng 11" /></label><label>Mục tiêu<select value={draft.objective} onChange={(event) => set('objective', event.target.value)}>{objectives.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Facebook Page đã liên kết<select value={draft.pageAssetId} onChange={(event) => set('pageAssetId', event.target.value)}><option value="">Chưa liên kết — chỉ lưu nháp</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.asset_name ?? asset.external_asset_id}</option>)}</select></label><p className="muted">Ad Account vận hành được QAVIO chọn ở backend khi đủ điều kiện phát hành; khách hàng không nhập Ad Account ID tại đây.</p></>}
    {step === 2 && <><label>Ngân sách hằng ngày<input type="number" min="1" value={draft.dailyBudget} onChange={(event) => set('dailyBudget', event.target.value)} placeholder="Ví dụ: 200000" /></label><div className="grid two"><label>Ngày bắt đầu<input type="datetime-local" value={draft.startsAt} onChange={(event) => set('startsAt', event.target.value)} /></label><label>Ngày kết thúc<input type="datetime-local" value={draft.endsAt} onChange={(event) => set('endsAt', event.target.value)} /></label></div></>}
    {step === 3 && <><div className="grid two"><label>Tuổi tối thiểu<input type="number" min="18" max="65" value={draft.ageMin} onChange={(event) => set('ageMin', event.target.value)} /></label><label>Tuổi tối đa<input type="number" min="18" max="65" value={draft.ageMax} onChange={(event) => set('ageMax', event.target.value)} /></label></div><label>Giới tính<select value={draft.gender} onChange={(event) => set('gender', event.target.value)}><option value="ALL">Tất cả</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select></label><label>Quốc gia (mã ISO 2 ký tự, cách nhau dấu phẩy)<input value={draft.countries} onChange={(event) => set('countries', event.target.value)} placeholder="VN, TH" /></label><label>Nền tảng (cách nhau dấu phẩy)<input value={draft.platforms} onChange={(event) => set('platforms', event.target.value)} placeholder="facebook,instagram" /></label><label>Vị trí hiển thị<select value={draft.placements} onChange={(event) => set('placements', event.target.value)}><option value="ADVANTAGE_PLUS">Advantage+ placements</option><option value="MANUAL">Tự chọn vị trí</option></select></label><p className="notice">Sở thích, hành vi, Custom Audience và Lookalike chỉ được hiển thị sau khi QAVIO truy vấn dữ liệu targeting hợp lệ từ Meta cho Ad Account vận hành.</p></>}
    {step === 4 && <><label>Trang Facebook{draft.pageAssetId ? <input value={assets.find((asset) => asset.id === draft.pageAssetId)?.asset_name ?? 'Trang đã chọn'} readOnly /> : <input value="Chưa liên kết — chỉ lưu bản nháp" readOnly />}</label><label>Instagram (nếu dùng)<input value={draft.instagram} onChange={(event) => set('instagram', event.target.value)} placeholder="Chỉ dùng khi QAVIO đã xác minh quyền" /></label><label>Nội dung chính<textarea value={draft.primaryText} onChange={(event) => set('primaryText', event.target.value)} /></label><label>Tiêu đề<input value={draft.headline} onChange={(event) => set('headline', event.target.value)} /></label><label>Mô tả<input value={draft.description} onChange={(event) => set('description', event.target.value)} /></label><label>Nút kêu gọi hành động<select value={draft.cta} onChange={(event) => set('cta', event.target.value)}><option value="LEARN_MORE">Tìm hiểu thêm</option><option value="SHOP_NOW">Mua ngay</option><option value="CONTACT_US">Liên hệ</option></select></label><label>Liên kết đích<input value={draft.destination} onChange={(event) => set('destination', event.target.value)} placeholder="https://" /></label><p className="notice">Tải ảnh/video và chọn bài viết có sẵn chỉ mở khi media endpoint Meta đã xác minh được quyền Page và Ad Account.</p></>}
    {step === 5 && <><h2>Xem trước bản nháp</h2><p><b>{draft.name}</b> · {objectives.find(([value]) => value === draft.objective)?.[1]}</p><p>{draft.primaryText || 'Chưa có nội dung quảng cáo.'}</p><p className="notice">Chưa gửi sang Meta. Việc tạo quảng cáo thật chỉ được mở khi Ad Account và Trang đã được xác minh.</p></>}
    <p className="page-actions">{step > 1 && <button className="button secondary" onClick={() => setStep((old) => old - 1)}>Quay lại</button>}{step < 5 ? <button className="button" onClick={next}>Tiếp tục</button> : <button className="button" disabled={saving} onClick={() => void save()}>{saving ? 'Đang lưu…' : 'Lưu bản nháp'}</button>}</p>
  </section></main>;
}
