import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

/* ─── Premium Icons ─── */
const IconBack = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{width: '20px', height: '20px'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: '14px', height: '14px'}}>
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
    const { cartItems, cartShopId, getTotal, removeFromCart, clearCart } = useCart();
    const { user, token, login } = useAuth();

    const [customerPhone, setCustomerPhone] = useState('');
    const [gpsLocation, setGpsLocation] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(null);
    const [distance, setDistance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const navigate = useNavigate();

    const handleGetLocation = () => {
        setLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
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
                        } else {
                            alert(data.message || "Could not calculate delivery fee");
                        }
                    } catch (error) {
                        console.error("Error calculating delivery fee:", error);
                    }
                    
                    setLocating(false);
                },
                (error) => {
                    alert("Location fetch failed. Please turn on your device GPS!");
                    setLocating(false);
                }
            );
        } else {
            alert("Your browser does not support location services.");
            setLocating(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!gpsLocation) {
            alert("Please tap on 'Get My Location' to verify you are near the shop!");
            return;
        }

        if (!token || !user) {
            alert("Please login first to place your order!");
            navigate('/login');
            return;
        }

        const isPhoneMissing = !user.phone;
        if (isPhoneMissing && (!customerPhone || customerPhone.length < 10)) {
            alert("Please enter a valid 10-digit phone number!");
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
                customerPhone: isPhoneMissing ? customerPhone : user.phone
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
            navigate('/profile');

        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

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
            {/* ---- HEADER ---- */}
            <header className="crt-header">
                <button className="crt-back-btn" onClick={() => navigate(-1)}>
                    <IconBack />
                </button>
                <span className="crt-header-title">Checkout</span>
            </header>

            {/* ---- BODY ---- */}
            <div className="crt-body">
                
                {/* ITEMS SECTION */}
                <div className="crt-section">
                    <div className="crt-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        Items in Cart
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
                                    <button onClick={() => removeFromCart(item.productId)} className="crt-remove-btn">
                                        <IconTrash /> Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DELIVERY & PHONE SECTION */}
                <div className="crt-section">
                    <div className="crt-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
                        Delivery Details
                    </div>
                    
                    <div className="crt-loc-box">
                        <div className="crt-loc-text">
                            <div className="crt-loc-title">Fetch Location</div>
                            <div className="crt-loc-sub">Required to calculate distance</div>
                        </div>
                        <button 
                            onClick={handleGetLocation} 
                            disabled={locating}
                            className={`crt-loc-btn ${gpsLocation ? 'crt-loc-btn--success' : ''}`}
                        >
                            <IconLocation />
                            {locating ? 'Locating...' : gpsLocation ? 'Saved' : 'Get GPS'}
                        </button>
                    </div>

                    {user && !user.phone && (
                        <div style={{marginTop: '20px'}}>
                            <div style={{fontSize: '13px', fontWeight: '800', color: '#0f172a'}}>Phone Number</div>
                            <div style={{fontSize: '11px', color: '#64748b'}}>For delivery updates</div>
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

                {/* BILL RECEIPT SECTION */}
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

            {/* ---- FIXED BOTTOM BAR ---- */}
            <div className="crt-bottom-bar">
                <div className="crt-bottom-price">
                    <span className="crt-bottom-price-lbl">Total</span>
                    <span className="crt-bottom-price-val">₹{getTotal() + (deliveryFee || 0)}</span>
                </div>
                <button
                    onClick={handlePlaceOrder}
                    disabled={loading || deliveryFee === null}
                    className="crt-action-btn"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Placing...
                        </>
                    ) : (
                        <>
                            Place Order
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{width: '18px', height: '18px'}}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Cart;
