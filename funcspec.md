# 機能仕様書 A1: リソース編集機能

作成日: 2026-04-27

---

## 1. 概要

管理者が登録済みの会議室・デバイスの情報（名前・定員・設備など）を画面から変更できる機能。

**背景:** 現状は「削除→再登録」でしか情報修正できない。削除すると紐づく予約が全消えするため、事実上の編集不能状態になっている（`tobe.md` A1 参照）。

---

## 2. スコープ

### 対象

| 対象リソース | 編集可能フィールド |
|---|---|
| 会議室 (Room) | name, location, capacity, equipment |
| デバイス (Device) | name, location, managementNumber, type |

### 対象外

- `Room.id` の変更（不変）
- `Device.id` の変更（不変）
- `Device.status` の変更（別機能 A2 で扱う）
- 予約・貸出データの編集

---

## 3. 前提条件

- 操作者は `role: 'admin'` のユーザーのみ（`ProtectedRoute requireRole="admin"` で保護）
- バックエンドは json-server。PATCH メソッドで部分更新が可能

---

## 4. ユーザーストーリー

1. 管理者が会議室一覧ページで「編集」ボタンを押すと、その会議室の編集フォームページへ遷移できる
2. 管理者がデバイス一覧ページで「編集」ボタンを押すと、そのデバイスの編集フォームページへ遷移できる
3. 編集フォームには現在の値が初期表示されており、変更したいフィールドだけ書き換えて保存できる
4. 保存に成功すると一覧ページへ戻り、変更後の情報が反映されている
5. 保存に失敗した場合（ネットワークエラー等）はエラーメッセージを表示し、フォームはそのまま残る

---

## 5. 画面仕様

### 5-1. 会議室一覧ページの変更 (`RoomListPage`)

- admin ロールの場合、各行に「削除」ボタンと並んで **「編集」ボタン**を追加する
- 「編集」ボタン押下で `/rooms/:id/edit` へ遷移する

### 5-2. 会議室編集ページ (`RoomEditPage`)

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

### 5-3. デバイス一覧ページの変更 (`DeviceListPage`)

- admin ロールの場合、各行の操作列に **「編集」ボタン**を追加する
- 「編集」ボタン押下で `/devices/:id/edit` へ遷移する

### 5-4. デバイス編集ページ (`DeviceEditPage`)

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

## 6. API 変更

### 6-1. 追加関数 (`src/api.ts`)

```ts
updateRoom(id: string, data: Partial<Omit<Room, 'id'>>): Promise<Room>
// PATCH /rooms/:id

updateDevice(id: string, data: Partial<Omit<Device, 'id' | 'status'>>): Promise<Device>
// PATCH /devices/:id
```

### 6-2. 既存関数への影響

なし。既存の `createRoom` / `createDevice` / `deleteRoom` / `deleteDevice` は変更不要。

---

## 7. DataContext 変更 (`src/contexts/DataContext.tsx`)

追加するメソッド:

```ts
updateRoom(id: string, data: Partial<Omit<Room, 'id'>>): Promise<void>
// api.updateRoom 呼び出し後、rooms ステートを更新

updateDevice(id: string, data: Partial<Omit<Device, 'id' | 'status'>>): Promise<void>
// api.updateDevice 呼び出し後、devices ステートを更新
```

ステート更新方法: `setRooms(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))` 形式でローカルを差分更新（再フェッチ不要）。

---

## 8. ルーティング変更 (`src/App.tsx`)

```tsx
<Route path="/rooms/:id/edit"    element={<ProtectedRoute requireRole="admin"><RoomEditPage /></ProtectedRoute>} />
<Route path="/devices/:id/edit"  element={<ProtectedRoute requireRole="admin"><DeviceEditPage /></ProtectedRoute>} />
```

---

## 9. 実装ファイル一覧

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

## 10. 未解決事項

| # | 事項 | 対応方針案 |
|---|---|---|
| 1 | 会議室の定員を変更したとき、既存予約の人数が新定員を超える場合どうするか | 今回は警告なし（バリデーション強化は U2 で扱う） |
| 2 | デバイスが貸出中（inUse）の場合でも編集可能にするか | 可能とする。status 変更を伴わないため業務上の問題なし |
| 3 | 管理番号の重複チェックをするか | 今回はしない（登録時も未チェック） |
