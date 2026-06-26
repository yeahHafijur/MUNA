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

    const handleNav = (path) => {
        if (navigator.vibrate) navigator.vibrate(30);
        navigate(path);
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">

            {/* ── Greeting ── */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {getGreeting()}, <span className="text-amber-500">{(shop?.name || '').split(' ')[0]}!</span>
                </h1>
                <p className="text-[13px] font-semibold text-slate-500 mt-1">Here's your store overview for today.</p>
            </div>

            {/* ── Stat Cards Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                <div onClick={() => handleNav('/vendor/orders')} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] cursor-pointer active:scale-95 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl mb-3">📋</div>
                    <div className="text-3xl font-black text-slate-900 mb-0.5 tracking-tight">{stats.liveOrders}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Orders</div>
                </div>

                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl mb-3">₹</div>
                    <div className="text-3xl font-black text-slate-900 mb-0.5 tracking-tight">₹{stats.todayRevenue}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</div>
                </div>

                <div onClick={() => handleNav('/vendor/menu')} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] cursor-pointer active:scale-95 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl mb-3">📦</div>
                    <div className="text-3xl font-black text-slate-900 mb-0.5 tracking-tight">{stats.totalProducts}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Products</div>
                </div>

                <div onClick={() => handleNav('/vendor/menu')} className="bg-white p-5 rounded-[24px] border border-red-50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] cursor-pointer active:scale-95 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-xl mb-3">⚠</div>
                    <div className="text-3xl font-black text-red-500 mb-0.5 tracking-tight">{stats.outOfStock}</div>
                    <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">Out of Stock</div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="flex flex-wrap gap-3">
                <button onClick={() => handleNav('/vendor/menu')} className="flex-1 sm:flex-none px-6 py-4 bg-amber-400 text-amber-950 font-black rounded-2xl shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform text-[13px] uppercase tracking-wider">
                    + Add Item
                </button>
                <button onClick={() => handleNav('/vendor/godown')} className="flex-1 sm:flex-none px-6 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl shadow-sm active:scale-95 transition-transform text-[13px] uppercase tracking-wider flex items-center justify-center gap-2">
                    <span>📦</span> Godown
                </button>
            </div>

            {/* ── Recent Orders (Native List) ── */}
            <div>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Recent Orders</h2>
                    <button onClick={() => handleNav('/vendor/orders')} className="text-[11px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform uppercase tracking-wider">
                        View All
                    </button>
                </div>

                <div className="bg-white border border-slate-100 rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    {stats.recentOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-5xl mb-4 opacity-40">📋</div>
                            <h3 className="text-[15px] font-black text-slate-900 mb-1">No orders yet</h3>
                            <p className="text-[12px] font-semibold text-slate-500">Live orders will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {stats.recentOrders.map(order => (
                                <div key={order._id} onClick={() => handleNav('/vendor/orders')} className="flex items-center justify-between p-4 active:bg-slate-50 cursor-pointer transition-colors">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[13px] font-black text-slate-900">{order.customerId?.name || 'Guest'}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{order._id.slice(-5).toUpperCase()}</span>
                                        </div>
                                        <span className={`w-max px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md
                                            ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                                order.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                                                    order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                        'bg-blue-50 text-blue-600'}`}>
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[15px] font-black text-slate-900 tracking-tight">₹{order.totalAmount}</span>
                                        <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorHome;