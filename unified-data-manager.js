// 统一数据管理模块
// 整合所有配方数据，实现数据格式转换和联动

const UnifiedDataManager = {
    // 统一存储key
    UNIFIED_RECIPES_KEY: 'unified_recipes_v1',
    MIGRATION_FLAG_KEY: 'data_migration_completed',
    
    // 初始化：迁移旧数据
    init() {
        if (!localStorage.getItem(this.MIGRATION_FLAG_KEY)) {
            this.migrateOldData();
            localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true');
        }
    },
    
    // 迁移旧数据到统一格式
    migrateOldData() {
        const unifiedRecipes = this.getAllRecipes();
        
        // 迁移 formula-builder 的数据
        try {
            const oldFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
            oldFormulas.forEach(oldFormula => {
                const converted = this.convertFromFormulaBuilder(oldFormula);
                if (converted && !unifiedRecipes.find(r => r.sourceId === oldFormula.id && r.source === 'formula-builder')) {
                    unifiedRecipes.push(converted);
                }
            });
        } catch (e) {
            console.warn('迁移 formula-builder 数据失败:', e);
        }
        
        // 迁移 recipe-database 的数据（如果还没有迁移）
        try {
            const oldRecipes = JSON.parse(localStorage.getItem('eo_recipes_v1') || '[]');
            oldRecipes.forEach(oldRecipe => {
                if (!unifiedRecipes.find(r => r.id === oldRecipe.id)) {
                    // 标记来源
                    oldRecipe.source = oldRecipe.source || 'recipe-database';
                    unifiedRecipes.push(oldRecipe);
                }
            });
        } catch (e) {
            console.warn('迁移 recipe-database 数据失败:', e);
        }
        
        this.saveAllRecipes(unifiedRecipes);
    },
    
    // 统一配方格式
    getUnifiedFormat() {
        return {
            id: null,                    // UUID
            name: '',                    // 配方名称
            purpose: '',                 // 用途/标签
            total: null,                 // 总量(mL)
            dilution: null,              // 稀释浓度(%)
            carrier: '',                 // 基础油
            solvent: '',                 // 溶剂
            notes: '',                   // 备注
            oils: [],                   // 精油列表 [{name, amount, note, drops?}]
            safetyFlag: '',             // 安全标志: green/yellow/red
            updatedAt: '',              // 更新时间 ISO string
            source: 'unified',          // 数据来源
            sourceId: null,              // 原始ID（用于追踪）
            // 扩展字段（兼容 formula-builder）
            baseType: '',               // 基底类型
            baseAmount: null,           // 基底总量
            totalDrops: null,           // 总滴数
            totalMl: null,              // 总毫升数
            concentration: null,        // 浓度百分比
            date: ''                    // 创建日期
        };
    },
    
    // 从 formula-builder 格式转换
    convertFromFormulaBuilder(oldFormula) {
        try {
            const unified = this.getUnifiedFormat();
            unified.id = crypto.randomUUID();
            unified.sourceId = oldFormula.id;
            unified.source = 'formula-builder';
            unified.name = oldFormula.name || '未命名配方';
            unified.date = oldFormula.date || new Date().toLocaleString('zh-CN');
            unified.baseType = oldFormula.baseType || 'base-oil';
            unified.baseAmount = oldFormula.baseAmount || null;
            unified.totalDrops = oldFormula.totalDrops || null;
            unified.totalMl = oldFormula.totalMl || null;
            unified.concentration = oldFormula.concentration || null;
            
            // 转换基底类型
            if (oldFormula.baseType === 'base-oil') {
                unified.carrier = '基础油';
            } else if (oldFormula.baseType === 'rosewater') {
                unified.solvent = '玫瑰水';
            } else if (oldFormula.baseType === 'alcohol') {
                unified.solvent = '95%乙醇';
            }
            
            // 转换总量和稀释度
            if (oldFormula.baseAmount) {
                unified.total = oldFormula.baseAmount;
            }
            if (oldFormula.concentration) {
                unified.dilution = oldFormula.concentration;
            }
            
            // 转换精油列表
            if (oldFormula.ingredients && Array.isArray(oldFormula.ingredients)) {
                unified.oils = oldFormula.ingredients.map(ing => ({
                    name: ing.name || '',
                    amount: ing.drops || null,
                    note: ing.caution || '',
                    drops: ing.drops || null
                }));
            }
            
            unified.updatedAt = new Date().toISOString();
            return unified;
        } catch (e) {
            console.error('转换 formula-builder 格式失败:', e);
            return null;
        }
    },
    
    // 转换为 formula-builder 格式（用于兼容）
    convertToFormulaBuilder(unifiedRecipe) {
        return {
            id: unifiedRecipe.sourceId || unifiedRecipe.id,
            name: unifiedRecipe.name,
            date: unifiedRecipe.date || new Date(unifiedRecipe.updatedAt).toLocaleString('zh-CN'),
            baseType: unifiedRecipe.baseType || (unifiedRecipe.solvent ? 
                (unifiedRecipe.solvent.includes('玫瑰') ? 'rosewater' : 'alcohol') : 'base-oil'),
            baseTypeName: unifiedRecipe.carrier || unifiedRecipe.solvent || '基础油',
            baseAmount: unifiedRecipe.baseAmount || unifiedRecipe.total,
            ingredients: (unifiedRecipe.oils || []).map(oil => ({
                name: oil.name,
                latin: '', // 需要从 essentialOils 数组查找
                drops: oil.drops || oil.amount,
                caution: oil.note
            })),
            totalDrops: unifiedRecipe.totalDrops || 
                (unifiedRecipe.oils || []).reduce((sum, o) => sum + (o.drops || o.amount || 0), 0),
            totalMl: unifiedRecipe.totalMl || 
                ((unifiedRecipe.oils || []).reduce((sum, o) => sum + (o.drops || o.amount || 0), 0) * 0.05),
            concentration: unifiedRecipe.concentration || unifiedRecipe.dilution
        };
    },
    
    // 获取所有配方（统一格式）
    getAllRecipes() {
        try {
            const data = localStorage.getItem(this.UNIFIED_RECIPES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取统一配方数据失败:', e);
            return [];
        }
    },
    
    // 保存所有配方
    saveAllRecipes(recipes) {
        try {
            localStorage.setItem(this.UNIFIED_RECIPES_KEY, JSON.stringify(recipes));
            return true;
        } catch (e) {
            console.error('保存统一配方数据失败:', e);
            return false;
        }
    },
    
    // 添加配方
    addRecipe(recipe) {
        const recipes = this.getAllRecipes();
        if (!recipe.id) {
            recipe.id = crypto.randomUUID();
        }
        if (!recipe.updatedAt) {
            recipe.updatedAt = new Date().toISOString();
        }
        if (!recipe.source) {
            recipe.source = 'unified';
        }
        recipes.unshift(recipe);
        this.saveAllRecipes(recipes);
        
        // 同步到旧系统（向后兼容）
        this.syncToLegacySystems(recipe);
        
        return recipe;
    },
    
    // 更新配方
    updateRecipe(recipe) {
        const recipes = this.getAllRecipes();
        const index = recipes.findIndex(r => r.id === recipe.id);
        if (index >= 0) {
            recipe.updatedAt = new Date().toISOString();
            recipes[index] = recipe;
            this.saveAllRecipes(recipes);
            
            // 同步到旧系统
            this.syncToLegacySystems(recipe);
            
            return true;
        }
        return false;
    },
    
    // 删除配方
    deleteRecipe(id) {
        const recipes = this.getAllRecipes();
        const filtered = recipes.filter(r => r.id !== id);
        this.saveAllRecipes(filtered);
        return recipes.length !== filtered.length;
    },
    
    // 获取配方
    getRecipe(id) {
        const recipes = this.getAllRecipes();
        return recipes.find(r => r.id === id);
    },
    
    // 搜索配方
    searchRecipes(query, filterOil = '') {
        const recipes = this.getAllRecipes();
        const q = query.trim().toLowerCase();
        
        return recipes.filter(r => {
            const hay = (r.name + '\n' + r.purpose + '\n' + r.notes + '\n' + 
                        (r.oils || []).map(o => o.name + (o.note || '')).join('\n')).toLowerCase();
            const hitQ = !q || hay.includes(q);
            const hitOil = !filterOil || (r.oils || []).some(o => o.name === filterOil);
            return hitQ && hitOil;
        });
    },
    
    // 同步到旧系统（向后兼容）
    syncToLegacySystems(recipe) {
        // 同步到 recipe-database
        try {
            if (typeof RecipeDB !== 'undefined') {
                const existing = RecipeDB.getRecipe(recipe.id);
                if (existing) {
                    RecipeDB.updateRecipe(recipe);
                } else {
                    RecipeDB.addRecipe(recipe);
                }
            }
        } catch (e) {
            console.warn('同步到 RecipeDB 失败:', e);
        }
        
        // 同步到 formula-builder（如果来源是 formula-builder）
        if (recipe.source === 'formula-builder') {
            try {
                const oldFormulas = JSON.parse(localStorage.getItem('savedFormulas') || '[]');
                const converted = this.convertToFormulaBuilder(recipe);
                const index = oldFormulas.findIndex(f => f.id === converted.id);
                if (index >= 0) {
                    oldFormulas[index] = converted;
                } else {
                    oldFormulas.push(converted);
                }
                localStorage.setItem('savedFormulas', JSON.stringify(oldFormulas));
            } catch (e) {
                console.warn('同步到 formula-builder 失败:', e);
            }
        }
    },
    
    // 导出所有数据
    exportAll() {
        const recipes = this.getAllRecipes();
        const lists = typeof RecipeDB !== 'undefined' ? RecipeDB.loadLists() : {};
        return JSON.stringify({ 
            recipes, 
            lists,
            version: '1.0',
            exportedAt: new Date().toISOString()
        }, null, 2);
    },
    
    // 导入数据
    importAll(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.recipes && Array.isArray(data.recipes)) {
                this.saveAllRecipes(data.recipes);
            }
            if (data.lists && typeof RecipeDB !== 'undefined') {
                RecipeDB.saveLists(data.lists);
            }
            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    },
    
    // 清空所有数据
    clearAll() {
        this.saveAllRecipes([]);
        if (typeof RecipeDB !== 'undefined') {
            RecipeDB.clearAll();
        }
        localStorage.removeItem('savedFormulas');
    },
    
    // 获取配方统计
    getStats() {
        const recipes = this.getAllRecipes();
        return {
            total: recipes.length,
            bySource: recipes.reduce((acc, r) => {
                acc[r.source || 'unknown'] = (acc[r.source || 'unknown'] || 0) + 1;
                return acc;
            }, {}),
            recent: recipes.filter(r => {
                const date = new Date(r.updatedAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date > weekAgo;
            }).length
        };
    }
};

// 初始化
if (typeof window !== 'undefined') {
    UnifiedDataManager.init();
    window.UnifiedDataManager = UnifiedDataManager;
}

