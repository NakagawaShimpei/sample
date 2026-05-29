import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { DialogProvider } from './contexts/DialogContext';
import DashboardPage from './pages/DashboardPage';
import DeviceListPage from './pages/DeviceListPage';
import DeviceRegisterPage from './pages/DeviceRegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import MfaSetupPage from './pages/MfaSetupPage';
import ReservationListPage from './pages/ReservationListPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RoomListPage from './pages/RoomListPage';
import RoomRegisterPage from './pages/RoomRegisterPage';
import UserListPage from './pages/UserListPage';
import UserRegisterPage from './pages/UserRegisterPage';

function App() {
  return (
    <AuthProvider>
      <DialogProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/rooms" replace />} />
              <Route path="/rooms" element={<RoomListPage />} />
              <Route path="/reservations" element={<ReservationListPage />} />
              <Route
                path="/rooms/register"
                element={
                  <ProtectedRoute requireRole="admin">
                    <RoomRegisterPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/devices" element={<DeviceListPage />} />
              <Route
                path="/devices/register"
                element={
                  <ProtectedRoute requireRole="admin">
                    <DeviceRegisterPage />
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
              <Route path="/setup" element={<MfaSetupPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireRole="admin">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
      </DialogProvider>
    </AuthProvider>
  );
}

export default App;
