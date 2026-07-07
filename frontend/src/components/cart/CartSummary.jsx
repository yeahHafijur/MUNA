import React from 'react';

const CartSummary = ({
    getTotal,
    deliveryFee,
    locationReady,
    user,
    customerPhone,
    setCustomerPhone,
    instructions,
    setInstructions,
    loading,
    handlePlaceOrder
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

                {/* ── Phone (if missing) ── */}
                {!user?.phone && (
                    <div className="mb-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Phone Number</label>
                        <input
                            type="tel"
                            maxLength="10"
                            placeholder="10-digit mobile number"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-900 outline-none focus:border-amber-400 focus:bg-white transition-all placeholder:text-slate-300 placeholder:font-semibold"
                        />
                    </div>
                )}

                {/* ── Instructions ── */}
                <div className="mb-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Delivery Instructions (Optional)</label>
                    <textarea
                        rows="2"
                        placeholder="e.g. Leave at the door, Call when near..."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-900 outline-none focus:border-amber-400 focus:bg-white transition-all placeholder:text-slate-300 resize-none [scrollbar-width:none]"
                    />
                </div>

                {/* ── Action Button ── */}
                <button
                    onClick={handlePlaceOrder}
                    disabled={loading || !locationReady}
                    className="w-full bg-emerald-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 text-[15px] font-black active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Placing Order...
                        </>
                    ) : (
                        <>
                            Place Order • ₹{getTotal() + (deliveryFee || 0)}
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 ml-1"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.79l.75-1.3m7.5-12.978l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.79l-.75-1.3M7.5 4.21l-.75-1.3M19.5 17.785l-1.15-.964M5.106 6.215l-1.15-.964m16.14 6.843l-1.41-.513m-14.095-5.13l-1.41-.513" /></svg>
                        </>
                    )}
                </button>
                <p className="text-center text-[10px] font-bold text-slate-400 mt-3 flex items-center justify-center gap-1">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    By placing order, you agree to our terms.
                </p>
            </div>
        </section>
    );
};

export default CartSummary;
