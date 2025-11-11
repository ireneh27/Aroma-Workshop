// 每日精油用量验证模块
// 检验每日累计接触精油的安全浓度

const DailyUsageValidator = {
    // 每日安全上限（ml）
    DAILY_SAFETY_LIMIT: 0.6,
    
    // 警告阈值（接近上限时提示）
    WARNING_THRESHOLD: 0.5,
    
    // 解析dailyAmount字符串，提取精油用量（ml）
    parseDailyAmount(dailyAmountStr) {
        if (!dailyAmountStr || typeof dailyAmountStr !== 'string') {
            return 0;
        }
        
        // 不计入皮肤接触量的配方（扩香等）
        if (dailyAmountStr.includes('不计入') || dailyAmountStr.includes('不计算') || 
            dailyAmountStr.includes('不计') || dailyAmountStr.includes('不计算')) {
            return 0;
        }
        
        // 先检查是否有吸收率说明（如"实际吸收30%"），需要先提取基础值
        const absorptionMatch = dailyAmountStr.match(/实际吸收[约]?(\d+)%/);
        let absorptionRate = 1;
        if (absorptionMatch) {
            absorptionRate = parseFloat(absorptionMatch[1]) / 100;
        }
        
        // 提取数字（支持小数、范围、百分比等）
        // 匹配模式：数字.数字ml 或 数字-数字ml
        const patterns = [
            /约?(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*ml/i,  // 范围：0.06-0.08ml
            /每次约?(\d+\.?\d*)\s*ml/i,                 // 每次：每次约0.27ml
            /约?(\d+\.?\d*)\s*ml/i,                     // 单个值：约0.06ml
            /(\d+\.?\d*)\s*ml/i                         // 简单格式：0.06ml
        ];
        
        for (const pattern of patterns) {
            const match = dailyAmountStr.match(pattern);
            if (match) {
                let value = 0;
                if (match[2]) {
                    // 范围值，取最大值（更安全）
                    const min = parseFloat(match[1]);
                    const max = parseFloat(match[2]);
                    value = max; // 使用最大值以确保安全
                } else {
                    value = parseFloat(match[1]);
                }
                // 应用吸收率
                return value * absorptionRate;
            }
        }
        
        return 0;
    },
    
    // 从配方中提取总精油量（ml）
    getFormulaTotalOilAmount(formula) {
        if (!formula) return 0;
        
        let totalMl = 0;
        
        if (formula.ingredients && Array.isArray(formula.ingredients)) {
            formula.ingredients.forEach(ing => {
                if (ing.name && ing.name.includes('精油') && ing.amount) {
                    // 解析精油用量（可能是滴数或ml）
                    const amountStr = ing.amount.toString();
                    
                    // 如果是滴数，转换为ml（1滴 ≈ 0.05ml）
                    const dropsMatch = amountStr.match(/(\d+)\s*滴/);
                    if (dropsMatch) {
                        const drops = parseFloat(dropsMatch[1]);
                        totalMl += drops * 0.05;
                    } else {
                        // 尝试直接解析ml
                        const mlMatch = amountStr.match(/(\d+\.?\d*)\s*ml/);
                        if (mlMatch) {
                            totalMl += parseFloat(mlMatch[1]);
                        }
                    }
                }
            });
        }
        
        return totalMl;
    },
    
    // 根据介质类型和总量计算使用天数
    calculateUsageDays(mediumType, baseAmount) {
        if (!baseAmount || baseAmount <= 0) return 1;
        
        switch (mediumType) {
            case 'handcream':
                // 护手霜：50g，使用周期约1个月（30天）
                return Math.max(30, Math.round(baseAmount / 50 * 30));
                
            case 'bodylotion':
                // 身体乳：100-200g，使用周期约2-3个月（60-90天）
                return Math.max(60, Math.round(baseAmount / 150 * 75));
                
            case 'base-oil':
                // 基础油（按摩油）：30-100ml，使用周期约3-6个月（90-180天）
                // 基础油（滚珠）：10-30ml，使用周期约1-2个月（30-60天）
                if (baseAmount < 30) {
                    return Math.max(30, Math.round(baseAmount / 20 * 45));
                } else {
                    return Math.max(90, Math.round(baseAmount / 65 * 135));
                }
                
            case 'footbath':
                // 泡脚/泡澡：每次现调，单次使用
                return 1;
                
            case 'spray':
            case 'rosewater-spray':
                // 喷雾（水基）：30-100ml，使用周期约1-2个月（30-60天）
                return Math.max(30, Math.round(baseAmount / 65 * 45));
                
            case 'rosewater':
                // 玫瑰水/纯露：50-200ml，使用周期约1个月（30天）
                return Math.max(30, Math.round(baseAmount / 125 * 30));
                
            case 'diffuser':
                // 扩香：单次使用，不计入皮肤接触量
                return 1;
                
            case 'alcohol-spray':
                // 乙醇喷雾：不计入皮肤接触量
                return 1;
                
            default:
                // 默认：按基础油计算
                return Math.max(90, Math.round(baseAmount / 65 * 135));
        }
    },
    
    // 从配方中提取基底总量（g或ml）
    getFormulaBaseAmount(formula) {
        if (!formula || !formula.ingredients) return 50; // 默认50
        
        let baseAmount = 0;
        
        formula.ingredients.forEach(ing => {
            if (ing.name && !ing.name.includes('精油')) {
                // 提取基底用量
                const amountStr = ing.amount ? ing.amount.toString() : '';
                const gMatch = amountStr.match(/(\d+)\s*g/);
                const mlMatch = amountStr.match(/(\d+)\s*ml/);
                
                if (gMatch) {
                    baseAmount += parseFloat(gMatch[1]);
                } else if (mlMatch) {
                    baseAmount += parseFloat(mlMatch[1]);
                }
            }
        });
        
        return baseAmount > 0 ? baseAmount : 50; // 如果找不到，使用默认值
    },
    
    // 从配方中提取每日用量（根据使用周期计算）
    // 重要：护手霜、身体乳等配方不会在一天内使用完，需要根据使用周期计算每日用量
    // 扩香和乙醇喷雾不直接接触皮肤，不计入皮肤接触量
    getFormulaDailyAmount(formula) {
        if (!formula) return 0;
        
        // 获取介质类型
        const mediumType = this.getFormulaMediumType(formula);
        
        // 扩香和乙醇喷雾不计入皮肤接触量，直接返回0
        if (mediumType === 'diffuser' || mediumType === 'alcohol-spray') {
            return 0;
        }
        
        // 优先使用dailyAmount字段（如果配方中已经明确标注了每日用量）
        if (formula.dailyAmount) {
            const parsed = this.parseDailyAmount(formula.dailyAmount);
            // 如果解析成功且不是"不计入"，直接返回（假设已经是每日用量）
            if (parsed > 0) {
                return parsed;
            }
        }
        
        // 如果没有dailyAmount字段，需要从总精油量和使用周期计算每日用量
        // 计算总精油量（从配方中的所有精油成分提取）
        const totalOilMl = this.getFormulaTotalOilAmount(formula);
        if (totalOilMl <= 0) {
            return 0;
        }
        
        // 获取基底总量（用于计算使用周期）
        const baseAmount = this.getFormulaBaseAmount(formula);
        
        // 根据介质类型和基底总量计算使用天数
        // 例如：护手霜50g使用约30天，身体乳150g使用约75天
        const usageDays = this.calculateUsageDays(mediumType, baseAmount);
        
        // 每日用量 = 总精油量 / 使用天数
        // 例如：总精油量0.3ml，使用30天，每日用量 = 0.3 / 30 = 0.01ml
        const dailyMl = usageDays > 0 ? totalOilMl / usageDays : totalOilMl;
        
        return dailyMl;
    },
    
    // 计算单个场景中所有配方的累计用量
    calculateScenarioDailyUsage(scenario) {
        if (!scenario || !scenario.timeline) {
            return { total: 0, formulas: [], warnings: [], scenarioName: scenario?.name || '未知场景' };
        }
        
        // 获取配方数据库（支持多种来源）
        const formulaDB = typeof FORMULA_DATABASE !== 'undefined' 
            ? FORMULA_DATABASE 
            : (typeof window !== 'undefined' && window.FORMULA_DATABASE 
                ? window.FORMULA_DATABASE 
                : {});
        
        if (Object.keys(formulaDB).length === 0) {
            console.warn('DailyUsageValidator: FORMULA_DATABASE not found');
            return { total: 0, formulas: [], warnings: [], scenarioName: scenario?.name || '未知场景' };
        }
        
        const formulaUsageMap = new Map(); // 配方ID -> 用量
        const formulaDetails = []; // 配方详情列表
        
        // 遍历场景的时间线
        scenario.timeline.forEach(timelineItem => {
            if (timelineItem.formulas) {
                timelineItem.formulas.forEach(formulaData => {
                    const formulaId = formulaData.formulaId;
                    
                    // 避免重复计算同一配方
                    if (!formulaUsageMap.has(formulaId)) {
                        const formula = formulaDB[formulaId];
                        if (formula) {
                            const amount = this.getFormulaDailyAmount(formula);
                            formulaUsageMap.set(formulaId, amount);
                            formulaDetails.push({
                                id: formulaId,
                                name: formula.name,
                                amount: amount,
                                mediumType: this.getFormulaMediumType(formula)
                            });
                        }
                    }
                });
            }
        });
        
        // 计算总量（包括所有配方，用于显示）
        const total = Array.from(formulaUsageMap.values()).reduce((sum, val) => sum + val, 0);
        
        // 只计算皮肤接触的用量（用于安全评估）
        // 注意：getFormulaDailyAmount 已经将扩香和乙醇喷雾的用量设为0
        // 但这里再次过滤以确保安全（双重检查）
        // 排除：扩香(diffuser)、乙醇喷雾(alcohol-spray) - 这些不直接接触皮肤
        // 包含：护手霜、身体乳、纯露、纯露喷雾、基础油、其他喷雾等
        const skinContactTotal = formulaDetails
            .filter(f => {
                const mediumType = f.mediumType || 'base-oil';
                // 排除不计入皮肤接触量的介质类型
                // 扩香和乙醇喷雾不直接接触皮肤，不计入每日用量
                return mediumType !== 'diffuser' && mediumType !== 'alcohol-spray';
            })
            .reduce((sum, f) => sum + f.amount, 0);
        
        // 生成警告信息（基于皮肤接触总量）
        const warnings = [];
        if (skinContactTotal > this.DAILY_SAFETY_LIMIT) {
            warnings.push({
                level: 'danger',
                message: `每日皮肤接触精油用量 ${skinContactTotal.toFixed(3)}ml 超过安全上限(≤${this.DAILY_SAFETY_LIMIT}ml)！请减少配方使用量。`
            });
        } else if (skinContactTotal > this.WARNING_THRESHOLD) {
            warnings.push({
                level: 'warning',
                message: `每日皮肤接触精油用量 ${skinContactTotal.toFixed(3)}ml 接近安全上限(≤${this.DAILY_SAFETY_LIMIT}ml)，请谨慎使用。`
            });
        }
        
        return {
            total: total,
            skinContactTotal: skinContactTotal,
            formulas: formulaDetails,
            warnings: warnings,
            isSafe: skinContactTotal <= this.DAILY_SAFETY_LIMIT,
            isWarning: skinContactTotal > this.WARNING_THRESHOLD && skinContactTotal <= this.DAILY_SAFETY_LIMIT,
            scenarioName: scenario?.name || '未知场景'
        };
    },
    
    // 计算场景中所有配方的累计用量（保留原函数以兼容）
    calculateTotalDailyUsage(scenarios) {
        if (!scenarios || !scenarios.scenarios) {
            return { total: 0, formulas: [], warnings: [] };
        }
        
        // 获取配方数据库（支持多种来源）
        const formulaDB = typeof FORMULA_DATABASE !== 'undefined' 
            ? FORMULA_DATABASE 
            : (typeof window !== 'undefined' && window.FORMULA_DATABASE 
                ? window.FORMULA_DATABASE 
                : {});
        
        if (Object.keys(formulaDB).length === 0) {
            console.warn('DailyUsageValidator: FORMULA_DATABASE not found');
            return { total: 0, formulas: [], warnings: [] };
        }
        
        const formulaUsageMap = new Map(); // 配方ID -> 用量
        const formulaDetails = []; // 配方详情列表
        
        // 遍历所有场景和时间线
        scenarios.scenarios.forEach(scenario => {
            if (scenario.timeline) {
                scenario.timeline.forEach(timelineItem => {
                    if (timelineItem.formulas) {
                        timelineItem.formulas.forEach(formulaData => {
                            const formulaId = formulaData.formulaId;
                            
                            // 避免重复计算同一配方
                            if (!formulaUsageMap.has(formulaId)) {
                                const formula = formulaDB[formulaId];
                                if (formula) {
                                    const amount = this.getFormulaDailyAmount(formula);
                                    formulaUsageMap.set(formulaId, amount);
                                    formulaDetails.push({
                                        id: formulaId,
                                        name: formula.name,
                                        amount: amount,
                                        mediumType: this.getFormulaMediumType(formula)
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
        
        // 计算总量
        const total = Array.from(formulaUsageMap.values()).reduce((sum, val) => sum + val, 0);
        
        // 只计算皮肤接触的用量
        // 排除：扩香(diffuser)、乙醇喷雾(alcohol-spray)
        // 包含：护手霜、身体乳、纯露、纯露喷雾、基础油、其他喷雾等
        const skinContactTotal = formulaDetails
            .filter(f => {
                const mediumType = f.mediumType || 'base-oil';
                // 排除不计入皮肤接触量的介质类型
                return mediumType !== 'diffuser' && mediumType !== 'alcohol-spray';
            })
            .reduce((sum, f) => sum + f.amount, 0);
        
        // 生成警告信息（基于皮肤接触总量）
        const warnings = [];
        if (skinContactTotal > this.DAILY_SAFETY_LIMIT) {
            warnings.push({
                level: 'danger',
                message: `每日皮肤接触精油用量 ${skinContactTotal.toFixed(2)}ml 超过安全上限(≤${this.DAILY_SAFETY_LIMIT}ml)！请减少配方使用量。`
            });
        } else if (skinContactTotal > this.WARNING_THRESHOLD) {
            warnings.push({
                level: 'warning',
                message: `每日皮肤接触精油用量 ${skinContactTotal.toFixed(2)}ml 接近安全上限(≤${this.DAILY_SAFETY_LIMIT}ml)，请谨慎使用。`
            });
        }
        
        return {
            total: total,
            skinContactTotal: skinContactTotal,
            formulas: formulaDetails,
            warnings: warnings,
            isSafe: skinContactTotal <= this.DAILY_SAFETY_LIMIT,
            isWarning: skinContactTotal > this.WARNING_THRESHOLD && skinContactTotal <= this.DAILY_SAFETY_LIMIT
        };
    },
    
    // 获取配方的介质类型
    getFormulaMediumType(formula) {
        if (!formula) return 'base-oil';
        
        const name = (formula.name || '').toLowerCase();
        const subtitle = (formula.subtitle || '').toLowerCase();
        const allText = name + ' ' + subtitle;
        
        // 检查配方中的ingredients来判断介质类型
        let hasRosewater = false;
        let hasAlcohol = false;
        let hasHandcream = false;
        let hasBodylotion = false;
        
        if (formula.ingredients && Array.isArray(formula.ingredients)) {
            formula.ingredients.forEach(ing => {
                const ingName = (ing.name || '').toLowerCase();
                if (ingName.includes('纯露') || (ingName.includes('玫瑰') && ingName.includes('水'))) {
                    hasRosewater = true;
                }
                if (ingName.includes('乙醇') || ingName.includes('酒精') || ingName.includes('双脱醛')) {
                    hasAlcohol = true;
                }
                if (ingName.includes('护手霜')) {
                    hasHandcream = true;
                }
                if (ingName.includes('身体乳')) {
                    hasBodylotion = true;
                }
            });
        }
        
        // 扩香（不计入皮肤接触量）
        if (allText.includes('扩香') || allText.includes('diffuser')) {
            return 'diffuser';
        }
        
        // 泡脚/泡澡
        if (allText.includes('泡脚') || allText.includes('泡澡') || allText.includes('footbath') || allText.includes('bath')) {
            return 'footbath';
        }
        
        // 护手霜（计入皮肤接触量，但不会一次用完，dailyAmount应该是每次使用量）
        if (hasHandcream || allText.includes('护手霜') || allText.includes('handcream')) {
            return 'handcream';
        }
        
        // 身体乳（计入皮肤接触量，但不会一次用完，dailyAmount应该是每次使用量）
        if (hasBodylotion || allText.includes('身体乳') || allText.includes('bodylotion')) {
            return 'bodylotion';
        }
        
        // 纯露（直接接触皮肤，计入皮肤接触量）
        if (hasRosewater || allText.includes('纯露') || allText.includes('rosewater')) {
            // 如果是纯露喷雾，仍然计入皮肤接触量
            if (allText.includes('喷雾') || allText.includes('spray')) {
                return 'rosewater-spray'; // 纯露喷雾，计入皮肤接触量
            }
            return 'rosewater';
        }
        
        // 乙醇喷雾（不直接接触皮肤，不计入皮肤接触量）
        if (hasAlcohol && (allText.includes('喷雾') || allText.includes('spray'))) {
            return 'alcohol-spray'; // 乙醇喷雾，不计入皮肤接触量
        }
        
        // 其他喷雾（默认计入皮肤接触量，除非明确是乙醇）
        if (allText.includes('喷雾') || allText.includes('spray')) {
            return 'spray';
        }
        
        // 默认基础油（计入皮肤接触量）
        return 'base-oil';
    },
    
    // 生成单个场景的安全评估HTML卡片
    generateSafetyAssessmentCard(usageData, scenarioIndex = 0) {
        if (!usageData || usageData.formulas.length === 0) {
            return '';
        }
        
        const { total, formulas, warnings, isSafe, isWarning, scenarioName } = usageData;
        
        // 按介质类型分组
        const formulasByMedium = {};
        formulas.forEach(f => {
            const medium = f.mediumType || 'base-oil';
            if (!formulasByMedium[medium]) {
                formulasByMedium[medium] = [];
            }
            formulasByMedium[medium].push(f);
        });
        
        // 计算各介质类型的用量
        const mediumTotals = {};
        Object.keys(formulasByMedium).forEach(medium => {
            mediumTotals[medium] = formulasByMedium[medium].reduce((sum, f) => sum + f.amount, 0);
        });
        
        // 使用计算好的皮肤接触总量
        const skinContactTotal = usageData.skinContactTotal || (total - (mediumTotals['diffuser'] || 0) - (mediumTotals['alcohol-spray'] || 0));
        
        // 状态样式（基于皮肤接触总量）
        let statusClass = 'safe';
        let statusText = '安全范围';
        let statusIcon = '✓';
        
        if (skinContactTotal > this.DAILY_SAFETY_LIMIT) {
            statusClass = 'danger';
            statusText = '超出上限';
            statusIcon = '⚠';
        } else if (skinContactTotal > this.WARNING_THRESHOLD || isWarning) {
            statusClass = 'warning';
            statusText = '接近上限';
            statusIcon = '⚠';
        }
        
        let html = `
            <div class="daily-usage-assessment" style="
                background: ${statusClass === 'danger' ? '#fee2e2' : statusClass === 'warning' ? '#fef3c7' : '#d1fae5'};
                border: 2px solid ${statusClass === 'danger' ? '#dc2626' : statusClass === 'warning' ? '#f59e0b' : '#10b981'};
                border-radius: 12px;
                padding: 20px;
                margin: 0;
                height: 100%;
                box-sizing: border-box;
            ">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 24px; margin-right: 10px;">${statusIcon}</span>
                    <h3 style="margin: 0; color: ${statusClass === 'danger' ? '#991b1b' : statusClass === 'warning' ? '#92400e' : '#065f46'};">
                        ${scenarioName ? `场景 ${scenarioIndex + 1}: ${scenarioName}` : '每日精油用量安全评估'}
                    </h3>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">皮肤接触总量</div>
                        <div style="font-size: 24px; font-weight: 600; color: ${skinContactTotal > this.DAILY_SAFETY_LIMIT ? '#dc2626' : skinContactTotal > this.WARNING_THRESHOLD ? '#f59e0b' : '#10b981'};">
                            ${skinContactTotal.toFixed(2)}ml
                        </div>
                        <div style="font-size: 11px; color: #999; margin-top: 5px;">
                            安全上限: ≤${this.DAILY_SAFETY_LIMIT}ml
                        </div>
                    </div>
                    ${mediumTotals['diffuser'] ? `
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">扩香用量</div>
                        <div style="font-size: 24px; font-weight: 600; color: #667eea;">
                            ${mediumTotals['diffuser'].toFixed(2)}ml
                        </div>
                        <div style="font-size: 11px; color: #999; margin-top: 5px;">
                            (不计入皮肤接触)
                        </div>
                    </div>
                    ` : ''}
                    ${mediumTotals['alcohol-spray'] ? `
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">乙醇喷雾用量</div>
                        <div style="font-size: 24px; font-weight: 600; color: #667eea;">
                            ${mediumTotals['alcohol-spray'].toFixed(2)}ml
                        </div>
                        <div style="font-size: 11px; color: #999; margin-top: 5px;">
                            (不计入皮肤接触)
                        </div>
                    </div>
                    ` : ''}
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">状态</div>
                        <div style="font-size: 18px; font-weight: 600; color: ${statusClass === 'danger' ? '#dc2626' : statusClass === 'warning' ? '#f59e0b' : '#10b981'};">
                            ${statusText}
                        </div>
                    </div>
                </div>
                
                ${warnings.length > 0 ? `
                <div style="margin-bottom: 15px;">
                    ${warnings.map(w => `
                        <div style="
                            padding: 12px;
                            background: ${w.level === 'danger' ? '#fee2e2' : '#fef3c7'};
                            border-left: 4px solid ${w.level === 'danger' ? '#dc2626' : '#f59e0b'};
                            border-radius: 4px;
                            margin-bottom: 8px;
                            font-size: 14px;
                            color: ${w.level === 'danger' ? '#991b1b' : '#92400e'};
                        ">
                            <strong>${w.level === 'danger' ? '⚠️ 警告' : '⚠️ 提示'}:</strong> ${w.message}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; font-weight: 600; color: #333; padding: 10px; background: white; border-radius: 6px;">
                        查看详细用量分解
                    </summary>
                    <div style="margin-top: 15px; background: white; padding: 15px; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #f5f5f5;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">配方名称</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">介质类型</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">每日用量</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${formulas.map(f => `
                                    <tr>
                                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${f.name}</td>
                                        <td style="padding: 8px; border-bottom: 1px solid #eee;">
                                            ${this.getMediumName(f.mediumType)}
                                        </td>
                                        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">
                                            ${f.amount > 0 ? f.amount.toFixed(2) + 'ml' : '不计入'}
                                        </td>
                                    </tr>
                                `).join('')}
                                <tr style="background: #f9f9f9; font-weight: 600;">
                                    <td style="padding: 10px; border-top: 2px solid #ddd;" colspan="2">皮肤接触总量</td>
                                    <td style="padding: 10px; text-align: right; border-top: 2px solid #ddd;">
                                        ${skinContactTotal.toFixed(2)}ml
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </details>
            </div>
        `;
        
        return html;
    },
    
    // 生成安全评估HTML（保留原函数以兼容）
    generateSafetyAssessmentHTML(usageData) {
        return this.generateSafetyAssessmentCard(usageData, 0);
    },
    
    // 生成多个场景的安全评估HTML（平行显示）
    generateMultipleSafetyAssessmentsHTML(scenarios) {
        if (!scenarios || !scenarios.scenarios || scenarios.scenarios.length === 0) {
            return '';
        }
        
        // 为每个场景计算用量
        const assessments = scenarios.scenarios.map((scenario, index) => {
            const usageData = this.calculateScenarioDailyUsage(scenario);
            return {
                usageData,
                index
            };
        }).filter(a => a.usageData && a.usageData.formulas.length > 0);
        
        if (assessments.length === 0) {
            return '';
        }
        
        // 生成平行显示的卡片容器
        const cardsHTML = assessments.map(a => 
            this.generateSafetyAssessmentCard(a.usageData, a.index)
        ).join('');
        
        return `
            <div class="safety-assessments-container" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                gap: 20px;
                margin: 30px 0;
                width: 100%;
                box-sizing: border-box;
            ">
                ${cardsHTML}
            </div>
        `;
    },
    
    // 获取介质名称
    getMediumName(mediumType) {
        const names = {
            'base-oil': '基础油',
            'handcream': '护手霜',
            'bodylotion': '身体乳',
            'rosewater': '纯露',
            'rosewater-spray': '纯露喷雾',
            'alcohol': '酒精',
            'alcohol-spray': '乙醇喷雾',
            'footbath': '泡脚/泡澡',
            'diffuser': '扩香',
            'spray': '喷雾'
        };
        return names[mediumType] || '未知';
    }
};

