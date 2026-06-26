import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';

const STATUS_LABELS = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    out_for_delivery: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled'
};

const VendorOrders = () => {
    const { token } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [activeView, setActiveView] = useState('live');
    const [expandedId, setExpandedId] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [deliveryOtp, setDeliveryOtp] = useState('');
    const prevLiveRef = useRef(0);

    const [historyOrders, setHistoryOrders] = useState([]);
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPagination, setHistoryPagination] = useState({ total: 0, pages: 1 });

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

    const fetchLive = useCallback(() => {
        if (!token) return;
        fetch('/api/orders/vendor?limit=100', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                const all = data.orders || data || [];
                if (!Array.isArray(all)) return;
                const live = all.filter(o => !['delivered', 'cancelled'].includes(o.status));
                if (live.length > prevLiveRef.current) playSound();
                prevLiveRef.current = live.length;
                setOrders(all);
            }).catch(() => { });
    }, [token, playSound]);

    const fetchHistory = useCallback(() => {
        if (!token) return;
        const params = new URLSearchParams({ page: historyPage, limit: 15 });
        if (historyStatus !== 'all') params.set('status', historyStatus);
        if (historySearch) params.set('search', historySearch);

        fetch(`/api/orders/vendor?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (data.orders) {
                    setHistoryOrders(data.orders);
                    setHistoryPagination(data.pagination || { total: 0, pages: 1 });
                }
            }).catch(() => { });
    }, [token, historyPage, historyStatus, historySearch]);

    useEffect(() => { fetchLive(); const id = setInterval(fetchLive, 12000); return () => clearInterval(id); }, [fetchLive]);
    useEffect(() => { if (activeView === 'history') fetchHistory(); }, [activeView, fetchHistory]);

    const CONFIRM_CONFIG = {
        accepted: { emoji: '✅', title: 'Accept Order?', desc: 'Move to Accepted column.', color: 'bg-emerald-500 hover:bg-emerald-600' },
        cancelled: { emoji: '❌', title: 'Reject Order?', desc: 'Cancel and refund customer.', color: 'bg-rose-500 hover:bg-rose-600' },
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
            setOrders(prev => prev.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
        }

        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus, deliveryOtp: newStatus === 'delivered' ? deliveryOtp : undefined }),
            });
            const data = await res.json();
            if (!res.ok) toast.error(data.message || 'Failed to update');
            else toast.success("Status updated!");
            fetchLive();
        } catch (error) {
            toast.error("Network error.");
            fetchLive();
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleWhatsAppShare = (order) => {
        const subtotal = order.totalAmount - order.deliveryFee;
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

            <div className="bg-slate-50 rounded-xl p-3 text-[12px] font-semibold text-slate-600 border border-slate-100/50">
                {order.items.map(i => (
                    <div key={i._id} className="flex justify-between items-center py-1">
                        <span><span className="font-black text-slate-400 mr-2">{i.quantity}×</span> {i.name}</span>
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
                        {(order.status === 'accepted' || order.status === 'preparing') && (
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

    return (
        <div className="animate-in fade-in duration-300 max-w-7xl mx-auto">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Orders</h1>

            {/* ── Native Segmented Control ── */}
            <div className="flex bg-slate-200/50 p-1.5 rounded-[16px] w-full sm:max-w-md mb-8 shadow-inner">
                <button
                    className={`flex-1 py-2.5 text-[13px] font-black text-center rounded-[12px] transition-all flex items-center justify-center gap-2 ${activeView === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(20); setActiveView('live'); }}
                >
                    Live {liveOrders.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-md leading-none">{liveOrders.length}</span>}
                </button>
                <button
                    className={`flex-1 py-2.5 text-[13px] font-black text-center rounded-[12px] transition-all ${activeView === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(20); setActiveView('history'); }}
                >
                    History
                </button>
            </div>

            {/* ── LIVE KANBAN BOARD ── */}
            {activeView === 'live' && (
                <>
                    {liveOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                            <span className="text-6xl opacity-30 mb-5">📋</span>
                            <h3 className="text-[16px] font-black text-slate-900 mb-1">No active orders</h3>
                            <p className="text-[13px] font-semibold text-slate-500">Wait for customers to place orders.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col h-full bg-orange-50/30 rounded-[32px] border border-orange-100 p-4">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-[11px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div> New
                                    </h3>
                                    <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-1 rounded-md">{pendingOrders.length}</span>
                                </div>
                                <div className="flex-1 space-y-4">{pendingOrders.map(renderOrderCard)}</div>
                            </div>
                            <div className="flex flex-col h-full bg-blue-50/30 rounded-[32px] border border-blue-100 p-4">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Preparing</h3>
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-1 rounded-md">{acceptedOrders.length}</span>
                                </div>
                                <div className="flex-1 space-y-4">{acceptedOrders.map(renderOrderCard)}</div>
                            </div>
                            <div className="flex flex-col h-full bg-emerald-50/30 rounded-[32px] border border-emerald-100 p-4">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">In Transit</h3>
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-1 rounded-md">{transitOrders.length}</span>
                                </div>
                                <div className="flex-1 space-y-4">{transitOrders.map(renderOrderCard)}</div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── ORDER HISTORY (Native List UI) ── */}
            {activeView === 'history' && (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
                        <input
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-[16px] text-[13px] font-bold focus:outline-none focus:border-amber-400 transition-colors placeholder:text-slate-400"
                            placeholder="🔍 Search by ID or Name..."
                            value={historySearch}
                            onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                        />
                        <select
                            className="sm:w-48 py-3 px-4 bg-white border border-slate-200 rounded-[16px] text-[13px] font-black text-slate-700 focus:outline-none transition-colors appearance-none"
                            value={historyStatus}
                            onChange={e => { setHistoryStatus(e.target.value); setHistoryPage(1); }}
                        >
                            <option value="all">All Status</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex-1 p-2">
                        {historyOrders.length === 0 ? (
                            <div className="p-16 text-center">
                                <span className="text-5xl opacity-30 mb-3 block">🔍</span>
                                <h3 className="text-[15px] font-black text-slate-900 mb-1">No orders found</h3>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {historyOrders.map(order => (
                                    <div key={order._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer rounded-2xl">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[14px] font-black text-slate-900">{order.customerId?.name || 'Guest'}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{order._id.slice(-5).toUpperCase()}</span>
                                            </div>
                                            <span className={`w-max px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {STATUS_LABELS[order.status] || order.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[15px] font-black text-slate-900 tracking-tight">₹{order.totalAmount}</span>
                                            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                {new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

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