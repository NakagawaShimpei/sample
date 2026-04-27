# 機能仕様書

---

## 目次

| # | 機能名 | 優先度 | 作成日 |
|---|--------|--------|--------|
| [A1](#a1-リソース編集機能) | リソース編集機能 | 高 | 2026-04-27 |
| [U1](#u1-重複予約ブロック) | 重複予約ブロック | 高 | 2026-04-27 |

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
