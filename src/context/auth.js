import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

/** True if the JWT is malformed or its `exp` claim is in the past. */
export function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return !payload.exp || payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}

export function clearStoredAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
}
