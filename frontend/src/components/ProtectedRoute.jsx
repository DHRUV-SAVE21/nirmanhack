import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        // Redirect to auth page if not logged in
        return <Navigate to="/auth" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        // Normalize role to lowercase and trim whitespace to avoid mismatch issues
        const userRole = user.role ? user.role.toLowerCase().trim() : null;
        
        console.log('ProtectedRoute - User Role:', userRole, 'Allowed Roles:', allowedRoles);
        
        // If specific roles are required
        if (allowedRoles.length > 0) {
            // Check if user has one of the allowed roles (normalized)
            const hasRole = allowedRoles.some(role => role.toLowerCase() === userRole);
            
            if (!hasRole) {
                console.log('Access denied - redirecting');
                // Determine redirect path based on user role
                const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/dashboard';
                return <Navigate to={redirectPath} replace />;
            }
        }
        
        console.log('Access granted');
    } catch (e) {
        console.error('ProtectedRoute error:', e);
        return <Navigate to="/auth" replace />;
    }

    return children;
};

export default ProtectedRoute;
