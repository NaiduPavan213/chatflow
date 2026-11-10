import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/auth';

const inputClass =
    'w-full bg-[#1a1a2e] text-white px-3 py-2 rounded-md border border-[#2d2f3e] focus:outline-none focus:border-[#5865f2] transition';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', { username, email, password });
            login(res.data.token, res.data.username);
            navigate('/rooms');
        } catch (err) {
            setError(getErrorMessage(err, 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
            <div className="w-full max-w-md bg-[#16213e] rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-2">💬</div>
                    <h1 className="text-2xl font-bold text-white">Create an account</h1>
                    <p className="text-[#8e9297] text-sm mt-1">Join ChatFlow today!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#8e9297] uppercase mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            maxLength={30}
                            autoComplete="username"
                            className={inputClass}
                        />
                    </div>
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
                            className={inputClass}
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
                            minLength={6}
                            maxLength={100}
                            autoComplete="new-password"
                            className={inputClass}
                        />
                        <p className="text-[#8e9297] text-xs mt-1">At least 6 characters</p>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-2 rounded-md transition disabled:opacity-50"
                    >
                        {loading ? 'Creating account…' : 'Continue'}
                    </button>
                </form>

                <p className="text-[#8e9297] text-sm mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#5865f2] hover:underline">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
}
