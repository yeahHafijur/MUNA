import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { requestFirebaseNotificationPermission } from '../firebase';

/* ─── Heroicons SVG ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IconChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
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
    const labels = {
        pending: { text: '⏳ Pending', style: 'bg-orange-50 text-orange-600 border-orange-100' },
        accepted: { text: '👍 Accepted', style: 'bg-blue-50 text-blue-600 border-blue-100' },
        preparing: { text: '🔥 Preparing', style: 'bg-purple-50 text-purple-600 border-purple-100' },
        out_for_delivery: { text: '🛵 On the Way', style: 'bg-amber-50 text-amber-600 border-amber-100' },
        delivered: { text: '✅ Delivered', style: 'bg-green-50 text-green-600 border-green-100' },
        cancelled: { text: '❌ Cancelled', style: 'bg-red-50 text-red-600 border-red-100' },
    };
    const current = labels[status] || { text: status, style: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${current.style}`}>{current.text}</span>;
};

const OrderSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />
                <div className="h-8 bg-gray-50 rounded-lg w-full" />
            </div>
        ))}
    </div>
);

const SettingRow = ({ icon, title, subtitle, onClick, rightText, isDanger, badge, isLast }) => (
    <div onClick={onClick} className={`flex items-center justify-between px-4 py-3.5 bg-white active:bg-gray-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-50' : ''}`}>
        <div className="flex items-center gap-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-700'}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className={`text-sm font-bold tracking-tight ${isDanger ? 'text-red-600' : 'text-gray-900'}`}>{title}</span>
                {subtitle && <span className="text-xs font-medium text-gray-400 mt-0.5">{subtitle}</span>}
            </div>
        </div>
        <div className="flex items-center gap-2">
            {rightText && <span className="text-xs font-semibold text-gray-400">{rightText}</span>}
            {badge && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">{badge}</span>}
            {!isDanger && <IconChevron />}
        </div>
    </div>
);

const Profile = () => {
    const { user, token, logout, login } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('account');
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const navigate = useNavigate();

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

        try {
            const res = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Account deleted successfully.");
                logout();
                navigate('/');
            } else {
                alert(data.message || "Failed to delete account");
            }
        } catch (error) {
            console.error("Delete account error:", error);
            alert("An error occurred while deleting account");
        }
    };

    const [isAddressesModalOpen, setIsAddressesModalOpen] = useState(false);

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

    const handleEnableNotifications = async () => {
        try {
            const fcmToken = await requestFirebaseNotificationPermission();
            if (fcmToken) {
                await fetch('/api/auth/fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ fcmToken })
                });
                alert("Notifications enabled successfully!");
            } else {
                alert("Please allow notifications in your browser settings.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to enable notifications.");
        }
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
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50/50 overflow-hidden font-sans">

            {/* ════════ HEADER NAV ════════ */}
            <div className="flex-shrink-0 bg-white px-4 pt-4 pb-2 z-10 flex items-center justify-between">
                <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-gray-900 tracking-tight">My Profile</span>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto pb-24">

                <div className="px-4 pt-2 pb-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-white text-3xl font-black shadow-inner">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 border border-gray-100 active:scale-90 transition-transform">
                                <IconCamera />
                            </button>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <h2 className="text-lg font-extrabold text-gray-900 truncate tracking-tight mb-0.5">{user.name}</h2>
                            <p className="text-xs text-gray-500 truncate font-semibold">{user.email}</p>
                            <p className="text-xs text-amber-600 font-bold mt-1 tracking-wide">{user.phone || '+91 - Add phone'}</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-5 flex gap-3">
                    <div className="flex-1 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-gray-900 leading-none mb-1">{activeOrders.length}</span>
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Active</span>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-gray-900 leading-none mb-1">{deliveredOrders.length}</span>
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Delivered</span>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-green-600 leading-none mb-1">₹{totalSpent}</span>
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Spent</span>
                    </div>
                </div>

                <div className="px-4 mb-4">
                    <div className="flex bg-gray-200/60 p-1 rounded-xl">
                        <button
                            className={`flex-1 py-2 text-sm font-bold text-center rounded-lg transition-all duration-200 ${activeTab === 'account' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('account')}
                        >
                            Settings
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-bold text-center rounded-lg transition-all duration-200 relative ${activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            My Orders
                            {activeOrders.length > 0 && <span className="absolute top-2 right-4 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[9px] leading-none">{activeOrders.length}</span>}
                        </button>
                    </div>
                </div>

                {/* ─── ACCOUNT TAB ─── */}
                {activeTab === 'account' && (
                    <div className="px-4 space-y-5 animate-in fade-in duration-300">
                        <div>
                            <h3 className="px-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">General</h3>
                            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                                <SettingRow icon={<IconUser />} title="Edit Profile" subtitle="Name, phone number" onClick={handleOpenEditProfile} />
                                <SettingRow icon={<IconMapPin />} title="Saved Addresses" subtitle="Home, Office, Other" rightText={user.savedLocations?.length ? `${user.savedLocations.length} Saved` : 'None'} onClick={() => setIsAddressesModalOpen(true)} />
                                <SettingRow icon={<IconHeart />} title="Favorites" subtitle="Your liked items & shops" onClick={() => alert("Favorites feature is coming soon!")} isLast={true} />
                            </div>
                        </div>

                        <div>
                            <h3 className="px-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">App Settings</h3>
                            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                                <SettingRow icon={<IconBell />} title="Notifications" subtitle="Order updates, offers" badge={Notification.permission === 'granted' ? 'Enabled' : 'Off'} onClick={handleEnableNotifications} isLast={true} />
                            </div>
                        </div>

                        <div>
                            <h3 className="px-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Support & Legal</h3>
                            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                                <SettingRow icon={<IconHelp />} title="Help & Support" subtitle="FAQs, contact us" onClick={() => window.location.href = "mailto:support@munastore.in"} />
                                <SettingRow icon={<IconShield />} title="Privacy Policy" onClick={() => navigate('/privacy-policy')} />
                                <SettingRow icon={<IconDocument />} title="Terms of Service" onClick={() => navigate('/privacy-policy')} isLast={true} />
                            </div>
                        </div>

                        <div>
                            <div className="bg-white rounded-[20px] shadow-sm border border-red-50 overflow-hidden mb-6">
                                <SettingRow icon={<IconLogout />} title="Sign Out" isDanger={true} onClick={handleLogout} />
                                <SettingRow icon={<IconTrash />} title="Delete Account" subtitle="Permanently delete your data" isDanger={true} onClick={handleDeleteAccount} isLast={true} />
                            </div>
                            <div className="text-center pb-8">
                                <p className="text-xs text-gray-400 font-bold tracking-wide">MUNA App v1.0.0</p>
                                <p className="text-[10px] text-gray-400 font-medium mt-1">Made with ❤️ in India</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── ORDERS TAB ─── */}
                {activeTab === 'orders' && (
                    <div className="px-4 space-y-3 animate-in fade-in duration-300">
                        {loading ? (
                            <OrderSkeleton />
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-[20px] border border-gray-100 shadow-sm mt-2">
                                <span className="text-5xl block mb-4">📭</span>
                                <div className="text-lg font-extrabold text-gray-900 mb-1">No Orders Yet</div>
                                <div className="text-sm font-medium text-gray-500 max-w-[200px] mx-auto mb-6">Looks like you haven't ordered anything from MUNA yet.</div>
                                <button onClick={() => navigate('/')} className="bg-amber-400 text-gray-900 px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)]">
                                    Start Shopping
                                </button>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order._id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 active:scale-[0.98]">
                                    <div className="p-4 cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-sm font-extrabold text-gray-900 tracking-tight">{order.shopId?.name || "Local Shop"}</div>
                                                <div className="text-[11px] font-semibold text-gray-400 mt-0.5">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <StatusPill status={order.status} />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-[11px] font-extrabold text-amber-600 tracking-wider">#{order._id.slice(-6).toUpperCase()}</div>
                                            <div className={`text-gray-300 transition-transform duration-300 ${expandedOrderId === order._id ? 'rotate-180' : ''}`}>▼</div>
                                        </div>
                                    </div>

                                    {expandedOrderId === order._id && (
                                        <div className="px-4 pb-4 border-t border-gray-50 border-dashed animate-in slide-in-from-top-2 duration-200">

                                            {/* 🚀 NEW: DISPLAY OTP TO CUSTOMER */}
                                            {order.status === 'out_for_delivery' && (
                                                <div className="bg-amber-100/50 border-2 border-amber-400 rounded-xl p-4 mt-1 mb-4 text-center shadow-inner">
                                                    <span className="block text-[10px] font-black uppercase text-amber-800 tracking-widest mb-1.5">Your Delivery PIN</span>
                                                    <span className="block text-4xl font-black text-amber-600 tracking-[0.25em]">{order.deliveryOtp || '----'}</span>
                                                    <span className="block text-[10px] font-bold text-amber-700/80 mt-2 leading-tight">Share this PIN with the delivery partner to receive your order.</span>
                                                </div>
                                            )}

                                            <div className="py-3 space-y-2">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-[13px] font-medium text-gray-600">
                                                        <span><span className="font-bold text-gray-400 mr-2">{item.quantity}×</span>{item.name}</span>
                                                        <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {order.instructions && (
                                                <div className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl mt-2 mb-3">
                                                    <strong className="block text-[10px] font-extrabold uppercase text-amber-700 tracking-wider mb-1">📝 Instructions</strong>
                                                    <span className="text-xs font-medium text-amber-900">{order.instructions}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-50">
                                                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Total</span>
                                                <span className="text-base font-black text-green-600">₹{order.totalAmount}</span>
                                            </div>

                                            {order.status === 'pending' && (
                                                <button onClick={(e) => { e.stopPropagation(); handleCancelOrder(order._id); }} className="w-full mt-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 active:scale-95 transition-transform">
                                                    Cancel Order
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ─── NATIVE BOTTOM SHEET: EDIT PROFILE ─── */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 ease-out">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Edit Profile</h3>
                            <button onClick={() => setIsEditingProfile(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-extrabold text-gray-700 tracking-wide">Name</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-extrabold text-gray-700 tracking-wide">Phone Number</label>
                                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required minLength={10} maxLength={15} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" />
                            </div>
                            <button type="submit" disabled={isUpdating} className="w-full mt-4 p-4 bg-amber-400 text-gray-900 rounded-2xl font-extrabold text-[15px] active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)] disabled:opacity-70">
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── NATIVE BOTTOM SHEET: SAVED ADDRESSES ─── */}
            {isAddressesModalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 ease-out">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Saved Addresses</h3>
                            <button onClick={() => setIsAddressesModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <div className="space-y-3">
                            {user?.savedLocations && user.savedLocations.length > 0 ? (
                                user.savedLocations.map(loc => (
                                    <div key={loc._id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                <IconMapPin />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 tracking-tight">{loc.name}</span>
                                                <span className="text-[11px] font-semibold text-gray-500 mt-0.5 line-clamp-1">{loc.address || 'Saved Location'}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteLocation(loc._id)} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[11px] font-bold active:scale-95 transition-transform">
                                            Delete
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="w-14 h-14 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <IconMapPin />
                                    </div>
                                    <h4 className="text-sm font-extrabold text-gray-900">No saved addresses</h4>
                                    <p className="text-[11px] font-semibold text-gray-500 mt-1">You can save addresses during checkout.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;