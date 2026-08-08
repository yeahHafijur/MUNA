import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/google-login', { credentials: 'include', 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Google login failed');
            }

            login({
                _id: data._id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                profilePic: data.profilePic
            }, data.token);

            if (data.role === 'vendor') {
                navigate('/vendor');
            } else if (data.role === 'super_admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google Sign-In failed. Please try again.');
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 inset-x-0 h-64 bg-brand-400 rounded-b-[40px] shadow-sm -z-10" />

            {/* Login Card */}
            <div className="w-full max-w-[360px] card p-8 sm:p-10 relative z-10 mt-10">
                
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex items-center justify-center p-2 bg-white ring-4 ring-white shadow-card">
                        <img src="/muna-logo-new.png" alt="Muna Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Welcome to MUNA</h1>
                    <p className="text-sm font-semibold text-slate-500">
                        Sign in to continue
                    </p>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-[13px] font-bold mb-6 flex items-start gap-2.5">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Google Sign-In */}
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:!w-full [&_iframe]:!w-full drop-shadow-sm transition-transform active:scale-[0.98]">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                size="large"
                                text="continue_with"
                                shape="rectangular"
                                theme="outline"
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-2 space-x-1.5 opacity-60">
                            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-[11px] font-bold text-slate-400">
                    By signing in, you agree to our <br />
                    <span className="text-brand-600 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-brand-600 cursor-pointer hover:underline">Privacy Policy</span>.
                </div>
            </div>
        </div>
    );
};

export default Login;