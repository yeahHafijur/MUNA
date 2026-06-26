import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useLiveOrders } from '../../hooks/useLiveOrders';
/* ─── Premium Crisp Icons ─── */
const IcoHome = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const IcoOrders = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const IcoMenu = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>);
const IcoSettings = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IcoGodown = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>);
const IcoBell = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>);
const IcoLogout = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const IcoBack = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
const IcoMore = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>);

const VendorLayout = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [shop, setShop] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { data: unreadCount = 0 } = useUnreadNotifications();
    const { data: liveOrderCount = 0 } = useLiveOrders();

    useEffect(() => {
        if (!token || user?.role !== 'vendor') { navigate('/'); return; }
        fetch(`/api/shops/my-shop?t=${new Date().getTime()}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => { if (data._id) setShop(data); });
    }, [token, user, navigate]);

    const handleToggleShopStatus = async () => {
        if (!shop) return;
        const res = await fetch(`/api/shops/${shop._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isOpen: !shop.isOpen }),
        });
        if (res.ok) setShop(await res.json());
    };

    const isActive = (path) => location.pathname === path || (path !== '/vendor' && location.pathname.startsWith(path));

    const navItems = [
        { path: '/vendor', icon: <IcoHome />, label: 'Dashboard', exact: true },
        { path: '/vendor/orders', icon: <IcoOrders />, label: 'Orders', badge: liveOrderCount || null },
        { path: '/vendor/menu', icon: <IcoMenu />, label: 'Catalog' },
        { path: '/vendor/godown', icon: <IcoGodown />, label: 'Godown' },
        { path: '/vendor/settings', icon: <IcoSettings />, label: 'Settings' },
    ];

    if (!shop) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-500">Loading your store...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 flex">

            {/* ═══ SIDEBAR (Desktop) ═══ */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-50">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <span className="text-xl font-black tracking-tight text-amber-500">MUNA <span className="text-slate-400 font-medium text-sm ml-1">Vendor</span></span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive(item.path) ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            {item.icon}
                            {item.label}
                            {item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{item.badge}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-100 space-y-1">
                    <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                        <span>👤</span> Customer Profile
                    </button>
                    <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
                        <IcoLogout /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ═══ MAIN CONTENT AREA ═══ */}
            <div className="flex-1 md:ml-64 flex flex-col min-w-0">

                {/* ═══ HEADER ═══ */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')} className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                            <IcoBack />
                        </button>
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shadow-sm overflow-hidden shrink-0">
                            {shop.image ? <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" /> : '🏪'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-900 truncate tracking-tight">{shop.name}</span>
                            {shop.udyamNumber && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Verified</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={handleToggleShopStatus}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${shop.isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {shop.isOpen ? 'Open' : 'Closed'}
                        </button>
                        <button onClick={() => navigate('/notifications')} className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
                            <IcoBell />
                            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
                        </button>
                    </div>
                </header>

                {/* ═══ OUTLET (Page Content) ═══ */}
                <main className="flex-1 p-4 sm:p-8 pb-24 md:pb-8 overflow-x-hidden">
                    <Outlet context={{ shop, setShop, token, user, liveOrderCount }} />
                </main>
            </div>

            {/* ═══ BOTTOM TAB BAR (Mobile) ═══ */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around h-16 z-50 px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                {navItems.slice(0, 4).map(item => (
                    <button key={item.path} onClick={() => navigate(item.path)} className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive(item.path) ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>
                        {item.icon}
                        <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                        {item.badge > 0 && <span className="absolute top-1 right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white leading-none">{item.badge}</span>}
                    </button>
                ))}
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${mobileMenuOpen ? 'text-amber-500' : 'text-slate-400'}`}>
                    <IcoMore />
                    <span className="text-[10px] font-bold tracking-tight">More</span>
                </button>
            </nav>

            {/* ═══ MOBILE MORE MENU MODAL ═══ */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-end animate-in fade-in" onClick={() => setMobileMenuOpen(false)}>
                    <div className="w-full bg-white rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-full duration-200" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                        <div className="space-y-2">
                            <button onClick={() => { navigate('/vendor/settings'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700">
                                <IcoSettings /> Store Settings
                            </button>
                            <button onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700">
                                <span>👤</span> Customer Profile
                            </button>
                            <button onClick={() => { navigate('/notifications'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700">
                                <IcoBell /> Notifications {unreadCount > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] ml-auto">{unreadCount}</span>}
                            </button>
                            <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-2xl text-sm font-bold text-red-600 mt-4 border border-red-100">
                                <IcoLogout /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorLayout;