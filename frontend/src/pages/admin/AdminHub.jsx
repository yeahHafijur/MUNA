import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

/* ─── Crisp Native Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IcoOnboard = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>;
const IcoShops = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>;
const IcoCats = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;
const IcoGodown = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const IcoApproval = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IcoSettings = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IcoBanner = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const IcoChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;

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
            {badge > 0 && <span className="px-2.5 py-1 rounded-md bg-rose-500 text-white text-[10px] font-black leading-none">{badge}</span>}
            <IcoChevron />
        </div>
    </div>
);

const AdminHub = () => {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    // Fetch stats
    const { data: stats = { totalShops: 0, openNow: 0, godownItems: 0, pendingApprovals: 0 } } = useQuery({
        queryKey: ['admin-hub-stats'],
        queryFn: async () => {
            const [shopsRes, godownRes] = await Promise.all([
                fetch('/api/shops?admin=true', { credentials: 'include',   }),
                fetch('/api/master-products', { credentials: 'include' })
            ]);
            const shops = await shopsRes.json();
            const godown = await godownRes.json();
            const shopsList = Array.isArray(shops) ? shops : [];
            const godownList = Array.isArray(godown) ? godown : [];

            return {
                totalShops: shopsList.length,
                openNow: shopsList.filter(s => s.isOpen).length,
                godownItems: godownList.filter(i => i.status !== 'pending').length,
                pendingApprovals: godownList.filter(i => i.status === 'pending').length
            };
        },
        enabled:  user?.role === 'super_admin',
        refetchInterval: 30000
    });

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-10">

            {/* ─── NATIVE HEADER ─── */}
            <div className="bg-white px-4 pt-6 pb-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/'); }}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shrink-0"
                    >
                        <IconBack />
                    </button>
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-inner shrink-0">
                        M
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[16px] font-black text-slate-900 tracking-tight leading-none mb-1">Admin Console</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Super Admin</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 pt-6 max-w-7xl mx-auto w-full space-y-6">

                {/* ─── KEY METRICS ─── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-slate-900 mb-1">{stats.totalShops}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Shops</span>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-emerald-600 mb-1">{stats.openNow}</span>
                        <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Open Now</span>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-amber-500 mb-1">{stats.godownItems}</span>
                        <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Godown Items</span>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-rose-500 mb-1">{stats.pendingApprovals}</span>
                        <span className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest">Pending</span>
                    </div>
                </div>

                {/* ─── MASTER NAVIGATION LIST ─── */}
                <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <NavigationRow
                        icon={<span className="text-xl">📈</span>}
                        title="Live Order Monitor"
                        subtitle="Track all shop orders in real-time"
                        onClick={() => navigate('/admin/live-orders')}
                    />
                    <NavigationRow
                        icon={<IcoOnboard />}
                        title="Onboard Vendor"
                        subtitle="Register new vendors & shops"
                        onClick={() => navigate('/admin/onboard')}
                    />
                    <NavigationRow
                        icon={<span className="text-xl">🏪</span>}
                        title="Vendor Requests"
                        subtitle="Review user applications"
                        onClick={() => navigate('/admin/vendor-requests')}
                    />
                    <NavigationRow
                        icon={<IcoShops />}
                        title="Manage Shops"
                        subtitle={`${stats.totalShops} registered shops`}
                        onClick={() => navigate('/admin/shops')}
                    />
                    <NavigationRow
                        icon={<IcoCats />}
                        title="Categories"
                        subtitle="Shop & item categories"
                        onClick={() => navigate('/admin/categories')}
                    />
                    <NavigationRow
                        icon={<IcoGodown />}
                        title="Master Godown"
                        subtitle={`${stats.godownItems} approved items`}
                        onClick={() => navigate('/admin/godown')}
                    />
                    <NavigationRow
                        icon={<IcoApproval />}
                        title="Approvals"
                        subtitle="Pending godown items"
                        badge={stats.pendingApprovals}
                        onClick={() => navigate('/admin/approvals')}
                    />
                    <NavigationRow
                        icon={<span className="text-xl">📢</span>}
                        title="Broadcast Notification"
                        subtitle="Send push to users"
                        onClick={() => navigate('/admin/broadcast')}
                    />
                    <NavigationRow
                        icon={<IcoSettings />}
                        title="App Settings"
                        subtitle="Navbar message & config"
                        onClick={() => navigate('/admin/settings')}
                    />
                    <NavigationRow
                        icon={<IcoBanner />}
                        title="Manage Banners"
                        subtitle="Top & mid promotions"
                        onClick={() => navigate('/admin/banners')}
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
                    <p className="text-xs text-slate-400 font-bold tracking-wide">MUNA Admin Console v2.0</p>
                </div>
            </div>
        </div>
    );
};

export default AdminHub;
