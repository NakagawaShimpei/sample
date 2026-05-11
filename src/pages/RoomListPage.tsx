import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export default function RoomListPage() {
  const { rooms, deleteRoom, reservations } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';

  const today = new Date().toISOString().slice(0, 10);
  const isReservedToday = (roomId: string) =>
    reservations.some((r) => r.roomId === roomId && r.date === today);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`会議室「${name}」を削除します。よろしいですか？`)) return;
    try {
      await deleteRoom(id);
    } catch (e) {
      alert('削除に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
  };

  return (
    <div>
      <h2>会議室一覧</h2>
      <p>登録されている会議室: {rooms.length} 件</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>会議室名</th>
            <th>場所</th>
            <th>キャパ</th>
            <th>設備</th>
            <th>本日の空き状況</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <td>{room.name}</td>
              <td>{room.location}</td>
              <td>{room.capacity}名</td>
              <td>{room.equipment}</td>
              <td>{isReservedToday(room.id) ? '予約あり' : '空き'}</td>
              <td>
                <Link to={`/rooms/${room.id}/reserve`}>予約する</Link>
                {isAdmin && (
                  <>
                    {' | '}
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => navigate(`/rooms/${room.id}/edit`)}
                    >
                      編集
                    </button>
                    {' | '}
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleDelete(room.id, room.name)}
                    >
                      削除
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
