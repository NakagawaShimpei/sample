# 開発環境構築手順（Day1 向け）

## はじめに

このドキュメントは、新人研修Day1で実施する開発環境構築の手順書です。  
まっさらなWindows PCを前提に、サンプルアプリを起動できるまでを案内します。

- **所要時間の目安**: 1〜2時間
- **前提**: インターネット接続済み、管理者権限の申請が済んでいること

---

## 事前に講師から受け取るもの

- [ ] Anthropic API キー（`sk-ant-...` で始まる文字列）
- [ ] サンプルアプリのリポジトリURL（例：`https://github.com/xxx/sample-we-project`）

---

## インストールするツール一覧

| # | ツール | 用途 |
|---|---|---|
| 1 | Node.js (LTS) | JavaScriptランタイム。Reactアプリと json-server を動かすために必要 |
| 2 | Git | ソースコードの取得・履歴管理 |
| 3 | Visual Studio Code | コードエディタ |
| 4 | Claude Code | AIによるコード生成・編集支援ツール |

---

## ステップ1: Node.js のインストール

1. https://nodejs.org/ にアクセス
2. **LTS版**（左側の緑色のボタン）をダウンロード
3. ダウンロードしたインストーラー（`.msi`）を実行
4. 「Next」を押しながらデフォルト設定で進める
   - ※ 「Tools for Native Modules」のチェックは**外してOK**（本研修では不要）
5. 完了後、PowerShell または Command Prompt を開いて確認：

```
node --version
npm --version
```

両方ともバージョンが表示されればOK（例：`v20.18.0`, `10.8.2`）。

---

## ステップ2: Git のインストール

1. https://git-scm.com/download/win にアクセス
2. 「64-bit Git for Windows Setup」をダウンロード
3. インストーラーを実行、基本はデフォルト設定で進める
   - エディタ選択画面で「Visual Studio Code」を選んでおくと後で楽
4. 完了後、ターミナルで確認：

```
git --version
```

バージョンが表示されればOK。

---

## ステップ3: Visual Studio Code のインストール

1. https://code.visualstudio.com/ にアクセス
2. 「Download for Windows」をクリック
3. インストーラーを実行
   - 「PATHへの追加」にチェックを入れる（デフォルトで入っている）
4. 完了後、ターミナルで確認：

```
code --version
```


## ステップ4: Claude Code のインストール

### 4-1. インストール

PowerShell を開いて以下を実行：

```
npm install -g @anthropic-ai/claude-code
```

完了後、確認：

```
claude --version
```

### 4-2. APIキーの設定

配布されたAPIキーを環境変数に設定します。

**PowerShell で恒久的に設定する場合：**

```
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-xxxxxxxx", "User")
```

設定後、**PowerShellを再起動**してから確認：

```
echo $env:ANTHROPIC_API_KEY
```

APIキーが表示されればOK。

### 4-3. 動作確認

任意のフォルダに移動して：

```
claude
```

起動して対話できればOK。`exit` または `Ctrl+C` で抜けます。

---

## ステップ5: サンプルアプリの取得とセットアップ

### 5-1. 作業フォルダに移動

```
cd C:\
mkdir work
cd work
```

（※ パスは任意。`C:\work` を例として使います）

### 5-2. リポジトリをクローン

```
git clone <講師から受け取ったリポジトリURL>
cd sample-we-project
```

### 5-3. 依存パッケージのインストール

```
npm install
```

2〜5分かかります。警告が出ても無視してOK。エラーで止まらなければ完了です。

---

## ステップ6: 動作確認

### 6-1. アプリを起動

```
npm start
```

ターミナルに以下のような表示が両方出ればOK：

- **[API]** `\{^_^}/ hi!` → json-server が起動
- **[APP]** `Compiled successfully!` → React が起動

### 6-2. ブラウザで確認

自動的にブラウザが開き、http://localhost:3000 にログイン画面が表示されます。

以下のアカウントでログイン：

| 用途 | ユーザー名 | パスワード |
|---|---|---|
| 利用者 | user | user123 |
| 管理者 | admin | admin123 |

会議室一覧が表示されれば **環境構築完了**です！

### 6-3. 停止方法

`Ctrl + C` を押すとAPIとAppの両方が停止します。

---

## よくあるトラブル

### トラブル1: `npm install -g` で権限エラーが出る

**症状**: `EACCES` や `Access denied` が表示される  
**対処**: PowerShell を「管理者として実行」で開き直す

### トラブル2: `npm start` で `EADDRINUSE` が出る

**症状**: `address already in use :::3000` または `:::3001`  
**原因**: 前回のプロセスが残っている  
**対処**:

```
netstat -ano | findstr :3001
taskkill /F /PID <表示されたPID>
```

3000ポート側も同様に対処。


### トラブル4: `claude` コマンドが見つからない

**原因**: グローバルインストール後にPATHが通っていない  
**対処**: PowerShellを再起動。それでもダメなら：

```
npm config get prefix
```

で表示されたパスが環境変数PATHに含まれているか確認。

### トラブル5: ブラウザで「このサイトにアクセスできません」と出る

**原因**: `npm start` のどちらか（APIまたはAPP）が起動していない  
**対処**: ターミナルのログを確認。赤字エラーがあればそこに原因がある。

---
