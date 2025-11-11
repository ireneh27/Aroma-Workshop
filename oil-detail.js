// 精油详情页逻辑

document.addEventListener('DOMContentLoaded', function() {
    // 从URL参数获取精油名称
    const urlParams = new URLSearchParams(window.location.search);
    const oilName = decodeURIComponent(urlParams.get('oil') || '');
    
    if (!oilName) {
        document.getElementById('oilDetailContent').innerHTML = `
            <div style="text-align: center; padding: 50px 20px;">
                <p style="color: var(--error-color);">未找到精油信息</p>
                <a href="essential-oils.html" class="back-link">返回精油列表</a>
            </div>
        `;
        return;
    }
    
    // 获取精油数据
    const oilData = getOilData(oilName);
    
    if (!oilData) {
        document.getElementById('oilDetailContent').innerHTML = `
            <div style="text-align: center; padding: 50px 20px;">
                <p style="color: var(--error-color);">未找到精油信息: ${oilName}</p>
                <a href="essential-oils.html" class="back-link">返回精油列表</a>
            </div>
        `;
        return;
    }
    
    // 渲染精油详情
    renderOilDetail(oilData);
});

function renderOilDetail(oilData) {
    const container = document.getElementById('oilDetailContent');
    const types = getAllTypes();
    
    // 生成类型标签
    const typeTags = oilData.types.map(type => {
        const typeInfo = types[type];
        if (!typeInfo) return '';
        return `
            <span class="oil-type-tag" style="background: ${typeInfo.color};">
                ${typeInfo.icon} ${typeInfo.name}
            </span>
        `;
    }).join('');
    
    // 生成主要功效列表
    const mainProperties = oilData.properties.main.map(prop => 
        `<li>${prop}</li>`
    ).join('');
    
    // 生成适用症状列表
    const symptoms = oilData.properties.symptoms.map(symptom => 
        `<li>${symptom}</li>`
    ).join('');
    
    // 生成警告信息
    let cautionHTML = '';
    if (oilData.caution) {
        const cautionLevel = oilData.caution.includes('禁用') ? 'caution-box' : 
                           oilData.caution.includes('慎用') ? 'warning-box' : 'info-box';
        cautionHTML = `
            <div class="${cautionLevel}">
                <strong>注意事项：</strong> ${oilData.caution}
            </div>
        `;
    }
    
    // 生成图片HTML
    const imageHTML = oilData.imageUrl ? `
        <div class="oil-image-container">
            <img src="${oilData.imageUrl}" alt="${oilData.name}" class="oil-image" loading="lazy">
        </div>
    ` : '';
    
    // 生成基本信息网格
    const infoGridHTML = `
        <div class="oil-info-grid">
            ${oilData.origin ? `
            <div class="oil-info-item">
                <span class="oil-info-label">常见产地：</span>
                <span class="oil-info-value">${oilData.origin}</span>
            </div>
            ` : ''}
            ${oilData.extractionMethod ? `
            <div class="oil-info-item">
                <span class="oil-info-label">萃取方法：</span>
                <span class="oil-info-value">${oilData.extractionMethod}</span>
            </div>
            ` : ''}
            <div class="oil-info-item">
                <span class="oil-info-label">最大浓度：</span>
                <span class="oil-info-value"><span class="concentration-info">${oilData.maxConcentration}%</span></span>
            </div>
        </div>
    `;
    
    // 生成卡片内容
    const cards = [];
    
    // 有效成分卡片（放在最前面）
    cards.push(`
        <div class="oil-info-card">
            <h3 class="oil-card-title">有效成分</h3>
            <p class="oil-card-content">${oilData.properties.energy}</p>
        </div>
    `);
    
    // 详细说明卡片（放在有效成分后面）
    if (oilData.description) {
        cards.push(`
            <div class="oil-info-card">
                <h3 class="oil-card-title">详细说明</h3>
                <p class="oil-card-content">${oilData.description}</p>
            </div>
        `);
    }
    
    // 主要功效卡片
    cards.push(`
        <div class="oil-info-card">
            <h3 class="oil-card-title">主要功效</h3>
            <ul class="oil-property-list">
                ${mainProperties}
            </ul>
        </div>
    `);
    
    // 适用症状卡片
    cards.push(`
        <div class="oil-info-card">
            <h3 class="oil-card-title">适用症状</h3>
            <ul class="oil-property-list">
                ${symptoms}
            </ul>
        </div>
    `);
    
    // 使用方法卡片
    if (oilData.usage) {
        cards.push(`
            <div class="oil-info-card">
                <h3 class="oil-card-title">使用方法</h3>
                <p class="oil-card-content">${oilData.usage}</p>
            </div>
        `);
    }
    
    // 搭配建议卡片
    if (oilData.blending) {
        cards.push(`
            <div class="oil-info-card">
                <h3 class="oil-card-title">搭配建议</h3>
                <p class="oil-card-content">${oilData.blending}</p>
            </div>
        `);
    }
    
    const html = `
        <div class="oil-detail-header">
            <div class="oil-header-info">
                <h1 class="oil-detail-title">${oilData.name}</h1>
                <div class="oil-detail-latin">${oilData.latin}</div>
                <div class="oil-types-section">
                    ${typeTags}
                </div>
                ${infoGridHTML}
            </div>
            ${imageHTML}
        </div>
        
        <div class="oil-detail-content">
            <div class="oil-cards-grid">
                ${cards.join('')}
            </div>
            
            ${cautionHTML}
        </div>
    `;
    
    container.innerHTML = html;
    
    // 更新页面标题
    document.title = `${oilData.name} - 精油详情 - 个性化芳疗方案`;
}

