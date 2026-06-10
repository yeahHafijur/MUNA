import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1 = Main, 2 = Enter OTP (phone flow)
    const [isNewUser, setIsNewUser] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPhoneLogin, setShowPhoneLogin] = useState(false);

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

            // Success! Context me user aur token save karo
            login({
                _id: data._id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                profilePic: data.profilePic
            }, data.token);

            // Role ke hisaab se redirect
            if (data.role === 'vendor') {
                navigate('/vendor-dashboard');
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

    // Phone OTP Flow (Purana system - backup ke liye)
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        
        if (phone.length !== 10) {
            return setError('Please enter a valid 10-digit phone number');
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            setIsNewUser(data.isNewUser);
            setStep(2);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');

        if (otp.length < 4) {
            return setError('Please enter a valid OTP');
        }
        
        if (isNewUser && name.trim().length < 3) {
            return setError('Please enter your full name (min 3 letters)');
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp, name })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            login({ _id: data._id, name: data.name, phone: data.phone, role: data.role }, data.token);

            if (data.role === 'vendor') {
                navigate('/vendor-dashboard');
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

    return (
        <div className="login-style-1">
            <div className="login-style-2">
                <h2 className="login-style-3">MUNA</h2>
                <p className="login-style-4">India's fastest delivery app</p>
            </div>

            {error && <div className="login-style-5">{error}</div>}

            {!showPhoneLogin && step === 1 ? (
                /* ===== MAIN LOGIN SCREEN ===== */
                <div className="login-style-6">
                    {/* Google Sign-In Button */}
                    <div className="login-style-7">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            size="large"
                            width="350"
                            text="signin_with"
                            shape="rectangular"
                            theme="outline"
                        />
                    </div>

                    {loading && <p className="login-style-8">Logging in...</p>}

                    {/* Divider */}
                    <div className="login-style-9">
                        <div className="login-style-10"></div>
                        <span className="login-style-11">or</span>
                        <div className="login-style-12"></div>
                    </div>

                    {/* Phone Login (Admin/Vendor ke liye) */}
                    <button
                        onClick={() => setShowPhoneLogin(true)}
                        className="login-style-13"
                    >
                        📱 Login with Phone Number (Admin/Vendor)
                    </button>

                    <p className="login-style-14">
                        By continuing, you agree to our Terms of service & Privacy policy
                    </p>
                </div>
            ) : showPhoneLogin && step === 1 ? (
                /* ===== PHONE NUMBER ENTRY ===== */
                <form onSubmit={handleSendOTP} className="login-style-15">
                    <button type="button" onClick={() => setShowPhoneLogin(false)} className="login-style-16">
                        ← Back to Google Login
                    </button>
                    <div>
                        <label className="login-style-17">Phone Number</label>
                        <div className="login-style-18">
                            <span className="login-style-19">
                                +91
                            </span>
                            <input
                                type="tel"
                                required
                                maxLength="10"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                className="login-style-20"
                                placeholder="98765 43210"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-style-21"
                    >
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                    <p className="login-style-22">
                        Admin/Vendor test: 9999999999 / OTP: 123456
                    </p>
                </form>
            ) : (
                /* ===== OTP VERIFICATION ===== */
                <form onSubmit={handleVerifyOTP} className="login-style-23">
                    <div className="login-style-24">
                        <p className="login-style-25">We've sent an OTP to</p>
                        <p className="login-style-26">+91 {phone}</p>
                        <button type="button" onClick={() => { setStep(1); setShowPhoneLogin(true); }} className="login-style-27">
                            Change Number
                        </button>
                    </div>
                    {isNewUser && (
                        <div>
                            <label className="login-style-28">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="login-style-29"
                                placeholder="E.g. Rahul Kumar"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="login-style-30">Enter OTP</label>
                        <input
                            type="text"
                            required
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="login-style-31"
                            placeholder="••••••"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-style-32"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default Login;
