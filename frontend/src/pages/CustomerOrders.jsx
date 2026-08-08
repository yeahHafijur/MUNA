import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IcoCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;

const STATUS_LABELS = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    out_for_delivery: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled'
};

const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'pending': return '⏳';
        case 'accepted': return '✅';
        case 'preparing': return '👨‍🍳';
        case 'out_for_delivery': return '🛵';
        case 'delivered': return '✅';
        case 'cancelled': return '❌';
        default: return '⏳';
    }
};

const formatTime = (dateString) => {
    const d = new Date(dateString);
    let h = d.getHours();
    let m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    m = m < 10 ? '0' + m : m;
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${dateStr} • ${h}:${m} ${ampm}`;
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
    const [selectedDate, setSelectedDate] = useState('');

    // 🚀 ZERO LATENCY FETCHING
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['customer-orders'],
        queryFn: async () => {
            const res = await fetch('/api/orders/customer', { credentials: 'include',   });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        enabled: true
    });

    const filteredOrders = selectedDate 
        ? orders.filter(o => o.createdAt && o.createdAt.startsWith(selectedDate))
        : orders;

    const handleCancelOrder = async (orderId) => {
        // Native feel confirmation
        if (!window.confirm("Cancel this order?")) return;

        if (navigator.vibrate) navigator.vibrate(50);
        const loadingToast = toast.loading("Cancelling order...");

        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT'
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
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 relative z-50 shadow-sm flex-shrink-0">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate(-1); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">My Orders</span>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                
                {/* ── Date Picker Filter ── */}
                <div className="px-4 mb-4">
                    <div className="bg-white p-3 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                            <IcoCalendar />
                            <span className="text-[13px]">{selectedDate ? 'Filtered' : 'All Time'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedDate && (
                                <button 
                                    onClick={() => setSelectedDate('')}
                                    className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1.5 rounded-md uppercase tracking-wider active:scale-95 transition-transform"
                                >
                                    Clear
                                </button>
                            )}
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 min-w-[110px]"
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <OrderSkeleton />
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] mx-4 mt-2">
                        <span className="text-6xl block mb-5 opacity-80">📭</span>
                        <div className="text-lg font-black text-slate-900 mb-1">No Orders Found</div>
                        <div className="text-[13px] font-semibold text-slate-500 max-w-[200px] mx-auto mb-8">
                            {selectedDate ? `You didn't order anything on this day.` : "Looks like you haven't ordered anything from MUNA yet."}
                        </div>
                        <button onClick={() => navigate('/')} className="bg-amber-400 text-slate-900 px-8 py-3.5 rounded-2xl font-black active:scale-95 transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)]">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 px-4">
                        {filteredOrders.map(order => {
                            const isExpanded = expandedOrderId === order._id;
                            const isActiveStatus = ['pending', 'accepted', 'preparing', 'out_for_delivery'].includes(order.status);
                            return (
                            <div key={order._id} className={`bg-white rounded-3xl p-5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border relative overflow-hidden transition-all duration-200 ${isExpanded ? 'border-amber-200 shadow-md' : 'border-slate-100'}`}>
                                {/* Side Status Bar (from Vendor UI) */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(order.status).split(' ')[0]}`}></div>

                                <div
                                    className="cursor-pointer active:bg-slate-50 transition-colors"
                                    onClick={() => {
                                        if (navigator.vibrate) navigator.vibrate(30);
                                        setExpandedOrderId(isExpanded ? null : order._id);
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-3 min-w-0">
                                            <div className="text-[15px] font-black text-slate-900 mb-0.5 truncate">{order.shopId?.name || "MUNA Store"}</div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                                <span>#{order._id.slice(-6).toUpperCase()}</span>
                                                <span>•</span>
                                                <span>{formatTime(order.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider shadow-sm shrink-0 ${getStatusColor(order.status)}`}>
                                            <span>{getStatusIcon(order.status)}</span>
                                            <span>{STATUS_LABELS[order.status] || order.status}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                                            <span>{order.items.length} Items</span>
                                            <span className={`transition-transform duration-300 ml-1 inline-block text-[10px] ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                        </div>
                                        <div className="text-[16px] font-black text-slate-900">₹{order.totalAmount}</div>
                                    </div>

                                    {order.instructions && (
                                        <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2 shadow-sm">
                                            <span className="text-[14px] mt-0.5">💬</span>
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-0.5">Your Instructions</span>
                                                <span className="block text-[13px] font-medium text-slate-800 leading-snug">{order.instructions}</span>
                                            </div>
                                        </div>
                                    )}

                                    {isActiveStatus && order.deliveryOtp && (
                                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[16px]">🔑</span>
                                                <span className="text-[13px] font-bold text-amber-900">Delivery OTP</span>
                                            </div>
                                            <span className="text-[20px] font-black text-amber-700 tracking-widest">{order.deliveryOtp}</span>
                                        </div>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 border-dashed animate-in slide-in-from-top-2 duration-200">
                                        <span className="block text-[12px] font-black text-slate-400 mb-3 uppercase tracking-wider">Order Items</span>
                                        <div className="space-y-2.5 mb-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100/50 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {item.productId?.image ? (
                                                            <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                                <img src={item.productId.image} alt={item.name} className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[16px]">
                                                                📦
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center border border-slate-200 text-[10px] font-black text-slate-600 shrink-0">{item.quantity}x</span>
                                                            <span className="text-[13px] font-semibold text-slate-700 truncate">{item.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[13px] font-bold text-slate-900 shrink-0 self-center">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
                                            <span className="text-lg font-black text-slate-900">₹{order.totalAmount}</span>
                                        </div>

                                        {order.status === 'pending' && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 border-dashed">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCancelOrder(order._id); }}
                                                    className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl text-[13px] font-black border border-rose-100 active:scale-[0.98] transition-transform"
                                                >
                                                    Cancel Order
                                                </button>
                                                <span className="block text-[10px] font-semibold text-slate-400 text-center mt-2">
                                                    Orders can only be cancelled before they are accepted by the store.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrders;