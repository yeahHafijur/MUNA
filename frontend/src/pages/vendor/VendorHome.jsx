import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

const VendorHome = () => {
    const { shop, token } = useOutletContext();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ liveOrders: 0, todayRevenue: 0, totalProducts: 0, outOfStock: 0, recentOrders: [] });

    useEffect(() => {
        if (!token) return;
        // Fetch orders
        fetch('/api/orders/vendor?limit=100', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                const orders = data.orders || data || [];
                if (!Array.isArray(orders)) return;

                const today = new Date().toDateString();
                const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
                const liveOrders = orders.filter(o => !['delivered','cancelled'].includes(o.status));
                const todayRevenue = todayOrders
                    .filter(o => o.status === 'delivered')
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                setStats(prev => ({
                    ...prev,
                    liveOrders: liveOrders.length,
                    todayRevenue,
                    recentOrders: orders.slice(0, 5)
                }));
            });

        // Fetch products
        if (shop?._id) {
            fetch(`/api/products/${shop._id}`)
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setStats(prev => ({
                            ...prev,
                            totalProducts: data.length,
                            outOfStock: data.filter(p => !p.inStock).length
                        }));
                    }
                });
        }
    }, [token, shop]);

    const statusLabels = {
        pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
        out_for_delivery: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled'
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{greeting()}, {(shop?.name || '').split(' ')[0]}!</h1>
                <p style={{ fontSize: '13px', color: 'var(--v-text-muted)' }}>Here's your store at a glance.</p>
            </div>

            {/* ── Stat Cards ── */}
            <div className="v-stats">
                <div className="v-stat" onClick={() => navigate('/vendor/orders')} style={{ cursor: 'pointer' }}>
                    <div className="v-stat-value" style={{ color: 'var(--v-warning)' }}>{stats.liveOrders}</div>
                    <div className="v-stat-label">Active Orders</div>
                    <div className="v-stat-icon" style={{ background: 'var(--v-warning-soft)' }}>📋</div>
                </div>
                <div className="v-stat">
                    <div className="v-stat-value" style={{ color: 'var(--v-success)' }}>₹{stats.todayRevenue}</div>
                    <div className="v-stat-label">Today's Revenue</div>
                    <div className="v-stat-icon" style={{ background: 'var(--v-success-soft)' }}>₹</div>
                </div>
                <div className="v-stat" onClick={() => navigate('/vendor/menu')} style={{ cursor: 'pointer' }}>
                    <div className="v-stat-value">{stats.totalProducts}</div>
                    <div className="v-stat-label">Total Products</div>
                    <div className="v-stat-icon" style={{ background: 'var(--v-primary-soft)' }}>📦</div>
                </div>
                {stats.outOfStock > 0 && (
                    <div className="v-stat" onClick={() => navigate('/vendor/menu')} style={{ cursor: 'pointer' }}>
                        <div className="v-stat-value" style={{ color: 'var(--v-danger)' }}>{stats.outOfStock}</div>
                        <div className="v-stat-label">Out of Stock</div>
                        <div className="v-stat-icon" style={{ background: 'var(--v-danger-soft)' }}>⚠</div>
                    </div>
                )}
            </div>

            {/* ── Quick Actions ── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button className="v-btn v-btn-primary" onClick={() => navigate('/vendor/menu')}>+ Add New Item</button>
                <button className="v-btn v-btn-ghost" onClick={() => navigate('/vendor/godown')}>📦 Import from Godown</button>
            </div>

            {/* ── Recent Orders ── */}
            <div className="v-card">
                <div className="v-card-header">
                    <div className="v-card-title">Recent Orders</div>
                    <button className="v-btn v-btn-ghost v-btn-sm" onClick={() => navigate('/vendor/orders')}>View All</button>
                </div>
                <div className="v-card-body" style={{ padding: 0 }}>
                    {stats.recentOrders.length === 0 ? (
                        <div className="v-empty">
                            <div className="v-empty-icon">📦</div>
                            <div className="v-empty-title">No orders yet</div>
                            <div className="v-empty-text">When customers place orders, they'll appear here.</div>
                        </div>
                    ) : (
                        <div className="v-table-wrap">
                            <table className="v-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th className="v-table-mobile-hide">Time</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentOrders.map(order => (
                                        <tr key={order._id} onClick={() => navigate('/vendor/orders')} style={{ cursor: 'pointer' }}>
                                            <td><span className="v-table-id">#{order._id.slice(-5).toUpperCase()}</span></td>
                                            <td>{order.customerId?.name || 'Guest'}</td>
                                            <td className="v-table-mobile-hide">
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td style={{ fontWeight: 700 }}>₹{order.totalAmount}</td>
                                            <td>
                                                <span className={`v-pill v-pill--${order.status}`}>
                                                    {statusLabels[order.status] || order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorHome;
