'use client';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { passwordValidationMessage, PASSWORD_POLICY_MESSAGE } from '../../../lib/password';

function Activate() { const token = useSearchParams().get('token') ?? ''; const router = useRouter(); const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const passwordError = passwordValidationMessage(form.get('password')); if (passwordError) { setError(passwordError); return; } try { await api('/v1/auth/admin-bootstrap/complete', { method: 'POST', body: JSON.stringify({ token, password: form.get('password') }) }); router.replace('/login'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể kích hoạt.'); } }
  return <main className="auth-page"><form className="card form" onSubmit={submit}><p className="eyebrow">QAVIO ADS / OWNER ACTIVATION</p><h1>Kích hoạt Super Admin</h1><p className="muted">{PASSWORD_POLICY_MESSAGE}</p><label>Mật khẩu mới<input name="password" type="password" required autoComplete="new-password" /></label><button className="button" disabled={!token}>Kích hoạt</button>{error && <p className="error" role="alert">{error}</p>}</form></main>;
}
export default function AdminActivatePage() { return <Suspense fallback={<main className="auth-page"><p>Đang tải…</p></main>}><Activate /></Suspense>; }
