// 基于问卷数据的配方推荐系统
// 注意: 当前使用规则匹配系统，可扩展为AI API调用
// 如需使用AI API，可在 generatePersonalizedSuggestions 函数中调用外部API

// 配方数据库已移至独立的 formula-database.js 文件
// 请确保在使用此文件前先加载 formula-database.js
// FORMULA_DATABASE 对象在 formula-database.js 中定义

// 症状到配方的匹配规则
function calculateFormulaScores(questionnaireData) {
    if (!questionnaireData) return {};
    
    const scores = {};
    // 收集所有症状，排除"none"选项
    const allSymptoms = [];
    ['circulation', 'sleep', 'digestive', 'gynecological', 'constitution', 'other'].forEach(category => {
        const symptoms = questionnaireData[category] || [];
        symptoms.forEach(symptom => {
            if (symptom !== 'none' && !allSymptoms.includes(symptom)) {
                allSymptoms.push(symptom);
            }
        });
    });
    
    // 计算每个配方的匹配分数
    Object.keys(FORMULA_DATABASE).forEach(formulaId => {
        const formula = FORMULA_DATABASE[formulaId];
        let score = 0;
        
        // 性别匹配
        if (formula.gender && questionnaireData.gender !== formula.gender) {
            scores[formulaId] = 0;
            return;
        }
        
        // 孕期检查
        if (questionnaireData.pregnancy === 'yes' || questionnaireData.pregnancy === 'nursing') {
            // 孕期禁用某些配方
            if (['formula-c', 'formula-d', 'formula-f', 'formula-g', 'formula-h', 'formula-i'].includes(formulaId)) {
                scores[formulaId] = 0;
                return;
            }
        }
        
        // 症状匹配
        formula.matches.forEach(match => {
            if (allSymptoms.includes(match)) {
                score += 2;
            }
        });
        
        // 特殊注意事项
        const cautions = questionnaireData.caution || [];
        if (cautions.includes('hypertension') && ['formula-b', 'formula-d', 'formula-n'].includes(formulaId)) {
            score -= 1; // 高血压慎用迷迭香
        }
        if (cautions.includes('epilepsy') && ['formula-b', 'formula-d', 'formula-n', 'formula-i'].includes(formulaId)) {
            score = 0; // 癫痫禁用迷迭香和甜茴香
        }
        if (cautions.includes('sensitive')) {
            // 敏感肌优先推荐温和配方
            if (formulaId === 'formula-m') {
                score += 3; // 敏感肌专用配方
            } else if (['formula-c', 'formula-d', 'formula-j', 'formula-n', 'formula-a1', 'formula-a2'].includes(formulaId)) {
                score -= 2; // 敏感肌需谨慎使用
            }
        }
        
        scores[formulaId] = Math.max(0, score);
    });
    
    return scores;
}

// 生成个性化建议
// 支持AI增强推荐，如果AI不可用则回退到规则匹配系统
async function generatePersonalizedSuggestions(questionnaireData, useAI = false) {
    if (!questionnaireData) {
        return {
            hasData: false,
            message: '请先完成健康状况问卷以获取个性化配方建议',
            link: 'health-profile.html'
        };
    }
    
    // 规则匹配系统（基础推荐）
    const scores = calculateFormulaScores(questionnaireData);
    const sortedFormulas = Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 5) // 取前5个推荐
        .map(([formulaId]) => FORMULA_DATABASE[formulaId]);
    
    // 如果没有匹配的配方，返回通用推荐
    if (sortedFormulas.length === 0) {
        // 根据基本条件推荐
        if (questionnaireData.gender === 'female' && questionnaireData.pregnancy === 'no') {
            sortedFormulas.push(FORMULA_DATABASE['formula-a'], FORMULA_DATABASE['formula-e']);
        } else {
            sortedFormulas.push(FORMULA_DATABASE['formula-a'], FORMULA_DATABASE['formula-b']);
        }
    }
    
    // AI增强推荐（如果启用且可用）
    let aiRecommendation = null;
    if (useAI && typeof generateAIFormulaRecommendations !== 'undefined') {
        try {
            aiRecommendation = await generateAIFormulaRecommendations(questionnaireData, sortedFormulas);
        } catch (error) {
            console.warn('AI推荐失败，使用规则匹配系统:', error);
        }
    }
    
    // 分析主要症状
    const mainSymptoms = [];
    if (questionnaireData.circulation && questionnaireData.circulation.length > 0 && !questionnaireData.circulation.includes('none')) {
        mainSymptoms.push('循环问题');
    }
    if (questionnaireData.sleep && questionnaireData.sleep.length > 0 && !questionnaireData.sleep.includes('none')) {
        mainSymptoms.push('睡眠问题');
    }
    if (questionnaireData.digestive && questionnaireData.digestive.length > 0 && !questionnaireData.digestive.includes('none')) {
        mainSymptoms.push('消化问题');
    }
    if (questionnaireData.gynecological && questionnaireData.gynecological.length > 0 && !questionnaireData.gynecological.includes('none')) {
        mainSymptoms.push('妇科问题');
    }
    
    return {
        hasData: true,
        formulas: sortedFormulas,
        mainSymptoms: mainSymptoms,
        timestamp: questionnaireData.timestamp,
        aiRecommendation: aiRecommendation // AI生成的推荐理由
    };
}

// 同步版本（向后兼容）
function generatePersonalizedSuggestionsSync(questionnaireData) {
    if (!questionnaireData) {
        return {
            hasData: false,
            message: '请先完成健康状况问卷以获取个性化配方建议',
            link: 'health-profile.html'
        };
    }
    
    const scores = calculateFormulaScores(questionnaireData);
    const sortedFormulas = Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 5)
        .map(([formulaId]) => FORMULA_DATABASE[formulaId]);
    
    if (sortedFormulas.length === 0) {
        if (questionnaireData.gender === 'female' && questionnaireData.pregnancy === 'no') {
            sortedFormulas.push(FORMULA_DATABASE['formula-a'], FORMULA_DATABASE['formula-e']);
        } else {
            sortedFormulas.push(FORMULA_DATABASE['formula-a'], FORMULA_DATABASE['formula-b']);
        }
    }
    
    const mainSymptoms = [];
    if (questionnaireData.circulation && questionnaireData.circulation.length > 0 && !questionnaireData.circulation.includes('none')) {
        mainSymptoms.push('循环问题');
    }
    if (questionnaireData.sleep && questionnaireData.sleep.length > 0 && !questionnaireData.sleep.includes('none')) {
        mainSymptoms.push('睡眠问题');
    }
    if (questionnaireData.digestive && questionnaireData.digestive.length > 0 && !questionnaireData.digestive.includes('none')) {
        mainSymptoms.push('消化问题');
    }
    if (questionnaireData.gynecological && questionnaireData.gynecological.length > 0 && !questionnaireData.gynecological.includes('none')) {
        mainSymptoms.push('妇科问题');
    }
    
    return {
        hasData: true,
        formulas: sortedFormulas,
        mainSymptoms: mainSymptoms,
        timestamp: questionnaireData.timestamp
    };
}

// 生成AI风格的建议文本
// 如果AI服务可用，使用AI生成；否则使用规则匹配
async function generateAISuggestionTextAsync(questionnaireData, formula, useAI = false) {
    if (!questionnaireData || !formula) return '';
    
    // 尝试使用AI生成（如果启用）
    if (useAI && typeof window !== 'undefined' && window.generateAISuggestionText) {
        try {
            const aiText = await window.generateAISuggestionText(questionnaireData, formula);
            if (aiText) return aiText;
        } catch (error) {
            console.warn('AI生成建议文本失败，使用规则匹配:', error);
        }
    }
    
    // 回退到规则匹配系统
    return generateAISuggestionTextSync(questionnaireData, formula);
}

// 同步版本（向后兼容）
function generateAISuggestionTextSync(questionnaireData, formula) {
    if (!questionnaireData || !formula) return '';
    
    const symptoms = [];
    if (questionnaireData.circulation && questionnaireData.circulation.includes('cold-feet')) {
        symptoms.push('手脚冰凉');
    }
    if (questionnaireData.sleep && questionnaireData.sleep.includes('poor')) {
        symptoms.push('睡眠质量差');
    }
    if (questionnaireData.digestive && questionnaireData.digestive.includes('burp')) {
        symptoms.push('打嗝');
    }
    
    let suggestion = `根据您的健康状况，`;
    
    if (symptoms.length > 0) {
        suggestion += `特别是${symptoms.join('、')}的问题，`;
    }
    
    suggestion += `推荐使用${formula.name}。`;
    
    if (formula.id === 'formula-c' || formula.id === 'formula-d') {
        suggestion += '此配方特别适合改善末梢循环和温阳散寒。';
    } else if (formula.id === 'formula-e') {
        suggestion += '此配方有助于补益脾肾、改善睡眠质量。';
    } else if (formula.id === 'formula-a') {
        suggestion += '此配方适合工作时段使用，可缓解压力和消化问题。';
    }
    
    return suggestion;
}

