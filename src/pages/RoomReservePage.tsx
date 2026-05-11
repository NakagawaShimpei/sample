import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import type { Room } from '../types';

const RECOMMEND_TRIGGER_CAPACITY = 20;
const RECOMMEND_TRIGGER_MAX_ATTENDEES = 4;
const RECOMMEND_MAX_COUNT = 5;

export default function RoomReservePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { rooms, addReservation } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const room = rooms.find((r) => r.id === roomId);

  const [date, setDate] = useState(searchParams.get('date') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');
  const [attendeeCount, setAttendeeCount] = useState(searchParams.get('attendeeCount') || '');
  const [meetingName, setMeetingName] = useState('');
  const [reservedBy, setReservedBy] = useState(currentUser?.displayName || '');
  const [participants, setParticipants] = useState('');
  const [recommended, setRecommended] = useState<Room[]>([]);

  useEffect(() => {
    if (!room) return;
    const count = Number(attendeeCount);
    if (
      room.capacity >= RECOMMEND_TRIGGER_CAPACITY &&
      count >= 1 &&
      count <= RECOMMEND_TRIGGER_MAX_ATTENDEES
    ) {
      const selectedEquipment = room.equipment
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e !== '-');

      const scored = rooms
        .filter((r) => r.id !== room.id)
        .filter((r) => r.capacity >= count)
        .filter((r) => r.capacity <= room.capacity)
        .map((r) => {
          const rEquipment = r.equipment.split(',').map((e) => e.trim()).filter((e) => e !== '-');
          const commonCount = rEquipment.filter((e) => selectedEquipment.includes(e)).length;
          const locationScore =
            r.location === room.location ? 2
            : r.location.startsWith('本社') ? 1
            : 0;
          return { ...r, score: commonCount * 10 + locationScore };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, RECOMMEND_MAX_COUNT);

      setRecommended(scored);
    } else {
      setRecommended([]);
    }
  }, [attendeeCount, room, rooms]);

  if (!room) {
    return (
      <div>
        <p>会議室が見つかりません。</p>
        <Link to="/rooms">会議室一覧に戻る</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !attendeeCount || !meetingName || !reservedBy || !participants) {
      alert('すべての項目を入力してください。');
      return;
    }
    try {
      await addReservation({
        roomId: room.id,
        date,
        startTime,
        endTime,
        attendeeCount: Number(attendeeCount),
        meetingName,
        reservedBy: currentUser?.username || '',
        participants,
      });
      alert('予約しました。');
      navigate('/reservations');
    } catch (err) {
      alert('予約に失敗しました: ' + (err instanceof Error ? err.message : ''));
    }
  };

  const buildReserveParams = () => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (startTime) params.set('startTime', startTime);
    if (endTime) params.set('endTime', endTime);
    if (attendeeCount) params.set('attendeeCount', attendeeCount);
    return params.toString();
  };

  return (
    <div>
      <h2>会議室予約</h2>
      <p>予約対象: <strong>{room.name}</strong> ({room.location} / 定員{room.capacity}名 / 設備: {room.equipment === '-' ? 'なし' : room.equipment})</p>
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <th>日付 <span className="req">*</span></th>
              <td><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></td>
            </tr>
            <tr>
              <th>開始時刻 <span className="req">*</span></th>
              <td><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></td>
            </tr>
            <tr>
              <th>終了時刻 <span className="req">*</span></th>
              <td><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></td>
            </tr>
            <tr>
              <th>人数 <span className="req">*</span></th>
              <td><input type="number" min="1" value={attendeeCount} onChange={(e) => setAttendeeCount(e.target.value)} /></td>
            </tr>
            {recommended.length > 0 && (
              <tr>
                <td colSpan={2} style={{ padding: 0, border: 'none' }}>
                  <div className="recommend-panel">
                    <p className="recommend-message">参加人数が少ないため、以下の会議室もご検討ください。</p>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>会議室名</th>
                          <th>場所</th>
                          <th>定員</th>
                          <th>設備</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommended.map((r) => {
                          const equip = r.equipment.split(',').map((e) => e.trim()).filter((e) => e !== '-');
                          return (
                            <tr key={r.id}>
                              <td>{r.name}</td>
                              <td>{r.location}</td>
                              <td>{r.capacity}名</td>
                              <td>{equip.length > 0 ? equip.join('、') : 'なし'}</td>
                              <td>
                                <button
                                  type="button"
                                  className="link-button"
                                  onClick={() => navigate(`/rooms/${r.id}/reserve?${buildReserveParams()}`)}
                                >
                                  この部屋で予約する
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            )}
            <tr>
              <th>会議名 <span className="req">*</span></th>
              <td><input type="text" value={meetingName} onChange={(e) => setMeetingName(e.target.value)} /></td>
            </tr>
            <tr>
              <th>予約者名 <span className="req">*</span></th>
              <td><input type="text" value={reservedBy} onChange={(e) => setReservedBy(e.target.value)} /></td>
            </tr>
            <tr>
              <th>参加者 <span className="req">*</span></th>
              <td><textarea value={participants} onChange={(e) => setParticipants(e.target.value)} rows={3} /></td>
            </tr>
          </tbody>
        </table>
        <p className="form-hint">※ すべての項目が必須です。</p>
        <div className="form-actions">
          <input type="submit" value="予約する" />
          <Link to="/rooms">キャンセル</Link>
        </div>
      </form>
    </div>
  );
}
