'use client';

import Link from 'next/link';
import { useEffect, useParams, useState } from 'react';
import { api } from '../../../../lib/api';

type ProviderState={provider:string;client_id:string|null;api_version:string|null;has_secret:boolean;status:string;last_checked_at:string|null;last_error:string|null};
const platform:Record<string,{name:string;app:string;config:string}>={
  meta:{name:'Facebook & Instagram Ads',app:'Meta App',config:'Meta'},
  google:{name:'Google & YouTube Ads',app:'Google Cloud App',config:'Google'},
  tiktok:{name:'TikTok Ads',app:'TikTok Developer App',config:'TikTok'},
};

function connectionStatus(state:ProviderState){
  if(state.status==='CONNECTED')return {title:'Đã kết nối tài khoản quảng cáo',detail:'Đã có kết nối tài khoản. Dữ liệu chiến dịch chỉ được mở khi backend Marketing API được bật.',kind:'ok'};
  if(state.status==='CONFIGURED_NOT_TESTED')return {title:'Đã cấu hình ứng dụng',detail:'Credentials đã được lưu an toàn, nhưng chưa kiểm thử OAuth hoặc kết nối tài khoản quảng cáo.',kind:'warning'};
  if(state.status==='ERROR')return {title:'Kết nối cần xử lý',detail:state.last_error||'Lần kiểm tra gần nhất không thành công.',kind:'error'};
  return {title:'Chưa cấu hình ứng dụng',detail:'Chưa có credentials ứng dụng cho nền tảng này.',kind:'warning'};
}

export default function AdsPlatform(){
  const {provider}=useParams<{provider:string}>(); const item=platform[provider]; const [data,setData]=useState<ProviderState|null>(null); const [error,setError]=useState('');
  useEffect(()=>{if(!item)return; api<ProviderState>(`/v1/admin/integrations/${provider}`).then(setData).catch(caught=>setError(caught instanceof Error?caught.message:'Không thể tải trạng thái nền tảng.'));},[provider,item]);
  if(!item)return <main className="content"><h1 className="page-title">Nền tảng không hỗ trợ</h1></main>;
  const status=data?connectionStatus(data):null;
  return <main className="content"><p className="eyebrow">QUẢNG CÁO / {provider.toUpperCase()}</p><h1 className="page-title">{item.name}</h1><p className="notice">Đây là khu vực quản lý kết nối, tài khoản, chiến dịch và báo cáo của {item.name}. Cấu hình ứng dụng chỉ thực hiện tại Kết nối API.</p>{error?<section className="error-card"><p>{error}</p><Link className="button" href={`/admin/integrations/${provider}`}>Mở cấu hình API</Link></section>:!status?<p className="muted">Đang tải trạng thái kết nối…</p>:<><section className="card" style={{marginTop:16}}><span className={status.kind==='ok'?'ok':status.kind==='error'?'error':'warning'}>{status.title}</span><h2>{item.app}</h2><p className="muted">{status.detail}</p>{data.last_checked_at&&<p className="muted">Kiểm tra gần nhất: {new Date(data.last_checked_at).toLocaleString('vi-VN')}</p>}{status.kind!=='ok'&&<Link className="button secondary" href={`/admin/integrations/${provider}`}>Mở Kết nối API</Link>}</section><div className="grid three" style={{marginTop:20}}><section className="card"><b>01　Tài khoản quảng cáo</b><p className="muted">{status.kind==='ok'?'Tài khoản được ủy quyền sẽ hiển thị tại đây.':'Chưa có tài khoản được ủy quyền. Hoàn tất cấu hình và OAuth để đồng bộ.'}</p></section><section className="card"><b>02　Chiến dịch</b><p className="muted">Tạo và chạy chiến dịch thật vẫn bị khóa cho đến khi quyền API và tài khoản được xác minh.</p><button className="button secondary" disabled>Quản lý chiến dịch</button></section><section className="card"><b>03　Báo cáo</b><p className="muted">Báo cáo chỉ dùng dữ liệu đã đồng bộ từ tài khoản được cấp quyền.</p><button className="button secondary" disabled>Xem báo cáo</button></section></div></>}</main>;
}
