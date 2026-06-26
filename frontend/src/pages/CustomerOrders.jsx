import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ─── Heroicons SVG ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

const StatusPill = ({ status }) => {
    const labels = {
        pending: { text: '⏳ Pending', style: 'bg-orange-50 text-orange-600 border-orange-100' },
        accepted: { text: '👍 Accepted', style: 'bg-blue-50 text-blue-600 border-blue-100' },
        preparing: { text: '🔥 Preparing', style: 'bg-purple-50 text-purple-600 border-purple-100' },
        out_for_delivery: { text: '🛵 On the Way', style: 'bg-amber-50 text-amber-600 border-amber-100' },
        delivered: { text: '✅ Delivered', style: 'bg-green-50 text-green-600 border-green-100' },
        cancelled: { text: '❌ Cancelled', style: 'bg-red-50 text-red-600 border-red-100' },
    };
    const current = labels[status] || { text: status, style: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${current.style}`}>{current.text}</span>;
};

const OrderSkeleton = () => (
    <div className="space-y-4 px-4 pt-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />
                <div className="h-8 bg-gray-50 rounded-lg w-full" />
            </div>
        ))}
    </div>
);

const CustomerOrders = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }

        fetch('/api/orders/customer', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(err => { console.error("Orders fetch error:", err); setLoading(false); });
    }, [token, navigate]);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Order cancelled successfully");
                setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
            } else {
                alert(data.message || "Failed to cancel order");
            }
        } catch (error) { console.error(error); alert("Error cancelling order"); }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans pb-24">
            
            {/* ════════ HEADER NAV ════════ */}
            <div className="sticky top-0 z-50 bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-gray-900 tracking-tight">My Orders</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3">
                {loading ? (
                    <OrderSkeleton />
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[20px] border border-gray-100 shadow-sm mt-2">
                        <span className="text-5xl block mb-4">📭</span>
                        <div className="text-lg font-extrabold text-gray-900 mb-1">No Orders Yet</div>
                        <div className="text-sm font-medium text-gray-500 max-w-[200px] mx-auto mb-6">Looks like you haven't ordered anything from MUNA yet.</div>
                        <button onClick={() => navigate('/')} className="bg-amber-400 text-gray-900 px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)]">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order._id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 active:scale-[0.98]">
                            <div className="p-4 cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-sm font-extrabold text-gray-900 tracking-tight">{order.shopId?.name || "Local Shop"}</div>
                                        <div className="text-[11px] font-semibold text-gray-400 mt-0.5">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <StatusPill status={order.status} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-[11px] font-extrabold text-amber-600 tracking-wider">#{order._id.slice(-6).toUpperCase()}</div>
                                    <div className={`text-gray-300 transition-transform duration-300 ${expandedOrderId === order._id ? 'rotate-180' : ''}`}>▼</div>
                                </div>
                            </div>

                            {expandedOrderId === order._id && (
                                <div className="px-4 pb-4 border-t border-gray-50 border-dashed animate-in slide-in-from-top-2 duration-200">

                                    {/* 🚀 DISPLAY OTP TO CUSTOMER */}
                                    {order.status === 'out_for_delivery' && (
                                        <div className="bg-amber-100/50 border-2 border-amber-400 rounded-xl p-4 mt-1 mb-4 text-center shadow-inner">
                                            <span className="block text-[10px] font-black uppercase text-amber-800 tracking-widest mb-1.5">Your Delivery PIN</span>
                                            <span className="block text-4xl font-black text-amber-600 tracking-[0.25em]">{order.deliveryOtp || '----'}</span>
                                            <span className="block text-[10px] font-bold text-amber-700/80 mt-2 leading-tight">Share this PIN with the delivery partner to receive your order.</span>
                                        </div>
                                    )}

                                    <div className="py-3 space-y-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-[13px] font-medium text-gray-600">
                                                <span><span className="font-bold text-gray-400 mr-2">{item.quantity}×</span>{item.name}</span>
                                                <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {order.instructions && (
                                        <div className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl mt-2 mb-3">
                                            <strong className="block text-[10px] font-extrabold uppercase text-amber-700 tracking-wider mb-1">📝 Instructions</strong>
                                            <span className="text-xs font-medium text-amber-900">{order.instructions}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-50">
                                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Total</span>
                                        <span className="text-base font-black text-green-600">₹{order.totalAmount}</span>
                                    </div>

                                    {order.status === 'pending' && (
                                        <button onClick={(e) => { e.stopPropagation(); handleCancelOrder(order._id); }} className="w-full mt-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 active:scale-95 transition-transform">
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CustomerOrders;
