// 配方库页面逻辑 - 显示Card和跳转

// 介质类型映射
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

// 获取配方的介质类型
function getFormulaBaseType(formula) {
    const name = formula.name.toLowerCase();
    const subtitle = (formula.subtitle || '').toLowerCase();
    const ingredients = formula.ingredients.map(ing => ing.name.toLowerCase()).join(' ');
    const allText = (name + ' ' + subtitle + ' ' + ingredients).toLowerCase();
    
    // 检查关键词（优先级最高）
    for (const [type, info] of Object.entries(BASE_TYPE_MAP)) {
        if (info.keywords.some(keyword => allText.includes(keyword))) {
            return type;
        }
    }
    
    // 根据配方ID推断（向后兼容）
    if (formula.id) {
        // 护手霜配方 - A系列
        if (formula.id.match(/^formula-a[0-9]*$/) || formula.id === 'formula-a' || 
            formula.id === 'formula-u' || formula.id === 'formula-v') {
            return 'handcream';
        }
        // 身体乳配方 - B系列
        if (formula.id.match(/^formula-b[0-9]+$/) || // B系列编号（B14-B21等）
            formula.id === 'formula-d' || formula.id === 'formula-e' ||
            formula.id === 'formula-g' || formula.id === 'formula-i' ||
            formula.id === 'formula-j' || formula.id === 'formula-k' ||
            formula.id === 'formula-l' || formula.id === 'formula-m' ||
            formula.id === 'formula-n' || formula.id === 'formula-q' ||
            formula.id === 'formula-r' || formula.id === 'formula-s' ||
            formula.id === 'formula-t' || formula.id === 'formula-w') {
            return 'bodylotion';
        }
        // 泡脚/泡澡配方 - C系列
        if (formula.id.match(/^formula-c[0-9]*$/) || formula.id === 'formula-c' ||
            formula.id === 'formula-f' || formula.id === 'formula-h' ||
            formula.id === 'formula-o' || formula.id === 'formula-p' || 
            formula.id === 'formula-q1' || formula.id === 'formula-r1' || formula.id === 'formula-s1') {
            return 'footbath';
        }
        // 扩香配方 - D系列
        if (formula.id.match(/^formula-d[0-9]*$/) || // D系列编号（D6-D10等）
            formula.id === 'formula-b' || formula.id.match(/^formula-b[0-5]$/)) { // formula-b和b1-b5是扩香
            return 'diffuser';
        }
        // 喷雾配方 - E系列
        if (formula.id.match(/^formula-e[0-9]*$/) || // E系列编号（E6等）
            formula.id.match(/^formula-x[0-9]*$/) || formula.id === 'formula-x') { // formula-x系列是喷雾
            return 'spray';
        }
    }
    
    return 'handcream'; // 默认
}

// 提取精油名称
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

// 渲染单个配方Card
function renderFormulaCard(formula) {
    const baseType = getFormulaBaseType(formula);
    const baseTypeInfo = BASE_TYPE_MAP[baseType] || BASE_TYPE_MAP['handcream'];
    const oils = extractOils(formula);
    
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
        
        return `<a href="oil-detail.html?oil=${encodeURIComponent(oil)}" class="oil-tag" style="background: ${backgroundColor}; color: ${textColor}; text-decoration: none; display: inline-block;">${oil}</a>`;
    }).join('');
    
    return `
        <div style="position: relative; background: white; border-radius: 12px; padding: 20px; box-shadow: var(--shadow); transition: var(--transition); height: 100%;">
            <a href="formula-detail.html?id=${formula.id}" style="text-decoration: none; color: inherit; display: block;">
                <div class="formula-card-header">
                    <div style="flex: 1;">
                        <span class="base-type-badge ${baseTypeInfo.class}">${baseTypeInfo.name}</span>
                        <div class="formula-card-title">${formula.name}</div>
                        <div class="formula-card-subtitle">${formula.subtitle || ''}</div>
                    </div>
                </div>
                <div class="formula-card-tags">
                    ${oilTagsHtml}
                </div>
            </a>
            <button onclick="event.stopPropagation(); event.preventDefault(); saveFormulaFromLibrary('${formula.id}');" 
                    class="save-formula-btn"
                    style="position: absolute; top: 10px; right: 10px; background: rgba(102, 126, 234, 0.9); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; z-index: 10; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                    onmouseover="this.style.background='rgba(102, 126, 234, 1)'; this.style.transform='scale(1.05)';"
                    onmouseout="this.style.background='rgba(102, 126, 234, 0.9)'; this.style.transform='scale(1)';"
                    title="保存到私人配方库">
                +
            </button>
        </div>
    `;
}

// 渲染所有配方
function renderAllFormulas() {
    const formulas = Object.values(FORMULA_DATABASE);
    const grids = {
        handcream: document.getElementById('handcream-grid'),
        bodylotion: document.getElementById('bodylotion-grid'),
        footbath: document.getElementById('footbath-grid'),
        diffuser: document.getElementById('diffuser-grid'),
        spray: document.getElementById('spray-grid')
    };
    
    // 清空所有网格
    Object.values(grids).forEach(grid => {
        if (grid) grid.innerHTML = '';
    });
    
    // 按介质分类渲染
    formulas.forEach(formula => {
        const baseType = getFormulaBaseType(formula);
        const grid = grids[baseType];
        if (grid) {
            grid.innerHTML += renderFormulaCard(formula);
        }
    });
}

// 统一的筛选状态管理
const UnifiedFilterState = {
    searchTerm: '',
    baseTypeFilter: 'all',
    selectedOils: [],
    baseTypeSelect: 'all',
    
    // 检查是否使用高级筛选（精油或基底类型选择器）
    isUsingAdvancedFilter() {
        return this.selectedOils.length > 0 || (this.baseTypeSelect && this.baseTypeSelect !== 'all');
    },
    
    // 重置所有筛选
    reset() {
        this.searchTerm = '';
        this.baseTypeFilter = 'all';
        this.selectedOils = [];
        this.baseTypeSelect = 'all';
    }
};

// 统一的筛选函数
function applyUnifiedFilter() {
    const formulas = Object.values(FORMULA_DATABASE);
    const state = UnifiedFilterState;
    
    // 筛选配方
    const filtered = formulas.filter(formula => {
        // 1. 检查搜索条件
        if (state.searchTerm) {
            const searchText = (formula.name + ' ' + (formula.subtitle || '') + ' ' + 
                formula.ingredients.map(ing => ing.name).join(' ')).toLowerCase();
            if (!searchText.includes(state.searchTerm.toLowerCase())) {
                return false;
            }
        }
        
        // 2. 检查介质类型筛选按钮
        const formulaBaseType = getFormulaBaseType(formula);
        if (state.baseTypeFilter !== 'all' && state.baseTypeFilter !== formulaBaseType) {
            return false;
        }
        
        // 3. 检查基底类型选择器（高级筛选）
        if (state.baseTypeSelect && state.baseTypeSelect !== 'all') {
            if (formulaBaseType !== state.baseTypeSelect) {
                return false;
            }
        }
        
        // 4. 检查精油筛选（高级筛选）
        if (state.selectedOils && state.selectedOils.length > 0) {
            const formulaOils = formula.ingredients
                .filter(ing => ing.name.includes('精油'))
                .map(ing => ing.name.replace('精油', '').trim());
            if (!state.selectedOils.every(oil => formulaOils.includes(oil))) {
                return false;
            }
        }
        
        return true;
    });
    
    // 根据是否使用高级筛选决定显示方式
    if (state.isUsingAdvancedFilter()) {
        // 使用高级筛选：显示筛选结果区域
        renderFilteredResults(filtered);
    } else {
        // 使用基础筛选：显示分类网格
        renderCategoryGrids(filtered);
    }
    
    // 更新结果计数
    updateResultCount(filtered.length);
}

// 渲染筛选结果（高级筛选模式）
function renderFilteredResults(formulas) {
    const container = document.getElementById('filteredFormulas');
    const categorySections = document.querySelectorAll('.category-section');
    
    // 隐藏分类区域
    categorySections.forEach(section => section.style.display = 'none');
    
    if (!container) return;
    
    if (formulas.length === 0) {
        container.innerHTML = `
            <div class="formula-box" style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 12px;">
                <p style="font-size: 18px; color: var(--secondary-color); margin: 0;">
                    😔 没有找到匹配的配方
                </p>
                <p style="font-size: 14px; color: var(--secondary-color); margin-top: 10px;">
                    请尝试调整筛选条件
                </p>
            </div>
        `;
        container.style.display = 'block';
        return;
    }
    
    // 按基底类型分组
    const grouped = {};
    formulas.forEach(formula => {
        const baseType = getFormulaBaseType(formula) || 'other';
        if (!grouped[baseType]) {
            grouped[baseType] = [];
        }
        grouped[baseType].push(formula);
    });
    
    let html = '';
    
    // 按基底类型顺序显示
    Object.entries(BASE_TYPE_MAP).forEach(([key, baseTypeInfo]) => {
        if (grouped[key] && grouped[key].length > 0) {
            html += `
                <div style="margin: 40px 0;">
                    <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; color: var(--primary-color);">
                        <span>${baseTypeInfo.name}基底配方 (${grouped[key].length}个)</span>
                    </h3>
                    <div class="formula-grid">
            `;
            
            grouped[key].forEach(formula => {
                html += renderFormulaCard(formula);
            });
            
            html += `</div></div>`;
        }
    });
    
    // 其他类型
    if (grouped.other && grouped.other.length > 0) {
        html += `
            <div style="margin: 40px 0;">
                <h3 style="margin-bottom: 20px; color: var(--primary-color);">其他配方 (${grouped.other.length}个)</h3>
                <div class="formula-grid">
        `;
        grouped.other.forEach(formula => {
            html += renderFormulaCard(formula);
        });
        html += `</div></div>`;
    }
    
    container.innerHTML = html;
    container.style.display = 'block';
}

// 渲染分类网格（基础筛选模式）
function renderCategoryGrids(formulas) {
    const container = document.getElementById('filteredFormulas');
    const categorySections = document.querySelectorAll('.category-section');
    const grids = {
        handcream: document.getElementById('handcream-grid'),
        bodylotion: document.getElementById('bodylotion-grid'),
        footbath: document.getElementById('footbath-grid'),
        diffuser: document.getElementById('diffuser-grid'),
        spray: document.getElementById('spray-grid')
    };
    
    // 隐藏筛选结果区域
    if (container) {
        container.style.display = 'none';
    }
    
    // 显示分类区域
    categorySections.forEach(section => section.style.display = 'block');
    
    // 清空所有网格
    Object.values(grids).forEach(grid => {
        if (grid) grid.innerHTML = '';
    });
    
    // 按介质分类渲染
    formulas.forEach(formula => {
        const baseType = getFormulaBaseType(formula);
        const grid = grids[baseType];
        if (grid) {
            grid.innerHTML += renderFormulaCard(formula);
        }
    });
    
    // 隐藏空的分类
    Object.entries(grids).forEach(([type, grid]) => {
        const section = document.querySelector(`[data-category="${type}"]`);
        if (section && grid) {
            if (grid.innerHTML.trim() === '') {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        }
    });
}

// 更新结果计数
function updateResultCount(count) {
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = count;
    }
}

// 搜索和筛选功能
function initSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // 筛选按钮事件
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            UnifiedFilterState.baseTypeFilter = btn.dataset.filter;
            
            // 同步基底类型选择器
            const baseTypeSelect = document.getElementById('baseTypeSelect');
            if (baseTypeSelect) {
                if (btn.dataset.filter === 'all') {
                    baseTypeSelect.value = 'all';
                    UnifiedFilterState.baseTypeSelect = 'all';
                } else {
                    baseTypeSelect.value = btn.dataset.filter;
                    UnifiedFilterState.baseTypeSelect = btn.dataset.filter;
                }
            }
            
            applyUnifiedFilter();
        });
    });
    
    // 搜索输入事件
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            UnifiedFilterState.searchTerm = e.target.value;
            applyUnifiedFilter();
        });
    }
}

// 保存配方函数（供按钮调用）
function saveFormulaFromLibrary(formulaId) {
    if (typeof FORMULA_DATABASE === 'undefined' || !FORMULA_DATABASE[formulaId]) {
        alert('配方数据未找到');
        return;
    }
    
    const formula = FORMULA_DATABASE[formulaId];
    
    // 使用与formula-detail.js相同的转换和保存逻辑
    if (typeof window.saveFormulaToDatabase === 'function') {
        window.saveFormulaToDatabase(formula);
    } else {
        // 如果formula-detail.js未加载，使用本地实现
        saveFormulaToDatabaseLocal(formula);
    }
}

// 本地保存实现（与formula-detail.js中的逻辑相同）
function saveFormulaToDatabaseLocal(formula) {
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
            
            // 转换为统一格式（复用formula-detail.js的逻辑）
            const recipe = convertFormulaToRecipeLocal(formula);
            
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
            showSaveMessageLocal('配方已保存到"您的私人配方库"！', true);
            return true;
        } else if (typeof RecipeDB !== 'undefined') {
            const recipe = convertFormulaToRecipeLocal(formula);
            RecipeDB.addRecipe(recipe);
            showSaveMessageLocal('配方已保存到"您的私人配方库"！', true);
            return true;
        } else {
            showSaveMessageLocal('保存失败：数据管理器未加载', false);
            return false;
        }
    } catch (error) {
        console.error('保存配方失败:', error);
        showSaveMessageLocal('保存失败：' + error.message, false);
        return false;
    }
}

// 转换函数（与formula-detail.js中的优化逻辑相同）
function convertFormulaToRecipeLocal(formula) {
    const baseType = getFormulaBaseType(formula);
    
    // 提取精油信息（优化：提取滴数和毫升数）
    const oils = [];
    let totalDrops = 0;
    let totalMl = 0;
    
    formula.ingredients.forEach(ing => {
        if (ing.name.includes('精油')) {
            const oilName = ing.name.replace('精油', '').trim();
            if (oilName) {
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
                
                let ml = null;
                const mlMatch = ing.amount.match(/约\s*(\d+(?:\.\d+)?)\s*ml/);
                if (mlMatch) {
                    ml = parseFloat(mlMatch[1]);
                    totalMl += ml;
                } else if (drops) {
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
            
            if (ingName.includes('护手霜') || ingName.includes('身体乳') || 
                ingName.includes('基底') || ingName.includes('基础')) {
                carrier = ing.name;
                const totalMatch = ingAmount.match(/(\d+(?:\.\d+)?)\s*(g|ml|kg|g)?/i);
                if (totalMatch) {
                    const value = parseFloat(totalMatch[1]);
                    total = value;
                    baseAmount = value;
                }
            }
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
            else if (ingName.includes('热水') || ingName.includes('温水')) {
                if (baseType === 'footbath') {
                    carrier = '热水';
                }
            }
        }
    });
    
    // 计算浓度
    let dilution = null;
    if (formula.concentration) {
        dilution = parseFloat(formula.concentration.replace('%', '').replace('浓度', '').trim());
    } else if (total && totalMl > 0) {
        dilution = (totalMl / total) * 100;
    } else if (baseAmount && totalDrops > 0) {
        const totalMlFromDrops = totalDrops * 0.05;
        dilution = (totalMlFromDrops / baseAmount) * 100;
    }
    
    // 创建统一格式配方（与formula-builder格式一致）
    // 删除名称中的"配方"两字，并清理多余空格
    let recipeName = formula.name.replace(/配方/g, '').trim();
    // 清理可能出现的多余空格（如"配方 A"变成"A"后可能有多余空格）
    recipeName = recipeName.replace(/\s+/g, ' ').trim();
    
    return {
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
}

// 显示保存消息
function showSaveMessageLocal(message, isSuccess) {
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
    
    if (!document.getElementById('save-message-styles')) {
        const style = document.createElement('style');
        style.id = 'save-message-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待 FORMULA_DATABASE 加载
    const checkDatabase = setInterval(() => {
        if (typeof FORMULA_DATABASE !== 'undefined' && Object.keys(FORMULA_DATABASE).length > 0) {
            clearInterval(checkDatabase);
            initSearchAndFilter();
            // 初始应用统一筛选（显示所有配方）
            applyUnifiedFilter();
        }
    }, 100);
    
    // 10秒后停止检查（防止无限等待）
    setTimeout(() => clearInterval(checkDatabase), 10000);
    
    // 暴露保存函数到全局
    window.saveFormulaFromLibrary = saveFormulaFromLibrary;
});

