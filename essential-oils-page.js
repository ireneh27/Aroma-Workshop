// 精油列表页面逻辑 - 按分类动态生成精油卡片

document.addEventListener('DOMContentLoaded', function() {
    renderOilCardsByCategory();
    // 渲染完成后初始化导航
    setTimeout(initSidebarNavigation, 100);
});

// 生成单个精油卡片
function renderOilCard(oil, types) {
    // 生成类型标签
    const typeTags = oil.types.map(type => {
        const typeInfo = types[type];
        if (!typeInfo) return '';
        return `
            <span class="oil-type-tag-small" style="background: ${typeInfo.color};">
                ${typeInfo.name}
            </span>
        `;
    }).join('');
    
    // 生成主要功效（显示前3个）
    const mainProperties = oil.properties.main.slice(0, 3).join('、');
    
    // 生成适用症状（显示前3个）
    const symptoms = oil.properties.symptoms.slice(0, 3).join('、');
    
    // 判断警告级别
    const cautionClass = oil.caution.includes('禁用') ? 'oil-caution-danger' : 
                       oil.caution.includes('慎用') ? 'oil-caution-warning' : 'oil-caution';
    
    return `
        <a href="oil-detail.html?oil=${encodeURIComponent(oil.name)}" class="oil-card-link">
            <div class="oil-card">
                <div class="oil-card-header">
                    <div class="oil-name">${oil.name}</div>
                    <div class="oil-latin">${oil.latin}</div>
                </div>
                <div class="oil-types-container">
                    ${typeTags}
                </div>
                <div class="oil-properties">
                    <strong>主要功效:</strong> ${mainProperties}${oil.properties.main.length > 3 ? '...' : ''}<br>
                    <strong>适用症状:</strong> ${symptoms}${oil.properties.symptoms.length > 3 ? '...' : ''}<br>
                    <strong>有效成分:</strong> ${oil.properties.energy}
                </div>
                <div class="${cautionClass}">${oil.caution}</div>
            </div>
        </a>
    `;
}

// 按分类渲染精油卡片
function renderOilCardsByCategory() {
    const oilContainer = document.getElementById('oilGrid');
    if (!oilContainer) return;
    
    const types = getAllTypes();
    const allOils = getAllOils();
    
    // 定义分类顺序
    const categoryOrder = ['floral', 'woody', 'citrus', 'herbal', 'resin', 'spice', 'mint'];
    
    let html = '';
    
    // 渲染"全部精油"部分
    html += `
        <div id="all-oils" class="oil-category-section" style="scroll-margin-top: 100px;">
            <h2 class="oil-section-title">全部精油</h2>
            <p style="color: var(--secondary-color); margin-bottom: 20px; font-size: 14px;">
                共 ${allOils.length} 种精油
            </p>
            <div class="oil-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; margin: 20px 0;">
                ${allOils.map(oil => renderOilCard(oil, types)).join('')}
            </div>
        </div>
    `;
    
    // 按分类渲染
    categoryOrder.forEach(typeKey => {
        const typeInfo = types[typeKey];
        if (!typeInfo) return;
        
        const oilsInCategory = getOilsByType(typeKey);
        if (oilsInCategory.length === 0) return;
        
        html += `
            <div id="type-${typeKey}" class="oil-category-section" style="scroll-margin-top: 100px;">
                <h2 class="oil-section-title">${typeInfo.name}</h2>
                <p style="color: var(--secondary-color); margin-bottom: 20px; font-size: 14px;">
                    共 ${oilsInCategory.length} 种精油
                </p>
                <div class="oil-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; margin: 20px 0;">
                    ${oilsInCategory.map(oil => renderOilCard(oil, types)).join('')}
                </div>
            </div>
        `;
    });
    
    oilContainer.innerHTML = html;
    
    // 触发自定义事件，通知导航已渲染完成
    window.dispatchEvent(new CustomEvent('oilSectionsRendered'));
    
    // 确保所有section初始可见
    const allSections = document.querySelectorAll('.oil-category-section');
    allSections.forEach(section => {
        section.style.display = 'block';
        section.style.opacity = '1';
    });
}

// 初始化侧边栏导航功能（防止重复初始化）
let navigationInitialized = false;
function initSidebarNavigation() {
    if (navigationInitialized) return; // 防止重复初始化
    
    const sidebarNav = document.getElementById('sidebarNav');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (!sidebarNav) return;
    
    const navLinks = sidebarNav.querySelectorAll('a');
    if (navLinks.length === 0) return;
    
    navigationInitialized = true;
    
    // 移动端切换按钮
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebarNav.classList.toggle('open');
        });
    }
    
    // 点击导航链接后，移动端自动关闭侧边栏
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 1024) {
                sidebarNav.classList.remove('open');
            }
        });
    });
    
    // 当前选中的筛选类型
    let currentFilter = 'all-oils';
    
    // 筛选显示精油分类
    function filterOilCategory(categoryId) {
        const allSections = document.querySelectorAll('.oil-category-section');
        const filterIndicator = document.getElementById('filterIndicator');
        const filterText = document.getElementById('filterText');
        
        // 获取分类名称
        let categoryName = '全部精油';
        if (categoryId !== 'all-oils') {
            const clickedLink = Array.from(navLinks).find(link => link.getAttribute('href') === '#' + categoryId);
            if (clickedLink) {
                categoryName = clickedLink.textContent.trim();
            }
        }
        
        if (categoryId === 'all-oils') {
            // 显示所有分类
            allSections.forEach(section => {
                section.style.display = 'block';
                section.style.opacity = '0';
                setTimeout(() => {
                    section.style.transition = 'opacity 0.3s ease';
                    section.style.opacity = '1';
                }, 10);
            });
            currentFilter = 'all-oils';
            if (filterIndicator) {
                filterIndicator.style.display = 'none';
            }
        } else {
            // 只显示选中的分类
            allSections.forEach(section => {
                if (section.id === categoryId) {
                    section.style.display = 'block';
                    section.style.opacity = '0';
                    setTimeout(() => {
                        section.style.transition = 'opacity 0.3s ease';
                        section.style.opacity = '1';
                    }, 10);
                } else {
                    section.style.transition = 'opacity 0.3s ease';
                    section.style.opacity = '0';
                    setTimeout(() => {
                        section.style.display = 'none';
                    }, 300);
                }
            });
            currentFilter = categoryId;
            if (filterIndicator && filterText) {
                filterText.textContent = categoryName;
                filterIndicator.style.display = 'block';
            }
        }
        
        // 更新导航高亮
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + categoryId) {
                link.classList.add('active');
            }
        });
        
        // 滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // 导航点击事件 - 筛选显示
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            filterOilCategory(targetId);
        });
    });
    
    // 等待section渲染完成后再初始化筛选
    setTimeout(() => {
        const sections = document.querySelectorAll('.oil-category-section');
        if (sections.length > 0) {
            // 初始显示全部
            filterOilCategory('all-oils');
        }
    }, 200);
    
    // 点击外部区域关闭移动端侧边栏
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1024) {
            if (!sidebarNav.contains(e.target) && sidebarToggle && !sidebarToggle.contains(e.target)) {
                sidebarNav.classList.remove('open');
            }
        }
    });
}

