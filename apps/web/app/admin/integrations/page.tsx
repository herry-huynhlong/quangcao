'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api';

type Integration = { provider:string; client_id:string|null; api_version:string|null; status:string; last_checked_at:string|null; last_error:string|null };
type Data = { integrations:Integration[]; message:string };
const labels:Record<string,string>={META:'Meta & Instagram Ads',GOOGLE:'Google Ads & YouTube Ads',TIKTOK:'TikTok Ads'};

export default function Integrations(){
  const [data,setData]=useState<Data|null>(null); const [error,setError]=useState('');
  const load=useCallback(async()=>{setError('');try{setData(await api<Data>('/v1/admin/integrations'));}catch(caught){setError(caught instanceof Error?caught.message:'Không thể tải trạng thái tích hợp.');}},[]);
  useEffect(()=>{api<Data>('/v1/admin/integrations').then(setData).catch(caught=>setError(caught instanceof Error?caught.message:'Không thể tải trạng thái tích hợp.'));},[]);
  if(error)return <main className="content"><p className="eyebrow">CẤU HÌNH</p><h1 className="page-title">Kết nối API</h1><section className="error-card"><p>{error}</p><button className="button" onClick={()=>void load()}>Thử lại</button></section></main>;
  return <main className="content"><p className="eyebrow">CẤU HÌNH / SUPER ADMIN</p><h1 className="page-title">Kết nối API</h1><p className="notice">Chỉ Super Admin cấu hình ứng dụng Meta, Google/YouTube và TikTok tại đây. “Đã cấu hình ứng dụng” không đồng nghĩa đã kết nối tài khoản quảng cáo; trạng thái tài khoản, chiến dịch và báo cáo nằm tại từng trang Ads.</p>{!data?<p className="muted">Đang tải trạng thái cấu hình…</p>:<div className="grid three" style={{marginTop:16}}>{['META','GOOGLE','TIKTOK'].map(provider=>{const item=data.integrations.find(value=>value.provider===provider);const configured=item?.status==='CONFIGURED_NOT_TESTED'||item?.status==='CONNECTED';return <section className="card" key={provider}><span className={item?.status==='CONNECTED'?'ok':'warning'}>{configured?'Đã cấu hình ứng dụng':'Chưa cấu hình ứng dụng'}</span><h2>{labels[provider]}</h2><p className="muted">Client ID: {item?.client_id??'Chưa khai báo'}</p><p className="muted">Secret: {item?.client_id?'Đã lưu an toàn':'Chưa lưu'}</p><Link className="button secondary" href={`/admin/integrations/${provider.toLowerCase()}`}>Cấu hình ứng dụng</Link></section>})}</div>}</main>;
}
