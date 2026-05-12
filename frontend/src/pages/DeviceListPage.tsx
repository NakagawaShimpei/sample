import React, { FC, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useSortFilter } from '../hooks/useSortFilter';
import { Device, DeviceStatus } from '../types';
import { formatElapsed, getLoanAlertInfo } from '../utils/loanAlerts';

const statusLabel = (status: DeviceStatus): string => {
  if (status === 'available') return '利用可能';
  if (status === 'inUse') return '使用中';
  return 'メンテナンス中';
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const DeviceListPage: FC = () => {
  const {
    devices,
    borrowDevice,
    returnDevice,
    loans,
    deleteDevice,
    reloadDevices,
    reloadLoans,
  } = useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    reloadDevices();
    reloadLoans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [borrowTargetId, setBorrowTargetId] = useState<string | null>(null);
  const [expectedReturnAt, setExpectedReturnAt] = useState('');

  const getLoanForDevice = (deviceId: string) => loans.find((l) => l.deviceId === deviceId);

  const isBorrowedByMe = (deviceId: string) =>
    loans.some((l) => l.deviceId === deviceId && l.borrowedBy === currentUser?.username);

  const { filters, setFilter, clearFilters, hasActiveFilter, sortKey, sortDir, toggleSort, items } =
    useSortFilter<Device>(
      devices,
      (d, f) => {
        if (f.name && !d.name.toLowerCase().includes(f.name)) return false;
        if (f.type && !d.type.toLowerCase().includes(f.type)) return false;
        if (f.managementNumber && !d.managementNumber.toLowerCase().includes(f.managementNumber)) return false;
        if (f.location && !d.location.toLowerCase().includes(f.location)) return false;
        if (f.status && !statusLabel(d.status).toLowerCase().includes(f.status)) return false;
        if (f.borrowedBy) {
          const loan = loans.find((l) => l.deviceId === d.id);
          if (!(loan?.borrowedBy ?? '').toLowerCase().includes(f.borrowedBy)) return false;
        }
        return true;
      },
      (d, key) => {
        if (key === 'name') return d.name;
        if (key === 'type') return d.type;
        if (key === 'managementNumber') return d.managementNumber;
        if (key === 'location') return d.location;
        if (key === 'status') return statusLabel(d.status);
        if (key === 'borrowedBy') return loans.find((l) => l.deviceId === d.id)?.borrowedBy ?? '';
        if (key === 'borrowedAt') return loans.find((l) => l.deviceId === d.id)?.borrowedAt ?? '';
        if (key === 'expectedReturnAt') return loans.find((l) => l.deviceId === d.id)?.expectedReturnAt ?? '';
        return '';
      },
    );

  const overdueCount = loans.filter((l) => getLoanAlertInfo(l).status === 'overdue').length;
  const longDurationCount = loans.filter((l) => getLoanAlertInfo(l).status === 'longDuration').length;

  const handleBorrowClick = (id: string) => {
    setBorrowTargetId(id);
    setExpectedReturnAt('');
  };

  const handleBorrowConfirm = async (id: string) => {
    try {
      await borrowDevice(id, currentUser?.username || '', expectedReturnAt || undefined);
      setBorrowTargetId(null);
    } catch (e) {
      alert('貸出に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
  };

  const handleReturn = async (id: string, name: string) => {
    if (!window.confirm(`「${name}」を返却します。よろしいですか？`)) return;
    try {
      await returnDevice(id);
    } catch (e) {
      alert('返却に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`デバイス「${name}」を削除します。よろしいですか？`)) return;
    try {
      await deleteDevice(id);
    } catch (e) {
      alert('削除に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
  };

  const minDateTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    return d.toISOString().slice(0, 16);
  };

  const renderAlertBadge = (deviceId: string) => {
    const loan = getLoanForDevice(deviceId);
    if (!loan) return null;
    if (!isAdmin && loan.borrowedBy !== currentUser?.username) return null;
    const info = getLoanAlertInfo(loan);
    if (info.status === 'overdue') {
      return (
        <Badge variant="destructive" className="ml-1">
          延滞中（+{formatElapsed(info.overdueHours ?? 0)}）
        </Badge>
      );
    }
    if (info.status === 'warning') {
      return (
        <Badge variant="outline" className="ml-1 border-amber-500 text-amber-700 bg-amber-50">
          まもなく期限（残{info.minutesRemaining}分）
        </Badge>
      );
    }
    if (info.status === 'longDuration') {
      return (
        <Badge variant="outline" className="ml-1 border-amber-500 text-amber-700 bg-amber-50">
          長時間貸出中（{formatElapsed(info.hoursElapsed)}経過）
        </Badge>
      );
    }
    return null;
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

  const colSpan = isAdmin ? 9 : 6;

  return (
    <div>
      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-3">
        デバイス一覧
      </h2>
      {isAdmin && (overdueCount > 0 || longDurationCount > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {overdueCount > 0 && (
            <Badge variant="destructive">延滞中: {overdueCount}件</Badge>
          )}
          {longDurationCount > 0 && (
            <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
              長時間貸出（8h超）: {longDurationCount}件
            </Badge>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">登録されているデバイス: {devices.length} 件</p>
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
            <SortableHead sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>デバイス名</SortableHead>
            <SortableHead sortKey="type" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>種別</SortableHead>
            <SortableHead sortKey="managementNumber" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>管理番号</SortableHead>
            <SortableHead sortKey="location" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>場所</SortableHead>
            <SortableHead sortKey="status" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>ステータス</SortableHead>
            {isAdmin && (
              <>
                <SortableHead sortKey="borrowedBy" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>借用者</SortableHead>
                <SortableHead sortKey="borrowedAt" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>貸出日時</SortableHead>
                <SortableHead sortKey="expectedReturnAt" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort}>返却予定</SortableHead>
              </>
            )}
            <TableHead>操作</TableHead>
          </TableRow>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="py-1">{fi('name')}</TableHead>
            <TableHead className="py-1">{fi('type')}</TableHead>
            <TableHead className="py-1">{fi('managementNumber')}</TableHead>
            <TableHead className="py-1">{fi('location')}</TableHead>
            <TableHead className="py-1">{fi('status')}</TableHead>
            {isAdmin && (
              <>
                <TableHead className="py-1">{fi('borrowedBy')}</TableHead>
                <TableHead className="py-1" />
                <TableHead className="py-1" />
              </>
            )}
            <TableHead className="py-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-6">
                該当するデバイスがありません
              </TableCell>
            </TableRow>
          ) : (
            items.map((d) => {
              const loan = getLoanForDevice(d.id);
              const loanInfo = loan ? getLoanAlertInfo(loan) : null;
              return (
                <React.Fragment key={d.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center flex-wrap gap-1">
                        {d.name}
                        {renderAlertBadge(d.id)}
                      </div>
                    </TableCell>
                    <TableCell>{d.type}</TableCell>
                    <TableCell>{d.managementNumber}</TableCell>
                    <TableCell>{d.location}</TableCell>
                    <TableCell>{statusLabel(d.status)}</TableCell>
                    {isAdmin && (
                      <>
                        <TableCell>{loan?.borrowedBy ?? '—'}</TableCell>
                        <TableCell>
                          {loan ? (
                            <>
                              <div>{formatDate(loan.borrowedAt)}</div>
                              <div className="text-xs text-muted-foreground">
                                （{formatElapsed(loanInfo!.hoursElapsed)}経過）
                              </div>
                            </>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {loan?.expectedReturnAt ? formatDate(loan.expectedReturnAt) : '—'}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {d.status === 'available' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleBorrowClick(d.id)}
                          >
                            貸出
                          </Button>
                        )}
                        {d.status === 'inUse' && isBorrowedByMe(d.id) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturn(d.id, d.name)}
                          >
                            返却
                          </Button>
                        )}
                        {d.status === 'inUse' && !isBorrowedByMe(d.id) && isAdmin && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-400/50 hover:bg-amber-50 hover:text-amber-700"
                            onClick={() => handleReturn(d.id, d.name)}
                          >
                            強制返却
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                            onClick={() => handleDelete(d.id, d.name)}
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {borrowTargetId === d.id && (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="bg-slate-50">
                        <div className="py-2">
                          <p className="font-medium text-sm mb-3">「{d.name}」の貸出</p>
                          <div className="flex items-center gap-3">
                            <Label className="text-sm whitespace-nowrap">
                              返却予定日時（任意）:
                            </Label>
                            <Input
                              type="datetime-local"
                              value={expectedReturnAt}
                              onChange={(e) => setExpectedReturnAt(e.target.value)}
                              min={minDateTime()}
                              className="w-auto"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button type="button" size="sm" onClick={() => handleBorrowConfirm(d.id)}>
                              貸出する
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setBorrowTargetId(null)}
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DeviceListPage;
