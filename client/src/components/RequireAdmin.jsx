import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequireAdmin({ children }) {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (!token) return <Navigate to="/login" replace />;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  return children;
}

