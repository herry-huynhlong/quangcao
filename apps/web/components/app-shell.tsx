'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const nav = [['TỔNG QUAN', 'Tổng quan', '/app'], ['QUẢNG CÁO', 'Tài khoản quảng cáo của tôi', '/app/meta'], ['', 'Facebook & Instagram Ads', '/app/meta/manager'], ['', 'Google & YouTube Ads — Sắp ra mắt', '#'], ['', 'TikTok Ads — Sắp ra mắt', '#'], ['VẬN HÀNH', 'Chiến dịch', '/app/campaigns'], ['', 'Báo cáo', '/app/reports'], ['TÀI KHOẢN', 'Hồ sơ — Sắp ra mắt', '#'], ['', 'Hỗ trợ — Sắp ra mắt', '#']];
  async function logout() { try { await api('/v1/auth/logout', { method: 'POST' }); } finally { router.replace('/login'); } }
  const active = (href:string) => href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);
  return <div className="shell"><aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}><div className="brand"><span className="brand-mark">Q</span>{!collapsed && <span>QAVIO <b style={{ color: '#b5811d' }}>Ads</b></span>}</div>{nav.map(([group, label, href]) => <div key={label}>{group && !collapsed && <div className="side-label">{group}</div>}{href === '#' ? <span title="Tính năng chưa được tích hợp" className="nav-item disabled">{collapsed ? '•' : label}</span> : <Link onClick={()=>setOpen(false)} className={`nav-item ${active(href) ? 'active' : ''}`} href={href}>{collapsed ? '•' : label}</Link>}</div>)}</aside><main className="app-main"><header className="topbar"><button className="hamburger" onClick={() => { setOpen(!open); setCollapsed(!collapsed); }} aria-label="Mở hoặc thu gọn menu" aria-expanded={open || !collapsed}>☰</button><span className="muted">QAVIO Ads</span><span style={{ marginLeft: 'auto' }} className="muted">Hỗ trợ　🔔　QA　<button className="button secondary" type="button" onClick={logout}>Đăng xuất</button></span></header>{children}</main></div>;
}
