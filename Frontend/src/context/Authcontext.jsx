import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check token on mount and set authentication state
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);

        // Listen for storage changes
        const handleStorageChange = () => {
            const token = localStorage.getItem('token');
            setIsAuthenticated(!!token);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            const token = localStorage.getItem('token');
            const eventSource = new EventSource(`http://localhost:3000/api/v1/notifications/stream?token=${token}`);

            eventSource.addEventListener('notification', (event) => {
                const notification = JSON.parse(event.data);
                if (notification.type === 'debit') {
                    toast.error(notification.message, { position: "top-right" });
                } else if (notification.type === 'credit') {
                    toast.success(notification.message, { position: "top-right" });
                }
            });

            eventSource.onerror = () => {
                eventSource.close();
            };

            return () => {
                eventSource.close();
            };
        }
    }, [isAuthenticated]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
