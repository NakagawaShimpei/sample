import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) {
      navigate('/rooms');
    } else {
      setError('ユーザー名またはパスワードが違います');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>WE サンプルアプリ</h1>
        <h2>ログイン</h2>
        <form onSubmit={handleSubmit}>
          <table className="login-table">
            <tbody>
              <tr>
                <td><label htmlFor="username">ユーザー名:</label></td>
                <td>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td><label htmlFor="password">パスワード:</label></td>
                <td>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          {error && <p className="error-msg">{error}</p>}
          <div className="login-submit">
            <input type="submit" value="ログイン" />
          </div>
        </form>
        <hr />
        <div className="login-hint">
          <p>テスト用アカウント:</p>
          <ul>
            <li>利用者: user / user123</li>
            <li>管理者: admin / admin123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
