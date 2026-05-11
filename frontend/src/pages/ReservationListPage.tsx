import { FC, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Reservation } from '../types';

const ReservationListPage: FC = () => {
  const { reservations, rooms, cancelReservation, cancelReservationGroup } =
    useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const visible = isAdmin
    ? reservations
    : reservations.filter((r) => r.reservedBy === currentUser?.username);

  const sorted = [...visible].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const roomName = (id: string) =>
    rooms.find((r) => r.id === id)?.name || '(削除済み)';

  const handleCancelClick = (r: Reservation) => {
    if (r.recurringGroupId) {
      setCancelTarget(r);
    } else {
      if (
        !window.confirm(
          `予約「${r.meetingName}」をキャンセルします。よろしいですか？`,
        )
      )
        return;
      cancelReservation(r.id).catch((e) =>
        alert(
          'キャンセルに失敗しました: ' + (e instanceof Error ? e.message : ''),
        ),
      );
    }
  };

  const handleCancelOne = async () => {
    if (!cancelTarget) return;
    setCancelTarget(null);
    try {
      await cancelReservation(cancelTarget.id);
    } catch (e) {
      alert(
        'キャンセルに失敗しました: ' + (e instanceof Error ? e.message : ''),
      );
    }
  };

  const handleCancelGroup = async () => {
    if (!cancelTarget?.recurringGroupId) return;
    setCancelTarget(null);
    try {
      await cancelReservationGroup(cancelTarget.recurringGroupId);
    } catch (e) {
      alert(
        'キャンセルに失敗しました: ' + (e instanceof Error ? e.message : ''),
      );
    }
  };

  return (
    <div>
      <h2>予約一覧</h2>
      <p>
        {isAdmin
          ? '全員の予約を表示しています。'
          : '自分の予約を表示しています。'}{' '}
        ({visible.length} 件)
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
            {sorted.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.meetingName}
                  {r.recurringGroupId && (
                    <span
                      className="badge-recurring"
                      title={`${r.recurringPattern ?? '繰り返し'}（グループ: ${r.recurringGroupId}）`}
                    >
                      {' '}
                      {r.recurringPattern ?? '繰り返し'}
                    </span>
                  )}
                </td>
                <td>{roomName(r.roomId)}</td>
                <td>{r.date}</td>
                <td>
                  {r.startTime} - {r.endTime}
                </td>
                <td>{r.attendeeCount}名</td>
                <td>{r.reservedBy}</td>
                <td>{r.participants}</td>
                <td>
                  {(isAdmin || r.reservedBy === currentUser?.username) && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleCancelClick(r)}
                    >
                      キャンセル
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {cancelTarget && (
        <div className="modal-overlay">
          <div className="modal">
            <p>
              「{cancelTarget.meetingName}」（{cancelTarget.date}
              ）のキャンセル方法を選択してください。
            </p>
            <div className="form-actions">
              <button type="button" onClick={handleCancelOne}>
                この予約のみキャンセル
              </button>
              <button type="button" onClick={handleCancelGroup}>
                同グループをすべてキャンセル
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => setCancelTarget(null)}
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationListPage;
