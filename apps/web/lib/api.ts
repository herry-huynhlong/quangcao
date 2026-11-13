const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code: 'TIMEOUT' | 'NETWORK' | 'HTTP' = 'HTTP') { super(message); }
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
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 12_000));
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  let response: Response;
  try {
    const headers = new Headers(options.headers);
    if (typeof options.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    response = await fetch(`${apiOrigin}${path}`, { ...options, signal: controller.signal, credentials: 'include', headers });
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError('Yêu cầu mất quá lâu hoặc đã bị hủy. Vui lòng thử lại.', 0, 'TIMEOUT');
    throw new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng rồi thử lại.', 0, 'NETWORK');
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const fallback = response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.' : response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : response.status === 429 ? 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ít phút.' : response.status >= 500 ? 'Dịch vụ đang gặp sự cố tạm thời. Vui lòng thử lại.' : 'Không thể hoàn tất yêu cầu. Vui lòng kiểm tra dữ liệu.';
    const message = body ? messageFromBody(body) : fallback;
    if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qavio:session-expired'));
    throw new ApiError(message === 'Không thể hoàn tất yêu cầu. Vui lòng thử lại sau.' ? fallback : message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
