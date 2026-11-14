'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const groups: [string, string[][]][] = [['TỔNG QUAN', [['Dashboard', '/admin']]], ['KHÁCH HÀNG', [['Quản lý người dùng', '/admin/users'], ['Tài khoản quảng cáo', '/admin/ads/meta']]], ['QUẢNG CÁO', [['Facebook & Instagram Ads', '/admin/ads/meta'], ['Google & YouTube Ads', '/admin/ads/google'], ['TikTok Ads', '/admin/ads/tiktok']]], ['TÀI CHÍNH', [['Cấu hình phí dịch vụ', '/admin/finance/fees']]], ['BẢO MẬT', [['Quản trị viên', '/admin/security'], ['Quản lý phiên', '/admin/sessions'], ['Nhật ký hoạt động', '/admin/audit']]], ['CẤU HÌNH', [['Cấu hình hệ thống', '/admin/settings'], ['Kết nối API', '/admin/integrations']]]];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false); const [expired, setExpired] = useState(false); const path = usePathname(); const router = useRouter();
  useEffect(() => { const handler = () => setExpired(true); const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); }; window.addEventListener('qavio:session-expired', handler); window.addEventListener('keydown', close); return () => { window.removeEventListener('qavio:session-expired', handler); window.removeEventListener('keydown', close); }; }, []);
  async function logout() { try { await api('/v1/auth/logout', { method: 'POST' }); } finally { router.replace('/login'); } }
  const active = (href: string) => href === '/admin' ? path === '/admin' : path === href || path.startsWith(`${href}/`);
  return <div className="shell"><button aria-label="Đóng menu" className={`sidebar-backdrop ${drawerOpen ? 'show' : ''}`} onClick={() => setDrawerOpen(false)} /><aside className={`sidebar ${drawerOpen ? 'open' : ''}`}><div className="brand"><span className="brand-mark">Q</span><span>QAVIO <b>ADS</b></span><button className="sidebar-close" aria-label="Đóng menu" onClick={() => setDrawerOpen(false)}>×</button></div>{groups.map(([title, links]) => <section key={title}><div className="side-label">{title}</div>{links.map(([label, href]) => <Link onClick={() => setDrawerOpen(false)} key={label} className={`nav-item ${active(href) ? 'active' : ''}`} href={href}>{label}</Link>)}</section>)}</aside><main className="app-main"><header className="topbar"><button className="hamburger" aria-label="Mở menu" onClick={() => setDrawerOpen(true)}>☰</button><div className="top-identity"><b>QAVIO Ads</b><span className="top-sub">Super Admin</span></div><span className="status">Phiên đang hoạt động</span><button className="button secondary" onClick={logout}>Đăng xuất</button></header>{expired && <div className="session-alert">Phiên đăng nhập đã hết hạn. <Link href="/login">Đăng nhập lại</Link></div>}{children}</main></div>;
}
