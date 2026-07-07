import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export const useLiveOrders = () => {
    const { token, user } = useAuth();

    return useQuery({
        queryKey: ['liveOrderCount'],
        queryFn: async () => {
            const res = await fetch('/api/orders/vendor?status=pending&limit=100', { credentials: 'include', 
                
            });
            if (!res.ok) throw new Error('Failed to fetch live orders');
            const data = await res.json();
            const orders = data.orders || data;
            if (!Array.isArray(orders)) return 0;
            return orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
        },
        enabled:  user?.role === 'vendor',
        refetchInterval: 15000, // Fetch every 15s to keep live orders updated
    });
};
