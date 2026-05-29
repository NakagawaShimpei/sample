import { FC, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart2,
  Building2,
  CalendarDays,
  Laptop,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getLoanAlertInfo } from '../utils/loanAlerts';
import ChatPanel from './ChatPanel';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const NavItem: FC<NavItemProps> = ({ to, icon, children }) => {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg mx-2 text-sm transition-colors',
        active
          ? 'bg-white/15 text-white font-medium'
          : 'text-slate-400 hover:text-slate-100 hover:bg-white/8',
      )}
    >
      <span className={cn('shrink-0', active ? 'text-white' : 'text-slate-500')}>{icon}</span>
      {children}
    </Link>
  );
};

const NavSection: FC<{ label: string }> = ({ label }) => (
  <p className="px-5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600 select-none">
    {label}
  </p>
);

const ICON_SIZE = 15;

const Layout: FC = () => {
  const { currentUser, logout } = useAuth();
  const { loading, error, loans, devices, reloadLoans, reloadDevices } = useData();

  useEffect(() => {
    if (currentUser) {
      reloadLoans();
      reloadDevices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.username]);

  const isAdmin = currentUser?.role === 'admin';
  const [overdueBannerDismissed, setOverdueBannerDismissed] = useState(false);

  const overdueLoans = loans.filter(
    (l) =>
      l.borrowedBy === currentUser?.username &&
      getLoanAlertInfo(l).status === 'overdue',
  );
  const overdueDeviceNames = overdueLoans.map((l) => {
    const d = devices.find((dev) => dev.id === l.deviceId);
    return d?.name ?? '(不明なデバイス)';
  });
  const showOverdueBanner = !overdueBannerDismissed && overdueLoans.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── 左サイドバー ── */}
      <aside className="w-56 shrink-0 bg-zinc-950 flex flex-col border-r border-white/5">
        {/* ロゴ */}
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600">
            <BarChart2 size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">WE サンプルアプリ</span>
        </div>

        <Separator className="bg-white/8" />

        {/* メインナビ */}
        <nav className="flex-1 py-2">
          <NavSection label="会議室" />
          <NavItem to="/rooms" icon={<Building2 size={ICON_SIZE} />}>会議室一覧</NavItem>
          <NavItem to="/reservations" icon={<CalendarDays size={ICON_SIZE} />}>予約一覧</NavItem>
          {isAdmin && (
            <NavItem to="/rooms/register" icon={<PlusCircle size={ICON_SIZE} />}>会議室登録</NavItem>
          )}

          <NavSection label="デバイス" />
          <NavItem to="/devices" icon={<Laptop size={ICON_SIZE} />}>デバイス一覧</NavItem>
          {isAdmin && (
            <NavItem to="/devices/register" icon={<PlusCircle size={ICON_SIZE} />}>デバイス登録</NavItem>
          )}

          {isAdmin && (
            <>
              <NavSection label="ユーザー" />
              <NavItem to="/users" icon={<Users size={ICON_SIZE} />}>ユーザー一覧</NavItem>
              <NavItem to="/users/register" icon={<UserPlus size={ICON_SIZE} />}>ユーザー登録</NavItem>

              <NavSection label="分析" />
              <NavItem to="/dashboard" icon={<LayoutDashboard size={ICON_SIZE} />}>ダッシュボード</NavItem>
            </>
          )}
        </nav>

        {/* 下部固定エリア */}
        <div className="shrink-0">
          <Separator className="bg-white/8" />

          {/* 設定 */}
          <div className="py-2">
            <NavItem to="/setup" icon={<Settings size={ICON_SIZE} />}>設定</NavItem>
          </div>

          <Separator className="bg-white/8" />

          {/* ユーザー情報 */}
          <div className="px-3 py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{currentUser?.displayName}</p>
              <p className="text-[11px] text-slate-500">
                {currentUser?.role === 'admin' ? '管理者' : '利用者'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={logout}
                className="text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                title="ログアウト"
              >
                <LogOut size={15} />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── メインコンテンツ ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {showOverdueBanner && (
          <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 shrink-0">
            <AlertDescription className="flex items-center justify-between text-destructive">
              <span>
                返却期限を超過しているデバイスが {overdueLoans.length}件 あります:{' '}
                {overdueDeviceNames.join('、')}
              </span>
              <button
                type="button"
                className="ml-4 font-bold hover:opacity-70 cursor-pointer"
                onClick={() => setOverdueBannerDismissed(true)}
                aria-label="閉じる"
              >
                ×
              </button>
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 shrink-0">
            <AlertDescription className="text-destructive">エラー: {error}</AlertDescription>
          </Alert>
        )}
        {loading && (
          <div className="px-4 py-1.5 text-xs text-amber-700 bg-amber-50 border-b border-amber-200 shrink-0">
            読み込み中...
          </div>
        )}

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ChatPanel />
    </div>
  );
};

export default Layout;
