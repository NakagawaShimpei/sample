import { Room, Device, Reservation, Loan, UserRecord } from './types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error(`API ${options?.method || 'GET'} ${path} failed: ${res.status}`);
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
  deleteRoom: (id: string) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),

  listReservations: () => request<Reservation[]>('/reservations'),
  createReservation: (reservation: Omit<Reservation, 'id'>) =>
    request<Reservation>('/reservations', { method: 'POST', body: JSON.stringify(reservation) }),
  deleteReservation: (id: string) =>
    request<void>(`/reservations/${id}`, { method: 'DELETE' }),
  deleteReservationsByRoom: (roomId: string) =>
    request<void>(`/rooms/${roomId}`, { method: 'DELETE' }),

  listDevices: () => request<Device[]>('/devices'),
  createDevice: (device: Omit<Device, 'id'>) =>
    request<Device>('/devices', { method: 'POST', body: JSON.stringify(device) }),
  deleteDevice: (id: string) => request<void>(`/devices/${id}`, { method: 'DELETE' }),
  updateDeviceStatus: (id: string, status: Device['status']) =>
    request<Device>(`/devices/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  listUsers: () => request<UserRecord[]>('/users'),
  createUser: (user: { username: string; password: string; displayName: string }) =>
    request<UserRecord>('/users', { method: 'POST', body: JSON.stringify(user) }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  listLoans: () => request<Loan[]>('/loans'),
  createLoan: (loan: Omit<Loan, 'id'>) =>
    request<Loan>('/loans', { method: 'POST', body: JSON.stringify(loan) }),
  deleteLoan: (id: string) => request<void>(`/loans/${id}`, { method: 'DELETE' }),
  deleteLoanByDevice: (deviceId: string) =>
    request<void>(`/loans/device/${deviceId}`, { method: 'DELETE' }),
};
