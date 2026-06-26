import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useLiveOrders } from '../../hooks/useLiveOrders';

/* ─── Premium Crisp Icons ─── */
const IcoHome = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const IcoOrders = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const IcoMenu = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>);
const IcoGodown = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>);
const IcoSettings = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IcoBell = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>);
const IcoLogout = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const IcoBack = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
const IcoMore = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>);

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
        if (navigator.vibrate) navigator.vibrate(40);
        const res = await fetch(`/api/shops/${shop._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isOpen: !shop.isOpen }),
        });
        if (res.ok) setShop(await res.json());
    };

    const handleNavClick = (path) => {
        if (navigator.vibrate) navigator.vibrate(30);
        navigate(path);
    };

    const isActive = (path) => location.pathname === path || (path !== '/vendor' && location.pathname.startsWith(path));

    const navItems = [
        { path: '/vendor', icon: <IcoHome />, label: 'Home', exact: true },
        { path: '/vendor/orders', icon: <IcoOrders />, label: 'Orders', badge: liveOrderCount || null },
        { path: '/vendor/menu', icon: <IcoMenu />, label: 'Catalog' },
        { path: '/vendor/godown', icon: <IcoGodown />, label: 'Godown' },
        { path: '/vendor/settings', icon: <IcoSettings />, label: 'Settings' },
    ];

    if (!shop) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-sm font-black tracking-widest uppercase text-slate-400">Loading Store...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex">

            {/* ═══ SIDEBAR (Desktop) ═══ */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 fixed inset-y-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="h-20 flex items-center px-6 border-b border-slate-50">
                    <span className="text-2xl font-black tracking-tight text-amber-500">MUNA <span className="text-slate-300 font-bold text-sm ml-1 uppercase tracking-widest">Vendor</span></span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => handleNavClick(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[15px] font-black transition-all ${isActive(item.path) ? 'bg-amber-400 text-amber-950 shadow-[0_4px_14px_rgba(251,191,36,0.3)]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            {item.icon}
                            {item.label}
                            {item.badge > 0 && <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-md ${isActive(item.path) ? 'bg-amber-950 text-amber-400' : 'bg-rose-500 text-white'}`}>{item.badge}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-50 space-y-2">
                    <button onClick={() => handleNavClick('/profile')} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[15px] font-black text-slate-500 hover:bg-slate-50 transition-all">
                        <span>👤</span> Customer App
                    </button>
                    <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[15px] font-black text-rose-500 hover:bg-rose-50 transition-all">
                        <IcoLogout /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ═══ MAIN CONTENT AREA ═══ */}
            <div className="flex-1 md:ml-64 flex flex-col min-w-0">

                {/* ═══ HEADER ═══ */}
                <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleNavClick('/')} className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-xl active:scale-95 transition-all">
                            <IcoBack />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm overflow-hidden shrink-0">
                            {shop.image ? <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" /> : '🏪'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[15px] font-black text-slate-900 truncate tracking-tight leading-tight">{shop.name}</span>
                            {shop.udyamNumber && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mt-0.5">Verified</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={handleToggleShopStatus}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${shop.isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                            {shop.isOpen ? 'Accepting' : 'Closed'}
                        </button>
                        <button onClick={() => handleNavClick('/notifications')} className="relative p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors hidden sm:block">
                            <IcoBell />
                            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
                        </button>
                    </div>
                </header>

                {/* ═══ OUTLET (Page Content) ═══ */}
                <main className="flex-1 p-4 sm:p-8 pb-28 md:pb-8 overflow-x-hidden">
                    <Outlet context={{ shop, setShop, token, user, liveOrderCount }} />
                </main>
            </div>

            {/* ═══ NATIVE iOS STYLE BOTTOM TAB BAR (Mobile) ═══ */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around h-16 z-50 px-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
                {navItems.slice(0, 4).map(item => (
                    <button
                        key={item.path}
                        onClick={() => handleNavClick(item.path)}
                        className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${isActive(item.path) ? 'text-amber-500 scale-105' : 'text-slate-400 active:scale-95'}`}
                    >
                        {item.icon}
                        <span className="text-[10px] font-black tracking-tight">{item.label}</span>
                        {item.badge > 0 && <span className="absolute top-1 right-4 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none border border-white">{item.badge}</span>}
                    </button>
                ))}
                <button
                    onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(30);
                        setMobileMenuOpen(true);
                    }}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${mobileMenuOpen ? 'text-amber-500' : 'text-slate-400'}`}
                >
                    <IcoMore />
                    <span className="text-[10px] font-black tracking-tight">More</span>
                </button>
            </nav>

            {/* ═══ BOTTOM SHEET: MORE MENU ═══ */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
                    <div className="w-full bg-[#F8FAFC] rounded-t-[32px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 ease-out" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                        <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight px-2">More Options</h3>

                        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden mb-4">
                            <button onClick={() => { handleNavClick('/vendor/settings'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 border-b border-slate-50 text-[15px] font-black text-slate-800 active:bg-slate-50">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center"><IcoSettings /></div>
                                Store Settings
                            </button>
                            <button onClick={() => { handleNavClick('/profile'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 border-b border-slate-50 text-[15px] font-black text-slate-800 active:bg-slate-50">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl">👤</div>
                                Switch to Customer App
                            </button>
                            <button onClick={() => { handleNavClick('/notifications'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 text-[15px] font-black text-slate-800 active:bg-slate-50">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center"><IcoBell /></div>
                                Notifications
                                {unreadCount > 0 && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-md text-[10px] ml-auto">{unreadCount}</span>}
                            </button>
                        </div>

                        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-rose-50 overflow-hidden">
                            <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-4 p-4 text-[15px] font-black text-rose-600 active:bg-rose-50">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center"><IcoLogout /></div>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorLayout;