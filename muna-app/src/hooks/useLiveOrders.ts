import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';

export const useLiveOrders = () => {
    const { token, user } = useAuth();

    return useQuery({
        queryKey: ['liveOrderCount'],
        queryFn: async () => {
            if (!token) return 0;
            const res = await api.get('/api/orders/vendor?status=pending&limit=100', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const orders = res.data.orders || res.data;
            if (!Array.isArray(orders)) return 0;
            return orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status)).length;
        },
        enabled:  user?.role === 'vendor' && !!token,
        refetchInterval: 15000, // Fetch every 15s to keep live orders updated
    });
};
