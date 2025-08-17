#!/bin/bash

# 菜蟲農食 ERP - GitHub 同步腳本
# 功能：管理本地修改、同步 GitHub、清理無用檔案

set -e  # 遇到錯誤時停止執行

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：顯示帶顏色的訊息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函數：顯示進度條
show_progress() {
    local message=$1
    echo -n -e "${BLUE}${message}${NC}"
}

# 函數：檢查 Git 狀態
check_git_status() {
    print_message $BLUE "🔍 檢查 Git 狀態..."
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_message $RED "❌ 錯誤：當前目錄不是 Git 倉庫"
        exit 1
    fi
    
    # 檢查是否有遠端倉庫
    if ! git remote get-url origin > /dev/null 2>&1; then
        print_message $RED "❌ 錯誤：未設定遠端倉庫 origin"
        exit 1
    fi
    
    print_message $GREEN "✅ Git 倉庫狀態正常"
}

# 函數：顯示本地修改
show_local_changes() {
    print_message $BLUE "📋 檢查本地修改..."
    
    local staged_files=$(git diff --cached --name-only)
    local unstaged_files=$(git diff --name-only)
    local untracked_files=$(git ls-files --others --exclude-standard)
    
    if [[ -z "$staged_files" && -z "$unstaged_files" && -z "$untracked_files" ]]; then
        print_message $GREEN "✅ 沒有本地修改"
        return 0
    fi
    
    print_message $YELLOW "⚠️  發現本地修改："
    
    if [[ -n "$staged_files" ]]; then
        print_message $YELLOW "📤 已暫存的檔案："
        echo "$staged_files" | sed 's/^/  - /'
        echo
    fi
    
    if [[ -n "$unstaged_files" ]]; then
        print_message $YELLOW "📝 未暫存的檔案："
        echo "$unstaged_files" | sed 's/^/  - /'
        echo
    fi
    
    if [[ -n "$untracked_files" ]]; then
        print_message $YELLOW "🆕 未追蹤的檔案："
        echo "$untracked_files" | sed 's/^/  - /'
        echo
    fi
    
    return 1
}

# 函數：處理本地修改
handle_local_changes() {
    local has_changes=$1
    
    if [[ $has_changes -eq 0 ]]; then
        return 0
    fi
    
    print_message $BLUE "🤔 請選擇處理本地修改的方式："
    echo "1) 提交並推送到 GitHub"
    echo "2) 暫存修改（不提交）"
    echo "3) 放棄本地修改"
    echo "4) 取消操作"
    
    read -p "請輸入選項 (1-4): " choice
    
    case $choice in
        1)
            commit_and_push_changes
            ;;
        2)
            stage_changes
            ;;
        3)
            discard_changes
            ;;
        4)
            print_message $YELLOW "❌ 操作已取消"
            exit 0
            ;;
        *)
            print_message $RED "❌ 無效選項"
            exit 1
            ;;
    esac
}

# 函數：提交並推送修改
commit_and_push_changes() {
    print_message $BLUE "📤 提交並推送修改..."
    
    # 添加所有修改
    git add .
    
    # 獲取提交訊息
    read -p "請輸入提交訊息 (或按 Enter 使用預設訊息): " commit_message
    if [[ -z "$commit_message" ]]; then
        commit_message="🔄 自動同步本地修改"
    fi
    
    # 提交
    git commit -m "$commit_message"
    
    # 推送到 GitHub
    show_progress "推送到 GitHub..."
    git push origin main
    print_message $GREEN "✅ 修改已成功推送到 GitHub"
}

# 函數：暫存修改
stage_changes() {
    print_message $BLUE "📦 暫存修改..."
    git add .
    print_message $GREEN "✅ 修改已暫存"
}

# 函數：放棄修改
discard_changes() {
    print_message $YELLOW "⚠️  確定要放棄所有本地修改嗎？(y/N): "
    read -p "" confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        print_message $BLUE "🗑️  放棄本地修改..."
        git reset --hard HEAD
        git clean -fd
        print_message $GREEN "✅ 本地修改已放棄"
    else
        print_message $YELLOW "❌ 操作已取消"
        exit 0
    fi
}

# 函數：同步 GitHub
sync_with_github() {
    print_message $BLUE "🔄 同步 GitHub..."
    
    # 獲取最新變更
    show_progress "獲取遠端變更..."
    git fetch origin
    
    # 檢查是否有遠端變更
    local behind_count=$(git rev-list HEAD..origin/main --count)
    
    if [[ $behind_count -gt 0 ]]; then
        print_message $YELLOW "⚠️  發現 $behind_count 個遠端變更"
        
        # 檢查是否有本地修改
        if ! git diff-index --quiet HEAD --; then
            print_message $RED "❌ 有本地修改，無法自動合併"
            print_message $YELLOW "請先處理本地修改，然後重新執行腳本"
            exit 1
        fi
        
        # 合併遠端變更
        show_progress "合併遠端變更..."
        git pull origin main
        print_message $GREEN "✅ 遠端變更已合併"
    else
        print_message $GREEN "✅ 本地已是最新版本"
    fi
}

# 函數：清理無用檔案
cleanup_files() {
    print_message $BLUE "🧹 清理無用檔案..."
    
    # 檢查要清理的檔案類型
    local files_to_clean=()
    
    # 檢查 .DS_Store 檔案
    local ds_store_files=$(find . -name ".DS_Store" -type f)
    if [[ -n "$ds_store_files" ]]; then
        files_to_clean+=(".DS_Store 檔案")
    fi
    
    # 檢查臨時檔案
    local temp_files=$(find . -name "*.tmp" -o -name "*.temp" -o -name "*~" -type f)
    if [[ -n "$temp_files" ]]; then
        files_to_clean+=("臨時檔案")
    fi
    
    # 檢查日誌檔案
    local log_files=$(find . -name "*.log" -type f)
    if [[ -n "$log_files" ]]; then
        files_to_clean+=("日誌檔案")
    fi
    
    if [[ ${#files_to_clean[@]} -eq 0 ]]; then
        print_message $GREEN "✅ 沒有需要清理的檔案"
        return 0
    fi
    
    print_message $YELLOW "發現以下可清理的檔案："
    for file_type in "${files_to_clean[@]}"; do
        echo "  - $file_type"
    done
    
    read -p "是否要清理這些檔案？(y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        # 清理 .DS_Store
        if [[ -n "$ds_store_files" ]]; then
            find . -name ".DS_Store" -type f -delete
            print_message $GREEN "✅ 已清理 .DS_Store 檔案"
        fi
        
        # 清理臨時檔案
        if [[ -n "$temp_files" ]]; then
            find . -name "*.tmp" -o -name "*.temp" -o -name "*~" -type f -delete
            print_message $GREEN "✅ 已清理臨時檔案"
        fi
        
        # 清理日誌檔案
        if [[ -n "$log_files" ]]; then
            find . -name "*.log" -type f -delete
            print_message $GREEN "✅ 已清理日誌檔案"
        fi
    else
        print_message $YELLOW "❌ 跳過檔案清理"
    fi
}

# 函數：顯示狀態摘要
show_status_summary() {
    print_message $BLUE "📊 狀態摘要："
    
    # 顯示分支資訊
    local current_branch=$(git branch --show-current)
    local remote_url=$(git remote get-url origin)
    print_message $GREEN "📍 當前分支: $current_branch"
    print_message $GREEN "🌐 遠端倉庫: $remote_url"
    
    # 顯示檔案統計
    local total_files=$(git ls-files | wc -l)
    local prd_folders=$(find PRD -type d 2>/dev/null | wc -l || echo "0")
    print_message $GREEN "📁 總檔案數: $total_files"
    print_message $GREEN "📂 PRD 資料夾數: $prd_folders"
    
    # 顯示最後提交
    local last_commit=$(git log -1 --pretty=format:"%h - %s (%cr)")
    print_message $GREEN "🕒 最後提交: $last_commit"
}

# 主函數
main() {
    print_message $BLUE "🚀 菜蟲農食 ERP - GitHub 同步工具"
    echo "=================================="
    
    # 檢查 Git 狀態
    check_git_status
    
    # 顯示當前狀態
    show_status_summary
    echo
    
    # 檢查本地修改
    show_local_changes
    local has_changes=$?
    
    # 處理本地修改
    handle_local_changes $has_changes
    
    # 同步 GitHub
    sync_with_github
    
    # 清理無用檔案
    cleanup_files
    
    echo
    print_message $GREEN "🎉 同步完成！"
    print_message $GREEN "本地資料夾已與 GitHub 完全同步"
}

# 執行主函數
main "$@"
