import React, { useState, useEffect } from 'react';
import { MapPinIcon, BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PermissionPrompter = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [step, setStep] = useState(0); // 0: init, 1: asking, 2: done

  useEffect(() => {
    // Check if we already prompted the user
    const hasPrompted = localStorage.getItem('hasPromptedPermissions');
    if (!hasPrompted) {
      // Show prompt after a tiny delay so it doesn't fight with splash screen
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllowAccess = async () => {
    setStep(1);

    // 1. Request Notification Permission First
    try {
      const { requestFirebaseNotificationPermission } = await import('../firebase');
      const token = await requestFirebaseNotificationPermission();
      
      if (token) {
        console.log('[PermissionPrompter] FCM token acquired');
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const API = import.meta.env.VITE_API_URL || '';
            await fetch(`${API}/api/auth/fcm-token`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fcmToken: token }),
            });
          } catch (err) {
            console.warn('[PermissionPrompter] Backend token save failed', err);
          }
        }
      }
    } catch (err) {
      console.warn('[PermissionPrompter] Notification error', err);
    }

    // 2. Request Location Permission Second
    try {
      if ('geolocation' in navigator) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log('[PermissionPrompter] Location granted');
              resolve();
            },
            (err) => {
              console.warn('[PermissionPrompter] Location denied or error', err.message);
              resolve();
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }
    } catch (err) {
      console.warn('[PermissionPrompter] Location error', err);
    }

    // Done
    setStep(2);
    localStorage.setItem('hasPromptedPermissions', 'true');
    setTimeout(() => {
      setShowPrompt(false);
    }, 500);
  };

  const handleDismiss = () => {
    // If they dismiss, we won't ask again automatically, they can enable later in settings
    localStorage.setItem('hasPromptedPermissions', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500">
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full p-2 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="flex -space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center border-4 border-white shadow-sm relative z-10">
              <MapPinIcon className="w-8 h-8 text-amber-600" />
            </div>
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-sm">
              <BellAlertIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">
            Better Experience
          </h2>
          <p className="text-gray-500 text-sm mb-8 px-2 leading-relaxed">
            To provide you with lightning-fast local deliveries and real-time order updates, MUNA needs your location and notification access.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={handleAllowAccess}
              disabled={step !== 0}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all shadow-lg ${
                step === 0 
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 active:scale-[0.98]' 
                  : 'bg-green-500 shadow-green-500/30 cursor-not-allowed'
              }`}
            >
              {step === 0 ? 'Allow Access' : step === 1 ? 'Setting up...' : 'All Set! 🎉'}
            </button>
            
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-6 rounded-2xl font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionPrompter;
