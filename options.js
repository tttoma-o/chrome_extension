// オプションページのスクリプト
class OptionsManager {
    constructor() {
        this.defaultSettings = {
            clientId: '',
            clientSecret: '',
            showNotifications: true,
            autoRefresh: true,
            refreshInterval: 10,
            notifyIssues: true,
            notifyPullRequests: true,
            notifyComments: false
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
    }

    setupEventListeners() {
        // 設定保存ボタン
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // 設定リセットボタン
        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        // キャッシュクリアボタン
        document.getElementById('clearCache').addEventListener('click', () => {
            this.clearCache();
        });

        // データエクスポートボタン
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // ヘルプリンク
        document.getElementById('helpLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHelp();
        });

        // フィードバックリンク
        document.getElementById('feedbackLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showFeedback();
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(Object.keys(this.defaultSettings));
            const settings = { ...this.defaultSettings, ...result };
            
            // フォームに値を設定
            document.getElementById('clientId').value = settings.clientId;
            document.getElementById('clientSecret').value = settings.clientSecret;
            document.getElementById('showNotifications').checked = settings.showNotifications;
            document.getElementById('autoRefresh').checked = settings.autoRefresh;
            document.getElementById('refreshInterval').value = settings.refreshInterval;
            document.getElementById('notifyIssues').checked = settings.notifyIssues;
            document.getElementById('notifyPullRequests').checked = settings.notifyPullRequests;
            document.getElementById('notifyComments').checked = settings.notifyComments;
            
        } catch (error) {
            console.error('設定の読み込みに失敗しました:', error);
            this.showMessage('設定の読み込みに失敗しました', 'error');
        }
    }

    async saveSettings() {
        try {
            const settings = {
                clientId: document.getElementById('clientId').value.trim(),
                clientSecret: document.getElementById('clientSecret').value.trim(),
                showNotifications: document.getElementById('showNotifications').checked,
                autoRefresh: document.getElementById('autoRefresh').checked,
                refreshInterval: parseInt(document.getElementById('refreshInterval').value),
                notifyIssues: document.getElementById('notifyIssues').checked,
                notifyPullRequests: document.getElementById('notifyPullRequests').checked,
                notifyComments: document.getElementById('notifyComments').checked
            };

            // バリデーション
            if (settings.clientId && !this.isValidClientId(settings.clientId)) {
                this.showMessage('Client IDの形式が正しくありません', 'error');
                return;
            }

            if (settings.clientSecret && !this.isValidClientSecret(settings.clientSecret)) {
                this.showMessage('Client Secretの形式が正しくありません', 'error');
                return;
            }

            // 設定を保存
            await chrome.storage.local.set(settings);
            
            // manifest.jsonのOAuth設定を更新
            if (settings.clientId) {
                await this.updateManifestOAuth(settings.clientId);
            }
            
            this.showMessage('設定を保存しました', 'success');
            
            // 設定変更をバックグラウンドスクリプトに通知
            chrome.runtime.sendMessage({ action: 'settingsUpdated', settings: settings });
            
        } catch (error) {
            console.error('設定の保存に失敗しました:', error);
            this.showMessage('設定の保存に失敗しました', 'error');
        }
    }

    async resetSettings() {
        if (confirm('設定をリセットしますか？この操作は元に戻せません。')) {
            try {
                // デフォルト設定にリセット
                await chrome.storage.local.set(this.defaultSettings);
                
                // フォームをリセット
                await this.loadSettings();
                
                this.showMessage('設定をリセットしました', 'success');
                
            } catch (error) {
                console.error('設定のリセットに失敗しました:', error);
                this.showMessage('設定のリセットに失敗しました', 'error');
            }
        }
    }

    async clearCache() {
        if (confirm('キャッシュをクリアしますか？ログイン状態もリセットされます。')) {
            try {
                // 認証関連のデータをクリア
                await chrome.storage.local.remove(['githubToken', 'githubUser', 'cachedRepos', 'cachedIssues', 'cachedNotifications']);
                
                this.showMessage('キャッシュをクリアしました', 'success');
                
            } catch (error) {
                console.error('キャッシュのクリアに失敗しました:', error);
                this.showMessage('キャッシュのクリアに失敗しました', 'error');
            }
        }
    }

    async exportData() {
        try {
            // 全データを取得
            const allData = await chrome.storage.local.get(null);
            
            // データをJSONファイルとしてダウンロード
            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `github-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.showMessage('データをエクスポートしました', 'success');
            
        } catch (error) {
            console.error('データのエクスポートに失敗しました:', error);
            this.showMessage('データのエクスポートに失敗しました', 'error');
        }
    }

    async updateManifestOAuth(clientId) {
        try {
            // 注意: Manifest V3では実行時にOAuth設定を変更できません
            // この機能は将来のアップデートで実装予定
            console.log('OAuth Client IDを更新しました:', clientId);
            
        } catch (error) {
            console.error('OAuth設定の更新に失敗しました:', error);
        }
    }

    showHelp() {
        const helpContent = `
GitHub連携拡張機能の使い方

1. GitHub OAuthアプリの設定
   - GitHubのDeveloper SettingsでOAuthアプリを作成
   - Authorization callback URL: chrome-extension://[extension-id]/
   - Client IDとClient Secretを取得して設定に入力

2. 機能
   - リポジトリ一覧の表示
   - イシュー・プルリクエストの管理
   - 通知の確認
   - 自動更新機能

3. トラブルシューティング
   - 認証エラー: Client ID/Secretを確認
   - データが表示されない: キャッシュをクリア
   - 更新されない: 自動更新設定を確認
        `;
        
        alert(helpContent);
    }

    showFeedback() {
        const feedbackUrl = 'https://github.com/your-repo/issues/new?title=GitHub連携拡張機能フィードバック';
        window.open(feedbackUrl, '_blank');
    }

    isValidClientId(clientId) {
        // GitHub Client IDの形式チェック（20文字の英数字）
        return /^[a-zA-Z0-9]{20}$/.test(clientId);
    }

    isValidClientSecret(clientSecret) {
        // GitHub Client Secretの形式チェック（40文字の英数字）
        return /^[a-zA-Z0-9]{40}$/.test(clientSecret);
    }

    showMessage(message, type = 'info') {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        
        // 3秒後にメッセージを非表示
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }
}

// オプションマネージャーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});
