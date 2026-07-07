import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export const useUnreadChats = () => {
    const { token, user } = useAuth();

    return useQuery({
        queryKey: ['unreadChatCount'],
        queryFn: async () => {
            const res = await fetch('/api/chat/unread-count', { credentials: 'include', 
                
            });
            if (!res.ok) throw new Error('Failed to fetch chat unread count');
            const data = await res.json();
            return data.count || 0;
        },
        enabled:  !!user,
        refetchInterval: 15000,
    });
};
