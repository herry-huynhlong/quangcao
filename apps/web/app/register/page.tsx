'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE, passwordValidationMessage } from '../../lib/password';

export default function Register() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const data = new FormData(event.currentTarget);
    const passwordError = passwordValidationMessage(data.get('password'));
    if (passwordError) { setError(passwordError); return; }
    try {
      const response = await api<{ message: string }>('/v1/auth/register', {
        method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
      });
      setMessage(response.message);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể đăng ký.'); }
  }

  return <main className="auth-page"><form className="card form" onSubmit={submit} noValidate>
    <p className="eyebrow">QAVIO ADS</p><h1>Tạo tài khoản</h1><p className="muted">{PASSWORD_POLICY_MESSAGE}</p>
    <label>Email<input required name="email" type="email" autoComplete="email" /></label>
    <label>Mật khẩu<input required name="password" type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" /></label>
    <button className="button" type="submit">Đăng ký</button>{message && <p className="success" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
    <p className="muted"><Link href="/login">Đăng nhập</Link></p>
  </form></main>;
}
