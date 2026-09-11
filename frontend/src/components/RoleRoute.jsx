import React from 'react'
import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom';

const RoleRoute = ({children , roles=[]}) => {
    const user = useAuthStore(state => state.user);

    if(roles.length > 0 && !roles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />
    }

  return children
}

export default RoleRoute
