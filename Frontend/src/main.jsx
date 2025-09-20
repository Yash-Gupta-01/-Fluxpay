import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Layout from './Layout.jsx'
import Notifications from './components/Notifications.jsx'
import LandingPage from './components/LandingPage.jsx'
import AboutUs from './components/AboutUs.jsx'
import FAQ from './components/FAQ.jsx'
import Login from './components/Login.jsx'
import FirstUser from './components/FirstUser.jsx'
import Dashboard from './components/Dashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/Authcontext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import TransferPage from './components/TransferPage.jsx';
import TransactionHistory from './components/TransactionHistory';

const router = createBrowserRouter([
  {
    path: '/',
    element:<Layout/>,
    children:[
      {
        path: "",
        element: <LandingPage/>
      },
      {
        path: "about", 
        element: <AboutUs/>
      },
      {
        path: "faq",
        element: <FAQ/>
      },
      {
        path: "Login",
        element: <Login/>
      },
      {
        path: "FirstUser",
        element: <FirstUser/>
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: "transfer",
        element: (
          <ProtectedRoute>
            <TransferPage />
          </ProtectedRoute>
        )
      },
      {
        path: "history",
        element: (
          <ProtectedRoute>
            <TransactionHistory />
          </ProtectedRoute>
        )
      },
      {
        path:"notifications",
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        )
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
