"""
pytest 配置文件
定義測試夾具和配置
"""

import pytest
import os
import tempfile
from pathlib import Path

@pytest.fixture
def temp_dir():
    """創建臨時目錄"""
    with tempfile.TemporaryDirectory() as tmp_dir:
        yield Path(tmp_dir)

@pytest.fixture
def sample_prd_content():
    """示例 PRD 內容"""
    return """
# 示例 PRD 文件

## FR-ID: FR-001
## 狀態: ✅ 完成

### 功能描述
這是一個示例 PRD 文件，用於測試目的。

### 需求
- 功能需求 1
- 功能需求 2

### 驗收標準
- [ ] 標準 1
- [ ] 標準 2
"""

@pytest.fixture
def sample_test_data():
    """示例測試數據"""
    return {
        "fr_ids": ["FR-001", "FR-002", "FR-003"],
        "test_coverage": {
            "unit": 75.0,
            "integration": 60.0,
            "e2e": 40.0
        },
        "modules": {
            "01-DSH-Dashboard": {
                "status": "✅ 完成",
                "coverage": 80.0
            },
            "02-CRM-Customer_Relationship_Management": {
                "status": "🟡 開發中",
                "coverage": 65.0
            }
        }
    }
