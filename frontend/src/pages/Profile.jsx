import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

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
        <div className="profile-style-1">

            {/* User Info Header */}
            <div className="profile-style-2">
                <div>
                    <h1 className="profile-style-3">{user.name}</h1>
                    <p className="profile-style-4">{user.email}</p>
                </div>
                <div className="profile-style-5">
                    <div className="profile-style-6">
                        {user.role}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="profile-style-7"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="profile-style-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>

            {/* Orders Section */}
            <h2 className="profile-style-9">My Orders</h2>

            {loading ? (
                <p className="profile-style-10">Loading your orders...</p>
            ) : orders.length === 0 ? (
                <div className="profile-style-11">
                    <span className="profile-style-12">📦</span>
                    <p className="profile-style-13">No orders yet.</p>
                </div>
            ) : (
                <div className="profile-style-14">
                    {orders.map(order => (
                        <div key={order._id} className="profile-style-15">

                            <div className="profile-style-16">
                                <div>
                                    <h3 className="profile-style-17">Order ID: #{order._id.slice(-6).toUpperCase()}</h3>
                                    <p className="profile-style-18">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="profile-style-19">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="profile-style-20">
                                        <span className="profile-style-21">{item.quantity} x {item.name}</span>
                                        <span className="profile-style-22">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="profile-style-23">
                                <span className="profile-style-24">Total Paid</span>
                                <span className="profile-style-25">₹{order.totalAmount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};

export default Profile;
