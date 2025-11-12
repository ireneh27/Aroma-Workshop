// 从精油库获取精油列表（如果可用，否则使用备用列表）
let essentialOils = [];

// 当前配方
let currentFormula = [];

// 当前编辑的配方ID（用于保存时更新而不是新建）
let editingRecipeId = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从精油库加载精油列表
    if (typeof getAllOils === 'function') {
        const allOils = getAllOils();
        essentialOils = allOils.map(oil => ({
            name: oil.name,
            latin: oil.latin,
            caution: oil.caution || '安全性高',
            maxConcentration: oil.maxConcentration || 3
        }));
    } else {
        // 备用列表（如果精油库未加载）
        essentialOils = [
            { name: '野地薰衣草', latin: 'Lavandula angustifolia', caution: '孕早期慎用', maxConcentration: 5 },
            { name: '中国肉桂', latin: 'Cinnamomum cassia', caution: '刺激性强,需低浓度使用(≤0.1%),孕期禁用,敏感肌慎用', maxConcentration: 0.1 },
            { name: '艾草', latin: 'Artemisia argyi', caution: '孕期禁用', maxConcentration: 2 },
            { name: '依兰依兰', latin: 'Cananga odorata', caution: '浓度过高可能引起头痛,易致敏', maxConcentration: 0.8 },
            { name: '佛手柑', latin: 'Citrus bergamia', caution: '光敏性精油,使用后12小时内避免日晒', maxConcentration: 0.4 },
            { name: '丝柏', latin: 'Cupressus sempervirens', caution: '孕期慎用', maxConcentration: 2 },
            { name: '雪松', latin: 'Cedrus atlantica', caution: '孕期禁用', maxConcentration: 2 },
            { name: '乳香', latin: 'Boswellia carterii', caution: '安全性高,孕早期慎用', maxConcentration: 2 },
            { name: '甜茴香', latin: 'Foeniculum vulgare', caution: '孕期禁用,癫痫患者禁用,不宜长期高浓度使用', maxConcentration: 2.5 },
            { name: '迷迭香', latin: 'Rosmarinus officinalis', caution: '孕期禁用,高血压患者慎用,癫痫患者禁用', maxConcentration: 3 },
            { name: '广藿香', latin: 'Pogostemon cablin', caution: '安全性高', maxConcentration: 3 },
            { name: '姜', latin: 'Zingiber officinale', caution: '刺激性较强,敏感肌需低浓度使用', maxConcentration: 1 },
            { name: '玫瑰', latin: 'Rosa damascena', caution: '安全性高,孕期慎用', maxConcentration: 1 },
            { name: '檀香', latin: 'Santalum album', caution: '安全性高', maxConcentration: 2 },
            { name: '天竺葵', latin: 'Pelargonium graveolens', caution: '安全性高,孕期慎用', maxConcentration: 2 },
            { name: '甜橙', latin: 'Citrus sinensis', caution: '轻微光敏性', maxConcentration: 2 },
            { name: '欧薄荷', latin: 'Mentha piperita', caution: '孕期哺乳期慎用,婴幼儿禁用,可能影响睡眠', maxConcentration: 5.4 }
        ];
    }
    
    // 按名称排序
    essentialOils.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    
    // 填充精油选择下拉框
    const oilSelect = document.getElementById('oilSelect');
    if (oilSelect) {
        essentialOils.forEach((oil, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${oil.name} (${oil.latin})`;
            oilSelect.appendChild(option);
        });
    }

    // 等待依赖脚本加载完成后再加载配方
    // 检查是否有待编辑的配方（从配方库跳转过来）
    waitForDependenciesAndLoadRecipe();

    // 加载已保存的配方
    loadSavedFormulas();
});

// 备用加载机制：如果 DOMContentLoaded 已经触发，立即尝试加载
// 如果页面已经加载完成，也尝试加载一次
if (document.readyState === 'loading') {
    // DOMContentLoaded 尚未触发，等待它
} else {
    // DOMContentLoaded 已经触发或页面已完全加载
    setTimeout(() => {
        waitForDependenciesAndLoadRecipe();
    }, 100);
}

// 页面完全加载后的备用检查
window.addEventListener('load', function() {
    // 如果还没有加载配方，再尝试一次
    setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        const pendingEdit = localStorage.getItem('pendingRecipeEdit');
        
        if ((editId || pendingEdit) && editingRecipeId === null && currentFormula.length === 0) {
            console.log('页面完全加载后检测到待编辑配方，尝试加载...');
            waitForDependenciesAndLoadRecipe();
        }
    }, 500);
});

// 等待依赖脚本加载完成后加载配方
function waitForDependenciesAndLoadRecipe() {
    let attempts = 0;
    const maxAttempts = 50; // 最多等待5秒（50 * 100ms）
    
    const checkAndLoad = setInterval(() => {
        attempts++;
        
        // 检查必要的依赖是否已加载
        const hasUnifiedDataManager = typeof UnifiedDataManager !== 'undefined';
        const hasRecipeDB = typeof RecipeDB !== 'undefined';
        const dependenciesReady = hasUnifiedDataManager || hasRecipeDB;
        
        // 如果依赖已加载，或者已经尝试足够多次，则尝试加载配方
        if (dependenciesReady || attempts >= maxAttempts) {
            clearInterval(checkAndLoad);
            
            // 延迟一小段时间确保所有初始化完成
            setTimeout(() => {
                loadRecipeFromDatabase();
            }, 100);
        }
    }, 100);
}

// 从配方库加载配方到配方实验器
function loadRecipeFromDatabase() {
    try {
        // 检查 URL 参数
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        
        // 检查 localStorage
        const pendingEdit = localStorage.getItem('pendingRecipeEdit');
        
        let recipe = null;
        let recipeId = null;
        
        if (editId) {
            // 从 URL 参数获取配方ID
            recipeId = editId;
            
            // 尝试从统一数据管理器获取
            if (typeof UnifiedDataManager !== 'undefined') {
                try {
                    UnifiedDataManager.init(); // 确保已初始化
                    recipe = UnifiedDataManager.getRecipe(recipeId);
                } catch (e) {
                    console.warn('从 UnifiedDataManager 获取配方失败:', e);
                }
            }
            
            // 如果还没找到，尝试从 RecipeDB 获取
            if (!recipe && typeof RecipeDB !== 'undefined') {
                try {
                    recipe = RecipeDB.getRecipe(recipeId);
                } catch (e) {
                    console.warn('从 RecipeDB 获取配方失败:', e);
                }
            }
            
            // 如果还没找到，尝试从 savedFormulas 获取（兼容旧数据）
            if (!recipe) {
                try {
                    const savedFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
                    const foundFormula = savedFormulas.find(f => f.id == editId || f.id === editId);
                    if (foundFormula) {
                        // 转换为配方库格式
                        recipe = {
                            id: foundFormula.id,
                            name: foundFormula.name,
                            baseType: foundFormula.baseType,
                            mediumType: foundFormula.baseType,
                            total: foundFormula.baseAmount,
                            baseAmount: foundFormula.baseAmount,
                            dilution: foundFormula.concentration,
                            concentration: foundFormula.concentration,
                            oils: foundFormula.ingredients.map(ing => ({
                                name: ing.name,
                                amount: ing.drops,
                                drops: ing.drops,
                                note: ing.caution,
                                latin: ing.latin
                            }))
                        };
                    }
                } catch (e) {
                    console.warn('从 savedFormulas 获取配方失败:', e);
                }
            }
        } else if (pendingEdit) {
            // 从 localStorage 获取
            try {
                const editData = JSON.parse(pendingEdit);
                recipeId = editData.recipeId;
                recipe = editData.recipe;
                
                // 清除 localStorage 中的数据
                localStorage.removeItem('pendingRecipeEdit');
            } catch (e) {
                console.error('解析 pendingRecipeEdit 失败:', e);
                localStorage.removeItem('pendingRecipeEdit');
                showMessage('加载配方数据失败，请重试', 'error');
                return;
            }
        }
        
        if (!recipe) {
            // 没有待编辑的配方，静默返回
            return;
        }
        
        // 验证配方数据完整性
        if (!recipe.name) {
            console.warn('配方缺少名称');
            recipe.name = '未命名配方';
        }
        
        if (!recipe.oils || !Array.isArray(recipe.oils) || recipe.oils.length === 0) {
            showMessage('配方中没有精油数据，无法加载', 'warning');
            return;
        }
        
        // 确保精油列表已加载
        if (essentialOils.length === 0) {
            console.warn('精油列表未加载，延迟加载配方');
            setTimeout(() => loadRecipeFromDatabase(), 200);
            return;
        }
        
        // 设置编辑ID
        editingRecipeId = recipeId;
        
        // 转换配方格式并加载
        loadRecipeFromDatabaseFormat(recipe);
        
        // 显示编辑模式提示
        showEditModeIndicator(recipe.name);
        
        // 显示提示消息
        setTimeout(() => {
            showMessage(`已加载配方 "${recipe.name}"，您可以在此进行修改`, 'success');
        }, 300);
        
        // 清除 URL 参数（可选，保持页面干净）
        if (editId) {
            setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 500);
        }
        
    } catch (error) {
        console.error('加载配方失败:', error);
        showMessage('加载配方失败：' + (error.message || '未知错误'), 'error');
    }
}

// 显示编辑模式指示器
function showEditModeIndicator(recipeName) {
    // 移除现有的指示器
    const existingIndicator = document.getElementById('edit-mode-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // 创建编辑模式指示器
    const indicator = document.createElement('div');
    indicator.id = 'edit-mode-indicator';
    indicator.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        animation: slideIn 0.3s ease-out;
    `;
    indicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div>
                <div style="font-weight: 600; font-size: 14px;">编辑模式</div>
                <div style="font-size: 12px; opacity: 0.9;">正在编辑配方：${recipeName}</div>
            </div>
        </div>
        <button onclick="exitEditMode()" style="
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
           onmouseout="this.style.background='rgba(255,255,255,0.2)'">退出编辑</button>
    `;
    
    // 插入到配方构建器顶部
    const builder = document.getElementById('formula-builder');
    if (builder) {
        builder.insertBefore(indicator, builder.firstChild);
    }
}

// 退出编辑模式
function exitEditMode() {
    editingRecipeId = null;
    const indicator = document.getElementById('edit-mode-indicator');
    if (indicator) {
        indicator.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => indicator.remove(), 300);
    }
    
    // 清空当前配方
    currentFormula = [];
    const formulaNameInput = document.getElementById('formulaName');
    if (formulaNameInput) formulaNameInput.value = '';
    updateFormulaDisplay();
    
    showMessage('已退出编辑模式', 'info');
}

// 将配方库格式的配方加载到配方实验器
function loadRecipeFromDatabaseFormat(recipe) {
    // 清空当前配方
    currentFormula = [];
    
    // 转换介质类型
    const baseType = recipe.mediumType || recipe.baseType || 'base-oil';
    const baseTypeSelect = document.getElementById('baseType');
    if (baseTypeSelect) {
        baseTypeSelect.value = baseType;
    }
    
    // 转换总量
    const baseAmount = recipe.baseAmount || recipe.total || 50;
    const baseAmountInput = document.getElementById('baseAmount');
    if (baseAmountInput) {
        baseAmountInput.value = baseAmount;
    }
    
    // 转换配方名称
    const formulaNameInput = document.getElementById('formulaName');
    if (formulaNameInput) {
        formulaNameInput.value = recipe.name || '';
    }
    
    // 转换精油列表
    if (recipe.oils && Array.isArray(recipe.oils)) {
        recipe.oils.forEach(oilData => {
            if (!oilData.name) return;
            
            // 查找精油在 essentialOils 数组中的索引（支持模糊匹配）
            let oilIndex = essentialOils.findIndex(o => o.name === oilData.name);
            
            // 如果精确匹配失败，尝试从精油数据库获取完整信息
            if (oilIndex < 0 && typeof getAllOils === 'function') {
                const allOils = getAllOils();
                const fullOilInfo = allOils.find(o => o.name === oilData.name);
                
                if (fullOilInfo) {
                    // 找到完整信息，添加到 essentialOils 数组
                    const newIndex = essentialOils.length;
                    essentialOils.push({
                        name: fullOilInfo.name,
                        latin: fullOilInfo.latin || '',
                        caution: fullOilInfo.caution || oilData.note || '安全性高',
                        maxConcentration: fullOilInfo.maxConcentration || 3
                    });
                    
                    // 更新下拉框
                    const oilSelect = document.getElementById('oilSelect');
                    if (oilSelect) {
                        const option = document.createElement('option');
                        option.value = newIndex;
                        option.textContent = `${fullOilInfo.name}${fullOilInfo.latin ? ' (' + fullOilInfo.latin + ')' : ''}`;
                        oilSelect.appendChild(option);
                    }
                    
                    oilIndex = newIndex;
                }
            }
            
            if (oilIndex >= 0) {
                // 找到精油，添加到配方
                const oil = essentialOils[oilIndex];
                const drops = parseFloat(oilData.drops || oilData.amount) || 1;
                
                currentFormula.push({
                    index: oilIndex,
                    name: oil.name,
                    latin: oil.latin || '',
                    caution: oilData.note || oil.caution || '安全性高',
                    maxConcentration: oil.maxConcentration || 3,
                    drops: drops
                });
            } else {
                // 未找到精油，尝试添加（使用基本信息）
                console.warn(`未找到精油 "${oilData.name}" 的完整信息，使用基本信息`);
                const newIndex = essentialOils.length;
                essentialOils.push({
                    name: oilData.name,
                    latin: oilData.latin || '',
                    caution: oilData.note || '安全性高',
                    maxConcentration: 3
                });
                
                // 更新下拉框
                const oilSelect = document.getElementById('oilSelect');
                if (oilSelect) {
                    const option = document.createElement('option');
                    option.value = newIndex;
                    option.textContent = oilData.name + (oilData.latin ? ' (' + oilData.latin + ')' : '');
                    oilSelect.appendChild(option);
                }
                
                const drops = parseFloat(oilData.drops || oilData.amount) || 1;
                currentFormula.push({
                    index: newIndex,
                    name: oilData.name,
                    latin: oilData.latin || '',
                    caution: oilData.note || '安全性高',
                    maxConcentration: 3,
                    drops: drops
                });
            }
        });
    }
    
    // 更新显示
    updateFormulaDisplay();
    calculateSummary();
    
    // 滚动到配方构建器
    const builder = document.getElementById('formula-builder');
    if (builder) {
        setTimeout(() => {
            builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// 添加精油
function addOil() {
    const oilSelect = document.getElementById('oilSelect');
    if (!oilSelect) {
        showMessage('无法找到精油选择器', 'error');
        return;
    }
    
    const selectedValue = oilSelect.value;
    if (!selectedValue || selectedValue === '') {
        showMessage('请先选择一种精油', 'warning');
        oilSelect.focus();
        return;
    }
    
    const oilIndex = parseInt(selectedValue);
    
    if (isNaN(oilIndex) || oilIndex < 0 || oilIndex >= essentialOils.length) {
        showMessage('请先选择一种精油', 'warning');
        oilSelect.focus();
        return;
    }

    const oil = essentialOils[oilIndex];
    if (!oil) {
        showMessage('选择的精油不存在', 'error');
        return;
    }
    
    // 检查是否已添加（允许添加不同的精油）
    const existingOil = currentFormula.find(item => item.index === oilIndex);
    if (existingOil) {
        showMessage(`该精油（${oil.name}）已在配方中，请调整滴数或选择其他精油`, 'warning');
        oilSelect.focus();
        // 高亮显示已存在的精油项
        setTimeout(() => {
            const ingredientItems = document.querySelectorAll('.ingredient-item');
            ingredientItems.forEach((item, idx) => {
                if (currentFormula[idx] && currentFormula[idx].index === oilIndex) {
                    item.style.background = 'rgba(245, 158, 11, 0.1)';
                    item.style.border = '2px solid var(--warning-color)';
                    setTimeout(() => {
                        item.style.background = '';
                        item.style.border = '';
                    }, 2000);
                }
            });
        }, 100);
        return;
    }

    // 检查配方中精油数量（建议2-5种）
    if (currentFormula.length >= 5) {
        if (!confirm(`配方中已有${currentFormula.length}种精油，继续添加可能会影响配方效果。是否继续添加？`)) {
            return;
        }
    }

    // 添加到配方
    currentFormula.push({
        index: oilIndex,
        name: oil.name,
        latin: oil.latin,
        caution: oil.caution,
        maxConcentration: oil.maxConcentration,
        drops: 1
    });

    // 更新显示
    updateFormulaDisplay();
    
    // 重置选择器
    oilSelect.value = '';
    oilSelect.selectedIndex = 0;
    
    showMessage(`已添加 ${oil.name}（当前配方共${currentFormula.length}种精油）`, 'success');
    
    // 滚动到新添加的成分
    setTimeout(() => {
        const lastItem = document.querySelector('.ingredient-item:last-child');
        if (lastItem) {
            lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // 高亮新添加的精油
            lastItem.style.background = 'rgba(16, 185, 129, 0.1)';
            lastItem.style.border = '2px solid var(--success-color)';
            setTimeout(() => {
                lastItem.style.background = '';
                lastItem.style.border = '';
            }, 1500);
        }
    }, 100);
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 移除现有消息
    const existingMsg = document.getElementById('formula-message');
    if (existingMsg) {
        existingMsg.remove();
    }

    const msgDiv = document.createElement('div');
    msgDiv.id = 'formula-message';
    msgDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    const colors = {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#667eea'
    };
    
    msgDiv.style.background = colors[type] || colors.info;
    msgDiv.textContent = message;
    
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// 更新配方显示
function updateFormulaDisplay() {
    const ingredientsList = document.getElementById('ingredientsList');
    const emptyState = document.getElementById('emptyState');
    const formulaSummary = document.getElementById('formulaSummary');
    const safetyCheck = document.getElementById('safetyCheck');

    if (!ingredientsList) return;

    if (currentFormula.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (formulaSummary) formulaSummary.style.display = 'none';
        if (safetyCheck) safetyCheck.style.display = 'none';
        // 确保emptyState存在
        if (!emptyState || !ingredientsList.contains(emptyState)) {
            const emptyDiv = document.createElement('div');
            emptyDiv.id = 'emptyState';
            emptyDiv.className = 'empty-state';
            emptyDiv.textContent = '还没有添加精油，请从上方选择并添加';
            ingredientsList.innerHTML = '';
            ingredientsList.appendChild(emptyDiv);
        }
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (formulaSummary) formulaSummary.style.display = 'block';

    // 显示成分列表 - 保留emptyState但隐藏它
    const existingEmptyState = ingredientsList.querySelector('#emptyState');
    ingredientsList.innerHTML = '';
    
    // 重新添加emptyState（隐藏状态）
    if (existingEmptyState) {
        existingEmptyState.style.display = 'none';
        ingredientsList.appendChild(existingEmptyState);
    } else {
        const emptyDiv = document.createElement('div');
        emptyDiv.id = 'emptyState';
        emptyDiv.className = 'empty-state';
        emptyDiv.style.display = 'none';
        emptyDiv.textContent = '还没有添加精油，请从上方选择并添加';
        ingredientsList.appendChild(emptyDiv);
    }
    
    // 添加所有配方成分
    currentFormula.forEach((item, idx) => {
        const oil = essentialOils[item.index];
        if (!oil) {
            console.warn(`配方中的精油索引 ${item.index} 无效`);
            return; // 安全检查
        }
        
        // 计算当前精油的浓度（用于显示）
        const baseAmount = parseFloat(document.getElementById('baseAmount')?.value) || 50;
        const oilMl = item.drops * 0.05;
        const oilConcentration = (oilMl / baseAmount) * 100;
        
        const ingredientDiv = document.createElement('div');
        ingredientDiv.className = 'ingredient-item';
        ingredientDiv.setAttribute('data-oil-index', item.index);
        ingredientDiv.innerHTML = `
            <div class="ingredient-info">
                <div class="ingredient-name">${item.name} <span style="font-size: 11px; color: var(--secondary-color); font-weight: normal;">(${item.drops}滴)</span></div>
                <div class="ingredient-details">${item.latin || ''} ${item.latin && oil.caution ? '·' : ''} ${oil.caution || '安全性高'}</div>
                <div style="font-size: 11px; color: var(--secondary-color); margin-top: 4px;">
                    浓度: ${oilConcentration.toFixed(2)}% | 上限: ${(() => {
                        // 获取实际的安全上限用于显示（优先使用安全评估器的值）
                        let displayMax = oil.maxConcentration;
                        if (typeof SafetyEvaluator !== 'undefined' && SafetyEvaluator.getOilCap) {
                            const safetyCap = SafetyEvaluator.getOilCap(oil.name);
                            if (typeof safetyCap === 'number' && safetyCap > 0) {
                                displayMax = safetyCap;
                            }
                        }
                        return displayMax;
                    })()}%
                </div>
            </div>
            <div class="ingredient-controls">
                <label style="font-size: 12px;">滴数:</label>
                <input type="number" class="drops-input" value="${item.drops}" min="1" max="20" 
                       onchange="updateDrops(${idx}, this.value)" 
                       oninput="updateDrops(${idx}, this.value)"
                       aria-label="调整 ${item.name} 的滴数">
                <button class="btn btn-danger btn-small" onclick="removeOil(${idx})" aria-label="删除 ${item.name}">删除</button>
            </div>
        `;
        ingredientsList.appendChild(ingredientDiv);
    });

    // 计算并显示摘要
    calculateSummary();
}

// 更新滴数
function updateDrops(index, value) {
    const drops = parseInt(value) || 1;
    const validDrops = Math.max(1, Math.min(20, drops));
    
    // 如果输入值超出范围，显示提示并修正
    if (drops !== validDrops) {
        // 找到对应的输入框并更新值
        const ingredientItems = document.querySelectorAll('.ingredient-item');
        if (ingredientItems[index]) {
            const input = ingredientItems[index].querySelector('.drops-input');
            if (input) {
                input.value = validDrops;
                showMessage(`滴数已调整为${validDrops}（范围：1-20滴）`, 'info');
            }
        }
    }
    
    currentFormula[index].drops = validDrops;
    calculateSummary();
    
    // 实时更新显示，提供即时反馈
    const ingredientItem = document.querySelectorAll('.ingredient-item')[index];
    if (ingredientItem) {
        ingredientItem.style.transition = 'all 0.3s';
        ingredientItem.style.transform = 'scale(1.02)';
        setTimeout(() => {
            ingredientItem.style.transform = 'scale(1)';
        }, 300);
    }
}

// 删除精油
function removeOil(index) {
    if (index < 0 || index >= currentFormula.length) {
        showMessage('无法删除，索引无效', 'error');
        return;
    }
    
    const removedOil = currentFormula[index];
    currentFormula.splice(index, 1);
    updateFormulaDisplay();
    calculateSummary();
    showMessage(`已移除 ${removedOil.name}`, 'info');
}

// 根据介质类型和总量计算使用天数
function calculateUsageDays(baseType, baseAmount) {
    // 根据制作指南中的使用周期计算
    // 使用周期基于平均使用量估算
    
    switch (baseType) {
        case 'handcream':
            // 护手霜：50g，使用周期约1个月（30天）
            // 假设使用量与总量成正比
            return Math.max(30, Math.round(baseAmount / 50 * 30));
            
        case 'bodylotion':
            // 身体乳：100-200g，使用周期约2-3个月（60-90天）
            // 取平均值：150g对应75天
            return Math.max(60, Math.round(baseAmount / 150 * 75));
            
        case 'base-oil':
            // 基础油（按摩油）：30-100ml，使用周期约3-6个月（90-180天）
            // 基础油（滚珠）：10-30ml，使用周期约1-2个月（30-60天）
            // 根据总量判断：小于30ml按滚珠计算，大于等于30ml按按摩油计算
            if (baseAmount < 30) {
                // 滚珠：10-30ml，30-60天
                return Math.max(30, Math.round(baseAmount / 20 * 45));
            } else {
                // 按摩油：30-100ml，90-180天
                return Math.max(90, Math.round(baseAmount / 65 * 135));
            }
            
        case 'footbath':
            // 泡脚/泡澡：每次现调，单次使用
            return 1;
            
        case 'spray':
            // 喷雾（水基）：30-100ml，使用周期约1-2个月（30-60天）
            return Math.max(30, Math.round(baseAmount / 65 * 45));
            
        case 'rosewater':
            // 玫瑰水/纯露：50-200ml，使用周期约1个月（30天）
            return Math.max(30, Math.round(baseAmount / 125 * 30));
            
        case 'alcohol':
            // 95%乙醇：10-100ml，使用周期约6-12个月（180-360天）
            return Math.max(180, Math.round(baseAmount / 55 * 270));
            
        case 'diffuser':
            // 扩香：单次使用
            return 1;
            
        default:
            // 默认：按基础油计算
            return Math.max(90, Math.round(baseAmount / 65 * 135));
    }
}

// 计算摘要
function calculateSummary() {
    const baseTypeSelect = document.getElementById('baseType');
    const baseType = baseTypeSelect ? baseTypeSelect.value : 'base-oil';
    const baseAmount = parseFloat(document.getElementById('baseAmount').value) || 50;
    const totalDrops = currentFormula.reduce((sum, item) => sum + item.drops, 0);
    const totalMl = totalDrops * 0.05; // 假设1滴 = 0.05ml
    
    // 不同基底类型的浓度计算
    let concentration;
    if (baseType === 'alcohol') {
        // 酒精基底通常可以承受更高浓度
        concentration = (totalMl / baseAmount) * 100;
    } else {
        // 基础油和玫瑰水使用标准浓度计算
        concentration = (totalMl / baseAmount) * 100;
    }

    document.getElementById('totalDrops').textContent = totalDrops;
    document.getElementById('totalMl').textContent = totalMl.toFixed(2);
    document.getElementById('concentration').textContent = concentration.toFixed(2) + '%';
    
    // 计算并显示每日用量（如果适用）
    const dailyUsageItem = document.getElementById('dailyUsageItem');
    const dailyUsageDisplay = document.getElementById('dailyUsage');
    if (baseType !== 'diffuser' && baseType !== 'alcohol') {
        const usageDays = calculateUsageDays(baseType, baseAmount);
        const dailyMl = usageDays > 0 ? totalMl / usageDays : totalMl;
        if (dailyUsageItem) dailyUsageItem.style.display = 'block';
        if (dailyUsageDisplay) {
            dailyUsageDisplay.textContent = `${dailyMl.toFixed(3)}ml/天`;
            dailyUsageDisplay.title = `总精油量${totalMl.toFixed(2)}ml，预计使用${usageDays}天`;
        }
    } else {
        if (dailyUsageItem) dailyUsageItem.style.display = 'none';
    }
    
    // 更新基底类型显示（包含安全上限信息）
    const baseTypeDisplay = document.getElementById('baseTypeDisplay');
    if (baseTypeDisplay) {
        let mediumName = '基础油';
        let maxConcentration = 3;
        
        if (typeof SafetyEvaluator !== 'undefined') {
            mediumName = SafetyEvaluator.getMediumName(baseType);
            maxConcentration = SafetyEvaluator.getMediumSafetyLimit(baseType);
        } else {
            const baseTypeNames = {
                'base-oil': '基础油',
                'handcream': '护手霜',
                'bodylotion': '身体乳',
                'rosewater': '玫瑰水',
                'alcohol': '95%乙醇',
                'footbath': '泡脚/泡澡',
                'spray': '喷雾',
                'diffuser': '扩香'
            };
            const mediumLimits = {
                'base-oil': 3,
                'handcream': 2,
                'bodylotion': 2,
                'rosewater': 1.5,
                'alcohol': 10,
                'footbath': 0.5,
                'spray': 3,
                'diffuser': 100
            };
            mediumName = baseTypeNames[baseType] || '基础油';
            maxConcentration = mediumLimits[baseType] || 3;
        }
        
        if (baseType === 'diffuser') {
            baseTypeDisplay.textContent = `${mediumName}（不计入皮肤接触量）`;
        } else {
            baseTypeDisplay.textContent = `${mediumName}（安全上限≤${maxConcentration}%）`;
        }
    }

    // 安全检查（根据基底类型调整）
    checkSafety(totalDrops, totalMl, concentration, baseType);
}

// 安全检查
function checkSafety(totalDrops, totalMl, concentration, baseType = 'base-oil') {
    const safetyCheck = document.getElementById('safetyCheck');
    const safetyStatus = document.getElementById('safetyStatus');
    let status = 'safe';
    let message = '配方安全';
    let warnings = [];
    
    // 根据介质类型调整安全阈值（优先使用安全评估器的配置）
    let maxConcentration = 3; // 默认3%
    let mediumName = '该介质';
    
    if (typeof SafetyEvaluator !== 'undefined') {
        maxConcentration = SafetyEvaluator.getMediumSafetyLimit(baseType);
        mediumName = SafetyEvaluator.getMediumName(baseType);
    } else {
        // 回退到旧逻辑
        const mediumLimits = {
            'alcohol': 10,
            'rosewater': 1.5,
            'handcream': 2,
            'bodylotion': 2,
            'footbath': 0.5,
            'spray': 3,
            'diffuser': 100,
            'base-oil': 3
        };
        const mediumNames = {
            'alcohol': '95%乙醇',
            'rosewater': '玫瑰水/纯露',
            'handcream': '护手霜',
            'bodylotion': '身体乳',
            'footbath': '泡脚/泡澡',
            'spray': '喷雾',
            'diffuser': '扩香',
            'base-oil': '基础油'
        };
        maxConcentration = mediumLimits[baseType] || 3;
        mediumName = mediumNames[baseType] || '该介质';
    }

    // 检查总浓度（扩香不计入皮肤接触量）
    if (baseType === 'diffuser') {
        // 扩香不计入皮肤接触量，只显示信息
        if (warnings.length === 0) {
            message = '扩香配方（不计入皮肤接触量）';
        }
    } else {
        if (concentration > maxConcentration) {
            status = 'danger';
            message = '浓度过高！';
            warnings.push(`总浓度 ${concentration.toFixed(2)}% 超过${mediumName}的安全范围(≤${maxConcentration}%)`);
        } else if (concentration > maxConcentration * 0.8) {
            status = 'warning';
            message = '浓度较高，请谨慎使用';
            warnings.push(`总浓度 ${concentration.toFixed(2)}% 接近${mediumName}的安全上限(≤${maxConcentration}%)`);
        }
    }

    // 检查每日用量（扩香和乙醇喷雾除外）
    // 根据介质类型和使用周期计算每日用量
    // 乙醇喷雾不直接接触皮肤，不计入皮肤接触量
    // 注意：配方实验器中，如果选择alcohol介质类型，通常用于喷雾，不计入皮肤接触量
    if (baseType !== 'diffuser' && baseType !== 'alcohol') {
        // 获取基底总量（用于计算使用天数）
        const baseAmountForCalc = parseFloat(document.getElementById('baseAmount')?.value) || 50;
        // 根据介质类型和总量计算使用天数
        const usageDays = calculateUsageDays(baseType, baseAmountForCalc);
        // 计算每日用量 = 总精油量 / 使用天数
        const dailyMl = usageDays > 0 ? totalMl / usageDays : totalMl;
        
        if (dailyMl > 0.6) {
            status = 'danger';
            if (message === '配方安全') message = '每日用量超标！';
            warnings.push(`每日精油用量 ${dailyMl.toFixed(3)}ml 超过安全上限(≤0.6ml)（总精油量${totalMl.toFixed(2)}ml，预计使用${usageDays}天）`);
        } else if (dailyMl > 0.5) {
            if (status !== 'danger') status = 'warning';
            warnings.push(`每日精油用量 ${dailyMl.toFixed(3)}ml 接近安全上限（总精油量${totalMl.toFixed(2)}ml，预计使用${usageDays}天）`);
        } else {
            // 显示每日用量信息（即使安全）
            if (warnings.length === 0 && message === '配方安全') {
                message = `配方安全（每日用量约${dailyMl.toFixed(3)}ml）`;
            }
        }
    } else if (baseType === 'alcohol') {
        // 乙醇喷雾不计入皮肤接触量，只显示信息
        if (warnings.length === 0 && message === '配方安全') {
            message = '乙醇配方（不计入皮肤接触量）';
        }
    }

    // 检查单个精油浓度（使用安全评估器的上限，如果可用）
    const baseAmount = parseFloat(document.getElementById('baseAmount').value) || 50;
    currentFormula.forEach(item => {
        const oil = essentialOils[item.index];
        if (!oil) return;
        
        const oilMl = item.drops * 0.05;
        const oilConcentration = (oilMl / baseAmount) * 100;
        
        // 优先使用安全评估器的上限
        let oilMaxConcentration = oil.maxConcentration;
        if (typeof SafetyEvaluator !== 'undefined' && SafetyEvaluator.getOilCap) {
            const safetyCap = SafetyEvaluator.getOilCap(oil.name);
            // 如果安全评估器返回 0，表示不建议皮肤应用，使用数据库中的值并添加警告
            if (typeof safetyCap === 'number' && safetyCap > 0) {
                oilMaxConcentration = safetyCap;
            } else if (typeof safetyCap === 'number' && safetyCap === 0) {
                // 安全上限为 0 表示不建议皮肤应用，但显示时使用数据库中的值
                // 安全检查时会单独处理这种情况
                oilMaxConcentration = oil.maxConcentration || 2;
            }
        }
        
        if (oilConcentration > oilMaxConcentration) {
            status = 'danger';
            if (message === '配方安全') {
                message = '浓度过高！';
            }
            warnings.push(`${item.name} 浓度 ${oilConcentration.toFixed(2)}% 超过其安全上限(${oilMaxConcentration}%)`);
        } else if (oilConcentration > oilMaxConcentration * 0.8) {
            if (status !== 'danger') {
                status = 'warning';
                if (message === '配方安全') {
                    message = '浓度较高，请谨慎使用';
                }
            }
            warnings.push(`${item.name} 浓度 ${oilConcentration.toFixed(2)}% 接近其安全上限(${oilMaxConcentration}%)`);
        }
    });

    // 确保消息和状态一致
    if (status === 'danger' && message === '配方安全') {
        message = '配方不安全！';
    } else if (status === 'warning' && message === '配方安全') {
        message = '请谨慎使用';
    }

    // 显示结果
    if (safetyStatus) {
        safetyStatus.textContent = message;
        safetyStatus.style.color = status === 'safe' ? 'var(--success-color)' : 
                                  status === 'warning' ? 'var(--warning-color)' : '#ef4444';
    }

    if (safetyCheck) {
        if (warnings.length > 0) {
            safetyCheck.style.display = 'block';
            safetyCheck.className = `safety-check ${status}`;
            safetyCheck.innerHTML = `
                <strong>${message}</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    ${warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            `;
        } else {
            safetyCheck.style.display = 'block';
            safetyCheck.className = 'safety-check safe';
            safetyCheck.innerHTML = `<strong>配方安全，可以安全使用</strong><br><span style="font-size: 12px; opacity: 0.8;">介质类型：${mediumName}（安全上限：≤${maxConcentration}%）</span>`;
        }
    }
}

// 清空配方
function clearFormula() {
    if (currentFormula.length === 0) {
        showMessage('当前配方已经是空的', 'info');
        return;
    }
    
    const confirmMessage = editingRecipeId 
        ? `确定要清空当前配方吗？这将退出编辑模式，未保存的更改将丢失。`
        : `确定要清空当前配方吗？当前配方包含${currentFormula.length}种精油，清空后无法恢复。`;
    
    if (confirm(confirmMessage)) {
        currentFormula = [];
        const formulaNameInput = document.getElementById('formulaName');
        if (formulaNameInput) formulaNameInput.value = '';
        
        // 如果处于编辑模式，退出编辑模式
        if (editingRecipeId) {
            exitEditMode();
        }
        
        updateFormulaDisplay();
        showMessage('配方已清空', 'info');
    }
}

// 保存配方
function saveFormula() {
    if (currentFormula.length === 0) {
        showMessage('请先添加精油到配方中', 'warning');
        return;
    }

    // 检查是否可以创建新配方（免费用户只能保存10个）
    // 如果是编辑现有配方（editingRecipeId存在），则不需要检查
    if (!editingRecipeId && typeof window.authSystem !== 'undefined' && window.authSystem.canCreateRecipe) {
        const canCreate = window.authSystem.canCreateRecipe();
        if (!canCreate) {
            const limits = window.authSystem.getUserLimits();
            const currentCount = window.authSystem.getUserRecipeCount();
            const isPremium = window.authSystem.isPremiumMember();
            if (!isPremium) {
                showMessage(`免费用户最多只能保存${limits.maxRecipes}个配方。您当前已有${currentCount}个配方。升级为付费会员可保存无限配方。`, 'error');
                if (confirm('是否升级为付费会员以保存无限配方？')) {
                    window.location.href = 'payment.html?type=premium';
                }
                return;
            }
        }
    }

    // 验证配方完整性（已在上面检查过，这里可以移除重复检查）

    const formulaNameInput = document.getElementById('formulaName');
    const formulaName = formulaNameInput ? formulaNameInput.value.trim() : '';
    const finalName = formulaName || `配方 ${new Date().toLocaleDateString('zh-CN')}`;
    
    const baseTypeSelect = document.getElementById('baseType');
    const baseType = baseTypeSelect ? baseTypeSelect.value : 'base-oil';
    const baseTypeNames = {
        'base-oil': '基础油',
        'handcream': '护手霜',
        'bodylotion': '身体乳',
        'rosewater': '玫瑰水',
        'alcohol': '95%乙醇',
        'footbath': '泡脚/泡澡',
        'spray': '喷雾',
        'diffuser': '扩香'
    };
    
    const baseAmountInput = document.getElementById('baseAmount');
    const baseAmount = baseAmountInput ? parseFloat(baseAmountInput.value) : 50;
    
    if (isNaN(baseAmount) || baseAmount <= 0) {
        showMessage('请输入有效的基底总量（必须大于0）', 'error');
        if (baseAmountInput) {
            baseAmountInput.focus();
            baseAmountInput.select();
        }
        return;
    }
    
    const totalDrops = currentFormula.reduce((sum, item) => sum + item.drops, 0);
    const totalMl = totalDrops * 0.05;
    const concentration = (totalMl / baseAmount) * 100;
    
    // 检查配方安全性（在保存前再次验证）
    const safetyCheck = document.getElementById('safetyCheck');
    if (safetyCheck && safetyCheck.classList.contains('danger')) {
        if (!confirm('当前配方存在安全风险，是否仍要保存？建议先调整配方以确保安全。')) {
            return;
        }
    }

    try {
        // 检查是否是编辑模式
        if (editingRecipeId) {
            // 编辑模式：更新现有配方
            let recipe = null;
            if (typeof UnifiedDataManager !== 'undefined') {
                recipe = UnifiedDataManager.getRecipe(editingRecipeId);
            } else if (typeof RecipeDB !== 'undefined') {
                recipe = RecipeDB.getRecipe(editingRecipeId);
            }
            
            if (recipe) {
                // 更新配方数据
                recipe.name = finalName;
                recipe.mediumType = baseType;
                recipe.baseType = baseType;
                recipe.total = baseAmount;
                recipe.baseAmount = baseAmount;
                recipe.dilution = concentration;
                recipe.concentration = concentration;
                recipe.oils = currentFormula.map(item => ({
                    name: item.name,
                    amount: item.drops,
                    drops: item.drops,
                    note: item.caution || '',
                    latin: item.latin || ''
                }));
                recipe.totalDrops = totalDrops;
                recipe.totalMl = totalMl;
                recipe.updatedAt = new Date().toISOString();
                
                // 保存更新
                let updateSuccess = false;
                if (typeof UnifiedDataManager !== 'undefined') {
                    try {
                    UnifiedDataManager.updateRecipe(recipe);
                        updateSuccess = true;
                    } catch (e) {
                        console.error('UnifiedDataManager 更新失败:', e);
                    }
                }
                
                if (!updateSuccess && typeof RecipeDB !== 'undefined') {
                    try {
                    RecipeDB.updateRecipe(recipe);
                        updateSuccess = true;
                    } catch (e) {
                        console.error('RecipeDB 更新失败:', e);
                    }
                }
                
                // 同步到 savedFormulas（向后兼容）
                try {
                    const savedFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
                    const oldFormulaIndex = savedFormulas.findIndex(f => f.id == editingRecipeId || f.id === editingRecipeId);
                    if (oldFormulaIndex >= 0) {
                        // 转换为旧格式并更新
                        const oldFormat = {
                            id: recipe.sourceId || recipe.id,
                            name: recipe.name,
                            date: new Date(recipe.updatedAt).toLocaleString('zh-CN'),
                            baseType: recipe.baseType || recipe.mediumType,
                            baseTypeName: baseTypeNames[recipe.baseType || recipe.mediumType] || '基础油',
                            baseAmount: recipe.baseAmount || recipe.total,
                            ingredients: recipe.oils.map(oil => ({
                                name: oil.name,
                                latin: oil.latin || '',
                                drops: oil.drops || oil.amount,
                                caution: oil.note || ''
                            })),
                            totalDrops: recipe.totalDrops || totalDrops,
                            totalMl: recipe.totalMl || totalMl,
                            concentration: recipe.concentration || recipe.dilution
                        };
                        savedFormulas[oldFormulaIndex] = oldFormat;
                        localStorage.setItem('savedFormulas', JSON.stringify(savedFormulas));
                    }
                } catch (e) {
                    console.warn('同步到 savedFormulas 失败:', e);
                }
                
                if (updateSuccess) {
                    showMessage(`配方"${finalName}"已更新！可在"您的私人配方库"页面查看`, 'success');
                } else {
                    showMessage('配方更新失败，请重试', 'error');
                    return;
                }
                
                // 清除编辑模式指示器
                const indicator = document.getElementById('edit-mode-indicator');
                if (indicator) {
                    indicator.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => indicator.remove(), 300);
                }
                
                // 清除编辑ID
                editingRecipeId = null;
                
                // 清空当前配方
                currentFormula = [];
                if (formulaNameInput) formulaNameInput.value = '';
                updateFormulaDisplay();
                
                // 刷新已保存配方列表
                loadSavedFormulas();
                
                // 延迟跳转回配方库页面
                setTimeout(() => {
                    if (confirm('配方已更新，是否返回"您的私人配方库"页面？')) {
                        window.location.href = 'recipe-database.html';
                    }
                }, 500);
                
                return;
            } else {
                showMessage('未找到要编辑的配方，将创建新配方', 'warning');
                editingRecipeId = null; // 清除编辑ID，转为新建模式
            }
        }
        
        // 新建模式：创建新配方
        const formula = {
            id: Date.now(),
            name: finalName,
            date: new Date().toLocaleString('zh-CN'),
            baseType: baseType,
            baseTypeName: baseTypeNames[baseType] || '基础油',
            baseAmount: baseAmount,
            ingredients: currentFormula.map(item => ({
                name: item.name,
                latin: item.latin,
                drops: item.drops,
                caution: item.caution
            })),
            totalDrops: totalDrops,
            totalMl: totalMl,
            concentration: concentration
        };

        // 使用统一数据管理器保存（如果可用）
        if (typeof UnifiedDataManager !== 'undefined') {
            const unifiedRecipe = UnifiedDataManager.convertFromFormulaBuilder(formula);
            if (unifiedRecipe) {
                UnifiedDataManager.addRecipe(unifiedRecipe);
                // UnifiedDataManager.addRecipe 会通过 syncToLegacySystems 自动同步到 savedFormulas
                // 所以不需要再次手动保存
            } else {
                // 如果转换失败，回退到旧格式保存
                let savedFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
                savedFormulas.push(formula);
                localStorage.setItem('savedFormulas', JSON.stringify(savedFormulas));
            }
        } else {
            // 如果没有统一数据管理器，使用旧格式保存
            let savedFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
            savedFormulas.push(formula);
            localStorage.setItem('savedFormulas', JSON.stringify(savedFormulas));
        }

        showMessage(`配方"${finalName}"已保存！可在"您的私人配方库"页面查看`, 'success');
        loadSavedFormulas();
        
        // 清空当前配方（如果不在编辑模式）
        if (!editingRecipeId) {
        currentFormula = [];
        if (formulaNameInput) formulaNameInput.value = '';
        updateFormulaDisplay();
        }
    } catch (error) {
        showMessage('保存失败，请检查浏览器存储设置', 'error');
        console.error('Save error:', error);
    }
}

// 加载已保存的配方
function loadSavedFormulas() {
    const savedFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
    const savedFormulasSection = document.getElementById('savedFormulasSection');
    const savedFormulasList = document.getElementById('savedFormulasList');

    if (savedFormulas.length === 0) {
        savedFormulasSection.style.display = 'none';
        return;
    }

    savedFormulasSection.style.display = 'block';
    savedFormulasList.innerHTML = '';

    // 只显示最近三个配方
    const recentFormulas = savedFormulas.reverse().slice(0, 3);
    
    recentFormulas.forEach(formula => {
        const card = document.createElement('div');
        card.className = 'saved-formula-card';
        card.innerHTML = `
            <div class="formula-header">
                <div>
                    <div class="formula-name">${formula.name}</div>
                    <div class="formula-date">${formula.date}</div>
                </div>
                <div class="formula-actions">
                    <button class="btn btn-primary btn-small" onclick="loadFormula(${formula.id})" aria-label="加载配方">加载</button>
                    <button class="btn btn-danger btn-small" onclick="deleteFormula(${formula.id})" aria-label="删除配方">删除</button>
                </div>
            </div>
            <div class="formula-details">
                <div class="formula-stats">
                    <div class="stat-item">
                        <span class="stat-label">基底类型</span>
                        <span class="stat-value">${formula.baseTypeName || '基础油'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">基底量</span>
                        <span class="stat-value">${formula.baseAmount}g/ml</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">总滴数</span>
                        <span class="stat-value">${formula.totalDrops}滴</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">总精油量</span>
                        <span class="stat-value">${formula.totalMl.toFixed(2)}ml</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">浓度</span>
                        <span class="stat-value">${formula.concentration.toFixed(2)}%</span>
                    </div>
                </div>
                <div class="formula-ingredients-list">
                    <strong class="ingredients-title">成分</strong>
                    <ul class="ingredients-items">
                        ${formula.ingredients.map(ing => 
                            `<li><span class="ingredient-name">${ing.name}</span><span class="ingredient-amount">${ing.drops}滴</span>${ing.caution ? `<span class="ingredient-caution">(${ing.caution})</span>` : ''}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
        `;
        savedFormulasList.appendChild(card);
    });
}

// 加载配方
function loadFormula(id) {
    try {
        const savedFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
        const formula = savedFormulas.find(f => f.id === id);
        
        if (!formula) {
            showMessage('配方不存在', 'error');
            return;
        }

        // 验证配方数据
        if (!formula.ingredients || !Array.isArray(formula.ingredients) || formula.ingredients.length === 0) {
            showMessage('配方中没有精油数据', 'warning');
            return;
        }

        // 恢复配方 - 改进精油查找逻辑
        currentFormula = [];
        const missingOils = [];
        
        formula.ingredients.forEach(ing => {
            let oilIndex = essentialOils.findIndex(o => o.name === ing.name);
            
            // 如果找不到，尝试从精油数据库获取
            if (oilIndex < 0 && typeof getAllOils === 'function') {
                const allOils = getAllOils();
                const fullOilInfo = allOils.find(o => o.name === ing.name);
                
                if (fullOilInfo) {
                    const newIndex = essentialOils.length;
                    essentialOils.push({
                        name: fullOilInfo.name,
                        latin: fullOilInfo.latin || ing.latin || '',
                        caution: fullOilInfo.caution || ing.caution || '安全性高',
                        maxConcentration: fullOilInfo.maxConcentration || 3
                    });
                    
                    // 更新下拉框
                    const oilSelect = document.getElementById('oilSelect');
                    if (oilSelect) {
                        const option = document.createElement('option');
                        option.value = newIndex;
                        option.textContent = `${fullOilInfo.name}${fullOilInfo.latin ? ' (' + fullOilInfo.latin + ')' : ''}`;
                        oilSelect.appendChild(option);
                    }
                    
                    oilIndex = newIndex;
                }
            }
            
            if (oilIndex >= 0) {
                const oil = essentialOils[oilIndex];
                currentFormula.push({
                    index: oilIndex,
                    name: ing.name,
                    latin: ing.latin || oil.latin || '',
                    caution: ing.caution || oil.caution || '安全性高',
                    maxConcentration: oil.maxConcentration || 3,
                    drops: ing.drops || 1
                });
            } else {
                // 记录缺失的精油
                missingOils.push(ing.name);
                console.warn(`未找到精油 "${ing.name}" 的信息`);
            }
        });
        
        if (missingOils.length > 0) {
            showMessage(`警告：以下精油未找到完整信息：${missingOils.join(', ')}`, 'warning');
        }

        const baseTypeSelect = document.getElementById('baseType');
        if (baseTypeSelect) {
            if (formula.baseType) {
                baseTypeSelect.value = formula.baseType;
            } else {
                baseTypeSelect.value = 'base-oil'; // 默认值，兼容旧数据
            }
        }
        
        const baseAmountInput = document.getElementById('baseAmount');
        const formulaNameInput = document.getElementById('formulaName');
        
        if (baseAmountInput) baseAmountInput.value = formula.baseAmount || 50;
        if (formulaNameInput) formulaNameInput.value = formula.name || '';
        
        // 如果当前处于编辑模式，退出编辑模式
        if (editingRecipeId) {
            exitEditMode();
        }
        
        updateFormulaDisplay();
        calculateSummary();
        showMessage(`已加载配方: ${formula.name}`, 'success');
        
        // 滚动到配方构建器
        const builder = document.getElementById('formula-builder');
        if (builder) {
            builder.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        showMessage('加载配方失败：' + (error.message || '未知错误'), 'error');
        console.error('Load error:', error);
    }
}

// 删除配方
function deleteFormula(id) {
    if (confirm('确定要删除这个配方吗？')) {
        try {
            let savedFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
            const beforeCount = savedFormulas.length;
            savedFormulas = savedFormulas.filter(f => f.id !== id);
            
            if (savedFormulas.length < beforeCount) {
                localStorage.setItem('savedFormulas', JSON.stringify(savedFormulas));
                loadSavedFormulas();
                showMessage('配方已删除', 'success');
            } else {
                showMessage('删除失败，配方不存在', 'error');
            }
        } catch (error) {
            showMessage('删除失败', 'error');
            console.error('Delete error:', error);
        }
    }
}

// 监听基础量变化
document.addEventListener('DOMContentLoaded', function() {
const baseTypeSelect = document.getElementById('baseType');
if (baseTypeSelect) {
    baseTypeSelect.addEventListener('change', function() {
        if (currentFormula.length > 0) {
            calculateSummary();
        }
    });
}

const baseAmountInput = document.getElementById('baseAmount');
if (baseAmountInput) {
    baseAmountInput.addEventListener('input', function() {
        if (currentFormula.length > 0) {
            calculateSummary();
        }
    });
        
        // 添加失焦验证
        baseAmountInput.addEventListener('blur', function() {
            const value = parseFloat(this.value);
            if (isNaN(value) || value <= 0) {
                this.value = 50; // 恢复默认值
                showMessage('基底总量无效，已恢复为默认值50', 'warning');
                if (currentFormula.length > 0) {
                    calculateSummary();
                }
            }
        });
    }
});