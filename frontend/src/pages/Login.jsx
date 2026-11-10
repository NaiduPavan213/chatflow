import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/auth';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import SubmitButton from '../components/SubmitButton';
import Alert from '../components/Alert';

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
        <AuthLayout
            title="Welcome back"
            subtitle="Log in to pick up where you left off."
            footer={<>New to ChatFlow? <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Create an account</Link></>}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <FormField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                />
                <FormField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />

                {error && <Alert>{error}</Alert>}

                <SubmitButton loading={loading} loadingText="Logging in…">Log in</SubmitButton>
                {loading && (
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                        The first request can take up to a minute while the server wakes up.
                    </p>
                )}
            </form>
        </AuthLayout>
    );
}
