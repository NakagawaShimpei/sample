import { FC, FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { RecurringOptions, RecurringPatternType } from '../types';

// ─── 時刻ユーティリティ ────────────────────────────────────────────
const timeToMins = (t: string): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minsToTime = (mins: number): string => {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
};

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 300, 360, 420, 480];

// ─── 定数 ─────────────────────────────────────────────────────────
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEK_ORDINALS: { label: string; value: number }[] = [
  { label: '第1', value: 1 },
  { label: '第2', value: 2 },
  { label: '第3', value: 3 },
  { label: '第4', value: 4 },
  { label: '最終', value: 5 },
];

// ─── 初期値生成 ────────────────────────────────────────────────────
const initFromDate = (dateStr: string): {
  weekDays: number[];
  monthlyDayOfMonth: number;
  monthlyWeekOfMonth: number;
  monthlyDayOfWeek: number;
  yearlyMonth: number;
  yearlyDayOfMonth: number;
  yearlyWeekOfMonth: number;
  yearlyDayOfWeek: number;
} => {
  if (!dateStr) {
    return {
      weekDays: [1],
      monthlyDayOfMonth: 1,
      monthlyWeekOfMonth: 1,
      monthlyDayOfWeek: 1,
      yearlyMonth: 1,
      yearlyDayOfMonth: 1,
      yearlyWeekOfMonth: 1,
      yearlyDayOfWeek: 1,
    };
  }
  const d = new Date(dateStr);
  const dow = d.getDay();
  const dom = d.getDate();
  return {
    weekDays: [dow],
    monthlyDayOfMonth: dom,
    monthlyWeekOfMonth: Math.min(Math.ceil(dom / 7), 4),
    monthlyDayOfWeek: dow,
    yearlyMonth: d.getMonth() + 1,
    yearlyDayOfMonth: dom,
    yearlyWeekOfMonth: Math.min(Math.ceil(dom / 7), 4),
    yearlyDayOfWeek: dow,
  };
};

// ─── コンポーネント ────────────────────────────────────────────────
const RoomReservePage: FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { rooms, addReservation, addRecurringReservation } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const room = rooms.find((r) => r.id === roomId);

  // 基本フォーム
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMins, setDurationMins] = useState(60);
  const [attendeeCount, setAttendeeCount] = useState('');
  const [meetingName, setMeetingName] = useState('');
  const [reservedBy, setReservedBy] = useState(currentUser?.displayName || '');
  const [participants, setParticipants] = useState('');

  // 繰り返し有効フラグ
  const [isRecurring, setIsRecurring] = useState(false);
  const prevIsRecurring = useRef(false);

  // パターン種別
  const [patternType, setPatternType] = useState<RecurringPatternType>('weekly');

  // 日単位
  const [dailyInterval, setDailyInterval] = useState(1);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);

  // 週単位
  const [weeklyInterval, setWeeklyInterval] = useState(1);
  const [weekDays, setWeekDays] = useState<number[]>([1]);

  // 月単位
  const [monthlyInterval, setMonthlyInterval] = useState(1);
  const [monthlySubtype, setMonthlySubtype] = useState<'dayOfMonth' | 'dayOfWeek'>('dayOfMonth');
  const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState(1);
  const [monthlyWeekOfMonth, setMonthlyWeekOfMonth] = useState(1);
  const [monthlyDayOfWeek, setMonthlyDayOfWeek] = useState(1);

  // 年単位
  const [yearlyInterval, setYearlyInterval] = useState(1);
  const [yearlySubtype, setYearlySubtype] = useState<'dayOfMonth' | 'dayOfWeek'>('dayOfMonth');
  const [yearlyMonth, setYearlyMonth] = useState(1);
  const [yearlyDayOfMonth, setYearlyDayOfMonth] = useState(1);
  const [yearlyWeekOfMonth, setYearlyWeekOfMonth] = useState(1);
  const [yearlyDayOfWeek, setYearlyDayOfWeek] = useState(1);

  // 期間
  const [endType, setEndType] = useState<'endDate' | 'count' | 'noEnd'>('count');
  const [recurEndDate, setRecurEndDate] = useState('');
  const [recurCount, setRecurCount] = useState(10);

  // 繰り返しONになった瞬間だけ日付から初期値を設定
  useEffect(() => {
    if (isRecurring && !prevIsRecurring.current && date) {
      const init = initFromDate(date);
      setWeekDays(init.weekDays);
      setMonthlyDayOfMonth(init.monthlyDayOfMonth);
      setMonthlyWeekOfMonth(init.monthlyWeekOfMonth);
      setMonthlyDayOfWeek(init.monthlyDayOfWeek);
      setYearlyMonth(init.yearlyMonth);
      setYearlyDayOfMonth(init.yearlyDayOfMonth);
      setYearlyWeekOfMonth(init.yearlyWeekOfMonth);
      setYearlyDayOfWeek(init.yearlyDayOfWeek);
    }
    prevIsRecurring.current = isRecurring;
  }, [isRecurring, date]);

  // ─── 時刻ハンドラ ─────────────────────────────────────────────
  const handleStartChange = (v: string) => {
    setStartTime(v);
    if (v && durationMins > 0) setEndTime(minsToTime(timeToMins(v) + durationMins));
  };

  const handleEndChange = (v: string) => {
    setEndTime(v);
    if (startTime && v) {
      const diff = timeToMins(v) - timeToMins(startTime);
      if (diff > 0) setDurationMins(diff);
    }
  };

  const handleDurationChange = (mins: number) => {
    setDurationMins(mins);
    if (startTime) setEndTime(minsToTime(timeToMins(startTime) + mins));
  };

  const toggleWeekDay = (dow: number, checked: boolean) => {
    setWeekDays((prev) =>
      checked ? [...prev, dow].sort((a, b) => a - b) : prev.filter((d) => d !== dow),
    );
  };

  // ─── オプション組み立て ───────────────────────────────────────
  const buildOpts = (): RecurringOptions => ({
    patternType,
    dailyInterval,
    weekdaysOnly,
    weeklyInterval,
    weekDays,
    monthlyInterval,
    monthlySubtype,
    monthlyDayOfMonth,
    monthlyWeekOfMonth,
    monthlyDayOfWeek,
    yearlyInterval,
    yearlySubtype,
    yearlyMonth,
    yearlyDayOfMonth,
    yearlyWeekOfMonth,
    yearlyDayOfWeek,
    endType,
    endDate: endType === 'endDate' ? recurEndDate : undefined,
    count: endType === 'count' ? recurCount : undefined,
  });

  // ─── バリデーション ───────────────────────────────────────────
  const validateRecurring = (): string | null => {
    if (patternType === 'weekly' && weekDays.length === 0)
      return '繰り返す曜日を1つ以上選択してください。';
    if (patternType === 'daily' && !weekdaysOnly && dailyInterval < 1)
      return '間隔は1以上を入力してください。';
    if (endType === 'endDate' && !recurEndDate)
      return '終了日を入力してください。';
    if (endType === 'endDate' && recurEndDate < date)
      return '終了日は開始日以降を指定してください。';
    if (endType === 'count' && recurCount < 1)
      return '反復回数は1以上を入力してください。';
    return null;
  };

  // ─── 送信 ────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !attendeeCount || !meetingName || !reservedBy || !participants) {
      alert('すべての項目を入力してください。');
      return;
    }

    const base = {
      roomId: room!.id,
      date,
      startTime,
      endTime,
      attendeeCount: Number(attendeeCount),
      meetingName,
      reservedBy: currentUser?.username || '',
      participants,
    };

    if (!isRecurring) {
      try {
        await addReservation(base);
        alert('予約しました。');
        navigate('/reservations');
      } catch (err) {
        alert('予約に失敗しました: ' + (err instanceof Error ? err.message : ''));
      }
      return;
    }

    const validErr = validateRecurring();
    if (validErr) { alert(validErr); return; }

    try {
      const { created, skipped } = await addRecurringReservation(base, buildOpts());
      alert(
        created === 0
          ? '予約を作成できませんでした（すべて重複のためスキップ）。'
          : skipped > 0
            ? `${created}件の予約を登録しました。（${skipped}件は重複のためスキップ）`
            : `${created}件の予約を登録しました。`,
      );
      navigate('/reservations');
    } catch (err) {
      alert('予約に失敗しました: ' + (err instanceof Error ? err.message : ''));
    }
  };

  if (!room) {
    return (
      <div>
        <p>会議室が見つかりません。</p>
        <Link to="/rooms">会議室一覧に戻る</Link>
      </div>
    );
  }

  // ─── 期間セレクトのオプション ────────────────────────────────
  const durationOptions = DURATION_PRESETS.includes(durationMins)
    ? DURATION_PRESETS
    : [...DURATION_PRESETS, durationMins].sort((a, b) => a - b);

  return (
    <div>
      <h2>会議室予約</h2>
      <p>
        予約対象: <strong>{room.name}</strong>（{room.location} / 定員{room.capacity}名）
      </p>
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            {/* ── 基本情報 ── */}
            <tr>
              <th>日付 <span className="req">*</span></th>
              <td>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>開始時刻 <span className="req">*</span></th>
              <td style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="time" value={startTime} onChange={(e) => handleStartChange(e.target.value)} />
                <label>
                  終了時刻:{' '}
                  <input type="time" value={endTime} onChange={(e) => handleEndChange(e.target.value)} />
                </label>
                <label>
                  期間:{' '}
                  <select
                    value={durationMins}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                  >
                    {durationOptions.map((m) => (
                      <option key={m} value={m}>{formatDuration(m)}</option>
                    ))}
                  </select>
                </label>
              </td>
            </tr>
            <tr>
              <th>人数 <span className="req">*</span></th>
              <td>
                <input type="number" min="1" value={attendeeCount} onChange={(e) => setAttendeeCount(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>会議名 <span className="req">*</span></th>
              <td>
                <input type="text" value={meetingName} onChange={(e) => setMeetingName(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>予約者名 <span className="req">*</span></th>
              <td>
                <input type="text" value={reservedBy} onChange={(e) => setReservedBy(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>参加者 <span className="req">*</span></th>
              <td>
                <textarea value={participants} onChange={(e) => setParticipants(e.target.value)} rows={3} />
              </td>
            </tr>

            {/* ── 繰り返しチェックボックス ── */}
            <tr>
              <th>繰り返し予約</th>
              <td>
                <label>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />{' '}
                  繰り返し予約にする
                </label>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 繰り返し設定パネル ── */}
        {isRecurring && (
          <div className="recur-panel">
            {/* パターンの設定 */}
            <fieldset className="recur-fieldset">
              <legend>パターンの設定</legend>

              {/* パターン種別ラジオ */}
              <div className="recur-pattern-tabs">
                {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringPatternType[]).map((pt) => (
                  <label key={pt} className="recur-tab-label">
                    <input
                      type="radio"
                      name="patternType"
                      value={pt}
                      checked={patternType === pt}
                      onChange={() => setPatternType(pt)}
                    />{' '}
                    {pt === 'daily' ? '日' : pt === 'weekly' ? '週' : pt === 'monthly' ? '月' : '年'}
                  </label>
                ))}
              </div>

              {/* 日単位 */}
              {patternType === 'daily' && (
                <div className="recur-sub">
                  <label>
                    <input
                      type="radio"
                      name="dailySub"
                      checked={!weekdaysOnly}
                      onChange={() => setWeekdaysOnly(false)}
                    />{' '}
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={dailyInterval}
                      onChange={(e) => setDailyInterval(Number(e.target.value))}
                      disabled={weekdaysOnly}
                      className="recur-num"
                    />{' '}
                    日ごとに繰り返す
                  </label>
                  <br />
                  <label>
                    <input
                      type="radio"
                      name="dailySub"
                      checked={weekdaysOnly}
                      onChange={() => setWeekdaysOnly(true)}
                    />{' '}
                    全ての平日
                  </label>
                </div>
              )}

              {/* 週単位 */}
              {patternType === 'weekly' && (
                <div className="recur-sub">
                  <label>
                    間隔:{' '}
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={weeklyInterval}
                      onChange={(e) => setWeeklyInterval(Number(e.target.value))}
                      className="recur-num"
                    />{' '}
                    週ごとに繰り返す
                  </label>
                  <div className="recur-weekdays">
                    <span>繰り返す曜日: </span>
                    {DAY_LABELS.map((label, i) => (
                      <label key={i} className="recur-day-check">
                        <input
                          type="checkbox"
                          checked={weekDays.includes(i)}
                          onChange={(e) => toggleWeekDay(i, e.target.checked)}
                        />{' '}
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 月単位 */}
              {patternType === 'monthly' && (
                <div className="recur-sub">
                  <label>
                    間隔:{' '}
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={monthlyInterval}
                      onChange={(e) => setMonthlyInterval(Number(e.target.value))}
                      className="recur-num"
                    />{' '}
                    ヶ月ごとに繰り返す
                  </label>
                  <br />
                  <label>
                    <input
                      type="radio"
                      name="monthlySub"
                      checked={monthlySubtype === 'dayOfMonth'}
                      onChange={() => setMonthlySubtype('dayOfMonth')}
                    />{' '}
                    毎月{' '}
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={monthlyDayOfMonth}
                      onChange={(e) => setMonthlyDayOfMonth(Number(e.target.value))}
                      disabled={monthlySubtype !== 'dayOfMonth'}
                      className="recur-num"
                    />{' '}
                    日
                  </label>
                  <br />
                  <label>
                    <input
                      type="radio"
                      name="monthlySub"
                      checked={monthlySubtype === 'dayOfWeek'}
                      onChange={() => setMonthlySubtype('dayOfWeek')}
                    />{' '}
                    毎月{' '}
                    <select
                      value={monthlyWeekOfMonth}
                      onChange={(e) => setMonthlyWeekOfMonth(Number(e.target.value))}
                      disabled={monthlySubtype !== 'dayOfWeek'}
                    >
                      {WEEK_ORDINALS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>{' '}
                    <select
                      value={monthlyDayOfWeek}
                      onChange={(e) => setMonthlyDayOfWeek(Number(e.target.value))}
                      disabled={monthlySubtype !== 'dayOfWeek'}
                    >
                      {DAY_LABELS.map((label, i) => (
                        <option key={i} value={i}>{label}曜日</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* 年単位 */}
              {patternType === 'yearly' && (
                <div className="recur-sub">
                  <label>
                    間隔:{' '}
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={yearlyInterval}
                      onChange={(e) => setYearlyInterval(Number(e.target.value))}
                      className="recur-num"
                    />{' '}
                    年ごとに繰り返す
                  </label>
                  <br />
                  <label>
                    <input
                      type="radio"
                      name="yearlySub"
                      checked={yearlySubtype === 'dayOfMonth'}
                      onChange={() => setYearlySubtype('dayOfMonth')}
                    />{' '}
                    <select
                      value={yearlyMonth}
                      onChange={(e) => setYearlyMonth(Number(e.target.value))}
                      disabled={yearlySubtype !== 'dayOfMonth'}
                    >
                      {MONTH_LABELS.map((label, i) => (
                        <option key={i + 1} value={i + 1}>{label}</option>
                      ))}
                    </select>{' '}
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={yearlyDayOfMonth}
                      onChange={(e) => setYearlyDayOfMonth(Number(e.target.value))}
                      disabled={yearlySubtype !== 'dayOfMonth'}
                      className="recur-num"
                    />{' '}
                    日
                  </label>
                  <br />
                  <label>
                    <input
                      type="radio"
                      name="yearlySub"
                      checked={yearlySubtype === 'dayOfWeek'}
                      onChange={() => setYearlySubtype('dayOfWeek')}
                    />{' '}
                    <select
                      value={yearlyMonth}
                      onChange={(e) => setYearlyMonth(Number(e.target.value))}
                      disabled={yearlySubtype !== 'dayOfWeek'}
                    >
                      {MONTH_LABELS.map((label, i) => (
                        <option key={i + 1} value={i + 1}>{label}</option>
                      ))}
                    </select>{' '}
                    <select
                      value={yearlyWeekOfMonth}
                      onChange={(e) => setYearlyWeekOfMonth(Number(e.target.value))}
                      disabled={yearlySubtype !== 'dayOfWeek'}
                    >
                      {WEEK_ORDINALS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>{' '}
                    <select
                      value={yearlyDayOfWeek}
                      onChange={(e) => setYearlyDayOfWeek(Number(e.target.value))}
                      disabled={yearlySubtype !== 'dayOfWeek'}
                    >
                      {DAY_LABELS.map((label, i) => (
                        <option key={i} value={i}>{label}曜日</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </fieldset>

            {/* 期間の設定 */}
            <fieldset className="recur-fieldset">
              <legend>期間の設定</legend>
              <div className="recur-sub">
                <div>
                  開始日: <strong>{date || '（日付を選択してください）'}</strong>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <label>
                    <input
                      type="radio"
                      name="endType"
                      value="endDate"
                      checked={endType === 'endDate'}
                      onChange={() => setEndType('endDate')}
                    />{' '}
                    終了日:{' '}
                    <input
                      type="date"
                      value={recurEndDate}
                      onChange={(e) => setRecurEndDate(e.target.value)}
                      disabled={endType !== 'endDate'}
                      min={date}
                    />
                  </label>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <label>
                    <input
                      type="radio"
                      name="endType"
                      value="count"
                      checked={endType === 'count'}
                      onChange={() => setEndType('count')}
                    />{' '}
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={recurCount}
                      onChange={(e) => setRecurCount(Number(e.target.value))}
                      disabled={endType !== 'count'}
                      className="recur-num"
                    />{' '}
                    回後に終了
                  </label>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <label>
                    <input
                      type="radio"
                      name="endType"
                      value="noEnd"
                      checked={endType === 'noEnd'}
                      onChange={() => setEndType('noEnd')}
                    />{' '}
                    終了日未定
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
        )}

        <p className="form-hint">※ すべての項目が必須です。</p>
        <div className="form-actions">
          <input type="submit" value={isRecurring ? '繰り返し予約する' : '予約する'} />
          <Link to="/rooms">キャンセル</Link>
        </div>
      </form>
    </div>
  );
};

export default RoomReservePage;
