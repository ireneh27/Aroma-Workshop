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
                <div class="formula-card-name">${formula.name || '未命名配方'}</div>
                <span class="usage-type-badge">${usageType}</span>
            </div>
            ${formulaData.reason ? `<div class="formula-card-reason">${formulaData.reason}</div>` : ''}
            ${oils.length > 0 ? `
                <div class="formula-card-tags">
                    ${oils.map(oil => `<a href="oil-detail.html?oil=${encodeURIComponent(oil)}" onclick="event.stopPropagation();" class="oil-tag">${oil}</a>`).join('')}
                </div>
            ` : ''}
        </a>
    `;
}

// 渲染时间轴节点（中间的时间轴）
function renderTimelineNode(item) {
    if (!item || !item.time) {
        return '';
    }
    
    return `
        <div class="timeline-node">
            <div class="timeline-node-content">
                <div class="timeline-node-time">${item.time || ''}</div>
                <div class="timeline-node-title">${item.title || ''}</div>
            </div>
        </div>
    `;
}

// 渲染场景侧边的配方（左侧或右侧）
function renderScenarioSideFormulas(timelineItems, scenarioIndex) {
    if (!timelineItems || timelineItems.length === 0) {
        return '';
    }
    
    const formulasHTML = timelineItems.map(item => {
        if (!item || !item.formulas || !Array.isArray(item.formulas) || item.formulas.length === 0) {
            return '';
        }
        
        if (typeof FORMULA_DATABASE === 'undefined' || !FORMULA_DATABASE) {
            return '';
        }
        
        const itemFormulasHTML = item.formulas
            .filter(formulaData => formulaData && formulaData.formulaId)
            .map(formulaData => {
                const formula = FORMULA_DATABASE[formulaData.formulaId];
                if (!formula) {
                    return '';
                }
                return renderFormulaCard(formulaData, formula);
            })
            .filter(html => html)
            .join('');
        
        if (!itemFormulasHTML) {
            return '';
        }
        
        return `
            <div class="timeline-formulas-container">
                ${itemFormulasHTML}
            </div>
        `;
    }).filter(html => html).join('');
    
    return formulasHTML;
}

// 渲染场景侧边（包含标题和配方）
function renderScenarioSide(scenario, index, timelineItems) {
    if (!scenario) {
        return '';
    }
    
    const formulasHTML = renderScenarioSideFormulas(timelineItems, index);
    
    if (!formulasHTML) {
        return '';
    }
    
    return `
        <div class="scenario-side">
            <div class="scenario-side-header">
                <h2 class="scenario-side-title">场景 ${index + 1}: ${scenario.name || '未命名场景'}</h2>
                <p class="scenario-side-description">${scenario.description || ''}</p>
            </div>
            ${formulasHTML}
        </div>
    `;
}

// 合并两个场景的时间线，提取所有时间点
function mergeTimelines(scenarios) {
    if (!scenarios || scenarios.length === 0) {
        return [];
    }
    
    // 收集所有时间点
    const timeMap = new Map();
    
    scenarios.forEach((scenario, scenarioIndex) => {
        if (!scenario.timeline || !Array.isArray(scenario.timeline)) {
            return;
        }
        
        scenario.timeline.forEach(item => {
            if (!item || !item.time) {
                return;
            }
            
            const timeKey = item.time;
            if (!timeMap.has(timeKey)) {
                timeMap.set(timeKey, {
                    time: item.time,
                    title: item.title || '',
                    scenarios: []
                });
            }
            
            // 保存该时间点对应的场景索引和配方
            timeMap.get(timeKey).scenarios[scenarioIndex] = item.formulas || [];
        });
    });
    
    // 转换为数组并按时间排序
    return Array.from(timeMap.values()).sort((a, b) => {
        // 简单的时间比较（假设格式为 HH:MM）
        const timeA = a.time.replace(':', '');
        const timeB = b.time.replace(':', '');
        return timeA.localeCompare(timeB);
    });
}

// 渲染所有场景
function renderScenarios(scenarios) {
    const container = document.getElementById('scenariosContainer');
    if (!container) {
        console.error('scenariosContainer not found');
        return;
    }
    
    console.log('Rendering scenarios:', scenarios);
    
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
    
    // 检查FORMULA_DATABASE是否可用
    if (typeof FORMULA_DATABASE === 'undefined' || !FORMULA_DATABASE || Object.keys(FORMULA_DATABASE).length === 0) {
        console.error('FORMULA_DATABASE is not available');
        container.innerHTML = `
            <div class="error-state">
                <h3>数据加载错误</h3>
                <p>配方数据库未加载，请刷新页面重试。</p>
            </div>
        `;
        return;
    }
    
    // 计算并显示每日用量安全评估（每个场景分别计算，平行显示）
    let safetyAssessmentHTML = '';
    if (typeof DailyUsageValidator !== 'undefined') {
        try {
            safetyAssessmentHTML = DailyUsageValidator.generateMultipleSafetyAssessmentsHTML(scenarios);
        } catch (e) {
            console.error('Error generating safety assessment:', e);
        }
    }
    
    // 合并时间线，提取所有时间点
    const mergedTimeline = mergeTimelines(scenarios.scenarios);
    
    if (mergedTimeline.length === 0) {
        console.error('No timeline items found');
        container.innerHTML = safetyAssessmentHTML + `
            <div class="error-state">
                <h3>场景渲染失败</h3>
                <p>无法提取时间线数据，请检查场景数据格式。</p>
            </div>
        `;
        return;
    }
    
    // 渲染中间时间轴
    const timelineHTML = mergedTimeline.map(item => renderTimelineNode(item)).join('');
    const centralTimelineHTML = `
        <div class="central-timeline">
            ${timelineHTML}
        </div>
    `;
    
    // 渲染左右两侧的场景
    const leftScenarioHTML = scenarios.scenarios[0] 
        ? renderScenarioSide(scenarios.scenarios[0], 0, mergedTimeline.map(item => ({
            time: item.time,
            title: item.title,
            formulas: item.scenarios[0] || []
        })))
        : '';
    
    const rightScenarioHTML = scenarios.scenarios[1]
        ? renderScenarioSide(scenarios.scenarios[1], 1, mergedTimeline.map(item => ({
            time: item.time,
            title: item.title,
            formulas: item.scenarios[1] || []
        })))
        : '';
    
    // 如果场景渲染失败，显示错误信息
    if (!leftScenarioHTML && !rightScenarioHTML) {
        console.error('All scenarios failed to render');
        container.innerHTML = safetyAssessmentHTML + `
            <div class="error-state">
                <h3>场景渲染失败</h3>
                <p>无法渲染场景内容，可能是配方数据缺失。请检查控制台获取详细信息。</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    场景数量: ${scenarios.scenarios.length}<br>
                    配方数据库大小: ${Object.keys(FORMULA_DATABASE).length}
                </p>
            </div>
        `;
        return;
    }
    
    // 组合布局：左侧场景 | 中间时间轴 | 右侧场景
    const scenariosLayoutHTML = `
        <div class="scenarios-layout">
            ${leftScenarioHTML || '<div class="scenario-side"><div class="scenario-side-header"><p>场景1数据缺失</p></div></div>'}
            ${centralTimelineHTML}
            ${rightScenarioHTML || '<div class="scenario-side"><div class="scenario-side-header"><p>场景2数据缺失</p></div></div>'}
        </div>
    `;
    
    container.innerHTML = safetyAssessmentHTML + scenariosLayoutHTML;
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
        console.log('Calling generateScenarioSuggestions with data:', questionnaireData);
        const scenarios = await generateScenarioSuggestions(questionnaireData);
        
        console.log('Received scenarios:', scenarios);
        
        if (!scenarios) {
            console.error('generateScenarioSuggestions returned null or undefined');
            showError('AI生成场景建议失败，请稍后重试。请检查AI配置和网络连接。');
            return;
        }
        
        if (!scenarios.scenarios || scenarios.scenarios.length === 0) {
            console.error('Scenarios array is empty');
            showError('AI返回的场景数据为空，请稍后重试。');
            return;
        }
        
        // 渲染场景
        renderScenarios(scenarios);
    } catch (error) {
        console.error('Error loading scenario suggestions:', error);
        console.error('Error stack:', error.stack);
        
        let errorMessage = '生成场景建议时出错：' + error.message;
        
        // 处理特定错误
        if (error.message === 'AI_QUERY_REQUIRES_LOGIN') {
            errorMessage = '需要登录才能使用AI功能，请先登录。';
        } else if (error.message === 'AI_QUERY_LIMIT_EXCEEDED') {
            errorMessage = 'AI查询次数已用完，请购买更多次数。';
        }
        
        showError(errorMessage);
    }
}

// 等待依赖加载完成
function waitForDependencies(callback, maxWaitTime = 10000) {
    const startTime = Date.now();
    const checkInterval = 100;
    
    const checkDependencies = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // 检查必要的依赖
        const dependenciesReady = 
            typeof FORMULA_DATABASE !== 'undefined' && 
            FORMULA_DATABASE && 
            Object.keys(FORMULA_DATABASE).length > 0 &&
            typeof getQuestionnaireData !== 'undefined' &&
            typeof generateScenarioSuggestions !== 'undefined';
        
        if (dependenciesReady) {
            clearInterval(checkDependencies);
            console.log('All dependencies loaded, starting scenario suggestions');
            callback();
        } else if (elapsed >= maxWaitTime) {
            clearInterval(checkDependencies);
            console.error('Dependencies not loaded after', maxWaitTime, 'ms');
            console.error('FORMULA_DATABASE:', typeof FORMULA_DATABASE !== 'undefined' ? `loaded (${Object.keys(FORMULA_DATABASE || {}).length} items)` : 'not loaded');
            console.error('getQuestionnaireData:', typeof getQuestionnaireData !== 'undefined' ? 'loaded' : 'not loaded');
            console.error('generateScenarioSuggestions:', typeof generateScenarioSuggestions !== 'undefined' ? 'loaded' : 'not loaded');
            
            const container = document.getElementById('scenariosContainer');
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <h3>依赖加载失败</h3>
                        <p>页面依赖未完全加载，请刷新页面重试。</p>
                        <p style="font-size: 12px; color: #666; margin-top: 10px;">
                            FORMULA_DATABASE: ${typeof FORMULA_DATABASE !== 'undefined' ? '已加载' : '未加载'}<br>
                            getQuestionnaireData: ${typeof getQuestionnaireData !== 'undefined' ? '已加载' : '未加载'}<br>
                            generateScenarioSuggestions: ${typeof generateScenarioSuggestions !== 'undefined' ? '已加载' : '未加载'}
                        </p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 15px; padding: 10px 20px; border: none; border-radius: 6px; background: var(--accent-gradient); color: white; cursor: pointer;">
                            刷新页面
                        </button>
                    </div>
                `;
            }
        }
    }, checkInterval);
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded, waiting for dependencies...');
    waitForDependencies(loadScenarioSuggestions);
});

