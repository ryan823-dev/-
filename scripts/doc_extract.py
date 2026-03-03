#!/usr/bin/env python3
"""
DashScope Document Extractor
用DashScope qwen-plus处理文档，提取结构化信息，节省主模型token

Usage:
    python scripts/doc_extract.py <file_path> "<extraction_prompt>"
    
Example:
    python scripts/doc_extract.py "/path/to/company.pptx" "提取所有项目案例，包含：项目名称、地点、机器人品牌、产能、配置详情"
    
Output:
    结构化JSON或Markdown，直接可用于主对话
"""

import sys
import os
import json
import subprocess
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai package not installed. Run: pip install openai")
    sys.exit(1)

# DashScope配置 (兼容OpenAI SDK)
DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "sk-sp-befc667877a94f5cb8d137bf8ac57ad9")
DASHSCOPE_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"
DEFAULT_MODEL = "qwen-plus"  # 包月模型，性价比高


def extract_text_from_file(file_path: str) -> str:
    """用markitdown提取文档文本"""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    suffix = path.suffix.lower()
    supported = ['.pptx', '.ppt', '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.html', '.htm', '.txt', '.md']
    
    if suffix not in supported:
        raise ValueError(f"Unsupported file type: {suffix}. Supported: {supported}")
    
    # 调用markitdown
    result = subprocess.run(
        ["python", "-m", "markitdown", file_path],
        capture_output=True,
        text=True,
        timeout=120
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"markitdown failed: {result.stderr}")
    
    return result.stdout


def call_dashscope(content: str, prompt: str, model: str = DEFAULT_MODEL) -> str:
    """调用DashScope API处理文档内容"""
    client = OpenAI(
        api_key=DASHSCOPE_API_KEY,
        base_url=DASHSCOPE_BASE_URL
    )
    
    system_prompt = """你是一个专业的文档信息提取助手。你的任务是从文档内容中提取用户需要的结构化信息。

输出要求：
1. 返回结构化的JSON或Markdown格式
2. 只输出提取的关键信息，不要冗余
3. 保持数据准确，不要编造
4. 如果某些信息文档中没有，标注为null或"未提及"
5. 中文内容保持中文，英文内容保持英文"""

    user_message = f"""## 提取任务
{prompt}

## 文档内容
{content}"""

    # 限制输入长度（qwen-plus支持128k，但留余量）
    max_content_len = 100000
    if len(user_message) > max_content_len:
        user_message = user_message[:max_content_len] + "\n\n[... 内容已截断 ...]"

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.1,  # 低温度保证提取准确性
        max_tokens=8000
    )
    
    return response.choices[0].message.content


def process_document(file_path: str, prompt: str, model: str = DEFAULT_MODEL) -> dict:
    """完整的文档处理流程"""
    result = {
        "file": file_path,
        "status": "success",
        "extracted": None,
        "error": None
    }
    
    try:
        # Step 1: 提取文本
        print(f"[1/2] Extracting text from: {file_path}", file=sys.stderr)
        raw_text = extract_text_from_file(file_path)
        text_len = len(raw_text)
        print(f"      Extracted {text_len} characters", file=sys.stderr)
        
        # Step 2: 调用DashScope
        print(f"[2/2] Calling DashScope ({model})...", file=sys.stderr)
        extracted = call_dashscope(raw_text, prompt, model)
        result["extracted"] = extracted
        print(f"      Done. Output: {len(extracted)} characters", file=sys.stderr)
        
    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        print(f"Error: {e}", file=sys.stderr)
    
    return result


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        print("\nError: Missing arguments", file=sys.stderr)
        print("Usage: python doc_extract.py <file_path> \"<extraction_prompt>\"", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    prompt = sys.argv[2]
    model = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_MODEL
    
    result = process_document(file_path, prompt, model)
    
    # 输出提取结果到stdout（JSON格式便于解析）
    if result["status"] == "success":
        print(result["extracted"])
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
