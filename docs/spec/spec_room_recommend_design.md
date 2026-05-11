# 設計仕様書：代替会議室レコメンド機能

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/pages/RoomReservePage.tsx` | UI変更・ロジック追加 | ①予約対象会議室の設備表示追加 ②レコメンドパネルの表示・スコアリングロジックの追加 |

---

## 予約対象会議室の設備表示

`RoomReservePage.tsx` の会議室情報表示箇所に `room.equipment` を追加する。

| 項目 | 内容 |
|---|---|
| 表示値 | `room.equipment` の文字列をそのまま表示（パース・分割なし） |
| 設備なしの場合 | `room.equipment === '-'` のとき「なし」と表示する |

---

## 発動閾値（定数）

定数として定義し、将来の調整を容易にする。

```typescript
const RECOMMEND_TRIGGER_CAPACITY = 20;     // この定員以上の部屋を対象とする
const RECOMMEND_TRIGGER_MAX_ATTENDEES = 4; // この参加人数以下のときに発動する
const RECOMMEND_MAX_COUNT = 5;             // レコメンドの最大表示件数
```

---

## レコメンド候補の選定ロジック

DataContext の `rooms[]`（すでにメモリ上）から算出する。追加の API リクエストは発生しない。

### ステップ1：フィルタリング

```typescript
const candidates = rooms
  .filter(r => r.id !== selectedRoom.id)                  // 選択中の会議室を除外
  .filter(r => r.capacity >= attendeeCount)               // 参加人数を収容できる部屋のみ
  .filter(r => r.capacity <= selectedRoom.capacity);      // 選択中会議室より大きい部屋を除外
```

### ステップ2：スコアリング

| 基準 | 加算スコア |
|---|---|
| 選択中会議室との共通設備（1件につき） | +10点 |
| 同一ロケーション（`location` 完全一致） | +2点 |
| 本社内の別フロア（`location` が「本社」で始まる） | +1点 |

```typescript
const selectedEquipment = selectedRoom.equipment
  .split(',')
  .map(e => e.trim())
  .filter(e => e !== '-');

const recommended = candidates
  .map(r => {
    const rEquipment = r.equipment.split(',').map(e => e.trim()).filter(e => e !== '-');
    const commonCount = rEquipment.filter(e => selectedEquipment.includes(e)).length;
    const locationScore =
      r.location === selectedRoom.location ? 2
      : r.location.startsWith('本社') ? 1
      : 0;
    return { ...r, score: commonCount * 10 + locationScore };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, RECOMMEND_MAX_COUNT);
```

設備のパース方法（`,` 区切り・`"-"` 除外）は [spec_room_filter.md](spec_room_filter.md) の設備フィルターと統一する。

スコアリング例（参加人数2名・r004 選択時・定員フィルター適用後の上位5件）:

r004 の設備：プロジェクター・マイク・Web会議システム（3件）、定員：30名

| 順位 | 部屋名 | 定員 | 共通設備 | 共通数 | ロケーション加点 | スコア |
|---|---|---|---|---|---|---|
| 1 | r032 大会議室C | 25名 | プロジェクター・マイク・Web会議システム | 3 | +2（本社5F 同一） | 32点 |
| 2 | r005 大会議室B | 20名 | プロジェクター・マイク | 2 | +2（本社5F 同一） | 22点 |
| 3 | r006 役員会議室 | 12名 | プロジェクター・Web会議システム | 2 | +1（本社7F） | 21点 |
| 4 | r001 第1会議室 | 10名 | プロジェクター | 1 | +1（本社3F） | 11点 |
| 5 | r031 プロジェクトルーム4 | 10名 | Web会議システム | 1 | +1（本社4F） | 11点 |

同スコアの場合は `rooms[]` の並び順（id 昇順）で決定する。  
※ キャパフィルター（定員 ≤ 30名）により r033（60名）などの大部屋は除外される。

---

## 状態管理

コンポーネントローカルの state で管理する（DataContext への変更なし）。

```typescript
const [recommended, setRecommended] = useState<Room[]>([]);
```

`attendeeCount` の変更時に発動条件を評価し `recommended` を再計算する。

---

## クエリパラメータ（遷移時）

「この部屋で予約する」ボタンクリック時に以下のクエリパラメータを付与して遷移する。

| パラメータ | 対応フォームフィールド | 型 | 例 |
|---|---|---|---|
| `date` | 日付 | `YYYY-MM-DD` | `2026-05-11` |
| `startTime` | 開始時刻 | `HH:MM` | `10:00` |
| `endTime` | 終了時刻 | `HH:MM` | `11:00` |
| `attendeeCount` | 参加人数 | 整数文字列 | `2` |

遷移先の `RoomReservePage` はマウント時にクエリパラメータを読み取り、各フィールドの初期値としてセットする。パラメータが存在しない場合は既存の初期値を維持する。

---

## 制約・前提

- `rooms[]` はすでに DataContext でメモリ上に保持されているため、レコメンド計算で追加の API リクエストは発生しない
- 役員会議室（r006）・経営会議室（r041）など利用制限のある部屋を除外する `restricted` フラグが `Room` 型に存在しないため、除外制御は実装対象外とする
- クエリパラメータによる遷移先フォームへのプリフィルには、`RoomReservePage` 側での `useSearchParams` 等を用いた読み取り処理の追加が必要となる
