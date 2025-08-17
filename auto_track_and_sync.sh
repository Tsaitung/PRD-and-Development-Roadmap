#!/bin/bash

# 菜蟲農食 ERP - 自動追蹤並同步腳本
# 功能：自動追蹤所有變更（包含新檔案）並同步到 GitHub
# 特色：簡化流程，確保不遺漏任何變更

set -e  # 遇到錯誤時停止執行

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 函數：顯示帶顏色的訊息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函數：顯示分隔線
print_separator() {
    echo "=================================================="
}

# 函數：檢查 Git 狀態
check_git_status() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_message $RED "❌ 錯誤：當前目錄不是 Git 倉庫"
        exit 1
    fi
    
    if ! git remote get-url origin > /dev/null 2>&1; then
        print_message $RED "❌ 錯誤：未設定遠端倉庫 origin"
        exit 1
    fi
}

# 函數：顯示所有變更
show_all_changes() {
    print_message $BLUE "📋 檢查所有變更..."
    
    local changes=$(git status --porcelain)
    
    if [[ -z "$changes" ]]; then
        print_message $GREEN "✅ 沒有任何變更需要同步"
        return 1
    fi
    
    print_message $YELLOW "📊 發現以下變更："
    echo
    
    # 分類顯示變更
    local added_files=$(echo "$changes" | grep "^??" | cut -c4-)
    local modified_files=$(echo "$changes" | grep "^ M" | cut -c4-)
    local deleted_files=$(echo "$changes" | grep "^ D" | cut -c4-)
    local renamed_files=$(echo "$changes" | grep "^R" | cut -c4-)
    
    if [[ -n "$added_files" ]]; then
        print_message $CYAN "🆕 新增檔案："
        echo "$added_files" | sed 's/^/    /'
        echo
    fi
    
    if [[ -n "$modified_files" ]]; then
        print_message $CYAN "📝 修改檔案："
        echo "$modified_files" | sed 's/^/    /'
        echo
    fi
    
    if [[ -n "$deleted_files" ]]; then
        print_message $CYAN "🗑️  刪除檔案："
        echo "$deleted_files" | sed 's/^/    /'
        echo
    fi
    
    if [[ -n "$renamed_files" ]]; then
        print_message $CYAN "📂 重命名檔案："
        echo "$renamed_files" | sed 's/^/    /'
        echo
    fi
    
    return 0
}

# 函數：自動追蹤並提交
auto_track_and_commit() {
    print_message $BLUE "🔄 自動追蹤所有變更..."
    
    # 加入所有變更（包含新增、修改、刪除）
    git add -A
    
    # 顯示即將提交的變更統計
    print_message $YELLOW "📊 即將提交的變更統計："
    git diff --cached --stat
    echo
    
    # 獲取提交訊息
    print_message $BLUE "💬 請輸入提交訊息"
    print_message $YELLOW "   (按 Enter 使用自動生成的訊息)"
    read -p "📝 提交訊息: " commit_message
    
    if [[ -z "$commit_message" ]]; then
        # 自動生成提交訊息
        local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
        local files_changed=$(git diff --cached --numstat | wc -l)
        local insertions=$(git diff --cached --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
        local deletions=$(git diff --cached --stat | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")
        
        commit_message="🔄 自動同步：${timestamp} (${files_changed} 檔案, +${insertions}/-${deletions})"
    fi
    
    # 提交變更
    git commit -m "$commit_message"
    print_message $GREEN "✅ 變更已提交"
}

# 函數：推送到 GitHub
push_to_github() {
    print_message $BLUE "📤 推送到 GitHub..."
    
    # 獲取當前分支
    local current_branch=$(git branch --show-current)
    
    # 推送
    if git push origin "$current_branch"; then
        print_message $GREEN "✅ 成功推送到 GitHub！"
    else
        print_message $RED "❌ 推送失敗，請檢查網路連線或認證設定"
        exit 1
    fi
}

# 函數：顯示同步摘要
show_summary() {
    print_separator
    print_message $GREEN "📊 同步摘要"
    
    local current_branch=$(git branch --show-current)
    local last_commit=$(git log -1 --pretty=format:"%h - %s")
    local remote_url=$(git remote get-url origin)
    
    print_message $CYAN "📍 當前分支: $current_branch"
    print_message $CYAN "🔗 遠端倉庫: $remote_url"
    print_message $CYAN "📝 最新提交: $last_commit"
    
    print_separator
}

# 主函數
main() {
    print_message $BLUE "🚀 菜蟲農食 ERP - 自動追蹤並同步工具"
    print_separator
    
    # 檢查 Git 狀態
    check_git_status
    
    # 顯示所有變更
    if ! show_all_changes; then
        show_summary
        exit 0
    fi
    
    # 確認是否要同步
    print_message $YELLOW "❓ 是否要同步以上所有變更到 GitHub？(Y/n): "
    read -p "" confirm
    
    if [[ $confirm =~ ^[Nn]$ ]]; then
        print_message $YELLOW "❌ 操作已取消"
        exit 0
    fi
    
    # 自動追蹤並提交
    auto_track_and_commit
    
    # 推送到 GitHub
    push_to_github
    
    # 顯示摘要
    show_summary
    
    print_message $GREEN "🎉 所有變更已成功同步到 GitHub！"
}

# 執行主函數
main "$@"