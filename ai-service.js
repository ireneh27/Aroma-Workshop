// AI服务模块 - 用于增强个性化推荐和用户交互
// 支持多种AI API: OpenAI, Anthropic Claude, 或其他兼容OpenAI格式的API

// 配置AI API
const AI_CONFIG = {
    // 选择使用的AI服务: 'openai', 'anthropic', 'deepseek', 'custom', 'none'
    provider: 'deepseek', // 已配置为使用DeepSeek API
    
    // OpenAI配置
    openai: {
        apiKey: '', // 在此填入您的OpenAI API Key
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini', // 或 'gpt-4', 'gpt-3.5-turbo'
        temperature: 0.7,
        maxTokens: 1000
    },
    
    // DeepSeek配置
    deepseek: {
        apiKey: 'sk-5f6238c8a43741afa79a51dee16b6b27',
        baseURL: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat', // DeepSeek的主要模型
        temperature: 0.7,
        maxTokens: 1000
    },
    
    // Anthropic Claude配置
    anthropic: {
        apiKey: '', // 在此填入您的Anthropic API Key
        baseURL: 'https://api.anthropic.com/v1',
        model: 'claude-3-haiku-20240307', // 或 'claude-3-opus-20240229'
        maxTokens: 1000
    },
    
    // 自定义API配置 (兼容OpenAI格式)
    custom: {
        apiKey: '',
        baseURL: '', // 您的API端点
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000
    },
    
    // 是否启用缓存 (减少API调用)
    enableCache: true,
    cacheExpiry: 24 * 60 * 60 * 1000 // 24小时
};

// 缓存系统
const aiCache = new Map();

// 获取缓存的响应
function getCachedResponse(key) {
    if (!AI_CONFIG.enableCache) return null;
    const cached = aiCache.get(key);
    if (cached && Date.now() - cached.timestamp < AI_CONFIG.cacheExpiry) {
        return cached.data;
    }
    aiCache.delete(key);
    return null;
}

// 保存响应到缓存
function setCachedResponse(key, data) {
    if (!AI_CONFIG.enableCache) return;
    aiCache.set(key, { data, timestamp: Date.now() });
}

// 生成缓存键
function generateCacheKey(prompt, context) {
    return JSON.stringify({ prompt, context });
}

// 调用OpenAI API
async function callOpenAI(messages, options = {}) {
    const config = AI_CONFIG.openai;
    if (!config.apiKey) {
        throw new Error('OpenAI API Key未配置');
    }
    
    const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: options.model || config.model,
            messages: messages,
            temperature: options.temperature || config.temperature,
            max_tokens: options.maxTokens || config.maxTokens
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API错误: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 调用Anthropic Claude API
async function callAnthropic(messages, options = {}) {
    const config = AI_CONFIG.anthropic;
    if (!config.apiKey) {
        throw new Error('Anthropic API Key未配置');
    }
    
    // 转换消息格式
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    const userContent = userMessages.join('\n\n');
    
    const response = await fetch(`${config.baseURL}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: options.model || config.model,
            max_tokens: options.maxTokens || config.maxTokens,
            system: systemMessage,
            messages: [{
                role: 'user',
                content: userContent
            }]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API错误: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.content[0].text;
}

// 调用DeepSeek API (兼容OpenAI格式)
async function callDeepSeek(messages, options = {}) {
    const config = AI_CONFIG.deepseek;
    if (!config.apiKey) {
        throw new Error('DeepSeek API Key未配置');
    }
    
    const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: options.model || config.model,
            messages: messages,
            temperature: options.temperature || config.temperature,
            max_tokens: options.maxTokens || config.maxTokens
        })
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`DeepSeek API错误: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 调用自定义API (兼容OpenAI格式)
async function callCustomAPI(messages, options = {}) {
    const config = AI_CONFIG.custom;
    if (!config.apiKey || !config.baseURL) {
        throw new Error('自定义API配置不完整');
    }
    
    const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: options.model || config.model,
            messages: messages,
            temperature: options.temperature || config.temperature,
            max_tokens: options.maxTokens || config.maxTokens
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`API错误: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 通用AI调用函数（带用户权限检查）
async function callAI(messages, options = {}) {
    // 检查是否启用AI
    if (AI_CONFIG.provider === 'none') {
        return null;
    }
    
    // 检查缓存（缓存响应不消耗查询次数，优先返回）
    const cacheKey = generateCacheKey(messages, options);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
        return cached;
    }
    
    // 检查用户登录和剩余查询次数（仅在需要调用API时检查）
    if (typeof window !== 'undefined' && window.authSystem) {
        if (!window.authSystem.isUserLoggedIn()) {
            throw new Error('AI_QUERY_REQUIRES_LOGIN');
        }
        
        if (!window.authSystem.canUseAIInquiry()) {
            throw new Error('AI_QUERY_LIMIT_EXCEEDED');
        }
    }
    
    try {
        let response;
        
        switch (AI_CONFIG.provider) {
            case 'openai':
                response = await callOpenAI(messages, options);
                break;
            case 'anthropic':
                response = await callAnthropic(messages, options);
                break;
            case 'deepseek':
                response = await callDeepSeek(messages, options);
                break;
            case 'custom':
                response = await callCustomAPI(messages, options);
                break;
            default:
                return null;
        }
        
        // 使用一次AI查询（仅在成功调用API后）
        if (typeof window !== 'undefined' && window.authSystem && response) {
            const inquiryResult = window.authSystem.useAIInquiry();
            if (!inquiryResult.success) {
                // 这种情况理论上不应该发生（因为前面已经检查过），但作为安全措施
                console.warn('AI查询次数已用完');
                return null;
            }
        }
        
        // 保存到缓存
        if (response) {
            setCachedResponse(cacheKey, response);
        }
        
        return response;
    } catch (error) {
        console.error('AI API调用失败:', error);
        // 返回null，让系统回退到规则匹配
        return null;
    }
}

// 生成个性化配方推荐 (AI增强版)
async function generateAIFormulaRecommendations(questionnaireData, ruleBasedFormulas) {
    if (!questionnaireData || AI_CONFIG.provider === 'none') {
        return null;
    }
    
    // 构建症状描述
    const symptoms = [];
    if (questionnaireData.circulation && questionnaireData.circulation.length > 0) {
        const circ = questionnaireData.circulation.filter(s => s !== 'none');
        if (circ.length > 0) symptoms.push(`循环系统: ${circ.join('、')}`);
    }
    if (questionnaireData.sleep && questionnaireData.sleep.length > 0) {
        const sleep = questionnaireData.sleep.filter(s => s !== 'none');
        if (sleep.length > 0) symptoms.push(`睡眠问题: ${sleep.join('、')}`);
    }
    if (questionnaireData.digestive && questionnaireData.digestive.length > 0) {
        const dig = questionnaireData.digestive.filter(s => s !== 'none');
        if (dig.length > 0) symptoms.push(`消化系统: ${dig.join('、')}`);
    }
    if (questionnaireData.gynecological && questionnaireData.gynecological.length > 0) {
        const gyn = questionnaireData.gynecological.filter(s => s !== 'none');
        if (gyn.length > 0) symptoms.push(`妇科问题: ${gyn.join('、')}`);
    }
    if (questionnaireData.constitution && questionnaireData.constitution.length > 0) {
        const consti = questionnaireData.constitution.filter(s => s !== 'none');
        if (consti.length > 0) symptoms.push(`体质: ${consti.join('、')}`);
    }
    if (questionnaireData.other && questionnaireData.other.length > 0) {
        const other = questionnaireData.other.filter(s => s !== 'none');
        if (other.length > 0) symptoms.push(`其他症状: ${other.join('、')}`);
    }
    
    const systemPrompt = `你是一位专业的芳疗师，擅长根据用户的健康状况推荐个性化的精油配方。

可用配方列表:
${ruleBasedFormulas.map(f => `- ${f.name}: ${f.subtitle}`).join('\n')}

请根据用户的症状和健康状况，推荐最合适的3-5个配方，并提供详细的推荐理由。推荐理由应该:
1. 解释为什么这个配方适合用户的具体症状
2. 说明配方如何改善用户的健康状况
3. 提供使用建议和注意事项

用中文回答，语气专业但友好。`;

    const userPrompt = `用户信息:
- 性别: ${questionnaireData.gender === 'female' ? '女性' : '男性'}
- 年龄: ${questionnaireData.age || '未填写'}
- 孕期状态: ${questionnaireData.pregnancy === 'yes' ? '怀孕' : questionnaireData.pregnancy === 'nursing' ? '哺乳期' : '否'}
- 症状: ${symptoms.join('\n')}
- 特殊注意事项: ${(questionnaireData.caution || []).filter(c => c !== 'none').join('、') || '无'}

请推荐最适合的配方，并说明推荐理由。`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];
    
    return await callAI(messages);
}

// 生成AI增强的建议文本
async function generateAISuggestionText(questionnaireData, formula) {
    if (!questionnaireData || !formula || AI_CONFIG.provider === 'none') {
        return null;
    }
    
    const symptoms = [];
    if (questionnaireData.circulation && questionnaireData.circulation.includes('cold-feet')) {
        symptoms.push('手脚冰凉');
    }
    if (questionnaireData.sleep && questionnaireData.sleep.includes('poor')) {
        symptoms.push('睡眠质量差');
    }
    if (questionnaireData.digestive && questionnaireData.digestive.includes('burp')) {
        symptoms.push('打嗝');
    }
    if (questionnaireData.digestive && questionnaireData.digestive.includes('bloating')) {
        symptoms.push('腹胀');
    }
    
    const systemPrompt = `你是一位专业的芳疗师。请用简洁、专业但友好的语言，解释为什么这个配方适合用户。

配方信息:
- 名称: ${formula.name}
- 说明: ${formula.subtitle}
- 作用原理: ${formula.principle}

用户症状: ${symptoms.join('、') || '未明确'}

请用1-2句话说明推荐理由，语气要专业但温暖。`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请生成推荐理由。' }
    ];
    
    return await callAI(messages, { maxTokens: 150 });
}

// 生成带时间线的综合使用场景建议
async function generateScenarioSuggestions(questionnaireData) {
    if (!questionnaireData || AI_CONFIG.provider === 'none') {
        return null;
    }
    
    // 获取用户选择的使用方式
    const usageTypes = questionnaireData.usage || [];
    if (usageTypes.length === 0) {
        return null;
    }
    
    // 获取香味偏好
    const fragranceTypes = questionnaireData.fragrance || [];
    
    // 构建症状描述
    const symptoms = [];
    if (questionnaireData.circulation && questionnaireData.circulation.length > 0) {
        const circ = questionnaireData.circulation.filter(s => s !== 'none');
        if (circ.length > 0) symptoms.push(`循环系统: ${circ.join('、')}`);
    }
    if (questionnaireData.sleep && questionnaireData.sleep.length > 0) {
        const sleep = questionnaireData.sleep.filter(s => s !== 'none');
        if (sleep.length > 0) symptoms.push(`睡眠问题: ${sleep.join('、')}`);
    }
    if (questionnaireData.digestive && questionnaireData.digestive.length > 0) {
        const dig = questionnaireData.digestive.filter(s => s !== 'none');
        if (dig.length > 0) symptoms.push(`消化系统: ${dig.join('、')}`);
    }
    if (questionnaireData.gynecological && questionnaireData.gynecological.length > 0) {
        const gyn = questionnaireData.gynecological.filter(s => s !== 'none');
        if (gyn.length > 0) symptoms.push(`妇科问题: ${gyn.join('、')}`);
    }
    if (questionnaireData.constitution && questionnaireData.constitution.length > 0) {
        const consti = questionnaireData.constitution.filter(s => s !== 'none');
        if (consti.length > 0) symptoms.push(`体质: ${consti.join('、')}`);
    }
    if (questionnaireData.other && questionnaireData.other.length > 0) {
        const other = questionnaireData.other.filter(s => s !== 'none');
        if (other.length > 0) symptoms.push(`其他症状: ${other.join('、')}`);
    }
    
    // 使用方式映射
    const usageMap = {
        'handcream': '护手霜',
        'bodylotion': '身体乳',
        'footbath': '泡脚/泡澡',
        'diffuser': '扩香',
        'spray': '喷雾'
    };
    
    // 香味类别映射
    const fragranceMap = {
        'floral': '花香类',
        'citrus': '柑橘类',
        'woody': '木质类',
        'herbal': '草本类',
        'spicy': '辛香类'
    };
    
    // 获取可用配方列表（从FORMULA_DATABASE）
    let availableFormulas = [];
    if (typeof FORMULA_DATABASE !== 'undefined' && FORMULA_DATABASE && Object.keys(FORMULA_DATABASE).length > 0) {
        availableFormulas = Object.values(FORMULA_DATABASE).map(formula => {
            if (!formula || !formula.id) return null;
            
            // 提取精油名称
            const oils = [];
            if (formula.ingredients && Array.isArray(formula.ingredients)) {
                formula.ingredients.forEach(ing => {
                    if (ing && ing.name && ing.name.includes('精油')) {
                        const oilName = ing.name.replace('精油', '').trim();
                        if (oilName && !oils.includes(oilName)) {
                            oils.push(oilName);
                        }
                    }
                });
            }
            
            // 确定使用方式
            let usageType = '';
            const name = formula.name || '';
            const subtitle = formula.subtitle || '';
            
            if (name.includes('护手霜') || subtitle.includes('护手霜')) {
                usageType = 'handcream';
            } else if (name.includes('身体乳') || subtitle.includes('身体乳')) {
                usageType = 'bodylotion';
            } else if (name.includes('泡脚') || name.includes('泡澡') || subtitle.includes('泡脚') || subtitle.includes('泡澡')) {
                usageType = 'footbath';
            } else if (name.includes('扩香') || subtitle.includes('扩香')) {
                usageType = 'diffuser';
            } else if (name.includes('喷雾') || subtitle.includes('喷雾')) {
                usageType = 'spray';
            }
            
            return {
                id: formula.id,
                name: name,
                subtitle: subtitle,
                usageType: usageType,
                oils: oils,
                matches: formula.matches || []
            };
        }).filter(f => f && f.usageType && usageTypes.includes(f.usageType));
    } else {
        console.warn('FORMULA_DATABASE is not available');
    }
    
    // 检查是否有可用配方
    if (availableFormulas.length === 0) {
        console.error('No available formulas found for selected usage types:', usageTypes);
        return null;
    }
    
    // 按使用方式分组配方
    const formulasByUsage = {};
    usageTypes.forEach(usage => {
        formulasByUsage[usage] = availableFormulas.filter(f => f.usageType === usage);
    });
    
    // 检查每个使用方式是否至少有一个配方
    const emptyUsageTypes = usageTypes.filter(usage => !formulasByUsage[usage] || formulasByUsage[usage].length === 0);
    if (emptyUsageTypes.length > 0) {
        console.warn('No formulas found for usage types:', emptyUsageTypes);
    }
    
    const systemPrompt = `你是一位专业的芳疗师，擅长制定个性化的精油使用方案。

请根据用户的健康状况、使用方式偏好和香味偏好，生成2个不同的综合使用场景建议。

每个场景建议需要包含：
1. 场景名称和简要描述
2. 一天的时间线（从早晨到晚上，包含具体时间点）
3. 每个时间点使用的配方（每种使用方式最多推荐1-2个配方）
4. 每个配方的简要说明（为什么在这个时间点使用）

重要要求：
- 根据用户选择的使用方式（${usageTypes.map(u => usageMap[u] || u).join('、')}）来设计场景
- **每种使用方式在每个场景的每个时间点最多只能推荐1-2个最匹配的配方**（这是硬性要求）
- 如果某个时间点需要使用某种使用方式，只能从该使用方式的配方中选择1-2个最匹配的
- 考虑用户的香味偏好（${fragranceTypes.length > 0 ? fragranceTypes.map(f => fragranceMap[f] || f).join('、') : '无特定偏好'}）
- 时间线要合理，符合日常生活节奏
- 配方要针对用户的具体症状和需求
- 只能使用以下可用配方列表中的配方ID

可用配方列表（按使用方式分类）：
${Object.keys(formulasByUsage).map(usage => {
    const formulas = formulasByUsage[usage];
    if (formulas.length === 0) return '';
    return `${usageMap[usage]} (${usage}):\n${formulas.map(f => `  - ${f.id}: ${f.name} (${f.subtitle || ''}) [精油: ${f.oils.length > 0 ? f.oils.join('、') : '无'}]`).join('\n')}`;
}).filter(s => s).join('\n\n')}

${Object.keys(formulasByUsage).every(usage => formulasByUsage[usage].length === 0) ? '警告：没有找到匹配的配方，请检查用户选择的使用方式。' : ''}

请以JSON格式返回，格式如下：
{
  "scenarios": [
    {
      "name": "场景名称",
      "description": "场景描述",
      "timeline": [
      {
        "time": "时间点（如：07:00）",
        "title": "活动名称",
        "formulas": [
          {
            "formulaId": "配方ID（必须从可用配方列表中选择）",
            "usageType": "使用方式（handcream/bodylotion/footbath/diffuser/spray）",
            "reason": "为什么在这个时间点使用这个配方"
          }
        ]
      }
    ]
    }
  ]
}

请确保：
1. 返回的是有效的JSON格式，不要包含任何markdown格式标记
2. 每个时间点的每种使用方式最多只推荐1-2个配方
3. 所有formulaId必须来自可用配方列表`;

    const userPrompt = `用户信息:
- 性别: ${questionnaireData.gender === 'female' ? '女性' : '男性'}
- 年龄: ${questionnaireData.age || '未填写'}
- 孕期状态: ${questionnaireData.pregnancy === 'yes' ? '怀孕' : questionnaireData.pregnancy === 'nursing' ? '哺乳期' : '否'}
- 症状: ${symptoms.join('\n') || '无明确症状'}
- 特殊注意事项: ${(questionnaireData.caution || []).filter(c => c !== 'none').join('、') || '无'}
- 选择的使用方式: ${usageTypes.map(u => usageMap[u] || u).join('、')}
- 香味偏好: ${fragranceTypes.length > 0 ? fragranceTypes.map(f => fragranceMap[f] || f).join('、') : '无特定偏好'}

请生成2个不同的综合使用场景建议。`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];
    
    try {
        const response = await callAI(messages, { maxTokens: 3000 });
        if (!response) {
            console.error('AI API returned empty response');
            return null;
        }
        
        // 尝试解析JSON响应
        let jsonResponse;
        try {
            // 移除可能的markdown代码块标记
            let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            // 移除可能的开头和结尾的空白字符
            cleanedResponse = cleanedResponse.replace(/^[\s\n]*/, '').replace(/[\s\n]*$/, '');
            
            jsonResponse = JSON.parse(cleanedResponse);
            
            // 验证响应格式
            if (!jsonResponse.scenarios || !Array.isArray(jsonResponse.scenarios)) {
                console.error('Invalid response format: missing scenarios array');
                console.log('Parsed response:', jsonResponse);
                return null;
            }
            
            if (jsonResponse.scenarios.length === 0) {
                console.warn('AI returned empty scenarios array');
                return null;
            }
            
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', e);
            console.log('Raw AI Response:', response);
            console.log('Response length:', response.length);
            // 尝试提取JSON部分
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    jsonResponse = JSON.parse(jsonMatch[0]);
                    if (jsonResponse.scenarios && Array.isArray(jsonResponse.scenarios)) {
                        return jsonResponse;
                    }
                } catch (e2) {
                    console.error('Failed to parse extracted JSON:', e2);
                }
            }
            return null;
        }
        
        return jsonResponse;
    } catch (error) {
        console.error('Error generating scenario suggestions:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            questionnaireData: {
                usage: questionnaireData.usage,
                hasSymptoms: symptoms.length > 0
            }
        });
        
        // 如果是特定的错误，抛出以便上层处理
        if (error.message === 'AI_QUERY_REQUIRES_LOGIN' || error.message === 'AI_QUERY_LIMIT_EXCEEDED') {
            throw error;
        }
        
        return null;
    }
}

// AI问答助手
async function askAIQuestion(question, context = {}) {
    if (AI_CONFIG.provider === 'none') {
        return 'AI功能未启用。请配置AI API Key以使用此功能。';
    }
    
    const systemPrompt = `你是一位专业的芳疗师助手，擅长回答关于精油配方、使用方法和健康调理的问题。

${context.questionnaireData ? `用户健康状况: ${JSON.stringify(context.questionnaireData)}` : ''}

请用专业但易懂的中文回答问题。如果问题涉及医疗建议，请提醒用户咨询专业医生。`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
    ];
    
    return await callAI(messages);
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AI_CONFIG,
        generateAIFormulaRecommendations,
        generateAISuggestionText,
        askAIQuestion,
        callAI
    };
}

