// 场景建议页面逻辑

// 使用方式映射
const USAGE_TYPE_MAP = {
    'handcream': '护手霜',
    'bodylotion': '身体乳',
    'footbath': '泡脚/泡澡',
    'diffuser': '扩香',
    'spray': '喷雾'
};

// 生成降级场景建议（基于规则，不依赖AI）
function generateFallbackScenarios(questionnaireData) {
    console.log('generateFallbackScenarios called with:', questionnaireData);
    
    if (!questionnaireData) {
        console.error('generateFallbackScenarios: questionnaireData is null or undefined');
        return null;
    }
    
    if (typeof FORMULA_DATABASE === 'undefined' || !FORMULA_DATABASE) {
        console.error('generateFallbackScenarios: FORMULA_DATABASE is not available');
        return null;
    }
    
    const usageTypes = questionnaireData.usage || [];
    if (usageTypes.length === 0) {
        console.warn('generateFallbackScenarios: No usage types selected');
        return null;
    }
    
    // 使用规则匹配系统获取推荐配方
    if (typeof calculateFormulaScores === 'undefined') {
        console.error('generateFallbackScenarios: calculateFormulaScores function is not available');
        console.log('Available globals:', {
            FORMULA_DATABASE: typeof FORMULA_DATABASE !== 'undefined',
            getQuestionnaireData: typeof getQuestionnaireData !== 'undefined',
            calculateFormulaScores: typeof calculateFormulaScores !== 'undefined'
        });
        return null;
    }
    
    try {
        const scores = calculateFormulaScores(questionnaireData);
        console.log('calculateFormulaScores returned:', scores);
        
        const sortedFormulas = Object.entries(scores)
            .filter(([_, score]) => score > 0)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 10)
            .map(([formulaId]) => FORMULA_DATABASE[formulaId])
            .filter(f => f);
        
        console.log('sortedFormulas:', sortedFormulas.length, 'formulas found');
        
        if (sortedFormulas.length === 0) {
            console.warn('generateFallbackScenarios: No matching formulas found');
            return null;
        }
        
        // 按使用方式分组
        const formulasByUsage = {};
        sortedFormulas.forEach(formula => {
            const name = (formula.name || '').toLowerCase();
            const subtitle = (formula.subtitle || '').toLowerCase();
            const text = name + ' ' + subtitle;
            
            let usageType = '';
            if (text.includes('护手霜') || text.includes('handcream')) usageType = 'handcream';
            else if (text.includes('身体乳') || text.includes('bodylotion')) usageType = 'bodylotion';
            else if (text.includes('泡脚') || text.includes('泡澡') || text.includes('footbath')) usageType = 'footbath';
            else if (text.includes('扩香') || text.includes('diffuser')) usageType = 'diffuser';
            else if (text.includes('喷雾') || text.includes('spray')) usageType = 'spray';
            
            if (usageType && usageTypes.includes(usageType)) {
                if (!formulasByUsage[usageType]) {
                    formulasByUsage[usageType] = [];
                }
                formulasByUsage[usageType].push(formula);
            }
        });
        
        // 生成两个简化场景
        const scenarios = [];
        
        // 场景1：工作日场景
        const scenario1 = {
            name: '工作日场景',
            description: '适合工作日使用的简化方案，重点改善工作压力和疲劳',
            timeline: []
        };
        
        // 添加早晨时间点
        if (formulasByUsage.handcream && formulasByUsage.handcream.length > 0) {
            scenario1.timeline.push({
                time: '08:00',
                title: '起床后',
                formulas: [{
                    formulaId: formulasByUsage.handcream[0].id,
                    usageType: 'handcream',
                    reason: '早晨使用，提神醒脑，缓解工作压力'
                }]
            });
        }
        
        // 添加工作时段
        if (formulasByUsage.diffuser && formulasByUsage.diffuser.length > 0) {
            scenario1.timeline.push({
                time: '10:00',
                title: '工作时段',
                formulas: [{
                    formulaId: formulasByUsage.diffuser[0].id,
                    usageType: 'diffuser',
                    reason: '工作时段扩香，提升专注力和工作效率'
                }]
            });
        }
        
        // 添加晚上时间点
        if (formulasByUsage.bodylotion && formulasByUsage.bodylotion.length > 0) {
            scenario1.timeline.push({
                time: '20:00',
                title: '睡前',
                formulas: [{
                    formulaId: formulasByUsage.bodylotion[0].id,
                    usageType: 'bodylotion',
                    reason: '睡前使用，放松身心，改善睡眠'
                }]
            });
        }
        
        if (scenario1.timeline.length > 0) {
            scenarios.push(scenario1);
        }
        
        // 场景2：休息日场景
        const scenario2 = {
            name: '休息日场景',
            description: '适合休息日使用的方案，重点调理和放松',
            timeline: []
        };
        
        // 添加早晨时间点
        if (formulasByUsage.bodylotion && formulasByUsage.bodylotion.length > 1) {
            scenario2.timeline.push({
                time: '09:00',
                title: '起床后',
                formulas: [{
                    formulaId: formulasByUsage.bodylotion[1].id,
                    usageType: 'bodylotion',
                    reason: '休息日早晨使用，全面调理身体'
                }]
            });
        }
        
        // 添加下午时间点
        if (formulasByUsage.footbath && formulasByUsage.footbath.length > 0) {
            scenario2.timeline.push({
                time: '19:00',
                title: '晚上',
                formulas: [{
                    formulaId: formulasByUsage.footbath[0].id,
                    usageType: 'footbath',
                    reason: '晚上泡脚，温阳散寒，促进循环'
                }]
            });
        }
        
        if (scenario2.timeline.length > 0) {
            scenarios.push(scenario2);
        }
        
        if (scenarios.length === 0) {
            console.warn('generateFallbackScenarios: No scenarios generated');
            return null;
        }
        
        console.log('generateFallbackScenarios: Generated', scenarios.length, 'scenarios');
        return { scenarios };
    } catch (error) {
        console.error('generateFallbackScenarios error:', error);
        return null;
    }
}

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

// 渲染配方卡片（支持选中功能）
function renderFormulaCard(formulaData, formula, time, scenarioIndex) {
    if (!formula) {
        console.warn('Formula not found:', formulaData.formulaId);
        return '';
    }
    
    const oils = extractOils(formula);
    const usageType = USAGE_TYPE_MAP[formulaData.usageType] || formulaData.usageType;
    
    // 获取介质类型
    let mediumType = 'base-oil';
    if (typeof DailyUsageValidator !== 'undefined') {
        mediumType = DailyUsageValidator.getFormulaMediumType(formula);
    }
    const mediumName = DailyUsageValidator ? DailyUsageValidator.getMediumName(mediumType) : usageType;
    
    const cardId = `formula-card-${scenarioIndex}-${String(formula.id)}-${time.replace(':', '-')}`;
    const formulaIdStr = String(formula.id);
    const timeEscaped = time.replace(/'/g, "\\'");
    const mediumTypeEscaped = mediumType.replace(/'/g, "\\'");
    
    return `
        <div class="formula-card" data-formula-id="${formulaIdStr}" data-scenario-index="${scenarioIndex}" data-time="${time}" data-medium-type="${mediumType}" id="${cardId}">
            <div class="formula-card-header">
                <div class="formula-card-name">${(formula.name || '未命名配方').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                <span class="usage-type-badge">${usageType}</span>
            </div>
            ${formulaData.reason ? `<div class="formula-card-reason">${(formulaData.reason || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
            ${oils.length > 0 ? `
                <div class="formula-card-tags">
                    ${oils.map(oil => `<a href="oil-detail.html?oil=${encodeURIComponent(oil)}" onclick="event.stopPropagation();" class="oil-tag">${oil.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a>`).join('')}
                </div>
            ` : ''}
            <div class="formula-card-actions" style="margin-top: 10px; display: flex; gap: 8px; align-items: center;">
                <button class="formula-select-btn" onclick="selectFormula('${formulaIdStr}', ${scenarioIndex}, '${timeEscaped}', '${mediumTypeEscaped}'); event.stopPropagation();" style="flex: 1; padding: 6px 12px; background: var(--accent-gradient); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">选择配方</button>
                <a href="formula-detail.html?id=${formulaIdStr}" class="formula-detail-link" onclick="event.stopPropagation();" style="padding: 6px 12px; background: white; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500;">详情</a>
            </div>
        </div>
    `;
}

// 渲染时间轴节点（中间的时间轴）
function renderTimelineNode(item, index) {
    if (!item || !item.time) {
        return '';
    }
    
    const timeEscaped = (item.time || '').replace(/:/g, '-');
    
    return `
        <div class="timeline-node" data-time="${item.time}" data-timeline-index="${index}">
            <div class="timeline-node-content">
                <div class="timeline-node-time">${item.time || ''}</div>
                <div class="timeline-node-title">${item.title || ''}</div>
            </div>
        </div>
    `;
}

// 渲染场景侧边的配方（左侧或右侧）- 按时间排序，同介质分组
function renderScenarioSideFormulas(timelineItems, scenarioIndex) {
    if (!timelineItems || timelineItems.length === 0) {
        return '';
    }
    
    if (typeof FORMULA_DATABASE === 'undefined' || !FORMULA_DATABASE) {
        return '';
    }
    
    // 收集所有配方，包含时间、介质类型等信息
    const allFormulas = [];
    timelineItems.forEach(item => {
        if (!item || !item.formulas || !Array.isArray(item.formulas) || item.formulas.length === 0) {
            return;
        }
        
        item.formulas.forEach(formulaData => {
            if (!formulaData || !formulaData.formulaId) return;
            
            const formula = FORMULA_DATABASE[formulaData.formulaId];
            if (!formula) return;
            
            // 获取介质类型
            let mediumType = 'base-oil';
            if (typeof DailyUsageValidator !== 'undefined') {
                mediumType = DailyUsageValidator.getFormulaMediumType(formula);
            }
            
            allFormulas.push({
                formulaData,
                formula,
                time: item.time || '00:00',
                timeOrder: parseInt((item.time || '00:00').replace(':', '')),
                mediumType,
                title: item.title || ''
            });
        });
    });
    
    if (allFormulas.length === 0) {
        return '';
    }
    
    // 按时间排序
    allFormulas.sort((a, b) => a.timeOrder - b.timeOrder);
    
    // 按时间分组，然后在每个时间段内按介质类型分组
    const formulasByTime = {};
    allFormulas.forEach(f => {
        if (!formulasByTime[f.time]) {
            formulasByTime[f.time] = {
                time: f.time,
                title: f.title,
                formulasByMedium: {}
            };
        }
        
        if (!formulasByTime[f.time].formulasByMedium[f.mediumType]) {
            formulasByTime[f.time].formulasByMedium[f.mediumType] = [];
        }
        
        formulasByTime[f.time].formulasByMedium[f.mediumType].push(f);
    });
    
    // 生成HTML
    const htmlParts = [];
    Object.keys(formulasByTime).sort((a, b) => {
        return parseInt(a.replace(':', '')) - parseInt(b.replace(':', ''));
    }).forEach(time => {
        const timeGroup = formulasByTime[time];
        const mediumGroups = [];
        
        // 按介质类型顺序排列（定义优先级）
        const mediumOrder = ['handcream', 'bodylotion', 'base-oil', 'footbath', 'spray', 'rosewater', 'rosewater-spray', 'diffuser', 'alcohol-spray'];
        
        mediumOrder.forEach(mediumType => {
            if (timeGroup.formulasByMedium[mediumType]) {
                mediumGroups.push({
                    mediumType,
                    formulas: timeGroup.formulasByMedium[mediumType]
                });
            }
        });
        
        // 添加其他未定义的介质类型
        Object.keys(timeGroup.formulasByMedium).forEach(mediumType => {
            if (!mediumOrder.includes(mediumType)) {
                mediumGroups.push({
                    mediumType,
                    formulas: timeGroup.formulasByMedium[mediumType]
                });
            }
        });
        
        // 为同一时间点的所有介质类型生成HTML
        const mediumGroupsHTML = mediumGroups.map(mediumGroup => {
            const mediumName = DailyUsageValidator ? DailyUsageValidator.getMediumName(mediumGroup.mediumType) : mediumGroup.mediumType;
            const formulasHTML = mediumGroup.formulas.map(f => 
                renderFormulaCard(f.formulaData, f.formula, f.time, scenarioIndex)
            ).join('');
            
            return `
                <div class="medium-group" style="margin-bottom: 15px;">
                    <div class="medium-label" style="font-size: 12px; font-weight: 600; color: var(--primary-color); margin-bottom: 8px; padding: 4px 10px; background: rgba(102, 126, 234, 0.08); border-radius: 6px; display: inline-block;">
                        ${mediumName}
                    </div>
                    <div class="formula-cards-container">
                        ${formulasHTML}
                    </div>
                </div>
            `;
        }).join('');
        
        // 同一时间点的所有配方放在同一个容器中
        htmlParts.push(`
            <div class="timeline-formulas-container" data-time="${time}">
                ${mediumGroupsHTML}
            </div>
        `);
    });
    
    return htmlParts.join('');
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
    
    // 收集所有配方标题用于底部标签
    const allFormulas = [];
    timelineItems.forEach(item => {
        if (!item || !item.formulas || !Array.isArray(item.formulas) || item.formulas.length === 0) {
            return;
        }
        item.formulas.forEach(formulaData => {
            if (!formulaData || !formulaData.formulaId) return;
            const formula = FORMULA_DATABASE[formulaData.formulaId];
            if (formula && formula.name) {
                if (!allFormulas.find(f => f.id === formula.id)) {
                    allFormulas.push(formula);
                }
            }
        });
    });
    
    const formulaTagsHTML = allFormulas.map(formula => 
        `<span class="formula-title-tag">${(formula.name || '未命名配方').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`
    ).join('');
    
    return `
        <div class="scenario-side" data-scenario-index="${index}">
            <div class="scenario-side-header">
                <h2 class="scenario-side-title">场景 ${index + 1}: ${scenario.name || '未命名场景'}</h2>
                <p class="scenario-side-description">${scenario.description || ''}</p>
            </div>
            ${formulasHTML}
            ${formulaTagsHTML ? `<div class="scenario-formula-tags">${formulaTagsHTML}</div>` : ''}
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

// 渲染所有场景（优化版：使用分批渲染，减少阻塞）
function renderScenarios(scenarios) {
    // 使用缓存的 DOM 查询
    const container = typeof window.DOMUtils !== 'undefined' 
        ? window.DOMUtils.getCachedElement('scenariosContainer')
        : document.getElementById('scenariosContainer');
    
    if (!container) {
        console.error('scenariosContainer not found');
        return;
    }
    
    console.log('Rendering scenarios:', scenarios);
    
    if (!scenarios || !scenarios.scenarios || scenarios.scenarios.length === 0) {
        if (typeof window.DOMUtils !== 'undefined') {
            window.DOMUtils.setHTML(container, `
                <div class="empty-state">
                    <h3>暂无场景建议</h3>
                    <p>请先完成健康状况问卷并选择使用方式。</p>
                    <a href="health-profile.html" class="btn btn-primary" style="margin-top: 20px; text-decoration: none; display: inline-block;">
                        前往填写问卷
                    </a>
                </div>
            `);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>暂无场景建议</h3>
                    <p>请先完成健康状况问卷并选择使用方式。</p>
                    <a href="health-profile.html" class="btn btn-primary" style="margin-top: 20px; text-decoration: none; display: inline-block;">
                        前往填写问卷
                    </a>
                </div>
            `;
        }
        return;
    }
    
    // 检查FORMULA_DATABASE是否可用
    if (typeof FORMULA_DATABASE === 'undefined' || !FORMULA_DATABASE || Object.keys(FORMULA_DATABASE).length === 0) {
        console.error('FORMULA_DATABASE is not available');
        if (typeof window.DOMUtils !== 'undefined') {
            window.DOMUtils.setHTML(container, `
                <div class="error-state">
                    <h3>数据加载错误</h3>
                    <p>配方数据库未加载，请刷新页面重试。</p>
                </div>
            `);
        } else {
            container.innerHTML = `
                <div class="error-state">
                    <h3>数据加载错误</h3>
                    <p>配方数据库未加载，请刷新页面重试。</p>
                </div>
            `;
        }
        return;
    }
    
    // 合并时间线，提取所有时间点
    const mergedTimeline = mergeTimelines(scenarios.scenarios);
    
    if (mergedTimeline.length === 0) {
        console.error('No timeline items found');
        if (typeof window.DOMUtils !== 'undefined') {
            window.DOMUtils.setHTML(container, `
                <div class="error-state">
                    <h3>场景渲染失败</h3>
                    <p>无法提取时间线数据，请检查场景数据格式。</p>
                </div>
            `);
        } else {
            container.innerHTML = `
                <div class="error-state">
                    <h3>场景渲染失败</h3>
                    <p>无法提取时间线数据，请检查场景数据格式。</p>
                </div>
            `;
        }
        return;
    }
    
    // 使用优化的 DOM 操作
    if (typeof window.DOMUtils !== 'undefined') {
        // 清空容器
        container.innerHTML = '';
        
        // 使用 createElement 创建布局容器
        const layoutDiv = window.DOMUtils.createElement('div', {
            className: 'scenarios-layout'
        });
        container.appendChild(layoutDiv);
        
        // 保存场景数据供时间轴点击使用
        window.scenarioData = scenarios;
        
        // 分批渲染：先渲染时间轴和基本结构
        renderTimelineFirst(mergedTimeline, layoutDiv, scenarios);
    } else {
        // 降级方案：使用原始方法
        container.innerHTML = '';
        const layoutDiv = document.createElement('div');
        layoutDiv.className = 'scenarios-layout';
        container.appendChild(layoutDiv);
        window.scenarioData = scenarios;
        renderTimelineFirst(mergedTimeline, layoutDiv, scenarios);
    }
}

// 渲染快速概览（优化版：使用 DocumentFragment）
function renderQuickOverview(scenarios) {
    const quickOverview = typeof window.DOMUtils !== 'undefined'
        ? window.DOMUtils.getCachedElement('quickOverview')
        : document.getElementById('quickOverview');
    const overviewContent = typeof window.DOMUtils !== 'undefined'
        ? window.DOMUtils.getCachedElement('overviewContent')
        : document.getElementById('overviewContent');
    
    if (!quickOverview || !overviewContent || !scenarios || !scenarios.scenarios) {
        return;
    }
    
    // 计算统计数据
    let totalFormulas = 0;
    let totalTimePoints = 0;
    const uniqueFormulas = new Set();
    const timePoints = new Set();
    
    scenarios.scenarios.forEach(scenario => {
        if (scenario.timeline && Array.isArray(scenario.timeline)) {
            scenario.timeline.forEach(item => {
                if (item.time) {
                    timePoints.add(item.time);
                }
                if (item.formulas && Array.isArray(item.formulas)) {
                    item.formulas.forEach(formulaData => {
                        if (formulaData.formulaId) {
                            uniqueFormulas.add(formulaData.formulaId);
                            totalFormulas++;
                        }
                    });
                }
            });
        }
    });
    
    totalTimePoints = timePoints.size;
    const uniqueFormulaCount = uniqueFormulas.size;
    
    // 使用优化的 DOM 操作
    if (typeof window.DOMUtils !== 'undefined') {
        // 使用 createElementsBatch 批量创建元素
        const overviewItems = [
            { tag: 'div', attributes: { className: 'overview-item' }, children: [
                { tag: 'div', attributes: { className: 'overview-value', textContent: scenarios.scenarios.length } },
                { tag: 'div', attributes: { className: 'overview-label', textContent: '场景数量' } }
            ]},
            { tag: 'div', attributes: { className: 'overview-item' }, children: [
                { tag: 'div', attributes: { className: 'overview-value', textContent: totalTimePoints } },
                { tag: 'div', attributes: { className: 'overview-label', textContent: '时间点' } }
            ]},
            { tag: 'div', attributes: { className: 'overview-item' }, children: [
                { tag: 'div', attributes: { className: 'overview-value', textContent: uniqueFormulaCount } },
                { tag: 'div', attributes: { className: 'overview-label', textContent: '配方种类' } }
            ]},
            { tag: 'div', attributes: { className: 'overview-item' }, children: [
                { tag: 'div', attributes: { className: 'overview-value', textContent: totalFormulas } },
                { tag: 'div', attributes: { className: 'overview-label', textContent: '配方总数' } }
            ]}
        ];
        
        const fragment = window.DOMUtils.createElementsBatch(overviewItems);
        overviewContent.innerHTML = '';
        overviewContent.appendChild(fragment);
    } else {
        // 降级方案：使用 innerHTML
        overviewContent.innerHTML = `
            <div class="overview-item">
                <div class="overview-value">${scenarios.scenarios.length}</div>
                <div class="overview-label">场景数量</div>
            </div>
            <div class="overview-item">
                <div class="overview-value">${totalTimePoints}</div>
                <div class="overview-label">时间点</div>
            </div>
            <div class="overview-item">
                <div class="overview-value">${uniqueFormulaCount}</div>
                <div class="overview-label">配方种类</div>
            </div>
            <div class="overview-item">
                <div class="overview-value">${totalFormulas}</div>
                <div class="overview-label">配方总数</div>
            </div>
        `;
    }
    
    // 显示快速概览
    quickOverview.style.display = 'block';
}

// 先渲染时间轴（快速显示，优化版）
function renderTimelineFirst(mergedTimeline, layoutDiv, scenarios) {
    // 渲染中间时间轴
    const timelineHTML = mergedTimeline.map((item, index) => renderTimelineNode(item, index)).join('');
    
    // 使用优化的 DOM 操作
    if (typeof window.DOMUtils !== 'undefined') {
        // 使用 createElement 创建元素
        const centralTimelineDiv = window.DOMUtils.createElement('div', {
            className: 'central-timeline',
            innerHTML: timelineHTML
        });
        
        // 创建左右两侧的占位容器
        const loadingHTML = '<div class="scenario-side-header"><div class="loading-spinner" style="width: 30px; height: 30px; margin: 20px auto;"></div><p style="text-align: center; color: var(--secondary-color);">加载中...</p></div>';
        const leftPlaceholder = window.DOMUtils.createElement('div', {
            className: 'scenario-side',
            innerHTML: loadingHTML
        });
        const rightPlaceholder = window.DOMUtils.createElement('div', {
            className: 'scenario-side',
            innerHTML: loadingHTML
        });
        
        // 使用 DocumentFragment 批量添加
        const fragment = document.createDocumentFragment();
        fragment.appendChild(leftPlaceholder);
        fragment.appendChild(centralTimelineDiv);
        fragment.appendChild(rightPlaceholder);
        layoutDiv.appendChild(fragment);
    } else {
        // 降级方案
        const centralTimelineDiv = document.createElement('div');
        centralTimelineDiv.className = 'central-timeline';
        centralTimelineDiv.innerHTML = timelineHTML;
        
        const leftPlaceholder = document.createElement('div');
        leftPlaceholder.className = 'scenario-side';
        leftPlaceholder.innerHTML = '<div class="scenario-side-header"><div class="loading-spinner" style="width: 30px; height: 30px; margin: 20px auto;"></div><p style="text-align: center; color: var(--secondary-color);">加载中...</p></div>';
        
        const rightPlaceholder = document.createElement('div');
        rightPlaceholder.className = 'scenario-side';
        rightPlaceholder.innerHTML = '<div class="scenario-side-header"><div class="loading-spinner" style="width: 30px; height: 30px; margin: 20px auto;"></div><p style="text-align: center; color: var(--secondary-color);">加载中...</p></div>';
        
        layoutDiv.appendChild(leftPlaceholder);
        layoutDiv.appendChild(centralTimelineDiv);
        layoutDiv.appendChild(rightPlaceholder);
    }
    
    // 初始化时间轴点击功能（不依赖场景内容）
    requestAnimationFrame(() => {
        initTimelineClick();
    });
    
    // 分批渲染场景内容
    requestAnimationFrame(() => {
        renderScenarioSides(layoutDiv, scenarios, mergedTimeline);
    });
}

// 渲染场景侧边（分批进行）
function renderScenarioSides(layoutDiv, scenarios, mergedTimeline) {
    // 渲染左侧场景
    const leftScenarioHTML = scenarios.scenarios[0] 
        ? renderScenarioSide(scenarios.scenarios[0], 0, mergedTimeline.map(item => ({
            time: item.time,
            title: item.title,
            formulas: item.scenarios[0] || []
        })))
        : '<div class="scenario-side"><div class="scenario-side-header"><p>场景1数据缺失</p></div></div>';
    
    // 先更新左侧
    const leftPlaceholder = layoutDiv.querySelector('.scenario-side:first-child');
    if (leftPlaceholder && leftScenarioHTML) {
        requestAnimationFrame(() => {
            // 使用临时容器解析HTML，然后替换
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = leftScenarioHTML;
            const newLeftSide = tempDiv.firstElementChild;
            if (newLeftSide) {
                leftPlaceholder.replaceWith(newLeftSide);
                
                // 渲染默认安全评估
                renderDefaultSafetyAssessment(0, newLeftSide);
            }
        });
    }
    
    // 然后渲染右侧场景
    requestAnimationFrame(() => {
        const rightScenarioHTML = scenarios.scenarios[1]
            ? renderScenarioSide(scenarios.scenarios[1], 1, mergedTimeline.map(item => ({
                time: item.time,
                title: item.title,
                formulas: item.scenarios[1] || []
            })))
            : '<div class="scenario-side"><div class="scenario-side-header"><p>场景2数据缺失</p></div></div>';
        
        const rightPlaceholder = layoutDiv.querySelector('.scenario-side:last-child');
        if (rightPlaceholder && rightScenarioHTML) {
            requestAnimationFrame(() => {
                // 使用临时容器解析HTML，然后替换
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = rightScenarioHTML;
                const newRightSide = tempDiv.firstElementChild;
                if (newRightSide) {
                    rightPlaceholder.replaceWith(newRightSide);
                    
                    // 渲染默认安全评估
                    renderDefaultSafetyAssessment(1, newRightSide);
                    
                    // 最后初始化选中配方功能
                    requestAnimationFrame(() => {
                        initFormulaSelection();
                    });
                }
            });
        }
    });
}

// 存储选中的配方
let selectedFormulas = {}; // { scenarioIndex: { formulaId: { formula, time, mediumType } } }

// 初始化配方选中功能
function initFormulaSelection() {
    // 清除之前的选中状态
    selectedFormulas = {};
    
    // 为每个场景创建安全验证容器
    const scenarioSides = document.querySelectorAll('.scenario-side');
    scenarioSides.forEach((side, index) => {
        // 检查是否已存在安全容器
        let safetyContainer = document.getElementById(`safety-container-${index}`);
        if (!safetyContainer) {
            safetyContainer = document.createElement('div');
            safetyContainer.className = 'selected-formulas-safety';
            safetyContainer.id = `safety-container-${index}`;
            safetyContainer.style.cssText = 'margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 12px; display: none;';
            side.appendChild(safetyContainer);
        }
        
        // 默认显示场景的整体安全评估（即使没有选择配方）
        renderDefaultSafetyAssessment(index, side);
    });
}

// 渲染默认安全评估（显示整个场景的安全评估）
function renderDefaultSafetyAssessment(scenarioIndex, sideElement) {
    if (typeof DailyUsageValidator === 'undefined' || !window.scenarioData) {
        return;
    }
    
    const scenario = window.scenarioData.scenarios[scenarioIndex];
    if (!scenario || !scenario.timeline) {
        return;
    }
    
    try {
        const usageData = DailyUsageValidator.calculateScenarioDailyUsage(scenario);
        const safetyHTML = DailyUsageValidator.generateSafetyAssessmentCard(usageData, scenarioIndex);
        
        // 在场景标题下方插入默认安全评估
        const header = sideElement.querySelector('.scenario-side-header');
        if (header) {
            // 检查是否已存在默认安全评估
            let defaultSafety = sideElement.querySelector('.default-safety-assessment');
            if (!defaultSafety) {
                defaultSafety = document.createElement('div');
                defaultSafety.className = 'default-safety-assessment';
                defaultSafety.style.cssText = 'margin-top: 15px; padding: 15px; background: rgba(102, 126, 234, 0.05); border-radius: 8px; border-left: 3px solid var(--accent-color);';
                defaultSafety.innerHTML = `
                    <h4 style="font-size: 14px; font-weight: 600; color: var(--primary-color); margin-bottom: 10px;">📊 场景安全评估</h4>
                    ${safetyHTML}
                `;
                header.insertAdjacentElement('afterend', defaultSafety);
            }
        }
    } catch (e) {
        console.error('Error rendering default safety assessment:', e);
    }
}

// 选中配方（全局函数，供HTML调用）
window.selectFormula = function(formulaId, scenarioIndex, time, mediumType) {
    if (!FORMULA_DATABASE || !FORMULA_DATABASE[formulaId]) {
        console.error('Formula not found:', formulaId);
        return;
    }
    
    const formula = FORMULA_DATABASE[formulaId];
    
    // 初始化场景的选中列表
    if (!selectedFormulas[scenarioIndex]) {
        selectedFormulas[scenarioIndex] = {};
    }
    
    // 切换选中状态
    if (selectedFormulas[scenarioIndex][formulaId]) {
        // 取消选中
        delete selectedFormulas[scenarioIndex][formulaId];
        updateFormulaCardState(formulaId, scenarioIndex, false);
    } else {
        // 选中
        selectedFormulas[scenarioIndex][formulaId] = {
            formula,
            time,
            mediumType
        };
        updateFormulaCardState(formulaId, scenarioIndex, true);
    }
    
    // 更新安全验证显示
    updateSafetyValidation(scenarioIndex);
}

// 更新配方卡片状态
function updateFormulaCardState(formulaId, scenarioIndex, isSelected) {
    const card = document.querySelector(`.formula-card[data-formula-id="${formulaId}"][data-scenario-index="${scenarioIndex}"]`);
    if (!card) return;
    
    const selectBtn = card.querySelector('.formula-select-btn');
    if (!selectBtn) return;
    
    if (isSelected) {
        card.style.border = '3px solid var(--accent-color)';
        card.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)';
        selectBtn.textContent = '已选中';
        selectBtn.style.background = '#10b981';
    } else {
        card.style.border = '2px solid rgba(102, 126, 234, 0.2)';
        card.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)';
        selectBtn.textContent = '选择配方';
        selectBtn.style.background = 'var(--accent-gradient)';
    }
}

// 更新安全验证显示
function updateSafetyValidation(scenarioIndex) {
    const safetyContainer = document.getElementById(`safety-container-${scenarioIndex}`);
    if (!safetyContainer) return;
    
    const selected = selectedFormulas[scenarioIndex];
    if (!selected || Object.keys(selected).length === 0) {
        safetyContainer.style.display = 'none';
        return;
    }
    
    // 构建场景对象用于验证
    const scenario = {
        name: `场景 ${scenarioIndex + 1}`,
        timeline: []
    };
    
    // 按时间分组选中的配方
    const formulasByTime = {};
    Object.values(selected).forEach(item => {
        if (!formulasByTime[item.time]) {
            formulasByTime[item.time] = [];
        }
        formulasByTime[item.time].push({
            formulaId: item.formula.id,
            usageType: item.mediumType,
            reason: `已选中的配方`
        });
    });
    
    // 构建时间线
    Object.keys(formulasByTime).sort().forEach(time => {
        scenario.timeline.push({
            time,
            title: '已选配方',
            formulas: formulasByTime[time]
        });
    });
    
    // 计算安全评估
    if (typeof DailyUsageValidator === 'undefined') {
        safetyContainer.innerHTML = '<p style="color: #666;">安全验证功能未加载</p>';
        safetyContainer.style.display = 'block';
        return;
    }
    
    try {
        const usageData = DailyUsageValidator.calculateScenarioDailyUsage(scenario);
        const safetyHTML = DailyUsageValidator.generateSafetyAssessmentCard(usageData, scenarioIndex);
        
        safetyContainer.innerHTML = `
            <h3 style="font-size: 18px; font-weight: 600; color: var(--primary-color); margin-bottom: 15px;">
                已选配方安全评估
            </h3>
            ${safetyHTML}
        `;
        safetyContainer.style.display = 'block';
    } catch (e) {
        console.error('Error calculating safety validation:', e);
        safetyContainer.innerHTML = `
            <p style="color: #dc2626; margin-bottom: 10px;">安全验证计算出错：${e.message}</p>
            <p style="color: #666; font-size: 12px;">请检查配方数据是否正确，或刷新页面重试。</p>
        `;
        safetyContainer.style.display = 'block';
    }
}

// 显示错误状态
function showError(message, details = null) {
    const container = document.getElementById('scenariosContainer');
    if (!container) return;
    
    let detailsHTML = '';
    if (details) {
        if (Array.isArray(details)) {
            detailsHTML = `<ul style="text-align: left; margin-top: 15px; padding-left: 20px;">
                ${details.map(d => `<li style="margin: 8px 0; color: #666;">${d}</li>`).join('')}
            </ul>`;
        } else if (typeof details === 'string') {
            detailsHTML = `<p style="margin-top: 15px; color: #666; font-size: 14px;">${details}</p>`;
        }
    }
    
    container.innerHTML = `
        <div class="error-state">
            <h3 style="color: #dc3545; margin-bottom: 15px;">⚠️ 生成场景建议时出错</h3>
            <p style="font-size: 16px; margin-bottom: 10px;">${message}</p>
            ${detailsHTML}
            <div style="margin-top: 25px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <a href="health-profile.html" class="btn btn-primary" style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">
                    返回问卷
                </a>
                <button onclick="location.reload()" class="btn" style="padding: 12px 24px; background: white; color: var(--accent-color); border: 2px solid var(--accent-color); border-radius: 6px; cursor: pointer; font-weight: 600;">
                    刷新页面
                </button>
            </div>
        </div>
    `;
}

// 显示加载状态（增强版：带进度提示）
function showLoading(message = '正在为您生成个性化场景建议...', progress = null) {
    const container = document.getElementById('scenariosContainer');
    if (!container) return;
    
    let progressHTML = '';
    if (progress !== null) {
        progressHTML = `
            <div style="width: 100%; max-width: 400px; margin: 20px auto;">
                <div style="background: rgba(102, 126, 234, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${progress}%; transition: width 0.3s ease; border-radius: 4px;"></div>
                </div>
                <p style="text-align: center; font-size: 12px; color: var(--secondary-color); margin-top: 8px;">${progress}%</p>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p style="font-size: 16px; color: var(--primary-color); margin-top: 20px;">${message}</p>
            <p style="font-size: 14px; color: var(--secondary-color); margin-top: 10px;">这可能需要几秒钟时间，请稍候...</p>
            ${progressHTML}
        </div>
    `;
}

// 初始化时间轴点击功能
function initTimelineClick() {
    const timelineNodes = document.querySelectorAll('.timeline-node');
    timelineNodes.forEach(node => {
        const time = node.getAttribute('data-time');
        if (!time) return;
        
        // 为节点添加点击事件
        node.style.cursor = 'pointer';
        node.addEventListener('click', function(e) {
            handleTimelineNodeClick(time, node);
        });
    });
}

// 处理时间轴节点点击
function handleTimelineNodeClick(time, clickedNode) {
    if (!window.scenarioData || !window.scenarioData.scenarios) {
        return;
    }
    
    // 移除之前的激活状态
    document.querySelectorAll('.timeline-node').forEach(node => {
        node.classList.remove('timeline-node-active');
    });
    
    // 添加激活状态
    clickedNode.classList.add('timeline-node-active');
    
    // 获取该时间点的配方
    const formulasForTime = [];
    window.scenarioData.scenarios.forEach((scenario, scenarioIndex) => {
        if (!scenario.timeline) return;
        
        scenario.timeline.forEach(item => {
            if (item.time === time && item.formulas && item.formulas.length > 0) {
                item.formulas.forEach(formulaData => {
                    if (formulaData.formulaId && FORMULA_DATABASE[formulaData.formulaId]) {
                        formulasForTime.push({
                            scenarioIndex,
                            formulaData,
                            formula: FORMULA_DATABASE[formulaData.formulaId],
                            time: item.time,
                            title: item.title
                        });
                    }
                });
            }
        });
    });
    
    // 更新两侧场景显示
    updateScenarioSidesForTime(time, formulasForTime);
}

// 更新场景侧边显示指定时间点的配方
function updateScenarioSidesForTime(time, formulasForTime) {
    const scenarioSides = document.querySelectorAll('.scenario-side');
    
    scenarioSides.forEach((side, scenarioIndex) => {
        const formulasForThisScenario = formulasForTime.filter(f => f.scenarioIndex === scenarioIndex);
        
        // 隐藏所有配方容器
        const allContainers = side.querySelectorAll('.timeline-formulas-container');
        allContainers.forEach(container => {
            container.style.display = 'none';
        });
        
        // 显示匹配时间点的容器
        const matchingContainers = side.querySelectorAll(`.timeline-formulas-container[data-time="${time}"]`);
        matchingContainers.forEach(container => {
            container.style.display = 'flex';
            container.style.animation = 'fadeInLeft 0.4s ease-out';
        });
        
        // 如果没有匹配的容器，创建一个新的
        if (matchingContainers.length === 0 && formulasForThisScenario.length > 0) {
            const formulasHTML = formulasForThisScenario.map(f => 
                renderFormulaCard(f.formulaData, f.formula, f.time, scenarioIndex)
            ).join('');
            
            const newContainer = document.createElement('div');
            newContainer.className = 'timeline-formulas-container';
            newContainer.setAttribute('data-time', time);
            newContainer.style.display = 'flex';
            newContainer.innerHTML = `
                <div class="medium-group" style="margin-bottom: 15px;">
                    <div class="formula-cards-container">
                        ${formulasHTML}
                    </div>
                </div>
            `;
            
            // 插入到场景侧边的配方区域
            const existingContainers = side.querySelectorAll('.timeline-formulas-container');
            if (existingContainers.length > 0) {
                side.insertBefore(newContainer, existingContainers[0]);
            } else {
                const header = side.querySelector('.scenario-side-header');
                if (header) {
                    header.insertAdjacentElement('afterend', newContainer);
                }
            }
        }
    });
    
    // 添加重置按钮
    addResetButton();
}

// 添加重置按钮
function addResetButton() {
    // 移除之前的重置按钮
    const existingReset = document.querySelector('.timeline-reset-btn');
    if (existingReset) {
        existingReset.remove();
    }
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'timeline-reset-btn';
    resetBtn.textContent = '显示全部时间点';
    resetBtn.style.cssText = 'margin: 20px auto; padding: 10px 20px; background: var(--accent-gradient); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; display: block; transition: all 0.3s ease;';
    resetBtn.onclick = function() {
        // 重置显示
        document.querySelectorAll('.timeline-formulas-container').forEach(container => {
            container.style.display = 'flex';
        });
        document.querySelectorAll('.timeline-node').forEach(node => {
            node.classList.remove('timeline-node-active');
        });
        resetBtn.remove();
    };
    resetBtn.onmouseenter = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
    };
    resetBtn.onmouseleave = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    };
    
    const container = document.getElementById('scenariosContainer');
    if (container) {
        container.appendChild(resetBtn);
    }
}

// 主函数：加载并渲染场景建议（优化版：添加性能监控和进度提示）
async function loadScenarioSuggestions() {
    console.log('=== loadScenarioSuggestions started ===');
    const startTime = performance.now();
    
    try {
        showLoading();
        
        // 更新加载提示
        const updateLoadingMessage = (message) => {
            const container = document.getElementById('scenariosContainer');
            if (container) {
                const loadingState = container.querySelector('.loading-state');
                if (loadingState) {
                    const messageEl = loadingState.querySelector('p');
                    if (messageEl) {
                        messageEl.textContent = message;
                    }
                }
            }
        };
        
        // 检查是否要查看已保存的场景（从历史记录中）
        const urlParams = new URLSearchParams(window.location.search);
        const viewScenarioId = urlParams.get('view');
        
        if (viewScenarioId) {
            console.log('Loading saved scenario from history:', viewScenarioId);
            updateLoadingMessage('正在加载已保存的场景建议...');
            
            try {
                const savedScenarioData = sessionStorage.getItem('viewScenarioSuggestion');
                if (savedScenarioData) {
                    const scenarios = JSON.parse(savedScenarioData);
                    console.log('Loaded saved scenario:', scenarios);
                    
                    // 验证数据格式
                    if (scenarios && scenarios.scenarios && Array.isArray(scenarios.scenarios)) {
                        // 直接渲染已保存的场景，不重新生成
                        showLoading('正在渲染场景内容...', 90);
                        renderScenarios(scenarios);
                        renderQuickOverview(scenarios);
                        
                        // 显示视图切换按钮
                        const viewModeToggle = document.getElementById('viewModeToggle');
                        if (viewModeToggle) {
                            viewModeToggle.style.display = 'flex';
                        }
                        
                        // 检查是否需要显示首次使用引导
                        checkAndShowOnboarding();
                        
                        // 完成加载
                        showLoading('加载完成！', 100);
                        setTimeout(() => {
                            const container = document.getElementById('scenariosContainer');
                            if (container) {
                                const loadingState = container.querySelector('.loading-state');
                                if (loadingState) {
                                    loadingState.style.display = 'none';
                                }
                            }
                        }, 500);
                        
                        // 清理sessionStorage（可选，保留以便刷新时仍能查看）
                        // sessionStorage.removeItem('viewScenarioSuggestion');
                        
                        console.log('Saved scenario rendered successfully');
                        return;
                    } else {
                        console.error('Invalid saved scenario data format');
                        sessionStorage.removeItem('viewScenarioSuggestion');
                        // 继续执行正常流程
                    }
                } else {
                    console.error('No saved scenario data found in sessionStorage');
                    // 继续执行正常流程
                }
            } catch (e) {
                console.error('Error loading saved scenario:', e);
                sessionStorage.removeItem('viewScenarioSuggestion');
                // 继续执行正常流程
            }
        }
        
        // 获取问卷数据
        updateLoadingMessage('正在读取您的健康档案...');
        console.log('Getting questionnaire data...');
        
        if (typeof getQuestionnaireData === 'undefined') {
            console.error('getQuestionnaireData function is not available');
            showError('系统错误：无法读取问卷数据函数。请刷新页面重试。');
            return;
        }
        
        const questionnaireData = getQuestionnaireData();
        console.log('Questionnaire data:', questionnaireData);
        
        if (!questionnaireData) {
            console.warn('No questionnaire data found');
            showError('请先完成健康状况问卷');
            return;
        }
        
        // 检查是否选择了使用方式
        if (!questionnaireData.usage || questionnaireData.usage.length === 0) {
            console.warn('No usage types selected');
            showError('请至少选择一种使用方式');
            return;
        }
        
        console.log('Usage types selected:', questionnaireData.usage);
    
    // 检查AI是否可用（如果不可用，将使用降级方案）
    updateLoadingMessage('正在准备AI服务...');
    const generateScenarioSuggestions = window.generateScenarioSuggestions;
    if (typeof generateScenarioSuggestions === 'undefined') {
        console.warn('AI功能未启用，将使用降级方案（基于规则的场景建议）');
        // 不直接返回，而是继续使用降级方案
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
        let scenarios = null;
        let isUsingFallback = false;
        
        // 优化策略：并行处理 - 先快速生成降级方案并显示，同时后台调用AI
        // 这样可以立即显示内容，如果AI成功则替换为更好的结果
        
        // 1. 先快速生成降级方案（同步，很快）
        updateLoadingMessage('正在快速生成场景建议...');
        showLoading('正在快速生成场景建议...', 20);
        
        const fallbackScenarios = generateFallbackScenarios(questionnaireData);
        
        // 2. 如果降级方案可用，立即显示（让用户感觉很快）
        if (fallbackScenarios && fallbackScenarios.scenarios && fallbackScenarios.scenarios.length > 0) {
            console.log('Fallback scenarios generated, displaying immediately');
            isUsingFallback = true;
            scenarios = fallbackScenarios;
            
            // 立即渲染降级方案
            showLoading('正在渲染场景内容...', 60);
            renderScenarios(scenarios);
            renderQuickOverview(scenarios);
            
            // 显示视图切换按钮
            const viewModeToggle = document.getElementById('viewModeToggle');
            if (viewModeToggle) {
                viewModeToggle.style.display = 'flex';
            }
            
            // 隐藏加载状态，显示内容
            setTimeout(() => {
                const container = document.getElementById('scenariosContainer');
                if (container) {
                    const loadingState = container.querySelector('.loading-state');
                    if (loadingState) {
                        loadingState.style.display = 'none';
                    }
                }
            }, 300);
            
            // 显示提示：正在后台优化
            const container = document.getElementById('scenariosContainer');
            if (container) {
                const notice = document.createElement('div');
                notice.id = 'aiOptimizationNotice';
                notice.style.cssText = 'background: #e3f2fd; border: 2px solid #2196f3; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;';
                notice.innerHTML = `
                    <span style="font-size: 18px;">⚡</span>
                    <div style="flex: 1;">
                        <strong style="color: #1976d2;">正在后台优化建议...</strong>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">AI正在为您生成更个性化的方案，完成后将自动更新</p>
                    </div>
                `;
                container.insertBefore(notice, container.firstChild);
            }
        } else {
            // 降级方案生成失败，显示错误
            showError(
                '无法生成场景建议',
                [
                    '可能的原因：',
                    '• 请确保已选择至少一种使用方式',
                    '• 请确保已填写健康状况问卷',
                    '• 配方数据库可能未正确加载',
                    '',
                    '💡 提示：您可以先查看"AI芳疗定制"页面，那里有基于规则的配方推荐。'
                ]
            );
            return;
        }
        
        // 3. 并行：后台尝试使用AI生成更好的场景建议（如果可用）
        if (typeof generateScenarioSuggestions !== 'undefined') {
            console.log('Starting AI generation in background...');
            
            // 使用 Promise.race 设置超时，避免等待太久
            const aiPromise = generateScenarioSuggestions(questionnaireData);
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => resolve(null), 15000); // 15秒超时
            });
            
            try {
                const aiScenarios = await Promise.race([aiPromise, timeoutPromise]);
                
                if (aiScenarios && aiScenarios.scenarios && aiScenarios.scenarios.length > 0) {
                    console.log('AI scenarios generated successfully, replacing fallback');
                    
                    // AI生成成功，替换为AI结果
                    scenarios = aiScenarios;
                    isUsingFallback = false;
                    
                    // 移除优化提示
                    const notice = document.getElementById('aiOptimizationNotice');
                    if (notice) {
                        notice.style.cssText = 'background: #e8f5e9; border: 2px solid #4caf50; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;';
                        notice.innerHTML = `
                            <span style="font-size: 18px;">✨</span>
                            <div style="flex: 1;">
                                <strong style="color: #2e7d32;">AI优化完成！</strong>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">已为您生成更个性化的方案</p>
                            </div>
                        `;
                        setTimeout(() => {
                            if (notice) notice.style.display = 'none';
                        }, 3000);
                    }
                    
                    // 重新渲染AI生成的场景
                    const container = document.getElementById('scenariosContainer');
                    if (container) {
                        // 清除旧内容（保留视图切换按钮）
                        const layout = container.querySelector('.scenarios-layout');
                        if (layout) layout.remove();
                        const overview = document.getElementById('quickOverview');
                        if (overview) overview.style.display = 'none';
                    }
                    
                    renderScenarios(scenarios);
                    renderQuickOverview(scenarios);
                    
                    // 显示视图切换按钮
                    const viewModeToggle = document.getElementById('viewModeToggle');
                    if (viewModeToggle) {
                        viewModeToggle.style.display = 'flex';
                    }
                } else {
                    console.log('AI generation failed or timed out, keeping fallback');
                    // AI生成失败或超时，保持使用降级方案
                    if (isUsingFallback) {
                        const notice = document.getElementById('aiOptimizationNotice');
                        if (notice) {
                            notice.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;';
                            notice.innerHTML = `
                                <span style="font-size: 18px;">ℹ️</span>
                                <div style="flex: 1;">
                                    <strong style="color: #856404;">使用基于规则的场景建议</strong>
                                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">AI功能暂时不可用，已为您生成基于规则的方案</p>
                                </div>
                            `;
                            setTimeout(() => {
                                if (notice) notice.style.display = 'none';
                            }, 5000);
                        }
                    }
                }
            } catch (aiError) {
                console.warn('AI生成失败，保持使用降级方案:', aiError);
                // AI生成失败，保持使用降级方案
                if (isUsingFallback) {
                    const notice = document.getElementById('aiOptimizationNotice');
                    if (notice) {
                        notice.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; padding: 12px; border-radius: 8px; margin-bottom: 20px;';
                        notice.innerHTML = `
                            <p style="color: #856404; margin: 0;">
                                ⚠️ AI功能暂时不可用，已为您生成基于规则的场景建议。
                            </p>
                        `;
                        setTimeout(() => {
                            if (notice) notice.style.display = 'none';
                        }, 5000);
                    }
                }
            }
        } else {
            // AI功能未启用
            if (isUsingFallback) {
                const notice = document.getElementById('aiOptimizationNotice');
                if (notice) {
                    notice.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; padding: 12px; border-radius: 8px; margin-bottom: 20px;';
                    notice.innerHTML = `
                        <p style="color: #856404; margin: 0;">
                            ⚠️ AI功能未启用，已为您生成基于规则的简化场景建议。
                        </p>
                    `;
                }
            }
        }
        
        // 保存场景建议到历史记录（如果用户已登录，且不是从历史记录查看的场景）
        if (!viewScenarioId && typeof window.saveScenarioSuggestion === 'function' && window.authSystem && window.authSystem.isUserLoggedIn()) {
            try {
                window.saveScenarioSuggestion(scenarios);
            } catch (e) {
                console.error('Error saving scenario suggestion:', e);
            }
        }
        
        // 检查是否需要显示首次使用引导（只在首次渲染时检查）
        if (!isUsingFallback || typeof generateScenarioSuggestions === 'undefined') {
            checkAndShowOnboarding();
        }
        
        const totalTime = performance.now() - startTime;
        console.log(`场景加载完成 - 总耗时: ${totalTime.toFixed(2)}ms, 使用${isUsingFallback ? '降级' : 'AI'}方案`);
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
        
        console.error('=== loadScenarioSuggestions error ===', error);
        showError(errorMessage);
    }
}

// 等待依赖加载完成（优化版：减少等待时间，提前显示内容）
function waitForDependencies(callback, maxWaitTime = 3000) {
    const startTime = Date.now();
    const checkInterval = 50; // 检查间隔50ms
    
    // 先检查基本依赖（FORMULA_DATABASE和getQuestionnaireData），这些通常加载较快
    const checkBasicDependencies = setInterval(() => {
        const basicReady = 
            typeof FORMULA_DATABASE !== 'undefined' && 
            FORMULA_DATABASE && 
            Object.keys(FORMULA_DATABASE).length > 0 &&
            typeof getQuestionnaireData !== 'undefined';
        
        if (basicReady) {
            clearInterval(checkBasicDependencies);
            // 基本依赖已加载，立即执行回调（不等待AI）
            console.log('Basic dependencies loaded, starting immediately');
            callback();
        } else if (Date.now() - startTime >= maxWaitTime) {
            clearInterval(checkBasicDependencies);
            console.error('Basic dependencies not loaded after', maxWaitTime, 'ms');
            const container = document.getElementById('scenariosContainer');
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <h3>依赖加载失败</h3>
                        <p>页面依赖未完全加载，请刷新页面重试。</p>
                        <p style="font-size: 12px; color: #666; margin-top: 10px;">
                            FORMULA_DATABASE: ${typeof FORMULA_DATABASE !== 'undefined' ? '已加载' : '未加载'}<br>
                            getQuestionnaireData: ${typeof getQuestionnaireData !== 'undefined' ? '已加载' : '未加载'}<br>
                            generateScenarioSuggestions: ${typeof window.generateScenarioSuggestions !== 'undefined' ? '已加载' : '未加载'}
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

// 检查并显示首次使用引导
function checkAndShowOnboarding() {
    const onboardingKey = 'scenario-suggestions-onboarding-shown';
    const hasSeenOnboarding = localStorage.getItem(onboardingKey);
    
    if (!hasSeenOnboarding) {
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }
}

// 关闭首次使用引导
window.closeOnboarding = function(dontShowAgain = false) {
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    if (dontShowAgain) {
        localStorage.setItem('scenario-suggestions-onboarding-shown', 'true');
    }
};

// 切换视图模式
window.switchViewMode = function(mode) {
    const layout = document.querySelector('.scenarios-layout');
    const buttons = document.querySelectorAll('.view-mode-btn');
    
    if (!layout) return;
    
    // 更新按钮状态
    buttons.forEach(btn => {
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 移除所有视图类
    layout.classList.remove('detailed-view', 'compact-view', 'compare-view');
    
    // 添加新的视图类
    if (mode === 'detailed') {
        layout.classList.add('detailed-view');
    } else if (mode === 'compact') {
        layout.classList.add('compact-view');
    } else if (mode === 'compare') {
        layout.classList.add('compare-view');
    }
};

// 页面加载时执行（优化：使用更高效的加载策略）
function initScenarioSuggestions() {
    console.log('=== Initializing scenario suggestions ===');
    console.log('Document ready state:', document.readyState);
    console.log('FORMULA_DATABASE:', typeof FORMULA_DATABASE !== 'undefined' ? 'loaded (' + Object.keys(FORMULA_DATABASE || {}).length + ' formulas)' : 'not loaded');
    console.log('getQuestionnaireData:', typeof getQuestionnaireData !== 'undefined' ? 'loaded' : 'not loaded');
    console.log('calculateFormulaScores:', typeof calculateFormulaScores !== 'undefined' ? 'loaded' : 'not loaded');
    console.log('generateScenarioSuggestions:', typeof window.generateScenarioSuggestions !== 'undefined' ? 'loaded' : 'not loaded');
    console.log('DailyUsageValidator:', typeof DailyUsageValidator !== 'undefined' ? 'loaded' : 'not loaded');
    
    // 检查容器是否存在
    const container = document.getElementById('scenariosContainer');
    if (!container) {
        console.error('scenariosContainer element not found!');
        return;
    }
    console.log('scenariosContainer found');
    
    waitForDependencies(loadScenarioSuggestions);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScenarioSuggestions);
} else {
    // DOM已经加载完成，直接执行
    // 使用 setTimeout 确保所有脚本都已执行
    setTimeout(initScenarioSuggestions, 100);
}

