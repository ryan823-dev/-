# Paint Automation Content Radar V4

## 工程级开发规格书

---

## 1. 项目概述

### 1.1 目标

构建一个工业内容自动化生成系统，实现：

```
工程问题采集 → 智能聚类分析 → AI内容生成 → SEO流量 → 工业客户获客
```

### 1.2 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | FastAPI (Python 3.11+) |
| 数据库 | PostgreSQL 15 + pgvector |
| 缓存/队列 | Redis 7 |
| 任务调度 | Celery + Celery Beat |
| 向量索引 | pgvector HNSW |
| 前端框架 | Next.js 14 (App Router) |
| UI组件 | Tailwind CSS + shadcn/ui |
| LLM | 阿里云通义千问 (DashScope) |
| SERP分析 | SerpAPI |
| 部署 | Docker + 云服务器 |

### 1.3 系统产出规模

| 指标 | 每日 | 长期积累 |
|------|------|----------|
| Questions | 20-50 | 15,000+ |
| Topics | 10-30 | 1,000-2,000 |
| Articles | 5-20 | 500+ |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据采集层 (Collectors)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Trends  │  │  Reddit  │  │StackExchg│  │  SERP    │        │
│  │  RSS     │  │  API     │  │  API     │  │ Analyzer │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      处理层 (Processors)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 提取     │→│ 清洗     │→│ 去重     │→│ 向量化   │        │
│  │ Extractor│  │Normalize │  │ Dedupe   │  │ Embedding│        │
│  └──────────┘  └──────────┘  └──────────┘  └────┬─────┘        │
└─────────────────────────────────────────────────┼───────────────┘
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      分析层 (Analysis)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ 聚类     │→│ 评分     │→│ SERP分析 │                     │
│  │ Clustering│ │ Scoring  │  │  SERP    │                     │
│  └──────────┘  └──────────┘  └────┬─────┘                     │
└─────────────────────────────────────┼───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      生成层 (Generators)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Topic    │→│ Brief    │→│ Outline  │→│ Content  │        │
│  │ Generator│  │ Writer   │  │ Writer   │  │ Writer   │        │
│  └──────────┘  └──────────┘  └──────────┘  └────┬─────┘        │
└─────────────────────────────────────────────────┼───────────────┘
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      校验层 (Validators)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ 字数检查 │  │ 结构检查 │  │ 关键词   │                     │
│  │ WordCount│  │ Structure│  │ Keywords │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Celery 任务队列

```
queue:collector  → 外部API采集（限速、重试）
queue:processor  → 清洗/向量化/聚类（CPU密集）
queue:generator  → LLM写作（成本控制）
queue:analysis   → SERP分析（IO密集）
```

---

## 3. 数据库设计

### 3.1 ER图

```mermaid
erDiagram
    SOURCES ||--o{ QUESTIONS_RAW : "produces"
    QUESTIONS_RAW ||--|| QUESTIONS_CLEAN : "cleans_to"
    QUESTIONS_CLEAN ||--|| QUESTIONS_EMBEDDING : "embeds_to"
    QUESTIONS_DEDUPLICATED ||--o{ DEDUP_VARIANTS : "has_variants"
    QUESTIONS_CLEAN ||--o{ DEDUP_VARIANTS : "is_variant_of"
    CLUSTERS ||--o{ CLUSTER_QUESTIONS : "contains"
    QUESTIONS_CLEAN ||--o{ CLUSTER_QUESTIONS : "member_of"
    CLUSTERS ||--o{ CLUSTER_SCORES : "scored_by"
    CONTENT_TASKS }o--|| CLUSTERS : "based_on"
    CONTENT_TASKS }o--o| SERP_RESULTS : "informed_by"
    CONTENT_TASKS ||--o{ CONTENT_DRAFTS : "produces"
    CONTENT_DRAFTS ||--o{ DRAFT_VALIDATIONS : "validated_by"
    KEYWORDS ||--o{ CONTENT_TASK_KEYWORDS : "used_in"
    CONTENT_TASKS ||--o{ CONTENT_TASK_KEYWORDS : "has_keywords"
    CONFIG_STORE ||--o{ JOB_RUNS : "snapshot_of"
    JOB_RUNS ||--o{ JOB_EVENTS : "logs"
```

### 3.2 核心表结构（16张表）

#### 3.2.1 sources
```sql
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL,  -- reddit/stackexchange/trends/serp
    source_name VARCHAR(255) NOT NULL,
    url TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sources_type ON sources(source_type);
CREATE INDEX idx_sources_active ON sources(is_active) WHERE is_active = true;
```

#### 3.2.2 questions_raw
```sql
CREATE TABLE questions_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id),
    external_id VARCHAR(255),  -- Reddit/SE原始ID
    title TEXT NOT NULL,
    body TEXT,
    score INTEGER DEFAULT 0,
    num_comments INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    tags TEXT[],
    url TEXT NOT NULL,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

CREATE INDEX idx_questions_raw_source ON questions_raw(source_id);
CREATE INDEX idx_questions_raw_collected ON questions_raw(collected_at DESC);
CREATE INDEX idx_questions_raw_score ON questions_raw(score DESC);
```

#### 3.2.3 questions_clean
```sql
CREATE TABLE questions_clean (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_id UUID NOT NULL REFERENCES questions_raw(id) ON DELETE CASCADE,
    normalized_title TEXT NOT NULL,
    normalized_body TEXT,
    tokens TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    is_valid BOOLEAN DEFAULT true,
    validation_errors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_clean_raw ON questions_clean(raw_id);
CREATE INDEX idx_questions_clean_valid ON questions_clean(is_valid);
```

#### 3.2.4 questions_embedding
```sql
CREATE TABLE questions_embedding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions_clean(id) ON DELETE CASCADE,
    embedding vector(1536),  -- OpenAI text-embedding-3-small
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id)
);

-- HNSW索引（比IVFFlat更适合生产环境）
CREATE INDEX idx_questions_embedding_hnsw ON questions_embedding
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

#### 3.2.5 questions_deduplicated
```sql
CREATE TABLE questions_deduplicated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_text TEXT NOT NULL,
    canonical_question_id UUID REFERENCES questions_clean(id),
    variant_count INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_dedup_created ON questions_deduplicated(created_at DESC);
```

#### 3.2.6 dedup_variants
```sql
CREATE TABLE dedup_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dedup_id UUID NOT NULL REFERENCES questions_deduplicated(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions_clean(id),
    similarity_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dedup_id, question_id)
);

CREATE INDEX idx_dedup_variants_dedup ON dedup_variants(dedup_id);
CREATE INDEX idx_dedup_variants_question ON dedup_variants(question_id);
```

#### 3.2.7 clusters
```sql
CREATE TABLE clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_question TEXT NOT NULL,
    cluster_size INTEGER DEFAULT 0,
    cluster_type VARCHAR(50) DEFAULT 'auto',  -- auto/manual
    status VARCHAR(50) DEFAULT 'active',  -- active/archived/processed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clusters_status ON clusters(status);
CREATE INDEX idx_clusters_created ON clusters(created_at DESC);
CREATE INDEX idx_clusters_size ON clusters(cluster_size DESC);
```

#### 3.2.8 cluster_questions
```sql
CREATE TABLE cluster_questions (
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions_clean(id),
    distance FLOAT,
    is_representative BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (cluster_id, question_id)
);

CREATE INDEX idx_cluster_questions_question ON cluster_questions(question_id);
```

#### 3.2.9 cluster_scores
```sql
CREATE TABLE cluster_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    engagement_score FLOAT DEFAULT 0,
    recency_score FLOAT DEFAULT 0,
    commercial_score FLOAT DEFAULT 0,
    competition_score FLOAT DEFAULT 0,
    total_score FLOAT DEFAULT 0,
    score_version INTEGER DEFAULT 1,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cluster_id, score_version)
);

CREATE INDEX idx_cluster_scores_total ON cluster_scores(total_score DESC);
CREATE INDEX idx_cluster_scores_cluster ON cluster_scores(cluster_id);
```

#### 3.2.10 serp_results
```sql
CREATE TABLE serp_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255) NOT NULL,
    search_engine VARCHAR(50) DEFAULT 'google',
    country VARCHAR(10) DEFAULT 'us',
    position INTEGER,
    url TEXT,
    title TEXT,
    snippet TEXT,
    h2_structure JSONB DEFAULT '[]',
    word_count INTEGER,
    tables_count INTEGER DEFAULT 0,
    lists_count INTEGER DEFAULT 0,
    faq_count INTEGER DEFAULT 0,
    images_count INTEGER DEFAULT 0,
    links_count INTEGER DEFAULT 0,
    domain_authority INTEGER,
    page_authority INTEGER,
    backlinks_count INTEGER,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(keyword, search_engine, country, position)
);

CREATE INDEX idx_serp_keyword ON serp_results(keyword);
CREATE INDEX idx_serp_analyzed ON serp_results(analyzed_at DESC);
```

#### 3.2.11 content_tasks
```sql
CREATE TABLE content_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES clusters(id),
    topic_title VARCHAR(500) NOT NULL,
    primary_keyword VARCHAR(255),
    secondary_keywords TEXT[],
    intent_type VARCHAR(50),  -- informational/commercial/transactional
    difficulty VARCHAR(50),  -- easy/medium/hard
    priority INTEGER DEFAULT 50,
    outline JSONB,
    score FLOAT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',  -- pending/processing/completed/failed
    assigned_to VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_content_tasks_status ON content_tasks(status);
CREATE INDEX idx_content_tasks_priority ON content_tasks(priority DESC);
CREATE INDEX idx_content_tasks_cluster ON content_tasks(cluster_id);
```

#### 3.2.12 content_task_keywords
```sql
CREATE TABLE content_task_keywords (
    task_id UUID NOT NULL REFERENCES content_tasks(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES keywords(id),
    keyword_text VARCHAR(255) NOT NULL,
    keyword_type VARCHAR(50) DEFAULT 'secondary',  -- primary/secondary/lsi
    search_volume INTEGER,
    difficulty FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (task_id, keyword_text)
);
```

#### 3.2.13 content_drafts
```sql
CREATE TABLE content_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES content_tasks(id),
    version INTEGER DEFAULT 1,
    content_markdown TEXT NOT NULL,
    content_html TEXT,
    word_count INTEGER DEFAULT 0,
    reading_time INTEGER,  -- minutes
    h2_count INTEGER DEFAULT 0,
    h3_count INTEGER DEFAULT 0,
    table_count INTEGER DEFAULT 0,
    list_count INTEGER DEFAULT 0,
    faq_count INTEGER DEFAULT 0,
    images JSONB DEFAULT '[]',
    internal_links TEXT[],
    external_links TEXT[],
    model_used VARCHAR(100),
    tokens_used INTEGER,
    generation_time FLOAT,  -- seconds
    status VARCHAR(50) DEFAULT 'draft',  -- draft/review/published/archived
    published_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, version)
);

CREATE INDEX idx_content_drafts_task ON content_drafts(task_id);
CREATE INDEX idx_content_drafts_status ON content_drafts(status);
```

#### 3.2.14 draft_validations
```sql
CREATE TABLE draft_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
    validation_type VARCHAR(50) NOT NULL,  -- word_count/structure/keywords/grammar
    is_passed BOOLEAN NOT NULL,
    score FLOAT DEFAULT 0,
    details JSONB DEFAULT '{}',
    suggestions TEXT[],
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_draft_validations_draft ON draft_validations(draft_id);
```

#### 3.2.15 keywords
```sql
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255) NOT NULL,
    category VARCHAR(100),  -- process/equipment/defect/safety
    search_volume INTEGER,
    difficulty FLOAT,
    cpc FLOAT,
    competition FLOAT,
    intent VARCHAR(50),  -- informational/commercial/transactional
    is_seed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(keyword)
);

CREATE INDEX idx_keywords_category ON keywords(category);
CREATE INDEX idx_keywords_volume ON keywords(search_volume DESC);
CREATE INDEX idx_keywords_active ON keywords(is_active);
```

#### 3.2.16 config_store
```sql
CREATE TABLE config_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type VARCHAR(100) NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(config_type, config_key)
);

CREATE INDEX idx_config_type ON config_store(config_type);
```

#### 3.2.17 job_runs（新增）
```sql
CREATE TABLE job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'running',  -- running/completed/failed/cancelled
    config_snapshot JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_message TEXT,
    meta JSONB DEFAULT '{}'
);

CREATE INDEX idx_job_runs_pipeline ON job_runs(pipeline_name);
CREATE INDEX idx_job_runs_status ON job_runs(status);
CREATE INDEX idx_job_runs_started ON job_runs(started_at DESC);
```

#### 3.2.18 job_events（新增）
```sql
CREATE TABLE job_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_run_id UUID NOT NULL REFERENCES job_runs(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,  -- info/warning/error/debug
    message TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_events_run ON job_events(job_run_id);
CREATE INDEX idx_job_events_type ON job_events(event_type);
CREATE INDEX idx_job_events_created ON job_events(created_at DESC);
```

---

## 4. API接口设计

### 4.1 基础信息

- 基础路径：`/api/v1`
- 认证方式：Bearer Token (JWT)
- 响应格式：JSON

### 4.2 统一响应格式

```json
{
  "success": true,
  "data": {},
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  },
  "errors": []
}
```

### 4.3 API端点清单

#### Sources API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /sources | 获取数据源列表 |
| POST | /sources | 创建数据源 |
| GET | /sources/{id} | 获取数据源详情 |
| PUT | /sources/{id} | 更新数据源 |
| DELETE | /sources/{id} | 删除数据源 |
| POST | /sources/{id}/sync | 触发同步 |

#### Questions API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /questions | 获取问题列表（支持过滤） |
| GET | /questions/{id} | 获取问题详情 |
| GET | /questions/stats | 获取问题统计 |
| POST | /questions/search | 语义搜索问题 |

#### Clusters API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /clusters | 获取聚类列表 |
| GET | /clusters/{id} | 获取聚类详情（含变体问题） |
| POST | /clusters/{id}/approve | 批准聚类 |
| POST | /clusters/{id}/merge | 合并聚类 |
| DELETE | /clusters/{id} | 删除聚类 |
| GET | /clusters/trending | 热门聚类 |

#### Tasks API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /tasks | 获取任务列表 |
| GET | /tasks/{id} | 获取任务详情 |
| POST | /tasks | 创建内容任务 |
| POST | /tasks/generate | 自动生成任务 |
| PUT | /tasks/{id}/priority | 更新优先级 |
| POST | /tasks/{id}/start | 开始处理任务 |
| DELETE | /tasks/{id} | 删除任务 |

#### Content API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /drafts | 获取草稿列表 |
| GET | /drafts/{id} | 获取草稿详情 |
| POST | /drafts/generate | 生成内容草稿 |
| POST | /drafts/{id}/regenerate | 重新生成 |
| POST | /drafts/{id}/validate | 校验内容 |
| PUT | /drafts/{id} | 更新草稿 |
| POST | /drafts/{id}/publish | 发布内容 |

#### Keywords API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /keywords | 获取关键词列表 |
| POST | /keywords | 添加关键词 |
| POST | /keywords/import | 批量导入 |
| GET | /keywords/suggest | 关键词建议 |

#### Jobs API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /jobs | 获取任务运行列表 |
| GET | /jobs/{id} | 获取运行详情 |
| POST | /jobs/trigger | 手动触发Pipeline |
| GET | /jobs/{id}/logs | 获取运行日志 |
| POST | /jobs/{id}/cancel | 取消运行 |

#### Config API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /config/{type} | 获取配置 |
| PUT | /config/{type} | 更新配置 |

#### Dashboard API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /dashboard/stats | 获取仪表盘统计 |
| GET | /dashboard/trends | 获取趋势数据 |
| GET | /dashboard/activity | 获取活动日志 |

---

## 5. Celery任务设计

### 5.1 任务队列配置

```python
CELERY_TASK_ROUTES = {
    # 采集队列 - 外部API，需限速
    'app.collectors.*': {'queue': 'collector'},

    # 处理队列 - CPU密集
    'app.processors.*': {'queue': 'processor'},

    # 分析队列 - IO密集
    'app.analysis.*': {'queue': 'analysis'},

    # 生成队列 - LLM调用，成本控制
    'app.generators.*': {'queue': 'generator'},
}
```

### 5.2 任务依赖图

```mermaid
flowchart LR
    subgraph COLLECTOR[queue:collector]
        c1[collect_trends]
        c2[collect_reddit]
        c3[collect_stackexchange]
    end

    subgraph PROCESSOR[queue:processor]
        p1[extract_questions]
        p2[normalize_questions]
        p3[deduplicate_questions]
        p4[generate_embeddings]
        p5[cluster_questions]
        p6[score_clusters]
    end

    subgraph ANALYSIS[queue:analysis]
        a1[analyze_serp]
        a2[generate_topics]
    end

    subgraph GENERATOR[queue:generator]
        g1[generate_brief]
        g2[generate_outline]
        g3[generate_content]
        g4[validate_content]
    end

    c1 --> p1
    c2 --> p1
    c3 --> p1
    p1 --> p2 --> p3 --> p4 --> p5 --> p6
    p6 --> a1 --> a2
    a2 --> g1 --> g2 --> g3 --> g4
```

### 5.3 定时任务

| 任务 | 调度 | 队列 |
|------|------|------|
| collect_trends | 每日 00:00 | collector |
| collect_reddit | 每6小时 | collector |
| collect_stackexchange | 每12小时 | collector |
| cluster_questions | 每日 02:00 | processor |
| score_clusters | 每日 03:00 | processor |
| generate_topics | 每日 04:00 | analysis |
| cleanup_old_data | 每周日 00:00 | processor |

### 5.4 重试与错误处理

```python
CELERY_TASK_DEFAULT_RETRY_DELAY = 60  # 1分钟
CELERY_TASK_MAX_RETRIES = 3

# 指数退避
@task(retry_backoff=True, retry_backoff_max=600, retry_jitter=True)
def collect_reddit():
    ...
```

---

## 6. AI生成模块设计

### 6.1 使用阿里云通义千问

```python
# 配置
DASHSCOPE_API_KEY = "your-api-key"
MODEL_NAME = "qwen-plus"  # 或 qwen-max

# Embedding使用OpenAI（通义千问embedding不兼容）
EMBEDDING_MODEL = "text-embedding-3-small"
```

### 6.2 三阶段生成流程

#### Stage 1: Brief生成
```python
BRIEF_PROMPT = """
你是一个专业的工业涂装领域SEO内容策划师。

基于以下信息，生成内容Brief：

聚类主题：{cluster_title}
核心关键词：{primary_keyword}
相关问题：
{related_questions}

SERP分析结果：
{serp_analysis}

请输出：
1. 核心概念（3-5个）
2. 必须回答的问题（5-7个）
3. 目标读者画像
4. 内容差异化角度
5. 建议的字数和结构
"""
```

#### Stage 2: Outline生成
```python
OUTLINE_PROMPT = """
基于以下Brief，生成详细的文章大纲：

{brief}

要求：
1. 包含5-7个H2标题
2. 每个H2下有2-3个H3小节
3. 标注每个小节的核心要点
4. 指出需要插入表格/列表/FAQ的位置

输出JSON格式：
{
  "title": "文章标题",
  "meta_description": "SEO描述（150字以内）",
  "h2_sections": [
    {
      "heading": "H2标题",
      "h3_sections": [
        {"heading": "H3标题", "key_points": ["要点1", "要点2"]}
      ],
      "include_table": false,
      "include_list": false
    }
  ],
  "faqs": [
    {"question": "FAQ问题", "answer_hint": "回答方向"}
  ]
}
"""
```

#### Stage 3: Section写作
```python
SECTION_PROMPT = """
你是工业涂装领域的技术写作专家。

请撰写以下章节：

章节标题：{section_title}
核心要点：{key_points}
目标关键词：{keywords}
字数要求：{word_count}字

写作要求：
1. 使用专业但易懂的语言
2. 包含具体数据、案例或步骤
3. 适当使用行业术语并解释
4. 优化自然融入关键词
5. 使用Markdown格式

输出Markdown格式的内容。
"""
```

### 6.3 内容质量标准

| 指标 | 要求 |
|------|------|
| 总字数 | ≥1200字 |
| H2数量 | 5-7个 |
| H3数量 | 10-15个 |
| 表格 | ≥1个 |
| 列表 | ≥2个 |
| FAQ | ≥3个 |
| 关键词密度 | 1-2% |
| 首段含关键词 | 必须 |
| 结语含CTA | 建议 |

---

## 7. 前端设计

### 7.1 页面清单

| 页面 | 路径 | 功能 |
|------|------|------|
| Dashboard | /dashboard | 总览统计、趋势图表 |
| Radar | /radar | 新问题监控、热门话题 |
| Clusters | /clusters | 聚类管理、问题归组 |
| Tasks | /tasks | 内容任务管理 |
| Drafts | /drafts | 草稿列表、内容编辑 |
| Settings | /settings | 配置管理、数据源管理 |

### 7.2 Dashboard设计

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                                    [用户] [设置]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 总问题  │ │ 聚类数  │ │ 待处理  │ │ 已生成  │           │
│ │ 15,234  │ │ 1,024   │ │ 89      │ │ 456     │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┐ ┌───────────────────────────┐   │
│ │ 采集趋势图（7天）      │ │ 聚类评分分布               │   │
│ │ [折线图]              │ │ [柱状图]                  │   │
│ └───────────────────────┘ └───────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ 最近活动                                      [查看全部]    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ • Reddit采集完成 - 新增23个问题 - 2分钟前           │   │
│ │ • 新聚类创建 - "喷漆室通风设计" - 15分钟前          │   │
│ │ • 内容生成完成 - "静电喷涂原理" - 1小时前           │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Radar页面设计

```
┌─────────────────────────────────────────────────────────────┐
│ Content Radar                    [刷新] [筛选] [导出]        │
├─────────────────────────────────────────────────────────────┤
│ [新问题] [热门聚类] [高分话题] [SERP机会]                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🔥 喷漆室气流设计如何优化？                          │   │
│ │ 来源: Reddit/IndustrialAutomation | 评分: 85        │   │
│ │ [创建任务] [加入聚类] [忽略]                         │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ 🔥 静电喷涂和空气喷涂的区别？                        │   │
│ │ 来源: StackExchange/Engineering | 评分: 78          │   │
│ │ [创建任务] [加入聚类] [忽略]                         │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 项目目录结构

```
paint-automation-radar/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI入口
│   │   ├── config.py                  # 配置管理
│   │   ├── database.py                # 数据库连接
│   │   ├── dependencies.py            # 依赖注入
│   │   │
│   ├── models/                        # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── source.py
│   │   ├── question.py
│   │   ├── cluster.py
│   │   ├── content.py
│   │   └── job.py
│   │
│   ├── schemas/                       # Pydantic模型
│   │   ├── __init__.py
│   │   ├── source.py
│   │   ├── question.py
│   │   ├── cluster.py
│   │   ├── content.py
│   │   └── job.py
│   │
│   ├── api/                           # API路由
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── sources.py
│   │   ├── questions.py
│   │   ├── clusters.py
│   │   ├── tasks.py
│   │   ├── content.py
│   │   ├── keywords.py
│   │   ├── jobs.py
│   │   ├── config.py
│   │   └── dashboard.py
│   │
│   ├── collectors/                    # 数据采集
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── trends.py
│   │   ├── reddit.py
│   │   └── stackexchange.py
│   │
│   ├── processors/                    # 数据处理
│   │   ├── __init__.py
│   │   ├── extractor.py
│   │   ├── normalizer.py
│   │   ├── deduplicator.py
│   │   └── embedder.py
│   │
│   ├── analysis/                      # 分析模块
│   │   ├── __init__.py
│   │   ├── clusterer.py               # HDBSCAN聚类
│   │   ├── scorer.py                  # 评分系统
│   │   └── serp_analyzer.py           # SERP分析
│   │
│   ├── generators/                    # 内容生成
│   │   ├── __init__.py
│   │   ├── topic_generator.py
│   │   ├── brief_writer.py
│   │   ├── outline_writer.py
│   │   └── content_writer.py
│   │
│   ├── validators/                    # 内容校验
│   │   ├── __init__.py
│   │   └── content_validator.py
│   │
│   ├── jobs/                          # Celery任务
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── collector_tasks.py
│   │   ├── processor_tasks.py
│   │   ├── analysis_tasks.py
│   │   └── generator_tasks.py
│   │
│   └── utils/                         # 工具函数
│       ├── __init__.py
│       ├── text.py
│       ├── embedding.py
│       └── llm.py
│
├── frontend/                          # Next.js前端
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── radar/
│   │   ├── clusters/
│   │   ├── tasks/
│   │   ├── drafts/
│   │   └── settings/
│   ├── components/
│   │   ├── ui/                        # shadcn组件
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── clusters/
│   │   └── content/
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── package.json
│
├── database/                          # 数据库脚本
│   ├── migrations/
│   ├── seeds/
│   │   ├── keywords.sql
│   │   ├── sources.sql
│   │   └── config.sql
│   └── init.sql
│
├── config/                            # 配置文件
│   ├── seed_keywords.json
│   ├── subreddits.json
│   ├── stackexchange_tags.json
│   ├── synonym_map.json
│   └── blacklist_keywords.json
│
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── pyproject.toml
├── requirements.txt
└── README.md
```

---

## 9. 部署配置

### 9.1 Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: paint_radar
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/paint_radar
      REDIS_URL: redis://redis:6379/0
      DASHSCOPE_API_KEY: ${DASHSCOPE_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      SERPAPI_KEY: ${SERPAPI_KEY}
    depends_on:
      - postgres
      - redis
    ports:
      - "8000:8000"
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  celery_worker:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/paint_radar
      REDIS_URL: redis://redis:6379/0
      DASHSCOPE_API_KEY: ${DASHSCOPE_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      SERPAPI_KEY: ${SERPAPI_KEY}
    depends_on:
      - postgres
      - redis
    command: celery -A app.jobs.celery_app worker -l info -Q collector,processor,analysis,generator

  celery_beat:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/paint_radar
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    command: celery -A app.jobs.celery_app beat -l info

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 9.2 环境变量

```bash
# .env
DATABASE_URL=postgresql://admin:password@localhost:5432/paint_radar
REDIS_URL=redis://localhost:6379/0

# API Keys
DASHSCOPE_API_KEY=your-dashscope-key
OPENAI_API_KEY=your-openai-key  # 仅用于Embedding
SERPAPI_KEY=your-serpapi-key

# Reddit API
REDDIT_CLIENT_ID=your-client-id
REDDIT_CLIENT_SECRET=your-client-secret
REDDIT_USER_AGENT=PaintRadar/1.0

# StackExchange API
STACKEXCHANGE_KEY=your-key

# Security
SECRET_KEY=your-secret-key
```

---

## 10. 实施计划

### Phase 1: 基础设施（Week 1）
- [ ] 项目初始化
- [ ] 数据库设计与迁移
- [ ] Docker环境配置
- [ ] FastAPI基础框架
- [ ] 基础API端点

### Phase 2: 数据采集（Week 2）
- [ ] Reddit采集器
- [ ] StackExchange采集器
- [ ] Trends采集器
- [ ] Celery任务调度
- [ ] 错误处理与重试

### Phase 3: 数据处理（Week 3）
- [ ] 文本清洗与标准化
- [ ] 向量化（OpenAI Embedding）
- [ ] 去重算法（余弦相似度）
- [ ] 聚类算法（HDBSCAN）
- [ ] 评分系统

### Phase 4: 内容生成（Week 4）
- [ ] SERP分析模块
- [ ] Topic生成器
- [ ] 三阶段AI写作
- [ ] 内容校验器

### Phase 5: 前端开发（Week 5-6）
- [ ] Dashboard页面
- [ ] Radar页面
- [ ] Clusters页面
- [ ] Tasks页面
- [ ] Drafts页面
- [ ] Settings页面

### Phase 6: 测试与部署（Week 7）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 生产部署

---

## 11. 验证方案

### 11.1 功能验证
1. **采集验证**：检查各数据源问题是否正常入库
2. **聚类验证**：检查相似问题是否正确聚合
3. **生成验证**：检查生成内容是否符合质量标准
4. **API验证**：使用Postman测试所有端点

### 11.2 性能验证
- 向量查询响应 < 100ms
- API响应 < 500ms
- 页面加载 < 2s

### 11.3 质量验证
- 内容字数 ≥ 1200
- 关键词密度 1-2%
- 结构完整（H2/H3/表格/FAQ）
