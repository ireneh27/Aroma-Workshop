// 配方筛选系统 - 根据精油和基底类型筛选配方

// 基底类型映射（与 formula-library.js 保持一致）
// 注意：如果 BASE_TYPE_MAP 已定义（来自 formula-library.js），则使用它
// 否则使用本地定义
const BASE_TYPES = typeof BASE_TYPE_MAP !== 'undefined' ? BASE_TYPE_MAP : {
    'handcream': {
        name: '护手霜',
        keywords: ['护手霜', 'handcream', 'hand cream'],
        icon: '✋',
        class: 'base-type-handcream'
    },
    'bodylotion': {
        name: '身体乳',
        keywords: ['身体乳', 'bodylotion', 'body lotion'],
        icon: '🧴',
        class: 'base-type-bodylotion'
    },
    'footbath': {
        name: '泡脚/泡澡',
        keywords: ['泡脚', '泡澡', 'footbath', 'foot bath', 'bath'],
        icon: '🛁',
        class: 'base-type-footbath'
    },
    'diffuser': {
        name: '扩香',
        keywords: ['扩香', 'diffuser', 'diffusion'],
        icon: '💨',
        class: 'base-type-diffuser'
    },
    'spray': {
        name: '喷雾',
        keywords: ['喷雾', 'spray'],
        icon: '💧',
        class: 'base-type-spray'
    }
};

// 从配方数据库中提取所有精油名称
function getAllEssentialOils() {
    const oils = new Set();
    
    Object.values(FORMULA_DATABASE).forEach(formula => {
        formula.ingredients.forEach(ing => {
            // 提取精油名称（包含"精油"的项）
            if (ing.name.includes('精油')) {
                const oilName = ing.name.replace('精油', '').trim();
                oils.add(oilName);
            }
        });
    });
    
    return Array.from(oils).sort();
}

// 获取配方的基底类型（本地实现，用于 formula-filter.js）
// 注意：在 formula-library.html 中，formula-library.js 会在之后加载并覆盖此函数
function getFormulaBaseType(formula) {
    // 如果 BASE_TYPE_MAP 已定义（来自 formula-library.js），使用其逻辑
    if (typeof BASE_TYPE_MAP !== 'undefined') {
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
            if (formula.id.match(/^formula-b[0-9]+$/) ||
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
            if (formula.id.match(/^formula-d[0-9]*$/) ||
                formula.id === 'formula-b' || formula.id.match(/^formula-b[0-5]$/)) {
                return 'diffuser';
            }
            // 喷雾配方 - E系列
            if (formula.id.match(/^formula-e[0-9]*$/) ||
                formula.id.match(/^formula-x[0-9]*$/) || formula.id === 'formula-x') {
                return 'spray';
            }
        }
        
        return 'handcream'; // 默认
    }
    
    // 否则使用 BASE_TYPES（向后兼容）
    const ingredientsText = formula.ingredients.map(i => i.name).join(' ');
    const subtitle = formula.subtitle || '';
    const name = formula.name || '';
    const allText = ingredientsText + subtitle + name;
    
    // 检查扩香（优先级最高，因为可能包含其他关键词）
    if (BASE_TYPES['diffuser'] && BASE_TYPES['diffuser'].keywords.some(keyword => allText.includes(keyword))) {
        return 'diffuser';
    }
    
    // 检查喷雾
    if (BASE_TYPES['spray'] && BASE_TYPES['spray'].keywords.some(keyword => allText.includes(keyword))) {
        return 'spray';
    }
    
    // 检查泡脚/泡澡
    if (BASE_TYPES['footbath'] && BASE_TYPES['footbath'].keywords.some(keyword => allText.includes(keyword))) {
        return 'footbath';
    }
    
    // 检查身体乳
    if (BASE_TYPES['bodylotion'] && BASE_TYPES['bodylotion'].keywords.some(keyword => allText.includes(keyword))) {
        return 'bodylotion';
    }
    
    // 检查护手霜
    if (BASE_TYPES['handcream'] && BASE_TYPES['handcream'].keywords.some(keyword => allText.includes(keyword))) {
        return 'handcream';
    }
    
    return 'other';
}

// 检查配方是否包含选定的精油
function formulaContainsOils(formula, selectedOils) {
    if (!selectedOils || selectedOils.length === 0) return true;
    
    const formulaOils = formula.ingredients
        .filter(ing => ing.name.includes('精油'))
        .map(ing => ing.name.replace('精油', '').trim());
    
    // 检查是否所有选定的精油都在配方中
    return selectedOils.every(oil => formulaOils.includes(oil));
}

// 筛选配方
function filterFormulas(selectedOils = [], baseType = null) {
    const formulas = Object.values(FORMULA_DATABASE);
    
    return formulas.filter(formula => {
        // 检查基底类型
        if (baseType && baseType !== 'all') {
            const formulaBaseType = getFormulaBaseType(formula);
            if (formulaBaseType !== baseType) {
                return false;
            }
        }
        
        // 检查精油
        if (selectedOils && selectedOils.length > 0) {
            return formulaContainsOils(formula, selectedOils);
        }
        
        return true;
    });
}

// 渲染筛选结果
function renderFilteredFormulas(formulas) {
    const container = document.getElementById('filteredFormulas');
    if (!container) return;
    
    // 检查是否在 formula-library.html 页面（有 category-section 元素）
    const categorySections = document.querySelectorAll('.category-section');
    const isLibraryPage = categorySections.length > 0;
    
    if (formulas.length === 0) {
        container.innerHTML = `
            <div class="formula-box" style="text-align: center; padding: 40px; background: #f8f9fa;">
                <p style="font-size: 18px; color: var(--secondary-color); margin: 0;">
                    😔 没有找到匹配的配方
                </p>
                <p style="font-size: 14px; color: var(--secondary-color); margin-top: 10px;">
                    请尝试调整筛选条件
                </p>
            </div>
        `;
        container.style.display = 'block';
        // 在 library 页面，显示分类区域
        if (isLibraryPage) {
            categorySections.forEach(section => section.style.display = 'block');
        }
        return;
    }
    
    // 如果有筛选结果，在 library 页面隐藏分类区域
    if (isLibraryPage) {
        categorySections.forEach(section => section.style.display = 'none');
        container.style.display = 'block';
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
    Object.entries(BASE_TYPES).forEach(([key, baseType]) => {
        if (grouped[key] && grouped[key].length > 0) {
            html += `
                <div style="margin: 40px 0;">
                    <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                        <span style="font-size: 24px;">${baseType.icon}</span>
                        <span>${baseType.name}基底配方 (${grouped[key].length}个)</span>
                    </h3>
            `;
            
            grouped[key].forEach(formula => {
                html += renderFilteredFormulaCard(formula);
            });
            
            html += `</div>`;
        }
    });
    
    // 其他类型
    if (grouped.other && grouped.other.length > 0) {
        html += `
            <div style="margin: 40px 0;">
                <h3 style="margin-bottom: 20px;">其他配方 (${grouped.other.length}个)</h3>
        `;
        grouped.other.forEach(formula => {
            html += renderFilteredFormulaCard(formula);
        });
        html += `</div>`;
    }
    
    container.innerHTML = html;
}

// 渲染单个配方卡片（用于筛选结果，返回完整配方框）
function renderFilteredFormulaCard(formula) {
    const baseType = getFormulaBaseType(formula);
    const baseTypeInfo = baseType ? BASE_TYPES[baseType] : null;
    
    // 提取精油列表
    const oils = formula.ingredients
        .filter(ing => ing.name.includes('精油'))
        .map(ing => ing.name.replace('精油', '').trim());
    
    return `
        <div class="formula-box" style="margin-bottom: 25px;">
            ${baseTypeInfo ? `<div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 10px;">
                ${baseTypeInfo.icon} ${baseTypeInfo.name}
            </div>` : ''}
            
            <div class="formula-title">${formula.name}</div>
            <div class="formula-subtitle">${formula.subtitle}</div>
            
            <div style="margin: 15px 0; padding: 12px; background: #f0f7ff; border-radius: 6px;">
                <strong style="color: var(--accent-color);">包含精油:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                    ${oils.map(oil => `
                        <a href="oil-detail.html?oil=${encodeURIComponent(oil)}" style="background: white; padding: 4px 10px; border-radius: 12px; font-size: 13px; border: 1px solid #667eea; text-decoration: none; display: inline-block; transition: all 0.2s ease;">
                            ${oil}
                        </a>
                    `).join('')}
                </div>
            </div>
            
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

// 初始化筛选器（整合到统一筛选系统）
function initFormulaFilter() {
    const oils = getAllEssentialOils();
    const oilSelect = document.getElementById('oilSelect');
    const baseTypeSelect = document.getElementById('baseTypeSelect');
    const filterBtn = document.getElementById('filterBtn');
    const clearBtn = document.getElementById('clearBtn');
    const selectedOilsDisplay = document.getElementById('selectedOilsDisplay');
    
    if (!oilSelect || !baseTypeSelect) return;
    
    // 检查是否在 library 页面（有统一筛选状态）
    const isLibraryPage = typeof UnifiedFilterState !== 'undefined';
    
    // 填充精油选择器
    oils.forEach(oil => {
        const option = document.createElement('option');
        option.value = oil;
        option.textContent = oil;
        oilSelect.appendChild(option);
    });
    
    // 填充基底类型选择器
    Object.entries(BASE_TYPES).forEach(([key, baseType]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${baseType.icon} ${baseType.name}`;
        baseTypeSelect.appendChild(option);
    });
    
    // 添加"全部"选项
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = '全部类型';
    allOption.selected = true;
    baseTypeSelect.insertBefore(allOption, baseTypeSelect.firstChild);
    
    // 精油多选处理（使用统一状态或本地状态）
    const selectedOils = isLibraryPage ? UnifiedFilterState.selectedOils : [];
    
    oilSelect.addEventListener('change', function() {
        const value = this.value;
        if (value && !selectedOils.includes(value)) {
            if (selectedOils.length >= 2) {
                alert('最多只能选择2种精油');
                this.value = '';
                return;
            }
            selectedOils.push(value);
            if (isLibraryPage) {
                UnifiedFilterState.selectedOils = selectedOils;
            }
            updateSelectedOilsDisplay();
            this.value = '';
            if (isLibraryPage) {
                applyUnifiedFilter();
            }
        }
    });
    
    // 更新已选精油显示
    function updateSelectedOilsDisplay() {
        if (selectedOilsDisplay) {
            if (selectedOils.length === 0) {
                selectedOilsDisplay.innerHTML = '<span style="color: var(--secondary-color);">未选择精油</span>';
            } else {
                selectedOilsDisplay.innerHTML = selectedOils.map((oil, index) => `
                    <span style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; margin-right: 8px;">
                        ${oil}
                        <button onclick="removeOil(${index})" style="background: rgba(255,255,255,0.3); border: none; color: white; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; font-size: 12px; line-height: 1;">×</button>
                    </span>
                `).join('');
            }
        }
    }
    
    // 移除精油
    window.removeOil = function(index) {
        selectedOils.splice(index, 1);
        if (isLibraryPage) {
            UnifiedFilterState.selectedOils = selectedOils;
        }
        updateSelectedOilsDisplay();
        if (isLibraryPage) {
            applyUnifiedFilter();
        } else {
            applyFilter();
        }
    };
    
    // 应用筛选（非 library 页面使用）
    function applyFilter() {
        const baseType = baseTypeSelect.value;
        const filtered = filterFormulas(selectedOils, baseType);
        renderFilteredFormulas(filtered);
        
        // 更新结果计数
        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            resultCount.textContent = filtered.length;
        }
    }
    
    // 筛选按钮
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            if (isLibraryPage) {
                // 在 library 页面，使用统一筛选
                applyUnifiedFilter();
            } else {
                // 在其他页面，使用原有逻辑
                applyFilter();
            }
        });
    }
    
    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            selectedOils.length = 0;
            baseTypeSelect.value = 'all';
            
            if (isLibraryPage) {
                // 在 library 页面，重置统一筛选状态
                UnifiedFilterState.selectedOils = [];
                UnifiedFilterState.baseTypeSelect = 'all';
                
                // 同步筛选按钮
                const filterButtons = document.querySelectorAll('.filter-btn');
                filterButtons.forEach(btn => {
                    if (btn.dataset.filter === 'all') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                UnifiedFilterState.baseTypeFilter = 'all';
                
                // 应用统一筛选
                applyUnifiedFilter();
            } else {
                // 在其他页面，使用原有逻辑
                updateSelectedOilsDisplay();
                
                const container = document.getElementById('filteredFormulas');
                const categorySections = document.querySelectorAll('.category-section');
                if (container) {
                    container.style.display = 'none';
                    container.innerHTML = '';
                }
                if (categorySections.length > 0) {
                    categorySections.forEach(section => section.style.display = 'block');
                }
                
                const resultCount = document.getElementById('resultCount');
                if (resultCount) {
                    resultCount.textContent = '0';
                }
            }
            
            updateSelectedOilsDisplay();
        });
    }
    
    // 基底类型变化时自动筛选
    baseTypeSelect.addEventListener('change', function() {
        if (isLibraryPage) {
            UnifiedFilterState.baseTypeSelect = this.value;
            
            // 同步筛选按钮
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => {
                if (btn.dataset.filter === this.value) {
                    btn.classList.add('active');
                    UnifiedFilterState.baseTypeFilter = this.value;
                } else {
                    btn.classList.remove('active');
                }
            });
            
            applyUnifiedFilter();
        } else {
            applyFilter();
        }
    });
    
    // 初始显示所有配方
    updateSelectedOilsDisplay();
    
    // 在 library 页面，初始时隐藏筛选结果区域
    if (isLibraryPage) {
        const container = document.getElementById('filteredFormulas');
        if (container) {
            container.style.display = 'none';
        }
    } else {
        // 在其他页面，延迟应用筛选
        setTimeout(() => {
            if (typeof FORMULA_DATABASE !== 'undefined' && Object.keys(FORMULA_DATABASE).length > 0) {
                applyFilter();
            }
        }, 200);
    }
}

// 页面加载时初始化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // 等待FORMULA_DATABASE加载
        const checkDatabase = setInterval(() => {
            if (typeof FORMULA_DATABASE !== 'undefined' && Object.keys(FORMULA_DATABASE).length > 0) {
                clearInterval(checkDatabase);
                initFormulaFilter();
            }
        }, 100);
        
        // 10秒后停止检查（防止无限等待）
        setTimeout(() => clearInterval(checkDatabase), 10000);
    });
}

