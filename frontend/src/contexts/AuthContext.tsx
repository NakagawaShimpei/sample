import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { User } from '../types';

// 無操作タイムアウト: 30分（サーバー側 INACTIVITY_TIMEOUT_MS と合わせること）
const INACTIVITY_MS = 30 * 60 * 1000;

export interface LoginResult {
  ok: boolean;
  mfaRequired?: boolean;
  mfaToken?: string;
}

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  mfaVerify: (mfaToken: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setCurrentUser(null);
  }, []);

  // 無操作タイマーのリセット
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_MS);
  }, [logout]);

  // ログイン中のみ無操作検知イベントを登録
  useEffect(() => {
    if (!currentUser) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true }),
    );
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentUser, resetTimer]);

  // 初回マウント時にサーバーでセッション復元
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((user: User | null) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return { ok: false };
      const data = await res.json();
      if (data.mfaRequired) {
        return { ok: true, mfaRequired: true, mfaToken: data.mfaToken };
      }
      setCurrentUser(data as User);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  };

  const mfaVerify = async (
    mfaToken: string,
    code: string,
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code }),
      });
      if (!res.ok) return false;
      const user: User = await res.json();
      setCurrentUser(user);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, login, mfaVerify, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
