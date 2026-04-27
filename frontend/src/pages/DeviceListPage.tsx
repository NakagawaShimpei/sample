import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { DeviceStatus } from '../types';

const statusLabel = (status: DeviceStatus): string => {
  if (status === 'available') return '利用可能';
  if (status === 'inUse') return '使用中';
  return 'メンテナンス中';
};

export default function DeviceListPage() {
  const { devices, borrowDevice, returnDevice, loans, deleteDevice } =
    useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const isBorrowedByMe = (deviceId: string) =>
    loans.some(
      (l) => l.deviceId === deviceId && l.borrowedBy === currentUser?.username,
    );

  const handleBorrow = async (id: string, name: string) => {
    if (!window.confirm(`「${name}」を貸出します。よろしいですか？`)) return;
    try {
      await borrowDevice(id, currentUser?.username || '');
    } catch (e) {
      alert('貸出に失敗しました: ' + (e instanceof Error ? e.message : ''));
    }
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
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.type}</td>
              <td>{d.managementNumber}</td>
              <td>{d.location}</td>
              <td>{statusLabel(d.status)}</td>
              <td>
                {d.status === 'available' && (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => handleBorrow(d.id, d.name)}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
