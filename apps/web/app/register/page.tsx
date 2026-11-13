'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE, passwordValidationMessage } from '../../lib/password';

export default function Register() {
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [show,setShow]=useState(false); const [loading,setLoading]=useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setLoading(true);
    setMessage('');
    const data = new FormData(event.currentTarget);
    const passwordError = passwordValidationMessage(data.get('password'));
    if (passwordError) { setError(passwordError); setLoading(false); return; }
    if(data.get('password')!==data.get('confirmPassword')){setError('Xác nhận mật khẩu chưa khớp.');setLoading(false);return;}
    if(!data.get('terms')){setError('Bạn cần đồng ý điều khoản sử dụng và chính sách quyền riêng tư.');setLoading(false);return;}
    try {
      const response = await api<{ message: string }>('/v1/auth/register', {
        method: 'POST', body: JSON.stringify({ fullName: data.get('fullName'), email: data.get('email'), password: data.get('password') }),
      });
      setMessage(response.message);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể đăng ký.'); } finally { setLoading(false); }
  }

  return <main className="auth-page"><section className="auth-showcase"><span className="brand-mark">Q</span><p className="eyebrow">QAVIO ADS</p><h2>Bắt đầu với một tài khoản cá nhân.</h2><p>Kết nối nhiều tài khoản quảng cáo được ủy quyền trong cùng một không gian làm việc.</p></section><form className="card form" onSubmit={submit} noValidate>
    <p className="eyebrow">QAVIO ADS</p><h1>Tạo tài khoản</h1><p className="muted">{PASSWORD_POLICY_MESSAGE}</p>
    <label>Họ và tên<input required name="fullName" type="text" autoComplete="name" maxLength={120} /></label><p className="field-help">Dùng để hiển thị trong hồ sơ tài khoản của bạn.</p>
    <label>Email<input required name="email" type="email" autoComplete="email" /></label>
    <label>Mật khẩu<input required name="password" type={show?'text':'password'} minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" /></label><label>Xác nhận mật khẩu<input required name="confirmPassword" type={show?'text':'password'} minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" /></label><label className="check"><input type="checkbox" checked={show} onChange={event=>setShow(event.target.checked)}/> Hiện mật khẩu</label><label className="check"><input required name="terms" type="checkbox"/> Tôi đồng ý điều khoản sử dụng và chính sách quyền riêng tư.</label>
    <button className="button" disabled={loading} type="submit">{loading?'Đang tạo tài khoản…':'Đăng ký'}</button>{message && <p className="ok" role="status">{message} Hãy kiểm tra hộp thư để xác minh email.</p>}{error && <p className="error" role="alert">{error}</p>}
    <p className="muted"><Link href="/">Trang chủ</Link> · <Link href="/login">Đã có tài khoản? Đăng nhập</Link></p>
  </form></main>;
}
