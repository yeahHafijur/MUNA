import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

/* ─── Sleek Icons ─── */
const IconLogout = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const IconBox = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

/* ─── Dark Mode Status Pill ─── */
const StatusPill = ({ status }) => {
    const cls = `dp-pill dp-pill--${status.replace(' ', '_')}`;
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
        <div className="dp-root">
            <div className="dp-layout">

                {/* ════════ LEFT SIDEBAR: PROFILE ════════ */}
                <aside className="dp-sidebar">
                    <div className="dp-sidebar-inner">
                        <div className="dp-avatar-wrapper">
                            <div className="dp-avatar-glow"></div>
                            <div className="dp-avatar">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="dp-user-info">
                            <h1 className="dp-name">{user.name}</h1>
                            <p className="dp-email">{user.email}</p>
                            <span className="dp-role-badge">Customer Account</span>
                        </div>

                        <div className="dp-divider"></div>

                        <button onClick={handleLogout} className="dp-logout-btn">
                            <IconLogout /> Sign Out Securely
                        </button>
                    </div>
                </aside>

                {/* ════════ RIGHT MAIN CONTENT ════════ */}
                <main className="dp-main">

                    {/* STATS GRID */}
                    <div className="dp-stats-grid">
                        <div className="dp-stat-card">
                            <div className="dp-stat-icon-wrap"><IconBox /></div>
                            <div>
                                <div className="dp-stat-val">{orders.length}</div>
                                <div className="dp-stat-lbl">Total Orders</div>
                            </div>
                        </div>
                        <div className="dp-stat-card">
                            <div className="dp-stat-icon-wrap text-amber-500">🛵</div>
                            <div>
                                <div className="dp-stat-val text-amber-400">{activeOrders.length}</div>
                                <div className="dp-stat-lbl">In Progress</div>
                            </div>
                        </div>
                        <div className="dp-stat-card">
                            <div className="dp-stat-icon-wrap text-green-400">₹</div>
                            <div>
                                <div className="dp-stat-val text-green-400">{totalSpent}</div>
                                <div className="dp-stat-lbl">Total Spent</div>
                            </div>
                        </div>
                    </div>

                    {/* ORDERS SECTION */}
                    <div className="dp-section-header">
                        <h2 className="dp-section-title">Order History</h2>
                    </div>

                    {loading ? (
                        <div className="dp-loading">
                            <div className="dp-spinner"></div>
                            <p>Syncing data...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="dp-empty">
                            <div className="dp-empty-icon">🪐</div>
                            <div className="dp-empty-text">Your orbit is empty.</div>
                            <button onClick={() => navigate('/')} className="dp-shop-btn">
                                Explore MUNA
                            </button>
                        </div>
                    ) : (
                        <div className="dp-orders-list">
                            {orders.map(order => (
                                <div key={order._id} className="dp-order-card">

                                    {/* Order Head */}
                                    <div className="dp-order-head">
                                        <div className="dp-order-meta">
                                            <span className="dp-order-id">#{order._id.slice(-6).toUpperCase()}</span>
                                            <span className="dp-order-dot">•</span>
                                            <span className="dp-order-date">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <StatusPill status={order.status} />
                                    </div>

                                    {/* Order Body */}
                                    <div className="dp-order-body">
                                        <div className="dp-order-shop">
                                            🏪 {order.shopId?.name || "Local Shop"}
                                        </div>
                                        <div className="dp-items">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="dp-item-row">
                                                    <div className="dp-item-name">
                                                        <span className="dp-item-qty">{item.quantity}×</span>
                                                        {item.name}
                                                    </div>
                                                    <div className="dp-item-price">₹{item.price * item.quantity}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Footer */}
                                    <div className="dp-order-foot">
                                        <div className="dp-total-lbl">Total Amount</div>
                                        <div className="dp-total-val">₹{order.totalAmount}</div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Profile;