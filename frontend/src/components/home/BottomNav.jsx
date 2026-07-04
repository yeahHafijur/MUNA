import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = ({ setShowAllCategories }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="fixed inset-x-0 bottom-0 z-[110] bg-white border-t border-slate-100 flex justify-around items-center pt-3 pb-safe pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <button 
                onClick={() => navigate('/')}
                className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'} transition-colors`}
            >
                <span className="text-xl leading-none">🏠</span>
                <span className="text-[10px] font-bold">Home</span>
            </button>
            <button 
                onClick={() => setShowAllCategories(true)}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors"
            >
                <span className="text-xl leading-none">🛍️</span>
                <span className="text-[10px] font-bold">Categories</span>
            </button>
            <button 
                onClick={() => navigate('/cart')}
                className={`flex flex-col items-center gap-1 ${location.pathname === '/cart' ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'} relative transition-colors`}
            >
                <span className="text-xl leading-none">🛒</span>
                {/* Mock Cart Badge - To be wired to global cart state */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white box-content">2</span>
                <span className="text-[10px] font-bold">Cart</span>
            </button>
            <button 
                onClick={() => navigate('/profile')}
                className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/profile') ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'} transition-colors`}
            >
                <span className="text-xl leading-none">👤</span>
                <span className="text-[10px] font-bold">Profile</span>
            </button>
        </div>
    );
};

export default memo(BottomNav);
