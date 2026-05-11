import React, { FC, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { DeviceStatus } from '../types';
import { formatElapsed, getLoanAlertInfo } from '../utils/loanAlerts';

const statusLabel = (status: DeviceStatus): string => {
  if (status === 'available') return '利用可能';
  if (status === 'inUse') return '使用中';
  return 'メンテナンス中';
};

const DeviceListPage: FC = () => {
  const { devices, borrowDevice, returnDevice, loans, deleteDevice } =
    useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [borrowTargetId, setBorrowTargetId] = useState<string | null>(null);
  const [expectedReturnAt, setExpectedReturnAt] = useState('');

  const getLoanForDevice = (deviceId: string) =>
    loans.find((l) => l.deviceId === deviceId);

  const isBorrowedByMe = (deviceId: string) =>
    loans.some(
      (l) => l.deviceId === deviceId && l.borrowedBy === currentUser?.username,
    );

  const handleBorrowClick = (id: string) => {
    setBorrowTargetId(id);
    setExpectedReturnAt('');
  };

  const handleBorrowConfirm = async (id: string, name: string) => {
    try {
      await borrowDevice(
        id,
        currentUser?.username || '',
        expectedReturnAt || undefined,
      );
      setBorrowTargetId(null);
    } catch (e) {
      alert('貸出に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
    void name;
  };

  const handleReturn = async (id: string, name: string) => {
    if (!window.confirm(`「${name}」を返却します。よろしいですか？`)) return;
    try {
      await returnDevice(id);
    } catch (e) {
      alert('返却に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`デバイス「${name}」を削除します。よろしいですか？`))
      return;
    try {
      await deleteDevice(id);
    } catch (e) {
      alert('削除に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
  };

  const minDateTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    return d.toISOString().slice(0, 16);
  };

  const renderAlertBadge = (deviceId: string) => {
    const loan = getLoanForDevice(deviceId);
    if (!loan || loan.borrowedBy !== currentUser?.username) return null;
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
          長時間貸出中（{formatElapsed(info.hoursElapsed)}経過）
        </span>
      );
    }
    return null;
  };

  return (
    <div>
      <h2>デバイス一覧</h2>
      <p>登録されているデバイス: {devices.length} 件</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>デバイス名</th>
            <th>種別</th>
            <th>管理番号</th>
            <th>場所</th>
            <th>ステータス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <React.Fragment key={d.id}>
              <tr>
                <td>
                  {d.name}
                  {renderAlertBadge(d.id)}
                </td>
                <td>{d.type}</td>
                <td>{d.managementNumber}</td>
                <td>{d.location}</td>
                <td>{statusLabel(d.status)}</td>
                <td>
                  {d.status === 'available' && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleBorrowClick(d.id)}
                    >
                      貸出
                    </button>
                  )}
                  {d.status === 'inUse' && isBorrowedByMe(d.id) && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleReturn(d.id, d.name)}
                    >
                      返却
                    </button>
                  )}
                  {d.status === 'inUse' && !isBorrowedByMe(d.id) && isAdmin && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleReturn(d.id, d.name)}
                    >
                      強制返却
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      {' | '}
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => handleDelete(d.id, d.name)}
                      >
                        削除
                      </button>
                    </>
                  )}
                </td>
              </tr>
              {borrowTargetId === d.id && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ background: '#f9f9f9', padding: '8px 12px' }}
                  >
                    <strong>「{d.name}」の貸出</strong>
                    <div style={{ marginTop: '6px' }}>
                      <label>
                        返却予定日時（任意）:{' '}
                        <input
                          type="datetime-local"
                          value={expectedReturnAt}
                          onChange={(e) => setExpectedReturnAt(e.target.value)}
                          min={minDateTime()}
                        />
                      </label>
                    </div>
                    <div className="form-actions" style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleBorrowConfirm(d.id, d.name)}
                      >
                        貸出する
                      </button>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setBorrowTargetId(null)}
                      >
                        キャンセル
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceListPage;
