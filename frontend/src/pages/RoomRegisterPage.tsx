import { FC, SubmitEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const RoomRegisterPage: FC = () => {
  const { addRoom } = useData();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('');
  const [equipment, setEquipment] = useState<string>('');

  const handleSubmit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    if (!name || !location || !capacity || !equipment) {
      alert('すべての項目を入力してください。');
      return;
    }
    try {
      await addRoom({
        name,
        location,
        capacity: Number(capacity),
        equipment,
      });
      alert('登録しました。');
      navigate('/rooms');
    } catch (err) {
      alert('登録に失敗しました: ' + (err instanceof Error ? err.message : ''));
    }
  };

  return (
    <div>
      <h2>会議室登録</h2>
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <th>
                会議室名 <span className="req">*</span>
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
                キャパ <span className="req">*</span>
              </th>
              <td>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <th>
                設備 <span className="req">*</span>
              </th>
              <td>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                />
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
};

export default RoomRegisterPage;
