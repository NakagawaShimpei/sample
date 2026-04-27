import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function ReservationListPage() {
  const { reservations, rooms, cancelReservation } = useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const visible = isAdmin
    ? reservations
    : reservations.filter((r) => r.reservedBy === currentUser?.username);

  const roomName = (id: string) =>
    rooms.find((r) => r.id === id)?.name || '(削除済み)';

  const handleCancel = async (id: string, name: string) => {
    if (!window.confirm(`予約「${name}」をキャンセルします。よろしいですか？`))
      return;
    try {
      await cancelReservation(id);
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
            {visible.map((r) => (
              <tr key={r.id}>
                <td>{r.meetingName}</td>
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
                      onClick={() => handleCancel(r.id, r.meetingName)}
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
    </div>
  );
}
