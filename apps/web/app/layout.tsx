import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QAVIO Ads',
  description: 'Nền tảng quảng cáo QAVIO',
};

// The stylesheet is also embedded in the document so the initial UI remains
// usable if a proxy/browser extension delays a Next static asset request.
const criticalStyles = `:root{--ink:#1f2937;--muted:#718096;--paper:#fff;--canvas:#f5f7fb;--line:#e5eaf1;--gold:#f4c75b;--blue:#2563eb;--danger:#dc2626}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--canvas);color:var(--ink);font-family:Arial,"Noto Sans",sans-serif;font-synthesis:none}a{color:var(--blue);text-decoration:none}.shell{display:flex;min-height:100vh}.sidebar{width:252px;background:#fff;border-right:1px solid var(--line);padding:20px 12px;transition:width .2s}.sidebar.collapsed{width:68px}.brand{font-weight:800;font-size:19px;display:flex;gap:10px;align-items:center;padding:0 8px 26px}.brand-mark{width:38px;height:38px;border-radius:13px;background:var(--gold);display:grid;place-items:center}.side-label{font-size:10px;letter-spacing:1.2px;color:#8a9ab2;font-weight:bold;padding:20px 12px 7px}.nav-item{display:block;padding:10px 12px;border-radius:10px;color:#53657e;font-size:14px}.nav-item.active{background:#fff2cf;color:#956918;font-weight:bold}.nav-item.disabled{opacity:.6;cursor:not-allowed}.topbar{height:73px;border-bottom:1px solid var(--line);background:#fff;display:flex;align-items:center;gap:18px;padding:0 32px}.hamburger{background:#fff;border:1px solid var(--line);border-radius:10px;width:42px;height:42px;font-size:20px;cursor:pointer}.content{width:100%;max-width:1440px;margin:0 auto;padding:30px}.app-main{min-width:0;flex:1}.eyebrow{color:#b5811d;font-size:12px;font-weight:bold;letter-spacing:1px}.page-title{font-size:30px;margin:8px 0}.muted{color:var(--muted);font-size:14px}.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px}.grid{display:grid;gap:16px}.grid.three{grid-template-columns:repeat(3,1fr)}.notice{border:1px solid #f1d087;background:#fff9e9;border-radius:13px;padding:17px;color:#8b651d}.button{border:0;border-radius:10px;padding:12px 16px;background:var(--gold);font-weight:bold;color:#293543;cursor:pointer}.button.secondary{background:#fff;border:1px solid var(--line)}.button:disabled{opacity:.55;cursor:not-allowed}.form{max-width:430px;margin:50px auto}.form label{display:block;margin:16px 0 6px;font-size:14px;font-weight:bold}.form input{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:9px;font-size:15px}.error{color:var(--danger);margin-top:12px}.success{color:#16803e;margin-top:12px}.auth-page{min-height:100vh;display:grid;place-items:center;padding:20px}.status{font-size:12px;border-radius:20px;padding:6px 10px;background:#fff2df;color:#b56518;font-weight:bold}@media(max-width:700px){.sidebar{position:fixed;z-index:3;height:100vh;transform:translateX(-100%)}.sidebar.open{transform:translateX(0)}.topbar{padding:0 16px}.content{padding:20px 16px}.grid.three{grid-template-columns:1fr}.page-title{font-size:26px}}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
        {children}
      </body>
    </html>
  );
}
