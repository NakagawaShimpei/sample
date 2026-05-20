import { FC, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SortableHead from '../components/SortableHead';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useDialog } from '../contexts/DialogContext';
import { useSortFilter } from '../hooks/useSortFilter';
import { UserRecord } from '../types';

const UserListPage: FC = () => {
  const { users, deleteUser, reloadUsers } = useData();
  const { currentUser } = useAuth();

  useEffect(() => {
    reloadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { filters, setFilter, clearFilters, hasActiveFilter, sortKey, sortDir, toggleSort, items } =
    useSortFilter<UserRecord>(
      users,
      (u, f) => {
        if (f.username && !u.username.toLowerCase().includes(f.username)) return false;
        if (f.displayName && !u.displayName.toLowerCase().includes(f.displayName)) return false;
        if (f.role && !(u.role === 'admin' ? '管理者' : '利用者').includes(f.role)) return false;
        if (f.email && !(u.email ?? '').toLowerCase().includes(f.email)) return false;
        return true;
      },
      (u, key) => {
        if (key === 'username') return u.username;
        if (key === 'displayName') return u.displayName;
        if (key === 'role') return u.role;
        if (key === 'email') return u.email ?? '';
        return '';
      },
    );

  const dialog = useDialog();

  const handleDelete = async (id: string, name: string) => {
    const ok = await dialog.confirm(`ユーザー「${name}」を削除します。よろしいですか？`, { title: '削除の確認', confirmLabel: '削除', variant: 'destructive' });
    if (!ok) return;
    try {
      await deleteUser(id);
    } catch (e) {
      await dialog.alert('削除に失敗しました: ' + (e instanceof Error ? e.message : ''), 'エラー', 'error');
    }
  };

  const fi = (key: string) => (
    <Input
      type="search"
      value={filters[key] ?? ''}
      onChange={(e) => setFilter(key, e.target.value)}
      placeholder="絞り込み"
      className="h-6 text-[10px] px-1.5 font-normal"
    />
  );

  return (
    <div>
      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-3">
        ユーザー一覧（管理者）
      </h2>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">登録されているユーザー: {users.length} 件</p>
        {hasActiveFilter && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground hover:text-foreground">
            フィルターをクリア
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead sortKey="username" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>ユーザー名</SortableHead>
            <SortableHead sortKey="displayName" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>表示名</SortableHead>
            <SortableHead sortKey="role" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>ロール</SortableHead>
            <SortableHead sortKey="email" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>メールアドレス</SortableHead>
            <TableHead>操作</TableHead>
          </TableRow>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="py-1">{fi('username')}</TableHead>
            <TableHead className="py-1">{fi('displayName')}</TableHead>
            <TableHead className="py-1">{fi('role')}</TableHead>
            <TableHead className="py-1">{fi('email')}</TableHead>
            <TableHead className="py-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                該当するユーザーがありません
              </TableCell>
            </TableRow>
          ) : (
            items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.displayName}</TableCell>
                <TableCell>{u.role === 'admin' ? '管理者' : '利用者'}</TableCell>
                <TableCell className="text-muted-foreground">{u.email ?? '-'}</TableCell>
                <TableCell>
                  {u.role === 'user' && u.username !== currentUser?.username ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-destructive hover:text-destructive/80"
                      onClick={() => handleDelete(u.id, u.displayName)}
                    >
                      削除
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserListPage;
