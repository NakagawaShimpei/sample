import React, { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type SetupState = 'idle' | 'loading' | 'ready' | 'verifying' | 'done' | 'error';

const MfaSetupPage: FC = () => {
  const [state, setState] = useState<SetupState>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [disableMessage, setDisableMessage] = useState('');

  const fetchSetup = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/mfa/setup', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setState('ready');
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
        setState('ready');
        return;
      }
      setState('done');
      setMessage('MFA の設定が完了しました。次回ログインから有効になります。');
    } catch {
      setMessage('エラーが発生しました');
      setState('ready');
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('MFA を無効にしますか？')) return;
    try {
      const res = await fetch('/api/mfa/disable', { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      setDisableMessage('MFA を無効にしました。');
      setState('idle');
      setQrCode('');
      setSecret('');
      setCode('');
    } catch {
      setDisableMessage('無効化に失敗しました');
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-4">
        二段階認証（MFA）の設定
      </h2>

      {state === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Google Authenticator などの認証アプリを使って二段階認証を設定できます。
          </p>
          <Button onClick={fetchSetup}>MFA を設定する</Button>

          <Separator className="my-4" />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">MFA の無効化</h3>
            <p className="text-sm text-muted-foreground">
              すでに MFA を設定している場合、以下から無効化できます。
            </p>
            <Button variant="destructive" onClick={handleDisable}>
              MFA を無効にする
            </Button>
            {disableMessage && (
              <p className="text-sm text-green-600">{disableMessage}</p>
            )}
          </div>
        </div>
      )}

      {state === 'loading' && (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      )}

      {(state === 'ready' || state === 'verifying') && (
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
        <p className="text-sm text-destructive">{message}</p>
      )}
    </div>
  );
};

export default MfaSetupPage;
