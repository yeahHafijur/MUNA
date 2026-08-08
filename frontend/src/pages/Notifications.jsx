import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/ui/PageHeader';
import { Bell, Package, MessageSquare, Megaphone, Info, CheckCheck } from 'lucide-react';

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
            const res = await fetch('/api/notifications', { credentials: 'include' });
            const data = await res.json();
            
            // Render them exactly as fetched
            setNotifications(data);

            // Automatically mark all as read in the backend if there are unread items
            const hasUnread = data.some(n => !n.isRead);
            if (hasUnread) {
                await fetch('/api/notifications/read-all', { credentials: 'include', method: 'PUT' });
                queryClient.invalidateQueries(['unread-count']);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsReadLocal = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleNotifClick = (notification) => {
        if (!notification.isRead) {
            // Optimistically mark as read in UI
            setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
        }
        
        let targetUrl = notification.actionUrl;
        
        // Smart fallbacks if actionUrl is missing
        if (!targetUrl) {
            if (notification.type === 'order') targetUrl = '/orders';
            else if (notification.type === 'chat') targetUrl = '/chat';
        }
        
        // Normalize deprecated URLs
        if (targetUrl === '/profile/orders') targetUrl = '/orders';

        if (targetUrl) navigate(targetUrl);
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return "just now";
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <Package size={20} color="#0ea5e9" />;
            case 'chat': return <MessageSquare size={20} color="#10b981" />;
            case 'promo': return <Megaphone size={20} color="#f59e0b" />;
            case 'system': return <Info size={20} color="#64748b" />;
            default: return <Bell size={20} color="#8b5cf6" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'order': return 'bg-sky-100';
            case 'chat': return 'bg-emerald-100';
            case 'promo': return 'bg-amber-100';
            case 'system': return 'bg-slate-100';
            default: return 'bg-purple-100';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white font-sans antialiased overflow-hidden">
            <PageHeader 
                title="Notifications" 
                variant="white"
                right={
                    notifications.some(n => !n.isRead) ? (
                        <button 
                            onClick={markAllAsReadLocal}
                            className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 active:scale-95 transition-transform"
                        >
                            <CheckCheck size={14} color="#64748b" />
                            <span className="text-[12px] font-bold text-slate-600">Read All</span>
                        </button>
                    ) : null
                }
            />

            <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-8 mt-20">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Bell size={40} color="#cbd5e1" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">All Caught Up!</h3>
                        <p className="text-center text-slate-500 font-medium text-[14px]">
                            You don't have any new notifications at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="pb-20">
                        {notifications.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={() => handleNotifClick(notif)}
                                className={`flex items-start p-4 border-b border-slate-100 cursor-pointer active:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-amber-50/30' : 'bg-white'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${getBgColor(notif.type)}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1 gap-2">
                                        <h4 className={`text-[15px] ${!notif.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                                            {notif.title}
                                        </h4>
                                        <span className="text-[11px] font-medium text-slate-400 shrink-0 mt-0.5">
                                            {timeAgo(notif.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-[13px] leading-5 ${!notif.isRead ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                                        {notif.message}
                                    </p>
                                </div>
                                {!notif.isRead && (
                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full ml-3 mt-2 shrink-0"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;