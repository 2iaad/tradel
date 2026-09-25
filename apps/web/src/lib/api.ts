import axios from 'axios';

export const api = axios.create({
    // NEXT_PUBLIC_API_URL in prod (deployed backend); localhost fallback for dev.
    baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api`,
    withCredentials: true, // send and receive the HttpOnly auth cookies
});

const NO_REFRESH_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/auth/google',
    '/auth/refresh',
    '/auth/logout',
];
let refreshRequest: Promise<void> | null = null;

function refreshAccessCookie() {
    if (!refreshRequest) {
        refreshRequest = api
            .post('/auth/refresh')
            .then(() => undefined)
            .finally(() => {
                refreshRequest = null;
            });
    }

    return refreshRequest;
}

// On 401, refresh the access cookie and retry the request once.
api.interceptors.response.use(undefined, async (error) => {
    const original = error.config;
    const skipRefresh = NO_REFRESH_ROUTES.some((route) => original?.url?.startsWith(route));

    if (error.response?.status !== 401 || !original || skipRefresh || original._retried) {
        throw error;
    }

    original._retried = true;

    try {
        await refreshAccessCookie();
    } catch (refreshError) {
        throw refreshError;
    }

    return api(original);
});

// Human-readable message from an API error (class-validator sends arrays).
export function apiMessage(err: unknown): string {
    const m = axios.isAxiosError(err) ? err.response?.data?.message : null;
    if (Array.isArray(m)) return m[0];
    if (typeof m === 'string') return m;
    return err instanceof Error ? err.message : 'Something went wrong';
}
