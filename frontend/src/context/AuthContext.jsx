import { createContext, useState, useContext, useEffect } from 'react';

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

    // Login hone par Token aur User data save karne ka function
    const login = async (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);

        // 🔥 NEW: Sync OneSignal ID immediately the moment they log in!
        if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.PushSubscription && window.OneSignal.User.PushSubscription.id) {
            try {
                await fetch('/api/auth/save-player-id', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ playerId: window.OneSignal.User.PushSubscription.id })
                });
                console.log("[MUNA Auth] Push ID Synced instantly after login!");
            } catch (err) {
                console.error("Failed to sync push ID", err);
            }
        }
    };

    // Logout hone par sab delete karne ka function
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
