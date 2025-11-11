// 场景建议页面逻辑

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

// 渲染配方卡片
function renderFormulaCard(formulaData, formula) {
    if (!formula) {
        console.warn('Formula not found:', formulaData.formulaId);
        return '';
    }
    
    const oils = extractOils(formula);
    const usageType = USAGE_TYPE_MAP[formulaData.usageType] || formulaData.usageType;
    
    return `
        <a href="formula-detail.html?id=${formula.id}" class="formula-card">
            <div class="formula-card-header">
                <div class="formula-card-name">${formula.name}</div>
                <span class="usage-type-badge">${usageType}</span>
            </div>
            ${formulaData.reason ? `<div class="formula-card-reason">${formulaData.reason}</div>` : ''}
            ${oils.length > 0 ? `
                <div class="formula-card-tags">
                    ${oils.map(oil => `<a href="oil-detail.html?oil=${encodeURIComponent(oil)}" onclick="event.stopPropagation();" class="oil-tag" style="text-decoration: none; display: inline-block;">${oil}</a>`).join('')}
                </div>
            ` : ''}
        </a>
    `;
}

// 渲染时间线项
function renderTimelineItem(item) {
    const formulasHTML = item.formulas.map(formulaData => {
        const formula = FORMULA_DATABASE[formulaData.formulaId];
        return renderFormulaCard(formulaData, formula);
    }).filter(html => html).join('');
    
    if (!formulasHTML) return '';
    
    return `
        <div class="timeline-item">
            <div class="timeline-time">${item.time}</div>
            <div class="timeline-title">${item.title}</div>
            <div class="formula-cards-container">
                ${formulasHTML}
            </div>
        </div>
    `;
}

// 渲染场景
function renderScenario(scenario, index) {
    const timelineHTML = scenario.timeline.map(renderTimelineItem).filter(html => html).join('');
    
    if (!timelineHTML) return '';
    
    return `
        <div class="scenario-card">
            <div class="scenario-header">
                <h2 class="scenario-title">场景 ${index + 1}: ${scenario.name}</h2>
                <p class="scenario-description">${scenario.description || ''}</p>
            </div>
            <div class="timeline">
                ${timelineHTML}
            </div>
        </div>
    `;
}

// 渲染所有场景
function renderScenarios(scenarios) {
    const container = document.getElementById('scenariosContainer');
    if (!container) return;
    
    if (!scenarios || !scenarios.scenarios || scenarios.scenarios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>暂无场景建议</h3>
                <p>请先完成健康状况问卷并选择使用方式。</p>
                <a href="health-profile.html" class="btn btn-primary" style="margin-top: 20px; text-decoration: none; display: inline-block;">
                    前往填写问卷
                </a>
            </div>
        `;
        return;
    }
    
    const scenariosHTML = scenarios.scenarios.map((scenario, index) => 
        renderScenario(scenario, index)
    ).filter(html => html).join('');
    
    // 计算并显示每日用量安全评估
    let safetyAssessmentHTML = '';
    if (typeof DailyUsageValidator !== 'undefined') {
        const usageData = DailyUsageValidator.calculateTotalDailyUsage(scenarios);
        safetyAssessmentHTML = DailyUsageValidator.generateSafetyAssessmentHTML(usageData);
    }
    
    container.innerHTML = safetyAssessmentHTML + scenariosHTML;
}

// 显示错误状态
function showError(message) {
    const container = document.getElementById('scenariosContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-state">
            <h3>生成场景建议时出错</h3>
            <p>${message}</p>
            <a href="health-profile.html" class="btn btn-primary" style="margin-top: 20px; text-decoration: none; display: inline-block;">
                返回问卷
            </a>
        </div>
    `;
}

// 显示加载状态
function showLoading() {
    const container = document.getElementById('scenariosContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在为您生成个性化场景建议...</p>
        </div>
    `;
}

// 主函数：加载并渲染场景建议
async function loadScenarioSuggestions() {
    showLoading();
    
    // 获取问卷数据
    const questionnaireData = getQuestionnaireData();
    if (!questionnaireData) {
        showError('请先完成健康状况问卷');
        return;
    }
    
    // 检查是否选择了使用方式
    if (!questionnaireData.usage || questionnaireData.usage.length === 0) {
        showError('请至少选择一种使用方式');
        return;
    }
    
    // 检查AI是否可用
    if (typeof generateScenarioSuggestions === 'undefined') {
        showError('AI功能未启用，无法生成场景建议');
        return;
    }
    
    // 检查用户登录状态和AI权限（如果已登录）
    if (typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn()) {
        if (!window.authSystem.canUseAIInquiry()) {
            const container = document.getElementById('scenariosContainer');
            if (container) {
                container.innerHTML = `
                    <div class="error-state" style="background: #fff3cd; border-color: #ffc107;">
                        <h3>AI查询次数已用完</h3>
                        <p>您的免费AI查询次数已用完。购买更多次数以继续使用AI个性化建议功能。</p>
                        <div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="window.location.href='payment.html?type=ai&amount=${window.authSystem.AI_PURCHASE_AMOUNT}&price=${window.authSystem.AI_PURCHASE_PRICE}'" 
                                    class="btn btn-primary" 
                                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block;">
                                购买10次AI查询（¥5）
                            </button>
                            <a href="formulas.html" class="btn" style="background: transparent; color: var(--accent-color); border: 2px solid var(--accent-color); padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                                查看其他推荐
                            </a>
                        </div>
                    </div>
                `;
            }
            return;
        }
    } else {
        // 未登录用户也可以尝试使用AI（如果AI配置允许）
        // 但会提示登录以获得更好的体验
        const loginPrompt = document.createElement('div');
        loginPrompt.className = 'error-state';
        loginPrompt.style.background = '#fff3cd';
        loginPrompt.style.borderColor = '#ffc107';
        loginPrompt.innerHTML = `
            <h3>提示</h3>
            <p>您当前未登录。登录后可获得更好的AI个性化建议体验。</p>
            <a href="login.html" class="btn btn-primary" style="margin-top: 10px; text-decoration: none; display: inline-block;">
                立即登录
            </a>
        `;
        const container = document.getElementById('scenariosContainer');
        if (container) {
            container.insertBefore(loginPrompt, container.firstChild);
        }
    }
    
    try {
        // 调用AI生成场景建议
        const scenarios = await generateScenarioSuggestions(questionnaireData);
        
        if (!scenarios) {
            showError('AI生成场景建议失败，请稍后重试');
            return;
        }
        
        // 渲染场景
        renderScenarios(scenarios);
    } catch (error) {
        console.error('Error loading scenario suggestions:', error);
        showError('生成场景建议时出错：' + error.message);
    }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    loadScenarioSuggestions();
});

