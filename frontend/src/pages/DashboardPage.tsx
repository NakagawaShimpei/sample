import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FC, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

const COLOR_PRIMARY = '#334155';
const COLOR_ACCENT = '#2563eb';
const COLOR_WARN = '#dc2626';
const COLOR_GREEN = '#16a34a';
const COLOR_PURPLE = '#7c3aed';
const COLOR_ORANGE = '#ea580c';
const COLOR_TEAL = '#0891b2';
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
    <Card size="sm">
      <CardHeader className="border-b pb-2">
        <CardTitle className="text-xs">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-sm font-semibold border-l-4 border-slate-500 pl-2 mt-6 mb-3 text-slate-700">
      {label}
    </h3>
  );
}

const fillRateColor = (rate: number) => {
  if (rate >= 70) return COLOR_GREEN;
  if (rate >= 40) return COLOR_ORANGE;
  return COLOR_WARN;
};

const DashboardPage: FC = () => {
  const {
    rooms,
    devices,
    reservations,
    loans,
    reloadRooms,
    reloadDevices,
    reloadReservations,
    reloadLoans,
  } = useData();
  const [resHist, setResHist] = useState<ReservationHistory[]>([]);
  const [loanHist, setLoanHist] = useState<LoanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reloadRooms();
    reloadDevices();
    reloadReservations();
    reloadLoans();
    Promise.all([api.listReservationHistory(), api.listLoanHistory()])
      .then(([rh, lh]) => {
        setResHist(rh);
        setLoanHist(lh);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'データ取得失敗'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return <div className="text-sm text-muted-foreground">読み込み中...</div>;
  if (error)
    return <div className="text-sm text-destructive">エラー: {error}</div>;

  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  const roomLabel = (id: string) => roomMap.get(id)?.name ?? id;

  const allRes = [
    ...resHist,
    ...reservations.map((r) => ({ ...r, status: 'scheduled' as const })),
  ];

  // ── 会議室：既存集計 ──────────────────────────────────────────────

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
  const timeData = timeSlots.map((t) => ({
    name: t,
    value: allRes.filter((r) => r.startTime === t).length,
  }));

  const weekdays = ['月', '火', '水', '木', '金'];
  const weekdayData = weekdays.map((day, i) => ({
    name: day,
    value: allRes.filter((r) => localWeekday(r.date) === i + 1).length,
  }));

  const statusData = [
    { name: '完了', value: resHist.filter((r) => r.status === 'completed').length },
    { name: 'キャンセル', value: resHist.filter((r) => r.status === 'cancelled').length },
    { name: '予定', value: reservations.length },
  ];

  const roomUsageData = countBy(allRes, (r) => roomLabel(r.roomId)).slice(0, 8);
  const meetingData = countBy(allRes, (r) => r.meetingName).slice(0, 8);
  const userResData = countBy(allRes, (r) => r.reservedBy);

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

  // ── 会議室：新規複合分析 ──────────────────────────────────────────

  // 会議種別ごとの平均参加人数 vs 平均部屋定員（空間効率ミスマッチ）
  const meetingEfficiencyData = (() => {
    const map = new Map<string, { totalAttendees: number; totalCapacity: number; count: number }>();
    allRes.forEach((r) => {
      const room = roomMap.get(r.roomId);
      if (!room) return;
      const prev = map.get(r.meetingName) ?? { totalAttendees: 0, totalCapacity: 0, count: 0 };
      map.set(r.meetingName, {
        totalAttendees: prev.totalAttendees + r.attendeeCount,
        totalCapacity: prev.totalCapacity + room.capacity,
        count: prev.count + 1,
      });
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        参加人数: Math.round((v.totalAttendees / v.count) * 10) / 10,
        部屋定員: Math.round((v.totalCapacity / v.count) * 10) / 10,
      }))
      .sort((a, b) => b['部屋定員'] - a['部屋定員'])
      .slice(0, 8);
  })();

  // 部屋ごとの平均充填率（参加人数÷定員）
  const roomFillData = rooms
    .map((room) => {
      const roomRes = allRes.filter((r) => r.roomId === room.id);
      if (roomRes.length === 0) return null;
      const avgFill =
        roomRes.reduce((sum, r) => sum + r.attendeeCount / room.capacity, 0) / roomRes.length;
      return { name: room.name, 充填率: Math.round(avgFill * 100) };
    })
    .filter((x): x is { name: string; 充填率: number } => x !== null)
    .sort((a, b) => a.充填率 - b.充填率);

  // ── デバイス：既存集計 ──────────────────────────────────────────

  const durationBuckets = [
    { name: '〜2h', min: 0, max: 2 },
    { name: '3〜5h', min: 3, max: 5 },
    { name: '6〜8h', min: 6, max: 8 },
    { name: '9〜24h', min: 9, max: 24 },
    { name: '25h+', min: 25, max: Infinity },
  ];
  const durationData = durationBuckets.map((b) => ({
    name: b.name,
    value: loanHist.filter((l) => l.durationHours >= b.min && l.durationHours <= b.max).length,
  }));

  const allLoanUsers = [
    ...loanHist.map((l) => ({ borrowedBy: l.borrowedBy })),
    ...loans.map((l) => ({ borrowedBy: l.borrowedBy })),
  ];
  const userLoanData = countBy(allLoanUsers, (l) => l.borrowedBy);

  // ── デバイス：新規複合分析 ──────────────────────────────────────

  // デバイス種別ごとの貸出件数（履歴＋現在）
  const deviceTypeData = (() => {
    const allByDevice = [
      ...loanHist.map((l) => l.deviceId),
      ...loans.map((l) => l.deviceId),
    ];
    const map = new Map<string, number>();
    allByDevice.forEach((deviceId) => {
      const type = devices.find((d) => d.id === deviceId)?.type ?? 'その他';
      map.set(type, (map.get(type) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  return (
    <div>
      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-2">
        管理ダッシュボード
      </h2>
      <p className="text-xs text-muted-foreground mb-2">
        予約: 履歴 {resHist.length} 件 + 現在 {reservations.length}{' '}
        件　／　貸出: 履歴 {loanHist.length} 件 + 現在 {loans.length} 件
      </p>

      {/* ── 会議室 ── */}
      <SectionHeader label="会議室" />
      <div className="grid grid-cols-3 gap-3">
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

        <ChartCard title="予約ステータス">
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

        <ChartCard title="会議室利用回数 Top 8">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={roomUsageData} layout="vertical" margin={MARGIN_H}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={64} interval={0} />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_PRIMARY} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="会議種別件数">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={meetingData} layout="vertical" margin={MARGIN_H}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={64} interval={0} />
              <Tooltip />
              <Bar dataKey="value" fill={COLOR_ACCENT} name="件数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

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

        <ChartCard title="部屋別キャンセル率">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={roomCancelData} layout="vertical" margin={MARGIN_H}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 9 }} domain={[0, 100]} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={64} interval={0} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill={COLOR_WARN} name="キャンセル率" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 複合分析① 会議種別：参加人数 vs 定員 */}
        <ChartCard title="会議種別：平均参加人数 vs 部屋定員">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={meetingEfficiencyData} layout="vertical" margin={{ ...MARGIN_H, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={64} interval={0} />
              <Tooltip formatter={(v) => `${v} 人`} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
              <Bar dataKey="参加人数" fill={COLOR_ACCENT} />
              <Bar dataKey="部屋定員" fill={COLOR_ORANGE} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 複合分析② 会議室 充填率 */}
        <ChartCard title="会議室 充填率（参加人数÷定員）">
          <p className="text-[9px] text-muted-foreground mb-1">
            <span className="text-green-700">■</span> 70%以上
            <span className="text-orange-600">■</span> 40〜69%
            <span className="text-red-600">■</span> 40%未満
          </p>
          <ResponsiveContainer width="100%" height={CHART_H - 16}>
            <BarChart data={roomFillData} layout="vertical" margin={MARGIN_H}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 9 }} domain={[0, 100]} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={64} interval={0} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="充填率" name="充填率">
                {roomFillData.map((entry, i) => (
                  <Cell key={i} fill={fillRateColor(entry.充填率)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── デバイス ── */}
      <SectionHeader label="デバイス" />
      <div className="grid grid-cols-3 gap-3">
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

        {/* 複合分析③ デバイス種別別貸出件数 */}
        <ChartCard title="デバイス種別 貸出件数">
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={deviceTypeData} layout="vertical" margin={MARGIN_H}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={72} interval={0} />
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
