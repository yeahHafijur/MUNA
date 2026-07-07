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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans text-gray-900">

            {/* Absolute Minimalist Card */}
            <div className="w-full max-w-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">

                {/* Clean Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center p-1 bg-white">
                        <img src="/muna-logo-new.png" alt="Muna Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to MUNA</h1>
                    <p className="text-sm font-medium text-gray-500">
                        Sign in to your account to continue
                    </p>
                </div>

                {/* Serious Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium mb-6 flex items-start gap-2.5">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Fixed Google Sign-In Stretch */}
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:!w-full [&_iframe]:!w-full">
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

                    {/* Subtle Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center gap-2 text-gray-500 text-sm font-medium py-2">
                            <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Authenticating...
                        </div>
                    )}

                    {/* Clean Typography Footer */}
                    <div className="pt-6 mt-2">
                        <p className="text-[11px] font-medium text-gray-400 text-center uppercase tracking-wider leading-relaxed">
                            By continuing, you agree to our <br />
                            <a href="#" className="text-gray-900 hover:underline transition-all">Terms of Service</a> & <a href="#" className="text-gray-900 hover:underline transition-all">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Minimal Watermark */}
            <div className="absolute bottom-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                MUNA Platform
            </div>
        </div>
    );
};

export default Login;