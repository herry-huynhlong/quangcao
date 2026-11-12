'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Overview = { users: number; organizations: number; database: string; integrations: Record<string, string>; recentAudit: { action: string; entity: string; created_at: string }[] };
export default function AdminPage() {
  const [data, setData] = useState<Overview | null>(null); const [error, setError] = useState('');
  useEffect(() => { api<Overview>('/v1/admin/overview').then(setData).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Không thể tải khu vực quản trị.')); }, []);
  if (error) return <main className="auth-page"><section className="card form"><h1>Quản trị hệ thống</h1><p className="error" role="alert">{error}</p></section></main>;
  if (!data) return <main className="auth-page"><p className="muted">Đang xác minh phiên Super Admin…</p></main>;
  return <main className="content"><p className="eyebrow">QAVIO ADS / SUPER ADMIN</p><h1 className="page-title">Tổng quan hệ thống</h1><div className="grid three"><section className="card"><b>Người dùng thực tế</b><h2>{data.users}</h2></section><section className="card"><b>Tổ chức thực tế</b><h2>{data.organizations}</h2></section><section className="card"><b>Database</b><h2>{data.database}</h2></section></div><section className="card" style={{ marginTop: 20 }}><h2>Tích hợp</h2>{Object.entries(data.integrations).map(([name, status]) => <p className="muted" key={name}>{name}: <b>{status === 'configured' ? 'Đã cấu hình' : 'Chưa cấu hình'}</b></p>)}</section><section className="card" style={{ marginTop: 20 }}><h2>Nhật ký gần đây</h2>{data.recentAudit.length ? data.recentAudit.map((log, index) => <p className="muted" key={index}>{new Date(log.created_at).toLocaleString('vi-VN')} — {log.action} ({log.entity})</p>) : <p className="muted">Chưa có nhật ký.</p>}</section></main>;
}
