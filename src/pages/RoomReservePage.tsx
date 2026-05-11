import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { RecurrenceType } from '../types';
import LoadingOverlay from '../components/LoadingOverlay';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatPreviewDate(dateStr: string): string {
  const dt = parseLocalDate(dateStr);
  return `${dt.getMonth() + 1}月${dt.getDate()}日（${DAY_NAMES[dt.getDay()]}）`;
}

function calculateDates(
  startDate: string,
  endDate: string,
  recurrenceType: RecurrenceType,
  intervalDays: number
): string[] {
  const dates: string[] = [];
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (recurrenceType === 'weekly' || recurrenceType === 'biweekly') {
    const step = recurrenceType === 'weekly' ? 7 : 14;
    const current = new Date(start);
    while (current <= end) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + step);
    }
  } else if (recurrenceType === 'monthly') {
    const dayOfMonth = start.getDate();
    let monthOffset = 0;
    while (true) {
      const targetYear = start.getFullYear() + Math.floor((start.getMonth() + monthOffset) / 12);
      const targetMonth = (start.getMonth() + monthOffset) % 12;
      const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const current = new Date(targetYear, targetMonth, Math.min(dayOfMonth, lastDay));
      if (current > end) break;
      dates.push(formatDate(current));
      monthOffset++;
    }
  } else if (recurrenceType === 'custom') {
    const current = new Date(start);
    while (current <= end) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + intervalDays);
    }
  }

  return dates;
}

export default function RoomReservePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { rooms, addReservation, addRecurringReservation } = useData();
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

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');
  const [intervalDays, setIntervalDays] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const previewDates = useMemo(() => {
    if (!isRecurring || !date || !endDate || endDate < date) return [];
    if (recurrenceType === 'custom') {
      const n = parseInt(intervalDays);
      if (!n || n < 1 || n > 365) return [];
    }
    return calculateDates(date, endDate, recurrenceType, parseInt(intervalDays) || 1);
  }, [isRecurring, date, endDate, recurrenceType, intervalDays]);

  const endDateTooFar = Boolean(
    isRecurring &&
      date &&
      endDate &&
      (() => {
        const maxEnd = parseLocalDate(date);
        maxEnd.setFullYear(maxEnd.getFullYear() + 1);
        return parseLocalDate(endDate) > maxEnd;
      })()
  );

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

    if (isRecurring) {
      if (!endDate) {
        alert('終了日を入力してください。');
        return;
      }
      if (endDate < date) {
        alert('終了日は開始日以降で設定してください。');
        return;
      }
      if (endDateTooFar) {
        alert('終了日は開始日から1年以内で設定してください。');
        return;
      }
      if (recurrenceType === 'custom') {
        const n = parseInt(intervalDays);
        if (!n || n < 1 || n > 365) {
          alert('間隔（日数）は1〜365の整数で入力してください。');
          return;
        }
      }
      if (previewDates.length === 0) {
        alert('予約日が算出できません。入力内容を確認してください。');
        return;
      }

      const startDateObj = parseLocalDate(date);
      const recurringData = {
        roomId: room.id,
        startTime,
        endTime,
        attendeeCount: Number(attendeeCount),
        meetingName,
        reservedBy: currentUser?.username || '',
        participants,
        recurrenceType,
        startDate: date,
        endDate,
        dayOfWeek:
          recurrenceType === 'weekly' || recurrenceType === 'biweekly'
            ? startDateObj.getDay()
            : undefined,
        dayOfMonth: recurrenceType === 'monthly' ? startDateObj.getDate() : undefined,
        intervalDays: recurrenceType === 'custom' ? parseInt(intervalDays) : undefined,
      };

      setLoadingMessage(`定期予約を登録中... (${previewDates.length}件)`);
      try {
        await addRecurringReservation(recurringData, previewDates);
        alert('定期予約を登録しました。');
        navigate('/reservations');
      } catch (err) {
        alert(err instanceof Error ? err.message : '定期予約の登録に失敗しました。');
      } finally {
        setLoadingMessage(null);
      }
    } else {
      setLoadingMessage('予約を登録中...');
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
      } finally {
        setLoadingMessage(null);
      }
    }
  };

  return (
    <div>
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}
      <h2>会議室予約</h2>
      <p>予約対象: <strong>{room.name}</strong> ({room.location} / 定員{room.capacity}名)</p>
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <th>{isRecurring ? '開始日' : '日付'} <span className="req">*</span></th>
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

        <div style={{ margin: '12px 0' }}>
          <label>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />{' '}
            定期予約として登録する
          </label>
        </div>

        {isRecurring && (
          <table className="form-table">
            <tbody>
              <tr>
                <th>繰り返しパターン <span className="req">*</span></th>
                <td>
                  <select
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                  >
                    <option value="weekly">週次（毎週）</option>
                    <option value="biweekly">隔週（1週おき）</option>
                    <option value="monthly">月次（毎月）</option>
                    <option value="custom">カスタム（N日おき）</option>
                  </select>
                </td>
              </tr>
              {recurrenceType === 'custom' && (
                <tr>
                  <th>間隔（日数） <span className="req">*</span></th>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={intervalDays}
                      onChange={(e) => setIntervalDays(e.target.value)}
                      placeholder="1〜365"
                    />
                  </td>
                </tr>
              )}
              <tr>
                <th>終了日 <span className="req">*</span></th>
                <td>
                  <input
                    type="date"
                    value={endDate}
                    min={date || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  {endDateTooFar && (
                    <span style={{ color: 'red', marginLeft: 8 }}>
                      終了日は開始日から1年以内で設定してください。
                    </span>
                  )}
                </td>
              </tr>
              {previewDates.length > 0 && (
                <tr>
                  <th>予約される日</th>
                  <td>
                    {previewDates.map((d) => formatPreviewDate(d)).join('、')}（計{previewDates.length}回）
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <p className="form-hint">※ すべての項目が必須です。</p>
        <div className="form-actions">
          <input type="submit" value={isRecurring ? '定期予約する' : '予約する'} />
          <Link to="/rooms">キャンセル</Link>
        </div>
      </form>
    </div>
  );
}
