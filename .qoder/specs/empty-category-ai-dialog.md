# 空分类页面AI对话框优化计划

## 目标
优化空分类页面的AI对话体验：从"我们还在建设"的弱势表述，转变为"依托成熟供应链，我们能满足你的一切需求"的强势引导，并通过AI对话主动引导用户提交采购意向。

## 修改文件清单

| 文件 | 操作 |
|------|------|
| `src/components/category/EmptyStateAIDialog.tsx` | 重写 - Hero文案 + AI引导 + 文件上传 |
| `src/lib/ai/config.ts` | 修改 - SYSTEM_PROMPT增加空分类引导指令 |
| `src/app/api/ai-assistant/route.ts` | 修改 - 支持source上下文参数 |

## Step 1: 重写 EmptyStateAIDialog.tsx

### 1a. Hero区域文案重写

**当前（弱势）**:
- 标题: "Building Our {categoryName} Catalog"
- 副标题: "We're expanding this category..."

**改为（强势供应链）**:
- 标题: "Source {categoryName} Through Machrio"
- 副标题: "Backed by a global industrial supply network, we fulfill virtually any procurement need. Tell us exactly what you're looking for — we'll deliver a competitive quote fast."

### 1b. Tab标签优化
- "AI Assistant" → "Tell Us What You Need"
- "Request Quote" → "Submit RFQ"

### 1c. AI聊天初始提示重写

**当前**: "Describe what you're looking for and our AI will help you find it."

**改为**: AI助手自动发出一条欢迎消息（预填入chatHistory），主动引导用户说出需求：

```
"Hi! I'm your dedicated sourcing assistant for {categoryName}. 

We work with an extensive network of verified industrial suppliers — even if a product isn't listed here yet, we can source and quote it for you.

To get started, could you tell me:
• What specific products or specs do you need?
• Approximate quantities?
• Any brand preferences or certifications required?

Or if you have a procurement list, feel free to upload it below."
```

### 1d. 快捷建议按钮更新

**当前**:
1. "What {category} do you recommend?"
2. "I need bulk {category}"  
3. "What certifications are available?"

**改为**:
1. "I need specific {category} — let me describe"
2. "I have a procurement list to share"
3. "Get me a quote for bulk {category}"

### 1e. 新增文件上传区域

在AI聊天输入框下方添加文件上传区（始终可见）：

```tsx
<div className="mt-3 border border-dashed border-secondary-300 rounded-lg p-3 text-center">
  <input type="file" accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg" 
         multiple onChange={handleFileUpload} className="hidden" id="rfq-upload" />
  <label htmlFor="rfq-upload" className="cursor-pointer text-sm text-secondary-500 hover:text-primary-600">
    <UploadIcon /> Drop your spec sheet, BOM, or procurement list here
  </label>
  {uploadedFiles.length > 0 && <FileList />}
</div>
```

文件上传后：
- 显示文件名列表
- 在对话中自动发送消息："I've uploaded {N} file(s): {filenames}. Please review and prepare a quote."
- 文件实际附加到后续RFQ提交中

### 1f. 对话中的引导转化

当用户描述了需求后，AI应该引导填写快速RFQ表单。在聊天区域底部添加一个"浮动CTA"：

当chatHistory有2+条消息后，显示：
```tsx
<div className="bg-accent-50 border border-accent-200 rounded-lg p-3 mt-3">
  <p className="text-sm font-medium">Ready to get your quote?</p>
  <button onClick={() => setMode('rfq')}>Submit a Quick RFQ →</button>
</div>
```

### 1g. RFQ表单优化

- Product Description 自动预填：从AI对话中提取用户描述的需求
- 新增文件上传字段：显示之前在AI模式上传的文件
- 提交成功文案改为："Our sourcing specialists are on it. Expect a competitive quote in your inbox within 24 hours."

## Step 2: AI上下文增强

### 2a. 修改API请求，传递来源上下文

在 EmptyStateAIDialog 调用 `/api/ai-assistant` 时，增加 `source` 字段：

```typescript
body: JSON.stringify({
  message: fullMessage,
  conversationHistory: ...,
  source: 'empty-category',
  categoryName: categoryName,
  categoryPath: parentCategories.join(' > '),
})
```

### 2b. 修改 route.ts，传递source到processConversation

```typescript
// 在message前面添加系统级上下文（不显示给用户）
if (source === 'empty-category') {
  const categoryContext = `[SYSTEM CONTEXT: User is on an empty category page for "${categoryName}" (${categoryPath}). This category doesn't have products listed yet, but Machrio can source them. Your goal: understand what they need, then guide them to submit an RFQ. Be proactive about asking for specs, quantities, and offering to accept their procurement documents.]`
  fullHistory = [{ role: 'system', content: categoryContext }, ...history]
}
```

### 2c. 修改 SYSTEM_PROMPT (config.ts)

在现有SYSTEM_PROMPT末尾追加一段：

```
## Empty Category Page Behavior
When context indicates the user is on an empty category page:
1. NEVER say "we don't have" or "not available" — say "we can source this for you"
2. Proactively ask for: product specs, quantities, brand preferences, certifications, timeline
3. After 2-3 exchanges, suggest: "I have enough details — would you like me to start a quote request?"
4. Mention that uploading spec sheets or procurement lists speeds up the quoting process
5. Emphasize: global supplier network, competitive pricing, fast turnaround
6. Your tone: confident sourcing expert, not apologetic about empty catalog
```

## Step 3: Fallback响应优化

修改 `generateFallbackResponse` 函数中的默认响应，当检测到empty-category来源时，返回供应链导向的响应而非通用搜索响应。

## 数据流

```
空分类页面加载 → EmptyStateAIDialog (新文案 + 欢迎消息)
    ↓
用户输入需求 or 上传文件
    ↓
POST /api/ai-assistant {message, source: 'empty-category', categoryName}
    ↓
route.ts 注入系统上下文 → processConversation
    ↓
AI回复(引导式) → 2-3轮对话后 → 浮动CTA "Submit RFQ"
    ↓
用户点击 → RFQ表单(预填需求 + 附件) → POST /api/rfq
    ↓
成功提示: "Expect a competitive quote within 24 hours"
```

## 验证步骤

1. 访问空分类页面如 `/category/ventilation-fans`
2. 确认新文案："Source Ventilation Fans Through Machrio"
3. 确认AI欢迎消息自动显示
4. 测试快捷建议按钮是否正确
5. 测试文件上传功能（拖拽+点击）
6. 与AI对话2-3轮后确认浮动CTA出现
7. 切换到RFQ模式确认需求自动预填
8. 构建和类型检查通过
