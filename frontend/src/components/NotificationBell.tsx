import { FC, useEffect, useRef, useState } from 'react';
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

  // Load from localStorage on mount / user change
  useEffect(() => {
    if (username) setNotifications(load(username));
  }, [username]);

  // Generate / sync notifications based on loan alert state
  useEffect(() => {
    if (!username) return;

    const now = new Date();
    const relevantLoans = isAdmin
      ? loans
      : loans.filter((l) => l.borrowedBy === username);

    const existingLoanIds = new Set(loans.map((l) => l.id));

    setNotifications((prev) => {
      // Remove notifications for loans that no longer exist
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
          const overdueStr = formatElapsed(info.overdueHours ?? 0);
          message = `【延滞】${deviceName} の返却期限を ${overdueStr} 超過しています。`;
          severity = 'error';
        } else if (info.status === 'warning') {
          const minStr = `${info.minutesRemaining ?? 0}分`;
          message = `【まもなく期限】${deviceName} の返却期限まで残り ${minStr} です。`;
          severity = 'warning';
        } else if (info.status === 'longDuration') {
          const elapsed = formatElapsed(info.hoursElapsed);
          message = `【長時間貸出】${deviceName} を ${elapsed} 借り続けています（借用者: ${loan.borrowedBy}）。`;
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

  // Close dropdown on outside click
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
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`通知 (${unreadCount}件未読)`}
        title="通知"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>通知</span>
            {unreadCount > 0 && (
              <button type="button" className="notif-read-all-btn" onClick={markAllRead}>
                全て既読にする
              </button>
            )}
          </div>
          <ul className="notif-list">
            {notifications.length === 0 ? (
              <li className="notif-empty">通知はありません</li>
            ) : (
              [...notifications].reverse().map((n) => (
                <li
                  key={n.id}
                  className={`notif-item notif-item--${n.severity}${n.read ? '' : ' notif-item--unread'}`}
                  onClick={() => markRead(n.id)}
                >
                  <span className="notif-msg">{n.message}</span>
                  <span className="notif-time">{formatTime(n.createdAt)}</span>
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
