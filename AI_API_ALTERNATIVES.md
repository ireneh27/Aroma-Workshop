# AI API 替代方案指南

当前您使用的是 **DeepSeek API**，以下是可用的替代方案和配置方法。

## 📋 支持的 API 服务

### 1. **OpenAI** ⭐ 推荐
- **模型**: GPT-4, GPT-4o-mini, GPT-3.5-turbo
- **优势**: 
  - 响应速度快
  - 质量稳定
  - 文档完善
  - 成本相对较低（GPT-4o-mini）
- **价格**: 
  - GPT-4o-mini: ~$0.15/1M tokens (输入), ~$0.60/1M tokens (输出)
  - GPT-4: ~$30/1M tokens (输入), ~$60/1M tokens (输出)
- **获取 API Key**: https://platform.openai.com/api-keys
- **适用场景**: 通用场景，需要高质量响应

### 2. **Anthropic Claude**
- **模型**: Claude 3 Opus, Claude 3 Haiku, Claude 3 Sonnet
- **优势**: 
  - 安全性高
  - 回答质量优秀
  - 长文本处理能力强
- **价格**: 
  - Claude 3 Haiku: ~$0.25/1M tokens (输入), ~$1.25/1M tokens (输出)
  - Claude 3 Opus: ~$15/1M tokens (输入), ~$75/1M tokens (输出)
- **获取 API Key**: https://console.anthropic.com/
- **适用场景**: 需要高质量、安全性的场景

### 3. **DeepSeek** (当前使用)
- **模型**: deepseek-chat, deepseek-coder
- **优势**: 
  - 价格便宜
  - 中文支持好
  - 国内访问速度快
- **价格**: 相对便宜
- **获取 API Key**: https://platform.deepseek.com/
- **适用场景**: 成本敏感，主要服务中文用户

### 4. **百川智能 (Baichuan)** 🇨🇳 国内推荐
- **模型**: Baichuan2-Turbo, Baichuan3
- **优势**: 
  - 中文理解能力强
  - 国内访问速度快
  - 价格合理
- **获取 API Key**: https://platform.baichuan-ai.com/
- **适用场景**: 主要服务中文用户，需要国内访问速度

### 5. **硅基流动 (Silicon Flow)** 🇨🇳 国内推荐
- **模型**: 支持多种模型（包括 DeepSeek-R1）
- **优势**: 
  - 提供 DeepSeek-R1 官方替代 API
  - 新用户有赠金
  - 国内访问速度快
- **获取 API Key**: https://siliconflow.cn/
- **适用场景**: 需要 DeepSeek 替代方案，国内用户

### 6. **Google Gemini**
- **模型**: gemini-pro, gemini-pro-vision
- **优势**: 
  - Google 官方支持
  - 多模态支持
  - 免费额度较高
- **价格**: 有免费额度，超出后按量付费
- **获取 API Key**: https://makersuite.google.com/app/apikey
- **适用场景**: 需要多模态能力，利用免费额度

### 7. **自定义 API** (兼容 OpenAI 格式)
- **支持**: 任何兼容 OpenAI API 格式的服务
- **优势**: 
  - 灵活性高
  - 可以自建服务
  - 可以使用代理服务
- **适用场景**: 有自建服务或使用代理

## 🚀 快速切换指南

### 方法 1: 切换到 OpenAI

编辑 `ai-service.js` 文件：

```javascript
const AI_CONFIG = {
    provider: 'openai', // 改为 'openai'
    
    openai: {
        apiKey: 'sk-your-openai-api-key-here', // 填入您的 OpenAI API Key
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini', // 推荐使用 gpt-4o-mini (成本低)
        temperature: 0.7,
        maxTokens: 1000
    },
    // ... 其他配置保持不变
};
```

### 方法 2: 切换到 Anthropic Claude

```javascript
const AI_CONFIG = {
    provider: 'anthropic', // 改为 'anthropic'
    
    anthropic: {
        apiKey: 'sk-ant-your-anthropic-api-key-here', // 填入您的 Anthropic API Key
        baseURL: 'https://api.anthropic.com/v1',
        model: 'claude-3-haiku-20240307', // 推荐使用 haiku (成本低)
        maxTokens: 1000
    },
    // ... 其他配置保持不变
};
```

### 方法 3: 切换到百川智能 (使用自定义配置)

```javascript
const AI_CONFIG = {
    provider: 'custom', // 使用自定义配置
    
    custom: {
        apiKey: 'your-baichuan-api-key-here',
        baseURL: 'https://api.baichuan-ai.com/v1', // 百川 API 地址
        model: 'Baichuan2-Turbo', // 或 'Baichuan3'
        temperature: 0.7,
        maxTokens: 1000
    },
    // ... 其他配置保持不变
};
```

### 方法 4: 切换到硅基流动 (使用自定义配置)

```javascript
const AI_CONFIG = {
    provider: 'custom', // 使用自定义配置
    
    custom: {
        apiKey: 'your-siliconflow-api-key-here',
        baseURL: 'https://api.siliconflow.cn/v1', // 硅基流动 API 地址
        model: 'deepseek-chat', // 或其他支持的模型
        temperature: 0.7,
        maxTokens: 1000
    },
    // ... 其他配置保持不变
};
```

### 方法 5: 切换到 Google Gemini

需要先添加 Gemini 支持（见下方"添加新 API 支持"部分）

## 💰 成本对比

| API 服务 | 输入价格 (每 1M tokens) | 输出价格 (每 1M tokens) | 推荐模型 | 适用场景 |
|---------|----------------------|----------------------|---------|---------|
| **OpenAI GPT-4o-mini** | $0.15 | $0.60 | gpt-4o-mini | 平衡成本和质量 ⭐ |
| **OpenAI GPT-4** | $30 | $60 | gpt-4 | 最高质量 |
| **Anthropic Claude Haiku** | $0.25 | $1.25 | claude-3-haiku | 高质量，安全性 |
| **DeepSeek** | 较低 | 较低 | deepseek-chat | 成本敏感 |
| **百川智能** | 中等 | 中等 | Baichuan2-Turbo | 中文优化 |
| **硅基流动** | 中等 | 中等 | deepseek-chat | DeepSeek 替代 |
| **Google Gemini** | 免费额度 | 免费额度 | gemini-pro | 利用免费额度 |

**估算**: 每次场景建议生成约消耗 500-1000 tokens
- GPT-4o-mini: 约 $0.0005-0.001 每次
- Claude Haiku: 约 $0.0008-0.0015 每次
- DeepSeek: 约 $0.0002-0.0005 每次

## 🔧 添加新 API 支持

如果需要添加新的 API 服务（如 Google Gemini），需要修改 `ai-service.js`：

### 步骤 1: 添加配置

```javascript
const AI_CONFIG = {
    provider: 'gemini', // 新增
    
    // ... 现有配置
    
    // 添加 Gemini 配置
    gemini: {
        apiKey: 'your-gemini-api-key',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 1000
    }
};
```

### 步骤 2: 添加调用函数

```javascript
// 调用 Google Gemini API
async function callGemini(messages, options = {}) {
    const config = AI_CONFIG.gemini;
    if (!config.apiKey) {
        throw new Error('Gemini API Key未配置');
    }
    
    // Gemini API 格式转换
    const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));
    
    const response = await fetchWithTimeout(
        `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: options.temperature || config.temperature,
                    maxOutputTokens: options.maxTokens || config.maxTokens
                }
            })
        },
        options.timeout || AI_CONFIG.timeout
    );
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`Gemini API错误: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
```

### 步骤 3: 在 callAI 函数中添加路由

```javascript
switch (AI_CONFIG.provider) {
    case 'openai':
        result = await callOpenAI(messages, options);
        break;
    case 'anthropic':
        result = await callAnthropic(messages, options);
        break;
    case 'deepseek':
        result = await callDeepSeek(messages, options);
        break;
    case 'gemini': // 新增
        result = await callGemini(messages, options);
        break;
    case 'custom':
        result = await callCustomAPI(messages, options);
        break;
    default:
        return null;
}
```

## 🎯 推荐方案

### 场景 1: 成本敏感，主要服务中文用户
- **推荐**: DeepSeek 或 百川智能
- **理由**: 价格便宜，中文支持好

### 场景 2: 需要高质量响应，成本可接受
- **推荐**: OpenAI GPT-4o-mini
- **理由**: 质量稳定，成本合理

### 场景 3: 需要最高质量，成本不敏感
- **推荐**: OpenAI GPT-4 或 Anthropic Claude Opus
- **理由**: 质量最高

### 场景 4: 需要国内访问速度
- **推荐**: 百川智能 或 硅基流动
- **理由**: 国内服务器，访问速度快

### 场景 5: 利用免费额度
- **推荐**: Google Gemini
- **理由**: 有免费额度，适合测试和小规模使用

## 🔒 安全建议

1. **不要将 API Key 提交到代码仓库**
   - 使用环境变量
   - 使用配置文件（添加到 .gitignore）
   - 使用后端代理（最安全）

2. **设置使用限额**
   - 在 API 提供商处设置使用限额
   - 监控使用量

3. **定期轮换 API Key**
   - 定期更换 API Key
   - 发现泄露立即更换

## 📚 相关资源

- [OpenAI API 文档](https://platform.openai.com/docs)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [百川智能 API 文档](https://platform.baichuan-ai.com/docs)
- [硅基流动 API 文档](https://siliconflow.cn/docs)
- [Google Gemini API 文档](https://ai.google.dev/docs)

## ❓ 常见问题

### Q: 如何测试新的 API 配置？
A: 配置完成后，访问场景建议页面，查看是否能正常生成 AI 建议。如果失败，检查浏览器控制台的错误信息。

### Q: 可以同时使用多个 API 吗？
A: 当前版本只支持一个 provider。如果需要负载均衡或故障转移，需要修改代码实现。

### Q: API 调用失败怎么办？
A: 系统会自动回退到基于规则的降级方案，用户仍能看到推荐内容。

### Q: 如何降低 API 成本？
A: 
1. 启用缓存（已默认启用）
2. 使用较便宜的模型
3. 减少 maxTokens 值
4. 仅在必要时调用 AI

---

**最后更新**: 2025年1月

