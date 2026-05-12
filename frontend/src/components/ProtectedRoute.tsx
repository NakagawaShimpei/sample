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
    return (
      <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-200">
        読み込み中...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && currentUser.role !== requireRole) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-base font-semibold text-destructive mb-2">アクセス権限がありません</h2>
        <p className="text-sm text-muted-foreground">
          この機能は{requireRole === 'admin' ? '管理者' : '利用者'}のみ利用できます。
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
