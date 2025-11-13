# AI调用流程梳理文档

## 一、AI服务配置 (`ai-service.js`)

### 1.1 配置信息
- **当前使用的AI服务**: DeepSeek
- **API配置位置**: `AI_CONFIG` 对象
- **支持的AI服务**: OpenAI, Anthropic Claude, DeepSeek, Custom
- **缓存机制**: 启用，24小时过期

### 1.2 核心调用函数
```javascript
callAI(messages, options)
```
- 通用AI调用入口
- 包含权限检查（登录状态、查询次数）
- 包含缓存机制
- 支持多种AI服务提供商

---

## 二、AI调用场景

### 2.1 场景建议生成 (`generateScenarioSuggestions`)

**调用位置**:
1. `scenario-suggestions.js` - `loadScenarioSuggestions()` 函数
2. `formulas-page.js` - `renderScenarioSuggestions()` 函数

**调用流程**:
```
用户访问页面
  ↓
检查问卷数据
  ↓
检查AI配置和权限
  ↓
调用 generateScenarioSuggestions(questionnaireData)
  ↓
  → callAI() [带权限检查]
  ↓
解析JSON响应
  ↓
渲染场景建议
```

**权限检查**:
- 检查用户登录状态
- 检查剩余AI查询次数
- 未登录用户可能显示提示

**数据流**:
- 输入: `questionnaireData` (问卷数据)
- 输出: `{ scenarios: [...] }` (场景建议JSON)

**特点**:
- 生成2个不同的使用场景
- 包含时间线（从早到晚）
- 每个时间点推荐1-2个配方
- 最大token: 3000

---

### 2.2 个性化配方推荐 (`generatePersonalizedSuggestions`)

**调用位置**:
- `formulas-page.js` - `renderPersonalizedSuggestions()` 函数

**调用流程**:
```
检查问卷数据
  ↓
规则匹配系统（基础推荐）
  ↓
可选: AI增强推荐
  ↓
  → generateAIFormulaRecommendations() [可选]
  ↓
  → callAI() [带权限检查]
  ↓
返回推荐结果
```

**特点**:
- 先使用规则匹配系统
- AI作为增强功能（可选）
- 如果AI不可用，回退到规则匹配

---

### 2.3 配方推荐理由生成 (`generateAISuggestionText`)

**调用位置**:
- `formulas-page.js` - 渲染单个配方时
- `formula-suggestions.js` - `generateAISuggestionTextAsync()` 函数（依赖 `formula-database.js`）

**调用流程**:
```
渲染配方卡片
  ↓
检查是否启用AI
  ↓
调用 generateAISuggestionText(questionnaireData, formula)
  ↓
  → callAI() [带权限检查]
  ↓
显示推荐理由
```

**特点**:
- 为单个配方生成个性化推荐理由
- 最大token: 150
- 简洁的1-2句话说明

---

### 2.4 AI问答 (`askAIQuestion`)

**调用位置**:
- 目前未在主要页面中使用（预留功能）

**功能**:
- 回答用户关于芳疗的问题
- 可结合用户健康状况上下文

---

## 三、权限和限制

### 3.1 权限检查流程
```
callAI() 函数内部:
  1. 检查缓存（缓存命中不消耗次数）
  2. 检查用户登录状态
  3. 检查剩余查询次数
  4. 调用API
  5. 扣除查询次数
  6. 保存到缓存
```

### 3.2 错误处理
- `AI_QUERY_REQUIRES_LOGIN`: 需要登录
- `AI_QUERY_LIMIT_EXCEEDED`: 查询次数已用完
- API调用失败: 返回null，回退到规则匹配

### 3.3 缓存机制
- 缓存键: `JSON.stringify({ prompt, context })`
- 缓存时间: 24小时
- 缓存命中: 不消耗查询次数，直接返回

---

## 四、调用统计

### 4.1 主要调用点

| 调用函数 | 调用位置 | 频率 | 权限要求 |
|---------|---------|------|---------|
| `generateScenarioSuggestions` | `scenario-suggestions.js` | 页面加载时1次 | 需要登录 |
| `generateScenarioSuggestions` | `formulas-page.js` | 页面加载时1次 | 需要登录 |
| `generateAISuggestionText` | `formulas-page.js` | 每个配方1次 | 需要登录 |
| `generateAIFormulaRecommendations` | `formula-suggestions.js` | 可选，页面加载时1次 | 需要登录 |

### 4.2 Token使用估算

| 功能 | maxTokens | 估算成本 |
|------|-----------|---------|
| 场景建议 | 3000 | 高 |
| 配方推荐理由 | 150 | 低 |
| 配方推荐 | 1000 | 中 |

---

## 五、优化建议

### 5.1 已实现的优化
✅ 缓存机制（24小时）
✅ 权限检查（登录状态、查询次数）
✅ 错误处理和回退机制
✅ 异步加载脚本（defer）

### 5.2 可进一步优化
- [ ] 批量生成推荐理由（减少API调用）
- [ ] 更智能的缓存策略（基于用户数据变化）
- [ ] 请求去重（相同请求不重复调用）
- [ ] 响应式加载（按需加载AI功能）
- [ ] 错误重试机制
- [ ] 请求队列（避免并发过多）

---

## 六、代码结构

```
ai-service.js
├── AI_CONFIG (配置)
├── 缓存系统
│   ├── getCachedResponse()
│   ├── setCachedResponse()
│   └── generateCacheKey()
├── API调用函数
│   ├── callOpenAI()
│   ├── callAnthropic()
│   ├── callDeepSeek()
│   └── callCustomAPI()
├── 通用调用函数
│   └── callAI() [核心]
└── 业务函数
    ├── generateScenarioSuggestions()
    ├── generateAISuggestionText()
    ├── generateAIFormulaRecommendations()
    └── askAIQuestion()
```

---

## 七、依赖关系

```
scenario-suggestions.js
  └── 依赖: ai-service.js (generateScenarioSuggestions)

formulas-page.js
  ├── 依赖: ai-service.js (generateScenarioSuggestions)
  └── 依赖: formula-suggestions.js (generatePersonalizedSuggestions)

formula-suggestions.js
  ├── 依赖: formula-database.js (FORMULA_DATABASE)
  └── 依赖: ai-service.js (generateAIFormulaRecommendations, generateAISuggestionText)
```

---

## 八、调试和测试

### 8.1 检查AI配置
```javascript
console.log('AI Provider:', AI_CONFIG.provider);
console.log('AI Config:', AI_CONFIG[AI_CONFIG.provider]);
```

### 8.2 测试AI调用
```javascript
// 测试场景建议
const data = getQuestionnaireData();
const result = await generateScenarioSuggestions(data);
console.log('Result:', result);
```

### 8.3 检查权限
```javascript
if (window.authSystem) {
  console.log('Logged in:', window.authSystem.isUserLoggedIn());
  console.log('Can use AI:', window.authSystem.canUseAIInquiry());
  console.log('Remaining:', window.authSystem.getRemainingAIInquiries());
}
```

---

## 九、常见问题

### Q1: AI调用失败怎么办？
A: 系统会自动回退到规则匹配系统，不会影响基本功能。

### Q2: 如何减少AI调用次数？
A: 
- 利用缓存机制（相同请求24小时内不重复调用）
- 批量处理（合并多个请求）
- 按需加载（只在需要时调用）

### Q3: 如何切换AI服务？
A: 修改 `ai-service.js` 中的 `AI_CONFIG.provider` 和对应的API Key。

### Q4: 未登录用户可以使用AI吗？
A: 根据配置，未登录用户可能无法使用AI功能，会显示登录提示。

---

## 十、未来改进方向

1. **智能缓存**: 基于用户数据变化自动失效缓存
2. **批量处理**: 合并多个小请求为一个大请求
3. **流式响应**: 支持流式输出，提升用户体验
4. **离线模式**: 缓存常用响应，支持离线使用
5. **A/B测试**: 测试不同prompt的效果
6. **性能监控**: 记录调用时间、成功率等指标

