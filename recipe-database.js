// Recipe Database Page JavaScript
// Handles UI interactions for recipe-database.html

let editingId = null;
let lists = RecipeDB.loadLists();

// 最常用10款精油
const POPULAR_OILS = [
    '野地薰衣草', '甜橙', '欧薄荷', '天竺葵', '乳香',
    '佛手柑', '迷迭香', '雪松', '檀香', '玫瑰'
];

// 最常用基础油
const POPULAR_CARRIERS = [
    '荷荷巴油', '甜杏仁油', '葡萄籽油', '椰子油', '橄榄油'
];

// 所有可用精油列表（从数据库获取）
function getAllAvailableOils() {
    if (typeof ESSENTIAL_OILS_DB !== 'undefined') {
        return Object.keys(ESSENTIAL_OILS_DB).sort();
    }
    // 备用列表
    return [
        '野地薰衣草', '中国肉桂', '艾草', '依兰依兰', '佛手柑', '丝柏',
        '雪松', '乳香', '甜茴香', '迷迭香', '广藿香', '姜', '玫瑰',
        '檀香', '天竺葵', '甜橙', '欧薄荷'
    ].sort();
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // 初始化统一数据管理器（如果可用）
    if (typeof UnifiedDataManager !== 'undefined') {
        UnifiedDataManager.init();
    }
    
    // Load preset recipes if database is empty
    PresetRecipes.loadIntoDatabase();
    
    // Initialize UI
    renderInventory();
    fillSelectOptions();
    initView(); // 初始化视图模式
    renderRecipeTable();
    updateCalculator();
    
    // Add initial oil row
    addOilRow();
    
    // 初始化用户功能（统计、历史、场景建议历史）
    initUserFeatures();
});

// Render inventory chips
function renderInventory() {
    // 渲染最常用精油按钮
    renderPopularItems('popular-oils', POPULAR_OILS, 'oils');
    
    // 渲染最常用基础油按钮
    renderPopularItems('popular-carriers', POPULAR_CARRIERS, 'carriers');
    
    // 渲染下拉菜单
    fillInventorySelects();
    
    // 渲染库存表格
    renderInventoryTable();
}

// 渲染最常用项目按钮（单击切换：未选中则添加，已选中则删除）
function renderPopularItems(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    items.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'popular-item-btn';
        btn.textContent = item;
        
        // 检查是否已添加
        const checkIsAdded = () => {
            return type === 'oils' ? lists.oils.includes(item) : lists.carriers.includes(item);
        };
        
        // 更新按钮状态
        const updateButtonState = () => {
            if (checkIsAdded()) {
                btn.classList.add('added');
            } else {
                btn.classList.remove('added');
            }
        };
        
        updateButtonState();
        
        // 单击切换：未选中则添加，已选中则删除
        btn.onclick = () => {
            const isAdded = checkIsAdded();
            
            if (!isAdded) {
                // 添加
                if (type === 'oils') {
                    lists.oils.push(item);
                } else {
                    lists.carriers.push(item);
                }
            } else {
                // 删除
                if (type === 'oils') {
                    const index = lists.oils.indexOf(item);
                    if (index > -1) {
                        lists.oils.splice(index, 1);
                    }
                } else {
                    const index = lists.carriers.indexOf(item);
                    if (index > -1) {
                        lists.carriers.splice(index, 1);
                    }
                }
            }
            
            RecipeDB.saveLists(lists);
            renderInventory();
            fillSelectOptions();
            renderRecipeTable();
        };
        
        container.appendChild(btn);
    });
}

// 获取库存详细信息（包含生产日期等）
function getInventoryDetails() {
    const detailsKey = 'eo_inventory_details_v1';
    try {
        const data = localStorage.getItem(detailsKey);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
}

// 保存库存详细信息
function saveInventoryDetails(details) {
    const detailsKey = 'eo_inventory_details_v1';
    try {
        localStorage.setItem(detailsKey, JSON.stringify(details));
        return true;
    } catch (e) {
        console.error('Error saving inventory details:', e);
        return false;
    }
}

// 获取精油信息（从数据库）
function getOilInfo(oilName) {
    if (typeof ESSENTIAL_OILS_DB === 'undefined' || !ESSENTIAL_OILS_DB[oilName]) {
        return null;
    }
    return ESSENTIAL_OILS_DB[oilName];
}

// 渲染库存表格
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const inventoryDetails = getInventoryDetails();
    
    // 合并所有库存项
    const allItems = [
        ...lists.oils.map(item => ({ 
            category: 'oils', 
            name: item, 
            label: '精油',
            details: inventoryDetails[item] || {}
        })),
        ...lists.carriers.map(item => ({ 
            category: 'carriers', 
            name: item, 
            label: '基础油',
            details: inventoryDetails[item] || {}
        })),
        ...lists.solvents.map(item => ({ 
            category: 'solvents', 
            name: item, 
            label: '溶剂',
            details: inventoryDetails[item] || {}
        }))
    ];
    
    if (allItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--secondary-color); padding: var(--spacing-md);">暂无库存项目</td></tr>';
        return;
    }
    
    allItems.forEach(item => {
        const tr = document.createElement('tr');
        
        // 获取精油信息（仅对精油）
        let oilInfo = null;
        let typeTags = '';
        let mainProperties = '';
        let shelfLife = '';
        
        if (item.category === 'oils') {
            oilInfo = getOilInfo(item.name);
            if (oilInfo) {
                // 分类标签
                if (oilInfo.types && typeof OIL_TYPES !== 'undefined') {
                    typeTags = oilInfo.types.map(type => {
                        const typeInfo = OIL_TYPES[type];
                        if (!typeInfo) return '';
                        return `<span class="inventory-type-tag" style="background: ${typeInfo.color}; color: white;">${typeInfo.name}</span>`;
                    }).join('');
                }
                
                // 主要作用（显示前3个）
                if (oilInfo.properties && oilInfo.properties.main) {
                    mainProperties = oilInfo.properties.main.slice(0, 3).join('、');
                    if (oilInfo.properties.main.length > 3) {
                        mainProperties += '...';
                    }
                }
                
                // 保质期（默认3年，可根据实际情况调整）
                shelfLife = '3年';
            }
        } else if (item.category === 'carriers') {
            // 基础油保质期（通常1-2年）
            shelfLife = '1-2年';
        }
        
        // 生产日期输入（精油和基础油可以填写，溶剂不填写）
        const productionDate = item.details.productionDate || '';
        const productionDateInput = item.category === 'oils' || item.category === 'carriers' 
            ? `<input type="date" class="inventory-production-date-input" value="${productionDate}" onchange="updateProductionDate('${item.name.replace(/'/g, "\\'")}', '${item.category}', this.value)">`
            : '—';
        
        // 项目名称（精油添加链接）
        const nameCell = item.category === 'oils' && oilInfo
            ? `<a href="oil-detail.html?oil=${encodeURIComponent(item.name)}" class="inventory-oil-link">${escapeHtml(item.name)}</a>`
            : escapeHtml(item.name);
        
        tr.innerHTML = `
            <td><span class="inventory-category-badge ${item.category}">${item.label}</span></td>
            <td>${nameCell}</td>
            <td>${typeTags || '—'}</td>
            <td>${mainProperties || '—'}</td>
            <td>${shelfLife || '—'}</td>
            <td>
                <div class="inventory-production-date">
                    ${productionDateInput}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 更新生产日期
function updateProductionDate(itemName, category, date) {
    const inventoryDetails = getInventoryDetails();
    if (!inventoryDetails[itemName]) {
        inventoryDetails[itemName] = {};
    }
    inventoryDetails[itemName].productionDate = date || '';
    saveInventoryDetails(inventoryDetails);
    // 重新渲染表格以更新显示
    renderInventoryTable();
}

// 填充库存下拉菜单
function fillInventorySelects() {
    // 精油下拉菜单
    const oilSelect = document.getElementById('oil-select');
    if (oilSelect) {
        oilSelect.innerHTML = '<option value="">-- 选择精油 --</option>';
        const allOils = getAllAvailableOils();
        allOils.forEach(oil => {
            if (!POPULAR_OILS.includes(oil) && !lists.oils.includes(oil)) {
                const opt = document.createElement('option');
                opt.value = oil;
                opt.textContent = oil;
                oilSelect.appendChild(opt);
            }
        });
        oilSelect.onchange = function() {
            if (this.value && !lists.oils.includes(this.value)) {
                lists.oils.push(this.value);
                RecipeDB.saveLists(lists);
                renderInventory();
                fillSelectOptions();
                renderRecipeTable();
                this.value = '';
            }
        };
    }
    
    // 基础油下拉菜单
    const carrierSelect = document.getElementById('carrier-select');
    if (carrierSelect) {
        carrierSelect.innerHTML = '<option value="">-- 选择基础油 --</option>';
        const allCarriers = ['甜杏仁油', '荷荷巴油', '葡萄籽油', '椰子油', '橄榄油', '月见草油', '玫瑰果油', '阿甘油'];
        allCarriers.forEach(carrier => {
            if (!POPULAR_CARRIERS.includes(carrier) && !lists.carriers.includes(carrier)) {
                const opt = document.createElement('option');
                opt.value = carrier;
                opt.textContent = carrier;
                carrierSelect.appendChild(opt);
            }
        });
        carrierSelect.onchange = function() {
            if (this.value && !lists.carriers.includes(this.value)) {
                lists.carriers.push(this.value);
                RecipeDB.saveLists(lists);
                renderInventory();
                fillSelectOptions();
                renderRecipeTable();
                this.value = '';
            }
        };
    }
}

// renderChipList 函数已移除，改用表格显示

// Fill select options
function fillSelectOptions() {
    // Filter oil select
    const filterSel = document.getElementById('filter-oil');
    if (filterSel) {
        filterSel.innerHTML = '<option value="">— 任意 —</option>';
        lists.oils.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            filterSel.appendChild(opt);
        });
    }
    
    // Carrier select
    const carrierSel = document.getElementById('recipe-carrier');
    if (carrierSel) {
        carrierSel.innerHTML = '<option value="">（不选）</option>';
        lists.carriers.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            carrierSel.appendChild(opt);
        });
    }
    
    // Solvent select
    const solventSel = document.getElementById('recipe-solvent');
    if (solventSel) {
        solventSel.innerHTML = '<option value="">（不选）</option>';
        lists.solvents.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            solventSel.appendChild(opt);
        });
    }
    
    // Oil name selects in rows
    document.querySelectorAll('.oil-name-select').forEach(sel => {
        sel.innerHTML = '';
        lists.oils.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            sel.appendChild(opt);
        });
    });
}

// Add inventory item
function addInventoryItem(type) {
    const inputId = type === 'oils' ? 'new-oil' : type === 'carriers' ? 'new-carrier' : 'new-solvent';
    const input = document.getElementById(inputId);
    const val = (input.value || '').trim();
    
    if (!val) return;
    
    if (!lists[type]) lists[type] = [];
    if (!lists[type].includes(val)) {
        lists[type].push(val);
        RecipeDB.saveLists(lists);
        renderInventory();
        fillSelectOptions();
        renderRecipeTable(); // 更新配方列表以反映库存变化
        input.value = '';
    }
}

// Show new recipe form
function showNewRecipeForm() {
    resetEditor();
    document.getElementById('recipe-editor').style.display = 'block';
    document.getElementById('recipe-name').focus();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Add oil row
function addOilRow(preset) {
    const container = document.getElementById('oil-rows');
    if (!container) return;
    
    const row = document.createElement('div');
    row.className = 'oil-row';
    
    // 计算行号
    const rowNumber = container.children.length + 1;
    const numberBadge = document.createElement('div');
    numberBadge.className = 'oil-row-number';
    numberBadge.textContent = rowNumber;
    
    const sel = document.createElement('select');
    sel.className = 'oil-name-select';
    sel.required = true;
    sel.setAttribute('aria-label', `精油 ${rowNumber}`);
    lists.oils.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        sel.appendChild(opt);
    });
    
    const amt = document.createElement('input');
    amt.type = 'number';
    amt.className = 'oil-amount';
    amt.min = '0';
    amt.step = '0.1';
    amt.placeholder = '份量（滴 / % / g）';
    amt.setAttribute('aria-label', `份量 ${rowNumber}`);
    
    const note = document.createElement('input');
    note.type = 'text';
    note.className = 'oil-note';
    note.placeholder = '备注（可填：滴数/比例）';
    note.setAttribute('aria-label', `备注 ${rowNumber}`);
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remove-oil-btn';
    btn.innerHTML = '×';
    btn.setAttribute('aria-label', `删除精油 ${rowNumber}`);
    btn.onclick = () => {
        row.remove();
        updateOilRowNumbers();
        refreshSafety();
    };
    
    if (preset) {
        sel.value = preset.name || '';
        amt.value = preset.amount || '';
        note.value = preset.note || '';
    }
    
    [sel, amt, note].forEach(el => el.addEventListener('input', refreshSafety));
    
    // 监听介质类型变化
    const mediumTypeInput = document.getElementById('recipe-medium-type');
    if (mediumTypeInput) {
        mediumTypeInput.addEventListener('change', refreshSafety);
    }
    
    row.appendChild(numberBadge);
    row.appendChild(sel);
    row.appendChild(amt);
    row.appendChild(note);
    row.appendChild(btn);
    container.appendChild(row);
    
    refreshSafety();
}

// Update oil row numbers after deletion
function updateOilRowNumbers() {
    const container = document.getElementById('oil-rows');
    if (!container) return;
    
    Array.from(container.children).forEach((row, index) => {
        const numberBadge = row.querySelector('.oil-row-number');
        if (numberBadge) {
            numberBadge.textContent = index + 1;
        }
        // Update aria-labels
        const select = row.querySelector('.oil-name-select');
        const amount = row.querySelector('.oil-amount');
        const note = row.querySelector('.oil-note');
        const removeBtn = row.querySelector('.remove-oil-btn');
        const rowNum = index + 1;
        
        if (select) select.setAttribute('aria-label', `精油 ${rowNum}`);
        if (amount) amount.setAttribute('aria-label', `份量 ${rowNum}`);
        if (note) note.setAttribute('aria-label', `备注 ${rowNum}`);
        if (removeBtn) removeBtn.setAttribute('aria-label', `删除精油 ${rowNum}`);
    });
}

// Save recipe
function saveRecipe(e) {
    e.preventDefault();
    
    const id = document.getElementById('editing-id').value || crypto.randomUUID();
    const mediumTypeInput = document.getElementById('recipe-medium-type');
    const mediumType = mediumTypeInput ? mediumTypeInput.value : '';
    
    const recipe = {
        id: id,
        name: document.getElementById('recipe-name').value.trim(),
        purpose: document.getElementById('recipe-purpose').value.trim(),
        total: parseFloat(document.getElementById('recipe-total').value) || '',
        dilution: parseFloat(document.getElementById('recipe-dilution').value) || '',
        carrier: document.getElementById('recipe-carrier').value,
        solvent: document.getElementById('recipe-solvent').value,
        mediumType: mediumType,  // 新增：介质类型
        baseType: mediumType,    // 兼容：baseType字段
        notes: document.getElementById('recipe-notes').value.trim(),
        oils: Array.from(document.querySelectorAll('.oil-row')).map(row => ({
            name: row.querySelector('.oil-name-select').value,
            amount: parseFloat(row.querySelector('.oil-amount').value) || '',
            note: row.querySelector('.oil-note').value.trim()
        })).filter(o => o.name)
    };
    
    if (!recipe.name) {
        alert('请填写配方名称');
        return;
    }
    
    // 检查是否可以创建新配方（免费用户只能保存10个）
    // 如果是编辑现有配方（editingId存在），则不需要检查
    if (!editingId && typeof window.authSystem !== 'undefined' && window.authSystem.canCreateRecipe) {
        const canCreate = window.authSystem.canCreateRecipe();
        if (!canCreate) {
            const limits = window.authSystem.getUserLimits();
            const currentCount = window.authSystem.getUserRecipeCount();
            const isPremium = window.authSystem.isPremiumMember();
            if (!isPremium) {
                alert(`免费用户最多只能保存${limits.maxRecipes}个配方。您当前已有${currentCount}个配方。\n\n升级为付费会员可保存无限配方。`);
                if (confirm('是否升级为付费会员以保存无限配方？')) {
                    window.location.href = 'payment.html?type=premium';
                }
                return;
            }
        }
    }
    
    const safety = SafetyEvaluator.evaluateSafety(recipe);
    if (safety.level === 'red' && !confirm('检测到超出安全上限：\n' + safety.message + '\n仍要保存吗？')) {
        return;
    }
    
    recipe.safetyFlag = safety.level;
    recipe.updatedAt = new Date().toISOString();
    recipe.source = 'recipe-database';
    
    // 使用统一数据管理器（如果可用）
    if (typeof UnifiedDataManager !== 'undefined') {
        if (editingId) {
            UnifiedDataManager.updateRecipe(recipe);
        } else {
            UnifiedDataManager.addRecipe(recipe);
        }
    } else {
        // 回退到旧系统
        if (editingId) {
            RecipeDB.updateRecipe(recipe);
        } else {
            RecipeDB.addRecipe(recipe);
        }
    }
    
    renderRecipeTable();
    resetEditor();
    alert('配方已保存');
}

// Reset editor
function resetEditor() {
    editingId = null;
    document.getElementById('recipe-form').reset();
    document.getElementById('editing-id').value = '';
    const oilRowsContainer = document.getElementById('oil-rows');
    if (oilRowsContainer) {
        oilRowsContainer.innerHTML = '';
    }
    addOilRow();
    refreshSafety();
    document.getElementById('recipe-editor').style.display = 'none';
}

// Edit recipe - 跳转到配方实验页面进行编辑
function editRecipe(id) {
    let recipe = null;
    
    // 尝试从统一数据管理器获取
    if (typeof UnifiedDataManager !== 'undefined') {
        try {
            UnifiedDataManager.init(); // 确保已初始化
            recipe = UnifiedDataManager.getRecipe(id);
        } catch (e) {
            console.warn('从 UnifiedDataManager 获取配方失败:', e);
        }
    }
    
    // 如果还没找到，尝试从 RecipeDB 获取
    if (!recipe && typeof RecipeDB !== 'undefined') {
        try {
            recipe = RecipeDB.getRecipe(id);
        } catch (e) {
            console.warn('从 RecipeDB 获取配方失败:', e);
        }
    }
    
    if (!recipe) {
        alert('配方不存在或无法加载');
        return;
    }
    
    // 将配方数据存储到 localStorage，供 formula-builder 页面读取
    // 这样可以确保即使 URL 参数丢失也能加载数据
    const editData = {
        recipeId: id,
        recipe: recipe,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('pendingRecipeEdit', JSON.stringify(editData));
    } catch (e) {
        console.error('保存配方数据到 localStorage 失败:', e);
        alert('无法保存配方数据，请重试');
        return;
    }
    
    // 跳转到配方实验页面，使用 URL 参数传递配方ID
    window.location.href = 'formula-builder.html?edit=' + encodeURIComponent(id);
}

// 编辑配方名称（双击编辑）
function editRecipeName(recipeId, element, viewType) {
    // 如果已经在编辑中，忽略
    if (element.classList.contains('editing')) {
        return;
    }
    
    const currentName = element.textContent.trim();
    
    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'recipe-name-input';
    input.value = currentName;
    input.style.width = '100%';
    input.style.maxWidth = viewType === 'card' ? '100%' : '300px';
    input.setAttribute('placeholder', '请输入配方名称');
    
    // 保存函数
    let isSaving = false; // 防止重复保存
    const saveName = () => {
        if (isSaving) return; // 如果正在保存，忽略
        isSaving = true;
        
        const newName = input.value.trim();
        
        // 立即移除输入框，避免紫色边框残留
        input.remove();
        
        // 延迟执行，确保DOM更新完成
        setTimeout(() => {
            if (!newName) {
                // 如果名称为空，恢复原名称
                element.textContent = currentName;
                element.classList.remove('editing');
                isSaving = false;
                return;
            }
            
            if (newName === currentName) {
                // 名称未改变，直接恢复
                element.textContent = currentName;
                element.classList.remove('editing');
                isSaving = false;
                return;
            }
            
            // 获取配方并更新名称
            let recipe = null;
            if (typeof UnifiedDataManager !== 'undefined') {
                recipe = UnifiedDataManager.getRecipe(recipeId);
            } else if (typeof RecipeDB !== 'undefined') {
                recipe = RecipeDB.getRecipe(recipeId);
            }
            
            if (recipe) {
                recipe.name = newName;
                recipe.updatedAt = new Date().toISOString();
                
                // 保存更新
                if (typeof UnifiedDataManager !== 'undefined') {
                    UnifiedDataManager.updateRecipe(recipe);
                } else if (typeof RecipeDB !== 'undefined') {
                    RecipeDB.updateRecipe(recipe);
                }
                
                // 更新显示 - 使用textContent确保完全替换
                element.textContent = newName;
                element.classList.remove('editing');
                
                // 显示成功提示
                showQuickMessage('配方名称已更新', 'success');
            } else {
                // 配方不存在，恢复原名称
                element.textContent = currentName;
                element.classList.remove('editing');
                showQuickMessage('更新失败：配方不存在', 'error');
            }
            
            isSaving = false;
        }, 50);
    };
    
    // 取消编辑函数
    const cancelEdit = () => {
        // 立即移除输入框
        if (input.parentNode === element) {
            input.remove();
        }
        
        // 恢复原名称
        element.textContent = currentName;
        element.classList.remove('editing');
    };
    
    // 键盘事件处理
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            input.blur(); // 触发 blur 事件保存
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancelEdit();
        }
    };
    
    // 替换元素内容为输入框
    element.classList.add('editing');
    element.innerHTML = '';
    element.appendChild(input);
    
    // 延迟聚焦，确保DOM更新完成
    setTimeout(() => {
        input.focus();
        input.select();
    }, 10);
    
    // 绑定事件 - 使用 once: true 确保只触发一次
    input.addEventListener('blur', () => {
        // 使用 setTimeout 确保 blur 事件完全处理后再保存
        setTimeout(saveName, 0);
    }, { once: true });
    
    input.addEventListener('keydown', handleKeyDown);
    
    // 防止点击其他地方时输入框残留
    const handleDocumentClick = (e) => {
        if (!element.contains(e.target) && element.classList.contains('editing')) {
            // 如果点击了元素外部，保存并移除输入框
            if (input.parentNode === element) {
                input.blur();
            }
        }
    };
    
    // 延迟绑定，避免立即触发
    setTimeout(() => {
        document.addEventListener('click', handleDocumentClick, { once: true });
    }, 100);
}

// 显示快速消息提示
function showQuickMessage(message, type) {
    // 移除现有消息
    const existingMsg = document.getElementById('quick-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const msgDiv = document.createElement('div');
    msgDiv.id = 'quick-message';
    msgDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#667eea'
    };
    
    msgDiv.style.background = colors[type] || colors.info;
    msgDiv.textContent = message;
    
    document.body.appendChild(msgDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        msgDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// Delete recipe
function deleteRecipe(id) {
    if (confirm('确定删除该配方吗？此操作不可撤销。')) {
        if (typeof UnifiedDataManager !== 'undefined') {
            UnifiedDataManager.deleteRecipe(id);
        } else {
            RecipeDB.deleteRecipe(id);
        }
        renderRecipeTable();
    }
}

// Duplicate recipe
function duplicateRecipe(id) {
    const recipe = typeof UnifiedDataManager !== 'undefined'
        ? UnifiedDataManager.getRecipe(id)
        : RecipeDB.getRecipe(id);
    if (!recipe) return;
    
    const copy = JSON.parse(JSON.stringify(recipe));
    copy.id = crypto.randomUUID();
    copy.name = recipe.name + '（副本）';
    
    if (typeof UnifiedDataManager !== 'undefined') {
        UnifiedDataManager.addRecipe(copy);
    } else {
        RecipeDB.addRecipe(copy);
    }
    renderRecipeTable();
}

// 当前视图模式
let currentView = localStorage.getItem('recipeViewMode') || 'table';

// 切换视图
function switchView(view) {
    currentView = view;
    localStorage.setItem('recipeViewMode', view);
    
    // 更新按钮状态
    document.getElementById('view-table').classList.toggle('active', view === 'table');
    document.getElementById('view-cards').classList.toggle('active', view === 'cards');
    
    // 切换显示
    const tableWrapper = document.getElementById('recipe-table-wrapper');
    const cardsView = document.getElementById('recipe-cards-view');
    
    if (view === 'table') {
        tableWrapper.classList.remove('hidden');
        cardsView.classList.remove('active');
    } else {
        tableWrapper.classList.add('hidden');
        cardsView.classList.add('active');
    }
    
    // 重新渲染
    renderRecipeTable();
}

// 初始化视图
function initView() {
    switchView(currentView);
}

// Render recipe table
function renderRecipeTable() {
    const query = document.getElementById('search-query').value.trim();
    const filterOil = document.getElementById('filter-oil').value;
    
    // 使用统一数据管理器（如果可用）
    let rows = typeof UnifiedDataManager !== 'undefined' 
        ? UnifiedDataManager.searchRecipes(query, filterOil)
        : RecipeDB.searchRecipes(query, filterOil);
    
    const tbody = document.getElementById('recipe-table-body');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--secondary-color);">暂无配方，点击上方"新建配方"开始记录。</td></tr>';
        return;
    }
    
    // 验证和排序配方
    rows = rows.map(r => {
        const evaluation = SafetyEvaluator.evaluateSafety(r);
        const safety = SafetyEvaluator.getSafetyStatus(evaluation);
        
        // 检查是否使用库存中的精油
        const recipeOils = (r.oils || []).map(o => o.name);
        const hasInventoryOils = recipeOils.some(oil => lists.oils.includes(oil));
        
        // 检查是否使用库存中的介质
        const mediumType = r.mediumType || r.baseType || '';
        const hasInventoryMedium = (mediumType && (
            (r.carrier && lists.carriers.includes(r.carrier)) ||
            (r.solvent && lists.solvents.includes(r.solvent))
        ));
        
        // 检查是否超出介质安全浓度
        const dilution = parseFloat(r.dilution) || 0;
        let isUnsafeConcentration = false;
        if (mediumType && typeof SafetyEvaluator !== 'undefined' && dilution > 0) {
            const mediumLimit = SafetyEvaluator.getMediumSafetyLimit(mediumType);
            if (dilution > mediumLimit) {
                isUnsafeConcentration = true;
            }
        }
        
        return {
            ...r,
            hasInventory: hasInventoryOils || hasInventoryMedium,
            isUnsafeConcentration: isUnsafeConcentration,
            safety: safety,
            evaluation: evaluation
        };
    });
    
    // 排序：有库存的在前，超出安全浓度的在后（但标注出来）
    rows.sort((a, b) => {
        // 首先按是否有库存排序（有库存的在前）
        if (a.hasInventory !== b.hasInventory) {
            return b.hasInventory ? 1 : -1;
        }
        // 然后按是否超出安全浓度排序（安全的在前）
        if (a.isUnsafeConcentration !== b.isUnsafeConcentration) {
            return a.isUnsafeConcentration ? 1 : -1;
        }
        // 最后按更新时间排序（最新的在前）
        return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    
    // 更新配方计数
    const recipeCount = document.getElementById('recipe-count');
    if (recipeCount) {
        recipeCount.innerHTML = `共 <strong>${rows.length}</strong> 个配方`;
    }
    
    // 根据当前视图模式渲染
    if (currentView === 'cards') {
        renderRecipeCards(rows);
    } else {
        renderRecipeTableRows(rows);
    }
}

// 渲染表格行
function renderRecipeTableRows(rows) {
    const tbody = document.getElementById('recipe-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--secondary-color); padding: var(--spacing-xl);">暂无配方，点击上方"新建配方"开始记录。</td></tr>';
        return;
    }
    
    rows.forEach(r => {
        // 精油信息：每种精油换行显示
        const oilStr = (r.oils || []).map(o => 
            `${escapeHtml(o.name)}${o.amount !== '' ? ` (${escapeHtml(String(o.amount))})` : ''}${o.note ? ` · ${escapeHtml(o.note)}` : ''}`
        ).join('<br>');
        
        // 获取介质类型名称
        const mediumType = r.mediumType || r.baseType || '';
        let mediumName = '';
        if (mediumType && typeof SafetyEvaluator !== 'undefined') {
            mediumName = SafetyEvaluator.getMediumName(mediumType);
        } else if (mediumType) {
            const names = {
                'base-oil': '基础油', 'handcream': '护手霜', 'bodylotion': '身体乳',
                'rosewater': '玫瑰水', 'alcohol': '酒精', 'footbath': '泡脚/泡澡',
                'spray': '喷雾', 'diffuser': '扩香'
            };
            mediumName = names[mediumType] || '';
        }
        
        // 构建浓度显示（精确到小数点后一位）
        let concentrationDisplay = '—';
        if (r.dilution !== '' && r.dilution !== null && r.dilution !== undefined) {
            const dilutionNum = parseFloat(r.dilution);
            if (!isNaN(dilutionNum)) {
                concentrationDisplay = escapeHtml(dilutionNum.toFixed(1) + '%');
            }
        }
        
        if (r.isUnsafeConcentration && mediumType && typeof SafetyEvaluator !== 'undefined') {
            const mediumLimit = SafetyEvaluator.getMediumSafetyLimit(mediumType);
            const limitDisplay = typeof mediumLimit === 'number' ? mediumLimit.toFixed(1) : mediumLimit;
            concentrationDisplay += `<span class="unsafe-badge">超出${mediumName}上限(≤${limitDisplay}%)</span>`;
        }
        
        const tr = document.createElement('tr');
        
        // 添加CSS类
        if (r.hasInventory) {
            tr.classList.add('has-inventory');
        }
        if (r.isUnsafeConcentration) {
            tr.classList.add('unsafe-concentration');
        }
        
        // 构建容量显示
        let totalDisplay = '—';
        if (r.total !== '' && r.total !== null && r.total !== undefined) {
            const totalNum = parseFloat(r.total);
            if (!isNaN(totalNum)) {
                totalDisplay = escapeHtml(totalNum.toFixed(0) + 'ml');
            }
        }
        
        // 清理名称中的"配方"两字（处理已保存的旧数据）
        let displayName = r.name || '';
        if (r.source === 'formula-database' || displayName.includes('配方')) {
            displayName = displayName.replace(/配方/g, '').trim();
            displayName = displayName.replace(/\s+/g, ' ').trim();
        }
        
        tr.innerHTML = `
            <td>
                <strong class="recipe-name-editable" data-recipe-id="${r.id}" ondblclick="editRecipeName('${r.id}', this, 'table')">${escapeHtml(displayName)}</strong><br>
                <small style="color: var(--secondary-color);">${new Date(r.updatedAt || Date.now()).toLocaleString()}</small>${mediumName ? `<br><small style="color: var(--accent-color); font-size: 11px;">${escapeHtml(mediumName)}</small>` : ''}
            </td>
            <td>${oilStr || '—'}</td>
            <td>${concentrationDisplay}</td>
            <td>${totalDisplay}</td>
            <td>${escapeHtml([r.carrier, r.solvent].filter(Boolean).join(' / ') || '—')}</td>
            <td><div>${escapeHtml(r.purpose || '')}</div><div style="color: var(--secondary-color); font-size: 12px;">${escapeHtml(r.notes || '')}</div></td>
            <td><span class="safety-badge safety-${r.safety.color === '#059669' ? 'green' : r.safety.color === '#b45309' ? 'yellow' : 'red'}">${r.safety.text}</span></td>
            <td>
                <button class="btn btn-small" onclick="editRecipe('${r.id}')">编辑</button>
                <button class="btn btn-small" onclick="duplicateRecipe('${r.id}')">复制</button>
                <button class="btn btn-small btn-danger" onclick="deleteRecipe('${r.id}')">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 渲染卡片视图
function renderRecipeCards(rows) {
    const cardsView = document.getElementById('recipe-cards-view');
    if (!cardsView) return;
    
    cardsView.innerHTML = '';
    
    if (rows.length === 0) {
        cardsView.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-3xl); color: var(--secondary-color);">
                <div style="font-size: 48px; margin-bottom: var(--spacing-md); opacity: 0.5;">📝</div>
                <div style="font-size: var(--text-lg); margin-bottom: var(--spacing-sm);">暂无配方</div>
                <div style="font-size: var(--text-sm);">点击上方"新建配方"开始记录</div>
            </div>
        `;
        return;
    }
    
    rows.forEach(r => {
        // 获取介质类型名称
        const mediumType = r.mediumType || r.baseType || '';
        let mediumName = '';
        if (mediumType && typeof SafetyEvaluator !== 'undefined') {
            mediumName = SafetyEvaluator.getMediumName(mediumType);
        } else if (mediumType) {
            const names = {
                'base-oil': '基础油', 'handcream': '护手霜', 'bodylotion': '身体乳',
                'rosewater': '玫瑰水', 'alcohol': '酒精', 'footbath': '泡脚/泡澡',
                'spray': '喷雾', 'diffuser': '扩香'
            };
            mediumName = names[mediumType] || '';
        }
        
        // 构建浓度显示（精确到小数点后一位）
        let concentrationDisplay = '—';
        if (r.dilution !== '' && r.dilution !== null && r.dilution !== undefined) {
            const dilutionNum = parseFloat(r.dilution);
            if (!isNaN(dilutionNum)) {
                concentrationDisplay = dilutionNum.toFixed(1) + '%';
            }
        }
        
        let concentrationWarning = '';
        if (r.isUnsafeConcentration && mediumType && typeof SafetyEvaluator !== 'undefined') {
            const mediumLimit = SafetyEvaluator.getMediumSafetyLimit(mediumType);
            const limitDisplay = typeof mediumLimit === 'number' ? mediumLimit.toFixed(1) : mediumLimit;
            concentrationWarning = `<span class="unsafe-badge">超出上限(≤${limitDisplay}%)</span>`;
        }
        
        // 构建卡片类名
        let cardClasses = 'recipe-card';
        if (r.hasInventory) {
            cardClasses += ' has-inventory';
        }
        if (r.isUnsafeConcentration) {
            cardClasses += ' unsafe-concentration';
        }
        
        const card = document.createElement('div');
        card.className = cardClasses;
        
        // 构建精油信息（每种精油换行显示）
        const oilInfo = (r.oils || []).map(o => 
            `<a href="oil-detail.html?oil=${encodeURIComponent(o.name)}" style="text-decoration: none; color: inherit;">${escapeHtml(o.name)}</a>${o.amount !== '' ? ` (${escapeHtml(String(o.amount))})` : ''}${o.note ? ` · ${escapeHtml(o.note)}` : ''}`
        ).join('<br>');
        
        // 构建精油标签（用于标签样式显示）
        const oilTags = (r.oils || []).map(o => 
            `<a href="oil-detail.html?oil=${encodeURIComponent(o.name)}" class="recipe-card-oil-tag" style="text-decoration: none; display: inline-block;">${escapeHtml(o.name)}${o.amount !== '' ? ` (${escapeHtml(String(o.amount))})` : ''}</a>`
        ).join('');
        
        // 清理名称中的"配方"两字（处理已保存的旧数据）
        let displayName = r.name || '';
        if (r.source === 'formula-database' || displayName.includes('配方')) {
            displayName = displayName.replace(/配方/g, '').trim();
            displayName = displayName.replace(/\s+/g, ' ').trim();
        }
        
        card.innerHTML = `
            <div class="recipe-card-header">
                <div class="recipe-card-title">
                    <div class="recipe-card-name" data-recipe-id="${r.id}" ondblclick="editRecipeName('${r.id}', this, 'card')">${escapeHtml(displayName)}</div>
                    <div class="recipe-card-meta">
                        <div class="recipe-card-meta-item">
                            <span>📅</span>
                            <span>${new Date(r.updatedAt || Date.now()).toLocaleDateString('zh-CN')}</span>
                        </div>
                        ${mediumName ? `<div class="recipe-card-meta-item">
                            <span>💧</span>
                            <span>${escapeHtml(mediumName)}</span>
                        </div>` : ''}
                        ${r.hasInventory ? `<div class="recipe-card-meta-item">
                            <span style="color: var(--success-color);">✓</span>
                            <span>有库存</span>
                        </div>` : ''}
                    </div>
                </div>
                <span class="safety-badge safety-${r.safety.color === '#059669' ? 'green' : r.safety.color === '#b45309' ? 'yellow' : 'red'}">${r.safety.text}</span>
            </div>
            <div class="recipe-card-content">
                ${(r.oils || []).length > 0 ? `
                <div class="recipe-card-section">
                    <div class="recipe-card-label">精油成分</div>
                    <div class="recipe-card-value" style="line-height: 1.8;">${oilInfo}</div>
                </div>
                ` : ''}
                <div class="recipe-card-section">
                    <div class="recipe-card-label">浓度</div>
                    <div class="recipe-card-value">${escapeHtml(concentrationDisplay)} ${concentrationWarning}</div>
                </div>
                ${[r.carrier, r.solvent].filter(Boolean).length > 0 ? `
                <div class="recipe-card-section">
                    <div class="recipe-card-label">基础油/溶剂</div>
                    <div class="recipe-card-value">${escapeHtml([r.carrier, r.solvent].filter(Boolean).join(' / ') || '—')}</div>
                </div>
                ` : ''}
                ${r.purpose ? `
                <div class="recipe-card-section">
                    <div class="recipe-card-label">用途</div>
                    <div class="recipe-card-value">${escapeHtml(r.purpose)}</div>
                </div>
                ` : ''}
                ${r.notes ? `
                <div class="recipe-card-section">
                    <div class="recipe-card-label">备注</div>
                    <div class="recipe-card-value">${escapeHtml(r.notes)}</div>
                </div>
                ` : ''}
            </div>
            <div class="recipe-card-actions">
                <button class="btn btn-primary" onclick="editRecipe('${r.id}')">编辑</button>
                <button class="btn btn-secondary" onclick="duplicateRecipe('${r.id}')">复制</button>
                <button class="btn btn-danger" onclick="deleteRecipe('${r.id}')">删除</button>
            </div>
        `;
        
        cardsView.appendChild(card);
    });
}

// Refresh safety evaluation
function refreshSafety() {
    const mediumTypeInput = document.getElementById('recipe-medium-type');
    const mediumType = mediumTypeInput ? mediumTypeInput.value : '';
    
    const recipe = {
        total: document.getElementById('recipe-total').value,
        dilution: document.getElementById('recipe-dilution').value,
        mediumType: mediumType,  // 传递介质类型
        baseType: mediumType,    // 兼容字段
        carrier: document.getElementById('recipe-carrier').value,
        solvent: document.getElementById('recipe-solvent').value,
        name: document.getElementById('recipe-name').value,
        purpose: document.getElementById('recipe-purpose').value,
        oils: Array.from(document.querySelectorAll('.oil-row')).map(row => ({
            name: row.querySelector('.oil-name-select').value,
            amount: row.querySelector('.oil-amount').value
        })).filter(o => o.name)
    };
    
    const safety = SafetyEvaluator.evaluateSafety(recipe);
    const status = SafetyEvaluator.getSafetyStatus(safety);
    
    // 显示安全评估结果，包括介质类型信息
    let safetyMessage = safety.message || '无异常；请仍遵循特定人群禁忌与斑贴测试。';
    if (safety.mediumType && typeof SafetyEvaluator !== 'undefined') {
        const mediumName = SafetyEvaluator.getMediumName(safety.mediumType);
        const mediumLimit = safety.mediumLimit;
        if (!safetyMessage.includes(mediumName)) {
            safetyMessage = `介质类型：${mediumName}（安全上限：≤${mediumLimit}%）\n${safetyMessage}`;
        }
    }
    
    document.getElementById('safety-panel-content').textContent = safetyMessage;
    const statusEl = document.getElementById('safety-status');
    statusEl.textContent = status.text;
    statusEl.className = `safety-badge safety-${safety.level === 'green' ? 'green' : safety.level === 'yellow' ? 'yellow' : safety.level === 'red' ? 'red' : ''}`;
}

// Update calculator (removed - calculator section deleted)
function updateCalculator() {
    // Calculator section has been removed from the UI
    return;
}

// Export database
function exportDatabase() {
    const json = typeof UnifiedDataManager !== 'undefined'
        ? UnifiedDataManager.exportAll()
        : RecipeDB.exportJSON();
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eo_database.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Import database
function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        let success = false;
        if (typeof UnifiedDataManager !== 'undefined') {
            success = UnifiedDataManager.importAll(e.target.result);
        } else {
            success = RecipeDB.importJSON(e.target.result);
        }
        
        if (success) {
            lists = RecipeDB.loadLists();
            renderInventory();
            fillSelectOptions();
            renderRecipeTable();
            alert('导入完成');
        } else {
            alert('导入失败：不是有效的 JSON 文件');
        }
    };
    reader.readAsText(file);
}

// Clear database
function clearDatabase() {
    if (confirm('清空所有配方与自定义列表？此操作不可撤销。')) {
        if (typeof UnifiedDataManager !== 'undefined') {
            UnifiedDataManager.clearAll();
        } else {
            RecipeDB.clearAll();
        }
        lists = RecipeDB.loadLists();
        renderInventory();
        fillSelectOptions();
        renderRecipeTable();
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== User Statistics and History (from my-formulas.html) ====================

// 渲染用户统计信息
function renderUserStats() {
    if (typeof window.authSystem === 'undefined' || !window.authSystem.isUserLoggedIn()) {
        return;
    }
    
    const stats = window.authSystem.getUserStatistics();
    const statsSection = document.getElementById('userStatsSection');
    if (!statsSection) return;
    
    statsSection.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.totalHistory}</div>
            <div class="stat-label">最近查看</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalAIInquiries}</div>
            <div class="stat-label">AI查询次数</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.remainingAIInquiries}</div>
            <div class="stat-label">剩余查询次数</div>
        </div>
    `;
    statsSection.style.display = 'grid';
}

// 渲染使用历史
function renderHistory() {
    if (typeof window.authSystem === 'undefined' || !window.authSystem.isUserLoggedIn()) {
        return;
    }
    
    const history = window.authSystem.getUserHistory();
    if (!Array.isArray(history)) {
        return;
    }
    
    const historySection = document.getElementById('historySection');
    const historyContent = document.getElementById('historyContent');
    const clearBtn = document.getElementById('clearHistoryBtn');
    
    if (!historySection || !historyContent) return;
    
    if (history.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    
    if (typeof FORMULA_DATABASE === 'undefined') {
        historyContent.innerHTML = '<p style="color: var(--secondary-color);">配方数据库未加载</p>';
        return;
    }
    
    const formulas = history
        .map(item => {
            if (!item || !item.id) return null;
            const formula = FORMULA_DATABASE[item.id];
            if (formula) {
                return { ...formula, viewedAt: item.timestamp };
            }
            return null;
        })
        .filter(f => f !== null && f !== undefined);
    
    if (formulas.length === 0) {
        historyContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>历史记录中的配方已不存在</h3>
                <p class="empty-state-text">某些配方可能已被移除或更新。</p>
            </div>
        `;
        clearBtn.style.display = 'none';
        return;
    }
    
    clearBtn.style.display = 'block';
    
    // 使用卡片视图显示
    historyContent.innerHTML = `
        <div class="recipe-cards-view active" style="display: grid;">
            ${formulas.map(formula => renderHistoryFormulaCard(formula)).join('')}
        </div>
    `;
}

// 渲染历史记录中的配方卡片
function renderHistoryFormulaCard(formula) {
    const baseType = getFormulaBaseType(formula);
    const baseTypeMap = {
        'handcream': '护手霜',
        'bodylotion': '身体乳',
        'footbath': '泡脚/泡澡',
        'diffuser': '扩香',
        'spray': '喷雾'
    };
    const baseTypeName = baseTypeMap[baseType] || '配方';
    
    return `
        <a href="formula-detail.html?id=${formula.id}" class="recipe-card">
            <div class="recipe-card-header">
                <div class="recipe-card-title">
                    <div class="recipe-card-name">${escapeHtml(formula.name || '未命名配方')}</div>
                    <div class="recipe-card-meta">
                        <div class="recipe-card-meta-item">
                            <span>📅</span>
                            <span>${new Date(formula.viewedAt || Date.now()).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div class="recipe-card-meta-item">
                            <span>💧</span>
                            <span>${baseTypeName}</span>
                        </div>
                    </div>
                </div>
            </div>
            ${formula.subtitle ? `<div class="recipe-card-content"><div class="recipe-card-value">${escapeHtml(formula.subtitle)}</div></div>` : ''}
        </a>
    `;
}

// 获取配方介质类型（简化版）
function getFormulaBaseType(formula) {
    const name = (formula.name || '').toLowerCase();
    const subtitle = (formula.subtitle || '').toLowerCase();
    const text = name + ' ' + subtitle;
    
    if (text.includes('护手霜') || text.includes('handcream')) return 'handcream';
    if (text.includes('身体乳') || text.includes('bodylotion')) return 'bodylotion';
    if (text.includes('泡脚') || text.includes('泡澡') || text.includes('footbath')) return 'footbath';
    if (text.includes('扩香') || text.includes('diffuser')) return 'diffuser';
    if (text.includes('喷雾') || text.includes('spray')) return 'spray';
    return 'handcream';
}

// 清空历史
function clearHistory() {
    if (!confirm('确定要清空所有查看历史吗？此操作不可恢复。')) {
        return;
    }
    
    if (typeof window.authSystem === 'undefined') return;
    
    const result = window.authSystem.clearHistory();
    if (result.success) {
        renderHistory();
        alert(result.message);
    }
}

// ==================== Scenario Suggestions History ====================

// 保存场景建议到历史记录
function saveScenarioSuggestion(scenarioData) {
    if (typeof window.authSystem === 'undefined' || !window.authSystem.isUserLoggedIn()) {
        return;
    }
    
    const user = window.authSystem.getCurrentUser();
    if (!user) return;
    
    const historyKey = `user_scenario_history_${user.id}`;
    try {
        let history = [];
        const saved = localStorage.getItem(historyKey);
        if (saved) {
            history = JSON.parse(saved);
        }
        
        // 添加新记录
        history.unshift({
            id: 'scenario_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            data: scenarioData,
            timestamp: new Date().toISOString(),
            profileName: getCurrentProfileName() || '默认档案'
        });
        
        // 限制历史记录数量（最多保存20个）
        if (history.length > 20) {
            history = history.slice(0, 20);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) {
        console.error('Error saving scenario suggestion:', e);
    }
}

// 获取当前使用的档案名称
function getCurrentProfileName() {
    // getUserProfiles is defined in questionnaire.js, check if it's available
    if (typeof getUserProfiles === 'function') {
        const profiles = getUserProfiles();
        if (profiles && profiles.length > 0) {
            // 创建副本以避免修改原数组，返回最新的档案名称
            const sorted = [...profiles].sort((a, b) => {
                const dateA = new Date(a.updatedAt || 0);
                const dateB = new Date(b.updatedAt || 0);
                return dateB - dateA;
            });
            const latest = sorted[0];
            return latest && latest.name ? latest.name : null;
        }
    }
    return null;
}

// 获取场景建议历史
function getScenarioHistory() {
    if (typeof window.authSystem === 'undefined' || !window.authSystem.isUserLoggedIn()) {
        return [];
    }
    
    const user = window.authSystem.getCurrentUser();
    if (!user) return [];
    
    const historyKey = `user_scenario_history_${user.id}`;
    try {
        const saved = localStorage.getItem(historyKey);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Error loading scenario history:', e);
        return [];
    }
}

// 渲染场景建议历史
function renderScenarioHistory() {
    if (typeof window.authSystem === 'undefined' || !window.authSystem.isUserLoggedIn()) {
        return;
    }
    
    const history = getScenarioHistory();
    if (!Array.isArray(history)) {
        return;
    }
    
    const scenarioSection = document.getElementById('scenarioHistorySection');
    const scenarioContent = document.getElementById('scenarioHistoryContent');
    
    if (!scenarioSection || !scenarioContent) return;
    
    if (history.length === 0) {
        scenarioSection.style.display = 'none';
        return;
    }
    
    scenarioSection.style.display = 'block';
    
    scenarioContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
            ${history.map(item => renderScenarioHistoryCard(item)).join('')}
        </div>
    `;
}

// 渲染场景建议历史卡片
function renderScenarioHistoryCard(item) {
    if (!item || !item.id) {
        return '';
    }
    
    const scenarios = (item.data && item.data.scenarios && Array.isArray(item.data.scenarios)) ? item.data.scenarios : [];
    const scenarioCount = scenarios.length;
    const timestamp = item.timestamp ? new Date(item.timestamp).toLocaleString('zh-CN') : '未知时间';
    
    return `
        <div class="recipe-card" style="cursor: pointer;" onclick="viewScenarioSuggestion('${escapeHtml(item.id)}')">
            <div class="recipe-card-header">
                <div class="recipe-card-title">
                    <div class="recipe-card-name">${escapeHtml(item.profileName || '场景建议')}</div>
                    <div class="recipe-card-meta">
                        <div class="recipe-card-meta-item">
                            <span>📅</span>
                            <span>${timestamp}</span>
                        </div>
                        <div class="recipe-card-meta-item">
                            <span>📋</span>
                            <span>${scenarioCount} 个场景</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="recipe-card-content">
                ${scenarios.map((scenario, idx) => `
                    <div style="margin-bottom: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                        <strong>场景 ${idx + 1}: ${escapeHtml(scenario.name || '未命名')}</strong>
                        <div style="font-size: 12px; color: var(--secondary-color); margin-top: 5px;">
                            ${escapeHtml(scenario.description || '')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="recipe-card-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); viewScenarioSuggestion('${escapeHtml(item.id)}')">查看详情</button>
            </div>
        </div>
    `;
}

// 查看场景建议详情
window.viewScenarioSuggestion = function(scenarioId) {
    if (!scenarioId) {
        alert('场景ID无效');
        return;
    }
    
    const history = getScenarioHistory();
    if (!Array.isArray(history)) {
        alert('无法加载场景历史记录');
        return;
    }
    
    const item = history.find(h => h && h.id === scenarioId);
    if (!item || !item.data) {
        alert('场景建议不存在');
        return;
    }
    
    try {
        // 保存场景数据到临时存储，供scenario-suggestions.html使用
        sessionStorage.setItem('viewScenarioSuggestion', JSON.stringify(item.data));
        window.location.href = 'scenario-suggestions.html?view=' + encodeURIComponent(scenarioId);
    } catch (e) {
        console.error('Error saving scenario to sessionStorage:', e);
        alert('无法保存场景数据，请重试');
    }
};

// 暴露保存函数到全局，供scenario-suggestions.js使用
window.saveScenarioSuggestion = saveScenarioSuggestion;

// 初始化用户相关功能
function initUserFeatures() {
    if (typeof window.authSystem === 'undefined' || !window.authSystem.isUserLoggedIn()) {
        return;
    }
    
    renderUserStats();
    renderHistory();
    renderScenarioHistory();
}


