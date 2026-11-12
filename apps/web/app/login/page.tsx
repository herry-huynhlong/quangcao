'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [error, setError] = useState('');
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); const data = new FormData(event.currentTarget);
    try {
      await api('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password'), mfaCode: data.get('mfaCode') || undefined }) });
      router.replace('/app');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể đăng nhập.'); }
  }
  return <main className="auth-page"><form className="card form" onSubmit={submit} noValidate>
    <p className="eyebrow">QAVIO ADS</p><h1>Đăng nhập</h1>
    <label>Email<input required name="email" type="email" autoComplete="email" /></label>
    <label>Mật khẩu<input required name="password" type="password" maxLength={256} autoComplete="current-password" /></label>
    <label>Mã xác thực (chỉ Super Admin)<input name="mfaCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" /></label>
    <button className="button" type="submit">Đăng nhập</button>{error && <p className="error" role="alert">{error}</p>}
    <p className="muted"><Link href="/register">Tạo tài khoản</Link> · Quên mật khẩu chỉ mở khi email vận hành được cấu hình.</p>
  </form></main>;
}
