# AI API 集成指南

本网站支持AI API集成，可以显著提升用户体验，提供更智能、更个性化的配方推荐。

## 🎯 AI功能优势

1. **更智能的推荐**: AI可以理解复杂的症状组合，提供更精准的配方推荐
2. **个性化解释**: 为每个推荐配方生成详细的、个性化的推荐理由
3. **自然语言交互**: 支持用户提问，获得专业的芳疗建议
4. **持续学习**: AI可以根据用户反馈不断优化推荐

## 📋 支持的AI服务

### 1. OpenAI (推荐)
- **模型**: GPT-4, GPT-4o-mini, GPT-3.5-turbo
- **优势**: 响应快速，成本较低
- **获取API Key**: https://platform.openai.com/api-keys

### 2. Anthropic Claude
- **模型**: Claude 3 Opus, Claude 3 Haiku
- **优势**: 安全性高，回答质量优秀
- **获取API Key**: https://console.anthropic.com/

### 3. 自定义API
- 支持任何兼容OpenAI格式的API
- 可以部署自己的AI服务

## 🚀 快速开始

### 步骤1: 获取API Key

选择您要使用的AI服务，注册并获取API Key。

### 步骤2: 配置AI服务

编辑 `ai-service.js` 文件，找到 `AI_CONFIG` 配置：

```javascript
const AI_CONFIG = {
    // 选择使用的AI服务
    provider: 'openai', // 改为 'openai', 'anthropic', 'custom', 或 'none'
    
    // OpenAI配置
    openai: {
        apiKey: 'sk-your-api-key-here', // 填入您的API Key
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
    },
    
    // ... 其他配置
};
```

### 步骤3: 测试配置

1. 打开网站
2. 填写健康状况问卷
3. 查看配方推荐页面
4. 如果看到AI生成的推荐理由，说明配置成功！

## ⚙️ 详细配置

### OpenAI配置示例

```javascript
openai: {
    apiKey: 'sk-proj-xxxxxxxxxxxxx',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',        // 推荐使用 gpt-4o-mini (成本低) 或 gpt-4 (质量高)
    temperature: 0.7,            // 0-1，越高越有创造性
    maxTokens: 1000               // 最大响应长度
}
```

### Anthropic Claude配置示例

```javascript
anthropic: {
    apiKey: 'sk-ant-xxxxxxxxxxxxx',
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-3-haiku-20240307',  // 或 'claude-3-opus-20240229'
    maxTokens: 1000
}
```

### 自定义API配置示例

```javascript
custom: {
    apiKey: 'your-api-key',
    baseURL: 'https://your-api-endpoint.com/v1',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
}
```

## 🔒 安全注意事项

### ⚠️ 重要: API Key安全

**不要**将API Key直接提交到公共代码仓库！

推荐做法：

1. **使用环境变量** (生产环境):
   ```javascript
   apiKey: process.env.OPENAI_API_KEY
   ```

2. **使用配置文件** (开发环境):
   - 创建 `config.local.js` 文件
   - 添加到 `.gitignore`
   - 在 `ai-service.js` 中导入

3. **使用后端代理** (最安全):
   - 将API调用移到后端服务器
   - 前端通过自己的API调用后端
   - 后端再调用AI服务

### 创建后端代理示例

```javascript
// 后端 API (Node.js/Express)
app.post('/api/ai-recommend', async (req, res) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
});
```

## 💰 成本估算

### OpenAI
- **GPT-4o-mini**: ~$0.15 / 1M tokens (输入), ~$0.60 / 1M tokens (输出)
- **GPT-4**: ~$30 / 1M tokens (输入), ~$60 / 1M tokens (输出)
- **估算**: 每次推荐约消耗 500-1000 tokens，使用 gpt-4o-mini 每次约 $0.0005-0.001

### Anthropic Claude
- **Claude 3 Haiku**: ~$0.25 / 1M tokens (输入), ~$1.25 / 1M tokens (输出)
- **Claude 3 Opus**: ~$15 / 1M tokens (输入), ~$75 / 1M tokens (输出)

### 优化成本
1. 启用缓存 (`enableCache: true`) - 相同问题24小时内不重复调用
2. 使用较便宜的模型 (gpt-4o-mini 或 claude-3-haiku)
3. 限制 `maxTokens` 值
4. 仅在必要时使用AI (用户明确请求时)

## 🎨 功能说明

### 1. AI增强推荐
- 自动分析用户症状
- 生成个性化推荐理由
- 提供使用建议

### 2. AI问答助手 (可选)
可以添加聊天界面，让用户提问：

```javascript
// 示例: 添加AI问答功能
async function askQuestion(question) {
    const answer = await askAIQuestion(question, {
        questionnaireData: getQuestionnaireData()
    });
    return answer;
}
```

## 🐛 故障排除

### AI功能未启用
- 检查 `AI_CONFIG.provider` 是否为 `'none'`
- 检查API Key是否正确配置
- 检查浏览器控制台是否有错误

### API调用失败
- 检查网络连接
- 验证API Key是否有效
- 检查API配额是否用完
- 查看浏览器控制台的错误信息

### 响应速度慢
- 使用更快的模型 (gpt-4o-mini 或 claude-3-haiku)
- 减少 `maxTokens` 值
- 启用缓存功能

## 📚 更多资源

- [OpenAI API文档](https://platform.openai.com/docs)
- [Anthropic API文档](https://docs.anthropic.com/)
- [OpenAI定价](https://openai.com/pricing)
- [Anthropic定价](https://www.anthropic.com/pricing)

## 💡 最佳实践

1. **渐进式启用**: 先在小范围测试，确认无误后再全面启用
2. **监控使用**: 定期检查API使用量和成本
3. **设置限制**: 在API账户中设置使用限额
4. **用户提示**: 告知用户正在使用AI功能，获得更好的体验
5. **降级方案**: 确保AI不可用时，规则匹配系统仍能正常工作

---

**注意**: 当前配置默认使用规则匹配系统 (`provider: 'none'`)，需要手动配置API Key才能启用AI功能。

