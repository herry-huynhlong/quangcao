'use client';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { passwordValidationMessage, PASSWORD_POLICY_MESSAGE } from '../../../lib/password';

function Activate() { const token = useSearchParams().get('token') ?? ''; const router = useRouter(); const [uri, setUri] = useState(''); const [error, setError] = useState(''); const [codes, setCodes] = useState<string[]>([]);
  useEffect(() => { if (token) api<{otpauthUri:string}>('/v1/auth/admin-bootstrap/begin', { method: 'POST', body: JSON.stringify({ token }) }).then((value) => setUri(value.otpauthUri)).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Lời mời không hợp lệ.')); }, [token]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const passwordError = passwordValidationMessage(form.get('password')); if (passwordError) { setError(passwordError); return; } try { const result = await api<{recoveryCodes:string[]}>('/v1/auth/admin-bootstrap/complete', { method: 'POST', body: JSON.stringify({ token, password: form.get('password'), mfaCode: form.get('mfaCode') }) }); setCodes(result.recoveryCodes); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể kích hoạt.'); } }
  if (codes.length) return <main className="auth-page"><section className="card form"><h1>Lưu recovery codes</h1><p className="notice">Các mã này chỉ hiển thị một lần. Lưu chúng ở nơi an toàn.</p>{codes.map((code) => <code key={code} style={{ display: 'block', margin: 6 }}>{code}</code>)}<button className="button" onClick={() => router.replace('/login')}>Đến đăng nhập</button></section></main>;
  return <main className="auth-page"><form className="card form" onSubmit={submit}><p className="eyebrow">QAVIO ADS / OWNER ACTIVATION</p><h1>Kích hoạt Super Admin</h1><p className="muted">Thêm mã QR/TOTP này vào ứng dụng xác thực: {uri || 'Đang tải…'}</p><p className="muted">{PASSWORD_POLICY_MESSAGE}</p><label>Mật khẩu mới<input name="password" type="password" required autoComplete="new-password" /></label><label>Mã MFA<input name="mfaCode" inputMode="numeric" required maxLength={6} /></label><button className="button" disabled={!uri}>Kích hoạt</button>{error && <p className="error" role="alert">{error}</p>}</form></main>;
}
export default function AdminActivatePage() { return <Suspense fallback={<main className="auth-page"><p>Đang tải…</p></main>}><Activate /></Suspense>; }
