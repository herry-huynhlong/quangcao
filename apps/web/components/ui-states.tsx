'use client';
import Link from 'next/link';
import { ReactNode } from 'react';

export function PageHeader({eyebrow,title,children}:{eyebrow:string;title:string;children?:ReactNode}){return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1></div>{children&&<div className="page-actions">{children}</div>}</div>}
export function Alert({tone='info',children}:{tone?:'info'|'success'|'setup'|'warning'|'error';children:ReactNode}){return <div className={`alert alert-${tone}`} role={tone==='error'?'alert':'status'}>{children}</div>}
export function LoadingState({label='Đang tải dữ liệu…'}:{label?:string}){return <div className="loading-state" role="status"><i/><i/><i/><span>{label}</span></div>}
export function EmptyState({title,description,action}:{title:string;description:string;action?:ReactNode}){return <section className="empty-state"><h2>{title}</h2><p>{description}</p>{action}</section>}
export function ErrorState({message,onRetry}:{message:string;onRetry?:()=>void}){return <section className="error-state" role="alert"><h2>Không thể tải dữ liệu</h2><p>{message}</p>{onRetry&&<button className="button secondary" onClick={onRetry}>Thử lại</button>}</section>}
export function LoginRequired(){return <Alert tone="setup">Phiên đăng nhập đã hết hạn. <Link href="/login">Đăng nhập lại</Link> để tiếp tục.</Alert>}
