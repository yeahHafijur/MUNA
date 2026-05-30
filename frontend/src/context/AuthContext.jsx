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
    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
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
