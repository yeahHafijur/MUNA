import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/api';
import type { Order } from '@/types';
import { AppState, AppStateStatus } from 'react-native';
import { useState, useEffect } from 'react';

export const useVendorOrders = () => {
    const { user } = useAuth();
    const [appState, setAppState] = useState(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            setAppState(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return useQuery({
        queryKey: ['vendor-orders'],
        queryFn: async (): Promise<Order[]> => {
            if (user?.role !== 'vendor') return [];
            const res = await api.get('/api/orders/vendor?limit=100');
            const all = res.data.orders || res.data || [];
            return Array.isArray(all) ? all : [];
        },
        enabled: user?.role === 'vendor',
        // Pause refetch when app is in background to save battery and network
        refetchInterval: appState === 'active' ? 15000 : false,
    });
};
