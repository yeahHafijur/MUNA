import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Backend me Naya user bhejo
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            alert("Account created successfully! Please login.");
            navigate('/login'); // Register hote hi wapas login par bhej do

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 text-center mb-6">Create Account</h2>

            {error && <div className="bg-red-50 text-red-600 font-semibold p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-yellow-400 transition-colors"
                        placeholder="E.g. Rahul Kumar"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-yellow-400 transition-colors"
                        placeholder="E.g. rahul@village.com"
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
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account? <Link to="/login" className="text-yellow-500 font-bold hover:underline">Login here</Link>
            </p>
        </div>
    );
};

export default Register;
