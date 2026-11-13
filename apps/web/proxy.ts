import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const accept = request.headers.get('accept') ?? '';
  if (!accept.includes('text/html')) return NextResponse.next();
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'] };
