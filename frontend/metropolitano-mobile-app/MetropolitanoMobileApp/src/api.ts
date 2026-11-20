import { API_URL, AI_API_URL } from './endpoints';
export { API_URL, AI_API_URL };
export async function request<T>(
  path: string,
  token?: string,
  method = 'GET',
  body?: unknown,
  key?: string,
  timeoutMs = 120000,
  baseUrl = API_URL,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail ??
          error.message ??
          `Solicitud fallida (${response.status})`,
      );
    }
    return response.status === 204 ? (undefined as T) : await response.json();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        'La conexión tardó demasiado. El servidor puede estar iniciándose; espera un momento y vuelve a intentarlo.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function requestAi<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, undefined, 'POST', body, undefined, 120000, AI_API_URL);
}
