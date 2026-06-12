import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

/* ─── Icon Components ─── */
const IconLogout = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

/* ─── Status Pill Helper ─── */
const StatusPill = ({ status }) => {
    const cls = `usr-pill usr-pill--${status.replace(' ', '_')}`;
    const labels = {
        pending: '⏳ Pending',
        accepted: '👍 Accepted',
        preparing: '🔥 Preparing',
        out_for_delivery: '🛵 On the Way',
        delivered: '🎉 Delivered',
        cancelled: '❌ Cancelled',
    };
    return <span className={cls}>{labels[status] || status}</span>;
};

const Profile = () => {
    const { user, token, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        fetch('/api/orders/customer', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setOrders(Array.isArray(data) ? data : []);
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

    // --- Stats Calculation ---
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalSpent = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return (
        <div className="usr-root">

            {/* ════════ HEADER ════════ */}
            <header className="usr-header">
                <div className="usr-header-left">
                    <div className="usr-avatar">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="usr-info">
                        <h1 className="usr-name">{user.name}</h1>
                        <p className="usr-email">{user.email}</p>
                        <span className="usr-role-badge">Customer Account</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="usr-logout-btn">
                    <IconLogout /> Sign Out
                </button>
            </header>

            {/* ════════ STATS ROW ════════ */}
            <div className="usr-stats-row">
                <div className="usr-stat-card">
                    <div className="usr-stat-info">
                        <div className="usr-stat-num">{orders.length}</div>
                        <div className="usr-stat-label">Total Orders</div>
                    </div>
                    <div className="usr-stat-icon">🛍️</div>
                </div>
                <div className="usr-stat-card">
                    <div className="usr-stat-info">
                        <div className="usr-stat-num text-amber-500">{activeOrders.length}</div>
                        <div className="usr-stat-label">Active Orders</div>
                    </div>
                    <div className="usr-stat-icon">🛵</div>
                </div>
                <div className="usr-stat-card">
                    <div className="usr-stat-info">
                        <div className="usr-stat-num text-green-600">₹{totalSpent}</div>
                        <div className="usr-stat-label">Total Spent</div>
                    </div>
                    <div className="usr-stat-icon">💰</div>
                </div>
            </div>

            {/* ════════ ORDERS SECTION ════════ */}
            <div className="usr-section-title">
                <span>📜</span> My Order History
            </div>

            {loading ? (
                <div className="usr-loading">
                    <div className="usr-spinner"></div>
                    <p>Loading your profile...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="usr-empty">
                    <div className="usr-empty-icon">📭</div>
                    <div className="usr-empty-title">No orders yet!</div>
                    <div className="usr-empty-sub">Looks like you haven't bought anything from MUNA yet.</div>
                    <button onClick={() => navigate('/')} className="usr-shop-btn">
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="usr-orders-grid">
                    {orders.map(order => (
                        <div key={order._id} className="usr-order-card">

                            {/* Card Header */}
                            <div className="usr-order-head">
                                <div>
                                    <div className="usr-order-id">Order #{order._id.slice(-6).toUpperCase()}</div>
                                    <div className="usr-order-time">
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                    <StatusPill status={order.status} />
                                </div>
                                <div className="usr-order-amount">
                                    <div className="usr-amount-val">₹{order.totalAmount}</div>
                                    <div className="usr-amount-lbl">Total Paid</div>
                                </div>
                            </div>

                            {/* Card Body - Items */}
                            <div className="usr-order-body">
                                <div className="usr-shop-name">
                                    🏪 {order.shopId?.name || "Local Shop"}
                                </div>
                                <div className="usr-items-list">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="usr-item-row">
                                            <span className="usr-item-name">
                                                <span className="usr-item-qty">{item.quantity}×</span>
                                                {item.name}
                                            </span>
                                            <span className="usr-item-price">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Profile;