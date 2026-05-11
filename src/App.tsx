import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RoomListPage from './pages/RoomListPage';
import RoomReservePage from './pages/RoomReservePage';
import ReservationListPage from './pages/ReservationListPage';
import RoomRegisterPage from './pages/RoomRegisterPage';
import DeviceListPage from './pages/DeviceListPage';
import LoanListPage from './pages/LoanListPage';
import DeviceRegisterPage from './pages/DeviceRegisterPage';
import UserListPage from './pages/UserListPage';
import UserRegisterPage from './pages/UserRegisterPage';
import RoomEditPage from './pages/RoomEditPage';
import DeviceEditPage from './pages/DeviceEditPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/rooms" replace />} />
              <Route path="/rooms" element={<RoomListPage />} />
              <Route path="/rooms/:roomId/reserve" element={<RoomReservePage />} />
              <Route path="/reservations" element={<ReservationListPage />} />
              <Route
                path="/rooms/register"
                element={
                  <ProtectedRoute requireRole="admin">
                    <RoomRegisterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms/:id/edit"
                element={
                  <ProtectedRoute requireRole="admin">
                    <RoomEditPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/devices" element={<DeviceListPage />} />
              <Route
                path="/loans"
                element={
                  <ProtectedRoute requireRole="admin">
                    <LoanListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/devices/register"
                element={
                  <ProtectedRoute requireRole="admin">
                    <DeviceRegisterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/devices/:id/edit"
                element={
                  <ProtectedRoute requireRole="admin">
                    <DeviceEditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requireRole="admin">
                    <UserListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/register"
                element={
                  <ProtectedRoute requireRole="admin">
                    <UserRegisterPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
