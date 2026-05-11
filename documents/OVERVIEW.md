# アプリケーション概要

職場のリソース（会議室・デバイス）を管理するSPA。React 19 + TypeScript フロントエンド、json-server モックバックエンド構成。

---

## 起動コマンド

```bash
npm start          # API(3001) + React(3000) 同時起動
npm run start:api  # APIサーバーのみ
npm run start:app  # Reactアプリのみ
npm test           # テスト実行
npm run build      # 本番ビルド
```

---

## テストアカウント

| ユーザー名 | パスワード | ロール |
|-----------|-----------|--------|
| admin | admin123 | 管理者 |
| user | user123 | 利用者 |
| sato | sato123 | 利用者 |
| suzuki | suzuki123 | 利用者 |

---

## 画面・機能一覧

### 全ユーザー共通

#### ログイン (`/login`)
- ユーザー名・パスワードでログイン
- 認証成功後 `/rooms` へリダイレクト

#### 会議室一覧 (`/rooms`)
- 会議室一覧を表示（名前・場所・収容人数・設備）
- 「予約する」ボタンで予約フォームへ遷移
- ※ 管理者のみ「削除」ボタン表示（関連予約も連鎖削除）

#### 会議室予約 (`/rooms/:roomId/reserve`)
- 日付・開始時刻・終了時刻・参加人数・会議名・参加者を入力して予約作成
- 作成後 `/reservations` へリダイレクト

#### 予約一覧 (`/reservations`)
- 自分の予約一覧を表示（会議名・会議室・日時・参加者）
- 「キャンセル」で予約削除

#### デバイス一覧 (`/devices`)
- デバイス一覧を表示（名前・種別・管理番号・保管場所・ステータス）
- 「貸出」ボタン（`available` のデバイス）→ ステータスを `inUse` に変更、貸出記録作成
- 「返却」ボタン（自分が借りたデバイス）→ ステータスを `available` に変更、貸出記録削除

### 管理者のみ

#### 予約一覧 (`/reservations`) ※管理者モード
- 全ユーザーの予約を表示
- 任意の予約をキャンセル可能

#### デバイス一覧 (`/devices`) ※管理者モード
- 「強制返却」ボタン（他ユーザーが借りているデバイスも返却可能）
- 「削除」ボタン（関連貸出記録も連鎖削除）

#### 貸出状況 (`/loans`)
- 現在の全貸出一覧を表示（デバイス名・種別・管理番号・借用者・貸出日時）
- 読み取り専用

#### 会議室登録 (`/rooms/register`)
- 会議室名・場所・収容人数・設備を入力して新規登録

#### デバイス登録 (`/devices/register`)
- デバイス名・保管場所・管理番号・種別（ノートPC / プロジェクター / Web会議機器 / モニター / その他）を入力して新規登録
- 初期ステータスは `available`

#### ユーザー一覧 (`/users`)
- 全ユーザー一覧を表示（ユーザー名・表示名・ロール・パスワード）
- 利用者ロールかつ自分以外のユーザーを削除可能

#### ユーザー登録 (`/users/register`)
- ユーザー名・パスワード・表示名を入力して新規ユーザー登録（ロールは `user` 固定）

---

## データ構造

| コレクション | 件数 | 主なフィールド |
|------------|------|--------------|
| rooms | 42件 | id, name, location, capacity, equipment |
| reservations | 5件 | id, roomId, date, startTime, endTime, attendeeCount, meetingName, reservedBy, participants |
| devices | 42件 | id, name, location, managementNumber, type, status |
| loans | 3件 | id, deviceId, borrowedBy, borrowedAt |
| users | 6件 | id, username, password, displayName, role |
| reservationHistory | 読取専用 | db-history.json から取得 |
| loanHistory | 読取専用 | db-history.json から取得 |

---

## アーキテクチャ

```
ブラウザ (React SPA :3000)
  ├── AuthContext     ログインセッション管理 (sessionStorage)
  ├── DataContext     全データのグローバル状態 + CRUD操作
  ├── ProtectedRoute  認証・権限ガード (UIのみ)
  └── api.ts          fetch ラッパー
         ↓ proxy
json-server (:3001)
  ├── db.json         永続化ストア (rooms/reservations/devices/loans/users)
  └── db-history.json 読み取り専用履歴データ
```

---

## セキュリティ上の懸念事項

> このプロジェクトは学習・プロトタイプ目的のため、製品として販売・本番運用する場合は以下の問題をすべて修正する必要があります。

### CRITICAL（製品化不可レベル）

#### 1. APIエンドポイントに認証・認可が一切ない（`server.js`）
- json-serverにミドルウェアがなく、全エンドポイントへ未認証でCRUD操作が可能
- ログイン不要で任意のユーザー（adminを含む）をcurlで作成・削除できる
- 例: `curl -X POST http://localhost:3001/users -H "Content-Type: application/json" -d '{"id":"u999","username":"attacker","role":"admin",...}'`

#### 2. パスワードが平文保存・平文転送される（`db.json`, `src/api.ts:69`）
- 全ユーザーのパスワードが `db.json` に平文で記録されている
- `/users` APIがパスワードフィールドを含めてレスポンスを返す
- DevTools → Network タブで全ユーザーのパスワードが確認できる

#### 3. 認証処理がクライアント側のみ（`src/contexts/AuthContext.tsx:34-50`）
- パスワード検証がブラウザ上のJavaScriptで行われ、サーバー側に認証ロジックがない
- DevToolsコンソールで `sessionStorage.setItem('we-sample-auth', '{"username":"user","role":"admin","displayName":"X"}')` を実行するだけでadmin権限を自己付与できる

#### 4. ユーザー管理画面で全パスワードが平文表示される（`src/pages/UserListPage.tsx:38`）
- テーブルに `{u.password}` が表示され、admin画面を見るだけで全ユーザーのパスワードが分かる

#### 5. `db.json` がGit管理対象（`.gitignore` に未記載）
- リポジトリをpushすると全ユーザーの平文パスワードが公開される
- 一度でも公開されるとfork・archive・キャッシュに永続残存する

#### 6. 全ユーザーのパスワードがAPIレスポンスに含まれる（`src/api.ts:69`）
- `listUsers()` が `UserRecord[]`（password含む）をそのまま返す
- DataContextに全ユーザーのパスワードがブラウザメモリ上に展開される

### HIGH（重大リスク）

#### 7. クライアント側のみの権限チェック（`src/components/ProtectedRoute.tsx`, `src/pages/ReservationListPage.tsx:59-67`）
- admin限定UIのガードはクライアント側のみ。APIに権限チェックがないため、一般ユーザーが他人の予約をキャンセルしたりデバイス状態を改ざんできる

#### 8. 全データがクライアントに読み込まれる（`src/contexts/DataContext.tsx`）
- フィルタリングはUIのみ。一般ユーザーのブラウザにも全員の予約・貸出データが存在し、他人の情報を確認できる

#### 9. ロール情報がクライアント側で管理・改ざん可能（`src/contexts/AuthContext.tsx:39-43`）
- セッションストレージのJSON内の `role` フィールドを書き換えるだけでUIの権限チェックをバイパスできる

#### 10. セッション情報が sessionStorage に平文保存（`src/contexts/AuthContext.tsx:14-32`）
- XSS脆弱性があるとJavaScriptからセッション情報を盗み取れる

#### 11. テスト用認証情報がUIにハードコード（`src/pages/LoginPage.tsx:60-66`）
- ログイン画面に `user/user123`, `admin/admin123` が表示されており、プロダクション展開時も残る

### MEDIUM

#### 12. ログアウト機能がない（`src/components/Layout.tsx`）
- セッションを明示的に終了する手段がなく、共有PCでセッションが残存する

#### 13. セッションタイムアウトがない
- ブラウザを閉じるまでセッションが継続する

#### 14. IDが予測可能（`src/api.ts:27-30`）
- `Date.now() + Math.random()` で生成されるIDは推測可能で、他人のリソースIDを推測してAPIを直接操作できる

#### 15. 履歴データが無認証で公開される（`server.js:16-20`）
- `/reservationHistory`, `/loanHistory` が認証なしでアクセス可能

#### 16. 環境変数による設定管理がない
- APIポート・セッションキーなどがハードコードされており、環境ごとの切り替えができない

### LOW

#### 17. ユーザー列挙の可能性（`src/pages/LoginPage.tsx:18`）
- ログイン失敗時のエラーメッセージが「ユーザー名またはパスワードが違います」と両方を示す

---

## OWASP Top 10 対応状況

| 項目 | 状況 |
|------|------|
| A01 Broken Access Control | **CRITICAL** – APIに認可なし |
| A02 Cryptographic Failures | **CRITICAL** – パスワード平文保存 |
| A04 Insecure Design | **CRITICAL** – サーバー側認証なし |
| A05 Security Misconfiguration | **HIGH** – 認証情報ハードコード |
| A07 Identification and Auth Failures | **CRITICAL** – クライアント側認証のみ |
| A09 Logging and Monitoring Failures | **HIGH** – ログ機能なし |

---

## 製品化に向けた修正優先順位

### 即時対応（CRITICAL）
1. サーバー側にJWT認証ミドルウェアを実装する
2. APIに認可チェックを実装する（adminロールの検証）
3. パスワードをbcryptでハッシュ化する
4. APIレスポンスからpasswordフィールドを除外する
5. UserListPageのパスワード表示を削除する
6. `db.json` を `.gitignore` に追加し、Gitの履歴からも削除する

### 短期対応（HIGH）
7. ログアウト機能を実装する
8. セッション有効期限を設定する
9. HTTPSを強制する
10. ロール情報をトークンに含め、サーバー側で毎回検証する
11. ログイン画面のテスト認証情報を削除する
12. 監査ログを実装する

### 中期対応（MEDIUM）
13. Content Security Policy (CSP) を設定する
14. IDをUUID v4などに変更する
15. 環境変数で設定を管理する
16. 履歴エンドポイントに認証を追加する
