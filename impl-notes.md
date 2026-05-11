# 実装解説ノート

対象読者: JS/TS 学習済み・React はほぼ未経験

---

## 目次

| # | 機能名 | 作成日 |
|---|--------|--------|
| [A1](#a1-リソース編集機能) | リソース編集機能 | 2026-04-27 |
| [U1](#u1-重複予約ブロック) | 重複予約ブロック | 2026-04-27 |

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
