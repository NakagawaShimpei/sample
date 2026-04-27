import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export default function RoomReservePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { rooms, reservations, addReservation } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const room = rooms.find((r) => r.id === roomId);

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attendeeCount, setAttendeeCount] = useState('');
  const [meetingName, setMeetingName] = useState('');
  const [reservedBy, setReservedBy] = useState(currentUser?.displayName || '');
  const [participants, setParticipants] = useState('');

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
    if (startTime >= endTime) {
      alert('終了時刻は開始時刻より後にしてください。');
      return;
    }
    const hasConflict = reservations.some(
      (r) =>
        r.roomId === room.id &&
        r.date === date &&
        r.startTime < endTime &&
        r.endTime > startTime
    );
    if (hasConflict) {
      alert('この会議室はすでに指定の時間帯に予約が入っています。別の日時を選択してください。');
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

  return (
    <div>
      <h2>会議室予約</h2>
      <p>予約対象: <strong>{room.name}</strong> ({room.location} / 定員{room.capacity}名)</p>
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
