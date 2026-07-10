import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import api from '@/api/api';

export function useVendorAlarm() {
  const { user } = useAuth();
  const soundRef = useRef<Audio.Sound | null>(null);
  const prevLiveRef = useRef(0);

  useEffect(() => {
    // Only configure audio if user is a vendor
    if (user?.role === 'vendor') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    }

    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, [user]);

  const playSound = async () => {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/ringtone.wav'),
        { isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.log("Audio play error", error);
    }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  useQuery({
    queryKey: ['global-vendor-alarm'],
    queryFn: async () => {
      if (!user || user.role !== 'vendor') return [];
      const res = await api.get('/api/orders/vendor?limit=100');
      const all = res.data.orders || res.data || [];
      if (!Array.isArray(all)) return [];
      
      const live = all.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
      const pending = live.filter((o: any) => o.status === 'pending');
      
      if (pending.length > 0) {
        if (!soundRef.current) playSound();
      } else {
        stopSound();
      }
      
      prevLiveRef.current = live.length;
      return all;
    },
    refetchInterval: 12000,
    enabled: !!user && user.role === 'vendor',
  });
}
