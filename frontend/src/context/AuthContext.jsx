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

const getInitialToken = () => {
    return localStorage.getItem('token') || null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getInitialUser);
    const [token, setToken] = useState(getInitialToken);

    // Auto-sync FCM token on app load for already logged in users
    useEffect(() => {
        const syncFCMToken = async () => {
            if (user && token && 'Notification' in window) {
                // Only auto-sync if permission is already granted. Do not prompt on every reload!
                if (Notification.permission === 'granted') {
                    try {
                        const fcmToken = await requestFirebaseNotificationPermission();
                    if (fcmToken) {
                        await fetch('/api/auth/fcm-token', {
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

    // Login hone par Token aur User data save karne ka function
    const login = async (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);

        // Firebase Cloud Messaging logic
        try {
            const fcmToken = await requestFirebaseNotificationPermission();
            if (fcmToken) {
                // Send FCM token to backend
                await fetch('/api/auth/fcm-token', {
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
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // FCM token is kept on the device, but the user is logged out locally
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
