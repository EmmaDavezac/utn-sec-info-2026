export class ApiError extends Error {
    constructor(public status: number, public message: string, public data?: any) {
        super(message);
        this.name = 'ApiError';
    }
}

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
}

async function request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...DEFAULT_HEADERS,
            ...options.headers,
        },
    });

    if (!response.ok) {
        // Intentamos obtener el mensaje de error del backend, si no existe usamos el statusText
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.message || response.statusText, errorData);
    }

    // Manejo de respuestas vacías (ej: 204 No Content)
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export const api = {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(url: string, body?: any) => request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(url: string, body: any) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}