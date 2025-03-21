import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';

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
        <nav className="bg-blue-800 p-5">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white text-lg font-bold">
                    <Link to="/">FlexiWallet</Link>
                </div>
                <div className="block lg:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}></path>
                        </svg>
                    </button>
                </div>
                <div className={`lg:flex ${isOpen ? 'block' : 'hidden'} space-x-10`}>
                    <NavLink to="/" className="text-white font-semibold underline">Home</NavLink>
                    <NavLink to="/about" className="text-white font-semibold underline">About Us</NavLink>
                    <NavLink to="/faq" className="text-white font-semibold underline">FAQ</NavLink>
                    {isAuthenticated ? (
                        <button onClick={handleLogout} className="text-white font-semibold">Logout</button>
                    ) : (
                        <NavLink to="/login" className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                            Login
                        </NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
