import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { requestFirebaseNotificationPermission } from '../../firebase';

/* ─── Crisp Native Icons ─── */
const IcoOrders = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const IcoMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IcoSettings = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IcoBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const IcoChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const IcoGodown = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const IcoUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

const NavigationRow = ({ icon, title, subtitle, onClick, badge, isLast, iconBgClass }) => (
    <div
        onClick={() => {
            if (navigator.vibrate) navigator.vibrate(30);
            onClick();
        }}
        className={`flex items-center justify-between p-4 bg-white active:bg-slate-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/50 shadow-sm ${iconBgClass || 'bg-slate-100 text-slate-700'}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[15px] font-black text-slate-900 tracking-tight">{title}</span>
                {subtitle && <span className="text-[12px] font-semibold text-slate-400 mt-0.5">{subtitle}</span>}
            </div>
        </div>
        <div className="flex items-center gap-3">
            {badge > 0 && <span className="px-2.5 py-1 rounded-md bg-rose-500 text-white text-[10px] font-black leading-none">{badge} NEW</span>}
            <IcoChevron />
        </div>
    </div>
);

const VendorHub = () => {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Delivery Rules State
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [minOrder, setMinOrder] = useState('');
    const [minimumCharge, setMinimumCharge] = useState('');
    const [chargePerKm, setChargePerKm] = useState('');
    const [maxDeliveryRange, setMaxDeliveryRange] = useState('');

    const { data: shop } = useQuery({
        queryKey: ['my-shop'],
        queryFn: async () => {
            const res = await fetch('/api/shops/my-shop', { credentials: 'include',   });
            const data = await res.json();
            return data._id ? data : null;
        },
        enabled:  user?.role === 'vendor'
    });

    useEffect(() => {
        if (user?.role !== 'vendor') navigate('/');
    }, [token, user, navigate]);

    const handleOpenDeliveryModal = () => {
        if (shop) {
            setMinOrder(shop.deliverySettings?.minOrderAmount || 0);
            setMinimumCharge(shop.deliverySettings?.minimumCharge || 0);
            setChargePerKm(shop.deliverySettings?.chargePerKm || 0);
            setMaxDeliveryRange(shop.deliverySettings?.maxRange || 5);
        }
        setIsDeliveryModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const loadingToast = toast.loading("Saving delivery rules...");
        try {
            const body = {
                deliverySettings: {
                    minOrderAmount: Number(minOrder),
                    minimumCharge: Number(minimumCharge),
                    chargePerKm: Number(chargePerKm),
                    maxRange: Number(maxDeliveryRange)
                }
            };
            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json',  },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const updatedShop = await res.json();
                queryClient.setQueryData(['my-shop'], updatedShop);
                toast.success("Delivery rules updated!");
                setIsDeliveryModalOpen(false);
            } else {
                toast.error("Failed to update rules.");
            }
        } catch {
            toast.error("Error updating rules.");
        } finally {
            toast.dismiss(loadingToast);
            setIsSaving(false);
        }
    };

    const handleEnableNotifications = async () => {
        try {
            const fcmToken = await requestFirebaseNotificationPermission();
            if (fcmToken) {
                await fetch('/api/auth/fcm-token', { credentials: 'include', 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ fcmToken })
                });
                toast.success("Notifications enabled!");
            } else {
                toast.warning("Please allow notifications in browser settings.");
            }
        } catch {
            toast.error("Failed to enable notifications.");
        }
    };

    // Fetch Stats via React Query for zero-latency
    const { data: stats = { liveOrders: 0, todayRevenue: 0, totalProducts: 0 } } = useQuery({
        queryKey: ['vendor-hub-stats'],
        queryFn: async () => {
            const res = await fetch('/api/orders/vendor?limit=100', { credentials: 'include',   });
            const data = await res.json();
            const orders = data.orders || [];

            const today = new Date().toDateString();
            const liveOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
            const todayRevenue = orders
                .filter(o => o.status === 'delivered' && new Date(o.createdAt).toDateString() === today)
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            // Fetch products count separately
            let productCount = 0;
            if (shop?._id) {
                const prodRes = await fetch(`/api/products/${shop._id}`, { credentials: 'include' });
                const prodData = await prodRes.json();
                productCount = Array.isArray(prodData) ? prodData.length : 0;
            }

            return { liveOrders: liveOrders.length, todayRevenue, totalProducts: productCount };
        },
        enabled:  !!shop,
        refetchInterval: 15000 // Refresh stats every 15 seconds
    });

    const handleToggleShopStatus = async () => {
        if (!shop) return;
        if (navigator.vibrate) navigator.vibrate(50);
        const res = await fetch(`/api/shops/${shop._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json',  },
            body: JSON.stringify({ isOpen: !shop.isOpen }),
        });
        if (res.ok) {
            const updatedShop = await res.json();
            queryClient.setQueryData(['my-shop'], updatedShop);
        }
    };

    if (!shop) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-sm font-black tracking-widest uppercase text-slate-400">Loading Store...</p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#F5F6F8] overflow-hidden font-sans pb-4">
            
            {/* ── HEADER ── */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/'); }} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                        <IconBack />
                    </button>
                    <span className="text-[17px] font-extrabold text-slate-900 tracking-tight">Merchant Hub</span>
                    
                    {/* Store Status Toggle */}
                    <button
                        onClick={handleToggleShopStatus}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${shop.isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {shop.isOpen ? 'Open' : 'Closed'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                
                {/* ── SHOP PROFILE CARD ── */}
                <div className="bg-white p-5 border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4">
                        <div className="shrink-0">
                            <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-2xl shadow-sm overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200">
                                {shop.image ? <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" /> : '🏪'}
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <h2 className="text-[18px] font-extrabold text-slate-900 truncate tracking-tight">{shop.name}</h2>
                            <p className="text-[12px] font-medium text-slate-500 truncate mb-1.5">{shop.address || 'Vendor Store'}</p>
                            <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-black text-amber-700 w-max tracking-wider uppercase border border-amber-100/50">
                                ⭐ {shop.rating || 'New Shop'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── QUICK METRICS ── */}
                <div className="grid grid-cols-2 gap-3 p-4">
                    <div className="bg-white p-3 rounded-[20px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <span className="text-[24px] leading-none font-black text-slate-800 mb-1">{stats.liveOrders}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Orders</span>
                    </div>
                    <div className="bg-white p-3 rounded-[20px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <span className="text-[24px] leading-none font-black text-emerald-500 mb-1">₹{stats.todayRevenue}</span>
                        <span className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Today's Sales</span>
                    </div>
                </div>

                {/* ── MENUS ── */}
                <div className="px-4 space-y-3 pb-8">
                    
                    <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <NavigationRow icon={<IcoOrders />} iconBgClass="bg-blue-50 text-blue-600" title="Manage Orders" subtitle="Accept, dispatch & verify" badge={stats.liveOrders} onClick={() => navigate('/vendor/orders')} />
                        <NavigationRow icon={<IcoMenu />} iconBgClass="bg-purple-50 text-purple-600" title="Catalog & Menu" subtitle={`${stats.totalProducts} Items in your store`} onClick={() => navigate('/vendor/menu')} />
                        <NavigationRow icon={<IcoGodown />} iconBgClass="bg-amber-50 text-amber-600" title="Master Godown" subtitle="Import bulk items instantly" onClick={() => navigate('/vendor/godown')} />
                        <NavigationRow icon={<IcoSettings />} iconBgClass="bg-slate-50 text-slate-700" title="Delivery Rules" subtitle={`Max ${shop.deliverySettings?.maxRange || 5}km • Min ₹${shop.deliverySettings?.minOrderAmount || 0}`} onClick={handleOpenDeliveryModal} />
                        <NavigationRow icon={<IcoBell />} iconBgClass="bg-rose-50 text-rose-500" title="Notifications" subtitle="New order alerts" onClick={handleEnableNotifications} isLast />
                    </div>

                    <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <NavigationRow icon={<IcoUser />} iconBgClass="bg-emerald-50 text-emerald-600" title="My Profile" subtitle="Customer account settings" onClick={() => navigate('/profile')} isLast />
                    </div>

                    <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <button
                            onClick={() => { toast.info("Logged out successfully"); logout(); navigate('/'); }}
                            className="w-full flex items-center justify-between p-3.5 bg-white active:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                                </div>
                                <span className="text-[14px] font-bold tracking-tight text-rose-600">Sign Out</span>
                            </div>
                        </button>
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MUNA Merchant App v2.0</p>
                    </div>
                </div>
            </div>

            {/* ── FLOATING BOTTOM SHEET: DELIVERY RULES ── */}
            {isDeliveryModalOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 ease-out" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <h3 className="text-[18px] font-extrabold text-slate-900 tracking-tight">Delivery Rules</h3>
                            <button onClick={() => setIsDeliveryModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="relative">
                                <input type="number" required value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="peer w-full pt-5 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-[16px] text-[15px] text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Min Order" />
                                <label className="absolute left-4 top-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-1.5 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case">Minimum Order (₹)</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <input type="number" required value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} className="peer w-full pt-5 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-[16px] text-[15px] text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Base Charge" />
                                    <label className="absolute left-4 top-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-1.5 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case">Base Charge (₹)</label>
                                </div>
                                <div className="relative">
                                    <input type="number" required value={chargePerKm} onChange={(e) => setChargePerKm(e.target.value)} className="peer w-full pt-5 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-[16px] text-[15px] text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Per KM" />
                                    <label className="absolute left-4 top-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-1.5 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case">Charge/KM (₹)</label>
                                </div>
                            </div>
                            <div className="relative">
                                <input type="number" required value={maxDeliveryRange} onChange={(e) => setMaxDeliveryRange(e.target.value)} className="peer w-full pt-5 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-[16px] text-[15px] text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Max Range" />
                                <label className="absolute left-4 top-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-1.5 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case">Max Range (KM)</label>
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full mt-2 p-3.5 bg-amber-400 text-slate-900 rounded-[16px] font-black text-[14px] active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)] disabled:opacity-70">
                                {isSaving ? 'Saving...' : 'Save Rules'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorHub;