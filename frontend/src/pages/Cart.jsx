import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Token nikalne ke liye
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
    // cartShopId bhi liya taaki backend ko pata chale kis dukan ka order hai
    const { cartItems, cartShopId, getTotal, removeFromCart, clearCart } = useCart();
    const { token } = useAuth(); // Logged-in user ka token

    const [gpsLocation, setGpsLocation] = useState(null); // GPS coordinates store karne ke liye
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false); // GPS fetching status
    const navigate = useNavigate();

    const handleGetLocation = () => {
        setLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGpsLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocating(false);
                    // alert("GPS Location mili! Ab aap order place kar sakte hain.");
                },
                (error) => {
                    alert("Location nikalne me problem hui. Kripya apne phone ki Location On karein!");
                    setLocating(false);
                }
            );
        } else {
            alert("Aapka browser location support nahi karta.");
            setLocating(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!gpsLocation) {
            alert("Please tap on 'Get My Location' to verify you are near the shop!");
            return;
        }

        // Agar user login nahi hai, toh pehle usko login par bhejo
        if (!token) {
            alert("Please login first to place your order!");
            navigate('/login');
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
                totalAmount: getTotal(),
                deliveryLocation: {
                    address: "Shared via GPS",
                    lat: gpsLocation.lat,
                    lng: gpsLocation.lng
                }
            };

            const res = await fetch('http://localhost:5000/api/orders', {
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
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                <div className="flex justify-between font-bold text-lg text-gray-800">
                    <span>To Pay:</span>
                    <span>₹{getTotal()}</span>
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
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors"
                >
                    {loading ? 'Placing Order...' : 'Place Order'}
                </button>
            </div>
        </div>
    );
};

export default Cart;
