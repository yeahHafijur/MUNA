import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useUnreadChats } from '../hooks/useUnreadChats';
import './BottomNav.css';

/* ─── Icon Components ─── */
const IcoHome = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    </svg>
);
const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const IcoBell = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);
const IcoCart = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const IcoUser = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const BottomNav = () => {
    const { user } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);

    const token = localStorage.getItem('token');
    const { data: unreadData } = useQuery({
        queryKey: ['unread-count', user?._id],
        queryFn: () => fetch('/api/notifications/unread-count', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        enabled: !!user && !!token,
    });
    const unreadCount = unreadData?.count || 0;
    const { data: unreadChatCount = 0 } = useUnreadChats();

    const totalAlerts = unreadCount + unreadChatCount;

    /* Profile link target */
    const profileLink = user
        ? (user.role === 'super_admin' ? '/admin-dashboard' : user.role === 'vendor' ? '/vendor-dashboard' : '/profile')
        : '/login';

    // Hide bottom nav on these pages
    const hiddenPaths = ['/profile', '/login', '/vendor', '/admin', '/privacy-policy', '/daily-market', '/chat'];
    const shouldHide = hiddenPaths.some(p => location.pathname.startsWith(p));
    if (shouldHide) return null;

    // Determine active tab
    const path = location.pathname;
    const isHome = path === '/';
    const isSearch = path === '/search';
    const isAlerts = path === '/notifications';
    const isCart = path === '/cart';

    return (
        <nav className="bn-nav">
            <button className={`bn-nav-item ${isHome ? 'bn-nav-item--active' : ''}`} onClick={() => navigate('/')}>
                <span className="bn-nav-icon"><IcoHome /></span>
                Home
            </button>

            <button className={`bn-nav-item ${isSearch ? 'bn-nav-item--active' : ''}`} onClick={() => navigate('/search')}>
                <span className="bn-nav-icon"><IcoSearch /></span>
                Search
            </button>

            <button className={`bn-nav-item ${isAlerts ? 'bn-nav-item--active' : ''}`} onClick={() => navigate('/notifications')}>
                <span className="bn-nav-icon" style={{ position: 'relative' }}>
                    <IcoBell />
                    {totalAlerts > 0 && (
                        <span className="bn-nav-badge">{totalAlerts}</span>
                    )}
                </span>
                Alerts
            </button>

            <Link to="/cart" className={`bn-nav-item ${isCart ? 'bn-nav-item--active' : ''}`}>
                <span className="bn-nav-icon">
                    <IcoCart />
                    {totalCartItems > 0 && (
                        <span key={totalCartItems} className="bn-nav-badge">{totalCartItems}</span>
                    )}
                </span>
                Cart
            </Link>

            <Link to={profileLink} className="bn-nav-item">
                <span className="bn-nav-icon"><IcoUser /></span>
                {user ? 'Profile' : 'Login'}
            </Link>
        </nav>
    );
};

export default BottomNav;
