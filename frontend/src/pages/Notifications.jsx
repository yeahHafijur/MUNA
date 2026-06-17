import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

const Notifications = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchNotifications();
    }, [user, navigate]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
            } catch (err) {
                console.error("Failed to mark as read:", err);
            }
        }
        if (actionUrl) {
            navigate(actionUrl);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    };



    return (
        <div className="p-4 max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="animate-pulse bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No notifications yet</h3>
                    <p className="text-sm text-gray-500">When you get updates about your orders, they'll show up here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(notif => (
                        <div 
                            key={notif._id}
                            onClick={() => markAsRead(notif._id, notif.isRead, notif.actionUrl)}
                            className={`p-4 rounded-xl shadow-sm border cursor-pointer transition-all active:scale-[0.98] relative overflow-hidden ${notif.isRead ? 'bg-white border-gray-100' : 'bg-orange-50/50 border-orange-100'}`}
                        >
                            {!notif.isRead && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                            )}
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h4 className={`text-base mb-1 ${notif.isRead ? 'font-semibold text-gray-800' : 'font-bold text-black'}`}>
                                        {notif.title}
                                    </h4>
                                    <p className={`text-sm leading-snug ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                                        {notif.message}
                                    </p>
                                    <div className="text-xs text-gray-400 mt-2 font-medium">
                                        {new Date(notif.createdAt).toLocaleString('en-IN', {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => deleteNotification(notif._id, e)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
