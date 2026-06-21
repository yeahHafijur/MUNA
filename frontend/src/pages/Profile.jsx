import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

/* ─── SVG Icons ─── */
const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);
const IcoChevron = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);
const IcoUser = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const IcoPin = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);
const IcoHelp = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.5m0 2h.01" />
        <circle cx="12" cy="12" r="9.75" />
    </svg>
);
const IcoPrivacy = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
);
const IcoLogout = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
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

/* ─── Skeleton Loader ─── */
const OrderSkeleton = () => (
    <>
        {[1, 2, 3].map(i => (
            <div key={i} className="prf-skel-card">
                <div className="prf-skel-line prf-skel-line--med" />
                <div className="prf-skel-line prf-skel-line--short" />
                <div className="prf-skel-line prf-skel-line--full" style={{ height: 8 }} />
            </div>
        ))}
    </>
);

const Profile = () => {
    const { user, token, logout, login } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const navigate = useNavigate();

    // Edit Profile State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }

        fetch('/api/orders/customer', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(err => { console.error("Orders fetch error:", err); setLoading(false); });
    }, [token, navigate]);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Order cancelled successfully");
                setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
            } else {
                alert(data.message || "Failed to cancel order");
            }
        } catch (error) { console.error(error); alert("Error cancelling order"); }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    const handleDeleteLocation = async (id) => {
        if (!window.confirm("Delete this saved location?")) return;
        try {
            const res = await fetch(`/api/auth/delete-location/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) { login({ ...user, savedLocations: data.savedLocations }, token); }
            else { alert(data.message || "Failed to delete location"); }
        } catch (error) { console.error("Error deleting location:", error); }
    };

    const handleOpenEditProfile = () => {
        setEditName(user.name || '');
        setEditPhone(user.phone || '');
        setIsEditingProfile(true);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!editName.trim()) { alert("Name cannot be blank"); return; }
        if (!editPhone.trim() || editPhone.trim().length < 10) { alert("Please enter a valid phone number"); return; }

        setIsUpdating(true);
        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: editName, phone: editPhone })
            });
            const data = await res.json();
            if (res.ok) {
                // Update auth context state with the new user info
                login({ ...user, name: data.user.name, phone: data.user.phone }, token);
                alert("Profile updated successfully");
                setIsEditingProfile(false);
            } else {
                alert(data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Server error while updating profile");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user) return null;

    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalSpent = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return (
        <div className="prf-root">

            {/* ════════ HERO HEADER ════════ */}
            <div className="prf-hero">
                <div className="prf-hero-topbar">
                    <button onClick={() => navigate('/')} className="prf-back-btn" title="Back to Home">
                        <IcoBack />
                    </button>
                    <span className="prf-hero-title">My Profile</span>
                    <div style={{ width: 38 }} /> {/* spacer for centering */}
                </div>

                <div className="prf-hero-info">
                    <div className="prf-avatar">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="prf-user-details">
                        <div className="prf-user-name">{user.name}</div>
                        <div className="prf-user-email">{user.email}</div>
                        {user.phone && <div className="prf-user-phone">📞 {user.phone}</div>}
                    </div>
                </div>
            </div>

            {/* ════════ QUICK STATS ════════ */}
            <div className="prf-stats">
                <div className="prf-stat-card">
                    <div className="prf-stat-num prf-stat-num--amber">
                        {activeOrders.length}
                        {activeOrders.length > 0 && <span className="prf-stat-pulse" />}
                    </div>
                    <div className="prf-stat-label">Active</div>
                    <div className="prf-stat-icon">🛵</div>
                </div>
                <div className="prf-stat-card">
                    <div className="prf-stat-num">{deliveredOrders.length}</div>
                    <div className="prf-stat-label">Delivered</div>
                    <div className="prf-stat-icon">📦</div>
                </div>
                <div className="prf-stat-card">
                    <div className="prf-stat-num prf-stat-num--green">₹{totalSpent}</div>
                    <div className="prf-stat-label">Spent</div>
                    <div className="prf-stat-icon">💰</div>
                </div>
            </div>

            {/* ════════ TAB BAR ════════ */}
            <nav className="prf-tabbar">
                <button
                    className={`prf-tab ${activeTab === 'orders' ? 'prf-tab--active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    🛍️ My Orders
                    {activeOrders.length > 0 && <span className="prf-tab-badge">{activeOrders.length}</span>}
                </button>
                <button
                    className={`prf-tab ${activeTab === 'account' ? 'prf-tab--active' : ''}`}
                    onClick={() => setActiveTab('account')}
                >
                    ⚙️ Account
                </button>
            </nav>

            {/* ════════ BODY ════════ */}
            <div className="prf-body">

                {/* ─── ORDERS TAB ─── */}
                {activeTab === 'orders' && (
                    <div className="prf-tab-panel">
                        {loading ? (
                            <OrderSkeleton />
                        ) : orders.length === 0 ? (
                            <div className="prf-empty">
                                <span className="prf-empty-icon">📭</span>
                                <div className="prf-empty-title">No Orders Yet</div>
                                <div className="prf-empty-sub">Looks like you haven't ordered anything from MUNA yet. Start exploring!</div>
                                <button onClick={() => navigate('/')} className="prf-shop-btn">
                                    Start Shopping
                                </button>
                            </div>
                        ) : (
                            <div className="prf-orders-grid">
                                {orders.map(order => (
                                    <div key={order._id} className="prf-order-card">
                                        <div className="prf-order-head" onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}>
                                            <div className="prf-order-head-top">
                                                <div className="prf-order-shop-name">
                                                    {order.shopId?.name || "Local Shop"}
                                                </div>
                                                <span className={`prf-order-chevron ${expandedOrderId === order._id ? 'prf-order-chevron--open' : ''}`}>
                                                    ▼
                                                </span>
                                            </div>
                                            <div className="prf-order-head-bottom">
                                                <div className="prf-order-meta">
                                                    <div className="prf-order-id">#{order._id.slice(-6).toUpperCase()}</div>
                                                    <div className="prf-order-date">
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })} at {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="prf-order-actions">
                                                    <StatusPill status={order.status} />
                                                    {order.status === 'pending' && expandedOrderId === order._id && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCancelOrder(order._id); }}
                                                            className="prf-cancel-btn"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedOrderId === order._id && (
                                            <>
                                                <div className="prf-order-body">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="prf-order-item">
                                                            <span>
                                                                <span className="prf-item-qty">{item.quantity}×</span>
                                                                {item.name}
                                                            </span>
                                                            <span className="prf-item-price">₹{item.price * item.quantity}</span>
                                                        </div>
                                                    ))}
                                                    {order.instructions && (
                                                        <div className="prf-order-instructions">
                                                            <strong>📝 Instructions</strong>
                                                            {order.instructions}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="prf-order-foot">
                                                    <div className="prf-total-label">Total Amount</div>
                                                    <div className="prf-total-val">₹{order.totalAmount}</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── ACCOUNT TAB ─── */}
                {activeTab === 'account' && (
                    <div className="prf-tab-panel">

                        {/* Account Section */}
                        <div className="prf-settings-section">
                            <div className="prf-settings-label">Account</div>
                            <div className="prf-settings-group">
                                <div className="prf-setting-row" onClick={handleOpenEditProfile}>
                                    <div className="prf-setting-icon prf-setting-icon--amber">
                                        <IcoUser />
                                    </div>
                                    <div className="prf-setting-text">
                                        <div className="prf-setting-text-main">Edit Profile</div>
                                        <div className="prf-setting-text-sub">Name, phone number</div>
                                    </div>
                                    <div className="prf-setting-chevron"><IcoChevron /></div>
                                </div>
                            </div>
                        </div>

                        {/* Addresses Section */}
                        <div className="prf-settings-section">
                            <div className="prf-settings-label">Saved Addresses</div>
                            <div className="prf-settings-group">
                                {user?.savedLocations && user.savedLocations.length > 0 ? (
                                    user.savedLocations.map(loc => (
                                        <div key={loc._id} className="prf-setting-row">
                                            <div className="prf-setting-icon prf-setting-icon--blue">
                                                <IcoPin />
                                            </div>
                                            <div className="prf-setting-text">
                                                <div className="prf-setting-text-main">{loc.name}</div>
                                                <div className="prf-setting-text-sub">Saved location</div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc._id); }}
                                                className="prf-addr-delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="prf-setting-row" style={{ cursor: 'default' }}>
                                        <div className="prf-setting-icon prf-setting-icon--blue">
                                            <IcoPin />
                                        </div>
                                        <div className="prf-setting-text">
                                            <div className="prf-setting-text-main" style={{ color: '#94a3b8' }}>No saved addresses</div>
                                            <div className="prf-setting-text-sub">Save addresses during checkout</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Support Section */}
                        <div className="prf-settings-section">
                            <div className="prf-settings-label">Support</div>
                            <div className="prf-settings-group">
                                <div className="prf-setting-row">
                                    <div className="prf-setting-icon prf-setting-icon--green">
                                        <IcoHelp />
                                    </div>
                                    <div className="prf-setting-text">
                                        <div className="prf-setting-text-main">Help & Support</div>
                                        <div className="prf-setting-text-sub">FAQs, contact us</div>
                                    </div>
                                    <div className="prf-setting-chevron"><IcoChevron /></div>
                                </div>
                                <div className="prf-setting-row" onClick={() => navigate('/privacy-policy')}>
                                    <div className="prf-setting-icon prf-setting-icon--purple">
                                        <IcoPrivacy />
                                    </div>
                                    <div className="prf-setting-text">
                                        <div className="prf-setting-text-main">Privacy Policy</div>
                                        <div className="prf-setting-text-sub">How we handle your data</div>
                                    </div>
                                    <div className="prf-setting-chevron"><IcoChevron /></div>
                                </div>
                            </div>
                        </div>

                        {/* Sign Out */}
                        <div className="prf-settings-section">
                            <div className="prf-settings-group">
                                <div className="prf-setting-row prf-setting-row--danger" onClick={handleLogout}>
                                    <div className="prf-setting-icon prf-setting-icon--red">
                                        <IcoLogout />
                                    </div>
                                    <div className="prf-setting-text">
                                        <div className="prf-setting-text-main">Sign Out</div>
                                        <div className="prf-setting-text-sub">You can always log back in</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* ─── EDIT PROFILE MODAL ─── */}
            {isEditingProfile && (
                <div className="prf-modal-overlay">
                    <div className="prf-modal-content">
                        <div className="prf-modal-header">
                            <h3>Edit Profile</h3>
                            <button className="prf-modal-close" onClick={() => setIsEditingProfile(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="prf-modal-body">
                            <div className="prf-form-group">
                                <label>Name <span style={{color: '#dc2626'}}>*</span></label>
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter your name"
                                    required
                                    className="prf-input"
                                />
                            </div>
                            <div className="prf-form-group">
                                <label>Phone Number <span style={{color: '#dc2626'}}>*</span></label>
                                <input 
                                    type="tel" 
                                    value={editPhone} 
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="Enter 10-digit phone number"
                                    required
                                    minLength={10}
                                    maxLength={15}
                                    className="prf-input"
                                />
                            </div>
                            <div className="prf-modal-footer">
                                <button type="button" className="prf-btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                                <button type="submit" className="prf-btn-primary" disabled={isUpdating}>
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;