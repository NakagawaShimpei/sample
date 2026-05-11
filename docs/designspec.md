# 設計仕様書 — 会議室・デバイス管理システム

## 1. 技術スタック

| 区分 | 技術 |
|------|------|
| フロントエンド | React 18 + TypeScript |
| ルーティング | React Router v6 |
| 状態管理 | Context API |
| バックエンド | json-server（REST API） |

---

## 2. ディレクトリ構成

```
src/
├── pages/          # 各画面コンポーネント
├── components/     # 共通コンポーネント（Layout, ProtectedRoute）
├── contexts/       # AuthContext, DataContext
├── api.ts          # API通信層
└── types.ts        # 型定義
```

---

## 3. 状態管理

### AuthContext（認証状態）

| 項目 | 内容 |
|------|------|
| 保持データ | `currentUser`（ログイン中のユーザー情報） |
| セッション永続化 | `sessionStorage`（タブを閉じると消去） |
| 提供メソッド | `login()`, `logout()` |

### DataContext（アプリデータ）

| 項目 | 内容 |
|------|------|
| 保持データ | `rooms`, `devices`, `reservations`, `loans`, `users` |
| 状態 | `loading`, `error` |
| 提供メソッド | 各エンティティの CRUD 操作（下記参照） |

DataContext が提供するメソッド:

| メソッド | 概要 |
|---------|------|
| `reload()` | 全データを再取得 |
| `addRoom()` / `deleteRoom()` | 会議室の追加・削除（削除時は関連予約も一括削除） |
| `addReservation()` / `cancelReservation()` | 予約の追加・キャンセル |
| `addDevice()` / `deleteDevice()` | デバイスの追加・削除（削除時は貸出レコードも削除） |
| `borrowDevice()` / `returnDevice()` | デバイスの貸出・返却 |
| `addUser()` / `deleteUser()` | ユーザーの追加・削除 |

---

## 4. ルーティング

`ProtectedRoute` コンポーネントで認証・権限チェックを実施。

```
/login                     → LoginPage（未認証アクセス用）
/ (ルート)                 → /rooms へリダイレクト

【ProtectedRoute】
/rooms                     → RoomListPage
/rooms/:roomId/reserve     → RoomReservePage
/rooms/register            → RoomRegisterPage（admin のみ）
/reservations              → ReservationListPage
/devices                   → DeviceListPage
/devices/register          → DeviceRegisterPage（admin のみ）
/loans                     → LoanListPage（admin のみ）
/users                     → UserListPage（admin のみ）
/users/register            → UserRegisterPage（admin のみ）

その他のパス               → /login へリダイレクト
```

- 未認証アクセス → `/login` へリダイレクト
- 権限不足アクセス → エラーメッセージを表示

---

## 5. API 通信層（api.ts）

- `request<T>()` 関数で Fetch API をラップし、全エンドポイントを統一的に呼び出す
- ベース URL: `http://localhost:3001`
- ID 生成: クライアント側で生成（プレフィックス + `Date.now()` + ランダム文字列）

---

## 6. データモデル

### Room

```typescript
interface Room {
  id: string           // 例: "r001"
  name: string
  location: string
  capacity: number
  equipment: string    // カンマ区切り
}
```

### Reservation

```typescript
interface Reservation {
  id: string
  roomId: string
  date: string         // YYYY-MM-DD
  startTime: string    // HH:MM
  endTime: string      // HH:MM
  attendeeCount: number
  meetingName: string
  reservedBy: string   // username
  participants: string // カンマ区切り
}
```

### Device

```typescript
type DeviceType   = 'ノートPC' | 'プロジェクター' | 'Web会議機器' | 'モニター' | 'その他'
type DeviceStatus = 'available' | 'inUse' | 'maintenance'

interface Device {
  id: string
  name: string
  type: DeviceType
  location: string
  managementNumber: string
  status: DeviceStatus
}
```

### Loan

```typescript
interface Loan {
  id: string
  deviceId: string
  borrowedBy: string   // username
  borrowedAt: string   // ISO 8601
}
```

### User

```typescript
type Role = 'user' | 'admin'

interface User {        // セッション保持用（password を含まない）
  id: string
  username: string
  displayName: string
  role: Role
}

interface UserRecord {  // DB保存用
  id: string
  username: string
  password: string      // 平文保存
  displayName: string
  role: Role
}
```

---

## 7. UI 実装方針

| 項目 | 実装 |
|------|------|
| 確認ダイアログ | `window.confirm` |
| エラー・バリデーション通知 | `window.alert` |
| ローディング / エラー表示 | ページ上部の共通バナー（Layout.tsx） |
| セッション保存 | `sessionStorage` |
