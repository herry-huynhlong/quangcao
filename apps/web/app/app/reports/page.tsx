'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

type Asset = { id: string; asset_name: string | null; external_asset_id: string };
export default function Reports() {
  const [assets, setAssets] = useState<Asset[]>([]);
  useEffect(() => { api<Asset[]>('/v1/meta/assets?type=AD_ACCOUNT').then(setAssets).catch(() => setAssets([])); }, []);
  return <main className="content"><p className="eyebrow">BÁO CÁO</p><h1 className="page-title">Hiệu quả quảng cáo</h1><section className="card"><div className="filters"><select aria-label="Tài khoản quảng cáo"><option>Tất cả tài khoản đã kết nối</option>{assets.map((asset) => <option key={asset.id}>{asset.asset_name ?? asset.external_asset_id}</option>)}</select><input aria-label="Từ ngày" type="date" /><input aria-label="Đến ngày" type="date" /></div><div className="empty-state"><h2>Chưa có dữ liệu Meta</h2><p>QAVIO sẽ chỉ hiển thị Insights do Meta trả về sau khi có chiến dịch thật và quyền đọc báo cáo hợp lệ. Không có số liệu mô phỏng.</p><Link className="button" href="/app/campaigns">Mở Chiến dịch</Link></div></section></main>;
}
