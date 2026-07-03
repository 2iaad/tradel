import axios from 'axios';

const api = axios.create({
    // ponytail: literal base URL — switch to NEXT_PUBLIC_API_URL when a deploy exists.
    baseURL: 'http://localhost:3000/api',
    withCredentials: true, // send/receive the httpOnly refresh cookie
});

// Access token lives in memory only (see .docs/access-and-refresh-tokens.md);
// the refresh token stays in the httpOnly cookie the backend sets.
let accessToken: string | null = null;

async function post(path: string, body?: Record<string, string>) {
    try {
        const { data } = await api.post(path, body);
        accessToken = data.accessToken;
        return data;
    } catch (err) {
        const m = axios.isAxiosError(err) ? err.response?.data?.message : null;
        throw new Error(Array.isArray(m) ? m[0] : (m ?? 'Something went wrong'));
    }
}

export const login = (email: string, password: string) => post('/auth/login', { email, password });

export const register = (username: string, email: string, password: string) =>
    post('/auth/register', { username, email, password });

// In-memory token if we have one, else try the refresh cookie.
// Returns null when there's no valid session.
export async function restoreSession(): Promise<string | null> {
    if (accessToken) return accessToken;
    try {
        const data = await post('/auth/refresh');
        return data.accessToken;
    } catch {
        return null; // invalid/expired refresh token
    }
}

export async function logout() {
    await api.post('/auth/logout');
    accessToken = null;
}
