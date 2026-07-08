import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';

export const useUnreadChats = () => {
    const { token, user } = useAuth();

    return useQuery({
        queryKey: ['unreadChatCount'],
        queryFn: async () => {
            if (!token) return 0;
            const res = await api.get('/api/chat/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data.count || 0;
        },
        enabled: !!user && !!token,
        refetchInterval: 30000,
    });
};
