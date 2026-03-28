import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import StationsPage from './pages/StationsPage.jsx';
import StationDetailsPage from './pages/StationDetailsPage.jsx';
import MapPage from './pages/MapPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import OAuthCallbackPage from './pages/OAuthCallbackPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SubmitPricePage from './pages/SubmitPricePage.jsx';
import SubmitStationPage from './pages/SubmitStationPage.jsx';

import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminStationsPage from './pages/admin/AdminStationsPage.jsx';
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';

import { useAuth } from './hooks/useAuth.js';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* OAuth callback — no layout wrapper, full-screen spinner */}
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          {/* Public routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/stations" element={<StationsPage />} />
            <Route path="/stations/:id" element={<StationDetailsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Authenticated user routes */}
          <Route element={<MainLayout />}>
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />
                <Route path="/submit-price" element={
                  <ProtectedRoute><SubmitPricePage /></ProtectedRoute>
                } />
                <Route path="/submit-price/:stationId" element={
                  <ProtectedRoute><SubmitPricePage /></ProtectedRoute>
                } />
                <Route path="/submit-station" element={
                  <ProtectedRoute><SubmitStationPage /></ProtectedRoute>
                } />
          </Route>

          {/* Admin routes */}
          <Route element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/stations" element={<AdminStationsPage />} />
            <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
