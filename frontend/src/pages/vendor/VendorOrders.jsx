import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/ui/PageHeader';

/* ─── Premium Crisp Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IcoCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;

const STATUS_LABELS = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    out_for_delivery: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled'
};

const VendorOrders = () => {
    // 🔥 Changed: Replaced useOutletContext with useAuth
    const { token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeView, setActiveView] = useState('live');
    const [liveTab, setLiveTab] = useState('pending'); // Inner tab state for Live Orders
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [deliveryOtp, setDeliveryOtp] = useState('');
    const prevLiveRef = useRef(0);

    // Changed: Date based state for history
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const playSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const play = (freq, delay, dur) => {
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.value = freq; gain.gain.value = 0.3;
                osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur);
            };
            play(880, 0, 0.4); play(1108.73, 0.15, 0.6);
        } catch { /* ignore */ }
    }, []);

    const { data: orders = [] } = useQuery({
        queryKey: ['vendor-live-orders'],
        queryFn: async () => {
            const res = await fetch('/api/orders/vendor?limit=100', { credentials: 'include',   });
            if (!res.ok) return [];
            const data = await res.json();
            const all = data.orders || data || [];
            if (!Array.isArray(all)) return [];
            const live = all.filter(o => !['delivered', 'cancelled'].includes(o.status));
            if (live.length > prevLiveRef.current) playSound();
            prevLiveRef.current = live.length;
            return all;
        },
        enabled: true,
        refetchInterval: 12000
    });

    const { data: historyOrders = [], isLoading: isHistoryLoading } = useQuery({
        queryKey: ['vendor-history-orders', selectedDate],
        queryFn: async () => {
            const res = await fetch(`/api/orders/vendor?date=${selectedDate}&limit=200`, {  });
            if (!res.ok) return [];
            const data = await res.json();
            return data.orders || [];
        },
        enabled:  activeView === 'history'
    });

    const CONFIRM_CONFIG = {
        accepted: { emoji: '✅', title: 'Accept Order?', desc: 'Move to Accepted column.', color: 'bg-emerald-500 hover:bg-emerald-600' },
        cancelled: { emoji: '❌', title: 'Reject Order?', desc: 'Cancel and refund customer.', color: 'bg-rose-500 hover:bg-rose-600' },
        preparing: { emoji: '👨‍🍳', title: 'Start Preparing?', desc: 'Mark this order as being prepared.', color: 'bg-violet-500 hover:bg-violet-600' },
        out_for_delivery: { emoji: '🚚', title: 'Dispatch?', desc: 'Mark as out for delivery.', color: 'bg-blue-500 hover:bg-blue-600' },
        delivered: { emoji: '🎉', title: 'Verify Delivery', desc: 'Enter 4-digit PIN from customer.', color: 'bg-emerald-500 hover:bg-emerald-600' },
    };

    const requestConfirm = (orderId, newStatus) => {
        if (navigator.vibrate) navigator.vibrate(30);
        setDeliveryOtp('');
        setConfirmAction({ orderId, newStatus });
    }

    const handleConfirm = async () => {
        if (!confirmAction) return;
        const { orderId, newStatus } = confirmAction;

        if (newStatus === 'delivered' && deliveryOtp.length !== 4) {
            toast.error("Enter full 4-digit PIN!");
            return;
        }

        if (navigator.vibrate) navigator.vibrate(50);
        setConfirmAction(null);
        setUpdatingStatusId(orderId);

        if (newStatus !== 'delivered') {
            queryClient.setQueryData(['vendor-live-orders'], (prev) => {
                if (!prev) return [];
                return prev.map(order => order._id === orderId ? { ...order, status: newStatus } : order);
            });
        }

        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json',  },
                body: JSON.stringify({ status: newStatus, deliveryOtp: newStatus === 'delivered' ? deliveryOtp : undefined }),
            });
            const data = await res.json();
            if (!res.ok) toast.error(data.message || 'Failed to update');
            else toast.success("Status updated!");
            queryClient.invalidateQueries({ queryKey: ['vendor-live-orders'] });
        } catch {
            toast.error("Network error.");
            queryClient.invalidateQueries({ queryKey: ['vendor-live-orders'] });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleWhatsAppShare = (order) => {
        const itemsList = order.items.map(i => `${i.quantity}x ${i.name} (₹${i.price * i.quantity})`).join('\n');
        let mapsLink = "Not available";
        if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
            mapsLink = `https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`;
        }
        let textToEncode = `*🚨 NEW DELIVERY ORDER 🚨*\n\n` +
            `*Order ID:* #${order._id.slice(-5).toUpperCase()}\n` +
            `*Customer:* ${order.customerId?.name || 'Guest'}\n` +
            `*Phone:* ${order.customerId?.phone || 'N/A'}\n\n` +
            `*Address:* ${order.deliveryLocation?.address || 'N/A'}\n` +
            `*📍 Map:* ${mapsLink}\n\n` +
            `*📦 Items:*\n${itemsList}\n\n`;
        if (order.instructions && order.instructions.trim() !== '') textToEncode += `*📝 Instructions:*\n${order.instructions.trim()}\n\n`;
        textToEncode += `*Total:* ₹${order.totalAmount}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(textToEncode)}`, '_blank');
    };

    const liveOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    const pendingOrders = liveOrders.filter(o => o.status === 'pending');
    const acceptedOrders = liveOrders.filter(o => ['accepted', 'preparing'].includes(o.status));
    const transitOrders = liveOrders.filter(o => o.status === 'out_for_delivery');

    const renderOrderCard = (order) => (
        <div key={order._id} className="bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-[24px] p-4 flex flex-col gap-3 group">
            <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">#{order._id.slice(-5).toUpperCase()}</span>
                <span className="text-[16px] font-black text-slate-900">₹{order.totalAmount}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-[15px] font-black text-slate-900">{order.customerId?.name || 'Guest'}</span>
                <span className="text-[12px] font-semibold text-slate-500">{order.customerId?.phone || 'N/A'}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-[12px] font-semibold text-slate-600 border border-slate-100/50 space-y-2">
                {order.items.map(i => (
                    <div key={i._id} className="flex items-center pb-2 border-b border-slate-100/80 last:border-0 last:pb-0">
                        {i.productId?.image ? (
                            <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-slate-200 mr-3 border border-slate-200">
                                <img src={i.productId.image} alt={i.name} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-200 mr-3 border border-slate-200 flex items-center justify-center text-lg">
                                📦
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="truncate"><span className="font-black text-slate-400 mr-2">{i.quantity}×</span> {i.name}</div>
                        </div>
                    </div>
                ))}
            </div>

            {order.instructions && order.instructions.trim() !== '' && (
                <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3">
                    <span className="text-[10px] font-black uppercase text-amber-700/80 tracking-wider block mb-1">📝 Instructions</span>
                    <p className="text-xs font-semibold text-amber-900">{order.instructions}</p>
                </div>
            )}

            {order.deliveryLocation?.address && (
                <div className={`text-[11px] font-semibold ${order.deliveryLocation?.lat ? 'text-blue-600 cursor-pointer active:scale-95' : 'text-slate-500'}`}
                    onClick={(e) => {
                        if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
                            e.stopPropagation();
                            window.open(`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`, '_blank');
                        }
                    }}>
                    📍 {order.deliveryLocation.address}
                </div>
            )}

            <div className="pt-3 mt-1 border-t border-slate-50 flex gap-2">
                {updatingStatusId === order._id ? (
                    <div className="w-full py-3 flex justify-center items-center gap-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-400">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div> Updating...
                    </div>
                ) : (
                    <>
                        {order.status === 'pending' && (
                            <>
                                <button className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-95 transition-transform" onClick={() => requestConfirm(order._id, 'accepted')}>Accept</button>
                                <button className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-95 transition-transform" onClick={() => requestConfirm(order._id, 'cancelled')}>Reject</button>
                            </>
                        )}
                        {order.status === 'accepted' && (
                            <div className="flex gap-2 w-full">
                                <button className="flex-1 bg-violet-500 text-white py-3 rounded-xl text-[12px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-transform" onClick={() => requestConfirm(order._id, 'preparing')}>Start Preparing</button>
                                <button onClick={() => handleWhatsAppShare(order)} className="flex-1 bg-[#25D366] text-white py-3 rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-95 transition-transform flex justify-center items-center">WhatsApp</button>
                            </div>
                        )}
                        {order.status === 'preparing' && (
                            <div className="flex gap-2 w-full">
                                <button className="flex-1 bg-amber-400 text-amber-950 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-transform" onClick={() => requestConfirm(order._id, 'out_for_delivery')}>Dispatch</button>
                                <button onClick={() => handleWhatsAppShare(order)} className="flex-1 bg-[#25D366] text-white py-3 rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-95 transition-transform flex justify-center items-center">WhatsApp</button>
                            </div>
                        )}
                        {order.status === 'out_for_delivery' && (
                            <button className="w-full bg-emerald-500 text-white py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-transform" onClick={() => requestConfirm(order._id, 'delivered')}>Verify & Deliver</button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    // ─── STATS & HELPERS FOR HISTORY ───
    const historyTotal = historyOrders.length;
    const historyPending = historyOrders.filter(o => o.status === 'pending').length;
    const historyActive = historyOrders.filter(o => ['accepted', 'preparing', 'out_for_delivery'].includes(o.status)).length;
    const historyDone = historyOrders.filter(o => o.status === 'delivered').length;

    const formatTime = (dateString) => {
        const d = new Date(dateString);
        let h = d.getHours();
        let m = d.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        m = m < 10 ? '0' + m : m;
        return `${h}:${m} ${ampm}`;
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

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">

            {/* ─── NATIVE HEADER & CONTROLS (Sticky) ─── */}
            <div className="bg-white sticky top-0 z-50 shadow-sm">
                <PageHeader title="Manage Orders" sticky={false} onBack={() => { if(navigator.vibrate) navigator.vibrate(40); navigate('/vendor'); }} />
                
                {/* ── Native Segmented Control ── */}
                <div className="px-4 pb-3">
                    <div className="flex bg-slate-100/80 p-1.5 rounded-[16px] w-full max-w-md mx-auto shadow-inner">
                        <button
                            className={`flex-1 py-2 text-[13px] font-black text-center rounded-[12px] transition-all flex items-center justify-center gap-2 ${activeView === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => { if (navigator.vibrate) navigator.vibrate(20); setActiveView('live'); }}
                        >
                            Live {liveOrders.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-md leading-none">{liveOrders.length}</span>}
                        </button>
                        <button
                            className={`flex-1 py-2 text-[13px] font-black text-center rounded-[12px] transition-all ${activeView === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => { if (navigator.vibrate) navigator.vibrate(20); setActiveView('history'); }}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-7xl mx-auto w-full">

                {/* ── LIVE ORDERS (Inner Tabs UI) ── */}
                {activeView === 'live' && (
                    <div className="space-y-4">
                        {/* Inner Tabs for Live Orders */}
                        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <button
                                onClick={() => setLiveTab('pending')}
                                className={`flex-shrink-0 px-5 py-2.5 rounded-[14px] text-[13px] font-black transition-all flex items-center gap-2 ${liveTab === 'pending' ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                New {pendingOrders.length > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-md leading-none ${liveTab === 'pending' ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-800'}`}>{pendingOrders.length}</span>}
                            </button>
                            <button
                                onClick={() => setLiveTab('preparing')}
                                className={`flex-shrink-0 px-5 py-2.5 rounded-[14px] text-[13px] font-black transition-all flex items-center gap-2 ${liveTab === 'preparing' ? 'bg-blue-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Preparing {acceptedOrders.length > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-md leading-none ${liveTab === 'preparing' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-800'}`}>{acceptedOrders.length}</span>}
                            </button>
                            <button
                                onClick={() => setLiveTab('transit')}
                                className={`flex-shrink-0 px-5 py-2.5 rounded-[14px] text-[13px] font-black transition-all flex items-center gap-2 ${liveTab === 'transit' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                In Transit {transitOrders.length > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-md leading-none ${liveTab === 'transit' ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-800'}`}>{transitOrders.length}</span>}
                            </button>
                        </div>

                        {/* Order List for the selected tab */}
                        <div className="space-y-4 pt-2">
                            {liveTab === 'pending' && pendingOrders.length === 0 && (
                                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <span className="text-5xl opacity-40 mb-3 block">🛎️</span>
                                    <h3 className="text-[15px] font-black text-slate-900 mb-1">No new orders</h3>
                                </div>
                            )}
                            {liveTab === 'pending' && pendingOrders.map(renderOrderCard)}

                            {liveTab === 'preparing' && acceptedOrders.length === 0 && (
                                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <span className="text-5xl opacity-40 mb-3 block">👨‍🍳</span>
                                    <h3 className="text-[15px] font-black text-slate-900 mb-1">Nothing is preparing</h3>
                                </div>
                            )}
                            {liveTab === 'preparing' && acceptedOrders.map(renderOrderCard)}

                            {liveTab === 'transit' && transitOrders.length === 0 && (
                                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <span className="text-5xl opacity-40 mb-3 block">🚚</span>
                                    <h3 className="text-[15px] font-black text-slate-900 mb-1">No orders in transit</h3>
                                </div>
                            )}
                            {liveTab === 'transit' && transitOrders.map(renderOrderCard)}
                        </div>
                    </div>
                )}

                {/* ── ORDER HISTORY (Native List UI) ── */}
                {activeView === 'history' && (
                    <div className="space-y-5">
                        
                        {/* Date Picker & Controls */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-700 font-bold">
                                <IcoCalendar />
                                <span className="text-sm">Filter by Date:</span>
                            </div>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            />
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                                <span className="text-xl font-black text-slate-800">{historyTotal}</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total</span>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-2xl shadow-sm border border-yellow-100 flex flex-col items-center justify-center text-center">
                                <span className="text-xl font-black text-yellow-700">{historyPending}</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-yellow-600/70 uppercase tracking-wider mt-1">Pending</span>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center">
                                <span className="text-xl font-black text-blue-700">{historyActive}</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-blue-600/70 uppercase tracking-wider mt-1">Active</span>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center">
                                <span className="text-xl font-black text-emerald-700">{historyDone}</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mt-1">Done</span>
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="space-y-3">
                            {isHistoryLoading ? (
                                <div className="text-center py-10 text-slate-400 font-semibold text-sm">Loading orders...</div>
                            ) : historyOrders.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <span className="text-4xl mb-2 block">📭</span>
                                    <span className="text-slate-500 font-bold text-sm">No orders found for this date.</span>
                                </div>
                            ) : (
                                historyOrders.map((order) => (
                                    <div key={order._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                                        {/* Side Status Bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(order.status).split(' ')[0]}`}></div>
                                        
                                        <div className="flex justify-between items-start mb-3 pl-2">
                                            <div>
                                                <div className="text-xs font-black text-slate-400 mb-0.5">ORDER #{order._id.slice(-6).toUpperCase()}</div>
                                                <div className="font-bold text-slate-800 text-[15px]">{order.customerId?.name || 'Guest'}</div>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                {STATUS_LABELS[order.status] || order.status}
                                            </div>
                                        </div>

                                        <div className="pl-2 flex justify-between items-end">
                                            <div className="flex flex-col gap-1 text-[13px]">
                                                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                                                    <span>📞</span> {order.customerId?.phone || 'No Phone'}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                    <span>⏱️</span> {formatTime(order.createdAt)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Amount</div>
                                                <div className="font-black text-slate-900 text-lg">₹{order.totalAmount}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ FLOATING BOTTOM SHEET: CONFIRMATION & OTP ═══ */}
            {confirmAction && (() => {
                const cfg = CONFIRM_CONFIG[confirmAction.newStatus] || { emoji: '❓', title: 'Are you sure?', desc: '', color: 'bg-blue-500' };
                return (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200" onClick={() => setConfirmAction(null)}>
                        <div className="bg-white rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 max-w-sm w-full text-center shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
                            <div className="text-5xl mb-4">{cfg.emoji}</div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{cfg.title}</h3>
                            <p className="text-[13px] font-semibold text-slate-500 mb-6 px-4">{cfg.desc}</p>

                            {confirmAction.newStatus === 'delivered' && (
                                <div className="mb-6">
                                    <label className="block text-[11px] font-black text-amber-600 uppercase tracking-widest mb-3">Ask Customer for PIN</label>
                                    <input
                                        type="tel"
                                        maxLength={4}
                                        placeholder="••••"
                                        value={deliveryOtp}
                                        onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-5xl font-black text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 focus:outline-none focus:border-amber-400 focus:bg-white transition-all tracking-[0.4em] shadow-inner"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setConfirmAction(null); setDeliveryOtp(''); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-[13px] font-black active:scale-95 transition-transform">Cancel</button>
                                <button onClick={handleConfirm} className={`flex-1 py-3.5 text-white rounded-2xl text-[13px] font-black shadow-md active:scale-95 transition-transform ${cfg.color}`}>
                                    {confirmAction.newStatus === 'delivered' ? 'Verify & Deliver' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default VendorOrders;