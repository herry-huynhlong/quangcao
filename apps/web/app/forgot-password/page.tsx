'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';

export default function ForgotPassword() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    try { await api('/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: new FormData(event.currentTarget).get('email') }) }); setMessage('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể gửi yêu cầu.'); } finally { setLoading(false); }
  }
  return <main className="auth-page"><section className="auth-showcase"><span className="brand-mark">Q</span><p className="eyebrow">QAVIO ADS</p><h2>Khôi phục quyền truy cập an toàn.</h2><p>Chúng tôi sẽ gửi liên kết đặt lại mật khẩu nếu địa chỉ email của bạn hợp lệ.</p></section><form className="card form" onSubmit={submit}><p className="eyebrow">HỖ TRỢ TÀI KHOẢN</p><h1>Quên mật khẩu?</h1><p className="muted">Nhập email để nhận hướng dẫn đặt lại mật khẩu.</p><label>Email<input name="email" required type="email" autoComplete="email" /></label><button className="button" disabled={loading}>{loading ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}</button>{message && <p className="ok" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}<p className="muted"><Link href="/login">Quay về đăng nhập</Link></p></form></main>;
}
