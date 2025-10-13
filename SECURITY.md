# セキュリティガイド

## 🔒 機密情報の管理

このChrome拡張機能では、GitHub OAuth認証を使用しています。以下の機密情報を安全に管理することが重要です。

### ⚠️ 絶対にGitにコミットしてはいけないファイル

- `config.json` - 実際のClient ID/Secretが含まれる
- `oauth-config.json` - OAuth設定ファイル
- `.env` - 環境変数ファイル
- 証明書ファイル（`*.pem`, `*.key`, `*.p12`）

### ✅ 安全な設定方法

#### 1. 設定ファイルの使用方法

```bash
# 設定ファイルをコピー
cp config.example.json config.json

# config.jsonを編集して実際の値を入力
# 注意: config.jsonは.gitignoreに含まれています
```

#### 2. GitHub OAuthアプリの設定

1. [GitHub Developer Settings](https://github.com/settings/developers)にアクセス
2. "New OAuth App"をクリック
3. 以下の情報を入力：
   - **Application name**: GitHub連携拡張機能
   - **Homepage URL**: `https://github.com`
   - **Authorization callback URL**: `chrome-extension://[拡張機能ID]/`
4. 生成されたClient IDとClient Secretを`config.json`に設定

#### 3. 拡張機能での設定読み込み

```javascript
// 設定ファイルを読み込む例
async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('設定の読み込みに失敗:', error);
    return null;
  }
}
```

### 🛡️ セキュリティのベストプラクティス

#### 1. Client Secretの保護
- Client Secretは**絶対に**フロントエンドのコードに含めない
- 可能な限りサーバーサイドで処理する
- 必要に応じてChrome拡張機能のストレージAPIを使用

#### 2. トークンの管理
- アクセストークンはChromeのローカルストレージに保存
- トークンの有効期限を適切に管理
- ログアウト時にトークンを削除

#### 3. 権限の最小化
- 必要最小限のスコープのみを要求
- 不要な権限は削除

#### 4. 通信のセキュリティ
- HTTPS通信のみを使用
- 機密情報は暗号化して送信

### 🔍 セキュリティチェックリスト

- [ ] Client Secretがコードに含まれていない
- [ ] 設定ファイルが.gitignoreに含まれている
- [ ] 不要な権限を削除している
- [ ] HTTPS通信のみを使用している
- [ ] トークンの適切な管理を行っている
- [ ] エラーハンドリングが適切に行われている

### 🚨 インシデント対応

もし機密情報が漏洩した場合：

1. **即座にGitHub OAuthアプリを無効化**
2. **新しいClient Secretを生成**
3. **GitHubのアクセストークンを無効化**
4. **影響を受けるユーザーに通知**

### 📞 サポート

セキュリティに関する質問や問題がある場合は、GitHubのIssuesで報告してください。

---

**注意**: このガイドは一般的なセキュリティのベストプラクティスを示しています。実際のプロダクション環境では、より厳密なセキュリティ対策が必要な場合があります。
