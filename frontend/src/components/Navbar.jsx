import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css'; // Auth Context ko bulaya

const Navbar = () => {
    const { cartItems } = useCart();
    const { user, logout } = useAuth(); // User data aur logout function nikala

    // Page aage piche karne ke tools
    const navigate = useNavigate();
    const location = useLocation();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Agar hum Search ya Login page par hain, toh Navbar mat dikhao
    if (location.pathname === '/search' || location.pathname === '/login') {
        return null;
    }

    return (
        <nav className="navbar-style-1">
            <div className="navbar-style-2">

                <div className="navbar-style-3">
                    {/* Back Button (Sirf tab dikhega jab hum Home par nahi honge) */}
                    {location.pathname !== '/' && (
                        <button
                            onClick={() => navigate(-1)}
                            className="navbar-style-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="navbar-style-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    )}

                    {/* Logo and Text */}
                    <Link to="/" className="navbar-style-6">
                        <img 
                            src="/muna-logo.jpg" 
                            alt="MUNA" 
                            className="navbar-style-7"
                        />
                        <div className="navbar-style-8">
                            <span className="navbar-style-9">GROCERY</span>
                            <span className="navbar-style-10">IN MINUTES</span>
                        </div>
                    </Link>
                </div>

                {/* Right Side: Login / Profile & Cart */}
                <div className="navbar-style-11">

                    {/* Search Button */}
                    <Link to="/search" className="navbar-style-16" style={{ marginRight: '8px', padding: '8px', display: 'flex', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </Link>

                    {/* Agar User login hai toh Profile par jane ka Button, warna Login button */}
                    {user ? (
                        <div className="navbar-style-12">
                            <Link 
                                to={user.role === 'super_admin' ? "/admin-dashboard" : user.role === 'vendor' ? "/vendor-dashboard" : "/profile"} 
                                className="navbar-style-13"
                            >
                                <span className="navbar-style-14">{user.role === 'super_admin' ? '👑' : user.role === 'vendor' ? '🏪' : '👤'}</span>
                                <span className="navbar-style-15">Hi, {user.name.split(' ')[0]}</span>
                            </Link>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="navbar-style-16"
                        >
                            Login
                        </Link>
                    )}


                    {/* Cart Button */}
                    <Link to="/cart" className="navbar-style-17">
                        <svg xmlns="http://www.w3.org/2000/svg" className="navbar-style-18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="navbar-style-19">Cart {totalItems > 0 && `(${totalItems})`}</span>
                        {totalItems > 0 && (
                            <span className="navbar-style-20">
                                {totalItems}
                            </span>
                        )}
                    </Link>

                </div>

            </div>
        </nav>
    );
};

export default Navbar;
