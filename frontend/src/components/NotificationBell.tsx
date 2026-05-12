import { FC, useEffect, useRef, useState } from 'react';
import { BellIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatElapsed, getLoanAlertInfo } from '../utils/loanAlerts';

interface AppNotification {
  id: string;
  loanKey: string;
  message: string;
  createdAt: string;
  read: boolean;
  severity: 'error' | 'warning' | 'info';
}

function storageKey(username: string) {
  return `we-notifications-${username}`;
}

function load(username: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(storageKey(username));
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function save(username: string, items: AppNotification[]) {
  localStorage.setItem(storageKey(username), JSON.stringify(items));
}

const NotificationBell: FC = () => {
  const { currentUser } = useAuth();
  const { loans, devices } = useData();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const username = currentUser?.username ?? '';
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (username) setNotifications(load(username));
  }, [username]);

  useEffect(() => {
    if (!username) return;
    const now = new Date();
    const relevantLoans = isAdmin ? loans : loans.filter((l) => l.borrowedBy === username);
    const existingLoanIds = new Set(loans.map((l) => l.id));

    setNotifications((prev) => {
      const pruned = prev.filter((n) => {
        const loanId = n.loanKey.split('-alert-')[0];
        return existingLoanIds.has(loanId);
      });
      const existingKeys = new Set(pruned.map((n) => n.loanKey));
      const toAdd: AppNotification[] = [];

      for (const loan of relevantLoans) {
        const info = getLoanAlertInfo(loan, now);
        if (info.status === 'normal') continue;
        const loanKey = `${loan.id}-alert-${info.status}`;
        if (existingKeys.has(loanKey)) continue;

        const device = devices.find((d) => d.id === loan.deviceId);
        const deviceName = device?.name ?? '(不明なデバイス)';
        let message = '';
        let severity: AppNotification['severity'] = 'info';

        if (info.status === 'overdue') {
          message = `【延滞】${deviceName} の返却期限を ${formatElapsed(info.overdueHours ?? 0)} 超過しています。`;
          severity = 'error';
        } else if (info.status === 'warning') {
          message = `【まもなく期限】${deviceName} の返却期限まで残り ${info.minutesRemaining ?? 0}分 です。`;
          severity = 'warning';
        } else if (info.status === 'longDuration') {
          message = `【長時間貸出】${deviceName} を ${formatElapsed(info.hoursElapsed)} 借り続けています（借用者: ${loan.borrowedBy}）。`;
          severity = 'warning';
        }

        toAdd.push({
          id: `${loanKey}-${Date.now()}`,
          loanKey,
          message,
          createdAt: now.toISOString(),
          read: false,
          severity,
        });
      }

      const next = [...pruned, ...toAdd];
      save(username, next);
      return next;
    });
  }, [loans, devices, username, isAdmin]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      save(username, next);
      return next;
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(username, next);
      return next;
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative text-white hover:text-white hover:bg-white/20"
        onClick={() => setOpen((o) => !o)}
        aria-label={`通知 (${unreadCount}件未読)`}
        title="通知"
      >
        <BellIcon className="size-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 text-[9px] flex items-center justify-center rounded-full"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 text-slate-900">
          <div className="flex justify-between items-center px-3 py-2 bg-slate-100 rounded-t-lg border-b border-slate-200">
            <span className="text-sm font-medium">通知</span>
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={markAllRead}
              >
                全て既読にする
              </Button>
            )}
          </div>
          <ul className="list-none m-0 p-0 max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-slate-400">通知はありません</li>
            ) : (
              [...notifications].reverse().map((n) => (
                <li
                  key={n.id}
                  className={[
                    'px-3 py-2 border-b border-slate-100 cursor-pointer text-xs hover:bg-slate-50',
                    n.read ? '' : 'bg-yellow-50 hover:bg-yellow-100',
                  ].join(' ')}
                  onClick={() => markRead(n.id)}
                >
                  <span
                    className={[
                      'block leading-relaxed',
                      n.severity === 'error' ? 'before:content-["●_"] before:text-red-600' : '',
                      n.severity === 'warning' ? 'before:content-["●_"] before:text-amber-600' : '',
                    ].join(' ')}
                  >
                    {n.message}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {formatTime(n.createdAt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
