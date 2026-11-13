'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE, passwordValidationMessage } from '../../lib/password';

function ResetContent() {
  const token = useSearchParams().get('token'); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const password = form.get('password'); const validation = passwordValidationMessage(password); if (!token) { setError('Liên kết đặt lại mật khẩu không hợp lệ.'); return; } if (validation) { setError(validation); return; } if (password !== form.get('confirmPassword')) { setError('Xác nhận mật khẩu chưa khớp.'); return; } setLoading(true); setError(''); try { await api('/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }); setMessage('Mật khẩu đã được đặt lại. Bạn có thể đăng nhập ngay bây giờ.'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể đặt lại mật khẩu.'); } finally { setLoading(false); } }
  return <main className="auth-page"><section className="auth-showcase"><span className="brand-mark">Q</span><p className="eyebrow">QAVIO ADS</p><h2>Thiết lập mật khẩu mới.</h2><p>Liên kết đặt lại chỉ sử dụng được trong thời gian giới hạn để bảo vệ tài khoản của bạn.</p></section><form className="card form" onSubmit={submit}><p className="eyebrow">BẢO MẬT TÀI KHOẢN</p><h1>Đặt lại mật khẩu</h1><p className="muted">{PASSWORD_POLICY_MESSAGE}</p><label>Mật khẩu mới<input name="password" required type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" /></label><label>Xác nhận mật khẩu<input name="confirmPassword" required type="password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" /></label><button className="button" disabled={loading || !token}>{loading ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}</button>{message && <p className="ok" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}<p className="muted"><Link href="/login">Quay về đăng nhập</Link></p></form></main>;
}
export default function ResetPassword() { return <Suspense fallback={<main className="auth-page"><p>Đang tải…</p></main>}><ResetContent /></Suspense>; }
