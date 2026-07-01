import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { cartItems } = useCart();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Hide Navbar on specific routes where they have their own custom headers
    const hiddenPaths = ['/search', '/login', '/vendor-dashboard', '/admin-dashboard', '/cart', '/vendor-godown'];
    if (hiddenPaths.includes(location.pathname)) {
        return null;
    }

    return (
        <nav className="sticky top-0 z-[100] bg-amber-400 border-b border-amber-500/50 shadow-sm">
            <div className="max-w-[1200px] mx-auto px-4 h-[70px] flex items-center justify-between">
                
                {/* ── LEFT SECTION: Logo & Back Button ── */}
                <div className="flex items-center gap-4">
                    {location.pathname !== '/' && (
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 bg-white/30 hover:bg-white/50 border border-white/40 text-slate-900 rounded-full active:scale-95 transition-all flex items-center justify-center backdrop-blur-sm"
                        >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                    )}

                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-white p-1 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                            <img 
                                src="/muna-logo-new.png" 
                                alt="MUNA" 
                                className="h-9 w-auto object-contain"
                            />
                        </div>
                        <div className="hidden sm:flex flex-col leading-none">
                            <span className="text-[16px] font-black text-slate-900 tracking-tight">MUNA</span>
                            <span className="text-[10px] font-bold text-amber-900 tracking-wider">GROCERY IN MINUTES</span>
                        </div>
                    </Link>
                </div>

                {/* ── RIGHT SECTION: Actions ── */}
                {location.pathname !== '/notifications' && (
                    <div className="flex items-center gap-3">
                        
                        {/* Search Icon (Mobile/Tablet) */}
                        <Link 
                            to="/search" 
                            className="w-10 h-10 bg-white/20 hover:bg-white/40 border border-white/30 rounded-full flex items-center justify-center text-slate-900 transition-colors"
                        >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </Link>

                        {/* User Profile / Login */}
                        {user ? (
                            <div className="flex items-center gap-2">
                                {user.role === 'vendor' && (
                                    <Link to="/profile" className="hidden sm:flex w-10 h-10 bg-white/20 hover:bg-white/40 border border-white/30 rounded-full items-center justify-center text-lg transition-colors">
                                        🛍️
                                    </Link>
                                )}
                                <Link 
                                    to={user.role === 'super_admin' ? "/admin-dashboard" : user.role === 'vendor' ? "/vendor-dashboard" : "/profile"} 
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/40 border border-white/30 px-3 py-2 rounded-[14px] transition-colors"
                                >
                                    <span className="text-lg leading-none">{user.role === 'super_admin' ? '👑' : user.role === 'vendor' ? '🏪' : '👤'}</span>
                                    <span className="hidden sm:block text-[13px] font-bold text-slate-900">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </Link>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold px-5 py-2.5 rounded-[12px] transition-colors shadow-sm"
                            >
                                Login
                            </Link>
                        )}

                        {/* Cart Button */}
                        <Link 
                            to="/cart" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-[14px] shadow-[0_4px_12px_rgba(5,150,105,0.3)] transition-all active:scale-95 ml-1"
                        >
                            <div className="relative">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                                {totalItems > 0 && (
                                    <span className="sm:hidden absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-emerald-600">
                                        {totalItems}
                                    </span>
                                )}
                            </div>
                            {totalItems > 0 ? (
                                <div className="hidden sm:flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">My Cart</span>
                                    <span className="text-[13px] font-black">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
                                </div>
                            ) : (
                                <span className="hidden sm:block text-[13px] font-black">Cart</span>
                            )}
                        </Link>

                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
