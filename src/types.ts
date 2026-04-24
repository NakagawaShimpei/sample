export type Role = 'user' | 'admin';

export interface User {
  username: string;
  role: Role;
  displayName: string;
}

export interface UserRecord {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: Role;
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
}
