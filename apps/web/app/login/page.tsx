'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [error, setError] = useState(''); const [showPassword,setShowPassword]=useState(false); const [loading,setLoading]=useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true); const data = new FormData(event.currentTarget);
    try {
      await api('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
      router.replace('/app');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể đăng nhập.'); } finally { setLoading(false); }
  }
  return <main className="auth-page"><section className="auth-showcase"><span className="brand-mark">Q</span><p className="eyebrow">QAVIO ADS</p><h2>Quản lý quảng cáo rõ ràng, tập trung.</h2><p>Kết nối tài khoản được ủy quyền và theo dõi trạng thái vận hành trong một không gian duy nhất.</p></section><form className="card form" onSubmit={submit} noValidate>
    <p className="eyebrow">QAVIO ADS</p><h1>Đăng nhập</h1>
    <label>Email<input required name="email" type="email" autoComplete="email" /></label>
    <label>Mật khẩu<input required name="password" type={showPassword?'text':'password'} maxLength={256} autoComplete="current-password" /></label><label className="check"><input type="checkbox" checked={showPassword} onChange={event=>setShowPassword(event.target.checked)}/> Hiện mật khẩu</label>
    <p className="form-link"><Link href="/forgot-password">Quên mật khẩu?</Link></p><button className="button" disabled={loading} type="submit">{loading?'Đang đăng nhập…':'Đăng nhập'}</button>{error && <p className="error" role="alert">{error}</p>}
    <p className="muted"><Link href="/">Trang chủ</Link> · <Link href="/register">Chưa có tài khoản? Đăng ký ngay</Link></p>
  </form></main>;
}
