'use client';

import Link from 'next/link';

export default function PartnerConfig() {
  return <main className="content"><p className="eyebrow">META / TÙY CHỌN TỰ ĐỘNG HÓA</p><h1 className="page-title">Business Partner API không được dùng trong luồng hiện tại</h1><section className="notice">Quy trình QAVIO hiện tại là thủ công: khách gửi ID tài khoản và brief quảng cáo → Admin kiểm tra/chấp nhận quyền trực tiếp trên Facebook → QAVIO tự thiết lập chiến dịch. Không cần System User token, dò Business Portfolio hay tự động xác minh tại đây.</section><p className="muted" style={{marginTop:16}}>Lỗi HTTP 403 mà trang này hiển thị trước đó thuộc bước kiểm tra Marketing API tự động. Nó không ảnh hưởng đến việc gửi yêu cầu thủ công. Cấu hình Meta OAuth Admin vẫn nằm trong trang Kết nối API.</p><p className="page-actions"><Link className="button" href="/admin/ads/meta/requests">Mở hàng đợi yêu cầu khách hàng</Link><Link className="button secondary" href="/admin/ads/meta">Trạng thái OAuth Admin</Link><Link className="button secondary" href="/admin/integrations">Kết nối API</Link></p></main>;
}
