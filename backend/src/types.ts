export type Role = 'user' | 'admin';
export type DeviceStatus = 'available' | 'inUse' | 'maintenance';
export type DeviceType = 'ノートPC' | 'プロジェクター' | 'Web会議機器' | 'モニター' | 'その他';

export interface UserRecord {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: Role;
  totpSecret?: string;   // MFA設定済みの場合のみ存在
}

export interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string;
}

export interface Reservation {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  meetingName: string;
  reservedBy: string;
  participants: string;
}

export interface Device {
  id: string;
  name: string;
  location: string;
  managementNumber: string;
  type: DeviceType;
  status: DeviceStatus;
}

export interface Loan {
  id: string;
  deviceId: string;
  borrowedBy: string;
  borrowedAt: string;
}

export interface ReservationHistory {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  meetingName: string;
  reservedBy: string;
  status: string;
}

export interface LoanHistory {
  id: string;
  deviceId: string;
  borrowedBy: string;
  borrowedAt: string;
  returnedAt: string;
  durationHours: number;
}

// Express の Request に user を追加
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: Role;
        displayName: string;
      };
    }
  }
}
