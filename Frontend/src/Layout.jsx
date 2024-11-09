import React from "react";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { Outlet } from "react-router-dom";
function Layout(){
    return (
        <>
        <NavBar />
        <Outlet />
        <Footer />
        
        </>
    );
}

export default Layout;