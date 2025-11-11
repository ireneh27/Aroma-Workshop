// Safety Evaluation Module
// Evaluates recipe safety based on oil concentrations and limits

const SafetyEvaluator = {
    // 不同介质的安全浓度上限（总浓度%）
    MEDIUM_SAFETY_LIMITS: {
        'base-oil': 3,           // 基础油（按摩油、滚珠等）
        'handcream': 2,          // 护手霜
        'bodylotion': 2,         // 身体乳
        'rosewater': 1.5,        // 玫瑰水/纯露
        'alcohol': 10,           // 95%乙醇（香水、喷雾等）
        'footbath': 0.5,         // 泡脚/泡澡（水中稀释，实际吸收率低）
        'diffuser': 100,         // 扩香（不计入皮肤接触量）
        'spray': 3,              // 喷雾（水基或酒精基）
        'default': 2             // 默认保守值
    },
    
    // Oil safety limits (percentage of total formula)
    OIL_CAPS: {
        '野地薰衣草': 5,
        '中国肉桂': 0.1,
        '艾草': 2,  // 孕期禁用，但可安全用于皮肤（低浓度）
        '依兰依兰': 0.8,
        '佛手柑': 0.4,
        '佛手柑（FCF）': 15,
        '丝柏': 2,
        '雪松': 2,
        '乳香': 2,
        '甜茴香': 2.5,
        '迷迭香': 3,
        '广藿香': 3,
        '姜': 1,
        '玫瑰': 1,
        '檀香': 2,
        '天竺葵': 2,
        '甜橙': 2,
        '欧薄荷': 5.4,
        // 以下为数据库中其他精油的默认安全上限
        '茶树': 3,  // 安全性高，敏感肌需低浓度使用
        '尤加利': 2,  // 孕期慎用，婴幼儿禁用
        '柠檬': 2,  // 光敏性较强
        '葡萄柚': 2,  // 光敏性
        '洋甘菊': 3,  // 安全性高，适合敏感人群
        '茉莉': 3,  // 安全性高，孕期慎用
        '橙花': 3,  // 安全性高
        '杜松': 2,  // 孕期禁用，肾脏疾病患者禁用
        '马郁兰': 2,  // 孕期禁用
        '百里香': 1,  // 刺激性较强，需低浓度使用
        '柠檬草': 2,  // 敏感性皮肤需低浓度使用
        '罗勒': 2  // 孕期禁用，癫痫患者禁用
    },
    
    // Safety limits reference table
    LIMITS: [
        {name: '佛手柑（冷压，非FCF）', max: 0.4, note: '光毒；FCF（去呋喃香豆素）版本不光毒'},
        {name: '依兰依兰', max: 0.8, note: '易致敏'},
        {name: '甜茴香', max: 2.5, note: '含茴香脑；孕期/哺乳/雌激素相关疾病慎用/禁用'},
        {name: '欧薄荷', max: 5.4, note: '避免接触婴幼儿鼻口；G6PD缺乏/心律失常慎用'},
        {name: '中国肉桂（桂皮/桂皮叶以外之桂皮类，近似桂皮皮）', max: 0.1, note: '强刺激；建议≤0.05–0.1% 局部点涂'},
        {name: '迷迭香', max: 3, note: '含樟脑/1,8-桉叶素；癫痫史慎用，避免婴幼儿面部'},
        {name: '佛手柑（FCF）', max: 15, note: '无光毒限制，仍需常规稀释'}
    ],
    
    // 获取介质类型（从配方中推断）
    getMediumType(recipe) {
        // 优先使用显式的介质类型
        if (recipe.baseType) {
            return recipe.baseType;
        }
        if (recipe.mediumType) {
            return recipe.mediumType;
        }
        
        // 从carrier和solvent推断
        const carrier = (recipe.carrier || '').toLowerCase();
        const solvent = (recipe.solvent || '').toLowerCase();
        const name = (recipe.name || '').toLowerCase();
        const purpose = (recipe.purpose || '').toLowerCase();
        
        // 扩香
        if (name.includes('扩香') || purpose.includes('扩香') || name.includes('diffuser')) {
            return 'diffuser';
        }
        // 喷雾
        if (name.includes('喷雾') || name.includes('spray')) {
            return 'spray';
        }
        // 泡脚/泡澡
        if (name.includes('泡脚') || name.includes('泡澡') || name.includes('footbath') || name.includes('bath')) {
            return 'footbath';
        }
        // 护手霜
        if (name.includes('护手霜') || name.includes('handcream')) {
            return 'handcream';
        }
        // 身体乳
        if (name.includes('身体乳') || name.includes('bodylotion')) {
            return 'bodylotion';
        }
        // 玫瑰水/纯露
        if (solvent.includes('玫瑰') || solvent.includes('纯露') || carrier.includes('玫瑰')) {
            return 'rosewater';
        }
        // 酒精
        if (solvent.includes('乙醇') || solvent.includes('alcohol') || solvent.includes('酒精')) {
            return 'alcohol';
        }
        
        // 默认为基础油
        return 'base-oil';
    },
    
    // 获取介质的安全浓度上限
    getMediumSafetyLimit(mediumType) {
        return this.MEDIUM_SAFETY_LIMITS[mediumType] || this.MEDIUM_SAFETY_LIMITS['default'];
    },
    
    // Evaluate safety of a recipe
    evaluateSafety(recipe) {
        const total = Number(recipe.total || 0);
        const dilution = Number(recipe.dilution || 0);
        const oils = recipe.oils || [];
        
        if (!dilution || oils.length === 0) {
            return {level: '', message: '', problems: [], warnings: []};
        }
        
        // 获取介质类型和安全上限
        const mediumType = this.getMediumType(recipe);
        const mediumLimit = this.getMediumSafetyLimit(mediumType);
        
        // 扩香不计入皮肤接触量，跳过总浓度检查
        const skipTotalCheck = mediumType === 'diffuser';
        
        // Calculate total amount (sum of all oil amounts)
        const amounts = oils.map(o => Number(o.amount || 0));
        const sum = amounts.reduce((a, b) => a + b, 0) || 1;
        
        let problems = [];
        let warnings = [];
        
        // 检查总浓度（根据介质类型）
        if (!skipTotalCheck && dilution > mediumLimit) {
            problems.push(`总浓度 ${dilution.toFixed(2)}% 超过${this.getMediumName(mediumType)}的安全上限(≤${mediumLimit}%)`);
        } else if (!skipTotalCheck && dilution > mediumLimit * 0.8) {
            warnings.push(`总浓度 ${dilution.toFixed(2)}% 接近${this.getMediumName(mediumType)}的安全上限(≤${mediumLimit}%)`);
        }
        
        // 检查单个精油浓度
        oils.forEach((oil, i) => {
            const name = oil.name || '';
            const amount = amounts[i];
            const share = amount / sum;
            const oilPct = dilution * share;
            const cap = this.OIL_CAPS[name];
            
            if (cap === 0 && oilPct > 0) {
                problems.push(`${name}: 配方不建议皮肤应用（当前≈${oilPct.toFixed(2)}%）`);
            } else if (typeof cap === 'number') {
                if (oilPct > cap) {
                    problems.push(`${name}: 超上限 ${cap}%（当前≈${oilPct.toFixed(2)}%）`);
                } else if (oilPct > cap * 0.8) {
                    warnings.push(`${name}: 接近上限 ${cap}%（当前≈${oilPct.toFixed(2)}%）`);
                }
            } else {
                // 对于没有特定上限的精油，使用介质相关的保守参考值
                const conservativeLimit = mediumType === 'alcohol' ? 5 : (mediumType === 'footbath' ? 0.3 : 2);
                if (oilPct > conservativeLimit) {
                    warnings.push(`${name}: 超过${this.getMediumName(mediumType)}的保守参考 ${conservativeLimit}%（当前≈${oilPct.toFixed(2)}%）`);
                }
            }
        });
        
        const level = problems.length ? 'red' : (warnings.length ? 'yellow' : 'green');
        const message = (problems.concat(warnings)).join('\n');
        
        return {level, message, problems, warnings, mediumType, mediumLimit};
    },
    
    // 获取介质名称（用于显示）
    getMediumName(mediumType) {
        const names = {
            'base-oil': '基础油',
            'handcream': '护手霜',
            'bodylotion': '身体乳',
            'rosewater': '玫瑰水',
            'alcohol': '酒精',
            'footbath': '泡脚/泡澡',
            'diffuser': '扩香',
            'spray': '喷雾'
        };
        return names[mediumType] || '该介质';
    },
    
    // Get safety status display info
    getSafetyStatus(safety) {
        if (!safety || !safety.level) {
            return {
                text: '未评估',
                color: '#6b7280',
                bgColor: '#6b7280'
            };
        }
        
        const statusMap = {
            'green': {
                text: '安全范围',
                color: '#059669',
                bgColor: '#059669'
            },
            'yellow': {
                text: '接近上限',
                color: '#b45309',
                bgColor: '#b45309'
            },
            'red': {
                text: '超出上限',
                color: '#dc2626',
                bgColor: '#dc2626'
            }
        };
        
        return statusMap[safety.level] || statusMap['green'];
    },
    
    // Get limits table data
    getLimitsTable() {
        return this.LIMITS;
    },
    
    // Get oil cap for a specific oil
    getOilCap(oilName) {
        return this.OIL_CAPS[oilName];
    }
};

