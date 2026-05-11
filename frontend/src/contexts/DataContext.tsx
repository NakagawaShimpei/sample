import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api } from '../api';
import { Device, Loan, Reservation, Room, UserRecord } from '../types';
import { useAuth } from './AuthContext';

interface NewUser {
  username: string;
  password: string;
  displayName: string;
}

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
  addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  addDevice: (device: Omit<Device, 'id' | 'status'>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  borrowDevice: (deviceId: string, borrowedBy: string) => Promise<void>;
  returnDevice: (deviceId: string) => Promise<void>;
  addUser: (user: NewUser) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
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

  // ログイン状態が確定したときだけデータを取得／ログアウト時はクリア
  useEffect(() => {
    if (currentUser) {
      reload();
    } else {
      setRooms([]);
      setDevices([]);
      setReservations([]);
      setLoans([]);
      setUsers([]);
      setLoading(false);
      setError(null);
    }
  }, [currentUser, reload]);

  const addRoom = async (room: Omit<Room, 'id'>) => {
    const created = await api.createRoom(room);
    setRooms((prev) => [...prev, created]);
  };

  const deleteRoom = async (id: string) => {
    await api.deleteRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setReservations((prev) => prev.filter((r) => r.roomId !== id));
  };

  const addReservation = async (reservation: Omit<Reservation, 'id'>) => {
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

  const deleteDevice = async (id: string) => {
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
    await api.deleteLoanByDevice(deviceId);
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, status: 'available' as const } : d,
      ),
    );
    setLoans((prev) => prev.filter((l) => l.deviceId !== deviceId));
  };

  const addUser = async (user: NewUser) => {
    const created = await api.createUser(user);
    setUsers((prev) => [...prev, created]);
  };

  const deleteUser = async (id: string) => {
    await api.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
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
        addReservation,
        cancelReservation,
        addDevice,
        deleteDevice,
        borrowDevice,
        returnDevice,
        addUser,
        deleteUser,
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
