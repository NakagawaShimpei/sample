import React, { useState, useEffect } from 'react';

type SetupState = 'idle' | 'loading' | 'ready' | 'verifying' | 'done' | 'error';

export default function MfaSetupPage() {
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
      const res = await fetch('/api/mfa/disable', {
        method: 'DELETE',
        credentials: 'include',
      });
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
    <div style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
      <h2>二段階認証（MFA）の設定</h2>

      {state === 'idle' && (
        <div>
          <p>Google Authenticator などの認証アプリを使って二段階認証を設定できます。</p>
          <button onClick={fetchSetup}>MFA を設定する</button>
          <hr style={{ margin: '2rem 0' }} />
          <h3>MFA の無効化</h3>
          <p>すでに MFA を設定している場合、以下から無効化できます。</p>
          <button onClick={handleDisable} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>
            MFA を無効にする
          </button>
          {disableMessage && <p style={{ marginTop: '1rem', color: '#28a745' }}>{disableMessage}</p>}
        </div>
      )}

      {state === 'loading' && <p>読み込み中...</p>}

      {(state === 'ready' || state === 'verifying') && (
        <div>
          <p>① 認証アプリで以下の QR コードをスキャンしてください。</p>
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <img src={qrCode} alt="MFA QR Code" style={{ width: 200, height: 200 }} />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#555' }}>
            QR コードが読み取れない場合は、以下のキーを手動で入力してください:<br />
            <code style={{ wordBreak: 'break-all' }}>{secret}</code>
          </p>
          <p>② 認証アプリに表示された 6 桁のコードを入力して確認してください。</p>
          <form onSubmit={handleEnable}>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ fontSize: '1.5rem', letterSpacing: '0.3rem', textAlign: 'center', width: 160, display: 'block', margin: '0.5rem 0' }}
              autoFocus
              autoComplete="one-time-code"
            />
            {message && <p style={{ color: '#dc3545' }}>{message}</p>}
            <button type="submit" disabled={state === 'verifying' || code.length !== 6}>
              {state === 'verifying' ? '確認中...' : '有効にする'}
            </button>
          </form>
        </div>
      )}

      {state === 'done' && (
        <p style={{ color: '#28a745', fontWeight: 'bold' }}>{message}</p>
      )}

      {state === 'error' && (
        <p style={{ color: '#dc3545' }}>{message}</p>
      )}
    </div>
  );
}
