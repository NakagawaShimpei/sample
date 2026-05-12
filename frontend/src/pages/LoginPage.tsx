import React, { FC, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: FC = () => {
  const { login, mfaVerify, currentUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [step, setStep] = useState<'password' | 'totp'>('password');
  const [error, setError] = useState('');

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
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Card className="w-80">
          <CardHeader>
            <CardTitle className="text-center text-base">WE サンプルアプリ</CardTitle>
            <p className="text-sm text-center text-muted-foreground">二段階認証</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              認証アプリに表示されている 6 桁のコードを入力してください。
            </p>
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="totpCode">認証コード</Label>
                <Input
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  autoComplete="one-time-code"
                  className="text-center tracking-widest text-lg"
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full">確認</Button>
            </form>
            <div className="text-center mt-3">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => { setStep('password'); setError(''); setTotpCode(''); }}
              >
                ← パスワード入力に戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-center text-base">WE サンプルアプリ</CardTitle>
          <p className="text-sm text-center text-muted-foreground">ログイン</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full">ログイン</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
