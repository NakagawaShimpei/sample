import { FC, SubmitEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '../contexts/DataContext';

const RoomRegisterPage: FC = () => {
  const { addRoom } = useData();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [equipment, setEquipment] = useState('');

  const handleSubmit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    if (!name || !location || !capacity || !equipment) {
      alert('すべての項目を入力してください。');
      return;
    }
    try {
      await addRoom({ name, location, capacity: Number(capacity), equipment });
      alert('登録しました。');
      navigate('/rooms');
    } catch (err) {
      alert('登録に失敗しました: ' + (err instanceof Error ? err.message : ''));
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-4">
        会議室登録
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-4">
          <Label htmlFor="name">
            会議室名 <span className="text-destructive font-bold">*</span>
          </Label>
          <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />

          <Label htmlFor="location">
            場所 <span className="text-destructive font-bold">*</span>
          </Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Label htmlFor="capacity">
            キャパ <span className="text-destructive font-bold">*</span>
          </Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />

          <Label htmlFor="equipment">
            設備 <span className="text-destructive font-bold">*</span>
          </Label>
          <Input
            id="equipment"
            type="text"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground">※ すべての項目が必須です。</p>
        <Button type="submit">登録する</Button>
      </form>
    </div>
  );
};

export default RoomRegisterPage;
