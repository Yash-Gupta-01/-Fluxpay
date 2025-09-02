import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import { useTheme } from '../ThemeContext';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box, Switch, FormControlLabel } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const NavBar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { isAuthenticated, setIsAuthenticated } = useAuth();
    const { mode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
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

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
                    FlexiWallet
                </Typography>
                <IconButton color="inherit" onClick={toggleTheme}>
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Button color="inherit" component={NavLink} to="/">Home</Button>
                    <Button color="inherit" component={NavLink} to="/about">About Us</Button>
                    <Button color="inherit" component={NavLink} to="/faq">FAQ</Button>
                    {isAuthenticated ? (
                        <Button color="inherit" onClick={handleLogout}>Logout</Button>
                    ) : (
                        <Button variant="contained" color="secondary" component={NavLink} to="/login">Login</Button>
                    )}
                </Box>
                <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={handleMenu}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose} component={NavLink} to="/">Home</MenuItem>
                        <MenuItem onClick={handleClose} component={NavLink} to="/about">About Us</MenuItem>
                        <MenuItem onClick={handleClose} component={NavLink} to="/faq">FAQ</MenuItem>
                        {isAuthenticated ? (
                            <MenuItem onClick={() => { handleClose(); handleLogout(); }}>Logout</MenuItem>
                        ) : (
                            <MenuItem onClick={handleClose} component={NavLink} to="/login">Login</MenuItem>
                        )}
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default NavBar;
