// 配方页面逻辑 - 显示个性化建议

// 渲染个性化建议（支持AI增强）
async function renderPersonalizedSuggestions() {
    const container = document.getElementById('personalizedSuggestions');
    if (!container) return;
    
    const questionnaireData = getQuestionnaireData();
    
    // 检查是否启用AI（检查AI_CONFIG是否存在且provider不为'none'）
    const useAI = typeof AI_CONFIG !== 'undefined' && AI_CONFIG.provider !== 'none';
    
    // 检查用户登录状态和AI查询权限
    let aiStatusMessage = '';
    if (useAI && typeof window !== 'undefined' && window.authSystem) {
        if (!window.authSystem.isUserLoggedIn()) {
            aiStatusMessage = `
                <div class="formula-box" style="background: #fff3cd; border: 2px solid #ffc107; margin-bottom: 20px;">
                    <h3 style="color: #856404; margin-top: 0;">AI功能需要登录</h3>
                    <p style="color: #856404;">注册即可获得<strong>3次免费AI智能推荐</strong>，享受个性化配方分析！</p>
                    <a href="login.html" class="btn btn-primary" style="text-decoration: none; display: inline-block; margin-top: 10px;">
                        立即注册/登录
                    </a>
                </div>
            `;
        } else {
            const userInfo = window.authSystem.getUserInfo();
            if (userInfo.canUseAI) {
                aiStatusMessage = `
                    <div class="formula-box" style="background: #d1ecf1; border: 2px solid #0c5460; margin-bottom: 20px;">
                        <p style="color: #0c5460; margin: 0;">
                            您还有 <strong>${userInfo.remainingInquiries}</strong> 次免费AI查询机会
                        </p>
                    </div>
                `;
            } else {
                aiStatusMessage = `
                    <div class="formula-box" style="background: #fff3cd; border: 2px solid #ffc107; margin-bottom: 20px;">
                        <h3 style="color: #856404; margin-top: 0;">AI查询次数已用完</h3>
                        <p style="color: #856404; margin-bottom: 15px;">您的免费AI查询次数已用完。购买更多次数以继续使用AI个性化建议功能。</p>
                        <a href="payment.html?type=ai&amount=${window.authSystem.AI_PURCHASE_AMOUNT}&price=${window.authSystem.AI_PURCHASE_PRICE}" 
                           class="btn btn-primary" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
                            购买10次AI查询（¥5）
                        </a>
                    </div>
                `;
            }
        }
    }
    
    // 使用同步版本作为默认（向后兼容）
    let suggestions;
    const canUseAI = useAI && typeof window !== 'undefined' && window.authSystem && 
                     window.authSystem.isUserLoggedIn() && window.authSystem.canUseAIInquiry();
    
    if (canUseAI && typeof generatePersonalizedSuggestions === 'function') {
        try {
            suggestions = await generatePersonalizedSuggestions(questionnaireData, true);
        } catch (error) {
            if (error.message === 'AI_QUERY_REQUIRES_LOGIN') {
                // 需要登录
            } else if (error.message === 'AI_QUERY_LIMIT_EXCEEDED') {
                // 次数用完
            }
            console.warn('AI推荐失败，使用规则匹配:', error);
            suggestions = generatePersonalizedSuggestionsSync(questionnaireData);
        }
    } else {
        suggestions = generatePersonalizedSuggestionsSync(questionnaireData);
    }
    
    if (!suggestions.hasData) {
        container.innerHTML = `
            <div class="formula-box" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                <h2 style="color: white; border: none; padding: 0; margin-top: 0;">个性化配方推荐</h2>
                <p style="font-size: 16px; margin-bottom: 20px; opacity: 0.95;">
                    ${suggestions.message}
                </p>
                <a href="${suggestions.link}" class="btn btn-primary" 
                   style="background: white; color: #667eea; text-decoration: none; display: inline-block;">
                    前往填写问卷
                </a>
            </div>
        `;
        return;
    }
    
    if (suggestions.formulas.length === 0) {
        container.innerHTML = `
            <div class="formula-box" style="background: #fff9e6; border: 2px solid var(--warning-color);">
                <h3 style="color: #f57c00; margin-top: 0;">暂无特别推荐</h3>
                <p>根据您填写的问卷，建议查看下方所有配方，选择适合您的方案。</p>
            </div>
        `;
        return;
    }
    
    // 显示主要症状
    let symptomsText = '';
    if (suggestions.mainSymptoms.length > 0) {
        symptomsText = `<p style="font-size: 14px; opacity: 0.9; margin-bottom: 20px;">
            <strong>主要关注:</strong> ${suggestions.mainSymptoms.join('、')}
        </p>`;
    }
    
    // 生成建议HTML
    let formulasHTML = '';
    for (let index = 0; index < suggestions.formulas.length; index++) {
        const formula = suggestions.formulas[index];
        let aiSuggestion = '';
        
        // 尝试使用AI生成建议文本
        if (useAI && typeof generateAISuggestionTextAsync === 'function') {
            try {
                aiSuggestion = await generateAISuggestionTextAsync(questionnaireData, formula, true) || '';
            } catch (error) {
                console.warn('AI生成建议文本失败:', error);
                aiSuggestion = generateAISuggestionTextSync(questionnaireData, formula);
            }
        } else {
            aiSuggestion = generateAISuggestionTextSync(questionnaireData, formula);
        }
        
        formulasHTML += `
            <div class="formula-box" ${isRecommended ? 'style="border: 3px solid var(--accent-color); box-shadow: var(--shadow-hover);"' : ''}>
                ${isRecommended ? '<div style="background: var(--accent-color); color: white; padding: 8px 15px; border-radius: 4px; display: inline-block; margin-bottom: 15px; font-size: 12px; font-weight: 600;">⭐ 最推荐</div>' : ''}
                <div class="formula-title">${formula.name}</div>
                <div class="formula-subtitle">${formula.subtitle}</div>
                
                ${aiSuggestion ? `<div style="background: rgba(102, 126, 234, 0.1); padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid var(--accent-color);">
                    <strong>推荐理由:</strong> ${aiSuggestion}
                </div>` : ''}
                
                <h4>配方组成</h4>
                <ul class="ingredient-list">
                    ${formula.ingredients.map(ing => 
                        `<li><span>${ing.name}</span><span>${ing.amount}</span></li>`
                    ).join('')}
                </ul>
                
                <div class="usage-box">
                    <strong>使用方法:</strong> ${formula.usage}
                </div>
                
                <div class="usage-box">
                    <strong>作用原理:</strong> ${formula.principle}
                </div>
                
                <div style="margin-top: 15px; padding: 12px; background-color: #fff; border-left: 3px solid #666; border-radius: 2px;">
                    ${formula.concentration ? `<strong>配方浓度:</strong> ${formula.concentration}<br>` : ''}
                    <strong>${formula.dailyAmount ? '日均精油量' : '说明'}:</strong> ${formula.dailyAmount || '请参考详细说明'}
                </div>
            </div>
        `;
    }
    
    // 添加AI推荐说明（如果有）
    let aiRecommendationText = '';
    if (suggestions.aiRecommendation) {
        aiRecommendationText = `
            <div class="formula-box" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; margin-bottom: 20px;">
                <h3 style="color: white; border: none; padding: 0; margin-top: 0;">🤖 AI智能分析</h3>
                <p style="font-size: 14px; opacity: 0.95; white-space: pre-wrap;">${suggestions.aiRecommendation}</p>
            </div>
        `;
    }
    
    container.innerHTML = `
        ${aiStatusMessage}
        <div class="formula-box" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; margin-bottom: 30px;">
            <h2 style="color: white; border: none; padding: 0; margin-top: 0;">为您推荐的个性化配方</h2>
            ${symptomsText}
            <p style="font-size: 14px; opacity: 0.9;">
                基于您的健康状况问卷，我们为您推荐以下${suggestions.formulas.length}个最适合的配方
            </p>
        </div>
        ${aiRecommendationText}
        ${formulasHTML}
        <div style="text-align: center; margin: 30px 0;">
            <a href="health-profile.html" class="btn btn-primary" style="text-decoration: none; display: inline-block;">
                更新问卷数据
            </a>
        </div>
        <hr style="margin: 40px 0; border: none; border-top: 2px solid var(--border-color);">
        <h2 style="margin-top: 50px;">所有可用配方</h2>
        <p style="color: var(--secondary-color); margin-bottom: 30px;">以下是完整的配方库，您可以根据需要选择使用</p>
    `;
}

// 使用方式映射
const USAGE_TYPE_MAP = {
    'handcream': '护手霜',
    'bodylotion': '身体乳',
    'footbath': '泡脚/泡澡',
    'diffuser': '扩香',
    'spray': '喷雾'
};

// 提取配方中的精油名称
function extractOils(formula) {
    if (!formula || !formula.ingredients) return [];
    const oils = [];
    formula.ingredients.forEach(ing => {
        if (ing.name && ing.name.includes('精油')) {
            const oilName = ing.name.replace('精油', '').trim();
            if (oilName && !oils.includes(oilName)) {
                oils.push(oilName);
            }
        }
    });
    return oils;
}

// 渲染场景建议中的配方卡片（只显示精油tag）
function renderScenarioFormulaCard(formulaData, formula) {
    if (!formula) {
        console.warn('Formula not found:', formulaData.formulaId);
        return '';
    }
    
    const oils = extractOils(formula);
    if (oils.length === 0) return ''; // 如果没有精油，不显示
    
    const usageType = USAGE_TYPE_MAP[formulaData.usageType] || formulaData.usageType;
    
    return `
        <a href="formula-detail.html?id=${formula.id}" class="formula-card" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%); border: 2px solid rgba(102, 126, 234, 0.2); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease; text-decoration: none; color: inherit; display: block; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="font-size: 16px; font-weight: 600; color: var(--primary-color); flex: 1;">${formula.name}</div>
                <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: var(--accent-gradient); color: white; margin-left: 10px;">${usageType}</span>
            </div>
            ${formulaData.reason ? `<div style="font-size: 13px; color: var(--secondary-color); line-height: 1.6; margin-bottom: 12px;">${formulaData.reason}</div>` : ''}
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${oils.map(oil => `<a href="oil-detail.html?oil=${encodeURIComponent(oil)}" onclick="event.stopPropagation();" style="background: white; color: var(--accent-color); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; border: 1px solid var(--accent-color); text-decoration: none; display: inline-block; transition: all 0.2s ease;">${oil}</a>`).join('')}
            </div>
        </a>
    `;
}

// 渲染时间线项
function renderTimelineItem(item) {
    if (!item.formulas || item.formulas.length === 0) return '';
    
    const formulasHTML = item.formulas.map(formulaData => {
        const formula = typeof FORMULA_DATABASE !== 'undefined' ? FORMULA_DATABASE[formulaData.formulaId] : null;
        return renderScenarioFormulaCard(formulaData, formula);
    }).filter(html => html).join('');
    
    if (!formulasHTML) return '';
    
    return `
        <div style="position: relative; margin-bottom: 30px; padding-left: 30px;">
            <div style="position: absolute; left: -25px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: var(--accent-gradient); border: 3px solid white; box-shadow: 0 0 0 2px var(--accent-color);"></div>
            <div style="font-size: 18px; font-weight: 600; color: var(--accent-color); margin-bottom: 8px;">${item.time}</div>
            <div style="font-size: 16px; font-weight: 500; color: var(--primary-color); margin-bottom: 15px;">${item.title}</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 15px;">
                ${formulasHTML}
            </div>
        </div>
    `;
}

// 渲染场景
function renderScenario(scenario, index) {
    if (!scenario.timeline || scenario.timeline.length === 0) return '';
    
    const timelineHTML = scenario.timeline.map(renderTimelineItem).filter(html => html).join('');
    
    if (!timelineHTML) return '';
    
    return `
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: var(--shadow); margin-bottom: 40px;">
            <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid var(--accent-color);">
                <h2 style="font-size: 28px; font-weight: 600; color: var(--primary-color); margin-bottom: 10px;">场景 ${index + 1}: ${scenario.name}</h2>
                <p style="font-size: 16px; color: var(--secondary-color); line-height: 1.8;">${scenario.description || ''}</p>
            </div>
            <div style="position: relative; padding-left: 40px; margin: 30px 0;">
                <div style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: var(--accent-gradient);"></div>
                ${timelineHTML}
            </div>
        </div>
    `;
}

// 渲染场景建议
async function renderScenarioSuggestions() {
    const container = document.getElementById('personalizedSuggestions');
    if (!container) return;
    
    const questionnaireData = getQuestionnaireData();
    if (!questionnaireData) {
        return; // 如果没有问卷数据，不显示场景建议
    }
    
    // 检查是否选择了使用方式
    if (!questionnaireData.usage || questionnaireData.usage.length === 0) {
        return; // 如果没有选择使用方式，不显示场景建议
    }
    
    // 检查AI是否可用
    const useAI = typeof AI_CONFIG !== 'undefined' && AI_CONFIG.provider !== 'none';
    if (!useAI || typeof generateScenarioSuggestions === 'undefined') {
        return; // AI不可用，不显示场景建议
    }
    
    // 检查用户登录状态和AI权限
    let canUseAI = true;
    let aiStatusMessage = '';
    
    // 检查 authSystem 是否可用
    const authSystem = typeof window !== 'undefined' && window.authSystem ? window.authSystem : null;
    
    if (authSystem) {
        if (!authSystem.isUserLoggedIn()) {
            // 未登录用户提示
            aiStatusMessage = `
                <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <p style="color: #856404; margin: 0;">
                        登录后可获得AI智能场景建议，享受个性化使用方案！
                        <a href="login.html" style="color: var(--accent-color); text-decoration: underline; margin-left: 10px;">立即登录</a>
                    </p>
                </div>
            `;
            canUseAI = false;
        } else if (!authSystem.canUseAIInquiry()) {
            // AI查询次数已用完
            aiStatusMessage = `
                <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <p style="color: #856404; margin: 0;">
                        AI查询次数已用完。
                        <a href="payment.html?type=ai&amount=${authSystem.AI_PURCHASE_AMOUNT}&price=${authSystem.AI_PURCHASE_PRICE}" 
                           style="color: var(--accent-color); text-decoration: underline; margin-left: 10px;">购买更多次数</a>
                    </p>
                </div>
            `;
            canUseAI = false;
        }
    } else {
        // authSystem 不可用，假设需要登录
        aiStatusMessage = `
            <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <p style="color: #856404; margin: 0;">
                    登录后可获得AI智能场景建议，享受个性化使用方案！
                    <a href="login.html" style="color: var(--accent-color); text-decoration: underline; margin-left: 10px;">立即登录</a>
                </p>
            </div>
        `;
        canUseAI = false;
    }
    
    try {
        // 调用AI生成场景建议（只有在 canUseAI 为 true 时才调用）
        let scenarios = null;
        let errorMessage = '';
        
        if (!canUseAI) {
            // 如果无法使用AI，直接显示提示信息
            if (aiStatusMessage) {
                const scenarioSection = `
                    <div style="margin-bottom: 40px;">
                        <h2 style="font-size: 28px; font-weight: 600; color: var(--primary-color); margin-bottom: 15px; border: none; padding: 0;">综合使用场景建议</h2>
                        <p style="color: var(--secondary-color); margin-bottom: 30px; font-size: 16px;">基于您的健康状况和使用偏好，为您定制的一日使用方案</p>
                        ${aiStatusMessage}
                    </div>
                    <hr style="margin: 40px 0; border: none; border-top: 2px solid var(--border-color);">
                `;
                if (container.innerHTML) {
                    container.innerHTML = scenarioSection + container.innerHTML;
                } else {
                    container.innerHTML = scenarioSection;
                }
            }
            return; // 提前返回，不调用AI
        }
        
        // 只有在 canUseAI 为 true 时才调用AI
        try {
            scenarios = await generateScenarioSuggestions(questionnaireData);
        } catch (error) {
            console.error('Error in generateScenarioSuggestions:', error);
            if (error.message === 'AI_QUERY_REQUIRES_LOGIN') {
                errorMessage = '需要登录才能使用AI功能';
                canUseAI = false;
                // 更新提示信息
                aiStatusMessage = `
                    <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <p style="color: #856404; margin: 0;">
                            登录后可获得AI智能场景建议，享受个性化使用方案！
                            <a href="login.html" style="color: var(--accent-color); text-decoration: underline; margin-left: 10px;">立即登录</a>
                        </p>
                    </div>
                `;
            } else if (error.message === 'AI_QUERY_LIMIT_EXCEEDED') {
                errorMessage = 'AI查询次数已用完';
                canUseAI = false;
                // 更新提示信息
                if (authSystem) {
                    aiStatusMessage = `
                        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                            <p style="color: #856404; margin: 0;">
                                AI查询次数已用完。
                                <a href="payment.html?type=ai&amount=${authSystem.AI_PURCHASE_AMOUNT}&price=${authSystem.AI_PURCHASE_PRICE}" 
                                   style="color: var(--accent-color); text-decoration: underline; margin-left: 10px;">购买更多次数</a>
                            </p>
                        </div>
                    `;
                }
            } else {
                errorMessage = '生成场景建议时出错：' + (error.message || '未知错误');
            }
        }
        
        if (!scenarios || !scenarios.scenarios || scenarios.scenarios.length === 0) {
            // 显示错误信息或提示
            let displayMessage = aiStatusMessage;
            if (errorMessage) {
                displayMessage = `
                    <div style="background: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <p style="color: #721c24; margin: 0;">
                            ❌ ${errorMessage}
                        </p>
                        ${errorMessage.includes('登录') ? `<a href="login.html" style="color: var(--accent-color); text-decoration: underline; margin-left: 10px;">立即登录</a>` : ''}
                        ${errorMessage.includes('次数已用完') ? `<a href="payment.html?type=ai&amount=${window.authSystem?.AI_PURCHASE_AMOUNT || 10}&price=${window.authSystem?.AI_PURCHASE_PRICE || 5}" style="color: var(--accent-color); text-decoration: underline; margin-left: 10px;">购买更多次数</a>` : ''}
                    </div>
                `;
            } else if (!canUseAI && !aiStatusMessage) {
                displayMessage = `
                    <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <p style="color: #856404; margin: 0;">
                            无法生成场景建议。请检查是否已填写问卷并选择了使用方式。
                        </p>
                    </div>
                `;
            }
            
            if (displayMessage) {
                // 显示提示信息
                const scenarioSection = `
                    <div style="margin-bottom: 40px;">
                        <h2 style="font-size: 28px; font-weight: 600; color: var(--primary-color); margin-bottom: 15px; border: none; padding: 0;">综合使用场景建议</h2>
                        <p style="color: var(--secondary-color); margin-bottom: 30px; font-size: 16px;">基于您的健康状况和使用偏好，为您定制的一日使用方案</p>
                        ${displayMessage}
                    </div>
                    <hr style="margin: 40px 0; border: none; border-top: 2px solid var(--border-color);">
                `;
                if (container.innerHTML) {
                    container.innerHTML = scenarioSection + container.innerHTML;
                } else {
                    container.innerHTML = scenarioSection;
                }
            }
            return; // 没有生成场景建议
        }
        
        // 渲染场景建议
        const scenariosHTML = scenarios.scenarios.map((scenario, index) => 
            renderScenario(scenario, index)
        ).filter(html => html).join('');
        
        if (!scenariosHTML) return;
        
        // 在个性化建议区域前面插入场景建议
        const scenarioSection = `
            <div style="margin-bottom: 40px;">
                <h2 style="font-size: 28px; font-weight: 600; color: var(--primary-color); margin-bottom: 15px; border: none; padding: 0;">综合使用场景建议</h2>
                <p style="color: var(--secondary-color); margin-bottom: 30px; font-size: 16px;">基于您的健康状况和使用偏好，为您定制的一日使用方案</p>
                ${aiStatusMessage}
                ${scenariosHTML}
            </div>
            <hr style="margin: 40px 0; border: none; border-top: 2px solid var(--border-color);">
        `;
        
        // 如果container已经有内容，在开头插入场景建议
        if (container.innerHTML) {
            container.innerHTML = scenarioSection + container.innerHTML;
        } else {
            container.innerHTML = scenarioSection;
        }
    } catch (error) {
        console.error('Error rendering scenario suggestions:', error);
        // 出错时不显示场景建议，但不影响其他内容
    }
}

// 页面加载时渲染建议
document.addEventListener('DOMContentLoaded', async function() {
    // 先渲染场景建议（如果可用）
    await renderScenarioSuggestions();
    // 然后渲染个性化建议
    renderPersonalizedSuggestions();
});

