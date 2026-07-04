import { memo } from 'react';

const HomeHeader = ({ userLocation }) => {
    return (
        <div className="shrink-0 bg-amber-400 pt-10 px-4 pb-4 z-50 shadow-md relative overflow-hidden rounded-b-[20px]">
            {/* Decorative Delivery Element */}
            <div className="absolute right-[-10px] top-2 text-[90px] opacity-[0.15] rotate-12 pointer-events-none drop-shadow-sm">
                🛵
            </div>
            
            <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto">
                {/* Left: Logo & Location */}
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-4 cursor-pointer active:opacity-70 transition-opacity">
                    {/* MUNA Logo */}
                    <div className="w-11 h-11 bg-white rounded-[12px] shadow-sm flex items-center justify-center p-1 shrink-0">
                        <img src="/muna-logo-new.png" alt="MUNA" className="w-full h-full object-contain" />
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[11px] font-black tracking-widest text-amber-950 uppercase flex items-center gap-1.5 mb-0.5">
                            Delivery in 15 mins <span className="text-[14px]">🛵⚡</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-[16px] font-black text-slate-900 truncate">
                                {userLocation ? 'Location updated' : 'Bhalukmari, Assam'}
                            </span>
                            <svg className="w-4 h-4 text-slate-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(HomeHeader);
