// 定制芳疗体验页面逻辑 - 时间轴场景方案

// 生成带权重的AI Prompt
function generateWeightedAIPrompt(questionnaireData) {
    if (!questionnaireData) return '';
    
    const weights = {
        gender: 1.0,           // 性别权重：高
        pregnancy: 1.0,        // 孕期状态：高
        symptoms: 0.8,         // 症状：高
        fragrance: 0.6,        // 香味偏好：中
        usage: 0.7,            // 使用方式：中高
        constitution: 0.5,     // 体质：中
        caution: 1.0           // 注意事项：高（安全相关）
    };
    
    let prompt = '请根据以下用户信息，生成一个完整的一日芳疗使用方案（时间轴形式）。\n\n';
    
    // 性别（高权重）
    if (questionnaireData.gender) {
        prompt += `【性别】${questionnaireData.gender === 'male' ? '男性' : '女性'}\n`;
    }
    
    // 孕期状态（高权重，安全相关）
    if (questionnaireData.pregnancy) {
        if (questionnaireData.pregnancy === 'yes') {
            prompt += `【重要】用户处于孕期，请特别注意选择安全的配方，避免使用孕期禁用精油。\n`;
        } else if (questionnaireData.pregnancy === 'nursing') {
            prompt += `【重要】用户处于哺乳期，请选择温和安全的配方。\n`;
        }
    }
    
    // 年龄
    if (questionnaireData.age) {
        prompt += `【年龄】${questionnaireData.age}岁\n`;
    }
    
    // 症状（高权重）
    const allSymptoms = [];
    ['circulation', 'sleep', 'digestive', 'gynecological', 'constitution', 'other'].forEach(category => {
        const symptoms = questionnaireData[category] || [];
        symptoms.forEach(symptom => {
            if (symptom !== 'none' && !allSymptoms.includes(symptom)) {
                allSymptoms.push(symptom);
            }
        });
    });
    
    if (allSymptoms.length > 0) {
        prompt += `【主要症状】${allSymptoms.join('、')}\n`;
    }
    
    // 香味偏好（中权重）
    if (questionnaireData.fragrance && questionnaireData.fragrance.length > 0) {
        const fragranceNames = questionnaireData.fragrance.map(f => {
            const map = {
                'floral': '花香',
                'citrus': '柑橘',
                'woody': '木质',
                'herbal': '草本',
                'spicy': '辛辣',
                'minty': '薄荷'
            };
            return map[f] || f;
        });
        prompt += `【香味偏好】${fragranceNames.join('、')}\n`;
    }
    
    // 使用方式偏好（中高权重）
    if (questionnaireData.usage && questionnaireData.usage.length > 0) {
        const usageNames = questionnaireData.usage.map(u => {
            const map = {
                'handcream': '护手霜',
                'bodylotion': '身体乳',
                'footbath': '泡脚/泡澡',
                'diffuser': '扩香',
                'spray': '喷雾'
            };
            return map[u] || u;
        });
        prompt += `【使用方式偏好】${usageNames.join('、')}\n`;
    }
    
    // 注意事项（高权重，安全相关）
    if (questionnaireData.caution && questionnaireData.caution.length > 0) {
        const cautionNames = questionnaireData.caution.map(c => {
            const map = {
                'hypertension': '高血压',
                'epilepsy': '癫痫',
                'sensitive': '敏感肌',
                'pregnancy': '孕期',
                'nursing': '哺乳期'
            };
            return map[c] || c;
        });
        prompt += `【注意事项】${cautionNames.join('、')} - 请特别注意选择安全的配方。\n`;
    }
    
    prompt += `\n请生成一个完整的一日使用方案，包含以下要求：\n`;
    prompt += `1. 时间轴形式，从早晨到晚上，包含3-6个时间点\n`;
    prompt += `2. 每个时间点包含：时间（如08:00）、标题、推荐的配方ID、使用原因\n`;
    prompt += `3. 优先使用用户偏好的使用方式\n`;
    prompt += `4. 考虑香味偏好\n`;
    prompt += `5. 确保安全性，特别是孕期、哺乳期、高血压、癫痫等特殊情况\n`;
    prompt += `6. 配方ID必须来自FORMULA_DATABASE中存在的配方\n`;
    prompt += `7. 返回JSON格式：{"scenarios": [{"name": "场景名称", "description": "描述", "timeline": [{"time": "08:00", "title": "标题", "formulas": [{"formulaId": "formula-a", "usageType": "handcream", "reason": "原因"}]}]}]}\n`;
    
    return prompt;
}

// 生成场景建议（使用AI或降级方案）
async function generateTimelineScenario(questionnaireData) {
    if (!questionnaireData) {
        return null;
    }
    
    // 检查是否可以使用AI
    const useAI = typeof AI_CONFIG !== 'undefined' && AI_CONFIG.provider !== 'none';
    const canUseAI = useAI && typeof window !== 'undefined' && window.authSystem && 
                     window.authSystem.isUserLoggedIn() && window.authSystem.canUseAIInquiry();
    
    if (canUseAI && typeof callAI === 'function') {
        try {
            // 使用带权重的AI prompt生成单个场景
            const prompt = generateWeightedAIPrompt(questionnaireData);
            
            // 获取可用配方列表
            const availableFormulas = Object.values(FORMULA_DATABASE || {});
            const formulasList = availableFormulas.map(f => {
                const oils = extractOils(f);
                return `- ${f.id}: ${f.name}${f.subtitle ? ` - ${f.subtitle}` : ''} [精油: ${oils.join('、')}]`;
            }).join('\n');
            
            const systemPrompt = `你是一位专业的芳疗师，擅长制定个性化的精油使用方案。

可用配方列表：
${formulasList}

请严格按照用户要求生成一个完整的一日使用方案（时间轴形式），返回纯JSON格式，不要包含markdown代码块标记。`;
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ];
            
            const response = await callAI(messages, { maxTokens: 2000 });
            
            if (response) {
                // 解析JSON响应
                let jsonResponse;
                try {
                    // 尝试提取JSON（可能包含markdown代码块）
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        jsonResponse = JSON.parse(jsonMatch[0]);
                    } else {
                        jsonResponse = JSON.parse(response);
                    }
                } catch (e) {
                    console.warn('AI返回的JSON格式无效，使用降级方案:', e);
                    return generateFallbackTimelineScenario(questionnaireData);
                }
                
                if (jsonResponse && jsonResponse.scenarios && jsonResponse.scenarios.length > 0) {
                    // 只返回第一个场景
                    return {
                        name: jsonResponse.scenarios[0].name,
                        description: jsonResponse.scenarios[0].description,
                        timeline: jsonResponse.scenarios[0].timeline || []
                    };
                }
            }
        } catch (error) {
            console.warn('AI生成场景失败，使用降级方案:', error);
        }
    }
    
    // 降级方案：使用规则匹配
    return generateFallbackTimelineScenario(questionnaireData);
}

// 生成降级时间轴场景（基于规则）
function generateFallbackTimelineScenario(questionnaireData) {
    if (!questionnaireData || typeof FORMULA_DATABASE === 'undefined') {
        return null;
    }
    
    // 使用规则匹配获取推荐配方
    if (typeof calculateFormulaScores === 'undefined') {
        return null;
    }
    
    const scores = calculateFormulaScores(questionnaireData);
    const sortedFormulas = Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 8)
        .map(([formulaId]) => FORMULA_DATABASE[formulaId])
        .filter(f => f);
    
    if (sortedFormulas.length === 0) {
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
        
        if (usageType) {
            if (!formulasByUsage[usageType]) {
                formulasByUsage[usageType] = [];
            }
            formulasByUsage[usageType].push(formula);
        }
    });
    
    // 生成时间轴
    const timeline = [];
    
    // 早晨（08:00）- 护手霜或扩香
    if (formulasByUsage.handcream && formulasByUsage.handcream.length > 0) {
        timeline.push({
            time: '08:00',
            title: '起床后',
            formulas: [{
                formulaId: formulasByUsage.handcream[0].id,
                usageType: 'handcream',
                reason: '早晨使用，提神醒脑'
            }]
        });
    } else if (formulasByUsage.diffuser && formulasByUsage.diffuser.length > 0) {
        timeline.push({
            time: '08:00',
            title: '起床后',
            formulas: [{
                formulaId: formulasByUsage.diffuser[0].id,
                usageType: 'diffuser',
                reason: '早晨扩香，提升精神状态'
            }]
        });
    }
    
    // 工作时段（10:00）- 扩香或护手霜
    if (formulasByUsage.diffuser && formulasByUsage.diffuser.length > 0) {
        timeline.push({
            time: '10:00',
            title: '工作时段',
            formulas: [{
                formulaId: formulasByUsage.diffuser[0].id,
                usageType: 'diffuser',
                reason: '工作时段扩香，提升专注力'
            }]
        });
    } else if (formulasByUsage.handcream && formulasByUsage.handcream.length > 0) {
        timeline.push({
            time: '10:00',
            title: '工作时段',
            formulas: [{
                formulaId: formulasByUsage.handcream[0].id,
                usageType: 'handcream',
                reason: '工作时段使用，缓解压力'
            }]
        });
    }
    
    // 下午（15:00）- 扩香或喷雾
    if (formulasByUsage.diffuser && formulasByUsage.diffuser.length > 0) {
        timeline.push({
            time: '15:00',
            title: '下午时段',
            formulas: [{
                formulaId: formulasByUsage.diffuser[0].id,
                usageType: 'diffuser',
                reason: '下午扩香，缓解疲劳'
            }]
        });
    } else if (formulasByUsage.spray && formulasByUsage.spray.length > 0) {
        timeline.push({
            time: '15:00',
            title: '下午时段',
            formulas: [{
                formulaId: formulasByUsage.spray[0].id,
                usageType: 'spray',
                reason: '下午喷雾，提神醒脑'
            }]
        });
    }
    
    // 晚上（19:00）- 泡脚或身体乳
    if (formulasByUsage.footbath && formulasByUsage.footbath.length > 0) {
        timeline.push({
            time: '19:00',
            title: '晚上',
            formulas: [{
                formulaId: formulasByUsage.footbath[0].id,
                usageType: 'footbath',
                reason: '晚上泡脚，促进循环，改善睡眠'
            }]
        });
    } else if (formulasByUsage.bodylotion && formulasByUsage.bodylotion.length > 0) {
        timeline.push({
            time: '19:00',
            title: '晚上',
            formulas: [{
                formulaId: formulasByUsage.bodylotion[0].id,
                usageType: 'bodylotion',
                reason: '晚上使用身体乳，放松身心'
            }]
        });
    }
    
    // 睡前（21:00）- 身体乳或扩香
    if (formulasByUsage.bodylotion && formulasByUsage.bodylotion.length > 0) {
        timeline.push({
            time: '21:00',
            title: '睡前',
            formulas: [{
                formulaId: formulasByUsage.bodylotion[0].id,
                usageType: 'bodylotion',
                reason: '睡前使用，助眠安神'
            }]
        });
    } else if (formulasByUsage.diffuser && formulasByUsage.diffuser.length > 0) {
        timeline.push({
            time: '21:00',
            title: '睡前',
            formulas: [{
                formulaId: formulasByUsage.diffuser[0].id,
                usageType: 'diffuser',
                reason: '睡前扩香，改善睡眠质量'
            }]
        });
    }
    
    return {
        name: '一日芳疗方案',
        description: '基于您的健康状况定制的完整一日使用方案',
        timeline: timeline
    };
}

// 当前场景数据
let currentScenario = null;

// 渲染时间轴场景
function renderTimelineScenario(scenario) {
    if (!scenario || !scenario.timeline || scenario.timeline.length === 0) {
        const container = document.getElementById('personalizedTimeline');
        if (container) {
            container.innerHTML = `
                <div class="formula-box" style="background: #fff9e6; border: 2px solid var(--warning-color);">
                    <h3 style="color: #f57c00; margin-top: 0;">暂无方案</h3>
                    <p>请先完成健康问卷以获取个性化方案。</p>
                    <a href="health-profile.html" class="btn btn-primary">前往填写问卷</a>
                </div>
            `;
        }
        return;
    }
    
    currentScenario = scenario;
    const container = typeof window.DOMUtils !== 'undefined'
        ? window.DOMUtils.getCachedElement('personalizedTimeline')
        : document.getElementById('personalizedTimeline');
    if (!container) return;
    
    // 使用优化的 DOM 操作：先构建 HTML 字符串，然后一次性设置
    let timelineHTML = `
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: var(--shadow); margin-bottom: 30px;">
            <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid var(--accent-color);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                    <div style="flex: 1;">
                        <h2 style="font-size: 28px; font-weight: 600; color: var(--primary-color); margin-bottom: 10px;">${scenario.name || '一日芳疗方案'}</h2>
                        <p style="font-size: 16px; color: var(--secondary-color); line-height: 1.8;">${scenario.description || ''}</p>
                    </div>
                </div>
            </div>
            <div id="timeline-container" style="position: relative; padding-left: 40px; margin: 30px 0;">
                <div style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: var(--accent-gradient);"></div>
    `;
    
    scenario.timeline.forEach((item, index) => {
        timelineHTML += renderTimelineItem(item, index);
    });
    
    timelineHTML += `
            </div>
            <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 2px solid var(--border-color);">
                <button onclick="saveAllFormulasToDatabase()" 
                        style="padding: 12px 32px; background: var(--accent-gradient); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';">
                    保存所有配方到私人配方库
                </button>
            </div>
        </div>
    `;
    
    // 使用优化的 setHTML 方法
    if (typeof window.DOMUtils !== 'undefined') {
        window.DOMUtils.setHTML(container, timelineHTML);
    } else {
        container.innerHTML = timelineHTML;
    }
    
    // 初始化拖拽和交互功能
    initTimelineInteractions();
    
    // 更新每日用量检验
    updateDailyUsageSafetyCheck();
}

// 渲染单个时间轴项
function renderTimelineItem(item, index) {
    if (!item.formulas || item.formulas.length === 0) return '';
    
    const formulasHTML = item.formulas.map((formulaData, formulaIndex) => {
        const formula = typeof FORMULA_DATABASE !== 'undefined' ? FORMULA_DATABASE[formulaData.formulaId] : null;
        if (!formula) return '';
        
        formulaData.formulaIndex = formulaIndex;
        return renderFormulaCardForTimeline(formulaData, formula, index);
    }).filter(html => html).join('');
    
    if (!formulasHTML) return '';
    
    return `
        <div class="timeline-item" data-index="${index}" style="position: relative; margin-bottom: 40px; padding-left: 30px;">
            <div class="timeline-dot" 
                 draggable="true" 
                 data-index="${index}"
                 style="position: absolute; left: -25px; top: 5px; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-gradient); border: 3px solid white; box-shadow: 0 0 0 2px var(--accent-color); cursor: move; z-index: 10;"
                 title="拖拽改变时间，双击删除"></div>
            <div class="timeline-time-input" style="display: inline-block; margin-bottom: 8px;">
                <input type="time" 
                       class="time-input" 
                       value="${item.time}" 
                       data-index="${index}"
                       style="font-size: 18px; font-weight: 600; color: var(--accent-color); border: 2px solid var(--accent-color); border-radius: 6px; padding: 6px 12px; background: white; cursor: pointer;">
            </div>
            <div style="font-size: 16px; font-weight: 500; color: var(--primary-color); margin-bottom: 15px;">${item.title || ''}</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 15px;">
                ${formulasHTML}
            </div>
        </div>
    `;
}

// 渲染配方卡片（用于时间轴，支持点击更换和保存）
function renderFormulaCardForTimeline(formulaData, formula, timelineItemIndex) {
    if (!formula) return '';
    
    const oils = extractOils(formula);
    const usageType = USAGE_TYPE_MAP[formulaData.usageType] || formulaData.usageType;
    
    return `
        <div class="formula-card-timeline" 
             data-formula-id="${formula.id}"
             data-usage-type="${formulaData.usageType}"
             data-timeline-item-index="${timelineItemIndex}"
             data-formula-index="${formulaData.formulaIndex || 0}"
             style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%); border: 2px solid rgba(102, 126, 234, 0.2); border-radius: 12px; padding: 20px; transition: all 0.3s ease; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="font-size: 16px; font-weight: 600; color: var(--primary-color); flex: 1;">${formula.name}</div>
                <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: var(--accent-gradient); color: white; margin-left: 10px;">${usageType}</span>
            </div>
            ${formulaData.reason ? `<div style="font-size: 13px; color: var(--secondary-color); line-height: 1.6; margin-bottom: 12px;">${formulaData.reason}</div>` : ''}
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                ${oils.map(oil => `<span style="background: white; color: var(--accent-color); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; border: 1px solid var(--accent-color);">${oil}</span>`).join('')}
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn-save-formula" 
                        data-formula-id="${formula.id}"
                        onclick="event.stopPropagation(); saveFormulaToDatabase('${formula.id}');"
                        style="flex: 1; padding: 8px 12px; background: var(--accent-gradient); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.3s;">
                    保存到配方库
                </button>
                <button class="btn-change-formula" 
                        onclick="event.stopPropagation(); const card = this.closest('.formula-card-timeline'); const formulaId = card.dataset.formulaId; const usageType = card.dataset.usageType; const timelineItemIndex = parseInt(card.dataset.timelineItemIndex); const formulaIndex = parseInt(card.dataset.formulaIndex); showFormulaSelector(formulaId, usageType, timelineItemIndex, formulaIndex, card);"
                        style="flex: 1; padding: 8px 12px; background: white; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.3s;">
                    更换配方
                </button>
            </div>
        </div>
    `;
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

// 使用方式映射
const USAGE_TYPE_MAP = {
    'handcream': '护手霜',
    'bodylotion': '身体乳',
    'footbath': '泡脚/泡澡',
    'diffuser': '扩香',
    'spray': '喷雾'
};

// 拖拽状态管理
let dragState = {
    isDragging: false,
    dot: null,
    startY: 0,
    startIndex: 0,
    hasMoved: false
};

// 初始化时间轴交互功能（拖拽、双击删除、点击更换配方）
function initTimelineInteractions() {
    // 时间点拖拽功能
    const timelineDots = document.querySelectorAll('.timeline-dot');
    const clickTimers = new Map(); // 存储每个dot的点击计时器
    
    timelineDots.forEach(dot => {
        const dotIndex = parseInt(dot.dataset.index);
        
        dot.addEventListener('mousedown', (e) => {
            dragState.isDragging = true;
            dragState.dot = dot;
            dragState.startY = e.clientY;
            dragState.startIndex = dotIndex;
            dragState.hasMoved = false;
            dot.style.cursor = 'grabbing';
            e.preventDefault();
            e.stopPropagation();
        });
        
        dot.addEventListener('click', (e) => {
            // 如果发生了拖拽，不触发双击删除
            if (dragState.hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            const timer = clickTimers.get(dotIndex);
            if (!timer) {
                // 第一次点击，设置计时器
                const newTimer = setTimeout(() => {
                    clickTimers.delete(dotIndex);
                }, 300);
                clickTimers.set(dotIndex, newTimer);
            } else {
                // 第二次点击（双击），删除时间点
                clearTimeout(timer);
                clickTimers.delete(dotIndex);
                e.preventDefault();
                e.stopPropagation();
                deleteTimelineItem(dotIndex);
            }
        });
    });
    
    // 全局鼠标移动事件（只添加一次）
    if (!document.hasAttribute('data-timeline-drag-initialized')) {
        document.setAttribute('data-timeline-drag-initialized', 'true');
        
        document.addEventListener('mousemove', (e) => {
            if (!dragState.isDragging || !dragState.dot) return;
            
            const container = document.getElementById('timeline-container');
            if (!container) return;
            
            const containerRect = container.getBoundingClientRect();
            const relativeY = e.clientY - containerRect.top;
            
            // 标记已移动
            if (Math.abs(e.clientY - dragState.startY) > 5) {
                dragState.hasMoved = true;
            }
            
            // 找到最近的时间点位置
            const items = container.querySelectorAll('.timeline-item');
            let targetIndex = dragState.startIndex;
            
            items.forEach((item, index) => {
                const itemRect = item.getBoundingClientRect();
                const itemTop = itemRect.top - containerRect.top;
                const itemCenter = itemTop + itemRect.height / 2;
                if (relativeY > itemTop - 30 && relativeY < itemTop + itemRect.height + 30) {
                    targetIndex = relativeY < itemCenter ? index : index + 1;
                }
            });
            
            // 限制范围
            targetIndex = Math.max(0, Math.min(targetIndex, items.length - 1));
            
            // 更新位置（视觉反馈）
            if (targetIndex !== dragState.startIndex && items[targetIndex]) {
                const targetItem = items[targetIndex];
                const targetRect = targetItem.getBoundingClientRect();
                dragState.dot.style.top = (targetRect.top - containerRect.top + 5) + 'px';
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!dragState.isDragging || !dragState.dot) return;
            
            dragState.isDragging = false;
            dragState.dot.style.cursor = 'move';
            
            // 计算最终位置并重新排序
            const container = document.getElementById('timeline-container');
            if (!container) return;
            
            const containerRect = container.getBoundingClientRect();
            const relativeY = e.clientY - containerRect.top;
            
            const items = Array.from(container.querySelectorAll('.timeline-item'));
            let targetIndex = dragState.startIndex;
            
            items.forEach((item, index) => {
                const itemRect = item.getBoundingClientRect();
                const itemTop = itemRect.top - containerRect.top;
                const itemCenter = itemTop + itemRect.height / 2;
                if (relativeY > itemTop - 30 && relativeY < itemTop + itemRect.height + 30) {
                    targetIndex = relativeY < itemCenter ? index : index + 1;
                }
            });
            
            targetIndex = Math.max(0, Math.min(targetIndex, items.length - 1));
            
            if (targetIndex !== dragState.startIndex && dragState.hasMoved) {
                reorderTimelineItems(dragState.startIndex, targetIndex);
            }
            
            // 重置状态
            dragState.dot = null;
            dragState.hasMoved = false;
        });
    }
    
    // 时间输入框改变事件
    const timeInputs = document.querySelectorAll('.time-input');
    timeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            updateTimelineItemTime(index, e.target.value);
        });
    });
    
    // 配方卡片点击更换功能（移除，因为现在使用按钮）
    // 注意：点击更换配方按钮已经在HTML中通过onclick处理
}

// 删除时间点
function deleteTimelineItem(index) {
    if (!currentScenario || !currentScenario.timeline) return;
    
    if (confirm('确定要删除这个时间点吗？')) {
        currentScenario.timeline.splice(index, 1);
        renderTimelineScenario(currentScenario);
    }
}

// 重新排序时间点
function reorderTimelineItems(fromIndex, toIndex) {
    if (!currentScenario || !currentScenario.timeline) return;
    
    const item = currentScenario.timeline[fromIndex];
    currentScenario.timeline.splice(fromIndex, 1);
    currentScenario.timeline.splice(toIndex, 0, item);
    
    renderTimelineScenario(currentScenario);
}

// 更新时间点时间
function updateTimelineItemTime(index, newTime) {
    if (!currentScenario || !currentScenario.timeline || !currentScenario.timeline[index]) return;
    
    currentScenario.timeline[index].time = newTime;
    
    // 按时间排序
    currentScenario.timeline.sort((a, b) => {
        return a.time.localeCompare(b.time);
    });
    
    renderTimelineScenario(currentScenario);
}

// 显示配方选择器（用于更换配方）
function showFormulaSelector(currentFormulaId, usageType, timelineItemIndex, formulaIndex, cardElement) {
    // 修复参数传递
    const actualTimelineItemIndex = typeof timelineItemIndex === 'string' ? parseInt(timelineItemIndex) : timelineItemIndex;
    const actualFormulaIndex = typeof formulaIndex === 'string' ? parseInt(formulaIndex) : formulaIndex;
    // 获取同类型的其他配方
    const allFormulas = Object.values(FORMULA_DATABASE || {});
    const sameTypeFormulas = allFormulas.filter(formula => {
        const name = (formula.name || '').toLowerCase();
        const subtitle = (formula.subtitle || '').toLowerCase();
        const text = name + ' ' + subtitle;
        
        if (usageType === 'handcream') {
            return text.includes('护手霜') || text.includes('handcream');
        } else if (usageType === 'bodylotion') {
            return text.includes('身体乳') || text.includes('bodylotion');
        } else if (usageType === 'footbath') {
            return text.includes('泡脚') || text.includes('泡澡') || text.includes('footbath');
        } else if (usageType === 'diffuser') {
            return text.includes('扩香') || text.includes('diffuser');
        } else if (usageType === 'spray') {
            return text.includes('喷雾') || text.includes('spray');
        }
        return false;
    });
    
    if (sameTypeFormulas.length <= 1) {
        alert('没有其他同类型的配方可供选择');
        return;
    }
    
    // 创建选择器模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 20px; color: var(--primary-color);">选择配方</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            ${sameTypeFormulas.map(formula => {
                const isCurrent = formula.id === currentFormulaId;
                return `
                    <div class="formula-option" 
                         data-formula-id="${formula.id}"
                         style="padding: 15px; border: 2px solid ${isCurrent ? 'var(--accent-color)' : 'var(--border-color)'}; border-radius: 8px; cursor: pointer; transition: all 0.3s; ${isCurrent ? 'background: rgba(102, 126, 234, 0.1);' : ''}"
                         onmouseover="this.style.borderColor='var(--accent-color)'; this.style.transform='translateY(-2px)';"
                         onmouseout="this.style.borderColor='${isCurrent ? 'var(--accent-color)' : 'var(--border-color)'}'; this.style.transform='translateY(0)';">
                        <div style="font-weight: 600; margin-bottom: 8px; color: var(--primary-color);">${formula.name}</div>
                        <div style="font-size: 12px; color: var(--secondary-color);">${formula.subtitle || ''}</div>
                        ${isCurrent ? '<div style="margin-top: 8px; font-size: 11px; color: var(--accent-color);">当前使用</div>' : ''}
                    </div>
                `;
            }).join('')}
        </div>
        <button class="btn btn-outline" onclick="this.closest('.formula-selector-modal').remove()" style="width: 100%;">取消</button>
    `;
    
    modal.className = 'formula-selector-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 点击配方选项
    modalContent.querySelectorAll('.formula-option').forEach(option => {
        option.addEventListener('click', () => {
            const newFormulaId = option.dataset.formulaId;
            if (newFormulaId !== currentFormulaId) {
                replaceFormulaInTimeline(newFormulaId, usageType, actualTimelineItemIndex, actualFormulaIndex);
            }
            modal.remove();
        });
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 替换时间轴中的配方
function replaceFormulaInTimeline(newFormulaId, usageType, timelineItemIndex, formulaIndex) {
    if (!currentScenario || !currentScenario.timeline) return;
    
    const timelineItem = currentScenario.timeline[timelineItemIndex];
    if (!timelineItem || !timelineItem.formulas) return;
    
    if (formulaIndex >= 0 && formulaIndex < timelineItem.formulas.length) {
        timelineItem.formulas[formulaIndex].formulaId = newFormulaId;
        // 保持其他属性不变
        renderTimelineScenario(currentScenario);
        updateDailyUsageSafetyCheck();
    } else {
        console.warn('配方索引无效:', formulaIndex, '配方数量:', timelineItem.formulas.length);
    }
}

// 更新每日用量安全检验
function updateDailyUsageSafetyCheck() {
    if (!currentScenario || typeof DailyUsageValidator === 'undefined') {
        return;
    }
    
    const container = document.getElementById('dailyUsageSafetyCheck');
    if (!container) return;
    
    // 计算场景的每日用量
    const usageData = DailyUsageValidator.calculateScenarioDailyUsage(currentScenario);
    
    // 生成安全评估卡片
    const safetyHTML = DailyUsageValidator.generateSafetyAssessmentCard(usageData, 0);
    
    container.innerHTML = `
        <h2 style="margin-bottom: 20px; color: var(--primary-color);">每日用量安全上限检验</h2>
        ${safetyHTML}
    `;
}

// 保存单个配方到私人配方库
function saveFormulaToDatabase(formulaId) {
    if (!formulaId || typeof FORMULA_DATABASE === 'undefined') {
        showSaveMessage('配方不存在', false);
        return false;
    }
    
    const formula = FORMULA_DATABASE[formulaId];
    if (!formula) {
        showSaveMessage('配方不存在', false);
        return false;
    }
    
    // 检查是否可以创建新配方（免费用户只能保存10个）
    if (typeof window.authSystem !== 'undefined' && window.authSystem.canCreateRecipe) {
        const canCreate = window.authSystem.canCreateRecipe();
        if (!canCreate) {
            const limits = window.authSystem.getUserLimits();
            const currentCount = window.authSystem.getUserRecipeCount();
            const isPremium = window.authSystem.isPremiumMember();
            if (!isPremium) {
                showSaveMessage(`免费用户最多只能保存${limits.maxRecipes}个配方。您当前已有${currentCount}个配方。升级为付费会员可保存无限配方。`, false);
                if (confirm('是否升级为付费会员以保存无限配方？')) {
                    window.location.href = 'payment.html?type=premium';
                }
                return false;
            }
        }
    }
    
    try {
        // 检查是否已保存
        if (typeof UnifiedDataManager !== 'undefined') {
            const existingRecipes = UnifiedDataManager.getAllRecipes();
            const alreadySaved = existingRecipes.some(r => r.sourceId === formulaId && r.source === 'formula-database');
            
            if (alreadySaved) {
                if (!confirm('此配方已保存过，是否再次保存（将创建新副本）？')) {
                    return false;
                }
            }
            
            // 转换为统一格式（使用formula-detail.js中的函数，如果存在）
            let recipe;
            if (typeof convertFormulaToRecipe === 'function') {
                recipe = convertFormulaToRecipe(formula);
            } else {
                // 降级方案：使用简化转换
                recipe = convertFormulaToRecipeSimple(formula);
            }
            
            // 评估安全性
            if (typeof SafetyEvaluator !== 'undefined') {
                const safety = SafetyEvaluator.evaluateSafety(recipe);
                recipe.safetyFlag = safety.level;
                
                if (safety.level === 'red' && !confirm('检测到超出安全上限：\n' + safety.message + '\n仍要保存吗？')) {
                    return false;
                }
            }
            
            // 保存
            UnifiedDataManager.addRecipe(recipe);
            showSaveMessage('配方已保存到"您的私人配方库"！', true);
            return true;
        } else if (typeof RecipeDB !== 'undefined') {
            // 回退到旧系统
            let recipe;
            if (typeof convertFormulaToRecipe === 'function') {
                recipe = convertFormulaToRecipe(formula);
            } else {
                recipe = convertFormulaToRecipeSimple(formula);
            }
            RecipeDB.addRecipe(recipe);
            showSaveMessage('配方已保存到"您的私人配方库"！', true);
            return true;
        } else {
            showSaveMessage('保存失败：数据管理器未加载', false);
            return false;
        }
    } catch (error) {
        console.error('保存配方失败:', error);
        showSaveMessage('保存失败：' + error.message, false);
        return false;
    }
}

// 简化版配方转换函数（当formula-detail.js未加载时使用）
function convertFormulaToRecipeSimple(formula) {
    const oils = [];
    let totalDrops = 0;
    let totalMl = 0;
    
    // 提取精油信息
    formula.ingredients.forEach(ing => {
        if (ing.name && ing.name.includes('精油')) {
            const oilName = ing.name.replace('精油', '').trim();
            if (oilName) {
                const dropsMatch = ing.amount.match(/(\d+)\s*滴/);
                let drops = null;
                if (dropsMatch) {
                    drops = parseInt(dropsMatch[1]);
                    totalDrops += drops;
                }
                oils.push({
                    name: oilName,
                    amount: drops ? drops + '滴' : ing.amount,
                    note: '',
                    drops: drops
                });
                if (drops) {
                    totalMl += drops * 0.05;
                }
            }
        }
    });
    
    // 提取基底信息
    let carrier = '';
    let total = null;
    formula.ingredients.forEach(ing => {
        if (ing.name && !ing.name.includes('精油')) {
            if (ing.name.includes('护手霜') || ing.name.includes('身体乳') || ing.name.includes('基底')) {
                carrier = ing.name;
                const totalMatch = ing.amount.match(/(\d+(?:\.\d+)?)\s*(g|ml)/i);
                if (totalMatch) {
                    total = parseFloat(totalMatch[1]);
                }
            }
        }
    });
    
    // 确定介质类型
    const name = (formula.name || '').toLowerCase();
    const subtitle = (formula.subtitle || '').toLowerCase();
    const text = name + ' ' + subtitle;
    let baseType = 'base-oil';
    if (text.includes('护手霜') || text.includes('handcream')) baseType = 'handcream';
    else if (text.includes('身体乳') || text.includes('bodylotion')) baseType = 'bodylotion';
    else if (text.includes('泡脚') || text.includes('泡澡') || text.includes('footbath')) baseType = 'footbath';
    else if (text.includes('扩香') || text.includes('diffuser')) baseType = 'diffuser';
    else if (text.includes('喷雾') || text.includes('spray')) baseType = 'spray';
    
    // 计算浓度
    let dilution = null;
    if (total && totalMl > 0) {
        dilution = (totalMl / total) * 100;
    }
    
    let recipeName = formula.name.replace(/配方/g, '').trim();
    recipeName = recipeName.replace(/\s+/g, ' ').trim();
    
    return {
        id: crypto.randomUUID(),
        name: recipeName,
        purpose: formula.subtitle || '',
        total: total,
        baseAmount: total,
        dilution: dilution,
        concentration: dilution,
        carrier: carrier,
        solvent: '',
        mediumType: baseType,
        baseType: baseType,
        notes: '',
        oils: oils,
        totalDrops: totalDrops > 0 ? totalDrops : null,
        totalMl: totalMl > 0 ? parseFloat(totalMl.toFixed(2)) : null,
        source: 'formula-database',
        sourceId: formula.id,
        updatedAt: new Date().toISOString()
    };
}

// 保存所有配方到私人配方库
function saveAllFormulasToDatabase() {
    if (!currentScenario || !currentScenario.timeline) {
        showSaveMessage('没有可保存的配方', false);
        return false;
    }
    
    // 收集所有配方ID（去重）
    const formulaIds = new Set();
    currentScenario.timeline.forEach(item => {
        if (item.formulas) {
            item.formulas.forEach(formulaData => {
                if (formulaData.formulaId) {
                    formulaIds.add(formulaData.formulaId);
                }
            });
        }
    });
    
    if (formulaIds.size === 0) {
        showSaveMessage('没有可保存的配方', false);
        return false;
    }
    
    // 检查是否可以创建新配方
    const limits = typeof window.authSystem !== 'undefined' ? window.authSystem.getUserLimits() : { maxRecipes: Infinity };
    const currentCount = typeof window.authSystem !== 'undefined' ? window.authSystem.getUserRecipeCount() : 0;
    const isPremium = typeof window.authSystem !== 'undefined' ? window.authSystem.isPremiumMember() : false;
    
    if (!isPremium && limits.maxRecipes !== Infinity) {
        const remaining = limits.maxRecipes - currentCount;
        if (formulaIds.size > remaining) {
            showSaveMessage(`免费用户最多只能保存${limits.maxRecipes}个配方。您当前已有${currentCount}个配方，剩余${remaining}个位置。无法保存${formulaIds.size}个配方。`, false);
            if (confirm('是否升级为付费会员以保存无限配方？')) {
                window.location.href = 'payment.html?type=premium';
            }
            return false;
        }
    }
    
    // 确认保存
    if (!confirm(`确定要将方案中的 ${formulaIds.size} 个配方保存到"您的私人配方库"吗？`)) {
        return false;
    }
    
    // 保存所有配方
    let successCount = 0;
    let failCount = 0;
    
    formulaIds.forEach(formulaId => {
        if (saveFormulaToDatabase(formulaId)) {
            successCount++;
        } else {
            failCount++;
        }
    });
    
    if (successCount > 0) {
        showSaveMessage(`成功保存 ${successCount} 个配方到"您的私人配方库"${failCount > 0 ? `，${failCount} 个保存失败` : ''}`, true);
    } else {
        showSaveMessage('保存失败', false);
    }
    
    return successCount > 0;
}

// 显示保存消息
function showSaveMessage(message, isSuccess) {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isSuccess ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    
    // 添加动画样式（如果还没有）
    if (!document.getElementById('save-message-style')) {
        const style = document.createElement('style');
        style.id = 'save-message-style';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// 页面加载时渲染
document.addEventListener('DOMContentLoaded', async function() {
    const questionnaireData = getQuestionnaireData();
    
    if (!questionnaireData) {
        const container = document.getElementById('personalizedTimeline');
        if (container) {
            container.innerHTML = `
                <div class="formula-box" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                    <h2 style="color: white; border: none; padding: 0; margin-top: 0;">个性化芳疗体验</h2>
                    <p style="font-size: 16px; margin-bottom: 20px; opacity: 0.95;">
                        请先完成健康问卷以获取个性化时间轴方案
                    </p>
                    <a href="health-profile.html" class="btn btn-primary" 
                       style="background: white; color: #667eea; text-decoration: none; display: inline-block;">
                        前往填写问卷
                    </a>
                </div>
            `;
        }
        return;
    }
    
    // 生成时间轴场景
    const scenario = await generateTimelineScenario(questionnaireData);
    if (scenario) {
        renderTimelineScenario(scenario);
    }
});
