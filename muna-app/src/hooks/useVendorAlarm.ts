import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Audio } from 'expo-av';
import { useVendorOrders } from './useVendorOrders';

export function useVendorAlarm() {
  const { user } = useAuth();
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMounted = useRef(true);
  
  const { data: orders = [] } = useVendorOrders();

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (user?.role === 'vendor') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    }
  }, [user]);

  const playSound = async () => {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/ringtone.wav'),
        { isLooping: true, volume: 1.0 }
      );
      if (!isMounted.current) {
        await sound.unloadAsync();
        return;
      }
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error("Audio play error", error);
    }
  };

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {
      soundRef.current = null;
    }
  };

  useEffect(() => {
    if (user?.role !== 'vendor') return;

    const live = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
    const pending = live.filter((o: any) => o.status === 'pending');
    
    if (pending.length > 0) {
      if (!soundRef.current) playSound();
    } else {
      stopSound();
    }
  }, [orders, user?.role]);
}
