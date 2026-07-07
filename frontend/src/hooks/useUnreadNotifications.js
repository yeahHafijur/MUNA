import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export const useUnreadNotifications = () => {
    const { token, user } = useAuth();

    return useQuery({
        queryKey: ['unreadCount'],
        queryFn: async () => {
            const res = await fetch('/api/notifications/unread-count', { credentials: 'include', 
                
            });
            if (!res.ok) throw new Error('Failed to fetch unread count');
            const data = await res.json();
            return data.count || 0;
        },
        enabled:  !!user,
        refetchInterval: 30000, // Fallback background fetch
    });
};
