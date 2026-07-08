import { createContext, useState, useContext, useEffect } from 'react';
import { requestFirebaseNotificationPermission } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getInitialUser = () => {
    try {
        const stored = localStorage.getItem('user');
        return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getInitialUser);
    const [token, setToken] = useState(null); // Keep token state for backward compatibility briefly if needed, but not in localStorage

    // Auto-sync FCM token on app load for already logged in users
    useEffect(() => {
        const syncFCMToken = async () => {
            if (user && token && 'Notification' in window) {
                // Only auto-sync if permission is already granted. Do not prompt on every reload!
                if (Notification.permission === 'granted') {
                    try {
                        const fcmToken = await requestFirebaseNotificationPermission();
                    if (fcmToken) {
                        await fetch('/api/auth/fcm-token', { credentials: 'include', 
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ fcmToken })
                        });
                        console.log("[MUNA Auth] FCM Token auto-synced on startup");
                    }
                } catch (err) {
                    console.error("[MUNA Auth] Auto-sync FCM failed", err);
                }
            }
        }
    };
        syncFCMToken();
    }, [user, token]);

    // Login hone par User data save karne ka function
    const login = async (userData, userToken) => {
        setUser(userData);
        if (userToken) setToken(userToken); // Some APIs might still return it, but we rely on cookie
        localStorage.setItem('user', JSON.stringify(userData));
        // Token is now set via HttpOnly cookie by the backend!

        // Firebase Cloud Messaging logic
        try {
            const fcmToken = await requestFirebaseNotificationPermission();
            if (fcmToken) {
                // Send FCM token to backend
                await fetch('/api/auth/fcm-token', { credentials: 'include', 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ fcmToken })
                });
                console.log("[MUNA Auth] FCM Token saved to backend");
            }
        } catch (err) {
            console.error("[MUNA Auth] Failed to initialize FCM", err);
        }
    };

    // Logout hone par sab delete karne ka function
    const logout = async () => {
        try {
            // Get current FCM token to send to backend for cleanup
            let fcmToken = null;
            try {
                if ('Notification' in window && Notification.permission === 'granted') {
                    fcmToken = await requestFirebaseNotificationPermission();
                }
            } catch (err) {
                console.warn("[MUNA Auth] Could not get FCM token for cleanup", err);
            }

            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fcmToken })
            });
        } catch (err) {
            console.error("Logout failed on backend", err);
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
