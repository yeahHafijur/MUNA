import { memo } from 'react';

const PromoBanners = ({ banners }) => {
    return (
        <div className="px-4 pt-5 pb-1">
            <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                
                {banners && banners.length > 0 ? (
                    banners.map((b, idx) => (
                        <div 
                            key={b._id} 
                            onClick={() => { if(b.link) window.location.href = b.link; }}
                            className="snap-center shrink-0 w-[88vw] sm:w-[380px] h-[170px] rounded-[22px] overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-transform cursor-pointer relative"
                        >
                            <img src={b.image} alt="Promo Banner" className="w-full h-full object-cover" />
                        </div>
                    ))
                ) : (
                    <>
                        {/* Banner 1: Blinkit Style Grocery Offer */}
                        <div className="snap-center shrink-0 w-[88vw] sm:w-[380px] h-[170px] rounded-[22px] bg-[#0052FF] p-5 flex flex-col justify-center relative overflow-hidden shadow-[0_6px_24px_rgba(0,82,255,0.2)] active:scale-[0.98] transition-transform cursor-pointer">
                            <div className="absolute top-[-50%] left-[-20%] w-[180px] h-[180px] bg-white rounded-full blur-[60px] opacity-10 pointer-events-none"></div>
                            <div className="relative z-10 w-[70%]">
                                <span className="inline-block px-2.5 py-1 bg-black/20 text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-2 backdrop-blur-sm">Weekend Special</span>
                                <h2 className="text-[24px] font-black text-white leading-tight mb-1">MEGA OFFERS</h2>
                                <p className="text-[12px] font-semibold text-blue-100">Up to 50% OFF on Essentials</p>
                            </div>
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[100px] drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] rotate-[-10deg] pointer-events-none">
                                🛒
                            </div>
                        </div>

                        {/* Banner 2: Fresh Vibrant */}
                        <div className="snap-center shrink-0 w-[88vw] sm:w-[380px] h-[170px] rounded-[22px] bg-[#FFF5EB] p-5 flex flex-col justify-center relative overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform cursor-pointer border border-[#F2E4D3]">
                            <div className="relative z-10 w-[65%]">
                                <span className="inline-block px-2.5 py-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-2">Fresh Arrival</span>
                                <h2 className="text-[24px] font-black text-[#3A2C1C] leading-tight mb-1">FARM FRESH</h2>
                                <p className="text-[12px] font-bold text-[#8C7A65]">Straight from local farms</p>
                            </div>
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[100px] drop-shadow-[0_15px_15px_rgba(0,0,0,0.1)] rotate-[10deg] pointer-events-none">
                                🍎
                            </div>
                        </div>

                        {/* Banner 3: Blinkit Yellow */}
                        <div className="snap-center shrink-0 w-[88vw] sm:w-[380px] h-[170px] rounded-[22px] bg-[#FFDE00] p-5 flex flex-col justify-center relative overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform cursor-pointer border border-[#E6C800]">
                            <div className="relative z-10 w-[70%]">
                                <span className="inline-block px-2.5 py-1 bg-black/10 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-md mb-2">Quick Delivery</span>
                                <h2 className="text-[24px] font-black text-slate-900 leading-tight mb-1">MIDNIGHT CRAVINGS?</h2>
                                <p className="text-[12px] font-bold text-amber-950/70">We deliver till 2 AM</p>
                            </div>
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-[100px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)] rotate-[-5deg] pointer-events-none">
                                🍕
                            </div>
                        </div>
                    </>
                )}

            </div>
            
            {/* Scroll Indicators */}
            {((banners && banners.length > 1) || (!banners || banners.length === 0)) && (
                <div className="flex items-center justify-center gap-1.5 mt-3.5">
                    {(banners && banners.length > 0 ? banners : [1,2,3]).map((_, i) => (
                        <div key={i} className={`rounded-full transition-all ${i === 0 ? 'w-5 h-1.5 bg-slate-800' : 'w-1.5 h-1.5 bg-slate-300'}`} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(PromoBanners);
