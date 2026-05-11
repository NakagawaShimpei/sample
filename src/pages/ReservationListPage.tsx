import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';

export default function ReservationListPage() {
  const { reservations, rooms, cancelReservation, cancelRecurringSeries } = useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const today = new Date().toISOString().slice(0, 10);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const visible = isAdmin
    ? reservations
    : reservations.filter((r) => r.reservedBy === currentUser?.username);

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name || '(削除済み)';

  // Find the id of the earliest future reservation per recurrenceId (for series cancel button)
  const seriesCancelTargets = useMemo(() => {
    const targets = new Map<string, string>();
    for (const r of visible) {
      if (!r.recurrenceId || r.date < today) continue;
      const currentTarget = targets.get(r.recurrenceId);
      if (!currentTarget) {
        targets.set(r.recurrenceId, r.id);
      } else {
        const currentDate = visible.find((v) => v.id === currentTarget)?.date || '';
        if (r.date < currentDate) {
          targets.set(r.recurrenceId, r.id);
        }
      }
    }
    return targets;
  }, [visible, today]);

  const handleCancel = async (id: string, name: string) => {
    if (!window.confirm(`予約「${name}」をキャンセルします。よろしいですか？`)) return;
    setLoadingMessage('予約をキャンセル中...');
    try {
      await cancelReservation(id);
    } catch (e) {
      alert('キャンセルに失敗しました: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleCancelSeries = async (recurringId: string) => {
    if (!window.confirm('このシリーズの今日以降の予約をすべてキャンセルしますか？')) return;
    const count = visible.filter(
      (r) => r.recurrenceId === recurringId && r.date >= today
    ).length;
    setLoadingMessage(`シリーズをキャンセル中... (${count}件)`);
    try {
      await cancelRecurringSeries(recurringId, today);
    } catch (e) {
      alert('シリーズキャンセルに失敗しました: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setLoadingMessage(null);
    }
  };

  return (
    <div>
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}
      <h2>予約一覧</h2>
      <p>
        {isAdmin ? '全員の予約を表示しています。' : '自分の予約を表示しています。'} (
        {visible.length} 件)
      </p>
      {visible.length === 0 ? (
        <p>予約はありません。</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>会議名</th>
              <th>会議室</th>
              <th>日付</th>
              <th>時間</th>
              <th>人数</th>
              <th>予約者</th>
              <th>参加者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.recurrenceId && (
                    <span
                      className="badge"
                      style={{
                        display: 'inline-block',
                        marginRight: 4,
                        padding: '1px 5px',
                        fontSize: '0.75em',
                        border: '1px solid currentColor',
                        borderRadius: 3,
                      }}
                    >
                      定期
                    </span>
                  )}
                  {r.meetingName}
                </td>
                <td>{roomName(r.roomId)}</td>
                <td>{r.date}</td>
                <td>{r.startTime} - {r.endTime}</td>
                <td>{r.attendeeCount}名</td>
                <td>{r.reservedBy}</td>
                <td>{r.participants}</td>
                <td>
                  {(isAdmin || r.reservedBy === currentUser?.username) && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleCancel(r.id, r.meetingName)}
                    >
                      キャンセル
                    </button>
                  )}
                  {r.recurrenceId && seriesCancelTargets.get(r.recurrenceId) === r.id && (
                    <button
                      type="button"
                      className="link-button"
                      style={{ marginLeft: 4 }}
                      onClick={() => handleCancelSeries(r.recurrenceId!)}
                    >
                      シリーズをキャンセル
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
