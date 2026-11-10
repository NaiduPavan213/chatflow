import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/auth';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import SubmitButton from '../components/SubmitButton';
import Alert from '../components/Alert';

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
        <AuthLayout
            title="Create your account"
            subtitle="It takes less than a minute."
            footer={<>Already have an account? <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Log in</Link></>}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <FormField
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="How others will see you"
                    autoComplete="username"
                    minLength={3}
                    maxLength={30}
                    required
                />
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
                    hint="At least 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={100}
                    required
                />

                {error && <Alert>{error}</Alert>}

                <SubmitButton loading={loading} loadingText="Creating account…">Create account</SubmitButton>
            </form>
        </AuthLayout>
    );
}
