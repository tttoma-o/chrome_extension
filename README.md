<<<<<<< HEAD
# chrome_extension
=======
# GitHub連携Chrome拡張機能

GitHubと連携してリポジトリやイシューを管理できるChrome拡張機能です。

## 機能

- **GitHub OAuth認証**: 安全な認証システム
- **リポジトリ一覧**: あなたのリポジトリを表示・管理
- **イシュー管理**: イシューとプルリクエストの確認
- **通知確認**: GitHub通知の確認と既読化
- **自動更新**: 定期的なデータ更新
- **設定ページ**: 詳細な設定オプション

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/github-chrome-extension.git
cd github-chrome-extension
```

### 2. 設定ファイルの準備

```bash
# 設定ファイルをコピー
npm run setup

# または手動で
cp config.example.json config.json
```

### 3. GitHub OAuthアプリの作成

1. GitHubにログインし、[Developer Settings](https://github.com/settings/developers)にアクセス
2. "New OAuth App"をクリック
3. 以下の情報を入力：
   - **Application name**: GitHub連携拡張機能
   - **Homepage URL**: `https://github.com`
   - **Authorization callback URL**: `chrome-extension://[拡張機能ID]/`
4. "Register application"をクリック
5. **Client ID**と**Client Secret**をメモ

### 2. 拡張機能のインストール

1. Chromeで`chrome://extensions/`を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このフォルダを選択

### 3. 設定

1. 拡張機能のアイコンをクリック
2. 「オプション」をクリック
3. GitHub OAuthアプリの**Client ID**と**Client Secret**を入力
4. 「設定を保存」をクリック

## 使用方法

### ログイン

1. 拡張機能のアイコンをクリック
2. 「GitHubでログイン」をクリック
3. GitHubの認証ページで認証を完了

### 機能の使い方

- **リポジトリタブ**: あなたのリポジトリ一覧を表示
- **イシュータブ**: イシューとプルリクエストを表示
- **通知タブ**: GitHub通知を確認・管理

## 📁 ファイル構成

```
chrome_extension/
├── manifest.json              # 拡張機能の設定ファイル
├── popup.html/css/js          # メインのポップアップ画面
├── background.js              # バックグラウンド処理とGitHub API連携
├── options.html/css/js        # 設定ページ
├── github-guide.html/css      # GitHub初心者ガイド
├── icons/                     # アイコンファイル
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── config.example.json        # 設定ファイルのテンプレート
├── package.json               # npm設定ファイル
├── .eslintrc.json             # ESLint設定
├── .prettierrc                # Prettier設定
├── .gitignore                 # Git除外設定
├── .gitattributes             # Git属性設定
├── SECURITY.md                # セキュリティガイド
└── README.md                  # このファイル
```

## 🛠️ 開発用コマンド

```bash
# 設定ファイルの準備
npm run setup

# 拡張機能のパッケージ化
npm run package

# コードのフォーマット
npm run lint

# ビルドファイルのクリーンアップ
npm run clean
```

## 開発者向け情報

### 必要な権限

- `storage`: 設定とデータの保存
- `activeTab`: 現在のタブへのアクセス
- `identity`: OAuth認証
- `https://api.github.com/*`: GitHub APIへのアクセス

### API使用量

この拡張機能はGitHub APIを使用します。レート制限に注意してください：
- 認証済みユーザー: 5,000リクエスト/時間
- 未認証ユーザー: 60リクエスト/時間

### セキュリティ

- OAuth認証を使用して安全にGitHubにアクセス
- トークンはChromeのローカルストレージに暗号化して保存
- Client Secretは設定ページでのみ入力

## トラブルシューティング

### よくある問題

1. **認証エラー**
   - Client IDとClient Secretが正しいか確認
   - Authorization callback URLが正しく設定されているか確認

2. **データが表示されない**
   - インターネット接続を確認
   - GitHub APIのレート制限に達していないか確認

3. **更新されない**
   - 設定ページで自動更新が有効になっているか確認
   - 手動で更新ボタンをクリック

### ログの確認

Chromeのデベロッパーツールでコンソールログを確認できます：
1. `chrome://extensions/`を開く
2. 拡張機能の「詳細」をクリック
3. 「バックグラウンドページを検査」をクリック

## ライセンス

MIT License

## 貢献

バグ報告や機能要望はGitHubのIssuesでお知らせください。

## 更新履歴

### v1.0 (2024-10-12)
- 初回リリース
- GitHub OAuth認証
- リポジトリ一覧表示
- イシュー・プルリクエスト管理
- 通知確認機能
- 設定ページ
>>>>>>> ecbde9a (chore: initial commit for GitHub-integrated Chrome extension)
