export type Role = 'user' | 'admin';

export interface User {
  username: string;
  role: Role;
  displayName: string;
  email?: string | null;
}

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  email?: string;
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
  dailyInterval: number;
  weekdaysOnly: boolean;
  weeklyInterval: number;
  weekDays: number[];
  monthlyInterval: number;
  monthlySubtype: 'dayOfMonth' | 'dayOfWeek';
  monthlyDayOfMonth: number;
  monthlyWeekOfMonth: number;
  monthlyDayOfWeek: number;
  yearlyInterval: number;
  yearlySubtype: 'dayOfMonth' | 'dayOfWeek';
  yearlyMonth: number;
  yearlyDayOfMonth: number;
  yearlyWeekOfMonth: number;
  yearlyDayOfWeek: number;
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
  recurringPattern?: string;
}

export type DeviceType = 'ノートPC' | 'プロジェクター' | 'Web会議機器' | 'モニター' | 'その他';

export type DeviceStatus = 'available' | 'inUse' | 'maintenance';

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
  status: 'completed' | 'cancelled';
}

export interface LoanHistory {
  id: string;
  deviceId: string;
  borrowedBy: string;
  borrowedAt: string;
  returnedAt: string;
  durationHours: number;
}
