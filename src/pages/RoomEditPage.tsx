import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function RoomEditPage() {
  const { id } = useParams<{ id: string }>();
  const { rooms, updateRoom, loading } = useData();
  const navigate = useNavigate();

  const room = rooms.find((r) => r.id === id);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [equipment, setEquipment] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room && !initialized) {
      setName(room.name);
      setLocation(room.location);
      setCapacity(String(room.capacity));
      setEquipment(room.equipment);
      setInitialized(true);
    }
  }, [room, initialized]);

  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (!room) {
    return (
      <div>
        <p className="error-msg">指定の会議室が見つかりません。</p>
        <Link to="/rooms">会議室一覧へ戻る</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !capacity || !equipment) {
      setError('すべての項目を入力してください。');
      return;
    }
    setError(null);
    try {
      await updateRoom(id!, {
        name,
        location,
        capacity: Number(capacity),
        equipment,
      });
      navigate('/rooms');
    } catch {
      setError('更新に失敗しました。再度お試しください。');
    }
  };

  return (
    <div>
      <h2>会議室編集</h2>
      {error && <p className="error-msg">{error}</p>}
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <th>会議室名 <span className="req">*</span></th>
              <td><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></td>
            </tr>
            <tr>
              <th>場所 <span className="req">*</span></th>
              <td><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} /></td>
            </tr>
            <tr>
              <th>キャパ <span className="req">*</span></th>
              <td><input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></td>
            </tr>
            <tr>
              <th>設備 <span className="req">*</span></th>
              <td><input type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)} /></td>
            </tr>
          </tbody>
        </table>
        <p className="form-hint">※ すべての項目が必須です。</p>
        <div className="form-actions">
          <input type="submit" value="保存" />
          {' '}
          <button type="button" className="link-button" onClick={() => navigate('/rooms')}>
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
