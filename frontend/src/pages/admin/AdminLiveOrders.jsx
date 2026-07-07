import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';

const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IcoCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;

const AdminLiveOrders = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    
    // Default to today
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (user?.role !== 'super_admin') {
            navigate('/');
        }
    }, [token, user, navigate]);

    // Fetch orders
    const { data: orders = [], isLoading, isError } = useQuery({
        queryKey: ['admin-live-orders', selectedDate],
        queryFn: async () => {
            const res = await fetch(`/api/orders/admin/all?date=${selectedDate}`, {
                
            });
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        },
        enabled:  user?.role === 'super_admin',
        refetchInterval: 10000 // Auto refresh every 10 seconds
    });

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

    const getStatusText = (status) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

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

    // Calculate stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => ['accepted', 'preparing', 'out_for_delivery'].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-10">
            {/* Header */}
            <div className="bg-white px-4 pt-6 pb-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shrink-0"
                    >
                        <IconBack />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[18px] font-black text-slate-900 tracking-tight leading-none mb-1">Live Monitor</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-updating
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-5 max-w-5xl mx-auto w-full space-y-5">
                
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
                        <span className="text-xl font-black text-slate-800">{totalOrders}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total</span>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-2xl shadow-sm border border-yellow-100 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-black text-yellow-700">{pendingOrders}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-yellow-600/70 uppercase tracking-wider mt-1">Pending</span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-black text-blue-700">{processingOrders}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-blue-600/70 uppercase tracking-wider mt-1">Active</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-black text-emerald-700">{completedOrders}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mt-1">Done</span>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-400 font-semibold text-sm">Loading orders...</div>
                    ) : isError ? (
                        <div className="text-center py-10 text-rose-500 font-semibold text-sm">Failed to load orders.</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                            <span className="text-4xl mb-2 block">📭</span>
                            <span className="text-slate-500 font-bold text-sm">No orders found for this date.</span>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                {/* Side Status Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(order.status).split(' ')[0]}`}></div>
                                
                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <div>
                                        <div className="text-xs font-black text-slate-400 mb-0.5">ORDER #{order._id.slice(-6).toUpperCase()}</div>
                                        <div className="font-bold text-slate-800 text-[15px]">{order.shopId?.name || 'Unknown Shop'}</div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </div>
                                </div>

                                <div className="pl-2 flex justify-between items-end">
                                    <div className="flex flex-col gap-1 text-[13px]">
                                        <div className="flex items-center gap-2 text-slate-600 font-semibold">
                                            <span>🧑‍🦱</span> {order.customerId?.name || 'Unknown'} • {order.customerId?.phone || 'No Phone'}
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
        </div>
    );
};

export default AdminLiveOrders;
