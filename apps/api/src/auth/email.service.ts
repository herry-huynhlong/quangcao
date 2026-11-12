import { Injectable, ServiceUnavailableException } from '@nestjs/common';
@Injectable()
export class EmailService {
  private get configured() { return process.env.EMAIL_PROVIDER === 'resend' && Boolean(process.env.RESEND_API_KEY) && Boolean(process.env.EMAIL_FROM); }
  get verificationConfigured() { return this.configured; }
  async sendVerification(email: string, token: string) {
    if (!this.configured) throw new ServiceUnavailableException('Xác minh email chưa được cấu hình. Quản trị viên cần cấp nhà cung cấp email hợp lệ.');
    const link = `${process.env.WEB_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: email, subject: 'Xác minh tài khoản QAVIO Ads', html: `<p>Nhấn vào liên kết để xác minh tài khoản: <a href="${link}">Xác minh email</a></p>` }) });
    if (!response.ok) throw new ServiceUnavailableException('Không thể gửi email xác minh. Vui lòng thử lại sau.');
  }
  async sendPasswordReset(email: string, token: string) {
    if (!this.configured) throw new ServiceUnavailableException('Đặt lại mật khẩu chưa được cấu hình email.');
    const link = `${process.env.WEB_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`;
    const response = await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' }, body:JSON.stringify({ from:process.env.EMAIL_FROM, to:email, subject:'Đặt lại mật khẩu QAVIO Ads', html:`<p>Liên kết đặt lại mật khẩu: <a href="${link}">Đặt lại mật khẩu</a></p>` }) });
    if (!response.ok) throw new ServiceUnavailableException('Không thể gửi email đặt lại mật khẩu.');
  }
}
