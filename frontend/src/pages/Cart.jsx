import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Token nikalne ke liye
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
    // cartShopId bhi liya taaki backend ko pata chale kis dukan ka order hai
    const { cartItems, cartShopId, getTotal, removeFromCart, clearCart } = useCart();
    const { user, token, login } = useAuth(); // Logged-in user, token, aur context update function

    const [customerPhone, setCustomerPhone] = useState('');
    const [gpsLocation, setGpsLocation] = useState(null); // GPS coordinates store karne ke liye
    const [deliveryFee, setDeliveryFee] = useState(null);
    const [distance, setDistance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false); // GPS fetching status
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
                    alert("Location nikalne me problem hui. Kripya apne phone ki Location On karein!");
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

        // Agar user login nahi hai, toh pehle usko login par bhejo
        if (!token || !user) {
            alert("Please login first to place your order!");
            navigate('/login');
            return;
        }

        const isPhoneMissing = !user.phone;
        if (isPhoneMissing && (!customerPhone || customerPhone.length < 10)) {
            alert("Please enter a valid 10-digit phone number so the delivery partner can contact you!");
            return;
        }

        setLoading(true);

        try {
            // Backend ko exactly yehi Format chahiye
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
                    'Authorization': `Bearer ${token}` // VIP Pass
                },
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to place order');
            }

            // Order Success! 
            if (isPhoneMissing) {
                // Local context update kar do taaki dobara na maangna pade
                login({ ...user, phone: customerPhone }, token);
            }
            
            clearCart(); // Cart khali karo
            navigate('/profile'); // Sidha profile par bhejo taaki status dekh sake

        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-style-1">
                <span className="cart-style-2">🛒</span>
                <h2 className="cart-style-3">Your cart is empty</h2>
                <p className="cart-style-4">Let's add some fresh items!</p>
                <Link to="/" className="cart-style-5">
                    Browse Shops
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-style-6">
            <h1 className="cart-style-7">Checkout</h1>

            {/* Items List */}
            <div className="cart-style-8">
                {cartItems.map((item, index) => (
                    <div key={index} className="cart-style-9">
                        <div>
                            <h3 className="cart-style-10">{item.name}</h3>
                            <p className="cart-style-11">₹{item.price} x {item.quantity}</p>
                        </div>
                        <div className="cart-style-12">
                            <span className="cart-style-13">₹{item.price * item.quantity}</span>
                            <button
                                onClick={() => removeFromCart(item.productId)}
                                className="cart-style-14"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bill Summary */}
            <div className="cart-style-15">
                <div className="cart-style-16">
                    <span>Item Total:</span>
                    <span>₹{getTotal()}</span>
                </div>
                {deliveryFee !== null && (
                    <div className="cart-style-17">
                        <span>Delivery Fee ({distance} km):</span>
                        <span>₹{deliveryFee}</span>
                    </div>
                )}
                <div className="cart-style-18">
                    <span>Grand Total:</span>
                    <span className="cart-style-19">₹{getTotal() + (deliveryFee || 0)}</span>
                </div>
            </div>

            {/* Address */}
            <div className="cart-style-20">
                <label className="cart-style-21">Delivery Location</label>
                
                {/* GPS Location Button */}
                <div className="cart-style-22">
                    <div>
                        <p className="cart-style-23">Verify Distance</p>
                        <p className="cart-style-24">We need your location to confirm delivery range.</p>
                    </div>
                    <button 
                        onClick={handleGetLocation} 
                        disabled={locating}
                        className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${gpsLocation ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        {locating ? 'Locating...' : gpsLocation ? '📍 Location Saved' : '📍 Get My Location'}
                    </button>
                </div>
            </div>

            {/* Missing Phone Number Input */}
            {user && !user.phone && (
                <div className="cart-style-25">
                    <label className="cart-style-26">Delivery Phone Number 📱</label>
                    <p className="cart-style-27">Please provide a phone number so the delivery partner can contact you.</p>
                    <div className="cart-style-28">
                        <span className="cart-style-29">
                            +91
                        </span>
                        <input
                            type="tel"
                            required
                            maxLength="10"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                            className="cart-style-30"
                            placeholder="98765 43210"
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="cart-style-31">
                <button
                    onClick={clearCart}
                    className="cart-style-32"
                >
                    Clear Cart
                </button>
                <button
                    onClick={handlePlaceOrder}
                    disabled={loading || deliveryFee === null}
                    className={`flex-1 font-bold py-3 rounded-lg shadow-md transition-colors ${loading || deliveryFee === null ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    {loading ? 'Placing Order...' : 'Place Order'}
                </button>
            </div>
        </div>
    );
};

export default Cart;
