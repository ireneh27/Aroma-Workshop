// 配方详情页面逻辑

// 介质类型映射（与formula-library.js保持一致）
const BASE_TYPE_MAP = {
    'handcream': {
        name: '护手霜',
        class: 'base-type-handcream',
        keywords: ['护手霜', 'handcream']
    },
    'bodylotion': {
        name: '身体乳',
        class: 'base-type-bodylotion',
        keywords: ['身体乳', 'bodylotion']
    },
    'footbath': {
        name: '泡脚/泡澡',
        class: 'base-type-footbath',
        keywords: ['泡脚', '泡澡', 'footbath', 'bath']
    },
    'diffuser': {
        name: '扩香',
        class: 'base-type-diffuser',
        keywords: ['扩香', 'diffuser']
    },
    'spray': {
        name: '喷雾',
        class: 'base-type-spray',
        keywords: ['喷雾', 'spray']
    }
};

function renderFormulaDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const formulaId = urlParams.get('id');
    
    if (!formulaId) {
        document.getElementById('formulaDetailContent').innerHTML = `
            <div style="text-align: center; padding: 50px 20px;">
                <h2>配方未找到</h2>
                <p>请从配方库中选择一个配方查看详情。</p>
                <a href="formula-library.html" class="btn btn-primary">返回配方库</a>
            </div>
        `;
        return;
    }
    
    const formula = FORMULA_DATABASE[formulaId];
    if (!formula) {
        document.getElementById('formulaDetailContent').innerHTML = `
            <div style="text-align: center; padding: 50px 20px;">
                <h2>配方未找到</h2>
                <p>配方ID: ${formulaId} 不存在。</p>
                <a href="formula-library.html" class="btn btn-primary">返回配方库</a>
            </div>
        `;
        return;
    }
    
    // 提取精油名称和类别信息
    const oils = [];
    formula.ingredients.forEach(ing => {
        if (ing.name.includes('精油')) {
            const oilName = ing.name.replace('精油', '').trim();
            if (oilName && !oils.includes(oilName)) {
                oils.push(oilName);
            }
        }
    });
    
    // 获取介质类型
    const baseType = getFormulaBaseType(formula);
    const baseTypeInfo = BASE_TYPE_MAP[baseType] || BASE_TYPE_MAP['handcream'];
    
    // 生成精油标签HTML，根据精油的第一个类别设置背景颜色
    const oilTagsHtml = oils.map(oil => {
        let backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // 默认颜色
        let textColor = 'white';
        
        // 获取精油信息
        if (typeof ESSENTIAL_OILS_DB !== 'undefined' && ESSENTIAL_OILS_DB[oil]) {
            const oilInfo = ESSENTIAL_OILS_DB[oil];
            // 如果有类别属性，取第一个类别
            if (oilInfo.types && oilInfo.types.length > 0 && typeof OIL_TYPES !== 'undefined') {
                const firstType = oilInfo.types[0];
                const typeInfo = OIL_TYPES[firstType];
                if (typeInfo && typeInfo.color) {
                    backgroundColor = typeInfo.color;
                    textColor = 'white'; // 类别标签使用白色文字
                }
            }
        }
        
        return `<a href="oil-detail.html?oil=${encodeURIComponent(oil)}" class="oil-tag-large" style="background: ${backgroundColor}; color: ${textColor}; text-decoration: none; display: inline-block;">${oil}</a>`;
    }).join('');
    
    // 构建详细HTML
    let html = `
        <div class="formula-detail-header">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <span class="base-type-badge ${baseTypeInfo.class}" style="display: inline-block;">${baseTypeInfo.name}</span>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="saveFormulaToDatabase(FORMULA_DATABASE['${formula.id}'])" 
                            class="btn btn-primary" 
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(102, 126, 234, 0.3)';">
                        + 保存配方
                    </button>
                </div>
            </div>
            <h1 class="formula-detail-title">${formula.name}</h1>
            <p class="formula-detail-subtitle">${formula.subtitle || ''}</p>
            <div class="oil-tags-section">
                ${oilTagsHtml}
            </div>
        </div>
        
        <div class="formula-detail-content">
            <h3>配方组成</h3>
            <ul class="ingredient-list">
                ${formula.ingredients.map(ing => 
                    `<li><span>${ing.name}</span><span>${ing.amount}</span></li>`
                ).join('')}
            </ul>
            
            <div class="usage-box">
                <strong>使用方法:</strong><br>
                ${formula.usage || '请参考详细说明'}
            </div>
            
            <div class="usage-box">
                <strong>作用原理:</strong><br>
                ${formula.principle || '请参考详细说明'}
            </div>
            
            <div class="info-box">
                ${formula.concentration ? `<strong>配方浓度:</strong> ${formula.concentration} (安全范围:≤3%)<br>` : ''}
                <strong>${formula.dailyAmount ? (formula.dailyAmount.includes('不计入') ? '说明' : '日均精油量') : '说明'}:</strong> ${formula.dailyAmount || '请参考详细说明'}
                ${formula.concentration ? `<br><strong>保存期限:</strong> ${getSavePeriod(formula)}` : ''}
            </div>
            
            ${getCautionInfo(formula) ? `
            <div class="warning-box">
                <strong>注意事项:</strong><br>
                ${getCautionInfo(formula)}
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('formulaDetailContent').innerHTML = html;
    
    // 更新页面标题
    document.title = `${formula.name} - 个性化芳疗方案`;
    
    // 记录到使用历史
    if (typeof window.authSystem !== 'undefined' && window.authSystem.isUserLoggedIn()) {
        window.authSystem.addToHistory(formula.id, formula.name);
    }
}

// 获取保存期限
function getSavePeriod(formula) {
    const baseType = getFormulaBaseType(formula);
    if (baseType === 'spray') {
        return '制作后3个月内用完,避光保存,使用前摇匀';
    } else if (baseType === 'handcream') {
        return '制作后1个月内用完,避光保存';
    } else if (baseType === 'bodylotion') {
        return '制作后2-3个月内用完,避光保存';
    } else if (baseType === 'footbath' || baseType === 'diffuser') {
        return '现调现用,不可储存';
    }
    return '制作后1-3个月内用完,避光保存';
}

// 获取注意事项信息
function getCautionInfo(formula) {
    const cautions = [];
    const oils = extractOils(formula);
    
    // 根据精油添加注意事项
    oils.forEach(oil => {
        if (oil.includes('佛手柑')) {
            cautions.push('佛手柑具光敏性,使用后12小时内避免日晒。');
        }
        if (oil.includes('雪松')) {
            cautions.push('雪松孕期禁用。');
        }
        if (oil.includes('迷迭香')) {
            cautions.push('迷迭香孕期禁用。高血压患者慎用。癫痫患者禁用。');
        }
        if (oil.includes('艾草') || oil.includes('甜茴香')) {
            cautions.push('孕期禁用。');
        }
        if (oil.includes('中国肉桂') || oil.includes('姜')) {
            cautions.push('刺激性强,敏感肌需先做皮肤测试。');
        }
        if (oil.includes('依兰依兰')) {
            cautions.push('浓度过高可能引起头痛,如出现不适请减少用量。');
        }
        if (oil.includes('欧薄荷')) {
            cautions.push('可能影响睡眠,避免睡前使用。');
        }
    });
    
    // 根据配方类型添加注意事项
    if (formula.id && (formula.id.includes('formula-g') || formula.id.includes('formula-h') || formula.id.includes('formula-i'))) {
        cautions.push('仅限女性经期使用。');
    }
    
    return cautions.length > 0 ? cautions.join(' ') : null;
}

// 获取配方的介质类型（复用formula-library.js中的函数）
function getFormulaBaseType(formula) {
    const name = formula.name.toLowerCase();
    const subtitle = (formula.subtitle || '').toLowerCase();
    const ingredients = formula.ingredients.map(ing => ing.name.toLowerCase()).join(' ');
    const allText = (name + ' ' + subtitle + ' ' + ingredients).toLowerCase();
    
    for (const [type, info] of Object.entries(BASE_TYPE_MAP)) {
        if (info.keywords.some(keyword => allText.includes(keyword))) {
            return type;
        }
    }
    
    if (formula.id) {
        if (formula.id.includes('formula-a') || formula.id.includes('formula-u') || formula.id.includes('formula-v')) {
            return 'handcream';
        }
        if (formula.id.includes('formula-d') || formula.id.includes('formula-e') || formula.id.includes('formula-g') || 
            formula.id.includes('formula-i') || formula.id.includes('formula-j') || formula.id.includes('formula-k') ||
            formula.id.includes('formula-l') || formula.id.includes('formula-m') || formula.id.includes('formula-n') ||
            formula.id.includes('formula-q') || formula.id.includes('formula-r') || formula.id.includes('formula-s') ||
            formula.id.includes('formula-t') || formula.id.includes('formula-w')) {
            return 'bodylotion';
        }
        if (formula.id.includes('formula-c') || formula.id.includes('formula-f') || formula.id.includes('formula-h') ||
            formula.id.includes('formula-o') || formula.id.includes('formula-p') || formula.id.includes('formula-q1') ||
            formula.id.includes('formula-r1') || formula.id.includes('formula-s1')) {
            return 'footbath';
        }
        if (formula.id.includes('formula-b')) {
            return 'diffuser';
        }
        if (formula.id.includes('formula-x')) {
            return 'spray';
        }
    }
    
    return 'handcream';
}

// 提取精油名称（复用formula-library.js中的函数）
function extractOils(formula) {
    const oils = [];
    formula.ingredients.forEach(ing => {
        if (ing.name.includes('精油')) {
            const oilName = ing.name.replace('精油', '').trim();
            if (oilName && !oils.includes(oilName)) {
                oils.push(oilName);
            }
        }
    });
    return oils;
}

// 将FORMULA_DATABASE格式转换为统一配方格式（优化版）
function convertFormulaToRecipe(formula) {
    const baseType = getFormulaBaseType(formula);
    const baseTypeInfo = BASE_TYPE_MAP[baseType] || BASE_TYPE_MAP['handcream'];
    
    // 提取精油信息（优化：提取滴数和毫升数）
    const oils = [];
    let totalDrops = 0;
    let totalMl = 0;
    
    formula.ingredients.forEach(ing => {
        if (ing.name.includes('精油')) {
            const oilName = ing.name.replace('精油', '').trim();
            if (oilName) {
                // 提取滴数
                let drops = null;
                let amount = '';
                const dropsMatch = ing.amount.match(/(\d+)\s*滴/);
                if (dropsMatch) {
                    drops = parseInt(dropsMatch[1]);
                    totalDrops += drops;
                    amount = drops + '滴';
                } else {
                    amount = ing.amount;
                }
                
                // 提取毫升数（如果存在）
                let ml = null;
                const mlMatch = ing.amount.match(/约\s*(\d+(?:\.\d+)?)\s*ml/);
                if (mlMatch) {
                    ml = parseFloat(mlMatch[1]);
                    totalMl += ml;
                } else if (drops) {
                    // 如果没有明确标注，按1滴≈0.05ml计算
                    ml = drops * 0.05;
                    totalMl += ml;
                }
                
                oils.push({
                    name: oilName,
                    amount: drops || amount, // 与formula-builder格式一致：amount存储滴数
                    note: '', // 与formula-builder格式一致
                    drops: drops // 保留滴数字段
                });
            }
        }
    });
    
    // 提取基底信息（优化：更全面的识别）
    let carrier = '';
    let solvent = '';
    let total = null;
    let baseAmount = null;
    
    formula.ingredients.forEach(ing => {
        if (!ing.name.includes('精油')) {
            const ingName = ing.name.toLowerCase();
            const ingAmount = ing.amount.toLowerCase();
            
            // 识别载体（护手霜、身体乳等）
            if (ingName.includes('护手霜') || ingName.includes('身体乳') || 
                ingName.includes('基底') || ingName.includes('基础')) {
                carrier = ing.name;
                
                // 提取总量（支持g、ml、kg等单位）
                const totalMatch = ingAmount.match(/(\d+(?:\.\d+)?)\s*(g|ml|kg|g)?/i);
                if (totalMatch) {
                    const value = parseFloat(totalMatch[1]);
                    const unit = (totalMatch[2] || '').toLowerCase();
                    if (unit === 'g' || unit === 'kg' || !unit) {
                        // 如果是g或kg，转换为ml（假设密度≈1）
                        total = value;
                        baseAmount = value;
                    } else if (unit === 'ml') {
                        total = value;
                        baseAmount = value;
                    }
                }
            }
            // 识别溶剂（纯露、乙醇等）
            else if (ingName.includes('玫瑰') && (ingName.includes('纯露') || ingName.includes('水'))) {
                solvent = ing.name;
                const totalMatch = ingAmount.match(/(\d+(?:\.\d+)?)\s*(ml|g)?/i);
                if (totalMatch) {
                    total = parseFloat(totalMatch[1]);
                    baseAmount = total;
                }
            }
            else if (ingName.includes('乙醇') || ingName.includes('酒精') || ingName.includes('双脱醛')) {
                solvent = ing.name;
                const totalMatch = ingAmount.match(/(\d+(?:\.\d+)?)\s*(ml|g)?/i);
                if (totalMatch) {
                    total = parseFloat(totalMatch[1]);
                    baseAmount = total;
                }
            }
            // 识别乳化剂（如荷荷巴油）
            else if (ingName.includes('荷荷巴') || ingName.includes('乳化剂')) {
                if (!carrier && !solvent) {
                    carrier = ing.name;
                }
                const totalMatch = ingAmount.match(/(\d+(?:\.\d+)?)\s*(ml|g)?/i);
                if (totalMatch && !total) {
                    total = parseFloat(totalMatch[1]);
                    baseAmount = total;
                }
            }
            // 识别热水（泡脚用）
            else if (ingName.includes('热水') || ingName.includes('温水')) {
                // 泡脚配方不需要记录总量
                if (baseType === 'footbath') {
                    carrier = '热水';
                }
            }
        }
    });
    
    // 计算浓度（优化：优先使用配方中的浓度，否则计算）
    let dilution = null;
    if (formula.concentration) {
        dilution = parseFloat(formula.concentration.replace('%', '').replace('浓度', '').trim());
    } else if (total && totalMl > 0) {
        // 如果没有明确浓度，根据精油总量和基底总量计算
        dilution = (totalMl / total) * 100;
    } else if (baseAmount && totalDrops > 0) {
        // 使用滴数计算（1滴≈0.05ml）
        const totalMlFromDrops = totalDrops * 0.05;
        dilution = (totalMlFromDrops / baseAmount) * 100;
    }
    
    // 创建统一格式配方（与formula-builder格式一致）
    // 删除名称中的"配方"两字，并清理多余空格
    let recipeName = formula.name.replace(/配方/g, '').trim();
    // 清理可能出现的多余空格（如"配方 A"变成"A"后可能有多余空格）
    recipeName = recipeName.replace(/\s+/g, ' ').trim();
    
    const recipe = {
        id: crypto.randomUUID(),
        name: recipeName,
        purpose: formula.subtitle || '', // 用途：仅保存subtitle内容
        total: total,
        baseAmount: baseAmount || total,
        dilution: dilution,
        concentration: dilution, // 兼容字段
        carrier: carrier,
        solvent: solvent,
        mediumType: baseType,
        baseType: baseType,
        notes: '', // 备注：留空，避免与purpose重复显示
        oils: oils,
        totalDrops: totalDrops > 0 ? totalDrops : null,
        totalMl: totalMl > 0 ? parseFloat(totalMl.toFixed(2)) : null,
        source: 'formula-database',
        sourceId: formula.id,
        updatedAt: new Date().toISOString()
    };
    
    return recipe;
}

// 保存配方到私人配方库
function saveFormulaToDatabase(formula) {
    try {
        // 检查是否已保存
        if (typeof UnifiedDataManager !== 'undefined') {
            const existingRecipes = UnifiedDataManager.getAllRecipes();
            const alreadySaved = existingRecipes.some(r => r.sourceId === formula.id && r.source === 'formula-database');
            
            if (alreadySaved) {
                if (!confirm('此配方已保存过，是否再次保存（将创建新副本）？')) {
                    return false;
                }
            }
            
            // 转换为统一格式
            const recipe = convertFormulaToRecipe(formula);
            
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
            
            // 显示成功消息
            showSaveMessage('配方已保存到"您的私人配方库"！', true);
            return true;
        } else if (typeof RecipeDB !== 'undefined') {
            // 回退到旧系统
            const recipe = convertFormulaToRecipe(formula);
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

// 显示保存消息
function showSaveMessage(message, isSuccess) {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${isSuccess ? '#d1ecf1' : '#f8d7da'};
        color: ${isSuccess ? '#0c5460' : '#721c24'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    
    // 添加动画样式
    if (!document.getElementById('save-message-styles')) {
        const style = document.createElement('style');
        style.id = 'save-message-styles';
        style.textContent = `
            @keyframes slideInRight {
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
        messageDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// 页面加载时渲染
document.addEventListener('DOMContentLoaded', function() {
    renderFormulaDetail();
    
    // 将保存函数暴露到全局，供按钮调用
    window.saveFormulaToDatabase = function(formula) {
        return saveFormulaToDatabase(formula);
    };
});

