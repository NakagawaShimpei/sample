import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

interface Props {
  children: React.ReactNode;
  requireRole?: Role;
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && currentUser.role !== requireRole) {
    return (
      <div className="error-page">
        <h2>アクセス権限がありません</h2>
        <p>この機能は{requireRole === 'admin' ? '管理者' : '利用者'}のみ利用できます。</p>
      </div>
    );
  }

  return <>{children}</>;
}
