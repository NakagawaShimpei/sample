import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { DeviceType } from '../types';

const deviceTypes: DeviceType[] = [
  'ノートPC',
  'プロジェクター',
  'Web会議機器',
  'モニター',
  'その他',
];

export default function DeviceRegisterPage() {
  const { addDevice } = useData();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [managementNumber, setManagementNumber] = useState('');
  const [type, setType] = useState<DeviceType | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !managementNumber || !type) {
      alert('すべての項目を入力してください。');
      return;
    }
    try {
      await addDevice({
        name,
        location,
        managementNumber,
        type: type as DeviceType,
      });
      alert('登録しました。');
      navigate('/devices');
    } catch (err) {
      alert('登録に失敗しました: ' + (err instanceof Error ? err.message : ''));
    }
  };

  return (
    <div>
      <h2>デバイス登録</h2>
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <th>
                デバイス名 <span className="req">*</span>
              </th>
              <td>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <th>
                場所 <span className="req">*</span>
              </th>
              <td>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <th>
                管理番号 <span className="req">*</span>
              </th>
              <td>
                <input
                  type="text"
                  value={managementNumber}
                  onChange={(e) => setManagementNumber(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <th>
                デバイス種別 <span className="req">*</span>
              </th>
              <td>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as DeviceType)}
                >
                  <option value="">選択してください</option>
                  {deviceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="form-hint">※ すべての項目が必須です。</p>
        <div className="form-actions">
          <input type="submit" value="登録する" />
        </div>
      </form>
    </div>
  );
}
