import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IcoBellAlert = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;

const Notifications = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchNotifications();
    }, [user, navigate]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setNotifications(data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id, isRead, actionUrl) => {
        if (!isRead) {
            try {
                await fetch(`/api/notifications/${id}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
            } catch (err) { console.error("Failed to mark as read:", err); }
        }
        if (actionUrl) navigate(actionUrl);
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (err) { console.error("Failed to delete notification:", err); }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 overflow-hidden font-sans">
            {/* ── HEADER ── */}
            <div className="flex-shrink-0 bg-white px-4 pt-4 pb-3 shadow-sm z-10 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
                    <IcoBack />
                </button>
                <span className="text-base font-extrabold text-gray-900 tracking-tight">Notifications</span>
                <div className="w-10" />
            </div>

            {/* ── BODY ── */}
            <div className="flex-1 overflow-y-auto p-4 animate-in fade-in duration-300">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[24px] border border-gray-100 shadow-sm mt-4">
                        <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-5">
                            <IcoBellAlert />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-900 mb-2">No updates yet</h3>
                        <p className="text-[13px] font-medium text-gray-500 max-w-[220px] mx-auto">When you get updates about your orders or offers, they'll show up here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif, idx) => (
                            <div
                                key={notif._id}
                                onClick={() => markAsRead(notif._id, notif.isRead, notif.actionUrl)}
                                style={{ animationDelay: `${idx * 50}ms` }}
                                className={`group relative p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] cursor-pointer animate-in slide-in-from-bottom-2 fade-in overflow-hidden
                                ${notif.isRead ? 'bg-white border-gray-100 shadow-sm' : 'bg-amber-50/40 border-amber-200 shadow-[0_4px_14px_rgba(251,191,36,0.1)]'}`}
                            >
                                {!notif.isRead && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>}

                                <div className="flex justify-between items-start gap-3 pl-1">
                                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5
                                        ${notif.isRead ? 'bg-gray-50 text-gray-400' : 'bg-white text-amber-500 shadow-sm border border-amber-100'}">
                                        <IcoBellAlert />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-[14px] leading-tight mb-1 tracking-tight ${notif.isRead ? 'font-bold text-gray-800' : 'font-extrabold text-gray-900'}`}>
                                            {notif.title}
                                        </h4>
                                        <p className={`text-[13px] leading-snug ${notif.isRead ? 'text-gray-500 font-medium' : 'text-gray-700 font-semibold'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
                                            {new Date(notif.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteNotification(notif._id, e)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 active:bg-red-50 active:text-red-500 transition-colors flex-shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;