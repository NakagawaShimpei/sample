import React, { FC, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '../api';
import { useDialog } from '../contexts/DialogContext';

const ResetPasswordPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dialog = useDialog();

  useEffect(() => {
    if (!token) {
      setError('無効なリンクです。パスワード再設定メールのリンクを使用してください。');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    setIsLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      await dialog.alert('パスワードを再設定しました。新しいパスワードでログインしてください。', '完了', 'success');
      navigate('/login');
    } catch {
      setError('再設定に失敗しました。リンクが期限切れの可能性があります。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-center text-base">WE サンプルアプリ</CardTitle>
          <p className="text-sm text-center text-muted-foreground">新しいパスワードの設定</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                disabled={!token}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!token}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || !token}>
              {isLoading ? '設定中...' : 'パスワードを設定する'}
            </Button>
          </form>
          <div className="text-center mt-3">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              ← ログインに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
