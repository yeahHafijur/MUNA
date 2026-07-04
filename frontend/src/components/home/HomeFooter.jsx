import { memo } from 'react';

const HomeFooter = ({ navigate }) => {
    return (
        <div className="bg-slate-900 rounded-t-[32px] px-6 pt-8 pb-28 mt-2">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-md">
                    <img src="/muna-logo-new.png" alt="MUNA" className="w-7 h-7 object-contain" />
                </div>
                <div>
                    <h4 className="text-[16px] font-black text-white tracking-tight">MUNA</h4>
                    <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Delivery in Minutes</p>
                </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
                <button onClick={() => navigate('/profile')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">My Account</button>
                <button onClick={() => navigate('/profile/orders')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">My Orders</button>
                <button onClick={() => navigate('/daily-market')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Daily Market</button>
                <button onClick={() => navigate('/profile/wishlist')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Wishlist</button>
                <button onClick={() => navigate('/privacy-policy')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Privacy Policy</button>
                <button onClick={() => navigate('/profile/settings')} className="text-left text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Settings</button>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-800 mb-5" />

            {/* Bottom */}
            <div className="text-center">
                <p className="text-[11px] font-bold text-slate-600 mb-1">Made with ❤️ in Assam</p>
                <p className="text-[10px] font-semibold text-slate-700">© {new Date().getFullYear()} MUNA. All rights reserved.</p>
            </div>
        </div>
    );
};

export default memo(HomeFooter);
