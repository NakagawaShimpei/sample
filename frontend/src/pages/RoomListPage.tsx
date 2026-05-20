import { FC, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
import { Room } from '../types';

const RoomListPage: FC = () => {
  const { rooms, deleteRoom, reservations, reloadRooms, reloadReservations } = useData();

  useEffect(() => {
    reloadRooms();
    reloadReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const today = new Date().toISOString().slice(0, 10);
  const isReservedToday = (roomId: string) =>
    reservations.some((r) => r.roomId === roomId && r.date === today);

  const { filters, setFilter, clearFilters, hasActiveFilter, sortKey, sortDir, toggleSort, items } =
    useSortFilter<Room>(
      rooms,
      (r, f) => {
        if (f.name && !r.name.toLowerCase().includes(f.name)) return false;
        if (f.location && !r.location.toLowerCase().includes(f.location)) return false;
        if (f.capacity && !String(r.capacity).includes(f.capacity)) return false;
        if (f.equipment && !r.equipment.toLowerCase().includes(f.equipment)) return false;
        return true;
      },
      (r, key) => {
        if (key === 'name') return r.name;
        if (key === 'location') return r.location;
        if (key === 'capacity') return r.capacity;
        return '';
      },
    );

  const dialog = useDialog();

  const handleDelete = async (id: string, name: string) => {
    const ok = await dialog.confirm(`会議室「${name}」を削除します。よろしいですか？`, { title: '削除の確認', confirmLabel: '削除', variant: 'destructive' });
    if (!ok) return;
    try {
      await deleteRoom(id);
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
        会議室一覧
      </h2>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">登録されている会議室: {rooms.length} 件</p>
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
            <SortableHead sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>会議室名</SortableHead>
            <SortableHead sortKey="location" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>場所</SortableHead>
            <SortableHead sortKey="capacity" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>キャパ</SortableHead>
            <TableHead>設備</TableHead>
            <TableHead>本日の空き状況</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="py-1">{fi('name')}</TableHead>
            <TableHead className="py-1">{fi('location')}</TableHead>
            <TableHead className="py-1">{fi('capacity')}</TableHead>
            <TableHead className="py-1">{fi('equipment')}</TableHead>
            <TableHead className="py-1" />
            <TableHead className="py-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                該当する会議室がありません
              </TableCell>
            </TableRow>
          ) : (
            items.map((room) => (
              <TableRow key={room.id}>
                <TableCell>{room.name}</TableCell>
                <TableCell>{room.location}</TableCell>
                <TableCell>{room.capacity}名</TableCell>
                <TableCell>{room.equipment}</TableCell>
                <TableCell>
                  {isReservedToday(room.id) ? (
                    <span className="text-amber-600 text-sm">予約あり</span>
                  ) : (
                    <span className="text-green-600 text-sm">空き</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/rooms/${room.id}/reserve`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      予約する
                    </Link>
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => handleDelete(room.id, room.name)}
                      >
                        削除
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RoomListPage;
