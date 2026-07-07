import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useUnreadChats } from '../hooks/useUnreadChats';

/* ─── Premium Outlined Icons ─── */
const IcoHome = ({ active }) => (
    <svg fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-[22px] h-[22px]">
        {active ? (
            <path fillRule="evenodd" d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69zM3 12.75a.75.75 0 01.75-.75h16.5a.75.75 0 01.75.75v8.25a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75v-8.25z" clipRule="evenodd" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        )}
    </svg>
);

const IcoSearch = ({ active }) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 3 : 2} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const IcoBell = ({ active }) => (
    <svg fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-[22px] h-[22px]">
        {active ? (
            <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.756a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.585 24.585 0 004.831-1.244.75.75 0 00.298-1.205A8.217 8.217 0 0118.75 9.756V9A6.75 6.75 0 0012 2.25z" clipRule="evenodd" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        )}
    </svg>
);

const IcoCart = ({ active }) => (
    <svg fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-[22px] h-[22px]">
        {active ? (
            <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        )}
    </svg>
);

const IcoUser = ({ active }) => (
    <svg fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-[22px] h-[22px]">
        {active ? (
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        )}
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
        queryFn: () => fetch('/api/notifications/unread-count', { credentials: 'include', 
            
        }).then(r => r.json()),
        enabled: !!user ,
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
    const isProfile = path === profileLink;

    // Helper for Nav Items
    const NavItem = ({ icon: Icon, label, isActive, onClick, to, badgeCount }) => {
        const content = (
            <div className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isActive ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>
                
                {/* Active Top Bar Indicator (Subtle) */}
                {isActive && (
                    <div className="absolute top-0 w-8 h-[3px] bg-amber-500 rounded-b-full"></div>
                )}
                
                <div className="relative mt-1">
                    <Icon active={isActive} />
                    {badgeCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                            {badgeCount}
                        </span>
                    )}
                </div>
                <span className={`text-[10px] tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>
                    {label}
                </span>
            </div>
        );

        if (to) {
            return (
                <Link to={to} className="flex-1 relative flex items-center justify-center h-full active:bg-slate-50 transition-colors">
                    {content}
                </Link>
            );
        }

        return (
            <button onClick={onClick} className="flex-1 relative flex items-center justify-center h-full active:bg-slate-50 transition-colors">
                {content}
            </button>
        );
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-white border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-[9000] flex items-stretch pb-[env(safe-area-inset-bottom,0px)]">
            <NavItem icon={IcoHome} label="Home" isActive={isHome} onClick={() => navigate('/')} />
            <NavItem icon={IcoSearch} label="Search" isActive={isSearch} onClick={() => navigate('/search')} />
            <NavItem icon={IcoBell} label="Alerts" isActive={isAlerts} onClick={() => navigate('/notifications')} badgeCount={totalAlerts} />
            <NavItem icon={IcoCart} label="Cart" isActive={isCart} to="/cart" badgeCount={totalCartItems} />
            <NavItem icon={IcoUser} label={user ? 'Profile' : 'Login'} isActive={isProfile} to={profileLink} />
        </nav>
    );
};

export default BottomNav;
