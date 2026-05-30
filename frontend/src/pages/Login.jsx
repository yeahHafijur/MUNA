import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1 = Enter Phone, 2 = Enter OTP
    const [isNewUser, setIsNewUser] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

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

            // OTP sent successfully
            setIsNewUser(data.isNewUser);
            setStep(2);
            
            // NOTE FOR DEV: In production, remove this alert.
            // alert(`Mock OTP is: 123456`);
            
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

            // Success! Context me user aur token save karo
            login({ _id: data._id, name: data.name, phone: data.phone, role: data.role }, data.token);

            // Login hote hi role ke hisaab se redirect
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
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">MUNA</h2>
                <p className="text-gray-500 text-sm mt-1">India's fastest delivery app</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 font-semibold p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

            {step === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg font-bold">
                                +91
                            </span>
                            <input
                                type="tel"
                                required
                                maxLength="10"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                className="w-full border border-gray-200 rounded-r-lg p-3 outline-none focus:border-yellow-400 transition-colors tracking-widest font-semibold"
                                placeholder="98765 43210"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#f8cb46] hover:bg-yellow-400 text-black font-bold py-3 rounded-lg shadow-sm transition-colors mt-4 text-lg"
                    >
                        {loading ? 'Sending...' : 'Continue'}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-4">
                        By continuing, you agree to our Terms of service & Privacy policy
                    </p>
                </form>
            ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-600 font-medium">We've sent an OTP to</p>
                        <p className="font-bold text-gray-800">+91 {phone}</p>
                        <button type="button" onClick={() => setStep(1)} className="text-yellow-600 text-xs font-bold hover:underline mt-1">
                            Change Number
                        </button>
                    </div>
                    {isNewUser && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-yellow-400 transition-colors font-semibold"
                                placeholder="E.g. Rahul Kumar"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Enter OTP</label>
                        <input
                            type="text"
                            required
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full border border-gray-200 rounded-lg p-4 outline-none focus:border-yellow-400 transition-colors text-center text-2xl tracking-[0.5em] font-bold"
                            placeholder="••••••"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#f8cb46] hover:bg-yellow-400 text-black font-bold py-3 rounded-lg shadow-sm transition-colors mt-2 text-lg"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-4">
                        Development Mock OTP is always 123456
                    </p>
                </form>
            )}
        </div>
    );
};

export default Login;
