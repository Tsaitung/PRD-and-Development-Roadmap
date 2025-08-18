#!/bin/bash

# 菜蟲農食 ERP - 完整自動化追蹤並同步腳本
# 功能：自動追蹤所有變更、執行狀態檢測、更新追蹤資訊、同步到 GitHub
# 特色：一鍵執行所有同步作業，無需人工確認

set -e  # 遇到錯誤時停止執行

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
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

# 函數：檢查環境
check_environment() {
    print_message $BLUE "🔍 檢查執行環境..."
    
    # 檢查 Python
    if ! command -v python3 &> /dev/null; then
        print_message $RED "❌ 錯誤：需要 Python 3"
        exit 1
    fi
    
    # 檢查 Git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_message $RED "❌ 錯誤：當前目錄不是 Git 倉庫"
        exit 1
    fi
    
    # 檢查必要檔案
    if [[ ! -f "TOC Modules.md" ]]; then
        print_message $RED "❌ 錯誤：找不到 TOC Modules.md"
        exit 1
    fi
    
    # 確保所有 Python 腳本都可執行
    if [[ -d ".github/scripts" ]]; then
        chmod +x .github/scripts/*.py 2>/dev/null || true
    fi
    
    print_message $GREEN "✅ 環境檢查通過"
}

# 函數：執行狀態檢測
run_status_check() {
    print_message $BLUE "🔄 執行模組狀態檢測..."
    
    # 檢查是否有狀態檢測腳本
    if [[ -f ".github/scripts/check_module_status.py" ]]; then
        # 執行 Python 腳本
        if python3 .github/scripts/check_module_status.py; then
            print_message $GREEN "✅ 狀態檢測完成"
            
            # 顯示報告摘要
            if [[ -f "module_status_report.md" ]]; then
                print_message $CYAN "📊 狀態報告摘要："
                head -n 20 module_status_report.md | sed 's/^/    /'
                echo
            fi
        else
            print_message $YELLOW "⚠️  狀態檢測失敗，但繼續執行同步"
        fi
    else
        print_message $YELLOW "ℹ️  跳過狀態檢測（腳本不存在）"
    fi
}

# 函數：顯示狀態變更
show_status_changes() {
    print_message $BLUE "📋 檢查狀態變更..."
    
    # 檢查 TOC Modules.md 的變更
    if git diff --quiet "TOC Modules.md"; then
        print_message $YELLOW "ℹ️  TOC Modules.md 沒有變更"
    else
        print_message $GREEN "✅ 偵測到狀態更新："
        echo
        git diff --stat "TOC Modules.md"
        echo
        
        # 顯示主要變更
        print_message $CYAN "📝 主要變更內容："
        git diff "TOC Modules.md" | grep -E "^\+.*\|.*\|" | head -10 | sed 's/^/    /'
    fi
}

# 函數：生成進度報告
generate_progress_report() {
    print_message $BLUE "📈 生成進度報告..."
    
    # 從 TOC Modules.md 提取統計資訊
    if grep -q "總體進度統計" "TOC Modules.md"; then
        print_message $CYAN "📊 專案進度統計："
        grep -A 10 "總體進度統計" "TOC Modules.md" | sed 's/^/    /'
    fi
}

# 函數：更新 Dashboard
update_dashboard() {
    print_message $BLUE "🎨 檢查追蹤平台..."
    
    # 檢查新的統一追蹤平台
    if [[ -d "docs/tracking-platform" ]]; then
        print_message $GREEN "✅ 統一追蹤平台已準備就緒"
        print_message $YELLOW "💡 提示：推送到 main 分支後，平台將自動部署到 GitHub Pages"
    else
        print_message $YELLOW "ℹ️  追蹤平台不存在"
    fi
}

# 函數：提交並推送變更
commit_and_push() {
    print_message $BLUE "📤 準備提交變更..."
    
    # 加入所有變更（包含刪除的檔案）
    git add -A
    
    # 檢查是否有變更
    if git diff --staged --quiet; then
        print_message $YELLOW "ℹ️  沒有變更需要提交"
        return 0
    fi
    
    # 顯示即將提交的變更
    print_message $CYAN "📊 即將提交的變更："
    git diff --staged --stat
    echo
    
    # 生成智能提交訊息
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    local changes_summary=""
    
    # 分析變更類型
    local added_files=$(git diff --staged --name-status | grep "^A" | wc -l | tr -d ' ')
    local modified_files=$(git diff --staged --name-status | grep "^M" | wc -l | tr -d ' ')
    local deleted_files=$(git diff --staged --name-status | grep "^D" | wc -l | tr -d ' ')
    
    if [[ $added_files -gt 0 ]]; then
        changes_summary="${changes_summary}新增 ${added_files} 個檔案, "
    fi
    if [[ $modified_files -gt 0 ]]; then
        changes_summary="${changes_summary}修改 ${modified_files} 個檔案, "
    fi
    if [[ $deleted_files -gt 0 ]]; then
        changes_summary="${changes_summary}刪除 ${deleted_files} 個檔案, "
    fi
    
    # 移除最後的逗號
    changes_summary=${changes_summary%, }
    
    local commit_message="🤖 自動同步: ${changes_summary} - ${timestamp}"
    
    # 如果有特定檔案變更，加入說明
    if git diff --staged --name-only | grep -q "TOC Modules.md"; then
        commit_message="${commit_message}\n\n- 更新模組進度追蹤"
    fi
    if git diff --staged --name-only | grep -q "docs/"; then
        commit_message="${commit_message}\n- 更新追蹤平台"
    fi
    if git diff --staged --name-only | grep -q ".github/"; then
        commit_message="${commit_message}\n- 更新自動化工作流程"
    fi
    
    # 提交
    git commit -m "$commit_message"
    print_message $GREEN "✅ 變更已提交"
    
    # 推送（自動推送到當前分支）
    print_message $BLUE "📤 推送到 GitHub..."
    local current_branch=$(git branch --show-current)
    
    if git push origin $current_branch; then
        print_message $GREEN "✅ 成功推送到 GitHub！"
    else
        print_message $YELLOW "⚠️  推送失敗，嘗試設置上游分支..."
        if git push -u origin $current_branch; then
            print_message $GREEN "✅ 成功推送並設置上游分支！"
        else
            print_message $RED "❌ 推送失敗"
            return 1
        fi
    fi
}

# 函數：顯示執行摘要
show_summary() {
    print_separator
    print_message $PURPLE "🎯 執行摘要"
    
    local current_branch=$(git branch --show-current)
    local last_commit=$(git log -1 --pretty=format:"%h - %s")
    
    print_message $CYAN "📍 當前分支: $current_branch"
    print_message $CYAN "📝 最新提交: $last_commit"
    
    if [[ -f "module_status_report.md" ]]; then
        print_message $CYAN "📄 狀態報告: module_status_report.md"
    fi
    
    print_message $CYAN "🌐 追蹤平台: https://[your-github-username].github.io/[repo-name]/"
    
    print_separator
}

# 主函數
main() {
    print_message $PURPLE "🚀 菜蟲農食 ERP - 完整自動化同步工具"
    print_separator
    
    # 執行環境檢查
    check_environment
    
    # 執行狀態檢測
    run_status_check
    
    # 顯示狀態變更
    show_status_changes
    
    # 生成進度報告
    generate_progress_report
    
    # 更新 Dashboard
    update_dashboard
    
    # 自動提交並推送（無需確認）
    commit_and_push
    
    # 顯示摘要
    show_summary
    
    print_message $GREEN "🎉 自動同步完成！所有變更已同步到 GitHub！"
    print_message $YELLOW "💡 提示：GitHub Actions 將自動執行後續的部署作業"
}

# 新增函數：監控模式
watch_mode() {
    print_message $PURPLE "👁️  進入監控模式 - 自動偵測並同步變更"
    print_message $YELLOW "💡 提示：按 Ctrl+C 結束監控"
    print_separator
    
    while true; do
        # 檢查是否有變更
        if ! git diff --quiet || ! git diff --staged --quiet || [[ -n $(git ls-files --others --exclude-standard) ]]; then
            print_message $GREEN "🔍 偵測到檔案變更！"
            main
            print_message $CYAN "⏳ 等待下次檢查（60秒後）..."
        fi
        sleep 60
    done
}

# 檢查參數
if [[ "$1" == "--watch" ]] || [[ "$1" == "-w" ]]; then
    watch_mode
else
    # 執行主函數
    main "$@"
fi