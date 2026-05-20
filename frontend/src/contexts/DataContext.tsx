import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { api } from '../api';
import { Device, Loan, RecurringOptions, Reservation, Room, UserRecord } from '../types';
import { useAuth } from './AuthContext';

interface NewUser {
  username: string;
  password: string;
  displayName: string;
  email?: string;
}

interface DataContextValue {
  rooms: Room[];
  devices: Device[];
  reservations: Reservation[];
  loans: Loan[];
  users: UserRecord[];
  loading: boolean;
  error: string | null;
  // 個別リロード: 各ページが必要なリソースのみ呼ぶ
  reloadRooms: () => Promise<void>;
  reloadDevices: () => Promise<void>;
  reloadReservations: () => Promise<void>;
  reloadLoans: () => Promise<void>;
  reloadUsers: () => Promise<void>;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  addRecurringReservation: (
    reservation: Omit<Reservation, 'id' | 'recurringGroupId' | 'recurringPattern'>,
    opts: RecurringOptions,
  ) => Promise<{ created: number; skippedDates: string[] }>;
  cancelReservation: (id: string) => Promise<void>;
  cancelReservationGroup: (groupId: string) => Promise<void>;
  addDevice: (device: Omit<Device, 'id' | 'status'>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  borrowDevice: (deviceId: string, borrowedBy: string, expectedReturnAt?: string) => Promise<void>;
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
  const [loadCount, setLoadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 同一リソースへの重複並行リクエストを防ぐフラグ
  const inflight = useRef(new Set<string>());

  const loading = loadCount > 0;

  // 汎用ローダー: key が飛行中なら即リターン
  const withLoad = useCallback(async (key: string, fetcher: () => Promise<void>) => {
    if (inflight.current.has(key)) return;
    inflight.current.add(key);
    setLoadCount((c) => c + 1);
    try {
      await fetcher();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データ取得に失敗しました');
    } finally {
      inflight.current.delete(key);
      setLoadCount((c) => c - 1);
    }
  }, []);

  const reloadRooms = useCallback(
    () => withLoad('rooms', async () => setRooms(await api.listRooms())),
    [withLoad],
  );

  const reloadDevices = useCallback(
    () => withLoad('devices', async () => setDevices(await api.listDevices())),
    [withLoad],
  );

  const reloadReservations = useCallback(
    () => withLoad('reservations', async () => setReservations(await api.listReservations())),
    [withLoad],
  );

  const reloadLoans = useCallback(
    () => withLoad('loans', async () => setLoans(await api.listLoans())),
    [withLoad],
  );

  const reloadUsers = useCallback(
    () =>
      withLoad('users', async () => {
        if (currentUser?.role === 'admin') {
          setUsers(await api.listUsers());
        }
      }),
    [withLoad, currentUser?.role],
  );

  // ログアウト時にすべてのデータをクリア
  useEffect(() => {
    if (!currentUser) {
      setRooms([]);
      setDevices([]);
      setReservations([]);
      setLoans([]);
      setUsers([]);
      setError(null);
      inflight.current.clear();
      setLoadCount(0);
    }
  }, [currentUser]);

  // ── ミューテーション関数（変更なし）────────────────────────────

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

  const addRecurringReservation = async (
    reservation: Omit<Reservation, 'id' | 'recurringGroupId' | 'recurringPattern'>,
    opts: RecurringOptions,
  ): Promise<{ created: number; skippedDates: string[] }> => {
    const result = await api.createRecurringReservation({ ...reservation, ...opts });
    setReservations((prev) => [...prev, ...result.created]);
    return { created: result.created.length, skippedDates: result.skippedDates };
  };

  const cancelReservation = async (id: string) => {
    await api.deleteReservation(id);
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const cancelReservationGroup = async (groupId: string) => {
    await api.deleteReservationGroup(groupId);
    setReservations((prev) => prev.filter((r) => r.recurringGroupId !== groupId));
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

  const borrowDevice = async (deviceId: string, borrowedBy: string, expectedReturnAt?: string) => {
    const loanData: Omit<Loan, 'id'> = {
      deviceId,
      borrowedBy,
      borrowedAt: new Date().toISOString(),
    };
    if (expectedReturnAt) loanData.expectedReturnAt = expectedReturnAt;
    const loan = await api.createLoan(loanData);
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, status: 'inUse' as const } : d)));
    setLoans((prev) => [...prev, loan]);
  };

  const returnDevice = async (deviceId: string) => {
    await api.deleteLoanByDevice(deviceId);
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, status: 'available' as const } : d)),
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
        reloadRooms,
        reloadDevices,
        reloadReservations,
        reloadLoans,
        reloadUsers,
        addRoom,
        deleteRoom,
        addReservation,
        addRecurringReservation,
        cancelReservation,
        cancelReservationGroup,
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
