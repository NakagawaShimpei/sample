# 実装解説ノート

対象読者: JS/TS 学習済み・React はほぼ未経験

---

## 目次

| # | 機能名 | 作成日 |
|---|--------|--------|
| [A1](#a1-リソース編集機能) | リソース編集機能 | 2026-04-27 |
| [U1](#u1-重複予約ブロック) | 重複予約ブロック | 2026-04-27 |
| [RA1](#ra1-定期予約) | 定期予約 | 2026-05-11 |

---

## A1: リソース編集機能

### 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/api.ts` | 変更 | `updateRoom` / `updateDevice` 追加 |
| `src/contexts/DataContext.tsx` | 変更 | `updateRoom` / `updateDevice` メソッド追加、型定義更新 |
| `src/App.tsx` | 変更 | 編集ページ 2 本のルート追加 |
| `src/pages/RoomEditPage.tsx` | 新規 | 会議室編集フォーム |
| `src/pages/DeviceEditPage.tsx` | 新規 | デバイス編集フォーム |
| `src/pages/RoomListPage.tsx` | 変更 | 編集ボタン追加 |
| `src/pages/DeviceListPage.tsx` | 変更 | 編集ボタン追加 |

---

### 全体の依存関係

```
ブラウザ URL (/rooms/:id/edit)
    ↓ App.tsx がルートを解決
RoomEditPage
    ↓ useParams() で id を取得
    ↓ useData() で rooms・updateRoom を取得（DataContext から）
DataContext
    ↓ updateRoom() → api.updateRoom() を呼ぶ
api.ts
    ↓ PATCH /rooms/:id をサーバーへ送信
json-server (db.json を更新)
    ↑ 更新後のデータを返す
DataContext
    ↑ setRooms() でローカルの state を更新 → 全コンポーネントが再描画
```

---

### 1. `src/api.ts` — `updateRoom` / `updateDevice` 追加

ここは純粋な TypeScript で、React は一切関係ない。

#### 汎用ラッパー `request<T>()`

`updateRoom` / `updateDevice` が内部で呼んでいる共通関数。すべての API 呼び出しはこれを経由する。

```ts
async function request<T>(path: string, options?: RequestInit): Promise<T>
```

**処理フロー:**

1. **fetch でリクエストを送る**

   ```ts
   const res = await fetch(`${API_BASE}${path}`, {
     ...options,
     headers: {
       'Accept': 'application/json',
       'Content-Type': 'application/json',
       ...(options?.headers || {}),
     },
   });
   ```

   `API_BASE` は空文字なので URL は `path` そのまま（例: `/rooms/r1abc`）。`...options` で呼び出し側のメソッドやボディを展開し、共通ヘッダーを上書きする。

2. **HTTP エラーチェック**

   ```ts
   if (!res.ok) {
     throw new Error(`API ${options?.method || 'GET'} ${path} failed: ${res.status}`);
   }
   ```

   `res.ok` は HTTP ステータスが 200〜299 のとき `true`。404 や 500 はここで例外を投げる。

3. **Content-Type チェック**

   ```ts
   if (!contentType.includes('application/json')) {
     throw new Error(`... (check that json-server is running on :3001)`);
   }
   ```

   json-server が起動していないと HTML エラーページが返ることがある。それを `res.json()` に渡すとわかりにくいエラーになるため、事前に弾いている。

4. **レスポンスを返す**

   ```ts
   if (res.status === 204) {
     return undefined as T;
   }
   return res.json();
   ```

   `204 No Content`（DELETE の応答など）はボディが空なので `res.json()` を呼べない。それ以外は JSON パースして `T` 型として返す。

**ジェネリクス `<T>` の役割:**

呼び出し側が戻り値の型を指定できる仕組み。実装はひとつで、型だけ変えて全エンドポイントに使い回せている。

```ts
request<Room[]>('/rooms')       // Promise<Room[]>
request<Room>('/rooms/r1', …)   // Promise<Room>
request<void>('/rooms/r1', …)   // Promise<void>（削除など）
```

#### 追加した関数

```ts
updateRoom: (id: string, data: Partial<Omit<Room, 'id'>>) =>
  request<Room>(`/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
```

`PATCH` は HTTP メソッドの一種で「一部だけ更新する」という意味。`PUT` が「全体を丸ごと置き換える」なのに対し、`PATCH` は「送ったフィールドだけ変える」ので、編集フォームに向いている。

#### 型の読み方

```ts
Partial<Omit<Room, 'id'>>
```

- `Omit<Room, 'id'>` → `id` を除いた Room の全フィールドの型
- `Partial<...>` → そのフィールドを全部省略可能にする

つまり「id 以外のどのフィールドを送っても OK」という型になる。

---

### 2. `src/contexts/DataContext.tsx` — `updateRoom` / `updateDevice` 追加

#### Context とは

React には「コンポーネントをまたいでデータを共有する」仕組みとして **Context API** がある。イメージはアプリ全体で使えるグローバル変数置き場。

普通の JS だとモジュールレベルの変数でグローバル共有できるが、React では画面の表示はコンポーネントの **state（状態）** に連動している。グローバル変数を変えても画面は更新されない。Context を使うと「値が変わったとき、その値を使っている全コンポーネントが自動で再描画される」グローバル共有が実現できる。

#### `useState` とは

```ts
const [rooms, setRooms] = useState<Room[]>([]);
```

JS でいうと `let rooms = []` に近いが、決定的な違いがある。`setRooms(新しい値)` を呼ぶと **React が自動で画面を再描画する** という仕組みが組み込まれている。単純に `rooms = 新しい値` と代入しても画面は変わらない。必ず setter を使う必要がある。

#### 追加した `updateRoom`

```ts
const updateRoom = async (id: string, data: Partial<Omit<Room, 'id'>>) => {
  const updated = await api.updateRoom(id, data);
  setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
};
```

処理の流れ:
1. `api.updateRoom` でサーバーに PATCH を送り、更新後のデータを受け取る
2. `setRooms(...)` で rooms の配列を更新する

`setRooms` に `(prev) => ...` の形（関数）を渡しているのは「複数の state 更新が同時に起きたとき、更新が上書きされないようにするための安全な書き方」。`prev` には常に最新の rooms が入ってくる。`map` の中は「対象の id なら更新後のデータに差し替え、それ以外はそのまま」という標準的な配列操作。

#### `api.ts` の `updateRoom` との関係

`updateRoom` という名前の関数は `api.ts` と `DataContext.tsx` の両方に存在する。役割が違う 2 層構造になっている。

| ファイル | 役割 | やること |
|---|---|---|
| `api.ts` | 通信層 | サーバーに PATCH を送り、更新後のデータを返すだけ |
| `DataContext.tsx` | 状態管理層 | `api.updateRoom` を呼んだあと、React の state も更新する |

**呼び出しの流れ:**

```
RoomEditPage（コンポーネント）
    ↓ useData().updateRoom() を呼ぶ
DataContext の updateRoom（状態管理層）
    ↓ api.updateRoom() を呼ぶ
api.ts の updateRoom（通信層）
    ↓ PATCH /rooms/:id をサーバーへ送信
json-server
    ↑ 更新後の Room を返す
DataContext の updateRoom
    ↑ setRooms() で state を更新 → 画面が再描画
```

**なぜ分けるのか:**
`api.ts` に通信の詳細をまとめることで、「どんな HTTP リクエストを投げているか」を一箇所で把握できる。DataContext に直接 `fetch` を書くと、通信コードと状態管理コードが混在して読みにくくなる。

#### interface への追記

```ts
interface DataContextValue {
  ...
  updateRoom: (id: string, data: Partial<Omit<Room, 'id'>>) => Promise<void>;
  updateDevice: (id: string, data: Partial<Omit<Device, 'id' | 'status'>>) => Promise<void>;
}
```

Context から取り出せる値の型定義。ここに追記しないと、他のコンポーネントで `useData()` したときに TypeScript が「そんなメソッドは存在しない」とエラーを出す。

---

### 3. `src/App.tsx` — 2 ルート追加

#### ルーティングの仕組み

`react-router-dom` はブラウザの URL を見て「どのコンポーネントを表示するか」を決めるライブラリ。

#### 追加したルート

```tsx
<Route
  path="/rooms/:id/edit"
  element={
    <ProtectedRoute requireRole="admin">
      <RoomEditPage />
    </ProtectedRoute>
  }
/>
```

- `path="/rooms/:id/edit"` の `:id` は **URL パラメータ**。実際の URL が `/rooms/r1abc123/edit` なら `:id` に `r1abc123` が入る。
- `<ProtectedRoute requireRole="admin">` は admin でないユーザーがアクセスしたとき自動的にリダイレクトさせる既存コンポーネント。`<RoomEditPage />` を入れ子にするだけで保護が効く。

#### アクセス時の描画順序

```
/rooms/:id/edit にアクセス
    ↓
App.tsx が Route を照合
    ↓
ProtectedRoute が評価される（admin かチェック）
    ↓ admin でなければ /login へリダイレクト
    ↓ admin なら children（= <RoomEditPage />）を描画
        ↓
RoomEditPage 関数が呼ばれる
    ↓ useParams, useData, useState, useEffect... が実行される
    ↓ JSX を return する
画面に表示される
```

デバイス用も同様に `/devices/:id/edit` を追加している。

---

### 4. `src/pages/RoomEditPage.tsx` — 新規作成

#### `<RoomEditPage />` とファイルの関係

```ts
// RoomEditPage.tsx
export default function RoomEditPage() { ... }
```

JSX の `<RoomEditPage />` は「この関数を呼び出して返ってきた JSX を描画する」という意味。ファイルとコンポーネントは 1:1 対応している。React では「コンポーネントが評価される」ことを**レンダリング**と呼ぶ。関数が呼ばれて JSX が返され、前回との差分だけ DOM に反映される。`useState` や `useEffect` などのフックは「このコンポーネントがレンダリングされるたびに React が管理してくれる」仕組み。

#### コンポーネント全体の流れ

```
URL /rooms/:id/edit でアクセス
        ↓
① id を URL から取り出す（useParams）
② Context から rooms と updateRoom を取り出す（useData）
③ rooms 配列から対象の room を探す（.find）
        ↓ まだ読み込み中 → 「読み込み中...」を表示（early return）
        ↓ id に一致する room がない → エラー表示（early return）
        ↓ room が見つかった
④ useEffect で room の値をフォーム state にセット（初回のみ）
⑤ フォームを表示
⑥ 保存ボタン → handleSubmit → updateRoom → /rooms へ遷移
```

#### ① `useParams` — URL から id を取り出す

```ts
const { id } = useParams<{ id: string }>();
```

App.tsx で定義した `:id` の値をここで受け取る。`<{ id: string }>` は TypeScript に「`id` という名前のパラメータが文字列で入っている」と教えるための型引数。

#### ② `useData()` — Context からデータを取り出す

```ts
const { rooms, updateRoom, loading } = useData();
const room = rooms.find((r) => r.id === id);
```

DataContext から `rooms` 配列を取り出し、`Array.find` で URL の id と一致するものを探す。`loading` は DataContext がサーバーからのデータ取得中かどうかを表すフラグ。値が変わったとき自動で再描画が走る。

#### ③ フォーム state の宣言

```ts
const [name, setName] = useState('');
const [capacity, setCapacity] = useState('');
// ...
const [initialized, setInitialized] = useState(false);
const [error, setError] = useState<string | null>(null);
```

各入力欄に対応する state を個別に持つ。`initialized` は後述の「初回セット済みフラグ」、`error` はバリデーションや通信失敗時のメッセージ用。

#### `useNavigate` — プログラムでページ遷移する

```ts
const navigate = useNavigate();
// 保存成功後:
navigate('/rooms');
```

ボタンクリック後にコードでページを切り替えたいときに使う。`<Link>` タグがクリックによる遷移なのに対し、`useNavigate` は「条件が揃ったらプログラムで遷移する」用途（保存成功後の遷移など）。

#### `useState` — フォームの各入力値を管理する（制御コンポーネント）

フォームの入力値を React の state で管理することを**制御コンポーネント**と呼ぶ。HTML ネイティブの `<input>` は自分で値を持つが、React では `value={name}` で state を「正の源」にして、変更時に `onChange` で state を更新するパターンが基本。

```tsx
<input
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

「input の値は常に `name` state と同じ」「ユーザーが打ったら `setName` で state を更新する」という双方向バインディング。

#### ④ `useEffect` — 非同期データの初期セット

```ts
useEffect(() => {
  if (room && !initialized) {
    setName(room.name);
    setCapacity(String(room.capacity));  // 数値 → 文字列に変換
    // ...
    setInitialized(true);
  }
}, [room, initialized]);
```

`useEffect` は「**第 2 引数の配列（依存配列）に書いた値が変化したとき**に第 1 引数の関数を実行する」という仕組み。

**なぜ `useState('')` で空初期化して後からセットするのか:**
ページを開いた瞬間は DataContext がまだサーバーからデータを取得中で `rooms` が空配列の場合がある。そのため `room` は最初 `undefined` で、少し後に値が入る。`useEffect` の依存配列に `room` を書いておくと「`room` に値が入ったタイミング」で関数が実行される。

**`initialized` フラグが必要な理由:**
フラグがないと、ユーザーが名前を途中まで書き換えた後に別の理由でコンポーネントが再レンダリングされると `room.name`（サーバーの古い値）が再セットされて入力内容が消える。「一度セットしたら二度とリセットしない」ための安全弁。

**`capacity` だけ `String()` している理由:**
DB の `capacity` は数値型（`number`）だが `<input type="number">` の `value` は文字列として扱う。TypeScript の型エラーを防ぐため文字列に変換している。逆に保存時（`handleSubmit`）は `Number(capacity)` で数値に戻している。

#### ⑤ early return — 条件による表示切り替え

```tsx
if (loading) {
  return <p>読み込み中...</p>;
}
if (!room) {
  return (
    <div>
      <p className="error-msg">指定の会議室が見つかりません。</p>
      <Link to="/rooms">会議室一覧へ戻る</Link>
    </div>
  );
}
```

React のコンポーネントは「JSX を return する関数」なので JS の早期 return がそのまま使える。この 2 行でフォームより前に返しておくことで、以降のコードでは `room` が必ず存在することが確定する（型的にも `undefined` を排除できる）。

#### ⑥ `handleSubmit` — 保存処理

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();                   // ブラウザのデフォルト送信をキャンセル
  if (!name || !location || ...) {      // バリデーション
    setError('すべての項目を入力してください。');
    return;
  }
  setError(null);
  try {
    await updateRoom(id!, {
      name,
      location,
      capacity: Number(capacity),       // 文字列 → 数値に戻す
      equipment,
    });
    navigate('/rooms');                  // 成功したら一覧へ遷移
  } catch {
    setError('更新に失敗しました。再度お試しください。');
  }
};
```

`e.preventDefault()` は必須。HTML の `<form>` はデフォルトでページ全体をリロードしようとするが、React SPA ではそれをキャンセルしてコードで処理する。

`id!` の `!` は「`id` は `undefined` ではないと断言する」TypeScript の Non-null assertion。`useParams` の戻り値が型上 `string | undefined` になっているが、この時点で `room` が存在しているなら `id` も確実に存在しているため安全に使える。

#### エラー表示の条件付きレンダリング

```tsx
{error && <p className="error-msg">{error}</p>}
```

JSX の中で `{式}` と書くと式の結果を埋め込める。JS の `&&` の短絡評価をそのまま活用している。`error` が `null`（falsy）なら何も表示されず、文字列が入っていれば `<p>` が表示される。

---

### 5. `src/pages/DeviceEditPage.tsx` — 新規作成

`RoomEditPage` と構造は同じ。デバイス固有の差分のみ補足する。

#### 管理番号（`managementNumber`）の追加

会議室にはない文字列フィールド。`useState('')` で管理し、`<input type="text">` で表示するだけで特別な処理はない。

#### デバイス種別（`type`）の `<select>`

```tsx
const [type, setType] = useState<DeviceType | ''>('');

<select value={type} onChange={(e) => setType(e.target.value as DeviceType)}>
  <option value="">選択してください</option>
  {deviceTypes.map((t) => (
    <option key={t} value={t}>{t}</option>
  ))}
</select>
```

`input` と同じく `value` と `onChange` で制御コンポーネントにする。選択肢は `deviceTypes` 配列（`'ノートPC' | 'プロジェクター' | ...`）を `map` で展開して動的生成している。`key={t}` は React が差分更新するときの識別子で、リスト描画では必須。

型が `DeviceType | ''` になっているのは「未選択状態（空文字）」を初期値として表現するため。保存時のバリデーションで `!type` が `true` になって弾かれる。

#### `status` フィールドを編集できない理由

`updateDevice` の型が `Partial<Omit<Device, 'id' | 'status'>>` になっており、`status` が除外されている。編集フォームからデバイスの稼働状態（`available` / `inUse` / `maintenance`）を直接変更できない設計になっている。

---

### 6 & 7. `RoomListPage.tsx` / `DeviceListPage.tsx` — 編集ボタン追加

#### 変更の概要

会議室一覧・デバイス一覧の「操作」列に、**admin ユーザーだけに見える「編集」ボタンを追加した**。これが修正の実質的な内容。Fragment や `{' | '}` はそのボタンを JSX で書くために使った記法の説明。

#### ① `useNavigate` の追加

```ts
const navigate = useNavigate();
```

編集ボタンを押したときにプログラムでページ遷移するために追加。`<Link>` はクリックで遷移するタグだが、`<button>` の `onClick` の中では `navigate()` 関数を使う。

#### ② `isAdmin` による表示制御

```ts
const isAdmin = currentUser?.role === 'admin';
```

`{isAdmin && (...)}` という JSX の短絡評価で、一般ユーザーには編集・削除ボタンをまるごと非表示にしている。

- `isAdmin` が `false` → `false && (...)` → 何も描画しない
- `isAdmin` が `true` → Fragment の中身を描画する

#### ③ Fragment `<>...</>` で複数要素をまとめる

```tsx
{isAdmin && (
  <>
    {' | '}
    <button onClick={() => navigate(`/rooms/${room.id}/edit`)}>編集</button>
    {' | '}
    <button onClick={() => handleDelete(room.id, room.name)}>削除</button>
  </>
)}
```

JSX は必ず 1 つのルート要素でくるむ必要がある。`<div>` でくるむと余分な DOM 要素ができてしまうので、**Fragment**（`<>...</>`）を使って複数要素をまとめている。

`{' | '}` はボタン間のセパレーター。JSX 内のテキストはそのままだとホワイトスペースが消えることがあるため、空白ごと文字列として明示的に埋め込んでいる。

#### ④ `<Link>` でなく `<button>` を使う理由

既存の削除ボタンと見た目を統一するため。`link-button` という CSS クラスがボタンをリンクっぽく見せている。`<Link>` はアンカータグ（`<a>`）になるが、`<button>` は `onClick` でコードを実行できる。今回は `useNavigate` の `navigate()` を呼び出したいので `<button>` を選択している。

#### RoomListPage と DeviceListPage の差分

| | RoomListPage | DeviceListPage |
|---|---|---|
| 遷移先 | `/rooms/${room.id}/edit` | `/devices/${d.id}/edit` |
| Fragment の位置 | `<Link>予約する</Link>` の後ろ | 貸出/返却/強制返却ボタンの後ろ |

DeviceListPage は既存の貸出・返却ボタンとの兼ね合いで、Fragment が少し後ろに追加されている。

---

## U1: 重複予約ブロック

### 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/contexts/DataContext.tsx` | 変更 | `addReservation` に重複チェックを追加 |

---

### 全体の依存関係

```
RoomReservePage（フォーム送信）
    ↓ addReservation() を呼ぶ（DataContext）
DataContext の addReservation
    ↓ reservations（state）を走査して重複チェック
    ↓ 重複あり → Error をスロー → RoomReservePage の catch で alert 表示
    ↓ 重複なし → api.createReservation() を呼ぶ
api.ts
    ↓ POST /reservations をサーバーへ送信
json-server (db.json に追加)
    ↑ 作成後のデータを返す
DataContext
    ↑ setReservations() でローカルの state に追加 → 画面が再描画
```

---

### 1. `src/contexts/DataContext.tsx` — `addReservation` の変更

#### なぜ DataContext に書くのか

バリデーションを `RoomReservePage`（UI 層）に書くこともできるが、DataContext（状態管理層）に置く方が適切。理由は 2 つ。

1. **予約の整合性はデータの関心事**。「この操作を受け入れていいか」はデータ層が判断すべきで、UI 層は表示と入力受付に専念させたい。
2. **将来 UI が増えても重複チェックが効く**。もし別のページから `addReservation` を呼ぶようになっても、DataContext 側にチェックがあれば自動で保護される。

#### 重複判定アルゴリズム

2 つの時間帯 A・B が「重なっている」条件は:

```
A.start < B.end  かつ  A.end > B.start
```

図で確認:

```
既存: |--A--|
新規:    |--B--|   → A.start < B.end ✓ かつ A.end > B.start ✓ → 重複
既存: |--A--|
新規:          |--B--|   → A.end = B.start → A.end > B.start ✗ → 重複なし（端点一致はOK）
既存:    |--A--|
新規: |--B--|   → A.start = B.end → A.start < B.end ✗ → 重複なし（端点一致はOK）
```

端点が一致するだけ（例: 既存 `10:00〜11:00`、新規 `11:00〜12:00`）は連続する予約として許可している。`<` と `>` の厳密な比較（`<=` でも `>=` でもない）がポイント。

時刻は `"10:00"` のような文字列だが、`"HH:MM"` 形式は文字列のまま比較しても辞書順が時系列順と一致するので `<` / `>` が正しく動く。

#### 実装コード

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

`reservations.find(...)` は条件を満たす最初の要素を返す。見つかれば `conflict` に既存予約が入り、見つからなければ `undefined`。

#### エラーの伝播

`throw new Error(...)` で例外を投げると、`await addReservation(...)` を呼んでいる側（`RoomReservePage` の `handleSubmit`）の `catch` ブロックに飛ぶ。

```ts
// RoomReservePage.tsx
try {
  await addReservation({ ... });
  alert('予約しました。');
  navigate('/reservations');
} catch (err) {
  alert('予約に失敗しました: ' + (err instanceof Error ? err.message : ''));
}
```

`err.message` にエラーコンストラクタに渡した文字列が入っているので、そのまま `alert` で表示される。エラーハンドリングのコードは既存のまま流用できている。

#### なぜ API を呼ぶ前にチェックするのか

チェックを API 呼び出しの前に置くことで、重複が検出された場合にネットワークリクエストを一切発生させない。レスポンス待ちなしに即座にエラーを返せるため、ユーザーへのフィードバックが速い。

---

## RA1: 定期予約

### 変更ファイル一覧

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

### 全体の依存関係

```
【登録フロー】
RoomReservePage（フォーム送信）
    ↓ addRecurringReservation(recurringData, dates[]) を呼ぶ
DataContext の addRecurringReservation
    ↓ dates ごとに重複チェック（既存 reservations state を走査）
    ↓ 衝突あり → Error をスロー → RoomReservePage の catch で画面表示
    ↓ 衝突なし → api.createRecurringReservation() を呼ぶ
api.ts の createRecurringReservation
    ↓ POST /recurringReservations（親レコード作成）
    ↓ Promise.all で全日程を並列 POST /reservations
json-server（db.json に追加）
    ↑ 作成後のデータを返す
DataContext
    ↑ setReservations() で state に一括追加 → 全コンポーネントが再描画

【キャンセルフロー】
ReservationListPage（シリーズをキャンセルボタン）
    ↓ cancelRecurringSeries(recurringId, today) を呼ぶ
DataContext の cancelRecurringSeries
    ↓ api.cancelRecurringSeries() を呼ぶ
api.ts の cancelRecurringSeries
    ↓ GET /reservations?recurrenceId=xxx で対象を取得
    ↓ Promise.all で fromDate 以降を並列 DELETE
    ↓ 残存が 0 件なら DELETE /recurringReservations/:id
DataContext
    ↑ setReservations() で該当予約を state から除去 → 再描画
```

---

### 1. `src/types.ts` — 新規型の追加

#### `Reservation` への任意フィールド追加

```ts
export interface Reservation {
  // ...既存フィールド（変更なし）
  recurrenceId?: string;  // 追加
}
```

`?` は「あってもなくてもいい（省略可能）」という TypeScript の記法。通常の単発予約では `recurrenceId` が存在せず `undefined` になる。定期予約として作られた予約だけに値が入る。こうすることで既存の予約データ（db.json）を変更せずに機能を追加できる。

#### `RecurrenceType`

```ts
export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly' | 'custom';
```

繰り返しパターンを表す文字列のユニオン型（`|` で区切られた選択肢の型）。この型を使うと「週次・隔週・月次・カスタム以外の文字列を渡したらコンパイルエラーになる」という安全性が得られる。

#### `RecurringReservation`

```ts
export interface RecurringReservation {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
  // ...
  recurrenceType: RecurrenceType;
  dayOfWeek?: number;    // weekly / biweekly のとき
  dayOfMonth?: number;   // monthly のとき
  intervalDays?: number; // custom のとき
  startDate: string;
  endDate: string;
}
```

個々の予約（`Reservation`）の「親」となるレコード。繰り返しルール自体を保存する。`dayOfWeek` / `dayOfMonth` / `intervalDays` はどれか 1 つだけ使われ、他は `undefined` になる（`?` による省略可能フィールド）。

---

### 2. `src/api.ts` — `createRecurringReservation` / `cancelRecurringSeries` 追加

#### `createRecurringReservation`

```ts
createRecurringReservation: async (
  recurring: Omit<RecurringReservation, 'id'>,
  reservations: Omit<Reservation, 'id'>[]
) => {
  // ① 親レコードを作成
  const recurringId = generateId('rr');
  const parent = await request<RecurringReservation>('/recurringReservations', {
    method: 'POST',
    body: JSON.stringify({ ...recurring, id: recurringId }),
  });

  // ② 全日程を並列で一括登録
  const created = await Promise.all(
    reservations.map((r) =>
      request<Reservation>('/reservations', {
        method: 'POST',
        body: JSON.stringify({ ...r, id: generateId('res'), recurrenceId: recurringId }),
      })
    )
  );
  return { recurring: parent, reservations: created };
},
```

**なぜ ① の後に ② なのか:**
子レコード（個々の予約）に `recurrenceId`（親の id）を埋め込む必要があるため、親を先に作って id を確定させてから子を作る。

**`Promise.all` とは:**
複数の非同期処理を「同時に開始して、全部終わるのを待つ」仕組み。

```
順次実行（以前）:  [req1] → [req2] → [req3] ...  合計時間 = 1件×N件分
並列実行（現在）:  [req1]
                   [req2]  ← 同時に開始
                   [req3]  合計時間 ≈ 1件分
```

1年分の週次予約（52件）なら、順次だと52倍の時間がかかるが `Promise.all` で大幅に短縮される。

`reservations.map(...)` は各予約データに対してリクエスト関数を呼び出し、`Promise` の配列を作る。`Promise.all([...])` はその配列を受け取り、全リクエストが完了したときに解決する `Promise` を返す。

**`recurrenceId: recurringId` の埋め込み:**
```ts
body: JSON.stringify({ ...r, id: generateId('res'), recurrenceId: recurringId }),
```
`...r` で既存フィールドを展開した上に `recurrenceId` を追加している。`r` 自体には `recurrenceId` が含まれていないが、ここで付与することで db.json の各予約に親への参照が記録される。

#### `cancelRecurringSeries`

```ts
cancelRecurringSeries: async (recurringId: string, fromDate: string) => {
  // ① 対象シリーズの全予約を取得
  const all = await request<Reservation[]>(`/reservations?recurrenceId=${recurringId}`);
  // ② fromDate 以降だけ削除
  const toDelete = all.filter((r) => r.date >= fromDate);
  await Promise.all(
    toDelete.map((r) => request<void>(`/reservations/${r.id}`, { method: 'DELETE' }))
  );
  // ③ 残存が 0 件なら親レコードも削除
  const remaining = all.filter((r) => r.date < fromDate);
  if (remaining.length === 0) {
    await request<void>(`/recurringReservations/${recurringId}`, { method: 'DELETE' });
  }
},
```

`/reservations?recurrenceId=xxx` は json-server のクエリ機能。`?フィールド名=値` で条件を指定してフィルタリングしたデータを取得できる。

`fromDate` より前の予約（過去分）は履歴として残し、当日以降だけを削除する。全件削除になった場合に限り親の `RecurringReservation` レコードも削除する（孤立レコードを残さないため）。

---

### 3. `src/contexts/DataContext.tsx` — `addRecurringReservation` / `cancelRecurringSeries` 追加

#### `addRecurringReservation`

```ts
const addRecurringReservation = async (
  recurringData: Omit<RecurringReservation, 'id'>,
  dates: string[]
): Promise<void> => {
  // ① 全日程の重複チェック（U1 と同じロジック）
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

  // ② 衝突があれば全件エラー（部分登録しない）
  if (conflicts.length > 0) {
    const lines = conflicts.map(({ date: d, conflict }) => {
      const dt = new Date(`${d}T00:00:00`);
      return `  ・${dt.getMonth() + 1}月${dt.getDate()}日（${DAY_NAMES[dt.getDay()]}）${conflict.startTime}〜${conflict.endTime} にすでに予約が入っています`;
    });
    throw new Error(`以下の日程に予約の重複があります:\n${lines.join('\n')}\n終了日を変更するか…`);
  }

  // ③ API を呼び出してまとめて登録
  const reservationPayloads = dates.map((d) => ({
    roomId: recurringData.roomId, date: d,
    startTime: recurringData.startTime, endTime: recurringData.endTime,
    // ...
  }));
  const result = await api.createRecurringReservation(recurringData, reservationPayloads);

  // ④ state にまとめて追加
  setReservations((prev) => [...prev, ...result.reservations]);
};
```

**U1 との違い:**
U1 の `addReservation` は「1件だけチェックして即エラー」だが、こちらは「全日程をチェックして衝突をすべて収集してからエラー」にする。1件でも衝突があれば登録しない（部分登録なし）。

**`conflicts` 配列の型 `Array<{ date: string; conflict: Reservation }>`:**
型を明示して「どの日付（`date`）にどんな既存予約（`conflict`）と衝突したか」をまとめて持つ。この構造があるからこそ、エラーメッセージで「3月5日（水）10:00〜11:00 にすでに予約が入っています」と具体的に表示できる。

**`\n` を含む Error メッセージ:**
```ts
throw new Error(`以下の日程に予約の重複があります:\n${lines.join('\n')}\n終了…`);
```
エラーメッセージに改行文字 `\n` を含めている。呼び出し側（`RoomReservePage`）は `alert()` で表示するため、ブラウザが `\n` を改行として自動的に扱ってくれる。

**`setReservations((prev) => [...prev, ...result.reservations])`:**
`...result.reservations` は配列の**スプレッド構文**。`[...prev, ...追加分]` で既存配列と新規配列を合体させた新しい配列を作る。`prev` に直接 push することは React では NG（後述のイミュータビリティ参照）。

#### `cancelRecurringSeries`

```ts
const cancelRecurringSeries = async (recurringId: string, fromDate: string) => {
  await api.cancelRecurringSeries(recurringId, fromDate);
  setReservations((prev) =>
    prev.filter((r) => !(r.recurrenceId === recurringId && r.date >= fromDate))
  );
};
```

API 削除成功後、state からも同じ条件で除去する。`filter` の条件が `!（...）` になっているのは「削除対象に当てはまらないものだけ残す」という読み方。

#### `DataContextValue` interface への追記

```ts
interface DataContextValue {
  // ...既存
  addRecurringReservation: (
    recurringData: Omit<RecurringReservation, 'id'>,
    dates: string[]
  ) => Promise<void>;
  cancelRecurringSeries: (recurringId: string, fromDate: string) => Promise<void>;
}
```

A1 の解説と同様、ここに追記しないと他のコンポーネントで `useData()` したとき TypeScript に「存在しないメソッド」と怒られる。

#### イミュータビリティ（不変性）の原則

React の state は「直接書き換えてはいけない」というルールがある（イミュータビリティ）。

```ts
// NG: 元の配列を直接変更
prev.push(newItem);
setReservations(prev);

// OK: 新しい配列を作って渡す
setReservations((prev) => [...prev, newItem]);
```

React は「state が別の参照になったか（＝新しいオブジェクト/配列か）」で再描画を判断する。元の配列に push すると参照が変わらないため、React が変化を検知できず画面が更新されない。

---

### 4. `src/pages/RoomReservePage.tsx` — 定期予約フォーム追加

#### 追加した state 一覧

```ts
const [isRecurring, setIsRecurring] = useState(false);          // チェックボックスのON/OFF
const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');
const [intervalDays, setIntervalDays] = useState('');           // カスタム時の日数
const [endDate, setEndDate] = useState('');                     // 終了日
const [loadingMessage, setLoadingMessage] = useState<string | null>(null); // ローディング表示
```

`useState<string | null>(null)` の `null` は「何も表示しない」状態を表す。`null` は falsy なので `{loadingMessage && <LoadingOverlay .../>}` という JSX の短絡評価で「`null` のときは何も表示しない、文字列が入ったら表示する」という制御ができる。

#### `useMemo` — プレビュー日付の計算

```ts
const previewDates = useMemo(() => {
  if (!isRecurring || !date || !endDate || endDate < date) return [];
  if (recurrenceType === 'custom') {
    const n = parseInt(intervalDays);
    if (!n || n < 1 || n > 365) return [];
  }
  return calculateDates(date, endDate, recurrenceType, parseInt(intervalDays) || 1);
}, [isRecurring, date, endDate, recurrenceType, intervalDays]);
```

**`useMemo` とは:**
「**依存配列（第 2 引数）の値が変化したときだけ再計算する**」メモ化フック。

`useState` で状態が変わるとコンポーネント全体が再実行される（再レンダリング）。`previewDates` を `useMemo` なしに書くと、関係のない状態（例: `meetingName`）が変わるたびに全日程の計算が走る。`useMemo` を使うと「関係する入力（`date`, `endDate`, `recurrenceType`, `intervalDays`）が変わったときだけ再計算する」という最適化ができる。

**依存配列の読み方:**
「第 1 引数の関数の中で参照しているすべての変数を第 2 引数に列挙する」というルール。書き漏らすと古い値でキャッシュされてバグになる。

**条件を早めに弾いて空配列を返す:**
入力が揃っていない段階では計算を走らせず空配列を返す。JSX 側は `{previewDates.length > 0 && (...)}` でプレビュー欄を出し分ける。

#### `calculateDates` — 日付計算ヘルパー

```ts
function calculateDates(
  startDate: string, endDate: string,
  recurrenceType: RecurrenceType, intervalDays: number
): string[] {
  const dates: string[] = [];
  const start = parseLocalDate(startDate);
  const end   = parseLocalDate(endDate);
  // ...
}
```

コンポーネントの外（ファイルのトップレベル）に置いた純粋関数。React の state や hook を使わない単純な計算なのでコンポーネント外で定義している。

**`new Date(dateStr)` ではなく `parseLocalDate` を使う理由:**
```ts
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);  // ← ローカル時刻として生成
}
```
`new Date('2026-05-11')` と書くと、文字列を **UTC** として解釈するため、日本（UTC+9）では 2026-05-10 の 09:00 になってしまう。`new Date(年, 月, 日)` の形（引数で渡す形）を使うと**ローカル時刻**として生成されるので日付がずれない。

**月次の日付計算:**
```ts
} else if (recurrenceType === 'monthly') {
  const dayOfMonth = start.getDate();  // 開始日の「日」部分
  let monthOffset = 0;
  while (true) {
    const targetYear  = start.getFullYear() + Math.floor((start.getMonth() + monthOffset) / 12);
    const targetMonth = (start.getMonth() + monthOffset) % 12;
    // 月末丸め: その月の最終日を超えないよう Math.min で制限
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    const current = new Date(targetYear, targetMonth, Math.min(dayOfMonth, lastDay));
    if (current > end) break;
    dates.push(formatDate(current));
    monthOffset++;
  }
}
```

`new Date(year, month + 1, 0)` の `0` 日目は「翌月の 0 日目 ＝ 当月の末日」という JavaScript の仕様を使ったイディオム。例: `new Date(2026, 2, 0).getDate()` → 2月（月インデックス 1）の末日 = 28 or 29。

#### `handleSubmit` の分岐

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setRecurringError('');

  // 共通バリデーション
  if (!date || !startTime || ...) { alert('…'); return; }

  if (isRecurring) {
    // 定期予約固有のバリデーション
    if (!endDate) { alert('終了日を入力してください。'); return; }
    if (endDateTooFar) { alert('…1年以内…'); return; }
    // ...

    setLoadingMessage(`定期予約を登録中... (${previewDates.length}件)`);
    try {
      await addRecurringReservation(recurringData, previewDates);
      alert('定期予約を登録しました。');
      navigate('/reservations');
    } catch (err) {
      setRecurringError(err instanceof Error ? err.message : '…');
    } finally {
      setLoadingMessage(null);  // ← 成功・失敗どちらでもオーバーレイを消す
    }
  } else {
    // 通常予約（既存処理）
    setLoadingMessage('予約を登録中...');
    try { ... } finally { setLoadingMessage(null); }
  }
};
```

**`finally` ブロック:**
`try` が成功しても失敗しても必ず実行される。`setLoadingMessage(null)` をここに書くことで「エラーが発生したとき `finally` を書き忘れてローディングが消えない」というバグを防げる。

**エラー表示:**
通常予約・定期予約ともにエラーは `alert()` で表示する。`DataContext` が生成するエラーメッセージには `\n` が含まれるが、ブラウザの `alert` は改行をそのまま表示するため、追加のスタイル処理は不要。

#### `endDateTooFar` — 派生状態

```ts
const endDateTooFar = Boolean(
  isRecurring && date && endDate &&
  (() => {
    const maxEnd = parseLocalDate(date);
    maxEnd.setFullYear(maxEnd.getFullYear() + 1);
    return parseLocalDate(endDate) > maxEnd;
  })()
);
```

これは `useState` ではなく、レンダリングのたびに計算される**派生値**。`isRecurring` や `date`、`endDate` が変わるたびに自動で再計算される。「1年を超えているか」という判定を毎回計算するだけで副作用がないため `useState` にする必要はない。即時実行関数（`(() => {...})()`）を使っているのは、内部で変数を使った多ステップの計算を 1 式にまとめるため。

---

### 5. `src/pages/ReservationListPage.tsx` — バッジ・キャンセルボタン追加

#### 「定期」バッジ

```tsx
{r.recurrenceId && (
  <span style={{ display: 'inline-block', marginRight: 4, padding: '1px 5px',
                 fontSize: '0.75em', border: '1px solid currentColor', borderRadius: 3 }}>
    定期
  </span>
)}
{r.meetingName}
```

`r.recurrenceId` が存在する（truthy）ときだけバッジを表示する。インラインスタイルで簡易バッジを実装している。`currentColor` は CSS の特別な値で「その要素に適用されている `color` と同じ色」を意味する（テキストと枠が同じ色になる）。

#### `useMemo` で「シリーズキャンセル対象の予約 id」を計算

```ts
const seriesCancelTargets = useMemo(() => {
  const targets = new Map<string, string>();  // recurrenceId → reservation.id
  for (const r of visible) {
    if (!r.recurrenceId || r.date < today) continue;
    const currentTarget = targets.get(r.recurrenceId);
    if (!currentTarget) {
      targets.set(r.recurrenceId, r.id);
    } else {
      const currentDate = visible.find((v) => v.id === currentTarget)?.date || '';
      if (r.date < currentDate) {
        targets.set(r.recurrenceId, r.id);  // より早い日付の予約に差し替え
      }
    }
  }
  return targets;
}, [visible, today]);
```

「同じ `recurrenceId` を持つ未来の予約のうち最も早い 1 件にだけ「シリーズをキャンセル」ボタンを表示する」という仕様を実現している。

`Map<string, string>` は `recurrenceId → 最も早い予約の id` のマッピング。`for` ループで `visible` を走査しながら、同じ `recurrenceId` が出るたびに「今持っている予約日と新しい予約日を比較して、早い方に更新する」という処理をしている。

JSX 側での使い方:
```tsx
{r.recurrenceId && seriesCancelTargets.get(r.recurrenceId) === r.id && (
  <button onClick={() => handleCancelSeries(r.recurrenceId!)}>
    シリーズをキャンセル
  </button>
)}
```
`seriesCancelTargets.get(r.recurrenceId) === r.id` が「この行の予約がシリーズの代表か」の判定。`&&` を 2 つ重ねることで「`recurrenceId` がある かつ 代表行である」ときだけボタンを表示している。

**`r.recurrenceId!` の `!`:**
TypeScript は `r.recurrenceId` が `string | undefined` と知っているが、直前の `r.recurrenceId &&` で存在が確認済みなので `!` で non-null を断言している。

#### `handleCancelSeries` の件数表示

```ts
const handleCancelSeries = async (recurringId: string) => {
  if (!window.confirm('...')) return;
  const count = visible.filter(
    (r) => r.recurrenceId === recurringId && r.date >= today
  ).length;
  setLoadingMessage(`シリーズをキャンセル中... (${count}件)`);
  try {
    await cancelRecurringSeries(recurringId, today);
  } finally {
    setLoadingMessage(null);
  }
};
```

`confirm` は `window.confirm()` で確認ダイアログを表示し、キャンセルされたら `false` を返す。`if (!...) return` で処理を止める。

`count` は API を呼ぶ前に state から計算しておく。API を呼んだ後は state が更新されて count が変わってしまうため、先に計算してメッセージに埋め込んでいる。

---

### 6. `src/components/LoadingOverlay.tsx` — 新規コンポーネント

#### コンポーネントの全体像

```tsx
export default function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="loading-overlay">
      <div className="loading-dialog">
        <div className="loading-dialog-title">処理中</div>
        <div className="loading-dialog-body">
          <p>{message}</p>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**props の型定義（インライン）:**
```tsx
{ message }: { message: string }
```
引数をオブジェクトとして受け取る React の慣習（props）。`{ message }` は分割代入で、`{ message: string }` がその型。A1 の解説では別途 `interface Props` を定義したが、フィールドが 1 つなのでインラインで書いている。どちらでも動作は同じ。

**`<div className="loading-bar-fill" />` のセルフクロージングタグ:**
中身のない要素は `<div />` のように閉じられる。CSS の `::before` や animation で見た目を作るため、HTML 内容は空でよい。

#### `App.css` のスタイル

```css
.loading-overlay {
  position: fixed;   /* スクロールしても画面に固定 */
  inset: 0;          /* top/right/bottom/left をすべて 0 にする省略記法 */
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;     /* 他のすべての要素より前面に表示 */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

`position: fixed` + `inset: 0` + `z-index: 9999` の組み合わせが「画面全体を覆い、他のすべての要素より手前に表示する」オーバーレイの定石パターン。`z-index` は数値が大きいほど手前に表示される。オーバーレイが前面にある間はクリックイベントがオーバーレイに吸収されるため、背後のボタンなどは操作不可になる（`pointer-events` の設定は不要）。

#### CSS アニメーション

```css
@keyframes loading-slide {
  0%   { left: -45%; }
  100% { left: 105%; }
}

.loading-bar-fill {
  position: absolute;
  width: 40%;
  background: #003366;
  animation: loading-slide 1.4s linear infinite;
}
```

**`@keyframes`:**
アニメーションの「開始状態」〜「終了状態」を定義する CSS の構文。`loading-slide` という名前を付けておき、`.loading-bar-fill` の `animation` プロパティで参照する。

**`animation: loading-slide 1.4s linear infinite`:**
- `loading-slide`: 使用する @keyframes の名前
- `1.4s`: 1サイクルの時間
- `linear`: 等速で動く（`ease` などを指定すると加減速する）
- `infinite`: 無限に繰り返す

`left: -45%` から `left: 105%` へ移動することで「バーがトラックの左端から右端へ流れていく」インジケーターになる。`position: absolute` にしてトラック（`.loading-bar-track`）を `overflow: hidden` にすることで、トラックの外にはみ出た部分が見えなくなる。

#### なぜ共通コンポーネントにするのか

RoomReservePage と ReservationListPage の両方でオーバーレイが必要になった。`src/components/LoadingOverlay.tsx` として切り出すことで、スタイルの変更やメッセージ表示の改善が 1 箇所で済む。使う側は `<LoadingOverlay message="..." />` と 1 行書くだけ。
