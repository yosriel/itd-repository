// USB device (or emulator with adb reverse tcp:8080 tcp:8080).
export const API_URL = (globalThis as { document?: unknown }).document
  ? '/api/v1/demo'
  : 'http://localhost:8080/api/v1/demo';
export async function request<T>(
  path: string,
  token?: string,
  method = 'GET',
  body?: unknown,
  key?: string,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
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
      throw new Error('No se pudo conectar con Spring en 10 segundos');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
