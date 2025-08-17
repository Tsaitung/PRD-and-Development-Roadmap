#!/bin/bash

# 菜蟲農食 ERP - 快速同步腳本
# 簡化版本，提供基本的 GitHub 同步功能

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 菜蟲農食 ERP - 快速同步${NC}"
echo "================================"

# 檢查 Git 狀態
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ 錯誤：當前目錄不是 Git 倉庫${NC}"
    exit 1
fi

# 檢查是否有本地修改
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  發現本地修改${NC}"
    echo "請選擇操作："
    echo "1) 提交並推送修改"
    echo "2) 放棄本地修改"
    echo "3) 取消操作"
    
    read -p "請輸入選項 (1-3): " choice
    
    case $choice in
        1)
            echo -e "${GREEN}📤 提交並推送修改...${NC}"
            git add .
            read -p "請輸入提交訊息: " commit_message
            git commit -m "$commit_message"
            git push origin main
            echo -e "${GREEN}✅ 修改已推送${NC}"
            ;;
        2)
            echo -e "${YELLOW}⚠️  確定要放棄所有本地修改嗎？(y/N): ${NC}"
            read -p "" confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                git reset --hard HEAD
                git clean -fd
                echo -e "${GREEN}✅ 本地修改已放棄${NC}"
            else
                echo -e "${YELLOW}❌ 操作已取消${NC}"
                exit 0
            fi
            ;;
        3)
            echo -e "${YELLOW}❌ 操作已取消${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 無效選項${NC}"
            exit 1
            ;;
    esac
fi

# 同步 GitHub
echo -e "${GREEN}🔄 同步 GitHub...${NC}"
git fetch origin
git pull origin main

echo -e "${GREEN}🎉 同步完成！${NC}"
