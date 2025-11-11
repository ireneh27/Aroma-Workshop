// Preset Recipes Module
// Contains predefined recipe templates

const PresetRecipes = {
    // Basic presets
    PRESETS: [
        {name:'助眠放松滚珠', purpose:'睡眠·舒缓', total:10, dilution:2, carrier:'荷荷巴油', solvent:'', method:'10mL 滚珠瓶，睡前涂抹腕内/胸前', author:'库预置', notes:'含依兰依兰（≤0.8%）；孕期/低血压者先做斑贴与小剂量测试', oils:[
            {name:'野地薰衣草', amount:12, note:'滴'},
            {name:'依兰依兰', amount:2, note:'滴（注意上限）'},
            {name:'雪松', amount:4, note:'滴'},
            {name:'乳香', amount:4, note:'滴'}
        ]},
        {name:'舒压提振扩香', purpose:'减压·愉悦', total:'', dilution:'', carrier:'', solvent:'', method:'扩香 15–30 分钟通风环境', author:'库预置', notes:'使用非FCF佛手柑时避免日晒；FCF版本无光敏限制', oils:[
            {name:'佛手柑', amount:6, note:'滴'},
            {name:'天竺葵', amount:3, note:'滴'},
            {name:'乳香', amount:3, note:'滴'}
        ]},
        {name:'专注清醒滚珠', purpose:'办公·学习', total:10, dilution:3, carrier:'葡萄籽油', solvent:'', method:'太阳穴/颈后少量点涂，避开眼周', author:'库预置', notes:'含欧薄荷（避免接触儿童面部）；对高浓度敏感者降至2%', oils:[
            {name:'迷迭香', amount:10, note:'滴'},
            {name:'欧薄荷', amount:8, note:'滴'},
            {name:'丝柏', amount:4, note:'滴'}
        ]},
        {name:'舒呼吸胸背按摩油', purpose:'季节性支持', total:30, dilution:2, carrier:'葡萄籽油', solvent:'', method:'胸背部少量按摩；儿童与孕期不建议此配方', author:'库预置', notes:'含桉油醇/薄荷醇成分，对呼吸道敏感人群谨慎', oils:[
            {name:'迷迭香', amount:12, note:'滴'},
            {name:'欧薄荷', amount:6, note:'滴'},
            {name:'乳香', amount:6, note:'滴'}
        ]},
        {name:'胃部舒缓按摩油', purpose:'消化·放松', total:20, dilution:2, carrier:'荷荷巴油', solvent:'', method:'顺时针小范围按摩腹部', author:'库预置', notes:'甜茴香≤2.5%；孕期/激素相关疾病禁用甜茴香', oils:[
            {name:'姜', amount:8, note:'滴'},
            {name:'甜茴香', amount:4, note:'滴'},
            {name:'甜橙', amount:8, note:'滴'}
        ]},
        {name:'经期舒缓身体油', purpose:'经期不适', total:30, dilution:2, carrier:'荷荷巴油', solvent:'', method:'下腹/腰骶部轻柔按摩', author:'库预置', notes:'孕期不使用；对雌激素敏感人群避免甜茴香，可去除', oils:[
            {name:'天竺葵', amount:12, note:'滴'},
            {name:'野地薰衣草', amount:10, note:'滴'},
            {name:'姜', amount:6, note:'滴'}
        ]},
        {name:'沉静冥想香膏（油）', purpose:'冥想·焦虑', total:15, dilution:5, carrier:'荷荷巴油', solvent:'', method:'耳后/手腕极少量点涂', author:'库预置', notes:'高浓度点涂配方；皮肤敏感者降至2–3%', oils:[
            {name:'檀香', amount:10, note:'滴'},
            {name:'乳香', amount:8, note:'滴'},
            {name:'广藿香', amount:6, note:'滴'}
        ]},
        {name:'温暖循环身体油', purpose:'寒凉体感', total:50, dilution:2, carrier:'葡萄籽油', solvent:'', method:'四肢末端与腹部按摩', author:'库预置', notes:'含中国肉桂≤0.05–0.1%；先做斑贴；避免黏膜/受损皮肤', oils:[
            {name:'姜', amount:16, note:'滴'},
            {name:'甜橙', amount:12, note:'滴'},
            {name:'中国肉桂', amount:2, note:'滴（极低比例）'}
        ]},
        {name:'林地木香男士调', purpose:'木质·沉稳', total:'', dilution:'', carrier:'', solvent:'', method:'扩香 / 香水基底', author:'库预置', notes:'前调佛手柑注意光敏', oils:[
            {name:'丝柏', amount:6, note:'滴'},
            {name:'雪松', amount:6, note:'滴'},
            {name:'广藿香', amount:3, note:'滴'},
            {name:'佛手柑', amount:3, note:'滴'}
        ]},
        {name:'花香浪漫身体油', purpose:'情绪·连结', total:30, dilution:2, carrier:'荷荷巴油', solvent:'', method:'肩颈/锁骨/手臂少量涂抹', author:'库预置', notes:'依兰依兰≤0.8%；玫瑰用量少而香气强', oils:[
            {name:'依兰依兰', amount:4, note:'滴'},
            {name:'玫瑰', amount:2, note:'滴'},
            {name:'檀香', amount:4, note:'滴'},
            {name:'甜橙', amount:6, note:'滴'}
        ]}
    ],
    
    // Get all presets
    getAll() {
        return this.PRESETS;
    },
    
    // Load presets into database (only if database is empty)
    loadIntoDatabase() {
        const recipes = RecipeDB.loadRecipes();
        if (recipes.length === 0) {
            const presets = this.PRESETS.map(p => {
                const preset = Object.assign({}, p);
                preset.id = crypto.randomUUID();
                preset.updatedAt = new Date().toISOString();
                return preset;
            });
            presets.forEach(p => RecipeDB.addRecipe(p));
            return presets.length;
        }
        return 0;
    },
    
    // Get preset by name
    getByName(name) {
        return this.PRESETS.find(p => p.name === name);
    }
};

