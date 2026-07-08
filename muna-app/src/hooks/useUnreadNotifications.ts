import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';

export const useUnreadNotifications = () => {
    const { token, user } = useAuth();

    return useQuery({
        queryKey: ['unreadCount'],
        queryFn: async () => {
            if (!token) return 0;
            const res = await api.get('/api/notifications/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data.count || 0;
        },
        enabled: !!user && !!token,
        refetchInterval: 30000, // Fetch every 30s
    });
};
