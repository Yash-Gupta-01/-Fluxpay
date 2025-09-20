import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import profilePic from '../assets/User.svg';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ArrowUpRight, Bell, CreditCard, History } from 'lucide-react';

const Dashboard = () => {
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        vpa: "",
        balance: 0,
        avatar: profilePic
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Verify token is valid by making an API call
        const verifyToken = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/v1/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Invalid token');
                }
            } catch (error) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        verifyToken();
    }, [navigate]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3000/api/v1/user/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }

                const data = await response.json();
                setProfile({
                    name: data.name || "User Name",
                    email: data.email || "user@example.com",
                    balance: data.balance || 0,
                    vpa: data.vpa || "",
                    avatar: profilePic
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleUpdate = () => {
        alert('User updated successfully');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {profile.name.split(' ')[0]}!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Your account details and balance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-4 mb-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={profile.avatar} alt={profile.name} />
                                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-semibold">{profile.name}</h3>
                                    <p className="text-muted-foreground">{profile.email}</p>
                                    <p className="text-sm text-muted-foreground">VPA: {profile.vpa}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-lg px-4 py-2">
                                    Balance: ₹{profile.balance.toFixed(2)}
                                </Badge>
                                <Button onClick={handleUpdate} variant="outline">
                                    Update Profile
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button asChild className="w-full justify-start" size="lg">
                                <Link to="/transfer">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Transfer Money
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start" size="lg">
                                <Link to="/notifications">
                                    <Bell className="mr-2 h-4 w-4" />
                                    Notifications
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start" size="lg">
                                <Link to="/history">
                                    <History className="mr-2 h-4 w-4" />
                                    Transaction History
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your latest transactions and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <ArrowUpRight className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>No recent activity to display</p>
                            <p className="text-sm">Your transactions will appear here</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
