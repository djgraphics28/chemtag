function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': getCsrfToken(),
            ...(init.headers ?? {}),
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw Object.assign(new Error(data?.message ?? `HTTP ${response.status}`), {
            status: response.status,
            data,
        });
    }

    return data as T;
}
