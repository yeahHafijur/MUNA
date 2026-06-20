import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

const STATUS_LABELS = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    out_for_delivery: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled'
};

const VendorOrders = () => {
    const { shop, token } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [activeView, setActiveView] = useState('live'); // 'live' | 'history'
    const [expandedId, setExpandedId] = useState(null);
    const prevLiveRef = useRef(0);

    // History filters
    const [historyOrders, setHistoryOrders] = useState([]);
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPagination, setHistoryPagination] = useState({ total: 0, pages: 1 });

    // Audio notification
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

    // Fetch live orders
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
            .catch(() => {});
    }, [token, playSound]);

    // Fetch history (paginated)
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
            .catch(() => {});
    }, [token, historyPage, historyStatus, historySearch]);

    useEffect(() => { fetchLive(); const id = setInterval(fetchLive, 12000); return () => clearInterval(id); }, [fetchLive]);
    useEffect(() => { if (activeView === 'history') fetchHistory(); }, [activeView, fetchHistory]);

    const handleWhatsAppShare = (order) => {
        const subtotal = order.totalAmount - order.deliveryFee;
        const itemsList = order.items.map(i => `${i.quantity}x ${i.name} (₹${i.price * i.quantity})`).join('\n');
        
        let mapsLink = "Not available";
        if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
            mapsLink = `https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`;
        }

        const textToEncode = `*🚨 NEW DELIVERY ORDER 🚨*\n\n` +
                     `*Order ID:* #${order._id.slice(-5).toUpperCase()}\n` +
                     `*Customer:* ${order.customerId?.name || 'Guest'}\n` +
                     `*Phone:* ${order.customerId?.phone || 'N/A'}\n\n` +
                     `*Address:* ${order.deliveryLocation?.address || 'N/A'}\n` +
                     `*📍 GPS Location:* ${mapsLink}\n\n` +
                     `*📦 Items:*\n${itemsList}\n\n` +
                     `*Subtotal:* ₹${subtotal}\n` +
                     `*Delivery Fee:* ₹${order.deliveryFee}\n` +
                     `*✅ TOTAL:* ₹${order.totalAmount}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(textToEncode)}`, '_blank');
    };

    // Computed live
    const liveOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    const pendingOrders = liveOrders.filter(o => o.status === 'pending');
    const processingOrders = liveOrders.filter(o => ['accepted', 'preparing'].includes(o.status));
    const transitOrders = liveOrders.filter(o => o.status === 'out_for_delivery');

    const renderOrderCard = (order) => (
        <div key={order._id} className="v-order-card">
            <div className="v-order-card-head">
                <span className="v-order-card-id">#{order._id.slice(-5).toUpperCase()}</span>
                <span className="v-order-card-amount">₹{order.totalAmount}</span>
            </div>
            <div className="v-order-card-customer">{order.customerId?.name || 'Guest'}</div>
            <div className="v-order-card-phone">{order.customerId?.phone || 'N/A'}</div>
            <div className="v-order-card-items">
                {order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
            </div>
            {order.deliveryLocation?.address && (
                <div 
                    className="v-order-card-addr"
                    style={(order.deliveryLocation?.lat && order.deliveryLocation?.lng) ? { cursor: 'pointer', color: 'var(--v-info)', textDecoration: 'underline' } : {}}
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
            <div className="v-order-card-actions">
                {order.status === 'pending' && (
                    <>
                        <button className="v-btn v-btn-success" onClick={() => handleStatus(order._id, 'accepted')}>Accept</button>
                        <button className="v-btn v-btn-danger v-btn-sm" onClick={() => handleStatus(order._id, 'cancelled')}>Reject</button>
                    </>
                )}
                {order.status === 'accepted' && (
                    <button className="v-btn v-btn-primary v-btn-full" onClick={() => handleStatus(order._id, 'preparing')}>Start Preparing</button>
                )}
                {order.status === 'preparing' && (
                    <button className="v-btn v-btn-primary v-btn-full" onClick={() => handleStatus(order._id, 'out_for_delivery')}>Dispatch</button>
                )}
                {order.status === 'out_for_delivery' && (
                    <button className="v-btn v-btn-success v-btn-full" onClick={() => handleStatus(order._id, 'delivered')}>Mark Delivered</button>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Orders</h1>
            </div>

            {/* ── Tab Switcher ── */}
            <div className="v-tabs">
                <button className={`v-tab ${activeView === 'live' ? 'active' : ''}`} onClick={() => setActiveView('live')}>
                    Live Orders {liveOrders.length > 0 && <span style={{ background: 'var(--v-danger)', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', marginLeft: '6px' }}>{liveOrders.length}</span>}
                </button>
                <button className={`v-tab ${activeView === 'history' ? 'active' : ''}`} onClick={() => setActiveView('history')}>
                    Order History
                </button>
            </div>

            {/* ═══ LIVE ORDERS — KANBAN ═══ */}
            {activeView === 'live' && (
                <>
                    {liveOrders.length === 0 ? (
                        <div className="v-empty" style={{ minHeight: '300px' }}>
                            <div className="v-empty-icon">📋</div>
                            <div className="v-empty-title">No active orders</div>
                            <div className="v-empty-text">New orders will appear here in real-time.</div>
                        </div>
                    ) : (
                        <div className="v-kanban">
                            <div className="v-kanban-col" style={{ borderTop: '3px solid var(--v-warning)' }}>
                                <div className="v-kanban-header">
                                    <h3 style={{ color: 'var(--v-warning)' }}>New</h3>
                                    <span className="v-kanban-count">{pendingOrders.length}</span>
                                </div>
                                <div className="v-kanban-body">
                                    {pendingOrders.length === 0 ? <div className="v-kanban-empty">No new orders</div> : pendingOrders.map(renderOrderCard)}
                                </div>
                            </div>
                            <div className="v-kanban-col" style={{ borderTop: '3px solid var(--v-info)' }}>
                                <div className="v-kanban-header">
                                    <h3 style={{ color: 'var(--v-info)' }}>Processing</h3>
                                    <span className="v-kanban-count">{processingOrders.length}</span>
                                </div>
                                <div className="v-kanban-body">
                                    {processingOrders.length === 0 ? <div className="v-kanban-empty">Nothing processing</div> : processingOrders.map(renderOrderCard)}
                                </div>
                            </div>
                            <div className="v-kanban-col" style={{ borderTop: '3px solid var(--v-success)' }}>
                                <div className="v-kanban-header">
                                    <h3 style={{ color: 'var(--v-success)' }}>In Transit</h3>
                                    <span className="v-kanban-count">{transitOrders.length}</span>
                                </div>
                                <div className="v-kanban-body">
                                    {transitOrders.length === 0 ? <div className="v-kanban-empty">No orders in transit</div> : transitOrders.map(renderOrderCard)}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ═══ ORDER HISTORY ═══ */}
            {activeView === 'history' && (
                <div className="v-card">
                    <div className="v-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                        <div className="v-searchbar" style={{ flex: 1, minWidth: '200px' }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input placeholder="Search by ID or customer name..." value={historySearch} onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }} />
                        </div>
                        <select className="v-select" style={{ width: 'auto', minWidth: '120px' }} value={historyStatus} onChange={e => { setHistoryStatus(e.target.value); setHistoryPage(1); }}>
                            <option value="all">All Status</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div className="v-card-body" style={{ padding: 0 }}>
                        {historyOrders.length === 0 ? (
                            <div className="v-empty">
                                <div className="v-empty-icon">📋</div>
                                <div className="v-empty-title">No orders found</div>
                                <div className="v-empty-text">Try adjusting your search or filters.</div>
                            </div>
                        ) : (
                            <div className="v-table-wrap">
                                <table className="v-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th className="v-table-mobile-hide">Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th className="v-table-mobile-hide" style={{ textAlign: 'center' }}>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyOrders.map(order => (
                                            <>
                                                <tr key={order._id} onClick={() => setExpandedId(expandedId === order._id ? null : order._id)} style={{ cursor: 'pointer' }}>
                                                    <td><span className="v-table-id">#{order._id.slice(-5).toUpperCase()}</span></td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{order.customerId?.name || 'Guest'}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--v-text-muted)' }}>{order.customerId?.phone || ''}</div>
                                                    </td>
                                                    <td className="v-table-mobile-hide" style={{ fontSize: '12px', color: 'var(--v-text-muted)' }}>
                                                        {new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                                        {' · '}
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td style={{ fontWeight: 700 }}>₹{order.totalAmount}</td>
                                                    <td><span className={`v-pill v-pill--${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span></td>
                                                    <td className="v-table-mobile-hide" style={{ textAlign: 'center', color: 'var(--v-text-dim)' }}>
                                                        {expandedId === order._id ? '▲' : '▼'}
                                                    </td>
                                                </tr>
                                                {expandedId === order._id && (
                                                    <tr key={order._id + '-detail'}>
                                                        <td colSpan="6" style={{ padding: '16px', background: 'var(--v-bg-card-hover)' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                                <div>
                                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--v-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Delivery Address</div>
                                                                    <div 
                                                                        style={{ fontSize: '13px', cursor: (order.deliveryLocation?.lat && order.deliveryLocation?.lng) ? 'pointer' : 'default', color: (order.deliveryLocation?.lat && order.deliveryLocation?.lng) ? 'var(--v-info)' : 'inherit', textDecoration: (order.deliveryLocation?.lat && order.deliveryLocation?.lng) ? 'underline' : 'none' }}
                                                                        onClick={(e) => {
                                                                            if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
                                                                                e.stopPropagation();
                                                                                window.open(`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`, '_blank');
                                                                            }
                                                                        }}
                                                                    >
                                                                        📍 {order.deliveryLocation?.address || 'N/A'}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--v-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Items</div>
                                                                    {order.items.map((item, i) => (
                                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', borderBottom: '1px dashed var(--v-border)' }}>
                                                                            <span><b style={{ color: 'var(--v-primary)' }}>{item.quantity}×</b> {item.name}</span>
                                                                            <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                                                                        </div>
                                                                    ))}
                                                                    {order.deliveryFee > 0 && (
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', color: 'var(--v-text-muted)' }}>
                                                                            <span>Delivery Fee</span>
                                                                            <span>₹{order.deliveryFee}</span>
                                                                        </div>
                                                                    )}
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0', borderTop: '1px solid var(--v-border)', marginTop: '4px', fontWeight: 700 }}>
                                                                        <span>Total Amount</span>
                                                                        <span>₹{order.totalAmount}</span>
                                                                    </div>
                                                                    <button onClick={() => handleWhatsAppShare(order)} style={{ marginTop: '12px', padding: '6px 12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                                        Share to WhatsApp
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {historyPagination.pages > 1 && (
                            <div className="v-pagination">
                                <button disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>← Prev</button>
                                <span className="v-pagination-info">Page {historyPage} of {historyPagination.pages}</span>
                                <button disabled={historyPage >= historyPagination.pages} onClick={() => setHistoryPage(p => p + 1)}>Next →</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorOrders;
