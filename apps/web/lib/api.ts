const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function messageFromBody(body: unknown) {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) {
    const unique = [...new Set(message.filter((item): item is string => typeof item === 'string'))];
    return unique.join(' ') || 'Dữ liệu gửi lên không hợp lệ.';
  }
  return typeof message === 'string' && message.trim() ? message : 'Không thể hoàn tất yêu cầu. Vui lòng thử lại sau.';
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiOrigin}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(messageFromBody(body), response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
