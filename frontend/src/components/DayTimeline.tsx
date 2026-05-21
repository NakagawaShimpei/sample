import { FC } from 'react';
import { Reservation } from '../types';

const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const PX_PER_HOUR = 44;
const TOTAL_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

const toMins = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const timeToTop = (timeStr: string): number => {
  const mins = clamp(toMins(timeStr), START_HOUR * 60, END_HOUR * 60);
  return ((mins - START_HOUR * 60) / 60) * PX_PER_HOUR;
};

const timeToHeight = (startStr: string, endStr: string): number => {
  const startMins = clamp(toMins(startStr), START_HOUR * 60, END_HOUR * 60);
  const endMins = clamp(toMins(endStr), START_HOUR * 60, END_HOUR * 60);
  return Math.max(4, ((endMins - startMins) / 60) * PX_PER_HOUR);
};

interface DayTimelineProps {
  reservations: Reservation[];
  date: string;
  previewStart: string;
  previewEnd: string;
  isAllDay: boolean;
  conflictingIds: Set<string>;
}

const DayTimeline: FC<DayTimelineProps> = ({
  reservations,
  date,
  previewStart,
  previewEnd,
  isAllDay,
  conflictingIds,
}) => {
  const dayReservations = reservations.filter((r) => r.date === date);

  const previewTop = isAllDay ? 0 : timeToTop(previewStart);
  const previewHeight = isAllDay
    ? TOTAL_HEIGHT
    : timeToHeight(previewStart, previewEnd);
  const hasPreview = isAllDay || (previewStart && previewEnd && toMins(previewEnd) > toMins(previewStart));

  return (
    <div className="shrink-0 w-44">
      <div className="relative border border-border rounded-lg overflow-hidden bg-white select-none" style={{ height: TOTAL_HEIGHT }}>
        {/* 時間グリッド */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const hour = START_HOUR + i;
          const top = i * PX_PER_HOUR;
          return (
            <div key={hour} className="absolute left-0 right-0 flex items-center" style={{ top }}>
              <span className="text-[10px] text-muted-foreground w-8 text-right pr-1 leading-none shrink-0">
                {String(hour).padStart(2, '0')}:00
              </span>
              <div className="flex-1 border-t border-border/50" />
            </div>
          );
        })}

        {/* 予約ブロック */}
        {dayReservations.map((r) => {
          const isAllDayRes = r.startTime === '00:00' && r.endTime === '23:59';
          const top = isAllDayRes ? 0 : timeToTop(r.startTime);
          const height = isAllDayRes ? TOTAL_HEIGHT : timeToHeight(r.startTime, r.endTime);
          return (
            <div
              key={r.id}
              className={`absolute left-8 right-1 rounded border px-1 overflow-hidden ${conflictingIds.has(r.id) ? 'bg-red-400/70 border-red-500/50' : 'bg-slate-400/70 border-slate-500/50'}`}
              style={{ top, height: Math.max(height, 4) }}
              title={`${r.meetingName}（${r.startTime}–${r.endTime}）`}
            >
              {height >= 16 && (
                <p className="text-[9px] text-white font-medium leading-tight truncate mt-0.5">
                  {r.meetingName}
                </p>
              )}
              {height >= 28 && (
                <p className="text-[9px] text-white/80 leading-tight">
                  {r.startTime}–{r.endTime}
                </p>
              )}
            </div>
          );
        })}

        {/* 入力中プレビュー */}
        {hasPreview && (
          <div
            className="absolute left-8 right-1 rounded bg-blue-400/60 border border-blue-500/70 px-1 overflow-hidden pointer-events-none"
            style={{ top: previewTop, height: Math.max(previewHeight, 4) }}
          >
            {previewHeight >= 16 && (
              <p className="text-[9px] text-blue-900 font-medium leading-tight mt-0.5">
                {isAllDay ? '終日' : `${previewStart}–${previewEnd}`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayTimeline;
