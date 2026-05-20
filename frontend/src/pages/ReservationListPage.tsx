import { FC, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Reservation } from '../types';

const ReservationListPage: FC = () => {
  const {
    reservations,
    rooms,
    cancelReservation,
    cancelReservationGroup,
    reloadReservations,
    reloadRooms,
  } = useData();

  useEffect(() => {
    reloadReservations();
    reloadRooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const dialog = useDialog();
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const visible = isAdmin
    ? reservations
    : reservations.filter((r) => r.reservedBy === currentUser?.username);

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name || '(削除済み)';

  const { filters, setFilter, clearFilters, hasActiveFilter, sortKey, sortDir, toggleSort, items } =
    useSortFilter<Reservation>(
      visible,
      (r, f) => {
        if (f.meetingName && !r.meetingName.toLowerCase().includes(f.meetingName)) return false;
        if (f.room && !roomName(r.roomId).toLowerCase().includes(f.room)) return false;
        if (f.date && !r.date.includes(f.date)) return false;
        if (f.attendeeCount && !String(r.attendeeCount).includes(f.attendeeCount)) return false;
        if (f.reservedBy && !r.reservedBy.toLowerCase().includes(f.reservedBy)) return false;
        if (f.participants && !r.participants.toLowerCase().includes(f.participants)) return false;
        return true;
      },
      (r, key) => {
        if (key === 'meetingName') return r.meetingName;
        if (key === 'room') return roomName(r.roomId);
        if (key === 'date') return r.date + r.startTime;
        if (key === 'attendeeCount') return r.attendeeCount;
        if (key === 'reservedBy') return r.reservedBy;
        return '';
      },
    );

  const defaultSorted = sortKey
    ? items
    : [...items].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });

  const handleCancelClick = async (r: Reservation) => {
    if (r.recurringGroupId) {
      setCancelTarget(r);
    } else {
      const ok = await dialog.confirm(`予約「${r.meetingName}」をキャンセルします。よろしいですか？`, { title: 'キャンセルの確認', confirmLabel: 'キャンセルする', variant: 'destructive' });
      if (!ok) return;
      try {
        await cancelReservation(r.id);
      } catch (e) {
        await dialog.alert('キャンセルに失敗しました: ' + (e instanceof Error ? e.message : ''), 'エラー', 'error');
      }
    }
  };

  const handleCancelOne = async () => {
    if (!cancelTarget) return;
    setCancelTarget(null);
    try {
      await cancelReservation(cancelTarget.id);
    } catch (e) {
      await dialog.alert('キャンセルに失敗しました: ' + (e instanceof Error ? e.message : ''), 'エラー', 'error');
    }
  };

  const handleCancelGroup = async () => {
    if (!cancelTarget?.recurringGroupId) return;
    setCancelTarget(null);
    try {
      await cancelReservationGroup(cancelTarget.recurringGroupId);
    } catch (e) {
      await dialog.alert('キャンセルに失敗しました: ' + (e instanceof Error ? e.message : ''), 'エラー', 'error');
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
        予約一覧
      </h2>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {isAdmin ? '全員の予約を表示しています。' : '自分の予約を表示しています。'}{' '}
          ({visible.length} 件)
        </p>
        {hasActiveFilter && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground hover:text-foreground">
            フィルターをクリア
          </Button>
        )}
      </div>
      {defaultSorted.length === 0 && !hasActiveFilter ? (
        <p className="text-sm text-muted-foreground">予約はありません。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead sortKey="meetingName" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>会議名</SortableHead>
              <SortableHead sortKey="room" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>会議室</SortableHead>
              <SortableHead sortKey="date" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>日付</SortableHead>
              <TableHead>時間</TableHead>
              <SortableHead sortKey="attendeeCount" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>人数</SortableHead>
              <SortableHead sortKey="reservedBy" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>予約者</SortableHead>
              <TableHead>参加者</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="py-1">{fi('meetingName')}</TableHead>
              <TableHead className="py-1">{fi('room')}</TableHead>
              <TableHead className="py-1">{fi('date')}</TableHead>
              <TableHead className="py-1" />
              <TableHead className="py-1">{fi('attendeeCount')}</TableHead>
              <TableHead className="py-1">{fi('reservedBy')}</TableHead>
              <TableHead className="py-1">{fi('participants')}</TableHead>
              <TableHead className="py-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaultSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  該当する予約がありません
                </TableCell>
              </TableRow>
            ) : (
              defaultSorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {r.meetingName}
                      {r.recurringGroupId && (
                        <Badge
                          variant="outline"
                          className="border-blue-400 text-blue-700 bg-blue-50 text-[10px] cursor-help"
                          title={`${r.recurringPattern ?? '繰り返し'}（グループ: ${r.recurringGroupId}）`}
                        >
                          {r.recurringPattern ?? '繰り返し'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{roomName(r.roomId)}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.startTime} - {r.endTime}
                  </TableCell>
                  <TableCell>{r.attendeeCount}名</TableCell>
                  <TableCell>{r.reservedBy}</TableCell>
                  <TableCell className="whitespace-normal max-w-[200px]">{r.participants}</TableCell>
                  <TableCell>
                    {(isAdmin || r.reservedBy === currentUser?.username) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => handleCancelClick(r)}
                      >
                        キャンセル
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>キャンセル方法の選択</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            「{cancelTarget?.meetingName}」（{cancelTarget?.date}）のキャンセル方法を選択してください。
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="destructive" onClick={handleCancelOne}>
              この予約のみキャンセル
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancelGroup}>
              同グループをすべてキャンセル
            </Button>
            <Button type="button" variant="outline" onClick={() => setCancelTarget(null)}>
              戻る
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationListPage;
