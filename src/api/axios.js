import axios from 'axios';
import { clearStoredAuth } from '../context/auth';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const WS_URL = `${API_URL.replace(/\/api\/?$/, '')}/ws`;

const api = axios.create({
    baseURL: API_URL,
    // The free Render backend can take ~1 minute to wake up
    timeout: 70000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthCall = error.config?.url?.startsWith('/auth/');
        if (error.response?.status === 401 && !isAuthCall) {
            // Token expired or user no longer exists: start over at the login page
            clearStoredAuth();
            window.location.assign('/login?expired=1');
        }
        return Promise.reject(error);
    }
);

/** A message to show the user for a failed request. */
export function getErrorMessage(error, fallback = 'Something went wrong') {
    if (!error.response) {
        return 'Cannot reach the server. It may be waking up, so try again in a few seconds.';
    }
    return error.response.data?.message || fallback;
}

export default api;
