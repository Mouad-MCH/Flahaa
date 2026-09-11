import React from 'react'
import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    if(!isAuthenticated) {
        return <Navigate to={'/login'} replace />;
    }

    return children
}

export default ProtectedRoute
