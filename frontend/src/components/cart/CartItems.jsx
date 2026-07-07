import { useCart } from '../../context/CartContext';

const CartItems = ({ onClearConfirm }) => {
    const { cartItems, removeFromCart, updateQuantity } = useCart();

    return (
        <section className="bg-white rounded-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">1</span>
                    Review Cart
                </h3>
                <button onClick={onClearConfirm} className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Clear
                </button>
            </div>
            <div className="px-4 pb-4">
                {cartItems.map((item, idx) => (
                    <div key={idx} className={`flex items-start justify-between py-3.5 ${idx < cartItems.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <div className="flex-1 pr-3">
                            <div className="text-[14px] font-bold text-slate-900 leading-snug">{item.name}</div>
                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">₹{item.price} × {item.quantity}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-[15px] font-black text-slate-900">₹{item.price * item.quantity}</span>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-2.5 py-1.5 text-[13px] font-bold text-slate-600 active:bg-slate-100 transition-colors">−</button>
                                    <span className="px-2 py-1.5 text-[12px] font-black text-slate-900 border-x border-slate-100 min-w-[28px] text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-2.5 py-1.5 text-[13px] font-bold text-slate-600 active:bg-slate-100 transition-colors">+</button>
                                </div>
                                <button onClick={() => removeFromCart(item.productId)} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center active:scale-90 transition-transform">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CartItems;
