import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Token nikalne ke liye
import { Link, useNavigate } from 'react-router-dom';

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
            <div className="flex flex-col items-center justify-center h-64 mt-10">
                <span className="text-6xl mb-4">🛒</span>
                <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
                <p className="text-gray-500 mt-2 mb-6">Let's add some fresh items!</p>
                <Link to="/" className="bg-[#f8cb46] text-white font-bold px-6 py-2 rounded-lg shadow-sm hover:bg-yellow-400 transition-colors">
                    Browse Shops
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-black text-gray-800 mb-6">Checkout</h1>

            {/* Items List */}
            <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div>
                            <h3 className="font-bold text-gray-800">{item.name}</h3>
                            <p className="text-sm text-gray-500">₹{item.price} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                            <button
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 space-y-2">
                <div className="flex justify-between text-gray-600 font-semibold">
                    <span>Item Total:</span>
                    <span>₹{getTotal()}</span>
                </div>
                {deliveryFee !== null && (
                    <div className="flex justify-between text-gray-600 font-semibold">
                        <span>Delivery Fee ({distance} km):</span>
                        <span>₹{deliveryFee}</span>
                    </div>
                )}
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-black text-lg text-gray-800">
                    <span>Grand Total:</span>
                    <span className="text-green-600">₹{getTotal() + (deliveryFee || 0)}</span>
                </div>
            </div>

            {/* Address */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Delivery Location</label>
                
                {/* GPS Location Button */}
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div>
                        <p className="text-sm font-bold text-blue-800">Verify Distance</p>
                        <p className="text-xs text-blue-600">We need your location to confirm delivery range.</p>
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
                <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-bold text-yellow-900 mb-2">Delivery Phone Number 📱</label>
                    <p className="text-xs text-yellow-700 mb-3">Please provide a phone number so the delivery partner can contact you.</p>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg font-bold">
                            +91
                        </span>
                        <input
                            type="tel"
                            required
                            maxLength="10"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                            className="w-full border border-gray-200 rounded-r-lg p-3 outline-none focus:border-yellow-400 transition-colors font-semibold tracking-widest"
                            placeholder="98765 43210"
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={clearCart}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
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
