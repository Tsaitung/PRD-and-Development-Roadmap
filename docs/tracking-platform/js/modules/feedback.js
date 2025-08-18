/**
 * 反饋收集系統
 * 使用 GitHub Issues API 收集使用者反饋
 */

export class FeedbackSystem {
    constructor(app) {
        this.app = app;
        this.githubRepo = this.extractRepoInfo();
        this.feedbackTypes = {
            bug: { label: 'bug', icon: 'fa-bug', text: '錯誤回報' },
            feature: { label: 'enhancement', icon: 'fa-lightbulb', text: '功能建議' },
            improvement: { label: 'improvement', icon: 'fa-tools', text: '改進建議' },
            question: { label: 'question', icon: 'fa-question-circle', text: '使用問題' }
        };
    }
    
    /**
     * 從 URL 或配置中提取 GitHub repo 資訊
     */
    extractRepoInfo() {
        // 嘗試從 GitHub Pages URL 提取
        if (window.location.hostname.includes('github.io')) {
            const pathParts = window.location.pathname.split('/').filter(p => p);
            const username = window.location.hostname.split('.')[0];
            const repo = pathParts[0] || 'Integration-TOC'; // 預設 repo 名稱
            return { owner: username, repo: repo };
        }
        
        // 本地開發環境預設值
        return { owner: 'your-username', repo: 'your-repo' };
    }
    
    /**
     * 初始化反饋按鈕
     */
    init() {
        this.createFeedbackButton();
        this.setupKeyboardShortcut();
    }
    
    /**
     * 創建浮動反饋按鈕
     */
    createFeedbackButton() {
        const button = document.createElement('button');
        button.id = 'feedback-button';
        button.className = 'fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg z-40 transition-all';
        button.innerHTML = '<i class="fas fa-comment-dots text-xl"></i>';
        button.title = '提供反饋 (Ctrl+Shift+F)';
        
        button.addEventListener('click', () => this.showFeedbackForm());
        
        document.body.appendChild(button);
    }
    
    /**
     * 設置鍵盤快捷鍵
     */
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.showFeedbackForm();
            }
        });
    }
    
    /**
     * 顯示反饋表單
     */
    showFeedbackForm() {
        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">反饋類型</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${Object.entries(this.feedbackTypes).map(([key, type]) => `
                            <label class="feedback-type-option">
                                <input type="radio" name="feedbackType" value="${key}" 
                                       ${key === 'improvement' ? 'checked' : ''}>
                                <div class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                                    <i class="fas ${type.icon} mr-2"></i>${type.text}
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2" for="feedback-title">
                        標題 <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="feedback-title" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="簡短描述您的反饋">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2" for="feedback-description">
                        詳細描述 <span class="text-red-500">*</span>
                    </label>
                    <textarea id="feedback-description" rows="5"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="請詳細描述您的反饋內容..."></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <input type="checkbox" id="include-context" checked>
                        包含當前頁面資訊（有助於問題定位）
                    </label>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="window.trackingApp.feedback.submitFeedback()"
                            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-all">
                        <i class="fas fa-paper-plane mr-2"></i>提交反饋
                    </button>
                    <button onclick="window.trackingApp.closeModal()"
                            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-all">
                        取消
                    </button>
                </div>
            </div>
            
            <style>
                .feedback-type-option input[type="radio"] { display: none; }
                .feedback-type-option input[type="radio"]:checked + div {
                    background-color: #EBF8FF;
                    border-color: #3182CE;
                }
            </style>
        `;
        
        this.app.showModal('提供反饋', content);
    }
    
    /**
     * 提交反饋
     */
    async submitFeedback() {
        const type = document.querySelector('input[name="feedbackType"]:checked')?.value;
        const title = document.getElementById('feedback-title').value.trim();
        const description = document.getElementById('feedback-description').value.trim();
        const includeContext = document.getElementById('include-context').checked;
        
        // 驗證
        if (!title || !description) {
            this.app.showNotification('請填寫標題和描述', 'error');
            return;
        }
        
        // 構建 issue 內容
        let issueBody = description;
        
        if (includeContext) {
            issueBody += `\n\n---\n### 環境資訊\n`;
            issueBody += `- **當前頁面**: ${this.app.state.currentTab}\n`;
            issueBody += `- **時間**: ${new Date().toLocaleString('zh-TW')}\n`;
            issueBody += `- **瀏覽器**: ${navigator.userAgent}\n`;
            issueBody += `- **URL**: ${window.location.href}\n`;
        }
        
        issueBody += `\n\n---\n*通過統一追蹤平台反饋系統提交*`;
        
        // 生成 GitHub issue URL
        const labels = [this.feedbackTypes[type].label, 'feedback'].join(',');
        const issueUrl = `https://github.com/${this.githubRepo.owner}/${this.githubRepo.repo}/issues/new?` +
            `title=${encodeURIComponent(title)}&` +
            `body=${encodeURIComponent(issueBody)}&` +
            `labels=${encodeURIComponent(labels)}`;
        
        // 開啟新視窗
        window.open(issueUrl, '_blank');
        
        // 關閉模態框
        this.app.closeModal();
        
        // 顯示成功訊息
        this.app.showNotification('已開啟 GitHub Issues 頁面，請完成提交', 'success');
        
        // 記錄到本地統計（可選）
        this.logFeedback(type);
    }
    
    /**
     * 記錄反饋統計
     */
    logFeedback(type) {
        const stats = JSON.parse(localStorage.getItem('feedbackStats') || '{}');
        const month = new Date().toISOString().substring(0, 7);
        
        if (!stats[month]) stats[month] = {};
        if (!stats[month][type]) stats[month][type] = 0;
        stats[month][type]++;
        
        localStorage.setItem('feedbackStats', JSON.stringify(stats));
    }
    
    /**
     * 獲取反饋統計
     */
    getFeedbackStats() {
        return JSON.parse(localStorage.getItem('feedbackStats') || '{}');
    }
    
    /**
     * 顯示反饋統計
     */
    showFeedbackStats() {
        const stats = this.getFeedbackStats();
        const months = Object.keys(stats).sort().reverse().slice(0, 6);
        
        let html = '<div class="space-y-4">';
        
        if (months.length === 0) {
            html += '<p class="text-gray-500 text-center">尚無反饋記錄</p>';
        } else {
            months.forEach(month => {
                const monthStats = stats[month];
                const total = Object.values(monthStats).reduce((sum, count) => sum + count, 0);
                
                html += `
                    <div class="border rounded-lg p-3">
                        <h4 class="font-medium text-gray-700">${month}</h4>
                        <p class="text-sm text-gray-500">總計 ${total} 則反饋</p>
                        <div class="mt-2 space-y-1">
                            ${Object.entries(monthStats).map(([type, count]) => `
                                <div class="flex items-center justify-between text-sm">
                                    <span><i class="fas ${this.feedbackTypes[type].icon} mr-2"></i>${this.feedbackTypes[type].text}</span>
                                    <span class="font-medium">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        
        this.app.showModal('反饋統計', html);
    }
}

// 自動初始化
document.addEventListener('DOMContentLoaded', () => {
    if (window.trackingApp) {
        window.trackingApp.feedback = new FeedbackSystem(window.trackingApp);
        window.trackingApp.feedback.init();
    }
});