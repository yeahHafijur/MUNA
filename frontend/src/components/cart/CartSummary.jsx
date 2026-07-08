import React from 'react';

const CartSummary = ({
    getTotal,
    deliveryFee,
    locationReady
}) => {
    return (
        <section className="bg-white rounded-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-4 pt-4 pb-2">
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${locationReady ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>3</span>
                    <span className={locationReady ? 'text-slate-900' : 'text-slate-400'}>Order Summary</span>
                </h3>
            </div>
            
            <div className={`px-4 pb-4 transition-opacity ${locationReady ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                {/* ── Bill Details ── */}
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-2.5 border border-slate-100 mb-4">
                    <div className="flex justify-between text-[13px] font-bold text-slate-600">
                        <span>Items Total</span>
                        <span className="text-slate-900">₹{getTotal()}</span>
                    </div>
                    {deliveryFee !== null && (
                        <div className="flex justify-between text-[13px] font-bold text-slate-600">
                            <span>Delivery Fee</span>
                            <span className="text-slate-900">₹{deliveryFee}</span>
                        </div>
                    )}
                    <div className="pt-2.5 mt-1 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-[14px] font-black text-slate-900 uppercase tracking-widest">To Pay</span>
                        <span className="text-xl font-black text-emerald-600 drop-shadow-sm">₹{getTotal() + (deliveryFee || 0)}</span>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default CartSummary;
