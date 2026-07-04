import { memo } from 'react';

const HowItWorks = () => {
    return (
        <div className="px-4 py-8 mb-4">
            <div className="text-center mb-6">
                <h3 className="text-[18px] font-black text-slate-900 tracking-tight">How MUNA Works</h3>
                <p className="text-[12px] font-bold text-slate-500 mt-1">From our store to your door in minutes</p>
            </div>
            
            <div className="flex items-center justify-between max-w-sm mx-auto relative px-2">
                {/* Connecting Line */}
                <div className="absolute top-8 left-10 right-10 h-0.5 bg-slate-100 -z-10">
                    <div className="h-full bg-amber-400 w-full opacity-50" />
                </div>
                
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-slate-50 flex items-center justify-center text-[28px] relative z-10">
                        📱
                    </div>
                    <div className="text-center mt-1">
                        <h4 className="text-[12px] font-black text-slate-800 leading-tight">You Order</h4>
                        <p className="text-[10px] font-bold text-slate-400">Via MUNA app</p>
                    </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-slate-50 flex items-center justify-center text-[28px] relative z-10">
                        📦
                    </div>
                    <div className="text-center mt-1">
                        <h4 className="text-[12px] font-black text-slate-800 leading-tight">We Pack</h4>
                        <p className="text-[10px] font-bold text-slate-400">Fresh & careful</p>
                    </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-slate-50 flex items-center justify-center text-[28px] relative z-10">
                        🛵
                    </div>
                    <div className="text-center mt-1">
                        <h4 className="text-[12px] font-black text-slate-800 leading-tight">Delivery</h4>
                        <p className="text-[10px] font-bold text-slate-400">At your doorstep</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(HowItWorks);
