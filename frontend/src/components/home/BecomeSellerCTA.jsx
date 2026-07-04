import { memo } from 'react';

const BecomeSellerCTA = ({ navigate }) => {
    return (
        <div className="px-4 py-3 mb-4 md:mx-4">
            <div
                onClick={() => navigate('/profile/vendor-request')}
                className="w-full max-w-2xl mx-auto bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 rounded-[20px] p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(251,191,36,0.3)] active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
            >
                <div className="absolute right-[-20px] bottom-[-20px] text-[100px] opacity-[0.15] rotate-[-15deg] pointer-events-none">
                    🏪
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center text-[28px] shadow-inner shrink-0">
                    🚀
                </div>
                <div className="relative z-10 flex-1">
                    <h3 className="text-[16px] font-black text-amber-950 tracking-tight leading-tight mb-0.5">Become a Seller</h3>
                    <p className="text-[12px] font-bold text-amber-900/70">Start selling on MUNA — reach thousands of local customers!</p>
                </div>
                <div className="relative z-10 bg-white/30 backdrop-blur-sm text-amber-950 rounded-full p-2.5 shrink-0">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </div>
            </div>
        </div>
    );
};

export default memo(BecomeSellerCTA);
