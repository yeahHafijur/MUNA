import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CartItems from '../components/cart/CartItems';
import CartLocation from '../components/cart/CartLocation';
import CartSummary from '../components/cart/CartSummary';

const Cart = () => {
    const { cartItems, cartShopId, getTotal, clearCart } = useCart();
    const { user, token, login } = useAuth();
    const navigate = useNavigate();

    const [customerPhone, setCustomerPhone] = useState('');
    const [instructions, setInstructions] = useState('');
    const [gpsLocation, setGpsLocation] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(null);
    const [distance, setDistance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [savingLocation, setSavingLocation] = useState(false);
    const [locationName, setLocationName] = useState('Home');
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const [selectedSavedLoc, setSelectedSavedLoc] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const locationReady = gpsLocation && deliveryFee !== null;

    // ═══════════════ LOCATION HANDLERS ═══════════════

    const processPosition = async (lat, lng) => {
        setGpsLocation({ lat, lng });
        try {
            const res = await fetch(`/api/shops/${cartShopId}/calculate-delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ lat, lng })
            });
            const data = await res.json();
            if (res.ok) {
                setDeliveryFee(data.deliveryFee);
                setDistance(data.distance);
                setShowSavePrompt(true);
                setSelectedSavedLoc(null);
            } else {
                toast.error(data.message || "Could not calculate delivery fee");
                setGpsLocation(null);
            }
        } catch { toast.error("Network error"); }
        setLocating(false);
    };

    const handleGetLocation = async () => {
        setLocating(true);
        if (!("geolocation" in navigator)) { toast.error("Location not supported"); setLocating(false); return; }
        const getPos = (opts) => new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, opts));
        try {
            const p = await getPos({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
            await processPosition(p.coords.latitude, p.coords.longitude);
        } catch (e) {
            if (e.code === 1) { toast.error("Location permission denied. Allow in settings."); setLocating(false); }
            else {
                try {
                    const f = await getPos({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
                    await processPosition(f.coords.latitude, f.coords.longitude);
                } catch (fe) {
                    const msgs = { 1: "Permission denied.", 2: "GPS unavailable. Turn on GPS.", 3: "Timed out. Try again." };
                    toast.error(msgs[fe.code] || "Location failed.");
                    setLocating(false);
                }
            }
        }
    };

    const handleSelectSavedLocation = async (loc) => {
        setLocating(true);
        setSelectedSavedLoc(loc._id);
        setShowSavePrompt(false);
        setGpsLocation({ lat: loc.lat, lng: loc.lng });
        try {
            const res = await fetch(`/api/shops/${cartShopId}/calculate-delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ lat: loc.lat, lng: loc.lng })
            });
            const data = await res.json();
            if (res.ok) { setDeliveryFee(data.deliveryFee); setDistance(data.distance); }
            else { toast.error(data.message || "Failed"); setGpsLocation(null); setSelectedSavedLoc(null); }
        } catch { toast.error("Network error"); }
        setLocating(false);
    };

    const handleSaveLocation = async () => {
        if (!gpsLocation || !locationName) return;
        setSavingLocation(true);
        try {
            const res = await fetch('/api/auth/save-location', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: locationName, lat: gpsLocation.lat, lng: gpsLocation.lng, address: "Saved via Map" })
            });
            const data = await res.json();
            if (res.ok) { login({ ...user, savedLocations: data.savedLocations }, token); setShowSavePrompt(false); toast.success("Location saved!"); }
            else toast.error(data.message || "Failed");
        } catch { toast.error("Error saving"); }
        setSavingLocation(false);
    };

    // ═══════════════ ORDER HANDLER ═══════════════

    const handlePlaceOrder = async () => {
        if (!locationReady) { toast.error("📍 Select your delivery location first!"); return; }
        if (!user) { toast.error("Please login first!"); navigate('/login'); return; }
        const isPhoneMissing = !user.phone;
        if (isPhoneMissing && (!customerPhone || customerPhone.length < 10)) { toast.error("Enter a valid 10-digit phone number!"); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/orders', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    shopId: cartShopId,
                    items: cartItems.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
                    totalAmount: getTotal() + (deliveryFee || 0),
                    deliveryLocation: { address: "Shared via GPS", lat: gpsLocation.lat, lng: gpsLocation.lng },
                    customerPhone: isPhoneMissing ? customerPhone : user.phone,
                    instructions: instructions.trim()
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            if (isPhoneMissing) login({ ...user, phone: customerPhone }, token);
            clearCart();
            toast.success("🎉 Order placed! Track it in My Orders.");
            navigate('/profile/orders');
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    // ═══════════════ EMPTY CART ═══════════════

    if (cartItems.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
                <header className="shrink-0 bg-white px-4 py-3.5 flex items-center gap-3 border-b border-slate-100 shadow-sm">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-[17px] font-extrabold text-slate-900 tracking-tight">Checkout</span>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <span className="text-6xl mb-5 drop-shadow-sm">🛒</span>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Your cart is empty</h2>
                    <p className="text-sm text-slate-500 mb-8 max-w-[260px]">Good food is always cooking! Browse shops and add items.</p>
                    <button onClick={() => navigate('/')} className="px-8 py-3.5 bg-amber-400 text-amber-950 rounded-2xl text-sm font-black shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform">Browse Shops</button>
                </div>
            </div>
        );
    }

    // ═══════════════ MAIN RENDER ═══════════════

    return (
        <div className="fixed inset-0 z-[100] bg-[#F5F5F7] flex flex-col font-sans">

            {/* ── HEADER ── */}
            <header className="shrink-0 bg-white px-4 py-3.5 flex items-center gap-3 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-[17px] font-extrabold text-slate-900 tracking-tight">Checkout</span>
            </header>

            {/* ── PROGRESS ── */}
            <div className="shrink-0 bg-white border-b border-slate-100 flex items-center justify-center gap-0 py-3">
                {[
                    { n: 1, label: 'Cart', done: true },
                    { n: 2, label: 'Location', done: locationReady },
                    { n: 3, label: 'Order', done: false },
                ].map((s, i) => (
                    <div key={s.n} className="flex items-center">
                        {i > 0 && <div className={`w-8 h-[2px] mx-1.5 rounded-full ${s.done || (i === 1 && locationReady) ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                        <div className="flex items-center gap-1.5">
                            <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${s.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{s.done ? '✓' : s.n}</div>
                            <span className={`text-[11px] font-bold ${s.done ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto pb-44 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="p-4 space-y-3 max-w-lg mx-auto">
                    
                    <CartItems onClearConfirm={() => setShowClearConfirm(true)} />

                    <CartSummary 
                        getTotal={getTotal}
                        deliveryFee={deliveryFee}
                        locationReady={locationReady}
                    />

                    <CartLocation 
                        locationReady={locationReady}
                        user={user}
                        selectedSavedLoc={selectedSavedLoc}
                        handleSelectSavedLocation={handleSelectSavedLocation}
                        handleGetLocation={handleGetLocation}
                        locating={locating}
                        distance={distance}
                        deliveryFee={deliveryFee}
                        showSavePrompt={showSavePrompt}
                        locationName={locationName}
                        setLocationName={setLocationName}
                        savingLocation={savingLocation}
                        handleSaveLocation={handleSaveLocation}
                    />

                    {/* ── CHECKOUT FORM ── */}
                    <div className={`transition-opacity ${locationReady ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
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
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-900 outline-none focus:border-amber-400 transition-all placeholder:text-slate-300 placeholder:font-semibold shadow-sm"
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
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-900 outline-none focus:border-amber-400 transition-all placeholder:text-slate-300 resize-none [scrollbar-width:none] shadow-sm"
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

                </div>
            </div>

            {/* ═══ CLEAR CONFIRM MODAL ═══ */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl animate-slide-up">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🗑️</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Clear Cart?</h3>
                            <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-6">Are you sure you want to remove all items from your cart?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3.5 rounded-xl bg-slate-100 text-[14px] font-bold text-slate-700 active:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={() => { clearCart(); setShowClearConfirm(false); }} className="flex-1 py-3.5 rounded-xl bg-rose-500 text-[14px] font-bold text-white active:bg-rose-600 transition-colors shadow-[0_4px_12px_rgba(244,63,94,0.3)]">Clear Cart</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;