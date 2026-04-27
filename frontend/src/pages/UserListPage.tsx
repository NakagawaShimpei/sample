import React from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export default function UserListPage() {
  const { users, deleteUser } = useData();
  const { currentUser } = useAuth();

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ユーザー「${name}」を削除します。よろしいですか？`)) return;
    try {
      await deleteUser(id);
    } catch (e) {
      alert('削除に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
  };

  return (
    <div>
      <h2>ユーザー一覧（管理者）</h2>
      <p>登録されているユーザー: {users.length} 件</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>ユーザー名</th>
            <th>表示名</th>
            <th>ロール</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.displayName}</td>
              <td>{u.role === 'admin' ? '管理者' : '利用者'}</td>
              <td>
                {u.role === 'user' && u.username !== currentUser?.username ? (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => handleDelete(u.id, u.displayName)}
                  >
                    削除
                  </button>
                ) : (
                  <span className="disabled-text">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
