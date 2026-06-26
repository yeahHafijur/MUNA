import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

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

    // 🚀 NEW: OTP State for Delivery Verification
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
            })
            .catch(() => { });
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
            })
            .catch(() => { });
    }, [token, historyPage, historyStatus, historySearch]);

    useEffect(() => { fetchLive(); const id = setInterval(fetchLive, 12000); return () => clearInterval(id); }, [fetchLive]);
    useEffect(() => { if (activeView === 'history') fetchHistory(); }, [activeView, fetchHistory]);

    const CONFIRM_CONFIG = {
        accepted: { emoji: '✅', title: 'Accept Order?', desc: 'This order will move to the Accepted column.', color: 'bg-emerald-500 hover:bg-emerald-600' },
        cancelled: { emoji: '❌', title: 'Reject Order?', desc: 'This order will be cancelled and the customer will be notified.', color: 'bg-red-500 hover:bg-red-600' },
        out_for_delivery: { emoji: '🚚', title: 'Out for Delivery?', desc: 'Mark this order as dispatched for delivery.', color: 'bg-blue-500 hover:bg-blue-600' },
        delivered: { emoji: '🎉', title: 'Verify Delivery', desc: 'Enter the 4-digit PIN from the customer to mark as delivered.', color: 'bg-emerald-500 hover:bg-emerald-600' },
    };

    const requestConfirm = (orderId, newStatus) => {
        setDeliveryOtp(''); // Modal khulte hi OTP reset karo
        setConfirmAction({ orderId, newStatus });
    }

    const handleConfirm = async () => {
        if (!confirmAction) return;
        const { orderId, newStatus } = confirmAction;

        // 🚀 VERIFY INPUT LOCALLY BEFORE SENDING API
        if (newStatus === 'delivered') {
            if (deliveryOtp.length !== 4) {
                alert("Please enter the complete 4-digit PIN!");
                return;
            }
        }

        setConfirmAction(null);
        setUpdatingStatusId(orderId);

        // Optimistic update only if not 'delivered', kyunki delivery galat OTP par fail ho sakti hai
        if (newStatus !== 'delivered') {
            setOrders(prev => prev.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
        }

        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    status: newStatus,
                    deliveryOtp: newStatus === 'delivered' ? deliveryOtp : undefined // Send OTP if delivering
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                alert(`Error: ${data.message || 'Failed to update status'}`);
            }
            fetchLive(); // Always refresh to sync
        } catch (error) {
            console.error(error);
            alert("Network error while updating status.");
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
            `*📍 GPS Location:* ${mapsLink}\n\n` +
            `*📦 Items:*\n${itemsList}\n\n`;

        if (order.instructions && order.instructions.trim() !== '') {
            textToEncode += `*📝 Instructions:*\n${order.instructions.trim()}\n\n`;
        }

        textToEncode += `*Subtotal:* ₹${subtotal}\n` +
            `*Delivery Fee:* ₹${order.deliveryFee}\n` +
            `*✅ TOTAL:* ₹${order.totalAmount}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(textToEncode)}`, '_blank');
    };

    const liveOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    const pendingOrders = liveOrders.filter(o => o.status === 'pending');
    const acceptedOrders = liveOrders.filter(o => ['accepted', 'preparing'].includes(o.status));
    const transitOrders = liveOrders.filter(o => o.status === 'out_for_delivery');

    const renderOrderCard = (order) => (
        <div key={order._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4 flex flex-col gap-3 transition-all hover:border-amber-400 group">
            <div className="flex justify-between items-center">
                <span className="text-sm font-black text-amber-600 tracking-tight">#{order._id.slice(-5).toUpperCase()}</span>
                <span className="text-base font-black text-slate-900">₹{order.totalAmount}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">{order.customerId?.name || 'Guest'}</span>
                <span className="text-xs font-semibold text-slate-500">{order.customerId?.phone || 'N/A'}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs font-medium text-slate-600 leading-relaxed border border-slate-100">
                {order.items.map(i => (
                    <div key={i._id} className="flex justify-between items-center border-b border-slate-200/60 last:border-0 py-1">
                        <span><span className="font-black text-slate-400 mr-1">{i.quantity}×</span> {i.name}</span>
                    </div>
                ))}
            </div>

            {order.instructions && order.instructions.trim() !== '' && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-sm">📝</span>
                    <p className="text-xs font-bold text-amber-800 leading-snug">{order.instructions}</p>
                </div>
            )}

            {order.deliveryLocation?.address && (
                <div
                    className={`text-xs font-medium ${order.deliveryLocation?.lat ? 'text-blue-600 cursor-pointer hover:underline' : 'text-slate-500'}`}
                    onClick={(e) => {
                        if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
                            e.stopPropagation();
                            window.open(`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`, '_blank');
                        }
                    }}
                >
                    📍 {order.deliveryLocation.address}
                </div>
            )}

            <div className="pt-2 mt-1 border-t border-slate-100 flex gap-2">
                {updatingStatusId === order._id ? (
                    <div className="w-full py-2.5 flex justify-center items-center gap-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
                        Updating...
                    </div>
                ) : (
                    <>
                        {order.status === 'pending' && (
                            <>
                                <button className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform" onClick={() => requestConfirm(order._id, 'accepted')}>Accept</button>
                                <button className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform border border-red-100" onClick={() => requestConfirm(order._id, 'cancelled')}>Reject</button>
                            </>
                        )}
                        {(order.status === 'accepted' || order.status === 'preparing') && (
                            <div className="flex gap-2 w-full">
                                <button className="flex-1 bg-amber-400 text-amber-950 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform" onClick={() => requestConfirm(order._id, 'out_for_delivery')}>🚚 Dispatch</button>
                                <button onClick={() => handleWhatsAppShare(order)} className="flex-1 bg-[#25D366] text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1.5">
                                    WhatsApp
                                </button>
                            </div>
                        )}
                        {order.status === 'out_for_delivery' && (
                            <button className="w-full bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform" onClick={() => requestConfirm(order._id, 'delivered')}>Mark Delivered</button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-300">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Orders</h1>

            <div className="flex bg-slate-200/60 p-1 rounded-xl w-full sm:max-w-md mb-6">
                <button
                    className={`flex-1 py-2 text-sm font-bold text-center rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeView === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveView('live')}
                >
                    Live Orders {liveOrders.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full leading-none">{liveOrders.length}</span>}
                </button>
                <button
                    className={`flex-1 py-2 text-sm font-bold text-center rounded-lg transition-all duration-200 ${activeView === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveView('history')}
                >
                    Order History
                </button>
            </div>

            {/* LIVE KANBAN BOARD */}
            {activeView === 'live' && (
                <>
                    {liveOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <span className="text-5xl opacity-40 mb-4">📋</span>
                            <h3 className="text-base font-black text-slate-900 mb-1">No active orders</h3>
                            <p className="text-sm font-medium text-slate-500">New orders will appear here in real-time.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col h-full bg-slate-50/50 rounded-3xl border border-orange-200/50 p-4">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div> New
                                    </h3>
                                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-md">{pendingOrders.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {pendingOrders.length === 0 ? <div className="text-center py-8 text-xs font-bold text-slate-400">No new orders</div> : pendingOrders.map(renderOrderCard)}
                                </div>
                            </div>
                            <div className="flex flex-col h-full bg-slate-50/50 rounded-3xl border border-blue-200/50 p-4">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest">Preparing</h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">{acceptedOrders.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {acceptedOrders.length === 0 ? <div className="text-center py-8 text-xs font-bold text-slate-400">No accepted orders</div> : acceptedOrders.map(renderOrderCard)}
                                </div>
                            </div>
                            <div className="flex flex-col h-full bg-slate-50/50 rounded-3xl border border-emerald-200/50 p-4">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest">Out for Delivery</h3>
                                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-md">{transitOrders.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {transitOrders.length === 0 ? <div className="text-center py-8 text-xs font-bold text-slate-400">No orders in transit</div> : transitOrders.map(renderOrderCard)}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ORDER HISTORY */}
            {activeView === 'history' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input
                                className="w-full py-2.5 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors"
                                placeholder="Search by ID or customer name..."
                                value={historySearch}
                                onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                            />
                        </div>
                        <select
                            className="w-full sm:w-48 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-400 transition-colors"
                            value={historyStatus}
                            onChange={e => { setHistoryStatus(e.target.value); setHistoryPage(1); }}
                        >
                            <option value="all">All Status</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        {historyOrders.length === 0 ? (
                            <div className="p-16 text-center">
                                <span className="text-4xl opacity-40 mb-3 block">🔍</span>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">No orders found</h3>
                                <p className="text-xs font-medium text-slate-500">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-white">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Order ID</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {historyOrders.map(order => (
                                            <tr key={order._id} onClick={() => setExpandedId(expandedId === order._id ? null : order._id)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-amber-600">#{order._id.slice(-5).toUpperCase()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-900">{order.customerId?.name || 'Guest'}</div>
                                                    <div className="text-xs font-semibold text-slate-400">{order.customerId?.phone || ''}</div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <div className="text-xs font-medium text-slate-500">
                                                        {new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                                    </div>
                                                    <div className="text-xs font-medium text-slate-400">
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-slate-900">₹{order.totalAmount}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md
                                                        ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            order.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                                order.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                    'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                        {STATUS_LABELS[order.status] || order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {historyPagination.pages > 1 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-center gap-4">
                            <button
                                disabled={historyPage <= 1}
                                onClick={() => setHistoryPage(p => p - 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 transition-colors"
                            >← Prev</button>
                            <span className="text-xs font-bold text-slate-400">Page {historyPage} of {historyPagination.pages}</span>
                            <button
                                disabled={historyPage >= historyPagination.pages}
                                onClick={() => setHistoryPage(p => p + 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 transition-colors"
                            >Next →</button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ CONFIRMATION MODAL WITH OTP ═══ */}
            {confirmAction && (() => {
                const cfg = CONFIRM_CONFIG[confirmAction.newStatus] || { emoji: '❓', title: 'Are you sure?', desc: '', color: 'bg-blue-500' };
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="text-5xl mb-4">{cfg.emoji}</div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{cfg.title}</h3>
                            <p className="text-sm font-medium text-slate-500 mb-6">{cfg.desc}</p>

                            {/* 🚀 RENDER OTP INPUT IF STATUS IS DELIVERED */}
                            {confirmAction.newStatus === 'delivered' && (
                                <div className="mb-6 animate-in slide-in-from-bottom-2 duration-300">
                                    <label className="block text-xs font-extrabold text-amber-600 uppercase tracking-widest mb-3">
                                        Ask Customer for PIN
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        placeholder="••••"
                                        value={deliveryOtp}
                                        onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-4xl font-black text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 focus:outline-none focus:border-emerald-500 focus:bg-emerald-50 transition-all tracking-[0.5em]"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setConfirmAction(null); setDeliveryOtp(''); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={handleConfirm} className={`flex-1 py-3 text-white rounded-xl text-sm font-bold transition-colors ${cfg.color}`}>
                                    {confirmAction.newStatus === 'delivered' ? 'Verify & Deliver' : 'Yes, Confirm'}
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