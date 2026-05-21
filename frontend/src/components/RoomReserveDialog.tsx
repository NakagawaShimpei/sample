import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { FC, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useDialog } from '../contexts/DialogContext';
import { RecurringOptions, RecurringPatternType } from '../types';
import DayTimeline from './DayTimeline';

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

const toLocalDateStr = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const toLocalTimeStr = (d: Date = new Date()): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const roundUpTo10Min = (): string => {
  const now = new Date();
  const totalMins = now.getHours() * 60 + now.getMinutes();
  return minsToTime(Math.ceil(totalMins / 10) * 10);
};

const nextHalfHourAfter = (startMins: number): string =>
  minsToTime(Math.ceil((startMins + 1) / 30) * 30);

const nextDay = (dateStr: string): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_LABELS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];
const WEEK_ORDINALS = [
  { label: '第1', value: 1 },
  { label: '第2', value: 2 },
  { label: '第3', value: 3 },
  { label: '第4', value: 4 },
  { label: '最終', value: 5 },
];

const initFromDate = (dateStr: string) => {
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

const selectCls =
  'h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50';
const numCls =
  'h-8 w-16 rounded-lg border border-input bg-transparent px-2 py-1 text-sm text-center outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50';

interface Props {
  roomId: string | null;
  onClose: () => void;
}

const RoomReserveDialogContent: FC<{ roomId: string; onClose: () => void }> = ({
  roomId,
  onClose,
}) => {
  const {
    rooms,
    reservations,
    addReservation,
    addRecurringReservation,
    reloadRooms,
    reloadReservations,
  } = useData();
  const { currentUser } = useAuth();
  const dialog = useDialog();

  useEffect(() => {
    reloadRooms();
    reloadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roomReservations = reservations.filter((r) => r.roomId === roomId);
  const room = rooms.find((r) => r.id === roomId);

  const [startDate, setStartDate] = useState(toLocalDateStr);
  const [startTime, setStartTime] = useState(roundUpTo10Min);
  const [endDate, setEndDate] = useState(toLocalDateStr);
  const [endTime, setEndTime] = useState(() =>
    nextHalfHourAfter(timeToMins(roundUpTo10Min())),
  );
  const [isAllDay, setIsAllDay] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState('');
  const [meetingName, setMeetingName] = useState('');
  const [reservedBy] = useState(currentUser?.displayName || '');
  const [participants, setParticipants] = useState('');

  const [isRecurring, setIsRecurring] = useState(false);
  const prevIsRecurring = useRef(false);
  const [patternType, setPatternType] =
    useState<RecurringPatternType>('weekly');

  const [dailyInterval, setDailyInterval] = useState(1);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [weeklyInterval, setWeeklyInterval] = useState(1);
  const [weekDays, setWeekDays] = useState<number[]>([1]);

  const [monthlyInterval, setMonthlyInterval] = useState(1);
  const [monthlySubtype, setMonthlySubtype] = useState<
    'dayOfMonth' | 'dayOfWeek'
  >('dayOfMonth');
  const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState(1);
  const [monthlyWeekOfMonth, setMonthlyWeekOfMonth] = useState(1);
  const [monthlyDayOfWeek, setMonthlyDayOfWeek] = useState(1);

  const [yearlyInterval, setYearlyInterval] = useState(1);
  const [yearlySubtype, setYearlySubtype] = useState<
    'dayOfMonth' | 'dayOfWeek'
  >('dayOfMonth');
  const [yearlyMonth, setYearlyMonth] = useState(1);
  const [yearlyDayOfMonth, setYearlyDayOfMonth] = useState(1);
  const [yearlyWeekOfMonth, setYearlyWeekOfMonth] = useState(1);
  const [yearlyDayOfWeek, setYearlyDayOfWeek] = useState(1);

  const [endType, setEndType] = useState<'endDate' | 'count' | 'noEnd'>(
    'count',
  );
  const [recurEndDate, setRecurEndDate] = useState('');
  const [recurCount, setRecurCount] = useState(10);

  const conflictingIds = useMemo(() => {
    const ids = new Set<string>();
    if (!startDate) return ids;
    const selStart = isAllDay ? 0 : timeToMins(startTime);
    const selEnd = isAllDay ? 1439 : timeToMins(endTime);
    if (!isAllDay && selEnd <= selStart) return ids;
    roomReservations.forEach((r) => {
      if (r.date !== startDate) return;
      const rIsAllDay = r.startTime === '00:00' && r.endTime === '23:59';
      const rStart = rIsAllDay ? 0 : timeToMins(r.startTime);
      const rEnd = rIsAllDay ? 1439 : timeToMins(r.endTime);
      if (selStart < rEnd && selEnd > rStart) ids.add(r.id);
    });
    return ids;
  }, [roomReservations, startDate, startTime, endTime, isAllDay]);

  useEffect(() => {
    if (isRecurring && !prevIsRecurring.current && startDate) {
      const init = initFromDate(startDate);
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
  }, [isRecurring, startDate]);

  const handleStartDateChange = (v: string) => {
    setStartDate(v);
    const effectiveEndDate = endDate < v ? v : endDate;
    if (endDate < v) setEndDate(v);
    if (
      effectiveEndDate === v &&
      !isAllDay &&
      timeToMins(endTime) <= timeToMins(startTime)
    ) {
      setEndTime(minsToTime(timeToMins(startTime) + 10));
    }
  };

  const handleStartTimeChange = (v: string) => {
    if (startDate === toLocalDateStr() && v < toLocalTimeStr()) return;
    setStartTime(v);
    if (
      v &&
      endDate === startDate &&
      !isAllDay &&
      timeToMins(endTime) <= timeToMins(v)
    ) {
      setEndTime(minsToTime(timeToMins(v) + 10));
    }
  };

  const handleEndDateChange = (v: string) => {
    setEndDate(v);
    if (
      v === startDate &&
      !isAllDay &&
      timeToMins(endTime) <= timeToMins(startTime)
    ) {
      setEndTime(minsToTime(timeToMins(startTime) + 10));
    }
  };

  const handleEndTimeChange = (v: string) => {
    if (endDate === startDate && timeToMins(v) <= timeToMins(startTime)) return;
    setEndTime(v);
  };

  const handleAllDayChange = (checked: boolean) => {
    setIsAllDay(checked);
    if (checked) {
      setStartTime('00:00');
      setEndDate(nextDay(startDate));
      setEndTime('00:00');
    } else {
      const start = roundUpTo10Min();
      setStartTime(start);
      setEndDate(startDate);
      setEndTime(nextHalfHourAfter(timeToMins(start)));
    }
  };

  const toggleWeekDay = (dow: number, checked: boolean) => {
    setWeekDays((prev) =>
      checked
        ? [...prev, dow].sort((a, b) => a - b)
        : prev.filter((d) => d !== dow),
    );
  };

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

  const validateRecurring = (): string | null => {
    if (patternType === 'weekly' && weekDays.length === 0)
      return '繰り返す曜日を1つ以上選択してください。';
    if (patternType === 'daily' && !weekdaysOnly && dailyInterval < 1)
      return '間隔は1以上を入力してください。';
    if (endType === 'endDate' && !recurEndDate)
      return '終了日を入力してください。';
    if (endType === 'endDate' && recurEndDate < startDate)
      return '終了日は開始日以降を指定してください。';
    if (endType === 'count' && recurCount < 1)
      return '反復回数は1以上を入力してください。';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !startDate ||
      !endDate ||
      !attendeeCount ||
      !meetingName.trim() ||
      !reservedBy.trim()
    ) {
      await dialog.alert(
        'すべての項目を入力してください。',
        '入力エラー',
        'warning',
      );
      return;
    }
    const today = toLocalDateStr();
    if (startDate < today) {
      await dialog.alert(
        '過去の日付には予約できません。',
        '入力エラー',
        'warning',
      );
      return;
    }
    if (endDate < startDate) {
      await dialog.alert(
        '終了日は開始日以降を指定してください。',
        '入力エラー',
        'warning',
      );
      return;
    }
    if (
      !isAllDay &&
      endDate === startDate &&
      timeToMins(endTime) <= timeToMins(startTime)
    ) {
      await dialog.alert(
        '終了時刻は開始時刻より後にしてください。',
        '入力エラー',
        'warning',
      );
      return;
    }
    const count = Number(attendeeCount);
    if (!Number.isInteger(count) || count < 1) {
      await dialog.alert(
        '参加人数は1以上の整数を入力してください。',
        '入力エラー',
        'warning',
      );
      return;
    }
    if (room && count > room.capacity) {
      await dialog.alert(
        `参加人数（${count}名）が定員（${room.capacity}名）を超えています。`,
        '入力エラー',
        'warning',
      );
      return;
    }

    const base = {
      roomId: room!.id,
      date: startDate,
      startTime: isAllDay ? '00:00' : startTime,
      endTime: isAllDay ? '23:59' : endTime,
      attendeeCount: count,
      meetingName,
      reservedBy: currentUser?.username || '',
      participants,
    };

    if (!isRecurring) {
      try {
        await addReservation(base);
        await dialog.alert('予約しました。', '完了', 'success');
        onClose();
      } catch (err) {
        await dialog.alert(
          '予約に失敗しました: ' + (err instanceof Error ? err.message : ''),
          'エラー',
          'error',
        );
      }
      return;
    }

    const validErr = validateRecurring();
    if (validErr) {
      await dialog.alert(validErr, '入力エラー', 'warning');
      return;
    }

    try {
      const { created, skippedDates } = await addRecurringReservation(
        base,
        buildOpts(),
      );
      if (created === 0) {
        await dialog.alert(
          '予約を作成できませんでした（すべての日程が重複しています）。\n\n重複日程:\n' +
            skippedDates.join('\n'),
          'エラー',
          'error',
        );
        return;
      }
      if (skippedDates.length > 0) {
        await dialog.alert(
          `${created}件の予約を登録しました。\n\n以下の${skippedDates.length}件は重複しているためスキップされました:\n` +
            skippedDates.join('\n'),
          '完了',
          'success',
        );
      } else {
        await dialog.alert(
          `${created}件の予約を登録しました。`,
          '完了',
          'success',
        );
      }
      onClose();
    } catch (err) {
      await dialog.alert(
        '予約に失敗しました: ' + (err instanceof Error ? err.message : ''),
        'エラー',
        'error',
      );
    }
  };

  if (!room) {
    return <p className="text-sm py-4">会議室が見つかりません。</p>;
  }

  return (
    <div className="flex gap-6 h-full overflow-hidden min-h-0">
      <div className="flex-1 min-w-0 overflow-y-auto">
        <p className="text-sm text-muted-foreground mb-4">
          予約対象: <strong>{room.name}</strong>（{room.location} / 定員
          {room.capacity}名）
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[160px_1fr] items-start gap-x-4 gap-y-4">
            <Label className="pt-1.5">
              開始 <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                min={toLocalDateStr()}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-auto"
              />
              <Input
                type="time"
                value={startTime}
                min={
                  startDate === toLocalDateStr() && !isAllDay
                    ? toLocalTimeStr()
                    : undefined
                }
                disabled={isAllDay}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-auto"
              />
              <div className="flex items-center gap-1.5 ml-1">
                <Checkbox
                  checked={isAllDay}
                  onCheckedChange={(v) => handleAllDayChange(v as boolean)}
                  id="all-day-toggle"
                />
                <label
                  htmlFor="all-day-toggle"
                  className="text-sm cursor-pointer select-none"
                >
                  終日
                </label>
              </div>
            </div>

            <Label className="pt-1.5">
              終了 <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-auto"
              />
              <Input
                type="time"
                value={endTime}
                min={endDate === startDate && !isAllDay ? startTime : undefined}
                disabled={isAllDay}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-auto"
              />
              <div className="flex items-center gap-1.5 ml-1">
                <Checkbox
                  checked={isRecurring}
                  onCheckedChange={(v) => setIsRecurring(v as boolean)}
                  id="recurring-toggle"
                />
                <label
                  htmlFor="recurring-toggle"
                  className="text-sm cursor-pointer select-none"
                >
                  繰り返し
                </label>
              </div>
            </div>
          </div>

          {conflictingIds.size > 0 && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle size={14} className="shrink-0" />
              選択した時間帯に重複する予約があります。
            </p>
          )}

          {isRecurring && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
              <fieldset className="border border-slate-300 rounded p-3">
                <legend className="text-xs font-semibold px-1 text-slate-600">
                  パターンの設定
                </legend>
                <div className="flex gap-4 mb-3">
                  {(
                    [
                      'daily',
                      'weekly',
                      'monthly',
                      'yearly',
                    ] as RecurringPatternType[]
                  ).map((pt) => (
                    <label
                      key={pt}
                      className="flex items-center gap-1 text-sm font-medium cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="patternType"
                        value={pt}
                        checked={patternType === pt}
                        onChange={() => setPatternType(pt)}
                        className="accent-slate-700"
                      />
                      {pt === 'daily'
                        ? '日'
                        : pt === 'weekly'
                          ? '週'
                          : pt === 'monthly'
                            ? '月'
                            : '年'}
                    </label>
                  ))}
                </div>

                {patternType === 'daily' && (
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dailySub"
                        checked={!weekdaysOnly}
                        onChange={() => setWeekdaysOnly(false)}
                        className="accent-slate-700"
                      />
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={dailyInterval}
                        onChange={(e) =>
                          setDailyInterval(Number(e.target.value))
                        }
                        disabled={weekdaysOnly}
                        className={numCls}
                      />
                      日ごとに繰り返す
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dailySub"
                        checked={weekdaysOnly}
                        onChange={() => setWeekdaysOnly(true)}
                        className="accent-slate-700"
                      />
                      全ての平日
                    </label>
                  </div>
                )}

                {patternType === 'weekly' && (
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      間隔:
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={weeklyInterval}
                        onChange={(e) =>
                          setWeeklyInterval(Number(e.target.value))
                        }
                        className={numCls}
                      />
                      週ごとに繰り返す
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-slate-600">繰り返す曜日:</span>
                      {DAY_LABELS.map((label, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Checkbox
                            checked={weekDays.includes(i)}
                            onCheckedChange={(v) =>
                              toggleWeekDay(i, v as boolean)
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {patternType === 'monthly' && (
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      間隔:
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={monthlyInterval}
                        onChange={(e) =>
                          setMonthlyInterval(Number(e.target.value))
                        }
                        className={numCls}
                      />
                      ヶ月ごとに繰り返す
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="monthlySub"
                        checked={monthlySubtype === 'dayOfMonth'}
                        onChange={() => setMonthlySubtype('dayOfMonth')}
                        className="accent-slate-700"
                      />
                      毎月
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={monthlyDayOfMonth}
                        onChange={(e) =>
                          setMonthlyDayOfMonth(Number(e.target.value))
                        }
                        disabled={monthlySubtype !== 'dayOfMonth'}
                        className={numCls}
                      />
                      日
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="monthlySub"
                        checked={monthlySubtype === 'dayOfWeek'}
                        onChange={() => setMonthlySubtype('dayOfWeek')}
                        className="accent-slate-700"
                      />
                      毎月
                      <select
                        value={monthlyWeekOfMonth}
                        onChange={(e) =>
                          setMonthlyWeekOfMonth(Number(e.target.value))
                        }
                        disabled={monthlySubtype !== 'dayOfWeek'}
                        className={selectCls}
                      >
                        {WEEK_ORDINALS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={monthlyDayOfWeek}
                        onChange={(e) =>
                          setMonthlyDayOfWeek(Number(e.target.value))
                        }
                        disabled={monthlySubtype !== 'dayOfWeek'}
                        className={selectCls}
                      >
                        {DAY_LABELS.map((label, i) => (
                          <option key={i} value={i}>
                            {label}曜日
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {patternType === 'yearly' && (
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      間隔:
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={yearlyInterval}
                        onChange={(e) =>
                          setYearlyInterval(Number(e.target.value))
                        }
                        className={numCls}
                      />
                      年ごとに繰り返す
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="yearlySub"
                        checked={yearlySubtype === 'dayOfMonth'}
                        onChange={() => setYearlySubtype('dayOfMonth')}
                        className="accent-slate-700"
                      />
                      <select
                        value={yearlyMonth}
                        onChange={(e) => setYearlyMonth(Number(e.target.value))}
                        disabled={yearlySubtype !== 'dayOfMonth'}
                        className={selectCls}
                      >
                        {MONTH_LABELS.map((label, i) => (
                          <option key={i + 1} value={i + 1}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={yearlyDayOfMonth}
                        onChange={(e) =>
                          setYearlyDayOfMonth(Number(e.target.value))
                        }
                        disabled={yearlySubtype !== 'dayOfMonth'}
                        className={numCls}
                      />
                      日
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="yearlySub"
                        checked={yearlySubtype === 'dayOfWeek'}
                        onChange={() => setYearlySubtype('dayOfWeek')}
                        className="accent-slate-700"
                      />
                      <select
                        value={yearlyMonth}
                        onChange={(e) => setYearlyMonth(Number(e.target.value))}
                        disabled={yearlySubtype !== 'dayOfWeek'}
                        className={selectCls}
                      >
                        {MONTH_LABELS.map((label, i) => (
                          <option key={i + 1} value={i + 1}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={yearlyWeekOfMonth}
                        onChange={(e) =>
                          setYearlyWeekOfMonth(Number(e.target.value))
                        }
                        disabled={yearlySubtype !== 'dayOfWeek'}
                        className={selectCls}
                      >
                        {WEEK_ORDINALS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={yearlyDayOfWeek}
                        onChange={(e) =>
                          setYearlyDayOfWeek(Number(e.target.value))
                        }
                        disabled={yearlySubtype !== 'dayOfWeek'}
                        className={selectCls}
                      >
                        {DAY_LABELS.map((label, i) => (
                          <option key={i} value={i}>
                            {label}曜日
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </fieldset>

              <fieldset className="border border-slate-300 rounded p-3">
                <legend className="text-xs font-semibold px-1 text-slate-600">
                  期間の設定
                </legend>
                <div className="space-y-2 text-sm">
                  <p>
                    開始日:{' '}
                    <strong>{startDate || '（日付を選択してください）'}</strong>
                  </p>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endType"
                      value="endDate"
                      checked={endType === 'endDate'}
                      onChange={() => setEndType('endDate')}
                      className="accent-slate-700"
                    />
                    終了日:
                    <Input
                      type="date"
                      value={recurEndDate}
                      onChange={(e) => setRecurEndDate(e.target.value)}
                      disabled={endType !== 'endDate'}
                      min={startDate}
                      className="w-auto"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endType"
                      value="count"
                      checked={endType === 'count'}
                      onChange={() => setEndType('count')}
                      className="accent-slate-700"
                    />
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={recurCount}
                      onChange={(e) => setRecurCount(Number(e.target.value))}
                      disabled={endType !== 'count'}
                      className={numCls}
                    />
                    回後に終了
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endType"
                      value="noEnd"
                      checked={endType === 'noEnd'}
                      onChange={() => setEndType('noEnd')}
                      className="accent-slate-700"
                    />
                    終了日未定
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          <div className="grid grid-cols-[160px_1fr] items-start gap-x-4 gap-y-4">
            <Label className="pt-1.5">
              人数 <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max={room.capacity}
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(e.target.value)}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">
                （定員: {room.capacity}名）
              </span>
            </div>

            <Label className="pt-1.5">
              会議名 <span className="text-destructive font-bold">*</span>
            </Label>
            <Input
              type="text"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
            />

            <Label className="pt-1.5">
              予約者名 <span className="text-destructive font-bold">*</span>
            </Label>
            <Input
              type="text"
              value={reservedBy}
              readOnly
              className="bg-muted"
            />

            <Label className="pt-1.5">
              参加者{' '}
              <span className="text-xs text-muted-foreground">（任意）</span>
            </Label>
            <Textarea
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            ※ 参加者以外の項目は必須です。
          </p>
          <div className="flex items-center gap-3">
            <Button type="submit">
              {isRecurring ? '繰り返し予約する' : '予約する'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        </form>
      </div>

      <div
        ref={(el) => { if (el) el.scrollTop = el.scrollHeight * 0.6; }}
        className="shrink-0 pt-9 overflow-y-auto overflow-x-hidden"
      >
        <DayTimeline
          reservations={roomReservations}
          date={startDate}
          previewStart={isAllDay ? '00:00' : startTime}
          previewEnd={isAllDay ? '23:59' : endTime}
          isAllDay={isAllDay}
          conflictingIds={conflictingIds}
        />
      </div>
    </div>
  );
};

const RoomReserveDialog: FC<Props> = ({ roomId, onClose }) => {
  return (
    <Dialog
      open={!!roomId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-5xl h-[90vh] overflow-hidden grid-rows-[auto_1fr]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">会議室予約</DialogTitle>
        </DialogHeader>
        {roomId && (
          <RoomReserveDialogContent
            key={roomId}
            roomId={roomId}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoomReserveDialog;
