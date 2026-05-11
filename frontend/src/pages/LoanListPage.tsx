import { FC } from 'react';
import { useData } from '../contexts/DataContext';
import { formatElapsed, getLoanAlertInfo } from '../utils/loanAlerts';

const LoanListPage: FC = () => {
  const { loans, devices } = useData();

  const deviceInfo = (id: string) => devices.find((d) => d.id === id);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const overdueCount = loans.filter(
    (l) => getLoanAlertInfo(l).status === 'overdue',
  ).length;
  const longDurationCount = loans.filter(
    (l) => getLoanAlertInfo(l).status === 'longDuration',
  ).length;

  const renderBadge = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return null;
    const info = getLoanAlertInfo(loan);
    if (info.status === 'overdue') {
      return (
        <span className="badge-alert badge-alert--overdue">
          延滞中（+{formatElapsed(info.overdueHours ?? 0)}）
        </span>
      );
    }
    if (info.status === 'warning') {
      return (
        <span className="badge-alert badge-alert--warning">
          まもなく期限（残{info.minutesRemaining}分）
        </span>
      );
    }
    if (info.status === 'longDuration') {
      return (
        <span className="badge-alert badge-alert--warning">
          長時間（{formatElapsed(info.hoursElapsed)}経過）
        </span>
      );
    }
    return null;
  };

  return (
    <div>
      <h2>デバイス貸出状況（管理者）</h2>
      {(overdueCount > 0 || longDurationCount > 0) && (
        <div className="loan-alert-summary">
          {overdueCount > 0 && (
            <span className="badge-alert badge-alert--overdue">
              延滞中: {overdueCount}件
            </span>
          )}
          {longDurationCount > 0 && (
            <span
              className="badge-alert badge-alert--warning"
              style={{ marginLeft: '8px' }}
            >
              長時間貸出（8h超）: {longDurationCount}件
            </span>
          )}
        </div>
      )}
      <p>現在の貸出: {loans.length} 件</p>
      {loans.length === 0 ? (
        <p>貸出中のデバイスはありません。</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>デバイス名</th>
              <th>種別</th>
              <th>管理番号</th>
              <th>借用者</th>
              <th>貸出日時（経過）</th>
              <th>返却予定</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => {
              const d = deviceInfo(l.deviceId);
              const info = getLoanAlertInfo(l);
              return (
                <tr key={l.id}>
                  <td>{d?.name || '(削除済み)'}</td>
                  <td>{d?.type || '-'}</td>
                  <td>{d?.managementNumber || '-'}</td>
                  <td>{l.borrowedBy}</td>
                  <td>
                    {formatDate(l.borrowedAt)}
                    <br />
                    <small>（{formatElapsed(info.hoursElapsed)}経過）</small>
                  </td>
                  <td>
                    {l.expectedReturnAt ? formatDate(l.expectedReturnAt) : '—'}
                  </td>
                  <td>{renderBadge(l.id)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LoanListPage;
