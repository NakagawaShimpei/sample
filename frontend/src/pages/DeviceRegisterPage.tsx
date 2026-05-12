import { FC, SubmitEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '../contexts/DataContext';
import { DeviceType } from '../types';

const deviceTypes: DeviceType[] = [
  'ノートPC',
  'プロジェクター',
  'Web会議機器',
  'モニター',
  'その他',
];

const DeviceRegisterPage: FC = () => {
  const { addDevice } = useData();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [managementNumber, setManagementNumber] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    if (!name || !location || !managementNumber || !type) {
      alert('すべての項目を入力してください。');
      return;
    }
    try {
      await addDevice({ name, location, managementNumber, type: type as DeviceType });
      alert('登録しました。');
      navigate('/devices');
    } catch (err) {
      alert('登録に失敗しました: ' + (err instanceof Error ? err.message : ''));
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-semibold border-l-4 border-slate-700 pl-2 mt-0 mb-4">
        デバイス登録
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-4">
          <Label htmlFor="name">
            デバイス名 <span className="text-destructive font-bold">*</span>
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

          <Label htmlFor="managementNumber">
            管理番号 <span className="text-destructive font-bold">*</span>
          </Label>
          <Input
            id="managementNumber"
            type="text"
            value={managementNumber}
            onChange={(e) => setManagementNumber(e.target.value)}
          />

          <Label>
            デバイス種別 <span className="text-destructive font-bold">*</span>
          </Label>
          <Select value={type || undefined} onValueChange={(v) => setType(v ?? '')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {deviceTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">※ すべての項目が必須です。</p>
        <Button type="submit">登録する</Button>
      </form>
    </div>
  );
};

export default DeviceRegisterPage;
