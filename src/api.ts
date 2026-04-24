import { Room, Device, Reservation, Loan, UserRecord } from './types';

const API_BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${options?.method || 'GET'} ${path} failed: ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`API ${path} did not return JSON (check that json-server is running on :3001)`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${random}`;
}

export const api = {
  listRooms: () => request<Room[]>('/rooms'),
  createRoom: (room: Omit<Room, 'id'>) =>
    request<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ ...room, id: generateId('r') }),
    }),
  deleteRoom: (id: string) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),

  listReservations: () => request<Reservation[]>('/reservations'),
  createReservation: (reservation: Omit<Reservation, 'id'>) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify({ ...reservation, id: generateId('res') }),
    }),
  deleteReservation: (id: string) =>
    request<void>(`/reservations/${id}`, { method: 'DELETE' }),
  deleteReservationsByRoom: async (roomId: string) => {
    const reservations = await request<Reservation[]>(`/reservations?roomId=${roomId}`);
    await Promise.all(
      reservations.map((r) => request<void>(`/reservations/${r.id}`, { method: 'DELETE' }))
    );
  },

  listDevices: () => request<Device[]>('/devices'),
  createDevice: (device: Omit<Device, 'id'>) =>
    request<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify({ ...device, id: generateId('d') }),
    }),
  deleteDevice: (id: string) => request<void>(`/devices/${id}`, { method: 'DELETE' }),
  updateDeviceStatus: (id: string, status: Device['status']) =>
    request<Device>(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  listUsers: () => request<UserRecord[]>('/users'),
  findUserByUsername: (username: string) =>
    request<UserRecord[]>(`/users?username=${encodeURIComponent(username)}`),
  createUser: (user: Omit<UserRecord, 'id'>) =>
    request<UserRecord>('/users', {
      method: 'POST',
      body: JSON.stringify({ ...user, id: generateId('u') }),
    }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  listLoans: () => request<Loan[]>('/loans'),
  createLoan: (loan: Omit<Loan, 'id'>) =>
    request<Loan>('/loans', {
      method: 'POST',
      body: JSON.stringify({ ...loan, id: generateId('ln') }),
    }),
  deleteLoan: (id: string) => request<void>(`/loans/${id}`, { method: 'DELETE' }),
  deleteLoanByDevice: async (deviceId: string) => {
    const loans = await request<Loan[]>(`/loans?deviceId=${deviceId}`);
    await Promise.all(
      loans.map((l) => request<void>(`/loans/${l.id}`, { method: 'DELETE' }))
    );
  },
};
