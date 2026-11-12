'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';

type ProviderState={client_id:string|null;api_version:string|null;has_secret:boolean;status:string};
const labels:Record<string,string>={meta:'Meta & Instagram Ads',google:'Google Ads & YouTube Ads',tiktok:'TikTok Ads'};
export default function Provider(){
  const {provider}=useParams<{provider:string}>(); const router=useRouter(); const [data,setData]=useState<ProviderState|null>(null); const [clientId,setClientId]=useState(''); const [secret,setSecret]=useState(''); const [version,setVersion]=useState(''); const [error,setError]=useState(''); const [saving,setSaving]=useState(false);
  useEffect(()=>{api<ProviderState>(`/v1/admin/integrations/${provider}`).then(result=>{setData(result);setClientId(result.client_id??'');setVersion(result.api_version??'');}).catch(caught=>setError(caught instanceof Error?caught.message:'Không thể tải cấu hình provider.'));},[provider]);
  async function save(){setSaving(true);setError('');try{await api('/v1/admin/integrations/configure',{method:'POST',body:JSON.stringify({provider,clientId,clientSecret:secret||undefined,apiVersion:version||undefined})});router.push('/admin/integrations');}catch(caught){setError(caught instanceof Error?caught.message:'Không thể lưu cấu hình.');}finally{setSaving(false);}}
  return <main className="content"><p className="eyebrow">TÍCH HỢP / {provider.toUpperCase()}</p><h1 className="page-title">{labels[provider]??'Provider'}</h1><section className="card"><p className="notice">OAuth chưa được bật. Cần credentials, redirect URI và phê duyệt provider trước khi kết nối tài khoản khách hàng.</p>{error&&<p className="error">{error}</p>}<label>Client ID / App ID<input value={clientId} onChange={event=>setClientId(event.target.value)}/></label><label>Client Secret {data?.has_secret?'(đã lưu; để trống để giữ nguyên)':''}<input type="password" value={secret} onChange={event=>setSecret(event.target.value)}/></label><label>API version<input value={version} onChange={event=>setVersion(event.target.value)} placeholder={provider==='meta'?'v22.0':'Tùy chọn'}/></label><button className="button" disabled={saving} onClick={()=>void save()}>{saving?'Đang lưu…':'Lưu cấu hình'}</button></section></main>;
}
