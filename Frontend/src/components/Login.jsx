import React, { useState } from 'react';
import LoginImag from '../assets/LoginPage.svg';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/v1/user/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userName: username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid username or password');
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userBalance', data.balance);

            // Set auth state after successful login
            setIsAuthenticated(true);

            // Navigate after successful login
            navigate('/dashboard');
        } catch (error) {
            setError(error.message || 'Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <Card className="hidden lg:block overflow-hidden">
                        <CardContent className="p-0">
                            <img
                                src={LoginImag}
                                alt="Login Illustration"
                                className="w-full h-full object-cover"
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Welcome Back</CardTitle>
                            <CardDescription>
                                Sign in to your FluxPay account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-sm font-medium">
                                        Username
                                    </label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                            <div className="mt-4 text-center text-sm">
                                Don't have an account?{' '}
                                <Link to="/FirstUser" className="text-primary hover:underline">
                                    Sign up
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Login;
