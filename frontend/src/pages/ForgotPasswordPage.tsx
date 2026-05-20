import React, { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '../api';

const ForgotPasswordPage: FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    setIsLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch {
      setError('送信に失敗しました。しばらくしてから再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-center text-base">WE サンプルアプリ</CardTitle>
          <p className="text-sm text-center text-muted-foreground">パスワード再設定</p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                登録済みのメールアドレスには再設定用のメールをお送りしました。メールをご確認ください。
              </p>
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                ← ログインに戻る
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                登録済みのメールアドレスを入力してください。パスワード再設定用のメールをお送りします。
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '送信中...' : '再設定メールを送信'}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
