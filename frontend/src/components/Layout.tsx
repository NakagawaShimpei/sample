import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const { loading, error } = useData();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>WE サンプルアプリ</h1>
        <div className="user-info">
          ログイン中: {currentUser?.displayName} (
          {currentUser?.role === 'admin' ? '管理者' : '利用者'})
          <button type="button" onClick={logout} style={{ marginLeft: '1rem' }}>
            ログアウト
          </button>
        </div>
      </header>
      <nav className="app-nav">
        <span className="nav-section">会議室:</span>
        <Link to="/rooms">会議室一覧</Link>
        <Link to="/reservations">予約一覧</Link>
        {isAdmin && <Link to="/rooms/register">会議室登録</Link>}
        <span className="nav-section">デバイス:</span>
        <Link to="/devices">デバイス一覧</Link>
        {isAdmin && <Link to="/loans">貸出状況</Link>}
        {isAdmin && <Link to="/devices/register">デバイス登録</Link>}
        {isAdmin && (
          <>
            <span className="nav-section">ユーザー:</span>
            <Link to="/users">ユーザー一覧</Link>
            <Link to="/users/register">ユーザー登録</Link>
          </>
        )}
        <span className="nav-section">設定:</span>
        <Link to="/mfa/setup">二段階認証</Link>
      </nav>
      {error && <div className="banner banner-error">エラー: {error}</div>}
      {loading && <div className="banner banner-loading">読み込み中...</div>}
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <small>WE Sample App (研修用)</small>
      </footer>
    </div>
  );
}
