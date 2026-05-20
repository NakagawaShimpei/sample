import React, { FC, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';

type SetupState = 'loading' | 'enabled' | 'disabled' | 'setting_up' | 'verifying' | 'done' | 'error';

const MfaSetupPage: FC = () => {
  const { currentUser, updateEmail } = useAuth();
  const dialog = useDialog();
  const [state, setState] = useState<SetupState>('loading');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [emailMessage, setEmailMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  useEffect(() => {
    setEmail(currentUser?.email ?? '');
  }, [currentUser?.email]);

  useEffect(() => {
    fetch('/api/mfa/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { enabled: boolean }) => setState(data.enabled ? 'enabled' : 'disabled'))
      .catch(() => setState('error'));
  }, []);

  const handleStartSetup = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/mfa/setup', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setCode('');
      setMessage('');
      setState('setting_up');
    } catch {
      setState('error');
      setMessage('QR コードの取得に失敗しました');
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('verifying');
    setMessage('');
    try {
      const res = await fetch('/api/mfa/enable', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage(err.error ?? '検証に失敗しました');
        setState('setting_up');
        return;
      }
      setState('done');
      setMessage('MFA の設定が完了しました。次回ログインから有効になります。');
    } catch {
      setMessage('エラーが発生しました');
      setState('setting_up');
    }
  };

  const handleDisable = async () => {
    const ok = await dialog.confirm('MFA を無効にしますか？', { title: 'MFA無効化の確認', confirmLabel: '無効にする', variant: 'destructive' });
    if (!ok) return;
    try {
      const res = await fetch('/api/mfa/disable', { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      setState('disabled');
      setMessage('');
    } catch {
      setMessage('無効化に失敗しました');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword !== confirmPassword) {
      setPwMessage({ text: '新しいパスワードが一致しません', ok: false });
      return;
    }
    setPwSubmitting(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMessage({ text: data.error ?? '変更に失敗しました', ok: false });
      } else {
        setPwMessage({ text: 'パスワードを変更しました', ok: true });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPwMessage({ text: 'エラーが発生しました', ok: false });
    } finally {
      setPwSubmitting(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-4">
        二段階認証（MFA）の設定
      </h2>

      {state === 'loading' && (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      )}

      {state === 'disabled' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            MFA は現在無効です。Google Authenticator などの認証アプリを使って設定できます。
          </p>
          <Button onClick={handleStartSetup}>MFA を設定する</Button>
        </div>
      )}

      {state === 'enabled' && (
        <div className="space-y-4">
          <p className="text-sm text-green-600 font-medium">MFA は有効です。</p>
          <p className="text-sm text-muted-foreground">
            無効にする場合は以下のボタンを押してください。
          </p>
          <Button variant="destructive" onClick={handleDisable}>
            MFA を無効にする
          </Button>
          {message && <p className="text-sm text-destructive">{message}</p>}
        </div>
      )}

      {(state === 'setting_up' || state === 'verifying') && (
        <div className="space-y-4">
          <p className="text-sm">① 認証アプリで以下の QR コードをスキャンしてください。</p>
          <div className="flex justify-center">
            <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
          </div>
          <p className="text-xs text-muted-foreground">
            QR コードが読み取れない場合は、以下のキーを手動で入力してください:
            <br />
            <code className="break-all">{secret}</code>
          </p>
          <p className="text-sm">
            ② 認証アプリに表示された 6 桁のコードを入力して確認してください。
          </p>
          <form onSubmit={handleEnable} className="space-y-3">
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
              autoComplete="one-time-code"
              className="text-center tracking-widest text-2xl w-40"
            />
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" disabled={state === 'verifying' || code.length !== 6}>
              {state === 'verifying' ? '確認中...' : '有効にする'}
            </Button>
          </form>
        </div>
      )}

      {state === 'done' && (
        <p className="text-sm font-semibold text-green-600">{message}</p>
      )}

      {state === 'error' && (
        <p className="text-sm text-destructive">{message || '読み込みに失敗しました'}</p>
      )}

      <Separator className="my-6" />

      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-4">
        パスワード変更
      </h2>
      <form onSubmit={handleChangePassword} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="currentPassword">現在のパスワード</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="newPassword">新しいパスワード（8文字以上）</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {pwMessage && (
          <p className={`text-sm ${pwMessage.ok ? 'text-green-600' : 'text-destructive'}`}>
            {pwMessage.text}
          </p>
        )}
        <Button
          type="submit"
          disabled={pwSubmitting || !currentPassword || !newPassword || !confirmPassword}
        >
          {pwSubmitting ? '変更中...' : 'パスワードを変更する'}
        </Button>
      </form>

      <Separator className="my-6" />

      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-4">
        メールアドレス
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        パスワード再設定メールの送信先として使用されます。
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setEmailMessage(null);
          setEmailSubmitting(true);
          try {
            await updateEmail(email);
            setEmailMessage({ text: 'メールアドレスを更新しました', ok: true });
          } catch {
            setEmailMessage({ text: '更新に失敗しました', ok: false });
          } finally {
            setEmailSubmitting(false);
          }
        }}
        className="space-y-3"
      >
        <div className="space-y-1">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            autoComplete="email"
          />
        </div>
        {emailMessage && (
          <p className={`text-sm ${emailMessage.ok ? 'text-green-600' : 'text-destructive'}`}>
            {emailMessage.text}
          </p>
        )}
        <Button type="submit" disabled={emailSubmitting}>
          {emailSubmitting ? '更新中...' : 'メールアドレスを更新する'}
        </Button>
      </form>
    </div>
  );
};

export default MfaSetupPage;
