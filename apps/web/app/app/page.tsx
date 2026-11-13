import Link from 'next/link';

const items = [
  ['Tài khoản quảng cáo của tôi', 'Chưa có tài khoản quảng cáo được kết nối.', 'Kết nối Meta Ads khi quyền truy cập đã sẵn sàng.'],
  ['Chiến dịch', 'Chưa sẵn sàng', 'Tính năng quản lý chiến dịch đang được phát triển.'],
  ['Báo cáo', 'Chưa sẵn sàng', 'Báo cáo chỉ hiển thị khi có nguồn dữ liệu được cấp quyền.'],
];

export default function Dashboard() {
  return <main className="content">
    <div className="page-header"><div><p className="eyebrow">TỔNG QUAN</p><h1 className="page-title">Không gian quảng cáo của bạn</h1><p className="muted">Theo dõi các tài khoản được bạn ủy quyền trên QAVIO Ads.</p></div><Link className="button" href="/app/meta">Kết nối Meta Ads</Link></div>
    <section className="alert alert-setup"><b>Chưa có kết nối quảng cáo</b><br />Bắt đầu bằng việc kết nối một tài khoản Meta Ads. Google và TikTok sẽ được mở khi hoàn tất tích hợp.</section>
    <div className="grid three">{items.map(([title, status, description]) => <section className="card" key={title}><span className="status">{status}</span><h2>{title}</h2><p className="muted">{description}</p>{title === 'Tài khoản quảng cáo của tôi' && <Link className="button secondary" href="/app/meta">Xem kết nối</Link>}</section>)}</div>
  </main>;
}
