# AI调用总结

## 快速参考

### 核心调用函数
- `callAI(messages, options)` - 所有AI调用的统一入口
- `generateScenarioSuggestions(questionnaireData)` - 生成场景建议
- `generateAISuggestionText(questionnaireData, formula)` - 生成推荐理由
- `generateAIFormulaRecommendations(questionnaireData, formulas)` - 生成配方推荐

### 调用位置统计

| 文件 | 调用函数 | 调用时机 | 频率 |
|------|---------|---------|------|
| `scenario-suggestions.js` | `generateScenarioSuggestions` | 页面加载 | 1次/页面 |
| `formulas-page.js` | `generateScenarioSuggestions` | 页面加载 | 1次/页面 |
| `formulas-page.js` | `generateAISuggestionText` | 渲染每个配方 | N次（N=配方数） |
| `formula-suggestions.js` | `generateAIFormulaRecommendations` | 可选，页面加载 | 0-1次/页面 |

### 调用流程图

```
用户访问页面
    ↓
检查问卷数据
    ↓
检查AI配置 (AI_CONFIG.provider !== 'none')
    ↓
检查用户权限 (登录状态 + 查询次数)
    ↓
检查缓存 (24小时有效期)
    ├─ 缓存命中 → 直接返回（不消耗次数）
    └─ 缓存未命中 → 继续
        ↓
调用 callAI()
    ├─ OpenAI API
    ├─ Anthropic API
    ├─ DeepSeek API (当前使用)
    └─ Custom API
        ↓
成功 → 扣除查询次数 → 保存缓存 → 返回结果
失败 → 返回null → 回退到规则匹配
```

## 权限检查流程

```
callAI() 函数内部:
1. 检查 AI_CONFIG.provider !== 'none'
2. 检查缓存（缓存命中直接返回，不消耗次数）
3. 检查 window.authSystem.isUserLoggedIn()
4. 检查 window.authSystem.canUseAIInquiry()
5. 调用API
6. 成功 → window.authSystem.useAIInquiry() 扣除次数
7. 保存到缓存
```

## 错误处理

### 错误类型
- `AI_QUERY_REQUIRES_LOGIN` - 需要登录
- `AI_QUERY_LIMIT_EXCEEDED` - 查询次数已用完
- API调用失败 - 返回null，回退到规则匹配

### 错误处理策略
- 场景建议失败 → 显示错误提示
- 推荐理由失败 → 使用规则匹配生成
- 配方推荐失败 → 使用规则匹配系统

## 缓存机制

### 缓存键生成
```javascript
cacheKey = JSON.stringify({ prompt, context })
```

### 缓存策略
- 有效期: 24小时
- 缓存命中: 不消耗查询次数
- 存储位置: 内存 (Map)

### 缓存优化建议
- [ ] 基于用户数据变化自动失效
- [ ] 使用localStorage持久化缓存
- [ ] 实现LRU缓存淘汰策略

## 性能优化建议

### 1. 批量处理
**问题**: `generateAISuggestionText` 为每个配方单独调用
**优化**: 批量生成多个配方的推荐理由

```javascript
// 当前: 循环调用
for (let formula of formulas) {
  await generateAISuggestionText(data, formula);
}

// 优化: 批量调用
await generateAISuggestionTextBatch(data, formulas);
```

### 2. 请求去重
**问题**: 相同请求可能被多次调用
**优化**: 使用请求队列，相同请求只调用一次

### 3. 延迟加载
**问题**: 页面加载时立即调用AI
**优化**: 延迟到用户交互时再调用

### 4. 错误重试
**问题**: API调用失败直接返回null
**优化**: 实现指数退避重试机制

```javascript
async function callAIWithRetry(messages, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callAI(messages, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // 指数退避
    }
  }
}
```

### 5. 流式响应
**问题**: 大响应需要等待完整返回
**优化**: 支持流式输出，提升用户体验

## 监控和调试

### 调试工具
```javascript
// 检查AI配置
console.log('AI Provider:', AI_CONFIG.provider);
console.log('AI Config:', AI_CONFIG[AI_CONFIG.provider]);

// 检查权限
if (window.authSystem) {
  console.log('Logged in:', window.authSystem.isUserLoggedIn());
  console.log('Can use AI:', window.authSystem.canUseAIInquiry());
  console.log('Remaining:', window.authSystem.getRemainingAIInquiries());
}

// 测试调用
const data = getQuestionnaireData();
const result = await generateScenarioSuggestions(data);
console.log('Result:', result);
```

### 性能监控
- 记录调用时间
- 记录成功率
- 记录缓存命中率
- 记录错误类型分布

## 安全注意事项

1. **API Key保护**: 当前API Key暴露在前端代码中，建议：
   - 使用后端代理
   - 使用环境变量
   - 实现API Key轮换

2. **权限验证**: 确保每次调用都检查权限

3. **输入验证**: 验证用户输入，防止注入攻击

4. **速率限制**: 实现客户端速率限制，防止滥用

## 未来改进方向

1. **智能缓存**: 基于用户数据变化自动失效
2. **批量处理**: 合并多个小请求
3. **流式响应**: 支持实时输出
4. **离线模式**: 缓存常用响应
5. **A/B测试**: 测试不同prompt效果
6. **性能监控**: 完整的监控系统
7. **错误重试**: 自动重试机制
8. **请求队列**: 管理并发请求

