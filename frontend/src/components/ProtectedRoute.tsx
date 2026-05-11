import React, { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

interface Props {
  children: React.ReactNode;
  requireRole?: Role;
}

const ProtectedRoute: FC<Props> = ({ children, requireRole }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div className="banner banner-loading">読み込み中...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && currentUser.role !== requireRole) {
    return (
      <div className="error-page">
        <h2>アクセス権限がありません</h2>
        <p>
          この機能は{requireRole === 'admin' ? '管理者' : '利用者'}
          のみ利用できます。
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
