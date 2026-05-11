import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const CAPACITY_RANGES = [
  { label: 'すべて', value: '' },
  { label: '～4名', value: '1-4' },
  { label: '5～10名', value: '5-10' },
  { label: '11～20名', value: '11-20' },
  { label: '21名以上', value: '21-' },
];

function matchesCapacity(capacity: number, range: string): boolean {
  if (!range) return true;
  const [min, max] = range.split('-');
  if (!max) return capacity >= Number(min);
  return capacity >= Number(min) && capacity <= Number(max);
}

export default function RoomListPage() {
  const { rooms, deleteRoom, reservations } = useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [filterName, setFilterName] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const isReservedToday = (roomId: string) =>
    reservations.some((r) => r.roomId === roomId && r.date === today);

  const locationOptions = useMemo(() => {
    const unique = Array.from(new Set(rooms.map((r) => r.location))).sort();
    return ['', ...unique];
  }, [rooms]);

  const equipmentOptions = useMemo(() => {
    const items = new Set<string>();
    rooms.forEach((r) => {
      r.equipment.split(',').forEach((e) => {
        const trimmed = e.trim();
        items.add(trimmed === '-' ? 'なし' : trimmed);
      });
    });
    return ['', ...Array.from(items).sort()];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (filterName && !room.name.includes(filterName)) return false;
      if (filterLocation && room.location !== filterLocation) return false;
      if (!matchesCapacity(room.capacity, filterCapacity)) return false;
      if (filterEquipment) {
        const equipList = room.equipment.split(',').map((e) => {
          const t = e.trim();
          return t === '-' ? 'なし' : t;
        });
        if (!equipList.includes(filterEquipment)) return false;
      }
      if (filterAvailability) {
        const reserved = isReservedToday(room.id);
        if (filterAvailability === '空き' && reserved) return false;
        if (filterAvailability === '予約あり' && !reserved) return false;
      }
      return true;
    });
  }, [rooms, filterName, filterLocation, filterCapacity, filterEquipment, filterAvailability, reservations, today]);

  const handleReset = () => {
    setFilterName('');
    setFilterLocation('');
    setFilterCapacity('');
    setFilterEquipment('');
    setFilterAvailability('');
  };

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

      <div className="filter-area">
        <div className="filter-row">
          <label>
            会議室名
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="名前で検索"
            />
          </label>
          <label>
            場所
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>{loc || 'すべて'}</option>
              ))}
            </select>
          </label>
          <label>
            キャパ
            <select value={filterCapacity} onChange={(e) => setFilterCapacity(e.target.value)}>
              {CAPACITY_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <label>
            設備
            <select value={filterEquipment} onChange={(e) => setFilterEquipment(e.target.value)}>
              {equipmentOptions.map((eq) => (
                <option key={eq} value={eq}>{eq || 'すべて'}</option>
              ))}
            </select>
          </label>
          <label>
            空き状況
            <select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}>
              <option value="">すべて</option>
              <option value="空き">空き</option>
              <option value="予約あり">予約あり</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={handleReset}>リセット</button>
      </div>

      <p>
        {filteredRooms.length} 件（全 {rooms.length} 件中）
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
          {filteredRooms.map((room) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
