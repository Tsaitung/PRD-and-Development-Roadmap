#!/usr/bin/env python3
"""
檢查 GitHub Issues 狀態的腳本
分析與 FR-ID 相關的錯誤和問題
"""

import os
import re
import json
import argparse
import requests
from pathlib import Path
from typing import Dict, List, Any

class IssuesChecker:
    def __init__(self):
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.repo_owner = os.getenv('GITHUB_REPOSITORY_OWNER', 'Tsaitung')
        self.repo_name = os.getenv('GITHUB_REPOSITORY', 'Tsaitung/PRD-and-Development-Roadmap')
        self.output_dir = Path("temp")
        self.output_dir.mkdir(exist_ok=True)
        
    def check_github_issues(self) -> Dict[str, Any]:
        """檢查 GitHub Issues 狀態"""
        results = {
            "total_issues": 0,
            "open_issues": 0,
            "closed_issues": 0,
            "issues_by_fr": {},
            "issues_by_status": {
                "bug": 0,
                "enhancement": 0,
                "documentation": 0,
                "other": 0
            },
            "recent_issues": []
        }
        
        if not self.github_token:
            print("GitHub Token 未設定，使用模擬數據")
            return self.get_mock_issues_data()
        
        try:
            # 獲取所有 Issues
            issues = self.fetch_github_issues()
            
            for issue in issues:
                results["total_issues"] += 1
                
                if issue["state"] == "open":
                    results["open_issues"] += 1
                else:
                    results["closed_issues"] += 1
                
                # 分析 Issue 類型
                issue_type = self.analyze_issue_type(issue)
                results["issues_by_status"][issue_type] += 1
                
                # 分析與 FR-ID 的關聯
                fr_ids = self.extract_fr_ids(issue)
                for fr_id in fr_ids:
                    if fr_id not in results["issues_by_fr"]:
                        results["issues_by_fr"][fr_id] = {
                            "open": 0,
                            "closed": 0,
                            "issues": []
                        }
                    
                    if issue["state"] == "open":
                        results["issues_by_fr"][fr_id]["open"] += 1
                    else:
                        results["issues_by_fr"][fr_id]["closed"] += 1
                    
                    results["issues_by_fr"][fr_id]["issues"].append({
                        "number": issue["number"],
                        "title": issue["title"],
                        "state": issue["state"],
                        "created_at": issue["created_at"]
                    })
                
                # 記錄最近的 Issues
                if len(results["recent_issues"]) < 10:
                    results["recent_issues"].append({
                        "number": issue["number"],
                        "title": issue["title"],
                        "state": issue["state"],
                        "created_at": issue["created_at"],
                        "fr_ids": fr_ids
                    })
            
        except Exception as e:
            print(f"檢查 GitHub Issues 時發生錯誤: {e}")
            return self.get_mock_issues_data()
        
        return results
    
    def fetch_github_issues(self) -> List[Dict[str, Any]]:
        """從 GitHub API 獲取 Issues"""
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        url = f"https://api.github.com/repos/{self.repo_name}/issues"
        params = {
            'state': 'all',  # 包含開啟和關閉的 Issues
            'per_page': 100,
            'sort': 'created',
            'direction': 'desc'
        }
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def analyze_issue_type(self, issue: Dict[str, Any]) -> str:
        """分析 Issue 類型"""
        labels = [label["name"].lower() for label in issue.get("labels", [])]
        title = issue["title"].lower()
        body = issue.get("body", "").lower()
        
        # 檢查標籤
        if "bug" in labels or "bug" in title:
            return "bug"
        elif "enhancement" in labels or "feature" in title:
            return "enhancement"
        elif "documentation" in labels or "docs" in title:
            return "documentation"
        else:
            return "other"
    
    def extract_fr_ids(self, issue: Dict[str, Any]) -> List[str]:
        """從 Issue 中提取 FR-ID"""
        fr_ids = []
        
        # 從標題中提取
        title_fr_ids = re.findall(r'FR-\d{3}', issue["title"])
        fr_ids.extend(title_fr_ids)
        
        # 從內容中提取
        if issue.get("body"):
            body_fr_ids = re.findall(r'FR-\d{3}', issue["body"])
            fr_ids.extend(body_fr_ids)
        
        # 從標籤中提取
        for label in issue.get("labels", []):
            label_fr_ids = re.findall(r'FR-\d{3}', label["name"])
            fr_ids.extend(label_fr_ids)
        
        # 去重
        return list(set(fr_ids))
    
    def get_mock_issues_data(self) -> Dict[str, Any]:
        """獲取模擬 Issues 數據"""
        return {
            "total_issues": 5,
            "open_issues": 3,
            "closed_issues": 2,
            "issues_by_fr": {
                "FR-001": {
                    "open": 1,
                    "closed": 0,
                    "issues": [
                        {
                            "number": 1,
                            "title": "FR-001: 客戶管理功能問題",
                            "state": "open",
                            "created_at": "2024-01-01T10:00:00Z"
                        }
                    ]
                },
                "FR-002": {
                    "open": 0,
                    "closed": 1,
                    "issues": [
                        {
                            "number": 2,
                            "title": "FR-002: 測試覆蓋率不足",
                            "state": "closed",
                            "created_at": "2024-01-02T10:00:00Z"
                        }
                    ]
                }
            },
            "issues_by_status": {
                "bug": 2,
                "enhancement": 1,
                "documentation": 1,
                "other": 1
            },
            "recent_issues": [
                {
                    "number": 1,
                    "title": "FR-001: 客戶管理功能問題",
                    "state": "open",
                    "created_at": "2024-01-01T10:00:00Z",
                    "fr_ids": ["FR-001"]
                },
                {
                    "number": 2,
                    "title": "FR-002: 測試覆蓋率不足",
                    "state": "closed",
                    "created_at": "2024-01-02T10:00:00Z",
                    "fr_ids": ["FR-002"]
                }
            ]
        }

def main():
    parser = argparse.ArgumentParser(description="檢查 GitHub Issues 狀態")
    parser.add_argument("--output", default="temp", help="輸出目錄")
    args = parser.parse_args()
    
    # 建立輸出目錄
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    
    # 檢查 Issues
    checker = IssuesChecker()
    results = checker.check_github_issues()
    
    # 寫入結果
    with open(output_dir / "issue_status.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("GitHub Issues 檢查完成！")
    print(f"總 Issues: {results['total_issues']}")
    print(f"開啟 Issues: {results['open_issues']}")
    print(f"關閉 Issues: {results['closed_issues']}")
    print(f"相關 FR-ID: {len(results['issues_by_fr'])}")

if __name__ == "__main__":
    main() 