import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import DeviceListPage from './pages/DeviceListPage';
import DeviceRegisterPage from './pages/DeviceRegisterPage';
import LoanListPage from './pages/LoanListPage';
import LoginPage from './pages/LoginPage';
import MfaSetupPage from './pages/MfaSetupPage';
import ReservationListPage from './pages/ReservationListPage';
import RoomListPage from './pages/RoomListPage';
import RoomRegisterPage from './pages/RoomRegisterPage';
import RoomReservePage from './pages/RoomReservePage';
import UserListPage from './pages/UserListPage';
import UserRegisterPage from './pages/UserRegisterPage';

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
              <Route
                path="/rooms/:roomId/reserve"
                element={<RoomReservePage />}
              />
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
              <Route path="/mfa/setup" element={<MfaSetupPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
