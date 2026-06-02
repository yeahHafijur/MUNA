import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, token, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Jaise hi page khule, backend se saare orders utha lo
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        fetch('/api/orders/customer', {
            headers: {
                'Authorization': `Bearer ${token}` // Ye raha apna VIP Pass (Token)
            }
        })
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching orders:", err);
                setLoading(false);
            });
    }, [token, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto mt-6">

            {/* User Info Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">{user.name}</h1>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {user.role}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>

            {/* Orders Section */}
            <h2 className="text-xl font-black text-gray-800 mb-4">My Orders</h2>

            {loading ? (
                <p className="text-gray-500 text-sm font-bold animate-pulse">Loading your orders...</p>
            ) : orders.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                    <span className="text-4xl mb-2 block">📦</span>
                    <p className="text-gray-500 font-bold">No orders yet.</p>
                </div>
            ) : (
                <div className="space-y-4 mb-8">
                    {orders.map(order => (
                        <div key={order._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">

                            <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">Order ID: #{order._id.slice(-6).toUpperCase()}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="space-y-2 mb-3">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-600 font-medium">{item.quantity} x {item.name}</span>
                                        <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                <span className="text-sm font-bold text-gray-500">Total Paid</span>
                                <span className="font-black text-gray-800 text-lg">₹{order.totalAmount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};

export default Profile;
