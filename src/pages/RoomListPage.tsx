import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export default function RoomListPage() {
  const { rooms, deleteRoom, reservations } = useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [filterCount, setFilterCount] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const isReservedToday = (roomId: string) =>
    reservations.some((r) => r.roomId === roomId && r.date === today);

  const filteredRooms = filterCount !== '' && Number(filterCount) > 0
    ? rooms.filter((r) => r.capacity >= Number(filterCount))
    : rooms;

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
      <div className="filter-bar">
        <label htmlFor="filter-count">参加人数で絞り込み：</label>
        <input
          id="filter-count"
          type="number"
          min="1"
          value={filterCount}
          onChange={(e) => setFilterCount(e.target.value)}
          placeholder="人数を入力"
          className="filter-input"
        />
        <span className="filter-hint">名以上収容できる会議室を表示</span>
        {filterCount !== '' && (
          <button
            type="button"
            className="link-button"
            onClick={() => setFilterCount('')}
          >
            クリア
          </button>
        )}
      </div>
      <p>
        {filterCount !== '' && Number(filterCount) > 0
          ? `${filteredRooms.length} 件表示（全 ${rooms.length} 件）`
          : `登録されている会議室: ${rooms.length} 件`}
      </p>
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
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
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
                        onClick={() => handleDelete(room.id, room.name)}
                      >
                        削除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#666' }}>
                条件に合う会議室が見つかりません。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
