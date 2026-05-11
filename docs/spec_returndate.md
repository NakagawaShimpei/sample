# 仕様書：デバイス一覧 返却予定日機能

## 概要

デバイス一覧画面に「返却予定日」列を追加する。貸出時に任意で返却予定日を設定でき、貸出中のデバイスに対して設定済みの返却予定日を表示する。

---

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/types.ts` | 型定義追加 | `Loan` に `returnDueDate` フィールド追加 |
| `src/contexts/DataContext.tsx` | シグネチャ変更 | `borrowDevice` に `returnDueDate` 引数追加 |
| `src/pages/DeviceListPage.tsx` | UI変更 | 返却予定日列・日付入力欄の追加 |

---

## 詳細仕様

### 1. データモデル変更（`src/types.ts`）

`Loan` インターフェースに以下フィールドを追加する。

```typescript
returnDueDate?: string;  // YYYY-MM-DD 形式、任意
```

- 既存の貸出レコードとの後方互換性を保つため optional（`?`）とする。

---

### 2. DataContext（`src/contexts/DataContext.tsx`）

#### `borrowDevice` シグネチャ変更

```typescript
// 変更前
borrowDevice: (deviceId: string, borrowedBy: string) => Promise<void>

// 変更後
borrowDevice: (deviceId: string, borrowedBy: string, returnDueDate?: string) => Promise<void>
```

- `returnDueDate` が指定された場合のみ、貸出レコード（`Loan`）に `returnDueDate` を含めて保存する。
- 未指定（`undefined`）の場合はフィールド自体を省略し、既存挙動を維持する。

---

### 3. デバイス一覧画面（`src/pages/DeviceListPage.tsx`）

#### テーブル列構成（変更後）

| 列 | 内容 |
|---|---|
| デバイス名 | 変更なし |
| 種別 | 変更なし |
| 管理番号 | 変更なし |
| 場所 | 変更なし |
| ステータス | 変更なし |
| **返却予定日** | **新規追加** |
| 操作 | 変更なし |

#### 返却予定日列の表示ルール

| デバイスステータス | 表示内容 |
|---|---|
| `available`（利用可能） | 日付入力欄（`<input type="date">`） |
| `inUse`（使用中） | 貸出レコードの `returnDueDate`。未設定の場合は `—` を表示 |
| `maintenance`（メンテナンス中） | 空欄 |

#### 日付入力欄の仕様

- **入力タイプ**: `date`（ブラウザ標準のデートピッカー）
- **選択可能範囲**: 当日以降（`min` 属性に実行日の日付を設定）
- **入力は任意**: 空のまま貸出ボタンを押すことができる
- **状態管理**: コンポーネントローカルの `dueDates: Record<string, string>` で各デバイスの入力値を管理
- **貸出後のリセット**: 貸出成功時に該当デバイスの入力値を自動クリアする

#### 貸出フロー

```
1. ユーザーが返却予定日入力欄に日付を入力する（任意）
2. 「貸出」ボタンをクリック
3. 確認ダイアログを表示
4. OK 押下で borrowDevice(id, username, returnDueDate?) を呼び出す
5. 貸出成功後、入力欄をリセット
6. テーブルの返却予定日セルに設定日付を表示（未設定なら「—」）
```

---

## 制約・前提

- `returnDueDate` の値は `YYYY-MM-DD` 形式の文字列として保存・表示される（ISO 8601 日付部分）。
- 返却予定日の超過チェック・アラート機能は本変更のスコープ外とする。
- 返却操作時に `returnDueDate` は貸出レコードごと削除される（既存の返却処理と同様）。
- json-server の `/loans` エンドポイントは PATCH 未使用のため、貸出後の返却予定日変更は非サポート。
