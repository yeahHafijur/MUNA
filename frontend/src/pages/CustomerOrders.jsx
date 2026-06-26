import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

const StatusPill = ({ status }) => {
    const labels = {
        pending: { text: '⏳ Pending', style: 'bg-orange-50 text-orange-600 border-orange-100' },
        accepted: { text: '👍 Accepted', style: 'bg-blue-50 text-blue-600 border-blue-100' },
        preparing: { text: '🔥 Preparing', style: 'bg-purple-50 text-purple-600 border-purple-100' },
        out_for_delivery: { text: '🛵 On the Way', style: 'bg-amber-50 text-amber-700 border-amber-200' },
        delivered: { text: '✅ Delivered', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        cancelled: { text: '❌ Cancelled', style: 'bg-rose-50 text-rose-600 border-rose-100' },
    };
    const current = labels[status] || { text: status, style: 'bg-slate-100 text-slate-600' };
    return <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${current.style}`}>{current.text}</span>;
};

const OrderSkeleton = () => (
    <div className="space-y-4 px-4 pt-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded-md w-1/3 mb-4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/4 mb-5" />
                <div className="h-10 bg-slate-50 rounded-xl w-full" />
            </div>
        ))}
    </div>
);

const CustomerOrders = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // 🚀 ZERO LATENCY FETCHING
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['customer-orders'],
        queryFn: async () => {
            const res = await fetch('/api/orders/customer', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        enabled: !!token
    });

    const handleCancelOrder = async (orderId) => {
        // Native feel confirmation
        if (!window.confirm("Cancel this order?")) return;

        if (navigator.vibrate) navigator.vibrate(50);
        const loadingToast = toast.loading("Cancelling order...");

        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.update(loadingToast, { render: "Order cancelled successfully", type: "success", isLoading: false, autoClose: 3000 });
                // Instantly update cache UI
                queryClient.setQueryData(['customer-orders'], old =>
                    old.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o)
                );
            } else {
                toast.update(loadingToast, { render: "Failed to cancel order", type: "error", isLoading: false, autoClose: 3000 });
            }
        } catch (error) {
            toast.update(loadingToast, { render: "Network error", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">

            {/* ════════ HEADER NAV ════════ */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/profile'); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">My Orders</span>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {isLoading ? (
                    <OrderSkeleton />
                ) : orders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] mx-4 mt-2">
                        <span className="text-6xl block mb-5 opacity-80">📭</span>
                        <div className="text-lg font-black text-slate-900 mb-1">No Orders Yet</div>
                        <div className="text-[13px] font-semibold text-slate-500 max-w-[200px] mx-auto mb-8">Looks like you haven't ordered anything from MUNA yet.</div>
                        <button onClick={() => navigate('/')} className="bg-amber-400 text-slate-900 px-8 py-3.5 rounded-2xl font-black active:scale-95 transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)]">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 px-4">
                        {orders.map(order => (
                            <div key={order._id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden transition-all duration-200">

                                <div
                                    className="p-5 cursor-pointer active:bg-slate-50 transition-colors"
                                    onClick={() => {
                                        if (navigator.vibrate) navigator.vibrate(30);
                                        setExpandedOrderId(expandedOrderId === order._id ? null : order._id);
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-[15px] font-black text-slate-900 tracking-tight mb-0.5">{order.shopId?.name || "Local Shop"}</div>
                                            <div className="text-[11px] font-bold text-slate-400">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <StatusPill status={order.status} />
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                                        <div className="text-[11px] font-black text-slate-500 tracking-widest">ID: {order._id.slice(-6).toUpperCase()}</div>
                                        <div className={`text-slate-400 transition-transform duration-300 ${expandedOrderId === order._id ? 'rotate-180' : ''}`}>▼</div>
                                    </div>
                                </div>

                                {expandedOrderId === order._id && (
                                    <div className="px-5 pb-5 border-t border-slate-50 border-dashed animate-in slide-in-from-top-2 duration-200">

                                        {/* 🚀 DISPLAY OTP TO CUSTOMER */}
                                        {order.status === 'out_for_delivery' && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3 mb-5 text-center shadow-sm">
                                                <span className="block text-[10px] font-black uppercase text-amber-800/70 tracking-widest mb-1.5">Delivery PIN</span>
                                                <span className="block text-4xl font-black text-amber-600 tracking-[0.25em]">{order.deliveryOtp || '----'}</span>
                                                <span className="block text-[10px] font-bold text-amber-700 mt-2 leading-tight">Share this PIN with the delivery partner.</span>
                                            </div>
                                        )}

                                        <div className="py-3 space-y-2.5">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-[13px] font-semibold text-slate-600">
                                                    <span><span className="font-black text-slate-400 mr-2">{item.quantity}×</span>{item.name}</span>
                                                    <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {order.instructions && (
                                            <div className="bg-amber-50/50 border border-amber-100/50 p-3.5 rounded-xl mt-2 mb-3">
                                                <strong className="block text-[10px] font-black uppercase text-amber-700/80 tracking-wider mb-1">📝 Instructions</strong>
                                                <span className="text-xs font-semibold text-amber-900/90">{order.instructions}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100">
                                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
                                            <span className="text-lg font-black text-slate-900">₹{order.totalAmount}</span>
                                        </div>

                                        {order.status === 'pending' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCancelOrder(order._id); }}
                                                className="w-full mt-5 py-3.5 bg-rose-50 text-rose-600 rounded-xl text-[13px] font-black border border-rose-100 active:scale-95 transition-transform"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrders;