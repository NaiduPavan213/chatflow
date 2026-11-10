import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/auth';

export default function Login() {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(
        searchParams.get('expired') ? 'Your session expired. Please log in again.' : ''
    );
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.username);
            navigate('/rooms');
        } catch (err) {
            setError(getErrorMessage(err, 'Invalid email or password'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
            <div className="w-full max-w-md bg-[#16213e] rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-2">💬</div>
                    <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
                    <p className="text-[#8e9297] text-sm mt-1">We're so excited to see you again!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#8e9297] uppercase mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full bg-[#1a1a2e] text-white px-3 py-2 rounded-md border border-[#2d2f3e] focus:outline-none focus:border-[#5865f2] transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#8e9297] uppercase mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="w-full bg-[#1a1a2e] text-white px-3 py-2 rounded-md border border-[#2d2f3e] focus:outline-none focus:border-[#5865f2] transition"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-2 rounded-md transition disabled:opacity-50"
                    >
                        {loading ? 'Logging in…' : 'Log In'}
                    </button>
                    {loading && (
                        <p className="text-[#8e9297] text-xs text-center">
                            The first request can take up to a minute while the server wakes up.
                        </p>
                    )}
                </form>

                <p className="text-[#8e9297] text-sm mt-4">
                    Need an account?{' '}
                    <Link to="/register" className="text-[#5865f2] hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
