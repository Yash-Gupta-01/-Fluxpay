import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/theme-toggle';
import { Menu, X } from 'lucide-react';

const NavBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated, setIsAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Check token on component mount and set both states
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, [setIsAuthenticated]);

    const handleLogout = () => {
        localStorage.clear();
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link to="/" className="text-xl font-bold text-primary">
                            FluxPay
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-6">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `text-sm font-medium transition-colors hover:text-primary ${
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                }`
                            }
                        >
                            Home
                        </NavLink>
                        <NavLink
                            to="/about"
                            className={({ isActive }) =>
                                `text-sm font-medium transition-colors hover:text-primary ${
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                }`
                            }
                        >
                            About Us
                        </NavLink>
                        <NavLink
                            to="/faq"
                            className={({ isActive }) =>
                                `text-sm font-medium transition-colors hover:text-primary ${
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                }`
                            }
                        >
                            FAQ
                        </NavLink>
                    </div>
                    <div className="flex items-center space-x-4">
                        <ThemeToggle />
                        {isAuthenticated ? (
                            <div className="hidden md:flex items-center space-x-2">
                                <Button asChild variant="outline">
                                    <NavLink to="/dashboard">Dashboard</NavLink>
                                </Button>
                                <Button variant="outline" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2">
                                <Button asChild variant="outline">
                                    <NavLink to="/login">Login</NavLink>
                                </Button>
                                <Button asChild>
                                    <NavLink to="/FirstUser">Sign Up</NavLink>
                                </Button>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
                {isOpen && (
                    <div className="md:hidden border-t py-4">
                        <div className="flex flex-col space-y-2">
                            <NavLink
                                to="/"
                                className="text-sm font-medium text-muted-foreground hover:text-primary px-2 py-1"
                                onClick={() => setIsOpen(false)}
                            >
                                Home
                            </NavLink>
                            <NavLink
                                to="/about"
                                className="text-sm font-medium text-muted-foreground hover:text-primary px-2 py-1"
                                onClick={() => setIsOpen(false)}
                            >
                                About Us
                            </NavLink>
                            <NavLink
                                to="/faq"
                                className="text-sm font-medium text-muted-foreground hover:text-primary px-2 py-1"
                                onClick={() => setIsOpen(false)}
                            >
                                FAQ
                            </NavLink>
                            {isAuthenticated ? (
                                <>
                                    <Button asChild variant="outline" className="justify-start">
                                        <NavLink to="/dashboard" onClick={() => setIsOpen(false)}>
                                            Dashboard
                                        </NavLink>
                                    </Button>
                                    <Button variant="outline" onClick={handleLogout} className="justify-start">
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button asChild variant="outline" className="justify-start">
                                        <NavLink to="/login" onClick={() => setIsOpen(false)}>
                                            Login
                                        </NavLink>
                                    </Button>
                                    <Button asChild className="justify-start">
                                        <NavLink to="/FirstUser" onClick={() => setIsOpen(false)}>
                                            Sign Up
                                        </NavLink>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;
