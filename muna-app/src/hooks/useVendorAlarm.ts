import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Audio } from 'expo-av';
import { useVendorOrders } from './useVendorOrders';

export function useVendorAlarm() {
  const { user } = useAuth();
  const soundRef = useRef<Audio.Sound | null>(null);
  
  const { data: orders = [] } = useVendorOrders();

  useEffect(() => {
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
