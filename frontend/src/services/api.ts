/**
 * MedTwin API Base Client
 * Handles HTTP requests, JWT authorization headers, and central 401 callbacks.
 */

const TOKEN_KEY = 'medtwin_token';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = (): void => localStorage.removeItem(TOKEN_KEY);

let _onUnauthorized: (() => void) | null = null;
export const registerUnauthorizedCallback = (cb: () => void) => { _onUnauthorized = cb; };

export async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined,
  });

  if (response.status === 401) {
    clearStoredToken();
    _onUnauthorized?.();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(response.status, `Server returned non-JSON response (${response.status})`);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      json.message || json.error || `Request failed with status ${response.status}`,
      json
    );
  }

  return (json.data ?? json) as T;
}

export const get = <T>(path: string) => apiRequest<T>('GET', path);
export const post = <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body);
export const put = <T>(path: string, body?: unknown) => apiRequest<T>('PUT', path, body);
export const patch = <T>(path: string, body?: unknown) => apiRequest<T>('PATCH', path, body);
export const del = <T>(path: string) => apiRequest<T>('DELETE', path);
export const postForm = <T>(path: string, formData: FormData) =>
  apiRequest<T>('POST', path, formData, true);
