// バックグラウンドスクリプト
class GitHubExtension {
    constructor() {
        this.githubToken = null;
        this.user = null;
        this.init();
    }

    init() {
        // ストレージからトークンを取得
        this.loadToken();
        
        // メッセージリスナーを設定
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // 非同期レスポンスを有効にする
        });

        // 拡張機能のインストール時
        chrome.runtime.onInstalled.addListener(() => {
            this.onInstalled();
        });
    }

    async loadToken() {
        try {
            const result = await chrome.storage.local.get(['githubToken', 'githubUser']);
            this.githubToken = result.githubToken;
            this.user = result.githubUser;
        } catch (error) {
            console.error('トークンの読み込みに失敗しました:', error);
        }
    }

    async saveToken(token, user) {
        try {
            await chrome.storage.local.set({
                githubToken: token,
                githubUser: user
            });
            this.githubToken = token;
            this.user = user;
        } catch (error) {
            console.error('トークンの保存に失敗しました:', error);
        }
    }

    async clearToken() {
        try {
            await chrome.storage.local.remove(['githubToken', 'githubUser']);
            this.githubToken = null;
            this.user = null;
        } catch (error) {
            console.error('トークンの削除に失敗しました:', error);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'authenticate':
                    await this.authenticate();
                    sendResponse({ success: true, token: this.githubToken, user: this.user });
                    break;

                case 'logout':
                    await this.clearToken();
                    sendResponse({ success: true });
                    break;

                case 'getUser':
                    sendResponse({ success: true, user: this.user });
                    break;

                case 'getRepositories':
                    const repos = await this.fetchRepositories();
                    sendResponse({ success: true, data: repos });
                    break;

                case 'getIssues':
                    const issues = await this.fetchIssues();
                    sendResponse({ success: true, data: issues });
                    break;

                case 'getNotifications':
                    const notifications = await this.fetchNotifications();
                    sendResponse({ success: true, data: notifications });
                    break;

                case 'markNotificationAsRead':
                    await this.markNotificationAsRead(request.notificationId);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('メッセージハンドリングエラー:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async authenticate() {
        try {
            // OAuth認証フローを開始
            const authUrl = this.buildAuthUrl();
            
            // 認証ページを開く
            const tab = await chrome.tabs.create({ url: authUrl });
            
            // 認証完了を待機
            return new Promise((resolve, reject) => {
                const checkAuth = async (tabId, changeInfo, tab) => {
                    if (tabId === tab.id && changeInfo.url) {
                        if (changeInfo.url.includes('github.com/login/oauth/authorize')) {
                            return; // まだ認証中
                        }
                        
                        if (changeInfo.url.includes('success=true')) {
                            chrome.tabs.onUpdated.removeListener(checkAuth);
                            
                            // URLからコードを抽出
                            const urlParams = new URLSearchParams(changeInfo.url.split('?')[1]);
                            const code = urlParams.get('code');
                            
                            if (code) {
                                try {
                                    const token = await this.exchangeCodeForToken(code);
                                    const user = await this.fetchUserInfo(token);
                                    await this.saveToken(token, user);
                                    chrome.tabs.remove(tabId);
                                    resolve();
                                } catch (error) {
                                    chrome.tabs.remove(tabId);
                                    reject(error);
                                }
                            } else {
                                chrome.tabs.remove(tabId);
                                reject(new Error('認証コードが見つかりません'));
                            }
                        } else if (changeInfo.url.includes('error=')) {
                            chrome.tabs.onUpdated.removeListener(checkAuth);
                            chrome.tabs.remove(tabId);
                            reject(new Error('認証に失敗しました'));
                        }
                    }
                };
                
                chrome.tabs.onUpdated.addListener(checkAuth);
                
                // タイムアウト設定
                setTimeout(() => {
                    chrome.tabs.onUpdated.removeListener(checkAuth);
                    chrome.tabs.remove(tab.id);
                    reject(new Error('認証がタイムアウトしました'));
                }, 60000); // 60秒
            });
        } catch (error) {
            console.error('認証エラー:', error);
            throw error;
        }
    }

    buildAuthUrl() {
        const clientId = 'YOUR_GITHUB_CLIENT_ID'; // 実際のクライアントIDに置き換えてください
        const redirectUri = chrome.identity.getRedirectURL();
        const scope = 'repo,user,read:org';
        
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=chrome_extension`;
    }

    async exchangeCodeForToken(code) {
        const clientId = 'YOUR_GITHUB_CLIENT_ID';
        const clientSecret = 'YOUR_GITHUB_CLIENT_SECRET'; // 実際のクライアントシークレットに置き換えてください
        const redirectUri = chrome.identity.getRedirectURL();
        
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error_description || data.error);
        }
        
        return data.access_token;
    }

    async fetchUserInfo(token) {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('ユーザー情報の取得に失敗しました');
        }
        
        return await response.json();
    }

    async fetchRepositories() {
        if (!this.githubToken) {
            throw new Error('認証が必要です');
        }

        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('リポジトリの取得に失敗しました');
        }

        return await response.json();
    }

    async fetchIssues() {
        if (!this.githubToken) {
            throw new Error('認証が必要です');
        }

        const response = await fetch('https://api.github.com/issues?filter=all&sort=updated&per_page=20', {
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('イシューの取得に失敗しました');
        }

        return await response.json();
    }

    async fetchNotifications() {
        if (!this.githubToken) {
            throw new Error('認証が必要です');
        }

        const response = await fetch('https://api.github.com/notifications?per_page=20', {
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('通知の取得に失敗しました');
        }

        return await response.json();
    }

    async markNotificationAsRead(notificationId) {
        if (!this.githubToken) {
            throw new Error('認証が必要です');
        }

        const response = await fetch(`https://api.github.com/notifications/threads/${notificationId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('通知の既読化に失敗しました');
        }
    }

    onInstalled() {
        console.log('GitHub連携拡張機能がインストールされました');
    }
}

// 拡張機能を初期化
new GitHubExtension();
