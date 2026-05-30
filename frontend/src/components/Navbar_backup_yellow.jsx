import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Auth Context ko bulaya

const Navbar = () => {
    const { cartItems } = useCart();
    const { user, logout } = useAuth(); // User data aur logout function nikala

    // Page aage piche karne ke tools
    const navigate = useNavigate();
    const location = useLocation();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <nav className="bg-[#f8cb46] sticky top-0 z-50 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">

                <div className="flex items-center gap-3">
                    {/* Back Button (Sirf tab dikhega jab hum Home par nahi honge) */}
                    {location.pathname !== '/' && (
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    )}

                    {/* Logo */}
                    <Link to="/" className="flex flex-col">
                        <span className="text-2xl font-black text-black tracking-tight leading-none">
                            MUNA
                        </span>
                        <span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">
                            Your Village Store
                        </span>
                    </Link>
                </div>

                {/* Right Side: Login / Profile & Cart */}
                <div className="flex items-center gap-3">

                    {/* Agar User login hai toh naam dikhao, warna Login button */}
                    {/* Agar User login hai toh Profile par jane ka Button, warna Login button */}
                    {user ? (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Link 
                                to={user.role === 'super_admin' ? "/admin-dashboard" : user.role === 'vendor' ? "/vendor-dashboard" : "/profile"} 
                                className="flex items-center gap-1 sm:gap-2 bg-yellow-100 hover:bg-yellow-200 px-2 sm:px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                            >
                                <span className="text-lg">{user.role === 'super_admin' ? '👑' : user.role === 'vendor' ? '🏪' : '👤'}</span>
                                <span className="hidden sm:inline text-sm font-bold text-gray-800">Hi, {user.name.split(' ')[0]}</span>
                            </Link>
                            <button onClick={() => { logout(); navigate('/'); }} className="text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center">
                                <span className="hidden sm:inline">Logout</span>
                                <span className="sm:hidden text-lg">🚪</span>
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="text-sm font-bold text-gray-800 bg-white/50 hover:bg-white/80 px-3 sm:px-4 py-2 rounded-lg transition-colors"
                        >
                            Login
                        </Link>
                    )}


                    {/* Cart Button */}
                    <Link to="/cart" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 sm:px-4 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors shadow-md ml-1 sm:ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="hidden sm:inline">Cart {totalItems > 0 && `(${totalItems})`}</span>
                        <span className="sm:hidden">{totalItems > 0 && totalItems}</span>
                    </Link>

                </div>

            </div>
        </nav>
    );
};

export default Navbar;
