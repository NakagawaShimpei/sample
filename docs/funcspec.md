# 機能仕様書

---

## 目次

| # | 機能名 | 優先度 | 作成日 |
|---|--------|--------|--------|
| [A1](#a1-リソース編集機能) | リソース編集機能 | 高 | 2026-04-27 |
| [U1](#u1-重複予約ブロック) | 重複予約ブロック | 高 | 2026-04-27 |
| [RA1](#ra1-定期予約) | 定期予約（分析起点） | 高 | 2026-05-11 |

---

## A1: リソース編集機能

作成日: 2026-04-27

### 1. 概要

管理者が登録済みの会議室・デバイスの情報（名前・定員・設備など）を画面から変更できる機能。

**背景:** 現状は「削除→再登録」でしか情報修正できない。削除すると紐づく予約が全消えするため、事実上の編集不能状態になっている（`tobe.md` A1 参照）。

---

### 2. スコープ

#### 対象

| 対象リソース | 編集可能フィールド |
|---|---|
| 会議室 (Room) | name, location, capacity, equipment |
| デバイス (Device) | name, location, managementNumber, type |

#### 対象外

- `Room.id` の変更（不変）
- `Device.id` の変更（不変）
- `Device.status` の変更（別機能 A2 で扱う）
- 予約・貸出データの編集

---

### 3. 前提条件

- 操作者は `role: 'admin'` のユーザーのみ（`ProtectedRoute requireRole="admin"` で保護）
- バックエンドは json-server。PATCH メソッドで部分更新が可能

---

### 4. ユーザーストーリー

1. 管理者が会議室一覧ページで「編集」ボタンを押すと、その会議室の編集フォームページへ遷移できる
2. 管理者がデバイス一覧ページで「編集」ボタンを押すと、そのデバイスの編集フォームページへ遷移できる
3. 編集フォームには現在の値が初期表示されており、変更したいフィールドだけ書き換えて保存できる
4. 保存に成功すると一覧ページへ戻り、変更後の情報が反映されている
5. 保存に失敗した場合（ネットワークエラー等）はエラーメッセージを表示し、フォームはそのまま残る

---

### 5. 画面仕様

#### 5-1. 会議室一覧ページの変更 (`RoomListPage`)

- admin ロールの場合、各行に「削除」ボタンと並んで **「編集」ボタン**を追加する
- 「編集」ボタン押下で `/rooms/:id/edit` へ遷移する

#### 5-2. 会議室編集ページ (`RoomEditPage`)

| 項目 | 詳細 |
|---|---|
| ルート | `/rooms/:id/edit` |
| ロール制限 | admin のみ |
| 初期値 | DataContext の `rooms` から `:id` で取得して各フィールドへセット |
| フォーム構成 | 登録ページ (`RoomRegisterPage`) と同じテーブルレイアウト |

**フォームフィールド:**

| フィールド | 型 | バリデーション |
|---|---|---|
| 会議室名 (name) | text | 必須・1文字以上 |
| 場所 (location) | text | 必須・1文字以上 |
| 定員 (capacity) | number | 必須・1以上の整数 |
| 設備 (equipment) | text | 必須・1文字以上 |

**ボタン:**
- 「保存」: バリデーション通過後に PATCH 送信、成功で `/rooms` へリダイレクト
- 「キャンセル」: 確認なしで `/rooms` へ戻る

**エラー処理:**
- 保存失敗時: フォーム上部に「更新に失敗しました。再度お試しください。」を表示
- 存在しない ID でアクセスした場合: 「指定の会議室が見つかりません。」を表示し一覧リンクを出す

#### 5-3. デバイス一覧ページの変更 (`DeviceListPage`)

- admin ロールの場合、各行の操作列に **「編集」ボタン**を追加する
- 「編集」ボタン押下で `/devices/:id/edit` へ遷移する

#### 5-4. デバイス編集ページ (`DeviceEditPage`)

| 項目 | 詳細 |
|---|---|
| ルート | `/devices/:id/edit` |
| ロール制限 | admin のみ |
| 初期値 | DataContext の `devices` から `:id` で取得して各フィールドへセット |
| フォーム構成 | 登録ページ (`DeviceRegisterPage`) と同じテーブルレイアウト |

**フォームフィールド:**

| フィールド | 型 | バリデーション |
|---|---|---|
| デバイス名 (name) | text | 必須・1文字以上 |
| 場所 (location) | text | 必須・1文字以上 |
| 管理番号 (managementNumber) | text | 必須・1文字以上 |
| 種別 (type) | select | 必須・DeviceType のいずれか |

**ボタン:**
- 「保存」: バリデーション通過後に PATCH 送信、成功で `/devices` へリダイレクト
- 「キャンセル」: 確認なしで `/devices` へ戻る

**エラー処理:**
- 保存失敗時: フォーム上部に「更新に失敗しました。再度お試しください。」を表示
- 存在しない ID でアクセスした場合: 「指定のデバイスが見つかりません。」を表示し一覧リンクを出す

---

### 6. API 変更

#### 6-1. 追加関数 (`src/api.ts`)

```ts
updateRoom(id: string, data: Partial<Omit<Room, 'id'>>): Promise<Room>
// PATCH /rooms/:id

updateDevice(id: string, data: Partial<Omit<Device, 'id' | 'status'>>): Promise<Device>
// PATCH /devices/:id
```

#### 6-2. 既存関数への影響

なし。既存の `createRoom` / `createDevice` / `deleteRoom` / `deleteDevice` は変更不要。

---

### 7. DataContext 変更 (`src/contexts/DataContext.tsx`)

追加するメソッド:

```ts
updateRoom(id: string, data: Partial<Omit<Room, 'id'>>): Promise<void>
// api.updateRoom 呼び出し後、rooms ステートを更新

updateDevice(id: string, data: Partial<Omit<Device, 'id' | 'status'>>): Promise<void>
// api.updateDevice 呼び出し後、devices ステートを更新
```

ステート更新方法: `setRooms(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))` 形式でローカルを差分更新（再フェッチ不要）。

---

### 8. ルーティング変更 (`src/App.tsx`)

```tsx
<Route path="/rooms/:id/edit"    element={<ProtectedRoute requireRole="admin"><RoomEditPage /></ProtectedRoute>} />
<Route path="/devices/:id/edit"  element={<ProtectedRoute requireRole="admin"><DeviceEditPage /></ProtectedRoute>} />
```

---

### 9. 実装ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/api.ts` | 変更 | `updateRoom`, `updateDevice` 追加 |
| `src/contexts/DataContext.tsx` | 変更 | `updateRoom`, `updateDevice` メソッド追加、型定義更新 |
| `src/App.tsx` | 変更 | 編集ページ 2 本のルート追加 |
| `src/pages/RoomEditPage.tsx` | 新規 | 会議室編集フォーム |
| `src/pages/DeviceEditPage.tsx` | 新規 | デバイス編集フォーム |
| `src/pages/RoomListPage.tsx` | 変更 | 編集ボタン追加 |
| `src/pages/DeviceListPage.tsx` | 変更 | 編集ボタン追加 |

---

### 10. 未解決事項

| # | 事項 | 対応方針案 |
|---|---|---|
| 1 | 会議室の定員を変更したとき、既存予約の人数が新定員を超える場合どうするか | 今回は警告なし（バリデーション強化は U2 で扱う） |
| 2 | デバイスが貸出中（inUse）の場合でも編集可能にするか | 可能とする。status 変更を伴わないため業務上の問題なし |
| 3 | 管理番号の重複チェックをするか | 今回はしない（登録時も未チェック） |

---

## U1: 重複予約ブロック

作成日: 2026-04-27

### 1. 概要

同じ会議室・同じ時間帯への二重予約を防止する機能。予約送信前にクライアント側で重複チェックを行い、衝突が検出された場合はエラーを返してAPIへのリクエストを行わない。

**背景:** 現状は重複チェックが存在せず、同じ会議室・同じ時間帯に複数の予約が登録できてしまう（`tobe.md` U1 参照）。

---

### 2. スコープ

#### 対象

- 会議室予約の新規作成（`addReservation`）

#### 対象外

- デバイス貸出（別リソース、同時利用の概念が異なる）
- 既存予約の変更（U4 で扱う）

---

### 3. 前提条件

- DataContext の `reservations` に現在の全予約データがロード済みであること
- チェックはクライアント側のみ。サーバー側（json-server）には重複防止ロジックなし

---

### 4. ユーザーストーリー

1. ユーザーが予約フォームで時間帯を入力して送信すると、同じ会議室・同じ日付で時間帯が重なる既存予約の有無をチェックする
2. 重複が検出された場合、既存予約の時間帯を含むエラーメッセージが表示され、予約は登録されない
3. 重複がなければ従来通り予約が登録され、予約一覧ページへ遷移する

---

### 5. バリデーション仕様

#### 重複判定条件

以下をすべて満たす既存予約が1件以上存在する場合を「重複あり」とする。

| 条件 | 内容 |
|---|---|
| roomId の一致 | 同じ会議室 |
| date の一致 | 同じ日付 |
| 時間帯の重複 | `既存.startTime < 新規.endTime` かつ `既存.endTime > 新規.startTime` |

時間帯の重複判定は開区間比較（端点が一致するだけの場合は重複とみなさない）。  
例: 既存が `10:00〜11:00`、新規が `11:00〜12:00` の場合は重複なし。

#### エラーメッセージ

```
{conflict.startTime}〜{conflict.endTime} にすでに予約が入っています。別の時間帯を選択してください。
```

例: `10:00〜11:00 にすでに予約が入っています。別の時間帯を選択してください。`

---

### 6. 実装仕様

#### 変更箇所: `src/contexts/DataContext.tsx` — `addReservation`

```ts
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
```

- チェックは API 呼び出し前に実行する（無駄なリクエストを防ぐため）
- エラーは `Error` としてスローし、呼び出し元（`RoomReservePage`）の `catch` ブロックで `alert` 表示する

---

### 7. 実装ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/contexts/DataContext.tsx` | 変更 | `addReservation` に重複チェックを追加 |

---

### 8. 未解決事項

| # | 事項 | 対応方針案 |
|---|---|---|
| 1 | キャンセル済み予約が将来的に論理削除になった場合、チェック対象から除外が必要 | 現状は物理削除のみのため対応不要。論理削除導入時に再検討 |
| 2 | 複数タブで同時操作した場合、`reservations` の状態が古くなり重複をすり抜ける可能性がある | サーバー側でのチェック（json-server カスタムルート等）が根本解決だが、研修スコープ外のため保留 |

---

## RA1: 定期予約

作成日: 2026-05-11

> **この機能は tobe.md ではなく `reservation-analysis.md` の分析結果を起点に定義した。**  
> tobe.md の対応機能番号は U9（繰り返し予約）。

### 1. 概要

ユーザーが同じ会議室・時間帯を繰り返し利用する場合に、一度の操作でまとめて予約を登録できる機能。繰り返しパターンとして週次・隔週・月次・カスタムをサポートする。

**背景:** `reservation-analysis.md` より、sato が毎週水曜10:00〜11:00 に r007 を8週連続予約していることを確認。1on1・週次定例が全予約の約36%を占めており、定期予約の需要は明確に存在する。毎回手動で予約する工数削減と取り忘れ防止が目的。

---

### 2. スコープ

#### 対象

| パターン | 内容 |
|---|---|
| 週次（weekly） | 毎週同じ曜日・時間帯 |
| 隔週（biweekly） | 1週おき・同じ曜日・時間帯 |
| 月次（monthly） | 毎月同じ日付・時間帯 |
| カスタム（custom） | N日おきに繰り返し（N は 1〜365 の整数） |

- ロール不問（user・admin ともに利用可）

#### 対象外

- デバイス貸出の定期予約
- 既存予約の定期予約への変換

---

### 3. 前提条件

- DataContext の `reservations` に現在の全予約がロード済みであること
- 重複チェックは U1 の判定ロジック（開区間比較）を再利用する
- バックエンドは json-server。`/recurringReservations` エンドポイントを新設する

---

### 4. ユーザーストーリー

1. ユーザーが予約フォームで「定期予約として登録する」を有効にすると、繰り返し設定が展開される
2. 開始日・終了日・会議室・時間帯・参加者情報を入力すると、予約される日付一覧がプレビュー表示される
3. 送信時に全日程の重複チェックが行われ、衝突がある場合は該当日を明示するエラーを返す。衝突がなければ全日程を一括登録する
4. 予約一覧ページで定期予約シリーズに属する予約には「定期」バッジが表示される
5. 定期予約の特定の1回分を個別キャンセルできる
6. シリーズ全体（当日以降の全予約）を一括キャンセルできる

---

### 5. データモデル

#### 5-1. 新規型: `RecurringReservation` (`src/types.ts`)

```ts
export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface RecurringReservation {
  id: string;                    // generateId('rr') で生成
  roomId: string;
  startTime: string;             // "HH:MM"
  endTime: string;               // "HH:MM"
  attendeeCount: number;
  meetingName: string;
  reservedBy: string;
  participants: string;
  recurrenceType: RecurrenceType;
  dayOfWeek?: number;            // weekly/biweekly 時のみ。0=日〜6=土（startDate の曜日から自動セット）
  dayOfMonth?: number;           // monthly 時のみ。1〜31（startDate の日付から自動セット）
  intervalDays?: number;         // custom 時のみ。1〜365 の整数
  startDate: string;             // "YYYY-MM-DD"（最初の予約日）
  endDate: string;               // "YYYY-MM-DD"（最後の予約日）
}
```

**フィールドの使用条件:**

| recurrenceType | 使用するフィールド |
|---|---|
| weekly | `dayOfWeek` |
| biweekly | `dayOfWeek` |
| monthly | `dayOfMonth` |
| custom | `intervalDays` |

#### 5-2. `Reservation` 型の変更 (`src/types.ts`)

既存の `Reservation` 型に任意フィールドを1つ追加する:

```ts
export interface Reservation {
  // 既存フィールド（変更なし）
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  meetingName: string;
  reservedBy: string;
  participants: string;
  // 追加フィールド
  recurrenceId?: string; // RecurringReservation.id への参照。通常予約は undefined
}
```

---

### 6. 画面仕様

#### 6-1. 予約フォームの変更 (`RoomReservePage`)

既存フォームの送信ボタン直前に以下を追加する:

**「定期予約として登録する」チェックボックス**
- チェック時: 繰り返し設定エリアが展開される

**繰り返し設定エリア（チェック時のみ表示）:**

| フィールド | 型 | バリデーション |
|---|---|---|
| 繰り返しパターン | select | 必須。週次 / 隔週 / 月次 / カスタム のいずれか |
| 間隔（日数） | number | カスタム選択時のみ表示。必須・1〜365 の整数 |
| 終了日 | date | 必須・開始日（既存の日付フィールド）以降 |

**パターンごとの日付計算ルール:**

| パターン | 計算方法 |
|---|---|
| 週次 | 開始日から7日おきに `endDate` まで |
| 隔週 | 開始日から14日おきに `endDate` まで |
| 月次 | 開始日と同じ日付（dayOfMonth）を各月で算出。該当月に存在しない日（例: 31日）は月末日に丸める |
| カスタム | 開始日から `intervalDays` 日おきに `endDate` まで |

- 入力が揃い次第、**「予約される日: ◯月◯日（曜）、◯月◯日（曜）… （計N回）」** をリアルタイムにプレビュー表示する
- 期間上限: 終了日は開始日から1年以内。超える場合は「終了日は開始日から1年以内で設定してください。」を表示して送信ブロック

**定期予約時の既存フィールドの扱い:**

| フィールド | 扱い |
|---|---|
| 日付 | 「開始日」として機能（ラベルを "開始日" に変更） |
| その他フィールド | 全日程共通の値として使用（変更なし） |

#### 6-2. 予約一覧ページの変更 (`ReservationListPage`)

- `recurrenceId` が存在する予約の行に **「定期」バッジ**を表示する
- 同一 `recurrenceId` を持つ予約のうち、`date` が最も早い未来の1件に **「シリーズをキャンセル」ボタン**を表示する
  - 押下時: 確認ダイアログ「このシリーズの今日以降の予約をすべてキャンセルしますか？」を表示
  - 確認後: `cancelRecurringSeries` を呼び出す

#### 6-3. ローディングオーバーレイ

送信・キャンセルなどの非同期処理中は、画面全体を覆うオーバーレイ（`LoadingOverlay` コンポーネント）を表示する。オーバーレイが表示中は背後のすべての要素が操作不可になる。

| 操作 | 表示メッセージ |
|---|---|
| 通常予約の登録 | `予約を登録中...` |
| 定期予約の登録（N件） | `定期予約を登録中... (N件)` |
| 個別予約のキャンセル | `予約をキャンセル中...` |
| シリーズキャンセル（N件） | `シリーズをキャンセル中... (N件)` |

オーバーレイのスタイルは `src/App.css` で定義し、`src/components/LoadingOverlay.tsx` として共通コンポーネント化する。

---

#### 6-4. 重複エラーの表示

定期予約登録時に衝突がある場合、以下の形式のメッセージをポップアップ（`alert`）で表示する:

```
以下の日程に予約の重複があります:
  ・3月5日（水）10:00〜11:00 にすでに予約が入っています
  ・3月26日（水）10:00〜11:00 にすでに予約が入っています
終了日を変更するか、重複している日程をご確認ください。
```

**エラー時の動作:** 1件でも重複がある場合は全件登録しない（部分登録なし）。

---

### 7. API 変更 (`src/api.ts`)

```ts
createRecurringReservation(
  recurring: Omit<RecurringReservation, 'id'>,
  reservations: Omit<Reservation, 'id'>[]
): Promise<{ recurring: RecurringReservation; reservations: Reservation[] }>
// 1. POST /recurringReservations で親レコードを作成
// 2. 各日程を Promise.all で並列 POST /reservations（recurrenceId をセットして送信）

cancelRecurringSeries(recurringId: string, fromDate: string): Promise<void>
// fromDate 以降の date を持つ recurrenceId === recurringId の予約を全件 DELETE /reservations/:id
// 残存する予約が0件になった場合は DELETE /recurringReservations/:id も実行
```

---

### 8. DataContext 変更 (`src/contexts/DataContext.tsx`)

追加するメソッド:

```ts
addRecurringReservation(
  recurringData: Omit<RecurringReservation, 'id'>,
  dates: string[]  // 予約日 "YYYY-MM-DD" の配列
): Promise<void>

cancelRecurringSeries(recurringId: string, fromDate: string): Promise<void>
```

**`addRecurringReservation` の実装方針:**

1. `dates` の各日程に対して U1 と同じ重複チェックを実行。衝突があれば全件エラーとしてスロー（呼び出し元でエラーメッセージを整形して表示）
2. 重複なければ `recurringData` と各日程の `Reservation` データを組み立てて `api.createRecurringReservation` を呼び出す
3. 成功後、`reservations` ステートに新規予約をまとめて追加

**`cancelRecurringSeries` の実装方針:**

1. `api.cancelRecurringSeries` を呼び出す
2. 成功後、`reservations` ステートから該当 `recurrenceId` かつ `date >= fromDate` の予約を除去

---

### 9. `db.json` 変更

`recurringReservations` コレクションを追加する:

```json
{
  "recurringReservations": []
}
```

---

### 10. 実装ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/types.ts` | 変更 | `RecurringReservation` 型追加、`Reservation` に `recurrenceId?` 追加 |
| `src/api.ts` | 変更 | `createRecurringReservation`（並列登録）、`cancelRecurringSeries` 追加 |
| `src/contexts/DataContext.tsx` | 変更 | `addRecurringReservation`、`cancelRecurringSeries` メソッド追加、型定義更新 |
| `src/pages/RoomReservePage.tsx` | 変更 | 定期予約フォーム追加（チェックボックス・パターン選択・終了日・プレビュー・オーバーレイ） |
| `src/pages/ReservationListPage.tsx` | 変更 | 定期バッジ・シリーズキャンセルボタン・オーバーレイ追加 |
| `src/components/LoadingOverlay.tsx` | 新規 | 処理中に画面全体をブロックするオーバーレイコンポーネント |
| `src/App.css` | 変更 | `LoadingOverlay` 用スタイル・アニメーション追加 |
| `db.json` | 変更 | `recurringReservations: []` コレクション追加 |

---

### 11. 未解決事項

| # | 事項 | 対応方針案 |
|---|---|---|
| 1 | 重複が一部の日程にある場合に衝突日を除いて部分登録するか | 今回は全件エラーとする（一貫性優先）。部分登録の要否は別途要件定義 |
| 2 | 定期予約の内容（時間帯・参加者）を後からまとめて変更するか | 今回はスコープ外。個別予約の編集は tobe.md U4 で扱う |
| 3 | 「シリーズをキャンセル」は当日以降のみか、過去分も含むか | 過去分は履歴として残す方針のため、`fromDate = today` として当日以降のみキャンセルとする |
| 4 | 個別キャンセルで `RecurringReservation` 親レコードをどう扱うか | 親レコードは残し、その日程の欠番として扱う（残存予約が0件になった時点で親を削除） |
| 5 | 月次パターンで存在しない日（例: 2月31日）をどう扱うか | 月末日に丸める（例: 2/28 または 2/29）。プレビュー画面で丸めた日付を明示する |
| 6 | カスタムパターンで `intervalDays` が非常に大きく実質1回しか予約されない場合の扱い | 1回でも登録可とする。プレビューで件数が表示されるため、ユーザーが確認できる |
