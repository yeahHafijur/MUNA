import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css'; // Keep existing CSS for orders/legacy parts if any

/* ─── Heroicons SVG ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IconChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const IconUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IconMapPin = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const IconHeart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IconBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const IconHelp = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.5m0 2h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
const IconDocument = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconLogout = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;
const IconCamera = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>;

const StatusPill = ({ status }) => {
    const cls = `prf-pill prf-pill--${status.replace(' ', '_')}`;
    const labels = {
        pending: '⏳ Pending', accepted: '👍 Accepted', preparing: '🔥 Preparing',
        out_for_delivery: '🛵 On the Way', delivered: '✅ Delivered', cancelled: '❌ Cancelled',
    };
    return <span className={cls}>{labels[status] || status}</span>;
};

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

const SettingRow = ({ icon, title, subtitle, onClick, rightText, isDanger, badge }) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-white border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer min-h-[56px]">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-600'}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className={`text-sm font-semibold ${isDanger ? 'text-red-600' : 'text-gray-900'}`}>{title}</span>
                {subtitle && <span className="text-xs text-gray-500 mt-0.5">{subtitle}</span>}
            </div>
        </div>
        <div className="flex items-center gap-2">
            {rightText && <span className="text-xs font-medium text-gray-400">{rightText}</span>}
            {badge && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{badge}</span>}
            {!isDanger && <IconChevron />}
        </div>
    </div>
);

const Profile = () => {
    const { user, token, logout, login } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('account'); // Default to account tab for redesign view
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
    
    const handleDeleteAccount = async () => {
        if (!window.confirm("WARNING: This will permanently delete your account, orders, and all data. Are you absolutely sure?")) return;
        // Placeholder for real backend logic
        alert("Account deletion request submitted. (Placeholder)");
        // logout();
        // navigate('/');
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
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 overflow-hidden font-sans">
            
            {/* ════════ HEADER ════════ */}
            <div className="flex-shrink-0 bg-white px-4 pt-4 pb-6 shadow-sm z-10">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
                        <IconBack />
                    </button>
                    <span className="text-base font-bold text-gray-900">Account</span>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                <div className="flex items-center gap-4 px-2">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-3xl font-black shadow-inner border-2 border-white">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 border border-gray-100 active:scale-90 transition-transform">
                            <IconCamera />
                        </button>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate tracking-tight">{user.name}</h2>
                        <p className="text-sm text-gray-500 truncate font-medium mt-0.5">{user.email}</p>
                        <p className="text-sm text-gray-500 font-medium">{user.phone || '+91 - Add phone'}</p>
                    </div>
                </div>
            </div>

            {/* ════════ STATS ROW ════════ */}
            <div className="px-4 -mt-3 relative z-20">
                <div className="flex gap-3">
                    <div className="flex-1 bg-white rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-gray-900 leading-none mb-1">{activeOrders.length}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Active</span>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-gray-900 leading-none mb-1">{deliveredOrders.length}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Delivered</span>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-green-600 leading-none mb-1">₹{totalSpent}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Spent</span>
                    </div>
                </div>
            </div>

            {/* ════════ TAB BAR ════════ */}
            <div className="flex bg-white px-4 mt-4 border-b border-gray-100">
                <button
                    className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'account' ? 'border-amber-400 text-gray-900' : 'border-transparent text-gray-400'}`}
                    onClick={() => setActiveTab('account')}
                >
                    Settings
                </button>
                <button
                    className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors relative ${activeTab === 'orders' ? 'border-amber-400 text-gray-900' : 'border-transparent text-gray-400'}`}
                    onClick={() => setActiveTab('orders')}
                >
                    My Orders
                    {activeOrders.length > 0 && <span className="absolute top-3 ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] leading-none">{activeOrders.length}</span>}
                </button>
            </div>

            {/* ════════ BODY ════════ */}
            <div className="flex-1 overflow-y-auto pb-24">
                
                {/* ─── ACCOUNT TAB (NEW DESIGN) ─── */}
                {activeTab === 'account' && (
                    <div className="p-4 space-y-6">
                        
                        {/* Group 1: General */}
                        <div>
                            <h3 className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">General</h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <SettingRow 
                                    icon={<IconUser />} 
                                    title="Edit Profile" 
                                    subtitle="Name, phone number"
                                    onClick={handleOpenEditProfile} 
                                />
                                <SettingRow 
                                    icon={<IconMapPin />} 
                                    title="Saved Addresses" 
                                    subtitle="Home, Office, Other"
                                    rightText={user.savedLocations?.length ? `${user.savedLocations.length} Saved` : 'None'}
                                    onClick={() => alert("Navigate to addresses")} 
                                />
                                <SettingRow 
                                    icon={<IconHeart />} 
                                    title="Favorites" 
                                    subtitle="Your liked items & shops"
                                    onClick={() => alert("Navigate to favorites")} 
                                />
                            </div>
                        </div>

                        {/* Group 2: App Settings */}
                        <div>
                            <h3 className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">App Settings</h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <SettingRow 
                                    icon={<IconBell />} 
                                    title="Notifications" 
                                    subtitle="Order updates, offers"
                                    badge="On"
                                    onClick={() => alert("Notification settings")} 
                                />
                            </div>
                        </div>

                        {/* Group 3: Support & Legal */}
                        <div>
                            <h3 className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Support & Legal</h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <SettingRow 
                                    icon={<IconHelp />} 
                                    title="Help & Support" 
                                    subtitle="FAQs, contact us"
                                    onClick={() => alert("Help Center")} 
                                />
                                <SettingRow 
                                    icon={<IconShield />} 
                                    title="Privacy Policy" 
                                    onClick={() => navigate('/privacy-policy')} 
                                />
                                <SettingRow 
                                    icon={<IconDocument />} 
                                    title="Terms of Service" 
                                    onClick={() => navigate('/privacy-policy')} 
                                />
                            </div>
                        </div>

                        {/* Group 4: Danger Zone */}
                        <div>
                            <h3 className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account Actions</h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden mb-8">
                                <SettingRow 
                                    icon={<IconLogout />} 
                                    title="Sign Out" 
                                    isDanger={true}
                                    onClick={handleLogout} 
                                />
                                <SettingRow 
                                    icon={<IconTrash />} 
                                    title="Delete Account" 
                                    subtitle="Permanently delete your data"
                                    isDanger={true}
                                    onClick={handleDeleteAccount} 
                                />
                            </div>
                            <div className="text-center pb-8">
                                <p className="text-xs text-gray-400 font-medium">MUNA App v1.0.0</p>
                                <p className="text-[10px] text-gray-400 mt-1">Made with ❤️ in India</p>
                            </div>
                        </div>

                    </div>
                )}

                {/* ─── ORDERS TAB (Legacy UI embedded) ─── */}
                {activeTab === 'orders' && (
                    <div className="p-4">
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
            </div>

            {/* ─── EDIT PROFILE MODAL (Tailwind Redesign) ─── */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center sm:items-center">
                    <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
                            <button onClick={() => setIsEditingProfile(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-transform">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter your name"
                                    required
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                                <input 
                                    type="tel" 
                                    value={editPhone} 
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="Enter 10-digit phone number"
                                    required
                                    minLength={10}
                                    maxLength={15}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 p-4 bg-gray-100 text-gray-700 rounded-xl font-bold active:scale-95 transition-transform">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isUpdating} className="flex-1 p-4 bg-amber-400 text-gray-900 rounded-xl font-bold active:scale-95 transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.4)] disabled:opacity-70 disabled:active:scale-100">
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