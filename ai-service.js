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

// 验证场景响应数据质量
function validateScenarioResponse(response, availableFormulas, usageTypes) {
    const errors = [];
    const warnings = [];
    let severity = 'warning'; // 'warning' or 'error'
    
    if (!response || !response.scenarios) {
        return { valid: false, errors: ['响应中缺少scenarios字段'], severity: 'error' };
    }
    
    if (!Array.isArray(response.scenarios)) {
        return { valid: false, errors: ['scenarios必须是数组'], severity: 'error' };
    }
    
    if (response.scenarios.length === 0) {
        return { valid: false, errors: ['scenarios数组为空'], severity: 'error' };
    }
    
    if (response.scenarios.length < 2) {
        warnings.push('只生成了1个场景，建议生成2个不同的场景');
    }
    
    // 创建可用配方ID集合
    const availableFormulaIds = new Set(availableFormulas.map(f => f.id));
    
    // 验证每个场景
    response.scenarios.forEach((scenario, scenarioIndex) => {
        if (!scenario.name || !scenario.description) {
            warnings.push(`场景${scenarioIndex + 1}缺少名称或描述`);
        }
        
        if (!scenario.timeline || !Array.isArray(scenario.timeline)) {
            errors.push(`场景${scenarioIndex + 1}缺少timeline或timeline不是数组`);
            severity = 'error';
            return;
        }
        
        if (scenario.timeline.length === 0) {
            errors.push(`场景${scenarioIndex + 1}的timeline为空`);
            severity = 'error';
            return;
        }
        
        if (scenario.timeline.length < 3) {
            warnings.push(`场景${scenarioIndex + 1}的时间点过少（少于3个）`);
        }
        
        // 验证时间线中的每个时间点
        scenario.timeline.forEach((item, itemIndex) => {
            if (!item.time || !/^\d{2}:\d{2}$/.test(item.time)) {
                errors.push(`场景${scenarioIndex + 1}的时间点${itemIndex + 1}的时间格式不正确（应为HH:MM格式）`);
                severity = 'error';
            }
            
            if (!item.formulas || !Array.isArray(item.formulas)) {
                errors.push(`场景${scenarioIndex + 1}的时间点${itemIndex + 1}缺少formulas或formulas不是数组`);
                severity = 'error';
                return;
            }
            
            // 按使用方式分组，检查每种使用方式的配方数量
            const formulasByUsage = {};
            item.formulas.forEach((formula, formulaIndex) => {
                if (!formula.formulaId) {
                    errors.push(`场景${scenarioIndex + 1}的时间点${itemIndex + 1}的配方${formulaIndex + 1}缺少formulaId`);
                    severity = 'error';
                    return;
                }
                
                // 检查配方ID是否在可用列表中
                if (!availableFormulaIds.has(formula.formulaId)) {
                    errors.push(`场景${scenarioIndex + 1}的时间点${itemIndex + 1}使用了不存在的配方ID: ${formula.formulaId}`);
                    severity = 'error';
                    return;
                }
                
                if (!formula.usageType) {
                    errors.push(`场景${scenarioIndex + 1}的时间点${itemIndex + 1}的配方${formulaIndex + 1}缺少usageType`);
                    severity = 'error';
                    return;
                }
                
                if (!usageTypes.includes(formula.usageType)) {
                    warnings.push(`场景${scenarioIndex + 1}的时间点${itemIndex + 1}使用了未选择的使用方式: ${formula.usageType}`);
                }
                
                // 统计每种使用方式的配方数量
                if (!formulasByUsage[formula.usageType]) {
                    formulasByUsage[formula.usageType] = 0;
                }
                formulasByUsage[formula.usageType]++;
            });
            
            // 检查每种使用方式的配方数量是否超过限制
            Object.keys(formulasByUsage).forEach(usageType => {
                if (formulasByUsage[usageType] > 2) {
                    warnings.push(`场景${scenarioIndex + 1}的时间点${itemIndex + 1}的${usageType}使用方式推荐了${formulasByUsage[usageType]}个配方，建议最多2个`);
                }
            });
        });
    });
    
    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        severity: severity
    };
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
            
            // 提取精油名称（改进：支持更多格式）
            const oils = [];
            if (formula.ingredients && Array.isArray(formula.ingredients)) {
                formula.ingredients.forEach(ing => {
                    if (ing && ing.name) {
                        // 匹配各种精油名称格式
                        const oilNameMatch = ing.name.match(/([^精油]+)精油/);
                        if (oilNameMatch) {
                            const oilName = oilNameMatch[1].trim();
                            if (oilName && !oils.includes(oilName)) {
                                oils.push(oilName);
                            }
                        }
                    }
                });
            }
            
            // 确定使用方式（改进：更准确的匹配）
            let usageType = '';
            const name = (formula.name || '').toLowerCase();
            const subtitle = (formula.subtitle || '').toLowerCase();
            const combinedText = name + ' ' + subtitle;
            
            // 优先级匹配：先匹配更具体的，再匹配通用的
            if (combinedText.includes('护手霜') || combinedText.includes('handcream')) {
                usageType = 'handcream';
            } else if (combinedText.includes('身体乳') || combinedText.includes('bodylotion')) {
                usageType = 'bodylotion';
            } else if (combinedText.includes('泡脚') || combinedText.includes('泡澡') || 
                      combinedText.includes('footbath') || combinedText.includes('bath')) {
                usageType = 'footbath';
            } else if (combinedText.includes('扩香') || combinedText.includes('diffuser')) {
                usageType = 'diffuser';
            } else if (combinedText.includes('喷雾') || combinedText.includes('spray')) {
                usageType = 'spray';
            }
            
            // 如果没有匹配到使用方式，跳过该配方
            if (!usageType) {
                return null;
            }
            
            // 检查是否匹配用户选择的使用方式
            if (!usageTypes.includes(usageType)) {
                return null;
            }
            
            return {
                id: formula.id,
                name: formula.name || '',
                subtitle: formula.subtitle || '',
                usageType: usageType,
                oils: oils,
                matches: formula.matches || [],
                formula: formula // 保留完整配方对象供后续使用
            };
        }).filter(f => f !== null);
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
    
    const systemPrompt = `你是一位专业的芳疗师，擅长制定个性化的精油使用方案。你需要根据用户的健康状况、使用方式偏好和香味偏好，生成2个不同的综合使用场景建议。

## 核心要求

### 场景设计原则
1. **场景差异化**：两个场景应该有不同的侧重点和适用场景（例如：工作日场景 vs 周末场景，或 日常保养场景 vs 特殊调理场景）
2. **时间线合理性**：时间点应符合日常生活节奏，从早晨（07:00-09:00）到晚上（19:00-22:00），时间间隔合理
3. **配方匹配度**：优先推荐与用户症状最匹配的配方，考虑配方的功效和适用时间

### 配方选择规则（严格遵循）
- **每个时间点的每种使用方式最多只能推荐1-2个配方**（这是硬性要求，不可违反）
- 如果某个时间点需要使用某种使用方式，只能从该使用方式的可用配方列表中选择
- 优先选择与用户症状匹配度高的配方（参考配方的matches字段）
- 考虑用户的香味偏好，但症状匹配度优先于香味偏好
- 所有formulaId必须严格来自可用配方列表，不能自行编造

### 时间点设计建议
- **早晨（07:00-09:00）**：适合提神、醒脑、提升专注力的配方
- **上午（09:00-12:00）**：适合工作时段使用的配方，如护手霜、扩香
- **中午（12:00-14:00）**：适合餐后消化调理的配方
- **下午（14:00-18:00）**：适合缓解疲劳、提升精力的配方
- **晚上（18:00-22:00）**：适合放松、助眠、温阳的配方，如泡脚、身体乳

### 安全考虑
- 避免在同一时间点推荐过多配方导致每日用量超标
- 考虑孕期、哺乳期等特殊状态，避免使用不安全的配方
- 注意高血压、癫痫等特殊注意事项

## 可用配方列表（按使用方式分类）

${Object.keys(formulasByUsage).map(usage => {
    const formulas = formulasByUsage[usage];
    if (formulas.length === 0) return '';
    return `### ${usageMap[usage]} (${usage})
${formulas.map(f => {
    const matchesStr = f.matches && f.matches.length > 0 ? `[适用症状: ${f.matches.join('、')}]` : '';
    return `- **${f.id}**: ${f.name}${f.subtitle ? ` - ${f.subtitle}` : ''} ${matchesStr} [精油: ${f.oils.length > 0 ? f.oils.join('、') : '无'}]`;
}).join('\n')}`;
}).filter(s => s).join('\n\n')}

${Object.keys(formulasByUsage).every(usage => formulasByUsage[usage].length === 0) ? '⚠️ **警告**：没有找到匹配的配方，请检查用户选择的使用方式。' : ''}

## 输出格式要求

请以**纯JSON格式**返回，不要包含任何markdown代码块标记（如\`\`\`json）。格式如下：

{
  "scenarios": [
    {
      "name": "场景名称（简洁明了，如：工作日提神方案）",
      "description": "场景描述（1-2句话说明该场景的适用情况和特点）",
      "timeline": [
        {
          "time": "时间点（格式：HH:MM，如：07:00）",
          "title": "活动名称（如：起床后、工作时段、餐后、睡前等）",
          "formulas": [
            {
              "formulaId": "配方ID（必须严格从可用配方列表中选择）",
              "usageType": "使用方式（必须是：handcream/bodylotion/footbath/diffuser/spray之一）",
              "reason": "使用理由（1-2句话说明为什么在这个时间点使用这个配方，要结合用户症状）"
            }
          ]
        }
      ]
    }
  ]
}

## 输出检查清单
- [ ] 返回的是纯JSON格式，无markdown标记
- [ ] 生成了2个不同的场景
- [ ] 每个场景有3-8个时间点
- [ ] 每个时间点的每种使用方式最多1-2个配方
- [ ] 所有formulaId都来自可用配方列表
- [ ] 所有usageType都是有效的使用方式
- [ ] 时间点按时间顺序排列
- [ ] 配方选择考虑了用户症状和偏好`;

    // 构建更详细的用户信息
    const userInfo = {
        gender: questionnaireData.gender === 'female' ? '女性' : '男性',
        age: questionnaireData.age || '未填写',
        pregnancy: questionnaireData.pregnancy === 'yes' ? '怀孕' : 
                   questionnaireData.pregnancy === 'nursing' ? '哺乳期' : '否',
        symptoms: symptoms.length > 0 ? symptoms.join('\n') : '无明确症状',
        cautions: (questionnaireData.caution || []).filter(c => c !== 'none').join('、') || '无',
        usageTypes: usageTypes.map(u => usageMap[u] || u).join('、'),
        fragrance: fragranceTypes.length > 0 ? fragranceTypes.map(f => fragranceMap[f] || f).join('、') : '无特定偏好'
    };
    
    const userPrompt = `## 用户信息

**基本信息**
- 性别: ${userInfo.gender}
- 年龄: ${userInfo.age}
- 孕期状态: ${userInfo.pregnancy}

**健康状况**
${userInfo.symptoms}

**特殊注意事项**
${userInfo.cautions}

**使用偏好**
- 选择的使用方式: ${userInfo.usageTypes}
- 香味偏好: ${userInfo.fragrance}

## 任务要求

请根据以上信息，生成**2个不同的综合使用场景建议**。要求：
1. 两个场景要有明显的差异化（例如：工作日 vs 周末，或 日常保养 vs 特殊调理）
2. 每个场景包含完整的一天时间线（从早晨到晚上）
3. 每个时间点推荐1-2个最匹配的配方
4. 配方选择要优先考虑症状匹配度，其次考虑香味偏好
5. 时间安排要符合日常生活节奏

请开始生成场景建议。`;

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
            
            // 验证场景数据质量
            const validationResult = validateScenarioResponse(jsonResponse, availableFormulas, usageTypes);
            if (!validationResult.valid) {
                console.warn('Scenario validation failed:', validationResult.errors);
                // 如果只是警告级别的问题，仍然返回数据但记录警告
                if (validationResult.severity === 'error') {
                    return null;
                }
            }
            
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', e);
            console.log('Raw AI Response:', response);
            console.log('Response length:', response.length);
            // 尝试提取JSON部分（更智能的提取）
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    jsonResponse = JSON.parse(jsonMatch[0]);
                    if (jsonResponse.scenarios && Array.isArray(jsonResponse.scenarios)) {
                        // 验证提取的JSON
                        const validationResult = validateScenarioResponse(jsonResponse, availableFormulas, usageTypes);
                        if (!validationResult.valid && validationResult.severity === 'error') {
                            return null;
                        }
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

