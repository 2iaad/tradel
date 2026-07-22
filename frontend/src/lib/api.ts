import axios from 'axios';

export const api = axios.create({
    // NEXT_PUBLIC_API_URL in prod (deployed backend); localhost fallback for dev.
    baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api`,
    withCredentials: true, // send/receive the httpOnly refresh cookie
});

// Access token lives in memory only (see .docs/access-and-refresh-tokens.md);
// the refresh token stays in the httpOnly cookie the backend sets.
let accessToken: string | null = null;

// Stores (or clears) the access token attached to every API request.
export function setAccessToken(token: string | null) {
    accessToken = token;
}

// Current in-memory access token, if any.
export function getAccessToken() {
    return accessToken;
}

api.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

// On 401 (expired access token), mint a new one from the refresh cookie and
// retry the request once. Auth routes are excluded so refresh can't loop.
api.interceptors.response.use(undefined, async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?.url?.startsWith('/auth/') || original._retried) {
        throw error;
    }
    original._retried = true;
    const { data } = await api.post('/auth/refresh');
    setAccessToken(data.accessToken);
    return api(original);
});

// Human-readable message from an API error (class-validator sends arrays).
export function apiMessage(err: unknown): string {
    const m = axios.isAxiosError(err) ? err.response?.data?.message : null;
    return Array.isArray(m) ? m[0] : (m ?? 'Something went wrong');
}
