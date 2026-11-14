'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';

const nav = [
  ['TỔNG QUAN', 'Tổng quan', '/app'], ['QUẢNG CÁO', 'Tài khoản quảng cáo của tôi', '/app/meta'], ['', 'Facebook & Instagram Ads', '/app/meta/manager'], ['', 'Google & YouTube Ads — Sắp ra mắt', '#'], ['', 'TikTok Ads — Sắp ra mắt', '#'], ['VẬN HÀNH', 'Chiến dịch', '/app/campaigns'], ['', 'Báo cáo', '/app/reports'], ['TÀI KHOẢN', 'Hồ sơ — Sắp ra mắt', '#'], ['', 'Hỗ trợ — Sắp ra mắt', '#'],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false); const router = useRouter(); const pathname = usePathname();
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  async function logout() { try { await api('/v1/auth/logout', { method: 'POST' }); } finally { router.replace('/login'); } }
  const active = (href: string) => href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);
  return <div className="shell"><button aria-label="Đóng menu" className={`sidebar-backdrop ${drawerOpen ? 'show' : ''}`} onClick={() => setDrawerOpen(false)} />
    <aside className={`sidebar ${drawerOpen ? 'open' : ''}`}><div className="brand"><span className="brand-mark">Q</span><span>QAVIO <b>Ads</b></span><button className="sidebar-close" aria-label="Đóng menu" onClick={() => setDrawerOpen(false)}>×</button></div>{nav.map(([group, label, href]) => <div key={label}>{group && <div className="side-label">{group}</div>}{href === '#' ? <span title="Tính năng chưa được tích hợp" className="nav-item disabled">{label}</span> : <Link onClick={() => setDrawerOpen(false)} className={`nav-item ${active(href) ? 'active' : ''}`} href={href}>{label}</Link>}</div>)}</aside>
    <main className="app-main"><header className="topbar"><button className="hamburger" onClick={() => setDrawerOpen(true)} aria-label="Mở menu" aria-expanded={drawerOpen}>☰</button><span className="muted">QAVIO Ads</span><span className="top-actions">Hỗ trợ　🔔　QA　<button className="button secondary" type="button" onClick={logout}>Đăng xuất</button></span></header>{children}</main></div>;
}
