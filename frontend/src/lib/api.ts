import axios from 'axios';

export const api = axios.create({
    // ponytail: literal base URL — switch to NEXT_PUBLIC_API_URL when a deploy exists.
    baseURL: 'http://localhost:3000/api',
    withCredentials: true, // send/receive the httpOnly refresh cookie
});
