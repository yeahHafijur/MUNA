import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

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

    return (
        <div className="login-style-1">
            <div className="login-style-2">
                <h2 className="login-style-3">MUNA</h2>
                <p className="login-style-4">India's fastest delivery app</p>
            </div>

            {error && <div className="login-style-5">{error}</div>}

            <div className="login-style-6">
                {/* Google Sign-In Button */}
                <div className="login-style-7" style={{marginTop: '20px', marginBottom: '20px'}}>
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

                <p className="login-style-14" style={{marginTop: '40px'}}>
                    By continuing, you agree to our Terms of service & Privacy policy
                </p>
            </div>
        </div>
    );
};

export default Login;
