import { useState } from 'react';
import { AuthContext, clearStoredAuth, isTokenExpired } from './auth';

function readStoredAuth() {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
        clearStoredAuth();
        return { token: null, username: null };
    }
    return { token, username: localStorage.getItem('username') };
}

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(readStoredAuth);

    const login = (token, username) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setAuth({ token, username });
    };

    const logout = () => {
        clearStoredAuth();
        setAuth({ token: null, username: null });
    };

    return (
        <AuthContext.Provider value={{ ...auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
