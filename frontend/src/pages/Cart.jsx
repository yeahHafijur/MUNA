import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Cart.css';

/* ─── Icons ─── */
const IconBack = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{width: '20px', height: '20px'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);
const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: '15px', height: '15px'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const IconLocation = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{width: '16px', height: '16px'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const Cart = () => {
    const { cartItems, cartShopId, getTotal, removeFromCart, clearCart, updateQuantity } = useCart();
    const { user, token, login } = useAuth();

    const [customerPhone, setCustomerPhone] = useState('');
    const [instructions, setInstructions] = useState('');
    const [gpsLocation, setGpsLocation] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(null);
    const [distance, setDistance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    
    // Saved Locations
    const [savingLocation, setSavingLocation] = useState(false);
    const [locationName, setLocationName] = useState('Home');
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const [selectedSavedLoc, setSelectedSavedLoc] = useState(null);

    // Clear cart confirm
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const navigate = useNavigate();

    const locationReady = gpsLocation && deliveryFee !== null;

    const handleGetLocation = async () => {
        setLocating(true);
        if (!("geolocation" in navigator)) {
            alert("Your browser does not support location services.");
            setLocating(false);
            return;
        }

        const getPosition = (options) => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        };

        const processPosition = async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
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
                    alert(data.message || "Could not calculate delivery fee");
                    setGpsLocation(null);
                }
            } catch (error) {
                console.error("Error calculating delivery fee:", error);
            }
            setLocating(false);
        };

        try {
            const position = await getPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
            await processPosition(position);
        } catch (error) {
            if (error.code === 1) {
                alert("Location permission denied. Please allow location access in your app settings.");
                setLocating(false);
            } else {
                try {
                    const fallbackPos = await getPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
                    await processPosition(fallbackPos);
                } catch (fallbackError) {
                    let msg = "Location fetch failed.";
                    if (fallbackError.code === 1) msg = "Location permission denied. Please allow location access in your app settings.";
                    else if (fallbackError.code === 2) msg = "Location unavailable. Please ensure your device GPS is turned on and try again!";
                    else if (fallbackError.code === 3) msg = "Location request timed out. Please try again or check your signal.";
                    
                    alert(msg);
                    setLocating(false);
                }
            }
        }
    };

    const handleSelectSavedLocation = async (loc) => {
        setLocating(true);
        setGpsLocation({ lat: loc.lat, lng: loc.lng });
        setSelectedSavedLoc(loc._id);
        setShowSavePrompt(false);

        try {
            const res = await fetch(`/api/shops/${cartShopId}/calculate-delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: loc.lat, lng: loc.lng })
            });
            const data = await res.json();
            if (res.ok) {
                setDeliveryFee(data.deliveryFee);
                setDistance(data.distance);
            } else {
                alert(data.message || "Could not calculate delivery fee for this saved location");
                setGpsLocation(null);
                setSelectedSavedLoc(null);
            }
        } catch (error) {
            console.error("Error calculating delivery fee:", error);
        }
        setLocating(false);
    };

    const handleSaveLocation = async () => {
        if (!gpsLocation || !locationName) return;
        setSavingLocation(true);
        try {
            const res = await fetch('/api/auth/save-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: locationName,
                    lat: gpsLocation.lat,
                    lng: gpsLocation.lng,
                    address: "Saved via Map"
                })
            });
            const data = await res.json();
            if (res.ok) {
                login({ ...user, savedLocations: data.savedLocations }, token);
                setShowSavePrompt(false);
                toast.success("Location saved!");
            } else {
                alert(data.message || "Could not save location");
            }
        } catch (error) {
            alert("Error saving location");
        }
        setSavingLocation(false);
    };

    const handlePlaceOrder = async () => {
        if (!gpsLocation) {
            toast.error("📍 Please select your delivery location first!");
            return;
        }

        if (!token || !user) {
            alert("Please login first to place your order!");
            navigate('/login');
            return;
        }

        const isPhoneMissing = !user.phone;
        if (isPhoneMissing && (!customerPhone || customerPhone.length < 10)) {
            toast.error("Please enter a valid 10-digit phone number!");
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                shopId: cartShopId,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                totalAmount: getTotal() + (deliveryFee || 0),
                deliveryLocation: {
                    address: "Shared via GPS",
                    lat: gpsLocation.lat,
                    lng: gpsLocation.lng
                },
                customerPhone: isPhoneMissing ? customerPhone : user.phone,
                instructions: instructions.trim()
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to place order');
            }

            if (isPhoneMissing) {
                login({ ...user, phone: customerPhone }, token);
            }
            
            clearCart();
            toast.success("🎉 Order placed successfully! Track your order in My Orders.");
            navigate('/orders');

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClearCart = () => {
        clearCart();
        setShowClearConfirm(false);
        toast.success("Cart cleared");
    };

    /* ── EMPTY CART STATE ── */
    if (cartItems.length === 0) {
        return (
            <div className="crt-root" style={{background: '#ffffff'}}>
                <header className="crt-header">
                    <button className="crt-back-btn" onClick={() => navigate(-1)}>
                        <IconBack />
                    </button>
                    <span className="crt-header-title">Checkout</span>
                </header>
                <div className="crt-empty">
                    <div className="crt-empty-icon">🛒</div>
                    <div className="crt-empty-title">Your cart is empty</div>
                    <div className="crt-empty-sub">Good food is always cooking! Go ahead, order some yummy items from the menu.</div>
                    <button className="crt-empty-btn" onClick={() => navigate('/')}>
                        Browse Shops
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="crt-root">
            {/* ──── HEADER ──── */}
            <header className="crt-header">
                <button className="crt-back-btn" onClick={() => navigate(-1)}>
                    <IconBack />
                </button>
                <span className="crt-header-title">Checkout</span>
            </header>

            {/* ──── PROGRESS STEPS ──── */}
            <div className="crt-progress">
                <div className={`crt-step ${cartItems.length > 0 ? 'crt-step--done' : ''}`}>
                    <div className="crt-step-num">1</div>
                    <span>Cart</span>
                </div>
                <div className="crt-step-line"></div>
                <div className={`crt-step ${locationReady ? 'crt-step--done' : ''}`}>
                    <div className="crt-step-num">2</div>
                    <span>Location</span>
                </div>
                <div className="crt-step-line"></div>
                <div className={`crt-step ${loading ? 'crt-step--done' : ''}`}>
                    <div className="crt-step-num">3</div>
                    <span>Order</span>
                </div>
            </div>

            {/* ──── BODY ──── */}
            <div className="crt-body">
                
                {/* ═══ STEP 1: CART ITEMS ═══ */}
                <div className="crt-section">
                    <div className="crt-section-header">
                        <div className="crt-section-title">
                            <span className="crt-step-badge">1</span>
                            Review Cart
                        </div>
                        <button className="crt-clear-btn" onClick={() => setShowClearConfirm(true)}>
                            <IconTrash /> Clear All
                        </button>
                    </div>
                    <div>
                        {cartItems.map((item, index) => (
                            <div key={index} className="crt-item">
                                <div className="crt-item-info">
                                    <div className="crt-item-name">{item.name}</div>
                                    <div className="crt-item-meta">₹{item.price} × {item.quantity} qty</div>
                                </div>
                                <div className="crt-item-price-wrap">
                                    <div className="crt-item-total">₹{item.price * item.quantity}</div>
                                    <div className="crt-item-actions">
                                        <div className="crt-qty-control">
                                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="crt-qty-btn">−</button>
                                            <span className="crt-qty-val">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="crt-qty-btn">+</button>
                                        </div>
                                        <button className="crt-remove-btn" onClick={() => removeFromCart(item.productId)}>
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ STEP 2: DELIVERY LOCATION ═══ */}
                <div className={`crt-section ${locationReady ? 'crt-section--success' : 'crt-section--highlight'}`}>
                    <div className="crt-section-header">
                        <div className="crt-section-title">
                            <span className={`crt-step-badge ${locationReady ? 'crt-step-badge--success' : 'crt-step-badge--pending'}`}>2</span>
                            Delivery Location
                        </div>
                        {locationReady && (
                            <span className="crt-status-badge crt-status-badge--success">✅ Verified</span>
                        )}
                    </div>

                    {!locationReady && (
                        <div className="crt-loc-alert">
                            <span className="crt-loc-alert-icon">📍</span>
                            <span>Location is required to place your order</span>
                        </div>
                    )}

                    {/* Saved Locations */}
                    {user?.savedLocations && user.savedLocations.length > 0 && (
                        <div className="crt-saved-locs">
                            <div className="crt-saved-locs-label">Saved Locations</div>
                            <div className="crt-saved-locs-list">
                                {user.savedLocations.map(loc => (
                                    <button 
                                        key={loc._id}
                                        onClick={() => handleSelectSavedLocation(loc)}
                                        className={`crt-saved-loc-chip ${selectedSavedLoc === loc._id ? 'crt-saved-loc-chip--active' : ''}`}
                                    >
                                        📍 {loc.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GPS Button */}
                    <div className="crt-loc-box">
                        <div className="crt-loc-text">
                            <div className="crt-loc-title">{locationReady ? 'Location Acquired' : 'Use Current GPS'}</div>
                            <div className="crt-loc-sub">{locationReady ? `${distance} km from shop • ₹${deliveryFee} delivery` : 'Tap to detect your location'}</div>
                        </div>
                        <button 
                            onClick={handleGetLocation} 
                            disabled={locating}
                            className={`crt-loc-btn ${locationReady && !selectedSavedLoc ? 'crt-loc-btn--success' : ''}`}
                        >
                            <IconLocation />
                            {locating ? 'Locating...' : locationReady && !selectedSavedLoc ? '✅ Done' : '📍 Get GPS'}
                        </button>
                    </div>

                    {/* Save Location Prompt */}
                    {showSavePrompt && gpsLocation && !selectedSavedLoc && user && (
                        <div className="crt-save-prompt">
                            <div className="crt-save-prompt-label">Save this location for next time?</div>
                            <div className="crt-save-prompt-row">
                                <input 
                                    type="text" 
                                    value={locationName} 
                                    onChange={(e) => setLocationName(e.target.value)}
                                    placeholder="e.g. Home, Office"
                                    className="crt-save-input"
                                />
                                <button 
                                    onClick={handleSaveLocation}
                                    disabled={savingLocation || !locationName.trim()}
                                    className="crt-save-btn"
                                >
                                    {savingLocation ? '...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Phone Number */}
                    {user && !user.phone && (
                        <div style={{marginTop: '16px'}}>
                            <div style={{fontSize: '13px', fontWeight: '800', color: '#0f172a'}}>Phone Number</div>
                            <div style={{fontSize: '11px', color: '#64748b', marginBottom: '8px'}}>For delivery updates</div>
                            <div className="crt-phone-input">
                                <span className="crt-phone-prefix">+91</span>
                                <input
                                    type="tel"
                                    required
                                    maxLength="10"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                                    className="crt-phone-field"
                                    placeholder="Enter 10 digits"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ INSTRUCTIONS ═══ */}
                <div className="crt-section">
                    <div className="crt-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Add Instructions
                    </div>
                    <textarea 
                        className="crt-textarea" 
                        placeholder="e.g. Make it spicy, leave at door..." 
                        value={instructions} 
                        onChange={e => setInstructions(e.target.value)}
                    ></textarea>
                </div>

                {/* ═══ BILL SUMMARY ═══ */}
                <div className="crt-section" style={{background: 'transparent', boxShadow: 'none', border: 'none', padding: '0'}}>
                    <div className="crt-section-title" style={{marginBottom: '8px', paddingLeft: '4px'}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Bill Summary
                    </div>
                    <div className="crt-bill">
                        <div className="crt-bill-row">
                            <span>Item Total</span>
                            <span>₹{getTotal()}</span>
                        </div>
                        
                        {deliveryFee !== null && (
                            <div className="crt-bill-row" style={{marginTop: '8px'}}>
                                <span>Delivery Fee <span style={{fontSize:'10px', color:'#9ca3af', marginLeft:'4px'}}>({distance} km)</span></span>
                                <span>₹{deliveryFee}</span>
                            </div>
                        )}
                        
                        <div className="crt-bill-divider"></div>
                        
                        <div className="crt-bill-total">
                            <span>To Pay</span>
                            <span className="amt">₹{getTotal() + (deliveryFee || 0)}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* ──── STICKY BOTTOM BAR ──── */}
            <div className="crt-bottom-bar">
                <div className="crt-bottom-left">
                    <div className="crt-bottom-price-val">₹{getTotal() + (deliveryFee || 0)}</div>
                    <div className={`crt-bottom-loc-status ${locationReady ? 'crt-bottom-loc-status--ok' : ''}`}>
                        {locationReady ? '✅ Location Verified' : '📍 Location Required'}
                    </div>
                </div>
                <div className="crt-bottom-btns">
                    {!locationReady && (
                        <button onClick={handleGetLocation} disabled={locating} className="crt-bottom-loc-btn">
                            📍 {locating ? 'Locating...' : 'Get Location'}
                        </button>
                    )}
                    {locationReady && (
                        <button onClick={handleGetLocation} className="crt-bottom-change-btn">
                            Change
                        </button>
                    )}
                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading || !locationReady}
                        className={`crt-action-btn ${!locationReady ? 'crt-action-btn--disabled' : ''}`}
                    >
                        {loading ? (
                            <>
                                <svg className="crt-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Placing...
                            </>
                        ) : !locationReady ? (
                            'Select Location First'
                        ) : (
                            <>
                                Place Order
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{width: '16px', height: '16px'}}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ──── CLEAR CART CONFIRM DIALOG ──── */}
            {showClearConfirm && (
                <div className="crt-overlay" onClick={() => setShowClearConfirm(false)}>
                    <div className="crt-dialog" onClick={e => e.stopPropagation()}>
                        <div className="crt-dialog-icon">🗑️</div>
                        <div className="crt-dialog-title">Remove all items from your cart?</div>
                        <div className="crt-dialog-sub">This action cannot be undone.</div>
                        <div className="crt-dialog-btns">
                            <button className="crt-dialog-cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                            <button className="crt-dialog-confirm" onClick={handleClearCart}>Clear Cart</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
