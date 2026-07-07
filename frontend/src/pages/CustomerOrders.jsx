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
                        {filteredOrders.map(order => (
                            <div key={order._id} className="bg-white rounded-[20px] shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden transition-all duration-200">
                                {/* Side Status Bar (from Vendor UI) */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(order.status).split(' ')[0]}`}></div>

                                <div
                                    className="p-4 pl-5 cursor-pointer active:bg-slate-50 transition-colors"
                                    onClick={() => {
                                        if (navigator.vibrate) navigator.vibrate(30);
                                        setExpandedOrderId(expandedOrderId === order._id ? null : order._id);
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-xs font-black text-slate-400 mb-0.5">ORDER #{order._id.slice(-6).toUpperCase()}</div>
                                            <div className="font-bold text-slate-800 text-[15px]">{order.shopId?.name || "Local Shop"}</div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-1 text-[13px]">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                <span>⏱️</span> {formatTime(order.createdAt)}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mt-1">
                                                <span>{order.items.length} Items</span> 
                                                <span className={`transition-transform duration-300 ml-1 inline-block ${expandedOrderId === order._id ? 'rotate-180' : ''}`}>▼</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Amount</div>
                                            <div className="font-black text-slate-900 text-lg">₹{order.totalAmount}</div>
                                        </div>
                                    </div>
                                </div>

                                {expandedOrderId === order._id && (
                                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 border-dashed animate-in slide-in-from-top-2 duration-200 bg-slate-50/30">

                                        {/* 🚀 DISPLAY OTP TO CUSTOMER */}
                                        {order.status === 'out_for_delivery' && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3 mb-5 text-center shadow-sm">
                                                <span className="block text-[10px] font-black uppercase text-amber-800/70 tracking-widest mb-1.5">Delivery PIN</span>
                                                <span className="block text-4xl font-black text-amber-600 tracking-[0.25em]">{order.deliveryOtp || '----'}</span>
                                                <span className="block text-[10px] font-bold text-amber-700 mt-2 leading-tight">Share this PIN with the delivery partner.</span>
                                            </div>
                                        )}

                                        <div className="py-2 space-y-2.5">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-[13px] font-semibold text-slate-600">
                                                    <span><span className="font-black text-slate-400 mr-2">{item.quantity}×</span>{item.name}</span>
                                                    <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {order.instructions && (
                                            <div className="bg-amber-50/50 border border-amber-100/50 p-3.5 rounded-xl mt-3 mb-3">
                                                <strong className="block text-[10px] font-black uppercase text-amber-700/80 tracking-wider mb-1">📝 Instructions</strong>
                                                <span className="text-xs font-semibold text-amber-900/90">{order.instructions}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-4 mt-3 border-t border-slate-200/60">
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