// USB device (or emulator with adb reverse tcp:8080 tcp:8080).
declare const __METROPOLITANO_API_URL__: string;
declare const __METROPOLITANO_AI_URL__: string;

const isBrowser = Boolean((globalThis as { document?: unknown }).document);
export const API_URL = isBrowser
  ? __METROPOLITANO_API_URL__
  : 'http://localhost:8080/api/v1/demo';
export const AI_API_URL = isBrowser
  ? __METROPOLITANO_AI_URL__
  : 'http://localhost:8001';
export async function request<T>(
  path: string,
  token?: string,
  method = 'GET',
  body?: unknown,
  key?: string,
  timeoutMs = 10000,
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
      throw new Error('La solicitud tardó demasiado. Intenta nuevamente.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function requestAi<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, undefined, 'POST', body, undefined, 15000, AI_API_URL);
}
