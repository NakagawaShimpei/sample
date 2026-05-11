import React, { FC, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: FC = () => {
  const { login, mfaVerify, currentUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [mfaToken, setMfaToken] = useState<string>('');
  const [step, setStep] = useState<'password' | 'totp'>('password');
  const [error, setError] = useState<string>('');

  if (isLoading) return null;
  if (currentUser) return <Navigate to="/rooms" replace />;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (!result.ok) {
      setError('ユーザー名またはパスワードが違います');
      return;
    }
    if (result.mfaRequired && result.mfaToken) {
      setMfaToken(result.mfaToken);
      setStep('totp');
      return;
    }
    navigate('/rooms');
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = await mfaVerify(mfaToken, totpCode);
    if (ok) {
      navigate('/rooms');
    } else {
      setError('コードが正しくありません。再度お試しください。');
      setTotpCode('');
    }
  };

  if (step === 'totp') {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>WE サンプルアプリ</h1>
          <h2>二段階認証</h2>
          <p style={{ marginBottom: '1rem', color: '#555' }}>
            認証アプリに表示されている 6 桁のコードを入力してください。
          </p>
          <form onSubmit={handleTotpSubmit}>
            <table className="login-table">
              <tbody>
                <tr>
                  <td>
                    <label htmlFor="totpCode">認証コード:</label>
                  </td>
                  <td>
                    <input
                      id="totpCode"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) =>
                        setTotpCode(e.target.value.replace(/\D/g, ''))
                      }
                      autoFocus
                      autoComplete="one-time-code"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            {error && <p className="error-msg">{error}</p>}
            <div className="login-submit">
              <input type="submit" value="確認" />
            </div>
          </form>
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#0066cc',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
              onClick={() => {
                setStep('password');
                setError('');
                setTotpCode('');
              }}
            >
              ← パスワード入力に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>WE サンプルアプリ</h1>
        <h2>ログイン</h2>
        <form onSubmit={handlePasswordSubmit}>
          <table className="login-table">
            <tbody>
              <tr>
                <td>
                  <label htmlFor="username">ユーザー名:</label>
                </td>
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
                <td>
                  <label htmlFor="password">パスワード:</label>
                </td>
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
      </div>
    </div>
  );
};

export default LoginPage;
