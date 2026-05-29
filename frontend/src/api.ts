import {
  Device,
  Loan,
  LoanHistory,
  RecurringOptions,
  Reservation,
  ReservationHistory,
  Room,
  UserRecord,
} from './types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error(
      `API ${options?.method || 'GET'} ${path} failed: ${res.status}`,
    );
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`API ${path} did not return JSON`);
  }
  return res.json();
}

export const api = {
  listRooms: () => request<Room[]>('/rooms'),
  createRoom: (room: Omit<Room, 'id'>) =>
    request<Room>('/rooms', { method: 'POST', body: JSON.stringify(room) }),
  deleteRoom: (id: string) =>
    request<void>(`/rooms/${id}`, { method: 'DELETE' }),

  listReservations: () => request<Reservation[]>('/reservations'),
  listReservationsByRoomDate: (roomId: string, date: string) =>
    request<Reservation[]>(`/reservations?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(date)}`),
  checkConflict: (params: { roomId: string; date: string; startTime: string; endTime: string }) =>
    request<{ hasConflict: boolean; conflictingIds: string[] }>(
      `/reservations/check-conflict?${new URLSearchParams(params).toString()}`,
    ),
  createReservation: (reservation: Omit<Reservation, 'id'>) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    }),
  createRecurringReservation: (
    payload: Omit<
      Reservation,
      'id' | 'recurringGroupId' | 'recurringPattern'
    > &
      RecurringOptions,
  ) =>
    request<{ created: Reservation[]; skippedDates: string[] }>(
      '/reservations/recurring',
      { method: 'POST', body: JSON.stringify(payload) },
    ),
  deleteReservation: (id: string) =>
    request<void>(`/reservations/${id}`, { method: 'DELETE' }),
  deleteReservationGroup: (groupId: string) =>
    request<void>(`/reservations/group/${groupId}`, { method: 'DELETE' }),
  deleteReservationsByRoom: (roomId: string) =>
    request<void>(`/rooms/${roomId}`, { method: 'DELETE' }),

  listDevices: () => request<Device[]>('/devices'),
  createDevice: (device: Omit<Device, 'id'>) =>
    request<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    }),
  deleteDevice: (id: string) =>
    request<void>(`/devices/${id}`, { method: 'DELETE' }),
  updateDeviceStatus: (id: string, status: Device['status']) =>
    request<Device>(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  listUsers: () => request<UserRecord[]>('/users'),
  createUser: (user: {
    username: string;
    password: string;
    displayName: string;
    email?: string;
  }) =>
    request<UserRecord>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, { method: 'DELETE' }),
  updateEmail: (email: string) =>
    request<{ email: string | null }>('/auth/email', {
      method: 'PUT',
      body: JSON.stringify({ email }),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  listLoans: () => request<Loan[]>('/loans'),
  createLoan: (loan: Omit<Loan, 'id'>) =>
    request<Loan>('/loans', { method: 'POST', body: JSON.stringify(loan) }),
  deleteLoan: (id: string) =>
    request<void>(`/loans/${id}`, { method: 'DELETE' }),
  deleteLoanByDevice: (deviceId: string) =>
    request<void>(`/loans/device/${deviceId}`, { method: 'DELETE' }),

  listReservationHistory: () =>
    request<ReservationHistory[]>('/reservationHistory'),
  listLoanHistory: () => request<LoanHistory[]>('/loanHistory'),

  chat: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    request<{ reply: string; messages: { role: 'user' | 'assistant'; content: string }[] }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),
};
