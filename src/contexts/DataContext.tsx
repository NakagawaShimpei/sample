import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Room, Device, Reservation, Loan, UserRecord, RecurringReservation } from '../types';
import { api } from '../api';

interface DataContextValue {
  rooms: Room[];
  devices: Device[];
  reservations: Reservation[];
  loans: Loan[];
  users: UserRecord[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  updateRoom: (id: string, data: Partial<Omit<Room, 'id'>>) => Promise<void>;
  addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  addDevice: (device: Omit<Device, 'id' | 'status'>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  updateDevice: (id: string, data: Partial<Omit<Device, 'id' | 'status'>>) => Promise<void>;
  borrowDevice: (deviceId: string, borrowedBy: string) => Promise<void>;
  returnDevice: (deviceId: string) => Promise<void>;
  addUser: (user: Omit<UserRecord, 'id' | 'role'>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addRecurringReservation: (recurringData: Omit<RecurringReservation, 'id'>, dates: string[]) => Promise<void>;
  cancelRecurringSeries: (recurringId: string, fromDate: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, d, res, l, u] = await Promise.all([
        api.listRooms(),
        api.listDevices(),
        api.listReservations(),
        api.listLoans(),
        api.listUsers(),
      ]);
      setRooms(r);
      setDevices(d);
      setReservations(res);
      setLoans(l);
      setUsers(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addRoom = async (room: Omit<Room, 'id'>) => {
    const created = await api.createRoom(room);
    setRooms((prev) => [...prev, created]);
  };

  const updateRoom = async (id: string, data: Partial<Omit<Room, 'id'>>) => {
    const updated = await api.updateRoom(id, data);
    setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const deleteRoom = async (id: string) => {
    await api.deleteReservationsByRoom(id);
    await api.deleteRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setReservations((prev) => prev.filter((r) => r.roomId !== id));
  };

  const addReservation = async (reservation: Omit<Reservation, 'id'>) => {
    const conflict = reservations.find(
      (r) =>
        r.roomId === reservation.roomId &&
        r.date === reservation.date &&
        r.startTime < reservation.endTime &&
        r.endTime > reservation.startTime
    );
    if (conflict) {
      throw new Error(
        `${conflict.startTime}〜${conflict.endTime} にすでに予約が入っています。別の時間帯を選択してください。`
      );
    }
    const created = await api.createReservation(reservation);
    setReservations((prev) => [...prev, created]);
  };

  const cancelReservation = async (id: string) => {
    await api.deleteReservation(id);
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const addDevice = async (device: Omit<Device, 'id' | 'status'>) => {
    const created = await api.createDevice({ ...device, status: 'available' });
    setDevices((prev) => [...prev, created]);
  };

  const updateDevice = async (id: string, data: Partial<Omit<Device, 'id' | 'status'>>) => {
    const updated = await api.updateDevice(id, data);
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
  };

  const deleteDevice = async (id: string) => {
    await api.deleteLoanByDevice(id);
    await api.deleteDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setLoans((prev) => prev.filter((l) => l.deviceId !== id));
  };

  const borrowDevice = async (deviceId: string, borrowedBy: string) => {
    const updated = await api.updateDeviceStatus(deviceId, 'inUse');
    const loan = await api.createLoan({
      deviceId,
      borrowedBy,
      borrowedAt: new Date().toISOString(),
    });
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
    setLoans((prev) => [...prev, loan]);
  };

  const returnDevice = async (deviceId: string) => {
    const updated = await api.updateDeviceStatus(deviceId, 'available');
    await api.deleteLoanByDevice(deviceId);
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
    setLoans((prev) => prev.filter((l) => l.deviceId !== deviceId));
  };

  const addUser = async (user: Omit<UserRecord, 'id' | 'role'>) => {
    const created = await api.createUser({ ...user, role: 'user' });
    setUsers((prev) => [...prev, created]);
  };

  const deleteUser = async (id: string) => {
    await api.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addRecurringReservation = async (
    recurringData: Omit<RecurringReservation, 'id'>,
    dates: string[]
  ): Promise<void> => {
    const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
    const conflicts: Array<{ date: string; conflict: Reservation }> = [];
    for (const d of dates) {
      const conflict = reservations.find(
        (r) =>
          r.roomId === recurringData.roomId &&
          r.date === d &&
          r.startTime < recurringData.endTime &&
          r.endTime > recurringData.startTime
      );
      if (conflict) conflicts.push({ date: d, conflict });
    }
    if (conflicts.length > 0) {
      const lines = conflicts.map(({ date: d, conflict }) => {
        const dt = new Date(`${d}T00:00:00`);
        const dayName = DAY_NAMES[dt.getDay()];
        return `  ・${dt.getMonth() + 1}月${dt.getDate()}日（${dayName}）${conflict.startTime}〜${conflict.endTime} にすでに予約が入っています`;
      });
      throw new Error(
        `以下の日程に予約の重複があります:\n${lines.join('\n')}\n終了日を変更するか、重複している日程をご確認ください。`
      );
    }
    const reservationPayloads: Omit<Reservation, 'id'>[] = dates.map((d) => ({
      roomId: recurringData.roomId,
      date: d,
      startTime: recurringData.startTime,
      endTime: recurringData.endTime,
      attendeeCount: recurringData.attendeeCount,
      meetingName: recurringData.meetingName,
      reservedBy: recurringData.reservedBy,
      participants: recurringData.participants,
    }));
    const result = await api.createRecurringReservation(recurringData, reservationPayloads);
    setReservations((prev) => [...prev, ...result.reservations]);
  };

  const cancelRecurringSeries = async (recurringId: string, fromDate: string): Promise<void> => {
    await api.cancelRecurringSeries(recurringId, fromDate);
    setReservations((prev) =>
      prev.filter((r) => !(r.recurrenceId === recurringId && r.date >= fromDate))
    );
  };

  return (
    <DataContext.Provider
      value={{
        rooms,
        devices,
        reservations,
        loans,
        users,
        loading,
        error,
        reload,
        addRoom,
        deleteRoom,
        updateRoom,
        addReservation,
        cancelReservation,
        addDevice,
        deleteDevice,
        updateDevice,
        borrowDevice,
        returnDevice,
        addUser,
        deleteUser,
        addRecurringReservation,
        cancelRecurringSeries,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
