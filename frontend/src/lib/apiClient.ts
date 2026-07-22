const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not defined. Check your .env file.');
}

export class ApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * バックエンドAPIへのPOSTリクエストを行う共通関数
 */
export async function postJson<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const errorBody: unknown = await response.json();
      if (
        errorBody &&
        typeof errorBody === 'object' &&
        typeof (errorBody as Record<string, unknown>).message === 'string'
      ) {
        message = (errorBody as Record<string, string>).message;
      }
    } catch {
      // レスポンスがJSONでない場合はデフォルトメッセージを維持
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<TResponse>;
}

/**
 * バックエンドAPIへのGETリクエストを行う共通関数
 */
export async function getJson<TResponse>(
  path: string,
  params?: Record<string, string>,
): Promise<TResponse> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  const response = await fetch(`${API_BASE_URL}${path}${query}`, {
    method: 'GET',
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const errorBody: unknown = await response.json();
      if (
        errorBody &&
        typeof errorBody === 'object' &&
        typeof (errorBody as Record<string, unknown>).message === 'string'
      ) {
        message = (errorBody as Record<string, string>).message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<TResponse>;
}

/**
 * バックエンドAPIへのPUTリクエストを行う共通関数
 */
export async function putJson<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const errorBody: unknown = await response.json();
      if (
        errorBody &&
        typeof errorBody === 'object' &&
        typeof (errorBody as Record<string, unknown>).message === 'string'
      ) {
        message = (errorBody as Record<string, string>).message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<TResponse>;
}
