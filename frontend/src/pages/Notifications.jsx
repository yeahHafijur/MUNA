import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const IcoBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const IcoTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

const Notifications = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchNotifications();
    }, [user, navigate]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications', { credentials: 'include',   });
            const data = await res.json();
            
            // Render them exactly as fetched (so unread items show visually as unread)
            setNotifications(data);

            // Automatically mark all as read in the backend if there are unread items
            const hasUnread = data.some(n => !n.isRead);
            if (hasUnread) {
                await fetch('/api/notifications/read-all', { credentials: 'include', 
                    method: 'PUT'
                });
                // Invalidate the unread count so the global badge clears immediately
                queryClient.invalidateQueries(['unread-count']);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleNotifClick = (actionUrl) => {
        if (actionUrl) navigate(actionUrl);
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (err) { console.error("Failed to delete notification:", err); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 font-sans antialiased overflow-hidden">
            
            {/* ════════ PREMIUM HEADER ════════ */}
            <div className="shrink-0 bg-amber-400 pt-10 px-4 pb-4 shadow-md relative overflow-hidden rounded-b-[20px] z-20">
                <div className="absolute right-[-10px] top-2 text-[90px] opacity-[0.15] rotate-12 pointer-events-none drop-shadow-sm">
                    🔔
                </div>
                <div className="flex items-center gap-3 relative z-10 max-w-2xl mx-auto">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="w-10 h-10 bg-white/30 hover:bg-white/50 border border-white/40 text-slate-900 rounded-full flex items-center justify-center active:scale-95 transition-all backdrop-blur-sm"
                    >
                        <IcoBack />
                    </button>
                    <div>
                        <h1 className="text-[20px] font-black text-amber-950 tracking-tight leading-tight">Notifications</h1>
                        <p className="text-[11px] font-bold text-amber-900/80 uppercase tracking-widest mt-0.5">Stay updated</p>
                    </div>
                </div>
            </div>

            {/* ════════ NOTIFICATION LIST ════════ */}
            <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-[18px] p-4 border border-slate-100 shadow-sm flex gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 py-1">
                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 mt-10">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                            <span className="text-[40px] opacity-60">📭</span>
                        </div>
                        <h3 className="text-[18px] font-black text-slate-900 mb-2 tracking-tight">All caught up!</h3>
                        <p className="text-[13px] font-medium text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                            There are no new notifications for you right now. Check back later!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 pb-20">
                        {notifications.map((notif, idx) => (
                            <div
                                key={notif._id}
                                onClick={() => handleNotifClick(notif.actionUrl)}
                                style={{ animationDelay: `${idx * 40}ms` }}
                                className={`group relative p-4 rounded-[18px] transition-all duration-200 ${notif.actionUrl ? 'cursor-pointer active:scale-[0.98]' : ''} animate-in slide-in-from-bottom-2 fade-in overflow-hidden border
                                ${notif.isRead 
                                    ? 'bg-white border-slate-100 shadow-sm' 
                                    : 'bg-amber-50/50 border-amber-200 shadow-[0_4px_16px_rgba(251,191,36,0.12)]'
                                }`}
                            >
                                {/* Unread indicator bar */}
                                {!notif.isRead && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                                )}

                                <div className="flex justify-between items-start gap-3 pl-1">
                                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center
                                        ${notif.isRead 
                                            ? 'bg-slate-50 text-slate-400 border border-slate-100' 
                                            : 'bg-white text-amber-500 shadow-sm border border-amber-100'
                                        }`}>
                                        <IcoBell />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h4 className={`text-[15px] leading-tight mb-1.5 tracking-tight ${notif.isRead ? 'font-bold text-slate-800' : 'font-black text-slate-900'}`}>
                                            {notif.title}
                                        </h4>
                                        <p className={`text-[13px] leading-snug ${notif.isRead ? 'text-slate-500 font-medium' : 'text-slate-700 font-semibold'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="text-[10px] font-black text-slate-400 mt-2.5 uppercase tracking-wider">
                                            {new Date(notif.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteNotification(notif._id, e)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 active:scale-90 transition-all flex-shrink-0 opacity-80"
                                    >
                                        <IcoTrash />
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