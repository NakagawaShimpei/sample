import { useData } from '../contexts/DataContext';

export default function LoanListPage() {
  const { loans, devices } = useData();

  const deviceInfo = (id: string) => devices.find((d) => d.id === id);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div>
      <h2>デバイス貸出状況（管理者）</h2>
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
              <th>貸出日時</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => {
              const d = deviceInfo(l.deviceId);
              return (
                <tr key={l.id}>
                  <td>{d?.name || '(削除済み)'}</td>
                  <td>{d?.type || '-'}</td>
                  <td>{d?.managementNumber || '-'}</td>
                  <td>{l.borrowedBy}</td>
                  <td>{formatDate(l.borrowedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
