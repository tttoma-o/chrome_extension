// ポップアップスクリプト
class PopupManager {
    constructor() {
        this.currentTab = 'repositories';
        this.isAuthenticated = false;
        this.user = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuthentication();
        this.updateUI();
    }

    setupEventListeners() {
        // 認証ボタン
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.login();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // タブ切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 更新ボタン
        document.getElementById('refreshRepos').addEventListener('click', () => {
            this.loadRepositories();
        });

        document.getElementById('refreshIssues').addEventListener('click', () => {
            this.loadIssues();
        });

        document.getElementById('refreshNotifications').addEventListener('click', () => {
            this.loadNotifications();
        });
    }

    async checkAuthentication() {
        try {
            const response = await this.sendMessage({ action: 'getUser' });
            if (response.success && response.user) {
                this.isAuthenticated = true;
                this.user = response.user;
            } else {
                this.isAuthenticated = false;
                this.user = null;
            }
        } catch (error) {
            console.error('認証状態の確認に失敗:', error);
            this.isAuthenticated = false;
        }
    }

    async login() {
        try {
            this.showLoading(true);
            
            const response = await this.sendMessage({ action: 'authenticate' });
            if (response.success) {
                this.isAuthenticated = true;
                this.user = response.user;
                this.updateUI();
                await this.loadRepositories();
            } else {
                this.showError('ログインに失敗しました: ' + response.error);
            }
        } catch (error) {
            console.error('ログインエラー:', error);
            this.showError('ログインに失敗しました: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async logout() {
        try {
            const response = await this.sendMessage({ action: 'logout' });
            if (response.success) {
                this.isAuthenticated = false;
                this.user = null;
                this.updateUI();
                this.clearContent();
            }
        } catch (error) {
            console.error('ログアウトエラー:', error);
        }
    }

    switchTab(tabName) {
        // アクティブなタブボタンを更新
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // アクティブなタブコンテンツを更新
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // タブに応じてデータを読み込み
        if (this.isAuthenticated) {
            switch (tabName) {
                case 'repositories':
                    this.loadRepositories();
                    break;
                case 'issues':
                    this.loadIssues();
                    break;
                case 'notifications':
                    this.loadNotifications();
                    break;
            }
        } else {
            // 未認証の場合は認証を促す
            this.showAuthPrompt(tabName);
        }
    }

    updateUI() {
        const authSection = document.getElementById('authSection');
        const mainContent = document.getElementById('mainContent');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.isAuthenticated) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            mainContent.style.display = 'block';
            
            // ユーザー情報を更新
            if (this.user) {
                document.getElementById('userAvatar').src = this.user.avatar_url;
                document.getElementById('userName').textContent = this.user.name || this.user.login;
                document.getElementById('userEmail').textContent = this.user.email || 'メールアドレスが設定されていません';
            }
        } else {
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            mainContent.style.display = 'none';
        }
    }

    async loadRepositories() {
        try {
            this.showLoading(true);
            const response = await this.sendMessage({ action: 'getRepositories' });
            
            if (response.success) {
                this.displayRepositories(response.data);
            } else {
                this.showError('リポジトリの読み込みに失敗しました: ' + response.error);
            }
        } catch (error) {
            console.error('リポジトリ読み込みエラー:', error);
            this.showError('リポジトリの読み込みに失敗しました: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async loadIssues() {
        try {
            this.showLoading(true);
            const response = await this.sendMessage({ action: 'getIssues' });
            
            if (response.success) {
                this.displayIssues(response.data);
            } else {
                this.showError('イシューの読み込みに失敗しました: ' + response.error);
            }
        } catch (error) {
            console.error('イシュー読み込みエラー:', error);
            this.showError('イシューの読み込みに失敗しました: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async loadNotifications() {
        try {
            this.showLoading(true);
            const response = await this.sendMessage({ action: 'getNotifications' });
            
            if (response.success) {
                this.displayNotifications(response.data);
            } else {
                this.showError('通知の読み込みに失敗しました: ' + response.error);
            }
        } catch (error) {
            console.error('通知読み込みエラー:', error);
            this.showError('通知の読み込みに失敗しました: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayRepositories(repos) {
        const container = document.getElementById('reposList');
        
        if (!repos || repos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>📁 リポジトリが見つかりません</h3>
                    <p>GitHubにリポジトリがありません。新しいリポジトリを作成しましょう！</p>
                    <div style="margin-top: 16px;">
                        <button class="btn btn-primary" onclick="window.open('https://github.com/new', '_blank')">
                            新しいリポジトリを作成
                        </button>
                        <button class="btn btn-secondary" onclick="window.open('github-guide.html', '_blank')">
                            GitHub初心者ガイド
                        </button>
                        <button class="btn btn-secondary" onclick="window.open('https://github.com/explore', '_blank')">
                            他のリポジトリを探索
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = repos.map(repo => `
            <div class="list-item" onclick="window.open('${repo.html_url}', '_blank')">
                <h4>${this.escapeHtml(repo.name)}</h4>
                <p>${this.escapeHtml(repo.description || '説明なし')}</p>
                <div class="meta">
                    <span class="badge ${repo.private ? 'badge-private' : 'badge-public'}">
                        ${repo.private ? 'プライベート' : 'パブリック'}
                    </span>
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    <span>📅 ${this.formatDate(repo.updated_at)}</span>
                </div>
            </div>
        `).join('');
    }

    displayIssues(issues) {
        const container = document.getElementById('issuesList');
        
        if (!issues || issues.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>🎫 イシューが見つかりません</h3>
                    <p>イシューまたはプルリクエストがありません。プロジェクトを始めましょう！</p>
                    <div style="margin-top: 16px;">
                        <button class="btn btn-primary" onclick="window.open('https://github.com/issues', '_blank')">
                            すべてのイシューを表示
                        </button>
                        <button class="btn btn-secondary" onclick="window.open('https://github.com/new', '_blank')">
                            新しいリポジトリを作成
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = issues.map(issue => `
            <div class="list-item" onclick="window.open('${issue.html_url}', '_blank')">
                <h4>${this.escapeHtml(issue.title)}</h4>
                <p>${this.escapeHtml(issue.repository.full_name)}</p>
                <div class="meta">
                    <span class="badge ${issue.state === 'open' ? 'badge-open' : 'badge-closed'}">
                        ${issue.state === 'open' ? 'オープン' : 'クローズ'}
                    </span>
                    ${issue.labels.map(label => `
                        <span class="badge" style="background-color: #${label.color}20; color: #${label.color};">
                            ${this.escapeHtml(label.name)}
                        </span>
                    `).join('')}
                    <span>📅 ${this.formatDate(issue.updated_at)}</span>
                </div>
            </div>
        `).join('');
    }

    displayNotifications(notifications) {
        const container = document.getElementById('notificationsList');
        
        if (!notifications || notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>🔔 通知がありません</h3>
                    <p>新しい通知はありません。プロジェクトに参加して通知を受け取りましょう！</p>
                    <div style="margin-top: 16px;">
                        <button class="btn btn-primary" onclick="window.open('https://github.com/notifications', '_blank')">
                            すべての通知を表示
                        </button>
                        <button class="btn btn-secondary" onclick="window.open('https://github.com/explore', '_blank')">
                            プロジェクトを探索
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notification => `
            <div class="list-item" onclick="window.open('${notification.subject.latest_comment_url || notification.subject.url}', '_blank')">
                <h4>${this.escapeHtml(notification.subject.title)}</h4>
                <p>${this.escapeHtml(notification.repository.full_name)}</p>
                <div class="meta">
                    <span>${this.getNotificationType(notification.subject.type)}</span>
                    <span>📅 ${this.formatDate(notification.updated_at)}</span>
                    ${!notification.unread ? '<span class="badge badge-closed">既読</span>' : ''}
                </div>
            </div>
        `).join('');
    }

    getNotificationType(type) {
        const types = {
            'Issue': 'イシュー',
            'PullRequest': 'プルリクエスト',
            'Commit': 'コミット',
            'Release': 'リリース',
            'Discussion': 'ディスカッション'
        };
        return types[type] || type;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        // 簡単なエラー表示（実際の実装ではより良いUIを提供）
        console.error(message);
        alert(message);
    }

    clearContent() {
        document.getElementById('reposList').innerHTML = '';
        document.getElementById('issuesList').innerHTML = '';
        document.getElementById('notificationsList').innerHTML = '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return '昨日';
        } else if (diffDays < 7) {
            return `${diffDays}日前`;
        } else if (diffDays < 30) {
            return `${Math.ceil(diffDays / 7)}週間前`;
        } else {
            return date.toLocaleDateString('ja-JP');
        }
    }

    showAuthPrompt(tabName) {
        const container = document.getElementById(`${tabName}List`);
        if (!container) return;

        const prompts = {
            repositories: {
                title: '📁 リポジトリを表示するには',
                description: 'GitHubにログインしてリポジトリを確認しましょう',
                action: 'GitHubでログイン'
            },
            issues: {
                title: '🎫 イシューを表示するには',
                description: 'GitHubにログインしてイシューを確認しましょう',
                action: 'GitHubでログイン'
            },
            notifications: {
                title: '🔔 通知を表示するには',
                description: 'GitHubにログインして通知を確認しましょう',
                action: 'GitHubでログイン'
            }
        };

        const prompt = prompts[tabName];
        if (prompt) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>${prompt.title}</h3>
                    <p>${prompt.description}</p>
                    <div style="margin-top: 16px;">
                        <button class="btn btn-primary" onclick="document.getElementById('loginBtn').click()">
                            ${prompt.action}
                        </button>
                    </div>
                </div>
            `;
        }
    }

    sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }
}

// ポップアップマネージャーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
