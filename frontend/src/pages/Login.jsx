import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Google Login Success Handler
    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Google login failed');
            }

            // Success! Save user and token in Context
            login({
                _id: data._id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                profilePic: data.profilePic
            }, data.token);

            // Redirect based on role
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
        <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">

            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Login Card */}
            <div className="w-full max-w-md bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 p-8 sm:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">

                {/* Brand Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <span className="text-white text-4xl font-black tracking-tighter">M</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">MUNA</h1>
                    <p className="text-sm font-semibold text-slate-500 bg-slate-50 inline-block px-4 py-1.5 rounded-full border border-slate-100">
                        India's fastest delivery app ⚡
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3.5 rounded-xl text-sm font-bold mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Google Sign-In Button Wrapper */}
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:!w-full [&_iframe]:!w-full drop-shadow-sm hover:drop-shadow-md transition-all">
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
                        <div className="flex justify-center items-center gap-2.5 text-amber-600 text-sm font-bold animate-pulse py-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Authenticating securely...
                        </div>
                    )}

                    {/* Footer / Terms */}
                    <div className="pt-8 mt-4 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-400 text-center leading-relaxed">
                            By continuing, you agree to MUNA's <br />
                            <a href="#" className="text-slate-700 hover:text-amber-500 font-bold transition-colors">Terms of Service</a> & <a href="#" className="text-slate-700 hover:text-amber-500 font-bold transition-colors">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Safe Area Branding */}
            <div className="absolute bottom-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Made in India
            </div>
        </div>
    );
};

export default Login;