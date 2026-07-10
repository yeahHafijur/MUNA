import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';
import type { Order } from '@/types';

export const useVendorOrders = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['vendor-orders'],
        queryFn: async (): Promise<Order[]> => {
            if (user?.role !== 'vendor') return [];
            const res = await api.get('/api/orders/vendor?limit=100');
            const all = res.data.orders || res.data || [];
            return Array.isArray(all) ? all : [];
        },
        enabled: user?.role === 'vendor',
        refetchInterval: 15000, // Fetch every 15s
    });
};
