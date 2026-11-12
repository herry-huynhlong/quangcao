'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState(token ? 'Đang xác minh email…' : 'Liên kết xác minh không hợp lệ.');

  useEffect(() => {
    if (!token) return;
    let active = true;
    api<{ message: string }>('/v1/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then((response) => { if (active) setState(response.message); })
      .catch((error: unknown) => { if (active) setState(error instanceof Error ? error.message : 'Không thể xác minh email.'); });
    return () => { active = false; };
  }, [token]);

  return <main className="auth-page"><section className="card form"><h1>Xác minh email</h1><p>{state}</p></section></main>;
}

export default function Verify() {
  return <Suspense fallback={<main className="auth-page"><section className="card form"><h1>Xác minh email</h1><p>Đang chuẩn bị xác minh email…</p></section></main>}><VerifyContent /></Suspense>;
}
