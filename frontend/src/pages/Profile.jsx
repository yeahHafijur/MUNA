import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

/* ─── Sleek Icons ─── */
const IconBack = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const IconLogout = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

/* ─── Status Pill ─── */
const StatusPill = ({ status }) => {
    const cls = `prf-pill prf-pill--${status.replace(' ', '_')}`;
    const labels = {
        pending: '⏳ Pending',
        accepted: '👍 Accepted',
        preparing: '🔥 Preparing',
        out_for_delivery: '🛵 On the Way',
        delivered: '✅ Delivered',
        cancelled: '❌ Cancelled',
    };
    return <span className={cls}>{labels[status] || status}</span>;
};

const Profile = () => {
    const { user, token, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');
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
                console.error("Orders fetch error:", err);
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
        <div className="prf-root">

            {/* ════════ HEADER ════════ */}
            <header className="prf-header">
                <div className="prf-header-left">
                    <button onClick={() => navigate('/')} className="prf-icon-btn" title="Back to Home" style={{marginRight: '8px'}}>
                        <IconBack />
                    </button>
                    <div className="prf-avatar">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="prf-user-info">
                        <div className="prf-user-name">{user.name}</div>
                        <div className="prf-user-email">{user.email}</div>
                    </div>
                </div>
            </header>

            {/* ════════ TAB BAR ════════ */}
            <nav className="prf-tabbar">
                <button
                    className={`prf-tab ${activeTab === 'orders' ? 'prf-tab--active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    🛍️ My Orders
                    {activeOrders.length > 0 && (
                        <span className="prf-tab-badge">{activeOrders.length}</span>
                    )}
                </button>

                <button
                    className={`prf-tab ${activeTab === 'account' ? 'prf-tab--active' : ''}`}
                    onClick={() => setActiveTab('account')}
                >
                    ⚙️ Account Settings
                </button>
            </nav>

            {/* ════════ BODY ════════ */}
            <div className="prf-body">
                
                {/* ─── ORDERS TAB ─── */}
                {activeTab === 'orders' && (
                    <div className="prf-tab-panel">
                        {/* Stats Row */}
                        <div className="prf-stats-row">
                            <div className="prf-stat-card">
                                <div className="prf-stat-num">{activeOrders.length}</div>
                                <div className="prf-stat-label">Active Orders</div>
                                <div className="prf-stat-icon">🛵</div>
                            </div>
                            <div className="prf-stat-card">
                                <div className="prf-stat-num prf-stat-num--green">₹{totalSpent}</div>
                                <div className="prf-stat-label">Total Spent</div>
                                <div className="prf-stat-icon">💰</div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="prf-empty">
                                <div className="prf-empty-icon">⏳</div>
                                <div className="prf-empty-title">Loading Orders...</div>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="prf-empty">
                                <div className="prf-empty-icon">📭</div>
                                <div className="prf-empty-title">No Orders Yet</div>
                                <div className="prf-empty-sub">Looks like you haven't bought anything from MUNA yet.</div>
                                <button onClick={() => navigate('/')} className="prf-shop-btn">
                                    Start Shopping
                                </button>
                            </div>
                        ) : (
                            <div className="prf-orders-grid">
                                {orders.map(order => (
                                    <div key={order._id} className="prf-order-card">
                                        
                                        <div className="prf-order-head">
                                            <div>
                                                <div className="prf-order-id">#{order._id.slice(-6).toUpperCase()}</div>
                                                <div className="prf-order-date">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            <StatusPill status={order.status} />
                                        </div>

                                        <div className="prf-order-body">
                                            <div className="prf-order-shop">
                                                🏪 {order.shopId?.name || "Local Shop"}
                                            </div>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="prf-order-item">
                                                    <span>
                                                        <span className="prf-item-qty">{item.quantity}×</span>
                                                        {item.name}
                                                    </span>
                                                    <span className="prf-item-price">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="prf-order-foot">
                                            <div className="prf-total-label">Total Amount</div>
                                            <div className="prf-total-val">₹{order.totalAmount}</div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── ACCOUNT TAB ─── */}
                {activeTab === 'account' && (
                    <div className="prf-tab-panel">
                        <div className="prf-settings-list">
                            <div className="prf-setting-item">
                                <span>Edit Profile</span>
                                <span>›</span>
                            </div>
                            <div className="prf-setting-item">
                                <span>Saved Addresses</span>
                                <span>›</span>
                            </div>
                            <div className="prf-setting-item">
                                <span>Help & Support</span>
                                <span>›</span>
                            </div>
                            <div className="prf-setting-item prf-setting-item--danger" onClick={handleLogout}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <IconLogout /> Sign Out
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;