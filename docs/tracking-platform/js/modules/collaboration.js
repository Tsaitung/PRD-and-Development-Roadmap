/**
 * 團隊協作功能模組
 * 提供團隊成員間的協作、通知和任務分配功能
 */

export class CollaborationSystem {
    constructor(app) {
        this.app = app;
        this.storageKey = 'collaborationData';
        this.mentionsKey = 'teamMentions';
        this.tasksKey = 'teamTasks';
        
        // 預設團隊成員（實際應用中可從後端載入）
        this.teamMembers = [
            { id: 'pm', name: '專案經理', role: 'PM', avatar: '👔' },
            { id: 'dev1', name: '前端開發', role: 'Developer', avatar: '👨‍💻' },
            { id: 'dev2', name: '後端開發', role: 'Developer', avatar: '👩‍💻' },
            { id: 'qa', name: '測試工程師', role: 'QA', avatar: '🧪' },
            { id: 'design', name: '設計師', role: 'Designer', avatar: '🎨' }
        ];
    }
    
    /**
     * 初始化協作系統
     */
    init() {
        this.loadCollaborationData();
        this.setupShortcuts();
    }
    
    /**
     * 載入協作資料
     */
    loadCollaborationData() {
        const stored = localStorage.getItem(this.storageKey);
        this.data = stored ? JSON.parse(stored) : {
            assignments: {},
            mentions: [],
            tasks: [],
            updates: []
        };
    }
    
    /**
     * 儲存協作資料
     */
    saveCollaborationData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }
    
    /**
     * 設置鍵盤快捷鍵
     */
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+M: 開啟團隊面板
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                this.showTeamPanel();
            }
        });
    }
    
    /**
     * 顯示團隊協作面板
     */
    showTeamPanel() {
        const content = `
            <div class="space-y-6">
                <!-- 團隊概覽 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h4 class="font-medium text-blue-700 mb-2">
                            <i class="fas fa-users mr-2"></i>團隊成員
                        </h4>
                        <div class="space-y-2">
                            ${this.renderTeamMembers()}
                        </div>
                    </div>
                    <div class="bg-green-50 rounded-lg p-4">
                        <h4 class="font-medium text-green-700 mb-2">
                            <i class="fas fa-chart-line mr-2"></i>團隊統計
                        </h4>
                        ${this.renderTeamStats()}
                    </div>
                </div>
                
                <!-- 功能標籤 -->
                <div class="border-b">
                    <nav class="flex space-x-4">
                        <button onclick="window.trackingApp.collaboration.showTab('assignments')" 
                                class="collab-tab-btn px-4 py-2 border-b-2 border-blue-500 text-blue-600">
                            <i class="fas fa-tasks mr-2"></i>模組分配
                        </button>
                        <button onclick="window.trackingApp.collaboration.showTab('mentions')" 
                                class="collab-tab-btn px-4 py-2 text-gray-600 hover:text-gray-800">
                            <i class="fas fa-at mr-2"></i>提及記錄
                        </button>
                        <button onclick="window.trackingApp.collaboration.showTab('tasks')" 
                                class="collab-tab-btn px-4 py-2 text-gray-600 hover:text-gray-800">
                            <i class="fas fa-clipboard-list mr-2"></i>任務清單
                        </button>
                        <button onclick="window.trackingApp.collaboration.showTab('updates')" 
                                class="collab-tab-btn px-4 py-2 text-gray-600 hover:text-gray-800">
                            <i class="fas fa-bell mr-2"></i>更新通知
                        </button>
                    </nav>
                </div>
                
                <!-- 內容區域 -->
                <div id="collab-content" class="min-h-[300px]">
                    ${this.renderAssignments()}
                </div>
                
                <!-- 操作按鈕 -->
                <div class="flex justify-end space-x-3">
                    <button onclick="window.trackingApp.collaboration.exportTeamReport()"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all">
                        <i class="fas fa-download mr-2"></i>匯出團隊報告
                    </button>
                    <button onclick="window.trackingApp.closeModal()"
                            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all">
                        關閉
                    </button>
                </div>
            </div>
        `;
        
        this.app.showModal('團隊協作中心', content, 'max-w-4xl');
    }
    
    /**
     * 渲染團隊成員
     */
    renderTeamMembers() {
        return this.teamMembers.map(member => `
            <div class="flex items-center space-x-2">
                <span class="text-2xl">${member.avatar}</span>
                <div class="flex-1">
                    <p class="font-medium text-sm">${member.name}</p>
                    <p class="text-xs text-gray-600">${member.role}</p>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    線上
                </span>
            </div>
        `).join('');
    }
    
    /**
     * 渲染團隊統計
     */
    renderTeamStats() {
        const assignments = Object.values(this.data.assignments).flat();
        const tasksCount = this.data.tasks.filter(t => !t.completed).length;
        const mentionsToday = this.data.mentions.filter(m => 
            new Date(m.timestamp).toDateString() === new Date().toDateString()
        ).length;
        
        return `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-sm">分配的模組</span>
                    <span class="font-medium">${assignments.length}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-sm">待辦任務</span>
                    <span class="font-medium">${tasksCount}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-sm">今日提及</span>
                    <span class="font-medium">${mentionsToday}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * 顯示不同標籤內容
     */
    showTab(tab) {
        // 更新標籤樣式
        document.querySelectorAll('.collab-tab-btn').forEach(btn => {
            btn.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600');
            btn.classList.add('text-gray-600');
        });
        event.target.classList.remove('text-gray-600');
        event.target.classList.add('border-b-2', 'border-blue-500', 'text-blue-600');
        
        // 更新內容
        const content = document.getElementById('collab-content');
        switch (tab) {
            case 'assignments':
                content.innerHTML = this.renderAssignments();
                break;
            case 'mentions':
                content.innerHTML = this.renderMentions();
                break;
            case 'tasks':
                content.innerHTML = this.renderTasks();
                break;
            case 'updates':
                content.innerHTML = this.renderUpdates();
                break;
        }
    }
    
    /**
     * 渲染模組分配
     */
    renderAssignments() {
        const modules = this.app.dataManager.moduleDefinitions;
        
        let html = `
            <div class="space-y-4">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-medium text-gray-700">模組負責人分配</h4>
                    <button onclick="window.trackingApp.collaboration.showAssignDialog()"
                            class="text-blue-600 hover:text-blue-700 text-sm">
                        <i class="fas fa-plus mr-1"></i>分配模組
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        `;
        
        modules.forEach(module => {
            const assignees = this.data.assignments[module.code] || [];
            const moduleData = this.app.getModule(module.code);
            const progressColor = moduleData.progress >= 80 ? 'green' : 
                                moduleData.progress >= 50 ? 'yellow' : 'red';
            
            html += `
                <div class="border rounded-lg p-3 hover:shadow-md transition-all">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h5 class="font-medium">${module.code} - ${module.zhName}</h5>
                            <div class="flex items-center mt-1">
                                <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                    <div class="bg-${progressColor}-500 h-2 rounded-full" 
                                         style="width: ${moduleData.progress}%"></div>
                                </div>
                                <span class="text-xs text-gray-600">${moduleData.progress}%</span>
                            </div>
                        </div>
                        <button onclick="window.trackingApp.collaboration.editAssignment('${module.code}')"
                                class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${assignees.length > 0 ? assignees.map(id => {
                            const member = this.teamMembers.find(m => m.id === id);
                            return member ? `
                                <span class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                    ${member.avatar} ${member.name}
                                </span>
                            ` : '';
                        }).join('') : '<span class="text-xs text-gray-400">未分配</span>'}
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }
    
    /**
     * 渲染提及記錄
     */
    renderMentions() {
        const mentions = this.data.mentions.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        ).slice(0, 20);
        
        if (mentions.length === 0) {
            return `
                <div class="text-center py-12 text-gray-400">
                    <i class="fas fa-at text-4xl mb-3"></i>
                    <p>尚無提及記錄</p>
                </div>
            `;
        }
        
        return `
            <div class="space-y-3">
                ${mentions.map(mention => `
                    <div class="border rounded-lg p-3 hover:bg-gray-50">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <p class="text-sm">
                                    <span class="font-medium">${mention.from}</span>
                                    在 <span class="text-blue-600">${mention.context}</span> 中提到了
                                    <span class="font-medium">@${mention.to}</span>
                                </p>
                                <p class="text-xs text-gray-600 mt-1">${mention.message}</p>
                            </div>
                            <span class="text-xs text-gray-400">
                                ${new Date(mention.timestamp).toLocaleString('zh-TW')}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * 渲染任務清單
     */
    renderTasks() {
        return `
            <div class="space-y-4">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-medium text-gray-700">團隊任務</h4>
                    <button onclick="window.trackingApp.collaboration.showAddTaskDialog()"
                            class="text-blue-600 hover:text-blue-700 text-sm">
                        <i class="fas fa-plus mr-1"></i>新增任務
                    </button>
                </div>
                <div class="space-y-2">
                    ${this.renderTaskList()}
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染任務列表
     */
    renderTaskList() {
        const tasks = this.data.tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        if (tasks.length === 0) {
            return '<p class="text-center text-gray-400 py-8">尚無任務</p>';
        }
        
        return tasks.map(task => {
            const assignee = this.teamMembers.find(m => m.id === task.assignee);
            
            return `
                <div class="flex items-center p-3 border rounded-lg ${task.completed ? 'opacity-60' : ''} hover:shadow-sm">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="window.trackingApp.collaboration.toggleTask('${task.id}')"
                           class="mr-3">
                    <div class="flex-1">
                        <p class="${task.completed ? 'line-through' : ''}">${task.title}</p>
                        <div class="flex items-center space-x-3 mt-1">
                            <span class="text-xs text-gray-500">
                                ${task.module ? `模組: ${task.module}` : ''}
                            </span>
                            ${assignee ? `
                                <span class="text-xs">
                                    ${assignee.avatar} ${assignee.name}
                                </span>
                            ` : ''}
                            <span class="text-xs text-gray-400">
                                ${new Date(task.createdAt).toLocaleDateString('zh-TW')}
                            </span>
                        </div>
                    </div>
                    <button onclick="window.trackingApp.collaboration.deleteTask('${task.id}')"
                            class="text-red-400 hover:text-red-600 ml-3">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    /**
     * 渲染更新通知
     */
    renderUpdates() {
        const updates = this.generateRecentUpdates();
        
        return `
            <div class="space-y-3">
                <h4 class="font-medium text-gray-700 mb-3">最近更新</h4>
                ${updates.map(update => `
                    <div class="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <div class="p-2 bg-${update.color}-100 rounded">
                            <i class="fas ${update.icon} text-${update.color}-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm">${update.message}</p>
                            <p class="text-xs text-gray-500 mt-1">${update.time}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * 生成最近更新
     */
    generateRecentUpdates() {
        const updates = [];
        const now = new Date();
        
        // 模擬一些更新（實際應用中從後端獲取）
        const modules = this.app.dataManager.getModules();
        modules.forEach(module => {
            if (module.progress === 100) {
                updates.push({
                    icon: 'fa-check-circle',
                    color: 'green',
                    message: `${module.code} 模組已完成所有開發`,
                    time: '2小時前',
                    timestamp: new Date(now - 2 * 60 * 60 * 1000)
                });
            }
        });
        
        // 添加任務更新
        this.data.tasks.filter(t => t.completed).slice(0, 3).forEach(task => {
            updates.push({
                icon: 'fa-tasks',
                color: 'blue',
                message: `任務「${task.title}」已完成`,
                time: '今天',
                timestamp: new Date(task.completedAt)
            });
        });
        
        return updates.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    }
    
    /**
     * 顯示分配對話框
     */
    showAssignDialog() {
        const modules = this.app.dataManager.moduleDefinitions;
        
        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">選擇模組</label>
                    <select id="assign-module" class="w-full px-3 py-2 border rounded-lg">
                        ${modules.map(m => `<option value="${m.code}">${m.code} - ${m.zhName}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">選擇負責人（可多選）</label>
                    <div class="space-y-2 max-h-40 overflow-y-auto">
                        ${this.teamMembers.map(member => `
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" value="${member.id}" class="assign-member">
                                <span>${member.avatar} ${member.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="flex justify-end space-x-3">
                    <button onclick="window.trackingApp.collaboration.saveAssignment()"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                        確定分配
                    </button>
                    <button onclick="window.trackingApp.closeModal()"
                            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                        取消
                    </button>
                </div>
            </div>
        `;
        
        this.app.showModal('分配模組負責人', content);
    }
    
    /**
     * 儲存分配
     */
    saveAssignment() {
        const moduleCode = document.getElementById('assign-module').value;
        const selectedMembers = Array.from(document.querySelectorAll('.assign-member:checked'))
            .map(cb => cb.value);
        
        this.data.assignments[moduleCode] = selectedMembers;
        this.saveCollaborationData();
        
        this.app.closeModal();
        this.showTeamPanel();
        this.app.showNotification('模組負責人已更新', 'success');
    }
    
    /**
     * 顯示新增任務對話框
     */
    showAddTaskDialog() {
        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">任務標題</label>
                    <input type="text" id="task-title" 
                           class="w-full px-3 py-2 border rounded-lg"
                           placeholder="輸入任務標題">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">相關模組（選填）</label>
                    <select id="task-module" class="w-full px-3 py-2 border rounded-lg">
                        <option value="">無</option>
                        ${this.app.dataManager.moduleDefinitions.map(m => 
                            `<option value="${m.code}">${m.code} - ${m.zhName}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">指派給</label>
                    <select id="task-assignee" class="w-full px-3 py-2 border rounded-lg">
                        <option value="">未指派</option>
                        ${this.teamMembers.map(m => 
                            `<option value="${m.id}">${m.avatar} ${m.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="flex justify-end space-x-3">
                    <button onclick="window.trackingApp.collaboration.addTask()"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                        新增任務
                    </button>
                    <button onclick="window.trackingApp.closeModal()"
                            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                        取消
                    </button>
                </div>
            </div>
        `;
        
        this.app.showModal('新增團隊任務', content);
    }
    
    /**
     * 新增任務
     */
    addTask() {
        const title = document.getElementById('task-title').value.trim();
        if (!title) {
            this.app.showNotification('請輸入任務標題', 'error');
            return;
        }
        
        const task = {
            id: Date.now().toString(),
            title: title,
            module: document.getElementById('task-module').value,
            assignee: document.getElementById('task-assignee').value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.data.tasks.push(task);
        this.saveCollaborationData();
        
        this.app.closeModal();
        this.showTab('tasks');
        this.app.showNotification('任務已新增', 'success');
    }
    
    /**
     * 切換任務狀態
     */
    toggleTask(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveCollaborationData();
            this.showTab('tasks');
        }
    }
    
    /**
     * 刪除任務
     */
    deleteTask(taskId) {
        if (confirm('確定要刪除這個任務嗎？')) {
            this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
            this.saveCollaborationData();
            this.showTab('tasks');
            this.app.showNotification('任務已刪除', 'success');
        }
    }
    
    /**
     * 編輯分配
     */
    editAssignment(moduleCode) {
        // 實作編輯功能
        this.showAssignDialog();
        // 預先選中已分配的成員
        setTimeout(() => {
            document.getElementById('assign-module').value = moduleCode;
            const assigned = this.data.assignments[moduleCode] || [];
            document.querySelectorAll('.assign-member').forEach(cb => {
                cb.checked = assigned.includes(cb.value);
            });
        }, 100);
    }
    
    /**
     * 新增提及
     */
    addMention(from, to, context, message) {
        const mention = {
            id: Date.now().toString(),
            from: from,
            to: to,
            context: context,
            message: message,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        this.data.mentions.push(mention);
        this.saveCollaborationData();
    }
    
    /**
     * 匯出團隊報告
     */
    exportTeamReport() {
        const report = {
            generatedAt: new Date().toISOString(),
            team: this.teamMembers,
            assignments: this.data.assignments,
            tasks: {
                total: this.data.tasks.length,
                completed: this.data.tasks.filter(t => t.completed).length,
                pending: this.data.tasks.filter(t => !t.completed).length,
                details: this.data.tasks
            },
            moduleProgress: this.app.dataManager.getModules().map(m => ({
                code: m.code,
                name: m.zhName,
                progress: m.progress,
                assignees: this.data.assignments[m.code] || []
            }))
        };
        
        const jsonStr = JSON.stringify(report, null, 2);
        const filename = `team-report-${new Date().toISOString().split('T')[0]}.json`;
        this.app.utils.downloadFile(jsonStr, filename, 'application/json');
        
        this.app.showNotification('團隊報告已下載', 'success');
    }
}