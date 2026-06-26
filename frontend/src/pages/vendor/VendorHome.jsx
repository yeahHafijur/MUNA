import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

const VendorHome = () => {
    const { shop, token } = useOutletContext();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ liveOrders: 0, todayRevenue: 0, totalProducts: 0, outOfStock: 0, recentOrders: [] });

    useEffect(() => {
        if (!token) return;

        fetch('/api/orders/vendor?limit=100', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                const orders = data.orders || data || [];
                if (!Array.isArray(orders)) return;

                const today = new Date().toDateString();
                const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
                const liveOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
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

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* ── Greeting ── */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {getGreeting()}, <span className="text-amber-500">{(shop?.name || '').split(' ')[0]}!</span>
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Here's what's happening in your store today.</p>
            </div>

            {/* ── Stat Cards Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div onClick={() => navigate('/vendor/orders')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-400 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📋</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{stats.liveOrders}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Orders</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl">₹</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">₹{stats.todayRevenue}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Revenue</div>
                </div>

                <div onClick={() => navigate('/vendor/menu')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📦</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{stats.totalProducts}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Products</div>
                </div>

                <div onClick={() => navigate('/vendor/menu')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-red-400 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⚠</div>
                    </div>
                    <div className="text-3xl font-black text-red-500 mb-1">{stats.outOfStock}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Out of Stock</div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/vendor/menu')} className="px-6 py-3 bg-amber-400 text-amber-950 font-bold rounded-xl shadow-sm hover:bg-amber-500 active:scale-95 transition-all text-sm">
                    + Add New Item
                </button>
                <button onClick={() => navigate('/vendor/godown')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-sm flex items-center gap-2">
                    <span>📦</span> Import from Godown
                </button>
            </div>

            {/* ── Recent Orders Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Recent Orders</h2>
                    <button onClick={() => navigate('/vendor/orders')} className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors">
                        View All
                    </button>
                </div>

                <div className="p-0">
                    {stats.recentOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-4xl mb-3 opacity-50">📋</div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1">No orders yet</h3>
                            <p className="text-xs font-medium text-slate-500">When customers place orders, they'll appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-white">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Order ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.recentOrders.map(order => (
                                        <tr key={order._id} onClick={() => navigate('/vendor/orders')} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-amber-600">#{order._id.slice(-5).toUpperCase()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{order.customerId?.name || 'Guest'}</span>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <span className="text-xs font-medium text-slate-500">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
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