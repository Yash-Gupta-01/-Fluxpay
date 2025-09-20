import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Bell, BellRing } from 'lucide-react';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/v1/notification', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            const data = await response.json();
            setNotifications(data.notifications);
        } catch (err) {
            setError(err.message || 'Error fetching notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/v1/notification/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            setError(err.message || 'Error marking notification as read');
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card>
                    <CardContent className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading notifications...</span>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="text-center p-6">
                        <div className="text-destructive mb-4">
                            {error}
                        </div>
                        <Button asChild>
                            <Link to="/dashboard">Return to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" asChild>
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                    <div></div> {/* Spacer */}
                </div>

                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No notifications</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {notifications.map(notification => (
                            <Card key={notification.id} className={notification.read ? 'opacity-75' : ''}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                            <div className={`p-2 rounded-full ${
                                                notification.read ? 'bg-muted' : 'bg-primary/10'
                                            }`}>
                                                {notification.read ? (
                                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <BellRing className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-foreground">{notification.message}</p>
                                                {!notification.read && (
                                                    <Badge variant="secondary" className="mt-2">New</Badge>
                                                )}
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                Mark as read
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
