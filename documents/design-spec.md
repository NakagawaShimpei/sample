# 設計仕様書

対象機能: 定期予約（繰り返し予約）機能 / デバイス返却リマインダー・延滞アラート  
作成日: 2026-05-11  
参照: `documents/feature-spec.md`

---

## システム構成概要

```
frontend (React 19 + TypeScript, :3000)
    ↕ HTTP / fetch proxy
backend  (Express + SQLite + TypeScript, :3001)
    ↕
SQLite DB (backend/data/db.sqlite)
```

---

## 1. 定期予約（繰り返し予約）機能

### 1.1 データモデル変更

#### backend/src/types.ts / frontend/src/types.ts

既存の `Reservation` 型に 2フィールドを追加（オプショナル）:

```typescript
export type RecurringPattern = 'weekly' | 'biweekly' | 'monthly';

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
  recurringGroupId?: string;   // 定期グループを識別するID
  recurringPattern?: RecurringPattern;  // 繰り返しパターン
}
```

SQLite テーブルはスキーマレス（JSON 文字列として保存）なので、フィールド追加に伴うマイグレーションは不要。

---

### 1.2 バックエンド

#### 新 API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/reservations/recurring` | 定期予約の一括作成 |
| DELETE | `/api/reservations/group/:groupId` | グループ一括キャンセル |

#### POST /api/reservations/recurring

**リクエストボディ**:
```json
{
  "roomId": "r001",
  "date": "2026-05-14",
  "startTime": "10:00",
  "endTime": "11:00",
  "attendeeCount": 4,
  "meetingName": "週次定例",
  "reservedBy": "sato",
  "participants": "tanaka, suzuki",
  "recurringPattern": "weekly",
  "endDate": "2026-07-31"
}
```
または `"endDate"` の代わりに `"count": 8` を指定可。

**レスポンス（200 OK）**:
```json
{
  "created": [ ...Reservation[] ],
  "skipped": 2
}
```

**処理フロー**:
1. `recurringGroupId` を生成（`rg` + timestamp + random）
2. `date` から日程リストを計算（最大20件）
3. 各日程ごとに重複チェック → 通過したもので `create` を実行
4. 結果を集計して返す

**日程計算ロジック**:

```typescript
function generateDates(startDate: string, pattern: RecurringPattern, endCondition: EndCondition): string[] {
  // weekly:   +7日 ずつ
  // biweekly: +14日 ずつ
  // monthly:  +1ヶ月 ずつ（同日）
}
```

#### DELETE /api/reservations/group/:groupId

同一 `recurringGroupId` を持つすべての予約を削除する。

**レスポンス**: 204 No Content

---

#### ReservationService 変更

```typescript
// backend/src/services/ReservationService.ts に追加
async createRecurring(
  data: Omit<Reservation, 'id' | 'recurringGroupId' | 'recurringPattern'>,
  pattern: RecurringPattern,
  endCondition: { endDate: string } | { count: number }
): Promise<{ created: Reservation[]; skipped: number }>

async deleteGroup(groupId: string): Promise<void>
```

#### ReservationController 変更

```typescript
// 追加するハンドラ
async createRecurring(req: Request, res: Response): Promise<void>
async removeGroup(req: Request, res: Response): Promise<void>
```

#### reservationRoutes.ts 変更

```typescript
router.post('/recurring', authenticate, reservationController.createRecurring);
router.delete('/group/:groupId', authenticate, reservationController.removeGroup);
```

> **注意**: `/recurring` と `/group/:groupId` を `/:id` より前に登録しないと Express がパラメータルートにマッチしてしまうため、ルート順序を厳守する。

---

### 1.3 フロントエンド

#### types.ts 変更

バックエンドと同じ `RecurringPattern` 型と `Reservation` 型の拡張を追加。

#### api.ts 変更

```typescript
createRecurringReservation: (
  payload: Omit<Reservation, 'id' | 'recurringGroupId' | 'recurringPattern'> & {
    recurringPattern: RecurringPattern;
    endDate?: string;
    count?: number;
  }
) => request<{ created: Reservation[]; skipped: number }>(
  '/reservations/recurring',
  { method: 'POST', body: JSON.stringify(payload) }
),

deleteReservationGroup: (groupId: string) =>
  request<void>(`/reservations/group/${groupId}`, { method: 'DELETE' }),
```

#### DataContext.tsx 変更

```typescript
// 追加するメソッド
addRecurringReservation: (payload: ...) => Promise<{ created: number; skipped: number }>
cancelReservationGroup: (groupId: string) => Promise<void>
```

`addRecurringReservation` 実行後は `setReservations(prev => [...prev, ...created])` で一括追加。  
`cancelReservationGroup` 実行後は `setReservations(prev => prev.filter(r => r.recurringGroupId !== groupId))` でフィルタ削除。

#### RoomReservePage.tsx 変更

フォーム下部に「繰り返し設定」セクションを追加:

```
[ ] 繰り返し予約にする
    ▼ チェック時に展開
    繰り返しパターン: [毎週 ▼]
    終了条件:
      ● 終了日  [    日付入力    ]
      ○ 回数    [  ] 回
```

送信ハンドラ:
- 繰り返しオフ → 従来の `addReservation`
- 繰り返しオン → `addRecurringReservation`、完了後に「X件作成しました（Y件重複のためスキップ）」を表示

#### ReservationListPage.tsx 変更

- `recurringGroupId` を持つ行に `<span class="badge-recurring">繰り返し</span>` を表示
- キャンセルボタン: 定期予約の場合、クリック時に以下のダイアログを表示

```
「週次定例」のキャンセル方法を選択してください:
[この予約のみキャンセル]  [この予約以降をすべてキャンセル]  [キャンセルしない]
```

「この予約以降をすべてキャンセル」は `cancelReservationGroup` を呼び出す。

---

## 2. デバイス返却リマインダー・延滞アラート

### 2.1 データモデル変更

#### backend/src/types.ts / frontend/src/types.ts

既存の `Loan` 型にフィールドを追加:

```typescript
export interface Loan {
  id: string;
  deviceId: string;
  borrowedBy: string;
  borrowedAt: string;
  expectedReturnAt?: string;  // 返却予定日時（ISO 8601、任意）
}
```

SQLite はスキーマレス保存のため、マイグレーション不要。

---

### 2.2 バックエンド

#### 既存 POST /api/loans の変更

リクエストボディに `expectedReturnAt?: string` を受け付けるよう、型定義のみ更新。LoanController / LoanService はそのまま `data` を `create` に渡すため変更不要。

#### 新 API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/loans/alerts` | 延滞・長時間貸出の一覧取得 |

#### GET /api/loans/alerts

**レスポンス（200 OK）**:
```json
{
  "overdueLoans": [
    {
      "loan": { ...Loan },
      "deviceName": "ノートPC-01",
      "hoursElapsed": 25.5,
      "overdueHours": 1.5
    }
  ],
  "longDurationLoans": [
    {
      "loan": { ...Loan },
      "deviceName": "プロジェクター-02",
      "hoursElapsed": 10.2
    }
  ]
}
```

判定基準:
- `overdueLoans`: `expectedReturnAt` が設定されており、現在時刻を超過している
- `longDurationLoans`: `expectedReturnAt` 未設定かつ `borrowedAt` から 8時間以上経過

**LoanService に追加するメソッド**:

```typescript
findAlerts(longLoanHours: number): {
  overdueLoans: LoanAlert[];
  longDurationLoans: LoanAlert[];
}
```

`LoanAlert` 型（バックエンドのみで使用、レスポンス形状として定義）:
```typescript
interface LoanAlert {
  loan: Loan;
  deviceName: string;
  hoursElapsed: number;
  overdueHours?: number;
}
```

デバイス名はアラート計算時に `deviceRepository.findById(loan.deviceId)` で取得。

---

### 2.3 フロントエンド

#### 定数定義

`frontend/src/constants.ts`（新規ファイル）:
```typescript
export const LONG_LOAN_HOURS = 8;
```

#### アラート判定ユーティリティ

`frontend/src/utils/loanAlerts.ts`（新規ファイル）:

```typescript
export type LoanAlertStatus = 'overdue' | 'warning' | 'longDuration' | 'normal';

export interface LoanAlertInfo {
  status: LoanAlertStatus;
  hoursElapsed: number;
  overdueHours?: number;    // overdue のみ
  minutesRemaining?: number; // warning のみ
}

export function getLoanAlertInfo(loan: Loan): LoanAlertInfo
```

判定ロジック:
1. `expectedReturnAt` あり:
   - 現在時刻 > `expectedReturnAt` → `overdue`
   - 現在時刻 + 1h > `expectedReturnAt` → `warning`
2. `expectedReturnAt` なし:
   - 経過時間 >= `LONG_LOAN_HOURS` → `longDuration`
3. それ以外 → `normal`

#### types.ts 変更

`Loan` 型に `expectedReturnAt?: string` を追加。

#### api.ts 変更

`createLoan` のペイロード型に `expectedReturnAt?: string` を追加（既存 `Omit<Loan, 'id'>` のままで問題なし）。

#### DataContext.tsx 変更

`borrowDevice` に `expectedReturnAt?: string` 引数を追加:

```typescript
borrowDevice: (deviceId: string, borrowedBy: string, expectedReturnAt?: string) => Promise<void>
```

#### DeviceListPage.tsx 変更

「貸出」ボタンのハンドラを変更:

1. 確認ダイアログの代わりにインライン入力フォームを表示する
2. フォームに返却予定日時（datetime-local、任意）を含める
3. 「貸出する」ボタンで `borrowDevice(id, username, expectedReturnAt)` を呼び出す

自分が借りているデバイスの行には `getLoanAlertInfo` でバッジを表示:

| アラート状態 | バッジ例 |
|------------|---------|
| overdue | `延滞中 (+2h 30m)` （赤） |
| warning | `まもなく期限 (残45m)` （黄） |
| longDuration | `長時間貸出中 (10h経過)` （黄） |

#### LoanListPage.tsx 変更（管理者）

- ページ上部にサマリーバー表示:
  ```
  延滞中: 2件  /  長時間貸出（8h超）: 3件
  ```
- 各行の「貸出日時」列に経過時間を追加表示
- 各行の末尾列にアラートバッジを表示

#### Layout.tsx 変更（グローバルバナー）

`Layout` コンポーネント内で自分の貸出をフィルタしてアラートを評価:

```typescript
const myOverdueLoans = loans.filter(
  (l) => l.borrowedBy === currentUser?.username &&
         getLoanAlertInfo(l).status === 'overdue'
);
```

`myOverdueLoans.length > 0` の場合、ヘッダー下に警告バナーを表示:

```
⚠ 返却期限を超過しているデバイスが X件あります: デバイス名A, デバイス名B  [×]
```

---

## 3. ファイル変更一覧

### バックエンド

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `backend/src/types.ts` | 変更 | `Reservation` に `recurringGroupId?`, `recurringPattern?` 追加; `Loan` に `expectedReturnAt?` 追加 |
| `backend/src/services/ReservationService.ts` | 変更 | `createRecurring`, `deleteGroup` メソッド追加 |
| `backend/src/controllers/ReservationController.ts` | 変更 | `createRecurring`, `removeGroup` ハンドラ追加 |
| `backend/src/routes/reservationRoutes.ts` | 変更 | `/recurring`, `/group/:groupId` ルート追加 |
| `backend/src/services/LoanService.ts` | 変更 | `findAlerts` メソッド追加 |
| `backend/src/controllers/LoanController.ts` | 変更 | `getAlerts` ハンドラ追加 |
| `backend/src/routes/loanRoutes.ts` | 変更 | `/alerts` ルート追加 |

### フロントエンド

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `frontend/src/types.ts` | 変更 | バックエンドと同様の型追加 |
| `frontend/src/constants.ts` | 新規 | `LONG_LOAN_HOURS` 定数 |
| `frontend/src/utils/loanAlerts.ts` | 新規 | `getLoanAlertInfo` ユーティリティ |
| `frontend/src/api.ts` | 変更 | `createRecurringReservation`, `deleteReservationGroup` 追加 |
| `frontend/src/contexts/DataContext.tsx` | 変更 | `addRecurringReservation`, `cancelReservationGroup` 追加; `borrowDevice` 引数拡張 |
| `frontend/src/pages/RoomReservePage.tsx` | 変更 | 繰り返し設定フォーム追加 |
| `frontend/src/pages/ReservationListPage.tsx` | 変更 | 定期予約バッジ・グループキャンセルUI追加 |
| `frontend/src/pages/DeviceListPage.tsx` | 変更 | 返却予定日時入力・アラートバッジ追加 |
| `frontend/src/pages/LoanListPage.tsx` | 変更 | アラートサマリー・バッジ追加 |
| `frontend/src/components/Layout.tsx` | 変更 | グローバル延滞バナー追加 |
