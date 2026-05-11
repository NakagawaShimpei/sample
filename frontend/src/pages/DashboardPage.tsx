import { FC, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api';
import { useData } from '../contexts/DataContext';
import { LoanHistory, ReservationHistory } from '../types';

const COLOR_PRIMARY = '#003366';
const COLOR_ACCENT = '#0066cc';
const COLOR_WARN = '#cc3333';
const COLOR_GREEN = '#336633';
const COLOR_PURPLE = '#663399';
const COLOR_ORANGE = '#cc6600';
const COLOR_TEAL = '#336699';
const PIE_COLORS = [COLOR_GREEN, COLOR_WARN, COLOR_ACCENT];

const CHART_H = 175;
const MARGIN = { top: 4, right: 16, bottom: 4, left: -16 };
const MARGIN_H = { top: 4, right: 24, bottom: 4, left: 4 };

function countBy<T>(
  arr: T[],
  key: (x: T) => string,
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  arr.forEach((x) => {
    const k = key(x);
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function localWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: '1px solid #aaa',
        background: '#fafafa',
        padding: '8px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: COLOR_PRIMARY,
          borderBottom: '1px solid #ddd',
          paddingBottom: '4px',
          marginBottom: '6px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

const DashboardPage: FC = () => {
  const { rooms, reservations, loans } = useData();
  const [resHist, setResHist] = useState<ReservationHistory[]>([]);
  const [loanHist, setLoanHist] = useState<LoanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listReservationHistory(), api.listLoanHistory()])
      .then(([rh, lh]) => {
        setResHist(rh);
        setLoanHist(lh);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'データ取得失敗'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div style={{ color: COLOR_WARN }}>エラー: {error}</div>;

  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));
  const roomLabel = (id: string) => roomMap.get(id) ?? id;

  // ── 全予約データ（履歴 + 現在の予約）を結合 ──────────────
  const allRes = [
    ...resHist,
    ...reservations.map((r) => ({ ...r, status: 'scheduled' as const })),
  ];

  // ── 予約集計 ──────────────────────────────────────────
  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  ];
  const timeData = timeSlots.map((t) => ({
    name: t,
    value: allRes.filter((r) => r.startTime === t).length,
  }));

  const weekdays = ['月', '火', '水', '木', '金'];
  const weekdayData = weekdays.map((day, i) => ({
    name: day,
    value: allRes.filter((r) => localWeekday(r.date) === i + 1).length,
  }));

  // ステータス: 履歴は完了/キャンセル、現在の予約は「予定」
  const statusData = [
    {
      name: '完了',
      value: resHist.filter((r) => r.status === 'completed').length,
    },
    {
      name: 'キャンセル',
      value: resHist.filter((r) => r.status === 'cancelled').length,
    },
    { name: '予定', value: reservations.length },
  ];

  const roomUsageData = countBy(allRes, (r) => roomLabel(r.roomId)).slice(0, 8);

  const meetingData = countBy(allRes, (r) => r.meetingName).slice(0, 8);

  const userResData = countBy(allRes, (r) => r.reservedBy);

  // キャンセル率は履歴データのみ（ステータスが確定しているもの）
  const roomCancelData = (() => {
    const map = new Map<string, { total: number; cancelled: number }>();
    resHist.forEach((r) => {
      const name = roomLabel(r.roomId);
      const prev = map.get(name) ?? { total: 0, cancelled: 0 };
      map.set(name, {
        total: prev.total + 1,
        cancelled: prev.cancelled + (r.status === 'cancelled' ? 1 : 0),
      });
    });
    return Array.from(map.entries())
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({
        name,
        rate: Math.round((v.cancelled / v.total) * 100),
      }))
      .sort((a, b) => b.rate - a.rate);
  })();

  // ── 貸出集計 ──────────────────────────────────────────
  // 貸出時間分布は返却済みの履歴のみ（現在貸出中は durationHours 未確定）
  const durationBuckets = [
    { name: '〜2h', min: 0, max: 2 },
    { name: '3〜5h', min: 3, max: 5 },
    { name: '6〜8h', min: 6, max: 8 },
    { name: '9〜24h', min: 9, max: 24 },
    { name: '25h+', min: 25, max: Infinity },
  ];
  const durationData = durationBuckets.map((b) => ({
    name: b.name,
    value: loanHist.filter(
      (l) => l.durationHours >= b.min && l.durationHours <= b.max,
    ).length,
  }));

  // ユーザー別貸出回数: 履歴 + 現在貸出中を合算
  const allLoanUsers = [
    ...loanHist.map((l) => ({ borrowedBy: l.borrowedBy })),
    ...loans.map((l) => ({ borrowedBy: l.borrowedBy })),
  ];
  const userLoanData = countBy(allLoanUsers, (l) => l.borrowedBy);

  return (
    <div>
      <h2>管理ダッシュボード</h2>
      <p style={{ color: '#666', fontSize: '11px', margin: '0 0 12px' }}>
        予約: 履歴 {resHist.length} 件 + 現在 {reservations.length}{' '}
        件　／　貸出: 履歴 {loanHist.length} 件 + 現在 {loans.length} 件
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}
      >
        {/* 1. 時間帯別予約数 */}
        <ChartCard title="時間帯別予約数">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={timeData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_PRIMARY} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. 曜日別予約数 */}
        <ChartCard title="曜日別予約数">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={weekdayData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_TEAL} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. 予約ステータス */}
        <ChartCard title="予約ステータス（完了 vs キャンセル）">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                outerRadius={62}
                label={({ name, value, percent }) =>
                  `${name} ${value}件 (${Math.round((percent ?? 0) * 100)}%)`
                }
                labelLine={false}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. 会議室利用回数 Top8 */}
        <ChartCard title="会議室利用回数 Top 8">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={roomUsageData} layout="vertical" margin={MARGIN_H}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 9 }}
                width={64}
              />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_PRIMARY} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. 会議種別件数 */}
        <ChartCard title="会議種別件数">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={meetingData} layout="vertical" margin={MARGIN_H}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 9 }}
                width={64}
              />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_ACCENT} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. ユーザー別予約数 */}
        <ChartCard title="ユーザー別予約数">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={userResData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_TEAL} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 7. 部屋別キャンセル率 */}
        <ChartCard title="部屋別キャンセル率（3件以上の部屋）">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={roomCancelData} layout="vertical" margin={MARGIN_H}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 9 }}
                domain={[0, 100]}
                unit="%"
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 9 }}
                width={64}
              />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill={COLOR_WARN} name="キャンセル率" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 8. 貸出時間分布 */}
        <ChartCard title="貸出時間分布">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={durationData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_ORANGE} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 9. ユーザー別貸出回数 */}
        <ChartCard title="ユーザー別貸出回数">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={userLoanData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_PURPLE} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default DashboardPage;
