import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const UserRegisterPage: FC = () => {
  const { addUser } = useData();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !displayName) {
      alert('すべての項目を入力してください。');
      return;
    }
    try {
      await addUser({ username, password, displayName });
      alert('登録しました。');
      navigate('/users');
    } catch (err) {
      alert('登録に失敗しました: ' + (err instanceof Error ? err.message : ''));
    }
  };

  return (
    <div>
      <h2>ユーザー登録（管理者）</h2>
      <p>新しい利用者アカウントを登録します。ロールは「利用者」になります。</p>
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <th>
                ユーザー名 <span className="req">*</span>
              </th>
              <td>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <th>
                パスワード <span className="req">*</span>
              </th>
              <td>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <th>
                表示名 <span className="req">*</span>
              </th>
              <td>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <p className="form-hint">※ すべての項目が必須です。</p>
        <div className="form-actions">
          <input type="submit" value="登録する" />
        </div>
      </form>
    </div>
  );
};

export default UserRegisterPage;
