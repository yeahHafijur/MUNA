import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

/* ─── Crisp Native Icons ─── */
const IcoOrders = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const IcoMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IcoSettings = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IcoChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const IcoGodown = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const IcoUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;

const NavigationRow = ({ icon, title, subtitle, onClick, badge, isLast }) => (
    <div
        onClick={() => {
            if (navigator.vibrate) navigator.vibrate(30);
            onClick();
        }}
        className={`flex items-center justify-between p-4 bg-white active:bg-slate-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
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

    const { data: shop } = useQuery({
        queryKey: ['my-shop'],
        queryFn: async () => {
            const res = await fetch('/api/shops/my-shop', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            return data._id ? data : null;
        },
        enabled: !!token && user?.role === 'vendor'
    });

    useEffect(() => {
        if (!token || user?.role !== 'vendor') navigate('/');
    }, [token, user, navigate]);

    // Fetch Stats via React Query for zero-latency
    const { data: stats = { liveOrders: 0, todayRevenue: 0, totalProducts: 0 } } = useQuery({
        queryKey: ['vendor-hub-stats'],
        queryFn: async () => {
            const res = await fetch('/api/orders/vendor?limit=100', { headers: { Authorization: `Bearer ${token}` } });
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
                const prodRes = await fetch(`/api/products/${shop._id}`);
                const prodData = await prodRes.json();
                productCount = Array.isArray(prodData) ? prodData.length : 0;
            }

            return { liveOrders: liveOrders.length, todayRevenue, totalProducts: productCount };
        },
        enabled: !!token && !!shop,
        refetchInterval: 15000 // Refresh stats every 15 seconds
    });

    const handleToggleShopStatus = async () => {
        if (!shop) return;
        if (navigator.vibrate) navigator.vibrate(50);
        const res = await fetch(`/api/shops/${shop._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-10">

            {/* ─── NATIVE HEADER ─── */}
            <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shadow-inner overflow-hidden">
                        {shop.image ? <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" /> : '🏪'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[17px] font-black text-slate-900 tracking-tight leading-none mb-1">{shop.name}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Merchant Hub</span>
                    </div>
                </div>

                {/* Store Status Toggle */}
                <button
                    onClick={handleToggleShopStatus}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${shop.isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                >
                    <span className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    {shop.isOpen ? 'Open' : 'Closed'}
                </button>
            </div>

            <div className="flex-1 px-4 pt-6 max-w-3xl mx-auto w-full space-y-6">

                {/* ─── KEY METRICS ─── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-slate-900 mb-1">{stats.liveOrders}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Orders</span>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-emerald-600 mb-1">₹{stats.todayRevenue}</span>
                        <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Today's Sales</span>
                    </div>
                </div>

                {/* ─── MASTER NAVIGATION LIST ─── */}
                <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <NavigationRow
                        icon={<IcoOrders />}
                        title="Manage Orders"
                        subtitle="Accept, dispatch & verify"
                        badge={stats.liveOrders}
                        onClick={() => navigate('/vendor/orders')}
                    />
                    <NavigationRow
                        icon={<IcoMenu />}
                        title="Catalog & Menu"
                        subtitle={`${stats.totalProducts} Items in your store`}
                        onClick={() => navigate('/vendor/menu')}
                    />
                    <NavigationRow
                        icon={<IcoGodown />}
                        title="Master Godown"
                        subtitle="Import bulk items instantly"
                        onClick={() => navigate('/vendor/godown')}
                    />
                    <NavigationRow
                        icon={<IcoSettings />}
                        title="Store Settings"
                        subtitle="Delivery rules & profile"
                        onClick={() => navigate('/vendor/settings')}
                        isLast={true}
                    />
                </div>

                {/* ─── ACCOUNT ACTIONS ─── */}
                <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <NavigationRow
                        icon={<IcoUser />}
                        title="Customer Mode"
                        subtitle="Order from other stores"
                        onClick={() => navigate('/profile')}
                        isLast={true}
                    />
                </div>

                <button
                    onClick={() => { toast.info("Logged out successfully"); logout(); navigate('/'); }}
                    className="w-full py-4 bg-rose-50 text-rose-600 rounded-[24px] text-[14px] font-black uppercase tracking-widest active:scale-95 transition-transform border border-rose-100"
                >
                    Sign Out
                </button>

                <div className="text-center pt-2">
                    <p className="text-xs text-slate-400 font-bold tracking-wide">MUNA Merchant App v2.0</p>
                </div>
            </div>
        </div>
    );
};

export default VendorHub;