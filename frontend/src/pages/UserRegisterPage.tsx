import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '../contexts/DataContext';
import { useDialog } from '../contexts/DialogContext';

const UserRegisterPage: FC = () => {
  const { addUser } = useData();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const dialog = useDialog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !displayName) {
      await dialog.alert('ユーザー名・パスワード・表示名は必須です。', '入力エラー', 'warning');
      return;
    }
    try {
      await addUser({ username, password, displayName, email: email || undefined });
      await dialog.alert('ユーザーを登録しました。', '完了', 'success');
      navigate('/users');
    } catch (err) {
      await dialog.alert('登録に失敗しました: ' + (err instanceof Error ? err.message : ''), 'エラー', 'error');
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-4">
        ユーザー登録（管理者）
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        新しい利用者アカウントを登録します。ロールは「利用者」になります。
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-4">
          <Label htmlFor="username">
            ユーザー名 <span className="text-destructive font-bold">*</span>
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Label htmlFor="password">
            パスワード <span className="text-destructive font-bold">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Label htmlFor="displayName">
            表示名 <span className="text-destructive font-bold">*</span>
          </Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="パスワード再設定に使用します"
          />
        </div>

        <p className="text-xs text-muted-foreground">※ <span className="text-destructive font-bold">*</span> は必須です。メールアドレスはパスワード再設定に使用します。</p>
        <Button type="submit">登録する</Button>
      </form>
    </div>
  );
};

export default UserRegisterPage;
