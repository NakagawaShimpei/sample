import { reservationRepository } from '../repositories/ReservationRepository';
import { RecurringOptions, Reservation } from '../types';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function hasOverlap(a: Reservation, b: Omit<Reservation, 'id'>): boolean {
  if (a.roomId !== b.roomId || a.date !== b.date) return false;
  const aStart = toMinutes(a.startTime);
  const aEnd = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd = toMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

function generateGroupId(): string {
  return 'rg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** month0 は JS の 0-indexed 月 */
function getNthWeekdayOfMonth(
  year: number,
  month0: number,
  weekOfMonth: number,
  dayOfWeek: number,
): Date | null {
  if (weekOfMonth === 5) {
    // 最終 occurrence
    const last = new Date(year, month0 + 1, 0);
    let offset = last.getDay() - dayOfWeek;
    if (offset < 0) offset += 7;
    last.setDate(last.getDate() - offset);
    return last;
  }
  const first = new Date(year, month0, 1);
  let offset = dayOfWeek - first.getDay();
  if (offset < 0) offset += 7;
  const targetDay = 1 + offset + (weekOfMonth - 1) * 7;
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  if (targetDay > daysInMonth) return null;
  return new Date(year, month0, targetDay);
}

const MAX_NO_END = 52;

function generateDates(baseDate: string, opts: RecurringOptions): string[] {
  const start = new Date(baseDate + 'T00:00:00');
  const maxCount =
    opts.endType === 'count' ? Math.min(opts.count!, 365) : MAX_NO_END;
  const endLimit =
    opts.endType === 'endDate' && opts.endDate
      ? new Date(opts.endDate + 'T23:59:59')
      : null;

  const result: string[] = [];
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const push = (d: Date): boolean => {
    if (d < start) return true; // skip, keep going
    if (endLimit && d > endLimit) return false; // stop
    if (result.length >= maxCount) return false; // stop
    result.push(fmt(d));
    return true;
  };

  if (opts.patternType === 'daily') {
    let cur = new Date(start);
    for (let safety = 0; result.length < maxCount && safety < 10000; safety++) {
      const dow = cur.getDay();
      if (!opts.weekdaysOnly || (dow !== 0 && dow !== 6)) {
        if (!push(new Date(cur))) break;
      }
      cur.setDate(cur.getDate() + (opts.weekdaysOnly ? 1 : opts.dailyInterval));
    }
  } else if (opts.patternType === 'weekly') {
    if (opts.weekDays.length === 0) return result;
    const sorted = [...opts.weekDays].sort((a, b) => a - b);
    const sunday = new Date(start);
    sunday.setDate(start.getDate() - start.getDay());

    outer: for (let safety = 0; result.length < maxCount && safety < 10000; safety++) {
      for (const dow of sorted) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + dow);
        if (d < start) continue;
        if (endLimit && d > endLimit) break outer;
        if (result.length >= maxCount) break outer;
        result.push(fmt(d));
      }
      sunday.setDate(sunday.getDate() + 7 * opts.weeklyInterval);
    }
  } else if (opts.patternType === 'monthly') {
    let year = start.getFullYear();
    let month0 = start.getMonth();
    for (let safety = 0; result.length < maxCount && safety < 10000; safety++) {
      let d: Date | null;
      if (opts.monthlySubtype === 'dayOfMonth') {
        const days = new Date(year, month0 + 1, 0).getDate();
        d = new Date(year, month0, Math.min(opts.monthlyDayOfMonth, days));
      } else {
        d = getNthWeekdayOfMonth(
          year,
          month0,
          opts.monthlyWeekOfMonth,
          opts.monthlyDayOfWeek,
        );
      }
      if (d && !push(d)) break;
      month0 += opts.monthlyInterval;
      if (month0 >= 12) {
        year += Math.floor(month0 / 12);
        month0 %= 12;
      }
    }
  } else if (opts.patternType === 'yearly') {
    const month0 = opts.yearlyMonth - 1;
    let year = start.getFullYear();
    for (let safety = 0; result.length < maxCount && safety < 10000; safety++) {
      let d: Date | null;
      if (opts.yearlySubtype === 'dayOfMonth') {
        const days = new Date(year, month0 + 1, 0).getDate();
        d = new Date(year, month0, Math.min(opts.yearlyDayOfMonth, days));
      } else {
        d = getNthWeekdayOfMonth(
          year,
          month0,
          opts.yearlyWeekOfMonth,
          opts.yearlyDayOfWeek,
        );
      }
      if (d && !push(d)) break;
      year += opts.yearlyInterval;
    }
  }

  return result;
}

const DAY_JA = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_JA = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];
const WEEK_ORD = ['', '第1', '第2', '第3', '第4', '最終'];

function describePattern(opts: RecurringOptions): string {
  switch (opts.patternType) {
    case 'daily':
      if (opts.weekdaysOnly) return '毎平日';
      return opts.dailyInterval === 1 ? '毎日' : `${opts.dailyInterval}日ごと`;

    case 'weekly': {
      const days = [...opts.weekDays]
        .sort()
        .map((d) => DAY_JA[d] + '曜')
        .join('・');
      return opts.weeklyInterval === 1
        ? `毎週 ${days}`
        : `${opts.weeklyInterval}週ごと ${days}`;
    }

    case 'monthly': {
      const p =
        opts.monthlyInterval === 1 ? '毎月' : `${opts.monthlyInterval}ヶ月ごと`;
      if (opts.monthlySubtype === 'dayOfMonth')
        return `${p} ${opts.monthlyDayOfMonth}日`;
      return `${p} ${WEEK_ORD[opts.monthlyWeekOfMonth]}${DAY_JA[opts.monthlyDayOfWeek]}曜日`;
    }

    case 'yearly': {
      const p =
        opts.yearlyInterval === 1 ? '毎年' : `${opts.yearlyInterval}年ごと`;
      const m = MONTH_JA[opts.yearlyMonth - 1];
      if (opts.yearlySubtype === 'dayOfMonth')
        return `${p} ${m}${opts.yearlyDayOfMonth}日`;
      return `${p} ${m}${WEEK_ORD[opts.yearlyWeekOfMonth]}${DAY_JA[opts.yearlyDayOfWeek]}曜日`;
    }

    default:
      return '繰り返し';
  }
}

const reservationService = {
  findAll(): Reservation[] {
    return reservationRepository.findAll();
  },

  async create(data: Omit<Reservation, 'id'>): Promise<Reservation> {
    const existing = reservationRepository.findAll();
    const conflict = existing.find((r) => hasOverlap(r, data));
    if (conflict) {
      throw Object.assign(new Error('指定の日時はすでに予約が入っています'), {
        status: 409,
      });
    }
    return reservationRepository.create(data);
  },

  async createRecurring(
    data: Omit<Reservation, 'id' | 'recurringGroupId' | 'recurringPattern'>,
    opts: RecurringOptions,
  ): Promise<{ created: Reservation[]; skipped: number }> {
    const dates = generateDates(data.date, opts);
    const recurringGroupId = generateGroupId();
    const recurringPattern = describePattern(opts);
    const created: Reservation[] = [];
    let skipped = 0;

    for (const date of dates) {
      const candidate = { ...data, date, recurringGroupId, recurringPattern };
      const existing = reservationRepository.findAll();
      const conflict = existing.find((r) => hasOverlap(r, candidate));
      if (conflict) {
        skipped++;
        continue;
      }
      created.push(await reservationRepository.create(candidate));
    }

    return { created, skipped };
  },

  async delete(id: string): Promise<void> {
    await reservationRepository.delete(id);
  },

  async deleteGroup(groupId: string): Promise<void> {
    await reservationRepository.deleteWhere(
      (r) => r.recurringGroupId === groupId,
    );
  },
};

export default reservationService;
