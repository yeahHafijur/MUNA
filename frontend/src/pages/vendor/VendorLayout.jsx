import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './VendorLayout.css';

/* ─── SVG Icons ─── */
const IcoHome = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const IcoOrders = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const IcoMenu = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>);
const IcoSettings = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IcoGodown = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>);
const IcoBell = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>);
const IcoLogout = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const IcoBack = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
const IcoMore = () => (<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>);

const VendorLayout = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [shop, setShop] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [liveOrderCount, setLiveOrderCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Redirect non-vendors
    useEffect(() => {
        if (!token || user?.role !== 'vendor') { navigate('/'); return; }

        fetch(`/api/shops/my-shop?t=${new Date().getTime()}`, { 
            headers: { 
                Authorization: `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            } 
        })
            .then(r => r.json())
            .then(data => { if (data._id) setShop(data); });
    }, [token, user, navigate]);

    // Poll unread notifications + live order count
    useEffect(() => {
        if (!token || !shop) return;
        const poll = () => {
            fetch('/api/notifications/unread-count', { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json()).then(d => { if (d.count !== undefined) setUnreadCount(d.count); }).catch(() => {});

            fetch('/api/orders/vendor?status=pending&limit=100', { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json()).then(d => {
                    const orders = d.orders || d;
                    if (Array.isArray(orders)) {
                        setLiveOrderCount(orders.filter(o => !['delivered','cancelled'].includes(o.status)).length);
                    }
                }).catch(() => {});
        };
        poll();
        const id = setInterval(poll, 15000);
        return () => clearInterval(id);
    }, [token, shop]);

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
        { path: '/vendor/settings', icon: <IcoSettings />, label: 'Settings' },
        { path: '/vendor/godown', icon: <IcoGodown />, label: 'Godown' },
    ];

    if (!shop) return (
        <div className="v-loading">
            <div className="v-loading-spinner" />
            <div className="v-loading-text">Loading your dashboard…</div>
        </div>
    );

    return (
        <div className="v-shell">
            {/* ═══ SIDEBAR (Desktop) ═══ */}
            <aside className="v-sidebar">
                <div className="v-sidebar-logo">
                    MUNA <span>Vendor</span>
                </div>
                <nav className="v-sidebar-nav">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            className={`v-sidebar-link ${item.exact ? (location.pathname === item.path ? 'active' : '') : isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge > 0 && <span className="v-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>
                <div className="v-sidebar-bottom">
                    <button className="v-sidebar-link" onClick={() => { logout(); navigate('/'); }}>
                        <IcoLogout />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ═══ HEADER ═══ */}
            <header className="v-header">
                <div className="v-header-left">
                    <button className="v-btn-icon" onClick={() => navigate('/')} title="Back to Store">
                        <IcoBack />
                    </button>
                    {shop.image ? (
                        <img src={shop.image} alt={shop.name} className="v-header-avatar" />
                    ) : (
                        <div className="v-header-avatar" style={{ background: 'var(--v-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏪</div>
                    )}
                    <div>
                        <div className="v-header-shop-name">
                            {shop.name}
                            {shop.udyamNumber && <span className="v-header-badge">Verified</span>}
                        </div>
                    </div>
                </div>
                <div className="v-header-right">
                    <button
                        className={`v-status-toggle ${shop.isOpen ? 'v-status-toggle--open' : 'v-status-toggle--closed'}`}
                        onClick={handleToggleShopStatus}
                    >
                        <span className={`v-status-dot ${shop.isOpen ? 'v-status-dot--open' : 'v-status-dot--closed'}`} />
                        {shop.isOpen ? 'Open' : 'Closed'}
                    </button>
                    <button className="v-btn-icon" style={{ position: 'relative' }} onClick={() => navigate('/notifications')}>
                        <IcoBell />
                        {unreadCount > 0 && <span className="v-notif-dot">{unreadCount}</span>}
                    </button>
                </div>
            </header>

            {/* ═══ MAIN CONTENT ═══ */}
            <main className="v-main">
                <Outlet context={{ shop, setShop, token, user, liveOrderCount }} />
            </main>

            {/* ═══ BOTTOM TAB BAR (Mobile) ═══ */}
            <div className="v-bottombar">
                <div className="v-bottombar-inner">
                    {navItems.slice(0, 4).map(item => (
                        <button
                            key={item.path}
                            className={`v-bottombar-item ${item.exact ? (location.pathname === item.path ? 'active' : '') : isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge > 0 && <span className="v-badge">{item.badge}</span>}
                        </button>
                    ))}
                    <button
                        className={`v-bottombar-item ${mobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <IcoMore />
                        <span>More</span>
                    </button>
                </div>
            </div>

            {/* ═══ MOBILE MORE MENU ═══ */}
            {mobileMenuOpen && (
                <div className="v-modal-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', borderRadius: '14px 14px 0 0' }}>
                        <div className="v-modal-body" style={{ padding: '16px' }}>
                            <button className="v-sidebar-link" style={{ width: '100%', marginBottom: '4px' }} onClick={() => { navigate('/vendor/godown'); setMobileMenuOpen(false); }}>
                                <IcoGodown /> <span>Godown</span>
                            </button>
                            <button className="v-sidebar-link" style={{ width: '100%', marginBottom: '4px' }} onClick={() => { navigate('/notifications'); setMobileMenuOpen(false); }}>
                                <IcoBell /> <span>Notifications</span>
                                {unreadCount > 0 && <span className="v-badge">{unreadCount}</span>}
                            </button>
                            <div className="v-sidebar-divider" />
                            <button className="v-sidebar-link" style={{ width: '100%', color: 'var(--v-danger)' }} onClick={() => { logout(); navigate('/'); }}>
                                <IcoLogout /> <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorLayout;
