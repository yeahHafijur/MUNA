import { memo } from 'react';

const DailyMarketBanner = ({ navigate }) => {
    return (
        <div className="px-4 py-2 mb-2 md:mx-4">
            <div
                onClick={() => navigate('/daily-market')}
                className="w-full max-w-2xl mx-auto bg-amber-400 rounded-[14px] p-4 flex items-center justify-between shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:shadow-[0_8px_20px_rgba(251,191,36,0.4)] active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
            >
                <div className="absolute right-[-10px] top-[-10px] text-[60px] opacity-[0.2] rotate-12 pointer-events-none drop-shadow-sm">
                    🛒
                </div>
                <div className="relative z-10">
                    <h3 className="text-[16px] font-black text-amber-950 tracking-tight mb-0.5 drop-shadow-sm">Daily Market</h3>
                    <p className="text-[12px] font-bold text-amber-900/80">Buy & Sell used items locally</p>
                </div>
                <div className="relative z-10 bg-white/40 text-amber-950 rounded-full p-2 hover:bg-white/50 transition-colors shadow-sm">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5-7.5" /></svg>
                </div>
            </div>
        </div>
    );
};

export default memo(DailyMarketBanner);
