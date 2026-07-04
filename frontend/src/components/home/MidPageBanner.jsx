import { memo } from 'react';

const MidPageBanner = () => {
    return (
        <div className="px-4 py-2 mt-4 mb-2 md:mx-4">
            <div className="w-full h-[180px] rounded-[24px] bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 p-6 flex flex-col justify-center relative overflow-hidden shadow-[0_8px_30px_rgba(16,185,129,0.25)] cursor-pointer group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
                
                <div className="relative z-10 w-[70%]">
                    <span className="inline-block px-3 py-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-3 backdrop-blur-md shadow-sm border border-white/20">Weekend Special</span>
                    <h2 className="text-[26px] md:text-[30px] font-black text-white leading-[1.1] mb-2 drop-shadow-sm">Stock Up on Essentials!</h2>
                    <p className="text-[12px] font-bold text-emerald-50 opacity-90">Free delivery on orders above ₹499</p>
                </div>
                
                {/* 3D Emoji Decoration */}
                <div className="absolute -right-4 bottom-[-10px] text-[120px] drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)] rotate-[-15deg] group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    🛍️
                </div>
            </div>
        </div>
    );
};

export default memo(MidPageBanner);
