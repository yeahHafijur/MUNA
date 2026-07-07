import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Cart = () => {
    const { cartItems, cartShopId, getTotal, removeFromCart, clearCart, updateQuantity } = useCart();
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
        if (!token || !user) { toast.error("Please login first!"); navigate('/login'); return; }
        const isPhoneMissing = !user.phone;
        if (isPhoneMissing && (!customerPhone || customerPhone.length < 10)) { toast.error("Enter a valid 10-digit phone number!"); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

                    {/* ═══ CART ITEMS ═══ */}
                    <section className="bg-white rounded-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">1</span>
                                Review Cart
                            </h3>
                            <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
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

                    {/* ═══ DELIVERY LOCATION ═══ */}
                    <section className={`bg-white rounded-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden transition-all ${locationReady ? 'ring-2 ring-emerald-200' : 'ring-2 ring-amber-200'}`}>
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${locationReady ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900 animate-pulse'}`}>{locationReady ? '✓' : '2'}</span>
                                Delivery Location
                            </h3>
                            {locationReady && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">✅ Verified</span>}
                        </div>

                        <div className="px-4 pb-4 space-y-3">
                            {/* Alert when no location */}
                            {!locationReady && (
                                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-3 text-[12px] font-bold text-amber-800">
                                    <span className="text-lg">📍</span>
                                    Select your location to place order
                                </div>
                            )}

                            {/* Saved locations */}
                            {user?.savedLocations?.length > 0 && (
                                <div>
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Saved</div>
                                    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
                                        {user.savedLocations.map(loc => (
                                            <button key={loc._id} onClick={() => handleSelectSavedLocation(loc)}
                                                className={`shrink-0 px-3.5 py-2.5 rounded-xl text-[12px] font-bold border transition-all active:scale-95 ${selectedSavedLoc === loc._id ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                📍 {loc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* GPS Button */}
                            <button onClick={handleGetLocation} disabled={locating}
                                className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] ${locationReady && !selectedSavedLoc ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'}`}>
                                <div className="text-left">
                                    <div className={`text-[13px] font-extrabold ${locationReady && !selectedSavedLoc ? 'text-emerald-800' : 'text-blue-800'}`}>
                                        {locating ? 'Detecting location...' : locationReady && !selectedSavedLoc ? 'GPS Location Acquired' : 'Use Current GPS Location'}
                                    </div>
                                    <div className={`text-[11px] font-medium mt-0.5 ${locationReady && !selectedSavedLoc ? 'text-emerald-600' : 'text-blue-500'}`}>
                                        {locationReady ? `${distance} km away • ₹${deliveryFee} delivery` : 'Tap to detect your location automatically'}
                                    </div>
                                </div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${locationReady && !selectedSavedLoc ? 'bg-emerald-500' : 'bg-blue-500'} ${locating ? 'animate-pulse' : ''}`}>
                                    {locationReady && !selectedSavedLoc
                                        ? <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                        : <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                    }
                                </div>
                            </button>

                            {/* Save location prompt */}
                            {showSavePrompt && gpsLocation && !selectedSavedLoc && user && (
                                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                                    <div className="text-[11px] font-bold text-slate-500 mb-2">Save this location?</div>
                                    <div className="flex gap-2">
                                        <input type="text" value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="e.g. Home"
                                            className="flex-1 px-3 py-2 text-[13px] font-bold rounded-xl border border-slate-200 outline-none focus:border-amber-400 bg-white" />
                                        <button onClick={handleSaveLocation} disabled={savingLocation || !locationName.trim()}
                                            className="px-4 py-2 bg-amber-400 text-amber-950 rounded-xl text-[12px] font-black active:scale-95 transition-transform disabled:opacity-50">
                                            {savingLocation ? '...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Phone (only if missing) */}
                            {user && !user.phone && (
                                <div className="pt-2 border-t border-slate-50">
                                    <div className="text-[12px] font-black text-slate-900 mb-1">Phone Number</div>
                                    <div className="text-[10px] font-medium text-slate-400 mb-2">For delivery updates</div>
                                    <div className="flex">
                                        <span className="bg-slate-100 border border-slate-200 border-r-0 px-3 rounded-l-xl flex items-center text-[13px] font-bold text-slate-500">+91</span>
                                        <input type="tel" maxLength="10" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                                            placeholder="10 digits" className="flex-1 border border-slate-200 rounded-r-xl px-3 py-3 text-[14px] font-bold outline-none focus:border-amber-400 tracking-wider" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ═══ INSTRUCTIONS ═══ */}
                    <section className="bg-white rounded-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-4">
                        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2.5">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            Instructions
                        </h3>
                        <textarea className="w-full min-h-[56px] text-[13px] font-medium text-slate-700 placeholder:text-slate-300 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-3 outline-none focus:border-amber-400 resize-none transition-colors"
                            placeholder="e.g. Make it spicy, leave at door..."
                            value={instructions} onChange={e => setInstructions(e.target.value)} />
                    </section>

                    {/* ═══ BILL ═══ */}
                    <section className="px-1">
                        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2.5 px-1">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                            Bill Summary
                        </h3>
                        <div className="bg-[#FAFAF9] border border-dashed border-stone-300 rounded-2xl p-4">
                            <div className="flex justify-between text-[13px] text-stone-600 font-medium">
                                <span>Item Total</span>
                                <span>₹{getTotal()}</span>
                            </div>
                            {deliveryFee !== null && (
                                <div className="flex justify-between text-[13px] text-stone-600 font-medium mt-2">
                                    <span>Delivery <span className="text-[10px] text-stone-400">({distance} km)</span></span>
                                    <span>₹{deliveryFee}</span>
                                </div>
                            )}
                            <div className="border-t border-dashed border-stone-300 my-3" />
                            <div className="flex justify-between text-[16px] font-black text-stone-900">
                                <span>To Pay</span>
                                <span className="text-emerald-600">₹{getTotal() + (deliveryFee || 0)}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* ── STICKY BOTTOM BAR ── */}
            <div className="fixed bottom-[64px] left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-50 px-4 py-3">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    {/* Price */}
                    <div className="shrink-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</div>
                        <div className="text-[20px] font-black text-slate-900 leading-none">₹{getTotal() + (deliveryFee || 0)}</div>
                    </div>

                    {/* Action */}
                    <div className="flex-1 flex gap-2">
                        {!locationReady ? (
                            <>
                                <button onClick={handleGetLocation} disabled={locating}
                                    className="flex-1 py-3.5 bg-blue-500 text-white rounded-2xl text-[13px] font-black flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(59,130,246,0.3)] active:scale-95 transition-transform disabled:opacity-60">
                                    📍 {locating ? 'Locating...' : 'Get Location'}
                                </button>
                                <button disabled className="flex-1 py-3.5 bg-slate-200 text-slate-500 rounded-2xl text-[11px] font-bold cursor-not-allowed">
                                    Select Location First
                                </button>
                            </>
                        ) : (
                            <button onClick={handlePlaceOrder} disabled={loading}
                                className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl text-[15px] font-black flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(16,185,129,0.3)] active:scale-95 transition-transform disabled:opacity-60">
                                {loading ? (
                                    <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Placing...</>
                                ) : (
                                    <>🛒 Place Order</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CLEAR CART DIALOG ── */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowClearConfirm(false)}>
                    <div className="bg-white rounded-[28px] p-7 max-w-xs w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                        <span className="text-4xl block mb-3">🗑️</span>
                        <h3 className="text-[16px] font-black text-slate-900 mb-1">Remove all items?</h3>
                        <p className="text-[13px] text-slate-500 mb-6">This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[14px] font-bold active:scale-95 transition-transform">Cancel</button>
                            <button onClick={() => { clearCart(); setShowClearConfirm(false); toast.success("Cart cleared"); }}
                                className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-[14px] font-bold shadow-[0_4px_12px_rgba(244,63,94,0.3)] active:scale-95 transition-transform">Clear Cart</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
