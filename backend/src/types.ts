export type Role = 'user' | 'admin';
export type DeviceStatus = 'available' | 'inUse' | 'maintenance';
export type DeviceType =
  | 'ノートPC'
  | 'プロジェクター'
  | 'Web会議機器'
  | 'モニター'
  | 'その他';

export interface UserRecord {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: Role;
  totpSecret?: string; // MFA設定済みの場合のみ存在
}

export interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string;
}

export type RecurringPatternType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringOptions {
  patternType: RecurringPatternType;
  // daily
  dailyInterval: number;
  weekdaysOnly: boolean;
  // weekly
  weeklyInterval: number;
  weekDays: number[]; // 0=Sun..6=Sat
  // monthly
  monthlyInterval: number;
  monthlySubtype: 'dayOfMonth' | 'dayOfWeek';
  monthlyDayOfMonth: number; // 1-31
  monthlyWeekOfMonth: number; // 1-5 (5=last)
  monthlyDayOfWeek: number; // 0-6
  // yearly
  yearlyInterval: number;
  yearlySubtype: 'dayOfMonth' | 'dayOfWeek';
  yearlyMonth: number; // 1-12
  yearlyDayOfMonth: number; // 1-31
  yearlyWeekOfMonth: number; // 1-5
  yearlyDayOfWeek: number; // 0-6
  // end condition
  endType: 'endDate' | 'count' | 'noEnd';
  endDate?: string;
  count?: number;
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
  recurringGroupId?: string;
  recurringPattern?: string; // 人間可読な説明文
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
  expectedReturnAt?: string;
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
