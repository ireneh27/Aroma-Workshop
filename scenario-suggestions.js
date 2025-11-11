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
    
    // 合并时间线，提取所有时间点
    const mergedTimeline = mergeTimelines(scenarios.scenarios);
    
    if (mergedTimeline.length === 0) {
        console.error('No timeline items found');
        container.innerHTML = `
            <div class="error-state">
                <h3>场景渲染失败</h3>
                <p>无法提取时间线数据，请检查场景数据格式。</p>
            </div>
        `;
        return;
    }
    
    // 先清空容器并显示骨架屏
    container.innerHTML = '';
    
    // 创建布局容器
    const layoutDiv = document.createElement('div');
    layoutDiv.className = 'scenarios-layout';
    container.appendChild(layoutDiv);
    
    // 保存场景数据供时间轴点击使用
    window.scenarioData = scenarios;
    
    // 分批渲染：先渲染时间轴和基本结构
    renderTimelineFirst(mergedTimeline, layoutDiv, scenarios);
}

// 先渲染时间轴（快速显示）
function renderTimelineFirst(mergedTimeline, layoutDiv, scenarios) {
    // 渲染中间时间轴
    const timelineHTML = mergedTimeline.map((item, index) => renderTimelineNode(item, index)).join('');
    const centralTimelineDiv = document.createElement('div');
    centralTimelineDiv.className = 'central-timeline';
    centralTimelineDiv.innerHTML = timelineHTML;
    
    // 创建左右两侧的占位容器
    const leftPlaceholder = document.createElement('div');
    leftPlaceholder.className = 'scenario-side';
    leftPlaceholder.innerHTML = '<div class="scenario-side-header"><div class="loading-spinner" style="width: 30px; height: 30px; margin: 20px auto;"></div><p style="text-align: center; color: var(--secondary-color);">加载中...</p></div>';
    
    const rightPlaceholder = document.createElement('div');
    rightPlaceholder.className = 'scenario-side';
    rightPlaceholder.innerHTML = '<div class="scenario-side-header"><div class="loading-spinner" style="width: 30px; height: 30px; margin: 20px auto;"></div><p style="text-align: center; color: var(--secondary-color);">加载中...</p></div>';
    
    // 添加到布局
    layoutDiv.appendChild(leftPlaceholder);
    layoutDiv.appendChild(centralTimelineDiv);
    layoutDiv.appendChild(rightPlaceholder);
    
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
        const safetyContainer = document.createElement('div');
        safetyContainer.className = 'selected-formulas-safety';
        safetyContainer.id = `safety-container-${index}`;
        safetyContainer.style.cssText = 'margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 12px; display: none;';
        side.appendChild(safetyContainer);
    });
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

// 显示加载状态
function showLoading(message = '正在为您生成个性化场景建议...') {
    const container = document.getElementById('scenariosContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p style="font-size: 16px; color: var(--primary-color); margin-top: 20px;">${message}</p>
            <p style="font-size: 14px; color: var(--secondary-color); margin-top: 10px;">这可能需要几秒钟时间，请稍候...</p>
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
    const startTime = performance.now();
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
    
    // 获取问卷数据
    updateLoadingMessage('正在读取您的健康档案...');
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
    updateLoadingMessage('正在准备AI服务...');
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
        updateLoadingMessage('正在生成个性化场景建议...');
        console.log('Calling generateScenarioSuggestions with data:', questionnaireData);
        const scenarios = await generateScenarioSuggestions(questionnaireData);
        
        console.log('Received scenarios:', scenarios);
        
        if (!scenarios) {
            console.error('generateScenarioSuggestions returned null or undefined');
            showError(
                'AI生成场景建议失败',
                [
                    '可能的原因：',
                    '• AI服务暂时不可用，请稍后重试',
                    '• 网络连接问题，请检查网络设置',
                    '• AI配置错误，请联系管理员',
                    '• 用户数据不完整，请检查问卷填写'
                ]
            );
            return;
        }
        
        if (!scenarios.scenarios || scenarios.scenarios.length === 0) {
            console.error('Scenarios array is empty');
            showError(
                'AI返回的场景数据为空',
                'AI服务已响应，但未生成有效的场景建议。请尝试刷新页面或重新填写问卷。'
            );
            return;
        }
        
        // 渲染场景
        updateLoadingMessage('正在渲染场景内容...');
        const renderStartTime = performance.now();
        renderScenarios(scenarios);
        const renderTime = performance.now() - renderStartTime;
        const totalTime = performance.now() - startTime;
        console.log(`场景渲染完成 - 渲染耗时: ${renderTime.toFixed(2)}ms, 总耗时: ${totalTime.toFixed(2)}ms`);
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

// 等待依赖加载完成（优化版：减少等待时间，提前显示内容）
function waitForDependencies(callback, maxWaitTime = 3000) {
    const startTime = Date.now();
    const checkInterval = 30; // 进一步减少检查间隔到30ms
    
    // 先检查基本依赖（FORMULA_DATABASE和getQuestionnaireData），这些通常加载较快
    const checkBasicDependencies = setInterval(() => {
        const basicReady = 
            typeof FORMULA_DATABASE !== 'undefined' && 
            FORMULA_DATABASE && 
            Object.keys(FORMULA_DATABASE).length > 0 &&
            typeof getQuestionnaireData !== 'undefined';
        
        if (basicReady) {
            clearInterval(checkBasicDependencies);
            // 基本依赖已加载，可以提前显示一些内容或开始准备
            console.log('Basic dependencies loaded');
            
            // 继续等待AI相关依赖，但减少等待时间
            let aiCheckCount = 0;
            const maxAIChecks = Math.floor((maxWaitTime - (Date.now() - startTime)) / checkInterval);
            const checkAIDependencies = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const allReady = typeof generateScenarioSuggestions !== 'undefined';
                
                if (allReady) {
                    clearInterval(checkAIDependencies);
                    console.log('All dependencies loaded, starting scenario suggestions');
                    callback();
                } else if (elapsed >= maxWaitTime || aiCheckCount >= maxAIChecks) {
                    clearInterval(checkAIDependencies);
                    // 即使AI未加载，也尝试继续（可能使用备用方案）
                    console.warn('AI dependencies not loaded, attempting to continue...');
                    if (typeof generateScenarioSuggestions === 'undefined') {
                        const container = document.getElementById('scenariosContainer');
                        if (container) {
                            container.innerHTML = `
                                <div class="error-state">
                                    <h3>AI功能加载中</h3>
                                    <p>AI服务正在加载，请稍候...</p>
                                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                                        如果长时间未响应，请刷新页面。
                                    </p>
                                </div>
                            `;
                        }
                    } else {
                        callback();
                    }
                }
                aiCheckCount++;
            }, checkInterval);
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

// 页面加载时执行（优化：使用更高效的加载策略）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded, waiting for dependencies...');
        waitForDependencies(loadScenarioSuggestions);
    });
} else {
    // DOM已经加载完成，直接执行
    console.log('DOM already loaded, waiting for dependencies...');
    waitForDependencies(loadScenarioSuggestions);
}

