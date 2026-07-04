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

            {/* App Download */}
            <div className="mb-8 bg-slate-800/50 rounded-2xl p-4 border border-slate-800">
                <h4 className="text-[13px] font-black text-white mb-1">Get the MUNA App</h4>
                <p className="text-[10px] font-medium text-slate-400 mb-3">For a faster, smoother experience</p>
                <a 
                    href="https://play.google.com/store/apps/details?id=app.vercel.muna_opal.twa" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl active:scale-95 transition-transform"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500">
                        <path d="M17.523 15.3414L3.81664 23.366C3.39863 23.611 2.87109 23.2759 2.87109 22.7745V1.2268C2.87109 0.724128 3.39958 0.38996 3.81664 0.634127L17.523 8.65863C17.9255 8.89433 17.9255 9.47952 17.523 9.71523L13.1611 12.27L17.523 15.3414Z"/>
                        <path d="M18.4239 9.18663L22.6105 11.6433C23.1298 11.9482 23.1298 12.6983 22.6105 13.0033L18.4239 15.4599L14.2812 12.3233L18.4239 9.18663Z"/>
                    </svg>
                    <div className="text-left">
                        <div className="text-[8px] font-black uppercase tracking-wider text-slate-500 leading-none mb-0.5">Get it on</div>
                        <div className="text-[13px] font-black leading-none">Google Play</div>
                    </div>
                </a>
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
