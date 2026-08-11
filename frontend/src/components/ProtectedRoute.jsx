import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Si todavía está cargando el usuario del localStorage, muestra un spinner o pantalla en blanco breve
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando sesión...</div>;
  }

  // Si ya terminó de cargar y no hay usuario, mandarlo al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no está permitido, redirigir
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};