import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // AuthContext se login function liya
    const { login } = useAuth();
    // Page change karne ke liye hook
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); // Form submit hone par page refresh hone se roko
        setError('');
        setLoading(true);

        try {
            // Backend ko request bhejo
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Success! Context me user aur token save karo
            login({ _id: data._id, name: data.name, email: data.email, role: data.role }, data.token);

            // Login hote hi Home page par wapas bhej do
            // Naya Smart Routing logic
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
            <h2 className="text-2xl font-black text-gray-800 text-center mb-6">Welcome to MUNA</h2>

            {/* Error Message */}
            {error && <div className="bg-red-50 text-red-600 font-semibold p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-yellow-400 transition-colors"
                        placeholder="E.g. customer@muna.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-yellow-400 transition-colors"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f8cb46] hover:bg-yellow-400 text-black font-bold py-3 rounded-lg shadow-sm transition-colors mt-2"
                >
                    {loading ? 'Logging in...' : 'Login Securely'}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account? <Link to="/register" className="text-yellow-500 font-bold hover:underline">Register here</Link>
            </p>

        </div>
    );
};

export default Login;
