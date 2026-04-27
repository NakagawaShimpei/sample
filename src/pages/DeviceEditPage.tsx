import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { DeviceType } from '../types';

const deviceTypes: DeviceType[] = ['ノートPC', 'プロジェクター', 'Web会議機器', 'モニター', 'その他'];

export default function DeviceEditPage() {
  const { id } = useParams<{ id: string }>();
  const { devices, updateDevice, loading } = useData();
  const navigate = useNavigate();

  const device = devices.find((d) => d.id === id);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [managementNumber, setManagementNumber] = useState('');
  const [type, setType] = useState<DeviceType | ''>('');
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device && !initialized) {
      setName(device.name);
      setLocation(device.location);
      setManagementNumber(device.managementNumber);
      setType(device.type);
      setInitialized(true);
    }
  }, [device, initialized]);

  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (!device) {
    return (
      <div>
        <p className="error-msg">指定のデバイスが見つかりません。</p>
        <Link to="/devices">デバイス一覧へ戻る</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !managementNumber || !type) {
      setError('すべての項目を入力してください。');
      return;
    }
    setError(null);
    try {
      await updateDevice(id!, {
        name,
        location,
        managementNumber,
        type: type as DeviceType,
      });
      navigate('/devices');
    } catch {
      setError('更新に失敗しました。再度お試しください。');
    }
  };

  return (
    <div>
      <h2>デバイス編集</h2>
      {error && <p className="error-msg">{error}</p>}
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <th>デバイス名 <span className="req">*</span></th>
              <td><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></td>
            </tr>
            <tr>
              <th>場所 <span className="req">*</span></th>
              <td><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} /></td>
            </tr>
            <tr>
              <th>管理番号 <span className="req">*</span></th>
              <td><input type="text" value={managementNumber} onChange={(e) => setManagementNumber(e.target.value)} /></td>
            </tr>
            <tr>
              <th>デバイス種別 <span className="req">*</span></th>
              <td>
                <select value={type} onChange={(e) => setType(e.target.value as DeviceType)}>
                  <option value="">選択してください</option>
                  {deviceTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="form-hint">※ すべての項目が必須です。</p>
        <div className="form-actions">
          <input type="submit" value="保存" />
          {' '}
          <button type="button" className="link-button" onClick={() => navigate('/devices')}>
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
