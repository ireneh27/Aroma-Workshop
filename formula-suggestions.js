// 基于问卷数据的配方推荐系统
// 注意: 当前使用规则匹配系统，可扩展为AI API调用
// 如需使用AI API，可在 generatePersonalizedSuggestions 函数中调用外部API

// 配方数据库
const FORMULA_DATABASE = {
    // 护手霜配方
    'formula-a': {
        id: 'formula-a',
        name: '配方A:理气清神护手霜',
        subtitle: '工作时段使用 · 改善手心发热、缓解打嗝',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '佛手柑精油', amount: '3滴(约0.15ml)' },
            { name: '甜橙精油', amount: '2滴(约0.10ml)' },
            { name: '欧薄荷精油', amount: '1滴(约0.05ml)' }
        ],
        usage: '工作时段,每2-3小时涂抹一次(建议10:00/14:00/17:00)。取适量于手心,重点按压劳宫穴(手心中央)和合谷穴(虎口),充分吸收后深呼吸3次。',
        principle: '佛手柑疏肝理气,缓解工作压力和打嗝;甜橙温中健脾,调理手心发热;薄荷清凉提神,改善疲劳。通过手部穴位刺激,实现全身调理。',
        dailyAmount: '约0.06ml',
        matches: ['hot-hands', 'burp', 'stress', 'bloating']
    },
    
    // 扩香配方
    'formula-b': {
        id: 'formula-b',
        name: '配方D:办公室提神扩香',
        subtitle: '上午+下午各一次 · 提升专注力、改善情绪',
        ingredients: [
            { name: '迷迭香精油', amount: '3滴' },
            { name: '佛手柑精油', amount: '2滴' },
            { name: '甜橙精油', amount: '2滴' }
        ],
        usage: '上午10:00和下午15:00各扩香一次,每次15-20分钟。将精油滴入扩香仪或香薰机,保持办公桌面通风良好。',
        principle: '迷迭香促进循环和专注;佛手柑疏肝理气,缓解工作压力;甜橙提升情绪。空气扩散方式不计入皮肤接触量,安全性高。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['stress', 'fatigue', 'poor', 'wake']
    },
    
    // 泡脚配方C
    'formula-c': {
        id: 'formula-c',
        name: '配方C:温阳循环泡脚液',
        subtitle: '每晚使用 · 改善脚心发凉、促进末梢循环',
        ingredients: [
            { name: '热水(40-42℃)', amount: '适量至脚踝以上' },
            { name: '姜精油', amount: '2滴(约0.10ml)' },
            { name: '中国肉桂精油', amount: '2滴(约0.10ml)' },
            { name: '艾草精油', amount: '2滴(约0.10ml)' },
            { name: '荷荷巴油(乳化剂)', amount: '5ml' }
        ],
        usage: '每晚18:30回家后进行。先将精油滴入荷荷巴油中混合,再倒入热水充分搅拌。泡脚20分钟,水温保持在40-42℃。泡脚后直接洗澡。',
        principle: '姜和肉桂强力温阳散寒,艾草温经通络,三者协同改善末梢循环。通过足底反射区刺激,调理全身气血。水中稀释后实际皮肤吸收率约30%。',
        dailyAmount: '约0.09ml(水中稀释,实际吸收30%)',
        matches: ['cold-feet', 'poor', 'spleen', 'kidney', 'both']
    },
    
    // 身体乳B - 腿脚专用
    'formula-d': {
        id: 'formula-d',
        name: '配方B:温阳循环身体乳(腿脚专用)',
        subtitle: '每晚洗澡后使用 · 改善脚心发凉、促进下肢循环',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '姜精油', amount: '6滴(约0.30ml)' },
            { name: '迷迭香精油', amount: '5滴(约0.25ml)' },
            { name: '中国肉桂精油', amount: '4滴(约0.20ml)' },
            { name: '甜橙精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:40洗澡后,取适量涂抹于小腿、脚踝、脚底。重点按摩三阴交穴(小腿内侧)、涌泉穴(脚底中心),按摩3-5分钟至吸收。',
        principle: '姜和肉桂温阳散寒,迷迭香促进末梢循环,甜橙理气温中。四者协同作用,从外部温养下肢,改善"上热下寒"体质。',
        concentration: '1.8%',
        dailyAmount: '每次约0.27ml',
        matches: ['cold-feet', 'poor', 'spleen', 'kidney']
    },
    
    // 身体乳B1 - 躯干专用
    'formula-e': {
        id: 'formula-e',
        name: '配方B1:补肾安神身体乳(躯干专用)',
        subtitle: '每晚洗澡后使用 · 补益脾肾、助眠安神',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '檀香精油', amount: '7滴(约0.35ml)' },
            { name: '乳香精油', amount: '5滴(约0.25ml)' },
            { name: '野地薰衣草精油', amount: '4滴(约0.20ml)' },
            { name: '雪松精油', amount: '4滴(约0.20ml)' }
        ],
        usage: '19:45洗澡后,取适量温热双手后涂抹于腰部(肾区)、下腹部、颈后、胸口。顺时针按摩下腹5-8分钟,重点温养肾区和颈后,配合深呼吸。',
        principle: '檀香温肾安神,乳香活血通络深层放松,薰衣草镇静助眠,雪松强壮补益。四者协同,既补益肾阳根本,又安神助眠。',
        concentration: '2%',
        dailyAmount: '每次约0.30ml',
        matches: ['poor', 'tinnitus', 'anxiety', 'kidney', 'both', 'spleen']
    },
    
    // 泡脚配方C1
    'formula-f': {
        id: 'formula-f',
        name: '配方C1:经前调理泡脚液',
        subtitle: '经期前7-3天使用 · 暖宫调经、预防痛经',
        ingredients: [
            { name: '热水(40-42℃)', amount: '适量至脚踝以上' },
            { name: '姜精油', amount: '3滴(约0.15ml)' },
            { name: '艾草精油', amount: '3滴(约0.15ml)' },
            { name: '玫瑰精油', amount: '2滴(约0.10ml)' },
            { name: '荷荷巴油(乳化剂)', amount: '5ml' }
        ],
        usage: '经期前7-3天,每晚19:00泡脚20分钟。操作同配方C。',
        principle: '姜和艾草温经散寒暖宫,玫瑰活血调经。提前调理可有效预防痛经,减轻经期不适。',
        dailyAmount: '约0.12ml',
        matches: ['pain', 'cold', 'blood', 'irregular'],
        gender: 'female'
    },
    
    // 身体乳B2
    'formula-g': {
        id: 'formula-g',
        name: '配方B2:经前调理身体乳',
        subtitle: '经期前7-3天使用 · 温经暖宫、活血化瘀',
        ingredients: [
            { name: '无香身体乳基底', amount: '150g' },
            { name: '玫瑰精油', amount: '6滴(约0.30ml)' },
            { name: '天竺葵精油', amount: '4滴(约0.20ml)' },
            { name: '艾草精油', amount: '3滴(约0.15ml)' },
            { name: '乳香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '经期前7-3天,洗澡后重点涂抹下腹部、腰骶部、大腿内侧。温热双手后顺时针按摩下腹部10分钟。',
        principle: '玫瑰活血化瘀调经,天竺葵平衡激素,艾草温经暖宫,乳香通络止痛。提前调理可疏通经络,为经期做好准备。',
        concentration: '2.1%',
        dailyAmount: '每次约0.32ml',
        matches: ['pain', 'blood', 'irregular', 'cold'],
        gender: 'female'
    },
    
    // 泡脚配方C2
    'formula-h': {
        id: 'formula-h',
        name: '配方C2:经期温经泡澡液',
        subtitle: '经期1-3天使用 · 温经止痛、缓解痉挛',
        ingredients: [
            { name: '温水浴缸(38-40℃)', amount: '适量' },
            { name: '玫瑰精油', amount: '3滴(约0.15ml)' },
            { name: '艾草精油', amount: '2滴(约0.10ml)' },
            { name: '姜精油', amount: '2滴(约0.10ml)' },
            { name: '牛奶(乳化剂)', amount: '100ml' }
        ],
        usage: '经期1-3天,每晚19:00泡澡15-20分钟,代替泡脚。先将精油滴入牛奶中混合,再倒入温水搅拌均匀。水温不宜过高,保持在38-40℃。',
        principle: '全身浸泡比泡脚面积更大,水量更多精油浓度降低更安全。温水配合精油放松子宫平滑肌,缓解痉挛性疼痛。',
        dailyAmount: '实际皮肤吸收率低于20%',
        matches: ['pain'],
        gender: 'female'
    },
    
    // 身体乳B3
    'formula-i': {
        id: 'formula-i',
        name: '配方B3:经期止痛身体乳',
        subtitle: '经期1-3天使用 · 温经止痛、缓解痛经',
        ingredients: [
            { name: '无香身体乳基底', amount: '100g' },
            { name: '玫瑰精油', amount: '5滴(约0.25ml)' },
            { name: '艾草精油', amount: '4滴(约0.20ml)' },
            { name: '姜精油', amount: '3滴(约0.15ml)' },
            { name: '甜茴香精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '经期1-3天,泡澡后仅涂抹于下腹部和腰部。温热双手后,先顺时针轻柔按摩下腹部5分钟,再横向按摩腰骶部3分钟。',
        principle: '玫瑰活血止痛,艾草和姜强力温经散寒,甜茴香解痉止痛。浓度稍高但使用面积小,针对性强。',
        concentration: '2.8%',
        dailyAmount: '每次约0.28ml',
        matches: ['pain'],
        gender: 'female'
    },
    
    // 新增护手霜配方
    'formula-a1': {
        id: 'formula-a1',
        name: '配方A1:消化调理护手霜',
        subtitle: '餐后使用 · 改善腹胀、消化不良、食欲不振',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '甜橙精油', amount: '4滴(约0.20ml)' },
            { name: '姜精油', amount: '2滴(约0.10ml)' },
            { name: '广藿香精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '餐后30分钟,取适量涂抹于手心,重点按摩中脘穴和合谷穴,顺时针按摩3-5分钟。',
        principle: '甜橙温中健脾,促进消化;姜温胃散寒,改善腹胀;广藿香化湿和胃,缓解消化不良。',
        dailyAmount: '约0.08ml',
        matches: ['bloating', 'appetite', 'teeth', 'spleen']
    },
    
    'formula-a2': {
        id: 'formula-a2',
        name: '配方A2:头痛缓解护手霜',
        subtitle: '头痛时使用 · 缓解头痛、放松神经',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '野地薰衣草精油', amount: '4滴(约0.20ml)' },
            { name: '欧薄荷精油', amount: '2滴(约0.10ml)' },
            { name: '乳香精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '头痛时,取适量涂抹于太阳穴、额头、颈后,轻柔按摩5-10分钟。同时可涂抹于手心,按压合谷穴和内关穴。',
        principle: '薰衣草镇静放松,缓解紧张性头痛;薄荷清凉止痛,缓解血管性头痛;乳香活血通络,改善头部循环。',
        dailyAmount: '约0.04ml',
        matches: ['headache']
    },
    
    'formula-a3': {
        id: 'formula-a3',
        name: '配方A3:情绪舒缓护手霜',
        subtitle: '情绪紧张时使用 · 缓解压力、改善情绪低落',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '佛手柑精油', amount: '3滴(约0.15ml)' },
            { name: '野地薰衣草精油', amount: '3滴(约0.15ml)' },
            { name: '依兰依兰精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '情绪紧张或低落时,取适量涂抹于手心、手腕、颈后,重点按压劳宫穴和神门穴,轻柔按摩3-5分钟。',
        principle: '佛手柑疏肝理气,缓解压力和焦虑;薰衣草镇静安神,平衡情绪;依兰依兰舒缓情绪,带来愉悦感。',
        dailyAmount: '约0.08ml',
        matches: ['stress', 'mood']
    },
    
    // 身体乳B4
    'formula-j': {
        id: 'formula-j',
        name: '配方B4:健脾益气身体乳',
        subtitle: '每晚洗澡后使用 · 改善脾虚、疲劳、消化不良',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '甜橙精油', amount: '6滴(约0.30ml)' },
            { name: '广藿香精油', amount: '5滴(约0.25ml)' },
            { name: '姜精油', amount: '4滴(约0.20ml)' },
            { name: '檀香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:40洗澡后,取适量涂抹于腹部、腰部、大腿。顺时针按摩腹部10分钟,重点温养脾胃区域。',
        principle: '甜橙温中健脾,促进消化;广藿香化湿和胃,改善腹胀;姜温胃散寒,增强脾胃功能;檀香补益中气。',
        concentration: '1.8%',
        dailyAmount: '每次约0.27ml',
        matches: ['spleen', 'fatigue', 'bloating', 'appetite', 'teeth']
    },
    
    'formula-k': {
        id: 'formula-k',
        name: '配方B5:补气养血身体乳',
        subtitle: '每晚洗澡后使用 · 改善气虚、血虚、面色苍白',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '玫瑰精油', amount: '6滴(约0.30ml)' },
            { name: '檀香精油', amount: '5滴(约0.25ml)' },
            { name: '乳香精油', amount: '4滴(约0.20ml)' },
            { name: '天竺葵精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:45洗澡后,取适量涂抹于全身,重点按摩腹部、腰部、四肢。顺时针按摩腹部8-10分钟。',
        principle: '玫瑰活血养血,改善面色;檀香补益中气,提升能量;乳香活血通络,促进循环;天竺葵平衡气血。',
        concentration: '1.8%',
        dailyAmount: '每次约0.27ml',
        matches: ['qi', 'blood']
    },
    
    'formula-l': {
        id: 'formula-l',
        name: '配方B6:深度助眠身体乳',
        subtitle: '睡前使用 · 改善睡眠浅、易醒、睡前焦虑',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '野地薰衣草精油', amount: '8滴(约0.40ml)' },
            { name: '檀香精油', amount: '5滴(约0.25ml)' },
            { name: '乳香精油', amount: '4滴(约0.20ml)' },
            { name: '依兰依兰精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '睡前30分钟,取适量涂抹于全身,重点按摩颈后、胸口、腹部、脚底。轻柔按摩10-15分钟。',
        principle: '薰衣草深度镇静,改善睡眠质量;檀香安神定志,缓解焦虑;乳香深层放松,缓解紧张;依兰依兰舒缓情绪。',
        concentration: '2.0%',
        dailyAmount: '每次约0.30ml',
        matches: ['poor', 'wake', 'anxiety']
    },
    
    'formula-m': {
        id: 'formula-m',
        name: '配方B7:敏感肌温和身体乳',
        subtitle: '每晚洗澡后使用 · 适合敏感肌肤,温和舒缓',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '野地薰衣草精油', amount: '4滴(约0.20ml)' },
            { name: '檀香精油', amount: '3滴(约0.15ml)' },
            { name: '乳香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:40洗澡后,取适量涂抹于全身,轻柔按摩至吸收。首次使用前,建议在手臂内侧做皮肤测试。',
        principle: '薰衣草温和舒缓,抗炎镇静;檀香温和滋润,修复肌肤;乳香温和修复,改善敏感。',
        concentration: '1.0%',
        dailyAmount: '每次约0.15ml',
        matches: ['skin']
    },
    
    'formula-n': {
        id: 'formula-n',
        name: '配方B8:提神抗疲劳身体乳',
        subtitle: '早晨或下午使用 · 改善疲劳、精力不足',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '甜橙精油', amount: '6滴(约0.30ml)' },
            { name: '雪松精油', amount: '5滴(约0.25ml)' },
            { name: '广藿香精油', amount: '4滴(约0.20ml)' },
            { name: '欧薄荷精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '早晨起床后或下午疲劳时,取适量涂抹于全身,重点按摩颈后、肩膀、四肢。快速按摩5-8分钟。',
        principle: '甜橙提升情绪,带来活力;雪松强壮补益,提升能量;广藿香化湿提神,改善疲劳;薄荷清凉提神。',
        concentration: '1.8%',
        dailyAmount: '每次约0.27ml',
        matches: ['fatigue']
    },
    
    // 新增泡脚配方
    'formula-o': {
        id: 'formula-o',
        name: '配方C3:健脾化湿泡脚液',
        subtitle: '每周2-3次 · 改善脾虚、消化不良、舌边齿痕',
        ingredients: [
            { name: '热水(40-42℃)', amount: '适量至脚踝以上' },
            { name: '广藿香精油', amount: '3滴(约0.15ml)' },
            { name: '姜精油', amount: '2滴(约0.10ml)' },
            { name: '甜橙精油', amount: '2滴(约0.10ml)' },
            { name: '荷荷巴油(乳化剂)', amount: '5ml' }
        ],
        usage: '每周2-3次,每晚19:00泡脚20分钟。先将精油滴入5ml荷荷巴油中混合,再倒入40-42℃热水中充分搅拌。',
        principle: '广藿香化湿和胃,改善脾虚湿困;姜温胃散寒,促进消化;甜橙温中健脾,提升脾胃功能。',
        dailyAmount: '约0.11ml(水中稀释,实际吸收30%)',
        matches: ['spleen', 'bloating', 'appetite', 'teeth']
    },
    
    'formula-p': {
        id: 'formula-p',
        name: '配方C4:安神助眠泡脚液',
        subtitle: '睡前使用 · 改善睡眠质量、缓解睡前焦虑',
        ingredients: [
            { name: '热水(38-40℃)', amount: '适量至脚踝以上' },
            { name: '野地薰衣草精油', amount: '4滴(约0.20ml)' },
            { name: '檀香精油', amount: '3滴(约0.15ml)' },
            { name: '乳香精油', amount: '2滴(约0.10ml)' },
            { name: '荷荷巴油(乳化剂)', amount: '5ml' }
        ],
        usage: '睡前30分钟,泡脚20分钟,水温保持在38-40℃。先将精油滴入5ml荷荷巴油中混合,再倒入热水中充分搅拌。',
        principle: '薰衣草深度镇静,改善睡眠;檀香安神定志,缓解焦虑;乳香深层放松,促进睡眠。',
        dailyAmount: '约0.14ml(水中稀释,实际吸收30%)',
        matches: ['poor', 'wake', 'anxiety']
    },
    
    // 新增扩香配方
    'formula-b1': {
        id: 'formula-b1',
        name: '配方D1:放松减压扩香',
        subtitle: '工作压力大时使用 · 缓解压力、改善情绪低落',
        ingredients: [
            { name: '佛手柑精油', amount: '3滴' },
            { name: '野地薰衣草精油', amount: '3滴' },
            { name: '依兰依兰精油', amount: '2滴' }
        ],
        usage: '工作压力大或情绪低落时,扩香15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '佛手柑疏肝理气,缓解压力和焦虑;薰衣草镇静安神,平衡情绪;依兰依兰舒缓情绪,带来愉悦感。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['stress', 'mood']
    },
    
    'formula-b2': {
        id: 'formula-b2',
        name: '配方D2:深度助眠扩香',
        subtitle: '睡前使用 · 改善睡眠质量、缓解睡前焦虑',
        ingredients: [
            { name: '野地薰衣草精油', amount: '4滴' },
            { name: '檀香精油', amount: '3滴' },
            { name: '乳香精油', amount: '2滴' }
        ],
        usage: '睡前30分钟,扩香20-30分钟。将精油滴入扩香仪或香薰机,保持卧室通风良好。',
        principle: '薰衣草深度镇静,改善睡眠质量;檀香安神定志,缓解焦虑;乳香深层放松,促进睡眠。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['poor', 'wake', 'anxiety']
    },
    
    // 新增扩香配方
    'formula-b3': {
        id: 'formula-b3',
        name: '配方D3:缓解鼻塞扩香',
        subtitle: '感冒时使用 · 缓解鼻塞、改善呼吸不畅',
        ingredients: [
            { name: '欧薄荷精油', amount: '3滴' },
            { name: '雪松精油', amount: '3滴' },
            { name: '丝柏精油', amount: '2滴' }
        ],
        usage: '感冒鼻塞时,扩香15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '薄荷清凉通窍,缓解鼻塞;雪松收敛抗炎,改善呼吸道不适;丝柏收敛止血,缓解鼻部充血。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['cold', 'nasal']
    },
    
    'formula-b4': {
        id: 'formula-b4',
        name: '配方D4:提升免疫力扩香',
        subtitle: '日常使用 · 预防感冒、增强抵抗力',
        ingredients: [
            { name: '甜橙精油', amount: '3滴' },
            { name: '迷迭香精油', amount: '2滴' },
            { name: '广藿香精油', amount: '2滴' },
            { name: '乳香精油', amount: '1滴' }
        ],
        usage: '每日1-2次,每次15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '甜橙提升情绪,增强免疫力;迷迭香促进循环,增强抵抗力;广藿香化湿健脾,改善体质;乳香抗炎修复。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['immune', 'fatigue']
    },
    
    'formula-b5': {
        id: 'formula-b5',
        name: '配方D5:缓解咳嗽扩香',
        subtitle: '感冒时使用 · 缓解咳嗽、改善呼吸道不适',
        ingredients: [
            { name: '野地薰衣草精油', amount: '3滴' },
            { name: '雪松精油', amount: '2滴' },
            { name: '乳香精油', amount: '2滴' },
            { name: '广藿香精油', amount: '1滴' }
        ],
        usage: '咳嗽时,扩香15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '薰衣草镇静抗炎,缓解咳嗽;雪松收敛抗炎,改善呼吸道不适;乳香抗炎修复,缓解炎症;广藿香化湿化痰。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['cold', 'cough']
    },
    
    // 新增护手霜配方
    'formula-a4': {
        id: 'formula-a4',
        name: '配方A4:缓解鼻塞护手霜',
        subtitle: '感冒时使用 · 缓解鼻塞、改善呼吸不畅',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '欧薄荷精油', amount: '3滴(约0.15ml)' },
            { name: '雪松精油', amount: '2滴(约0.10ml)' },
            { name: '丝柏精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '感冒鼻塞时,取适量涂抹于鼻翼两侧、人中穴、太阳穴,轻柔按摩3-5分钟。',
        principle: '薄荷清凉通窍,缓解鼻塞;雪松收敛抗炎,改善呼吸道不适;丝柏收敛止血,缓解鼻部充血。',
        dailyAmount: '约0.04ml',
        matches: ['cold', 'nasal']
    },
    
    'formula-a5': {
        id: 'formula-a5',
        name: '配方A5:缓解肌肉酸痛护手霜',
        subtitle: '运动后使用 · 缓解肌肉酸痛、促进恢复',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '姜精油', amount: '3滴(约0.15ml)' },
            { name: '迷迭香精油', amount: '2滴(约0.10ml)' },
            { name: '乳香精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '运动后或肌肉酸痛时,取适量涂抹于酸痛部位,重点按摩3-5分钟。',
        principle: '姜温阳散寒,促进血液循环,缓解肌肉酸痛;迷迭香促进循环,改善局部循环;乳香活血通络,缓解炎症。',
        dailyAmount: '约0.04ml',
        matches: ['muscle', 'pain']
    },
    
    'formula-a6': {
        id: 'formula-a6',
        name: '配方A6:缓解关节疼痛护手霜',
        subtitle: '关节疼痛时使用 · 缓解关节疼痛、改善活动度',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '姜精油', amount: '3滴(约0.15ml)' },
            { name: '乳香精油', amount: '3滴(约0.15ml)' },
            { name: '丝柏精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '关节疼痛时,取适量涂抹于疼痛关节周围,轻柔按摩5-10分钟。',
        principle: '姜温阳散寒,促进血液循环,缓解关节疼痛;乳香活血通络,缓解炎症;丝柏收敛止血,改善局部循环。',
        dailyAmount: '约0.04ml',
        matches: ['joint', 'pain']
    },
    
    // 身体乳B9
    'formula-q': {
        id: 'formula-q',
        name: '配方B9:缓解肌肉酸痛身体乳',
        subtitle: '运动后使用 · 缓解肌肉酸痛、促进恢复',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '姜精油', amount: '5滴(约0.25ml)' },
            { name: '迷迭香精油', amount: '4滴(约0.20ml)' },
            { name: '乳香精油', amount: '4滴(约0.20ml)' },
            { name: '丝柏精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '运动后或肌肉酸痛时,取适量涂抹于酸痛部位,重点按摩5-10分钟。',
        principle: '姜温阳散寒,促进血液循环,缓解肌肉酸痛;迷迭香促进循环,改善局部循环;乳香活血通络,缓解炎症;丝柏收敛止血。',
        concentration: '1.6%',
        dailyAmount: '每次约0.24ml',
        matches: ['muscle', 'pain']
    },
    
    'formula-r': {
        id: 'formula-r',
        name: '配方B10:改善皮肤干燥身体乳',
        subtitle: '每晚洗澡后使用 · 改善皮肤干燥、滋润保湿',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '玫瑰精油', amount: '5滴(约0.25ml)' },
            { name: '檀香精油', amount: '4滴(约0.20ml)' },
            { name: '天竺葵精油', amount: '3滴(约0.15ml)' },
            { name: '乳香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:40洗澡后,取适量涂抹于全身,重点按摩干燥部位,轻柔按摩至吸收。',
        principle: '玫瑰滋润保湿,改善皮肤干燥;檀香温和滋润,修复肌肤;天竺葵平衡油脂,改善皮肤状态;乳香温和修复。',
        concentration: '1.5%',
        dailyAmount: '每次约0.23ml',
        matches: ['skin', 'dry']
    },
    
    'formula-s': {
        id: 'formula-s',
        name: '配方B11:缓解关节疼痛身体乳',
        subtitle: '关节疼痛时使用 · 缓解关节疼痛、改善活动度',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '姜精油', amount: '5滴(约0.25ml)' },
            { name: '乳香精油', amount: '5滴(约0.25ml)' },
            { name: '丝柏精油', amount: '4滴(约0.20ml)' },
            { name: '广藿香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '关节疼痛时,取适量涂抹于疼痛关节周围,重点按摩关节周围肌肉,轻柔按摩5-10分钟。',
        principle: '姜温阳散寒,促进血液循环,缓解关节疼痛;乳香活血通络,缓解炎症;丝柏收敛止血,改善局部循环;广藿香化湿通络。',
        concentration: '1.7%',
        dailyAmount: '每次约0.26ml',
        matches: ['joint', 'pain']
    },
    
    // 泡脚配方C5
    'formula-q1': {
        id: 'formula-q1',
        name: '配方C5:缓解肌肉疲劳泡脚液',
        subtitle: '运动后使用 · 缓解肌肉疲劳、促进恢复',
        ingredients: [
            { name: '热水(40-42℃)', amount: '适量至脚踝以上' },
            { name: '姜精油', amount: '3滴(约0.15ml)' },
            { name: '迷迭香精油', amount: '2滴(约0.10ml)' },
            { name: '乳香精油', amount: '2滴(约0.10ml)' },
            { name: '荷荷巴油(乳化剂)', amount: '5ml' }
        ],
        usage: '运动后,泡脚20分钟,水温保持在40-42℃。先将精油滴入5ml荷荷巴油中混合,再倒入热水中充分搅拌。',
        principle: '姜温阳散寒,促进血液循环,缓解肌肉疲劳;迷迭香促进循环,改善局部循环;乳香活血通络,缓解炎症。',
        dailyAmount: '约0.11ml(水中稀释,实际吸收30%)',
        matches: ['muscle', 'fatigue']
    },
    
    'formula-r1': {
        id: 'formula-r1',
        name: '配方C6:改善水肿泡脚液',
        subtitle: '每周2-3次 · 改善水肿、促进循环',
        ingredients: [
            { name: '热水(40-42℃)', amount: '适量至脚踝以上' },
            { name: '丝柏精油', amount: '3滴(约0.15ml)' },
            { name: '迷迭香精油', amount: '2滴(约0.10ml)' },
            { name: '广藿香精油', amount: '2滴(约0.10ml)' },
            { name: '荷荷巴油(乳化剂)', amount: '5ml' }
        ],
        usage: '每周2-3次,每晚19:00泡脚20分钟,水温保持在40-42℃。先将精油滴入5ml荷荷巴油中混合,再倒入热水中充分搅拌。',
        principle: '丝柏收敛止血,促进循环,改善水肿;迷迭香促进循环,改善局部循环;广藿香化湿健脾,改善水湿内停。',
        dailyAmount: '约0.11ml(水中稀释,实际吸收30%)',
        matches: ['edema', 'poor']
    },
    
    // 泡脚配方C7
    'formula-s1': {
        id: 'formula-s1',
        name: '配方C7:改善耳鸣泡脚液',
        subtitle: '每晚使用 · 改善耳鸣、补肾安神',
        ingredients: [
            { name: '热水(38-40℃)', amount: '适量至脚踝以上' },
            { name: '檀香精油', amount: '4滴(约0.20ml)' },
            { name: '野地薰衣草精油', amount: '3滴(约0.15ml)' },
            { name: '乳香精油', amount: '2滴(约0.10ml)' },
            { name: '荷荷巴油(乳化剂)', amount: '5ml' }
        ],
        usage: '每晚19:00泡脚20分钟,水温保持在38-40℃。先将精油滴入5ml荷荷巴油中混合,再倒入热水中充分搅拌。',
        principle: '檀香温肾安神,改善肾虚耳鸣;薰衣草镇静安神,缓解神经紧张;乳香深层放松,改善血液循环。',
        dailyAmount: '约0.14ml(水中稀释,实际吸收30%)',
        matches: ['tinnitus', 'kidney', 'poor']
    },
    
    'formula-t': {
        id: 'formula-t',
        name: '配方B12:脾肾双补身体乳',
        subtitle: '每晚洗澡后使用 · 改善脾肾两虚、疲劳乏力',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '檀香精油', amount: '6滴(约0.30ml)' },
            { name: '甜橙精油', amount: '5滴(约0.25ml)' },
            { name: '广藿香精油', amount: '4滴(约0.20ml)' },
            { name: '乳香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:40洗澡后,取适量涂抹于全身,重点按摩腹部、腰部、四肢。顺时针按摩腹部10分钟。',
        principle: '檀香温肾安神,补益肾阳;甜橙温中健脾,促进消化;广藿香化湿和胃,改善脾虚湿困;乳香活血通络。',
        concentration: '1.8%',
        dailyAmount: '每次约0.27ml',
        matches: ['both', 'spleen', 'kidney', 'fatigue', 'bloating']
    },
    
    'formula-u': {
        id: 'formula-u',
        name: '配方A7:改善耳鸣护手霜',
        subtitle: '耳鸣时使用 · 改善耳鸣、补肾安神',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '檀香精油', amount: '4滴(约0.20ml)' },
            { name: '野地薰衣草精油', amount: '3滴(约0.15ml)' },
            { name: '乳香精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '耳鸣时,取适量涂抹于手心、耳后、颈后,重点按压劳宫穴、翳风穴、风池穴,轻柔按摩3-5分钟。',
        principle: '檀香温肾安神,改善肾虚耳鸣;薰衣草镇静安神,缓解神经紧张;乳香深层放松,改善血液循环。',
        dailyAmount: '约0.04ml',
        matches: ['tinnitus', 'kidney', 'poor']
    },
    
    'formula-v': {
        id: 'formula-v',
        name: '配方A8:缓解工作压力护手霜',
        subtitle: '工作压力大时使用 · 缓解压力、提升专注力',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '佛手柑精油', amount: '3滴(约0.15ml)' },
            { name: '甜橙精油', amount: '3滴(约0.15ml)' },
            { name: '雪松精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '工作压力大时,取适量涂抹于手心、手腕、太阳穴,重点按压劳宫穴和合谷穴,轻柔按摩3-5分钟。',
        principle: '佛手柑疏肝理气,缓解工作压力;甜橙提升情绪,带来活力;雪松强壮补益,提升专注力。',
        dailyAmount: '约0.04ml',
        matches: ['stress', 'fatigue']
    },
    
    'formula-w': {
        id: 'formula-w',
        name: '配方B13:改善气虚身体乳',
        subtitle: '每晚洗澡后使用 · 改善气虚、容易出汗、气短',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '檀香精油', amount: '6滴(约0.30ml)' },
            { name: '甜橙精油', amount: '5滴(约0.25ml)' },
            { name: '广藿香精油', amount: '4滴(约0.20ml)' },
            { name: '乳香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:40洗澡后,取适量涂抹于全身,重点按摩腹部、腰部、四肢。顺时针按摩腹部8-10分钟。',
        principle: '檀香补益中气,提升能量;甜橙温中健脾,促进消化;广藿香化湿健脾,改善脾虚;乳香活血通络。',
        concentration: '1.8%',
        dailyAmount: '每次约0.27ml',
        matches: ['qi', 'fatigue', 'spleen']
    },
    
    // 喷雾配方E
    'formula-x1': {
        id: 'formula-x1',
        name: '配方E:深度助眠喷雾',
        subtitle: '睡前使用 · 改善睡眠质量、缓解睡前焦虑',
        ingredients: [
            { name: '玫瑰纯露', amount: '50ml' },
            { name: '野地薰衣草精油', amount: '10滴(约0.50ml)' },
            { name: '檀香精油', amount: '8滴(约0.40ml)' },
            { name: '乳香精油', amount: '6滴(约0.30ml)' },
            { name: '依兰依兰精油', amount: '4滴(约0.20ml)' }
        ],
        usage: '睡前30分钟,在卧室空气中喷洒3-5次,也可喷洒在枕头上。同时可喷洒在颈后、手腕、胸口。',
        principle: '薰衣草深度镇静,改善睡眠质量;檀香安神定志,缓解焦虑;乳香深层放松,缓解紧张;依兰依兰舒缓情绪。',
        concentration: '2.8%',
        dailyAmount: '每次约0.06-0.08ml',
        matches: ['poor', 'wake', 'anxiety']
    },
    
    'formula-x2': {
        id: 'formula-x2',
        name: '配方E1:缓解压力喷雾',
        subtitle: '工作压力大时使用 · 缓解压力、改善情绪',
        ingredients: [
            { name: '玫瑰纯露', amount: '50ml' },
            { name: '佛手柑精油', amount: '8滴(约0.40ml)' },
            { name: '野地薰衣草精油', amount: '6滴(约0.30ml)' },
            { name: '甜橙精油', amount: '6滴(约0.30ml)' }
        ],
        usage: '工作压力大或情绪紧张时,在办公桌面或空气中喷洒3-5次,也可喷洒在手腕、颈后。',
        principle: '佛手柑疏肝理气,缓解压力和焦虑;薰衣草镇静安神,平衡情绪;甜橙提升情绪,带来愉悦感。',
        concentration: '2.0%',
        dailyAmount: '每次约0.04-0.06ml',
        matches: ['stress', 'mood']
    },
    
    'formula-x3': {
        id: 'formula-x3',
        name: '配方E2:提神醒脑喷雾',
        subtitle: '早晨或下午使用 · 提升专注力、改善疲劳',
        ingredients: [
            { name: '双脱醛乙醇', amount: '50ml' },
            { name: '甜橙精油', amount: '8滴(约0.40ml)' },
            { name: '迷迭香精油', amount: '6滴(约0.30ml)' },
            { name: '欧薄荷精油', amount: '4滴(约0.20ml)' }
        ],
        usage: '早晨起床后或下午疲劳时,在空气中喷洒3-5次,也可喷洒在颈后、太阳穴、手腕。',
        principle: '甜橙提升情绪,带来活力;迷迭香促进循环,提升专注力;薄荷清凉提神,快速唤醒。',
        concentration: '1.8%',
        dailyAmount: '每次约0.04-0.05ml',
        matches: ['fatigue']
    },
    
    'formula-x4': {
        id: 'formula-x4',
        name: '配方E3:缓解头痛喷雾',
        subtitle: '头痛时使用 · 缓解头痛、放松神经',
        ingredients: [
            { name: '玫瑰纯露', amount: '50ml' },
            { name: '野地薰衣草精油', amount: '8滴(约0.40ml)' },
            { name: '欧薄荷精油', amount: '6滴(约0.30ml)' },
            { name: '乳香精油', amount: '4滴(约0.20ml)' }
        ],
        usage: '头痛时,在太阳穴、额头、颈后喷洒2-3次,轻柔按摩3-5分钟。同时可在空气中喷洒。',
        principle: '薰衣草镇静放松,缓解紧张性头痛;薄荷清凉止痛,缓解血管性头痛;乳香活血通络,改善头部循环。',
        concentration: '1.8%',
        dailyAmount: '每次约0.04-0.05ml',
        matches: ['headache']
    },
    
    'formula-x5': {
        id: 'formula-x5',
        name: '配方E4:改善情绪喷雾',
        subtitle: '情绪低落时使用 · 提升情绪、缓解抑郁',
        ingredients: [
            { name: '玫瑰纯露', amount: '50ml' },
            { name: '甜橙精油', amount: '8滴(约0.40ml)' },
            { name: '依兰依兰精油', amount: '6滴(约0.30ml)' },
            { name: '天竺葵精油', amount: '4滴(约0.20ml)' }
        ],
        usage: '情绪低落时,在空气中喷洒3-5次,也可喷洒在手腕、颈后、胸口,轻柔按摩至吸收。',
        principle: '甜橙提升情绪,带来活力;依兰依兰舒缓情绪,带来愉悦感;天竺葵平衡激素,调节情绪。',
        concentration: '1.8%',
        dailyAmount: '每次约0.04-0.05ml',
        matches: ['mood', 'stress']
    },
    
    'formula-x6': {
        id: 'formula-x6',
        name: '配方E5:缓解鼻塞喷雾',
        subtitle: '感冒时使用 · 缓解鼻塞、改善呼吸不畅',
        ingredients: [
            { name: '双脱醛乙醇', amount: '50ml' },
            { name: '欧薄荷精油', amount: '8滴(约0.40ml)' },
            { name: '雪松精油', amount: '6滴(约0.30ml)' },
            { name: '丝柏精油', amount: '4滴(约0.20ml)' }
        ],
        usage: '感冒鼻塞时,在鼻翼两侧、人中穴、太阳穴喷洒2-3次,轻柔按摩3-5分钟。同时可在空气中喷洒。',
        principle: '薄荷清凉通窍,缓解鼻塞;雪松收敛抗炎,改善呼吸道不适;丝柏收敛止血,缓解鼻部充血。',
        concentration: '1.8%',
        dailyAmount: '每次约0.04-0.05ml',
        matches: ['cold', 'nasal']
    },
    
    // 使用新精油的配方 - 护肤类
    'formula-a9': {
        id: 'formula-a9',
        name: '配方A9:敏感肌舒缓护手霜',
        subtitle: '日常使用 · 适合敏感肌肤,温和舒缓',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '洋甘菊精油', amount: '3滴(约0.15ml)' },
            { name: '橙花精油', amount: '2滴(约0.10ml)' },
            { name: '檀香精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '日常使用,取适量涂抹于手部,轻柔按摩至吸收。首次使用前,建议在手臂内侧做皮肤测试。',
        principle: '洋甘菊温和舒缓,抗炎镇静;橙花纯净温和,安抚敏感肌肤;檀香温和滋润,修复肌肤。',
        dailyAmount: '约0.07ml',
        matches: ['skin']
    },
    
    'formula-b14': {
        id: 'formula-b14',
        name: '配方B14:护肤滋养身体乳',
        subtitle: '每晚洗澡后使用 · 改善皮肤干燥、滋润保湿',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '茉莉精油', amount: '5滴(约0.25ml)' },
            { name: '玫瑰精油', amount: '4滴(约0.20ml)' },
            { name: '橙花精油', amount: '3滴(约0.15ml)' },
            { name: '檀香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:40洗澡后,取适量涂抹于全身,重点按摩干燥部位,轻柔按摩至吸收。',
        principle: '茉莉滋润保湿,改善皮肤干燥;玫瑰活血养颜,改善肤色;橙花温和修复,适合敏感肌肤;檀香温和滋润。',
        concentration: '1.5%',
        dailyAmount: '每次约0.23ml',
        matches: ['skin', 'dry']
    },
    
    'formula-a10': {
        id: 'formula-a10',
        name: '配方A10:抗痘净化护手霜',
        subtitle: '皮肤问题使用 · 改善痘痘、净化肌肤',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '茶树精油', amount: '4滴(约0.20ml)' },
            { name: '洋甘菊精油', amount: '2滴(约0.10ml)' },
            { name: '柠檬精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '皮肤有痘痘时,取适量涂抹于问题部位,轻柔按摩至吸收。注意光敏性,使用后避免日晒。',
        principle: '茶树抗菌消炎,净化肌肤;洋甘菊抗炎舒缓,缓解炎症;柠檬净化排毒,注意光敏性。',
        dailyAmount: '约0.08ml',
        matches: ['skin']
    },
    
    // 呼吸系统配方
    'formula-d6': {
        id: 'formula-d6',
        name: '配方D6:畅通呼吸扩香',
        subtitle: '感冒时使用 · 缓解鼻塞、改善呼吸不畅',
        ingredients: [
            { name: '尤加利精油', amount: '4滴' },
            { name: '茶树精油', amount: '3滴' },
            { name: '柠檬精油', amount: '2滴' }
        ],
        usage: '感冒时,扩香15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '尤加利畅通呼吸道,抗炎;茶树抗菌消炎,增强免疫力;柠檬净化空气,提神。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['cold', 'nasal', 'cough']
    },
    
    'formula-b15': {
        id: 'formula-b15',
        name: '配方B15:缓解咳嗽身体乳',
        subtitle: '感冒时使用 · 缓解咳嗽、改善呼吸道不适',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '尤加利精油', amount: '5滴(约0.25ml)' },
            { name: '茶树精油', amount: '4滴(约0.20ml)' },
            { name: '乳香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '感冒咳嗽时,取适量涂抹于胸部和背部,重点按摩胸部,轻柔按摩5-10分钟。',
        principle: '尤加利畅通呼吸道,抗炎;茶树抗菌消炎,缓解炎症;乳香抗炎修复,缓解咳嗽。',
        concentration: '1.2%',
        dailyAmount: '每次约0.18ml',
        matches: ['cold', 'cough']
    },
    
    'formula-d7': {
        id: 'formula-d7',
        name: '配方D7:预防感冒扩香',
        subtitle: '日常使用 · 预防感冒、增强免疫力',
        ingredients: [
            { name: '茶树精油', amount: '3滴' },
            { name: '柠檬精油', amount: '3滴' },
            { name: '尤加利精油', amount: '2滴' }
        ],
        usage: '每日1-2次,每次15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '茶树抗菌消炎,增强免疫力;柠檬净化空气,提升抵抗力;尤加利畅通呼吸道。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['immune', 'cold']
    },
    
    // 情绪调节配方
    'formula-d8': {
        id: 'formula-d8',
        name: '配方D8:愉悦心情扩香',
        subtitle: '情绪低落时使用 · 提升情绪、缓解抑郁',
        ingredients: [
            { name: '甜橙精油', amount: '4滴' },
            { name: '葡萄柚精油', amount: '3滴' },
            { name: '茉莉精油', amount: '2滴' }
        ],
        usage: '情绪低落时,扩香15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '甜橙提升情绪,带来活力;葡萄柚提振情绪,促进代谢;茉莉平衡情绪,提升自信。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['mood', 'stress']
    },
    
    'formula-b16': {
        id: 'formula-b16',
        name: '配方B16:深度放松身体乳',
        subtitle: '睡前使用 · 改善睡眠质量、缓解焦虑',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '洋甘菊精油', amount: '6滴(约0.30ml)' },
            { name: '橙花精油', amount: '5滴(约0.25ml)' },
            { name: '野地薰衣草精油', amount: '4滴(约0.20ml)' },
            { name: '檀香精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '睡前30分钟,取适量涂抹于全身,重点按摩颈后、胸口、腹部、脚底。轻柔按摩10-15分钟。',
        principle: '洋甘菊温和舒缓,深度放松;橙花镇静抗焦虑,助眠;薰衣草镇静安神;檀香安神定志。',
        concentration: '1.8%',
        dailyAmount: '每次约0.27ml',
        matches: ['poor', 'wake', 'anxiety']
    },
    
    'formula-b17': {
        id: 'formula-b17',
        name: '配方B17:提升自信身体乳',
        subtitle: '日常使用 · 提升自信、平衡情绪',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '茉莉精油', amount: '5滴(约0.25ml)' },
            { name: '依兰依兰精油', amount: '4滴(约0.20ml)' },
            { name: '甜橙精油', amount: '4滴(约0.20ml)' },
            { name: '天竺葵精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '日常使用,取适量涂抹于全身,重点按摩颈后、胸口、手腕。轻柔按摩至吸收。',
        principle: '茉莉提升自信,平衡情绪;依兰依兰舒缓情绪,带来愉悦感;甜橙提升情绪;天竺葵平衡激素。',
        concentration: '1.6%',
        dailyAmount: '每次约0.24ml',
        matches: ['mood', 'stress']
    },
    
    // 消化系统配方
    'formula-a11': {
        id: 'formula-a11',
        name: '配方A11:促进消化护手霜',
        subtitle: '餐后使用 · 改善腹胀、消化不良',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '柠檬精油', amount: '3滴(约0.15ml)' },
            { name: '甜橙精油', amount: '3滴(约0.15ml)' },
            { name: '姜精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '餐后30分钟,取适量涂抹于手心,重点按摩中脘穴和合谷穴,顺时针按摩3-5分钟。注意光敏性。',
        principle: '柠檬促进消化,净化排毒;甜橙温中健脾,促进消化;姜温胃散寒,改善腹胀。',
        dailyAmount: '约0.08ml',
        matches: ['bloating', 'appetite', 'spleen']
    },
    
    'formula-b18': {
        id: 'formula-b18',
        name: '配方B18:健脾化湿身体乳',
        subtitle: '每晚洗澡后使用 · 改善脾虚、消化不良',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '广藿香精油', amount: '5滴(约0.25ml)' },
            { name: '柠檬草精油', amount: '4滴(约0.20ml)' },
            { name: '甜橙精油', amount: '4滴(约0.20ml)' },
            { name: '姜精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '19:40洗澡后,取适量涂抹于腹部、腰部、大腿。顺时针按摩腹部10分钟,重点温养脾胃区域。',
        principle: '广藿香化湿和胃,改善脾虚湿困;柠檬草促进消化,提神醒脑;甜橙温中健脾;姜温胃散寒。',
        concentration: '1.6%',
        dailyAmount: '每次约0.24ml',
        matches: ['spleen', 'bloating', 'appetite', 'teeth']
    },
    
    // 免疫力配方
    'formula-d9': {
        id: 'formula-d9',
        name: '配方D9:增强免疫力扩香',
        subtitle: '日常使用 · 预防感冒、增强抵抗力',
        ingredients: [
            { name: '茶树精油', amount: '3滴' },
            { name: '柠檬精油', amount: '3滴' },
            { name: '百里香精油', amount: '2滴' },
            { name: '乳香精油', amount: '1滴' }
        ],
        usage: '每日1-2次,每次15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '茶树抗菌消炎,增强免疫力;柠檬净化空气,提升抵抗力;百里香抗菌,增强免疫力;乳香抗炎修复。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['immune', 'fatigue']
    },
    
    'formula-b19': {
        id: 'formula-b19',
        name: '配方B19:提神抗疲劳身体乳',
        subtitle: '早晨或下午使用 · 改善疲劳、提升精力',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '柠檬草精油', amount: '5滴(约0.25ml)' },
            { name: '迷迭香精油', amount: '4滴(约0.20ml)' },
            { name: '甜橙精油', amount: '4滴(约0.20ml)' },
            { name: '欧薄荷精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '早晨起床后或下午疲劳时,取适量涂抹于全身,重点按摩颈后、肩膀、四肢。快速按摩5-8分钟。',
        principle: '柠檬草提神醒脑,驱散疲劳;迷迭香促进循环,提神醒脑;甜橙提升情绪;薄荷清凉提神。',
        concentration: '1.6%',
        dailyAmount: '每次约0.24ml',
        matches: ['fatigue']
    },
    
    // 净化排毒配方
    'formula-b20': {
        id: 'formula-b20',
        name: '配方B20:净化排毒身体乳',
        subtitle: '每周2-3次使用 · 净化排毒、促进代谢',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '杜松精油', amount: '5滴(约0.25ml)' },
            { name: '葡萄柚精油', amount: '4滴(约0.20ml)' },
            { name: '柠檬精油', amount: '4滴(约0.20ml)' },
            { name: '丝柏精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '每周2-3次,洗澡后取适量涂抹于全身,重点按摩腹部、腰部、四肢。轻柔按摩10分钟。注意光敏性。',
        principle: '杜松净化排毒,促进代谢;葡萄柚促进代谢,排水消肿;柠檬净化排毒;丝柏收敛止血,促进循环。',
        concentration: '1.6%',
        dailyAmount: '每次约0.24ml',
        matches: ['edema', 'poor']
    },
    
    'formula-c8': {
        id: 'formula-c8',
        name: '配方C8:净化排毒泡脚液',
        subtitle: '每周2-3次使用 · 净化排毒、促进循环',
        ingredients: [
            { name: '热水(40-42℃)', amount: '适量至脚踝以上' },
            { name: '杜松精油', amount: '3滴(约0.15ml)' },
            { name: '葡萄柚精油', amount: '3滴(约0.15ml)' },
            { name: '柠檬精油', amount: '2滴(约0.10ml)' },
            { name: '荷荷巴油(乳化剂)', amount: '5ml' }
        ],
        usage: '每周2-3次,每晚19:00泡脚20分钟,水温保持在40-42℃。先将精油滴入5ml荷荷巴油中混合,再倒入热水中充分搅拌。注意光敏性。',
        principle: '杜松净化排毒,促进代谢;葡萄柚促进代谢,排水消肿;柠檬净化排毒。',
        dailyAmount: '约0.12ml(水中稀释,实际吸收30%)',
        matches: ['edema', 'poor']
    },
    
    // 头痛缓解配方
    'formula-d10': {
        id: 'formula-d10',
        name: '配方D10:缓解头痛扩香',
        subtitle: '头痛时使用 · 缓解头痛、放松神经',
        ingredients: [
            { name: '野地薰衣草精油', amount: '4滴' },
            { name: '欧薄荷精油', amount: '3滴' },
            { name: '洋甘菊精油', amount: '2滴' }
        ],
        usage: '头痛时,扩香15-20分钟。将精油滴入扩香仪或香薰机,保持空间通风良好。',
        principle: '薰衣草镇静放松,缓解紧张性头痛;薄荷清凉止痛,缓解血管性头痛;洋甘菊温和舒缓,抗炎。',
        dailyAmount: '不计入每日精油皮肤接触量',
        matches: ['headache']
    },
    
    // 肌肉放松配方
    'formula-b21': {
        id: 'formula-b21',
        name: '配方B21:肌肉放松身体乳',
        subtitle: '运动后使用 · 缓解肌肉紧张、促进恢复',
        ingredients: [
            { name: '无香身体乳基底', amount: '200g' },
            { name: '马郁兰精油', amount: '5滴(约0.25ml)' },
            { name: '野地薰衣草精油', amount: '4滴(约0.20ml)' },
            { name: '乳香精油', amount: '4滴(约0.20ml)' },
            { name: '洋甘菊精油', amount: '3滴(约0.15ml)' }
        ],
        usage: '运动后或肌肉紧张时,取适量涂抹于紧张部位,重点按摩5-10分钟。',
        principle: '马郁兰镇静安神,止痛,缓解肌肉紧张;薰衣草镇静放松;乳香活血通络;洋甘菊抗炎舒缓。',
        concentration: '1.6%',
        dailyAmount: '每次约0.24ml',
        matches: ['muscle', 'pain']
    },
    
    // 提神醒脑配方
    'formula-a12': {
        id: 'formula-a12',
        name: '配方A12:提神醒脑护手霜',
        subtitle: '工作时段使用 · 提升专注力、改善疲劳',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '柠檬草精油', amount: '3滴(约0.15ml)' },
            { name: '迷迭香精油', amount: '2滴(约0.10ml)' },
            { name: '欧薄荷精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '工作时段,每2-3小时涂抹一次。取适量于手心,重点按压劳宫穴和合谷穴,充分吸收后深呼吸3次。',
        principle: '柠檬草提神醒脑,驱散疲劳;迷迭香促进循环,提升专注力;薄荷清凉提神,快速唤醒。',
        dailyAmount: '约0.07ml',
        matches: ['fatigue', 'stress']
    },
    
    // 抗菌净化配方
    'formula-e6': {
        id: 'formula-e6',
        name: '配方E6:抗菌净化喷雾',
        subtitle: '日常使用 · 净化空气、预防感染',
        ingredients: [
            { name: '双脱醛乙醇', amount: '50ml' },
            { name: '茶树精油', amount: '10滴(约0.50ml)' },
            { name: '柠檬精油', amount: '6滴(约0.30ml)' },
            { name: '尤加利精油', amount: '4滴(约0.20ml)' }
        ],
        usage: '日常使用,在空气中喷洒3-5次,也可喷洒在桌面、门把手等接触面。注意光敏性。',
        principle: '茶树抗菌消炎,净化空气;柠檬净化排毒,注意光敏性;尤加利畅通呼吸道,抗炎。',
        concentration: '2.0%',
        dailyAmount: '每次约0.04-0.06ml',
        matches: ['immune', 'cold']
    },
    
    // 罗勒配方
    'formula-a13': {
        id: 'formula-a13',
        name: '配方A13:缓解消化不良护手霜',
        subtitle: '餐后使用 · 改善腹胀、消化不良',
        ingredients: [
            { name: '无香护手霜基底', amount: '50g' },
            { name: '罗勒精油', amount: '3滴(约0.15ml)' },
            { name: '甜橙精油', amount: '3滴(约0.15ml)' },
            { name: '姜精油', amount: '2滴(约0.10ml)' }
        ],
        usage: '餐后30分钟,取适量涂抹于手心,重点按摩中脘穴和合谷穴,顺时针按摩3-5分钟。',
        principle: '罗勒提神醒脑,促进消化,缓解头痛;甜橙温中健脾,促进消化;姜温胃散寒,改善腹胀。',
        dailyAmount: '约0.08ml',
        matches: ['bloating', 'appetite', 'headache']
    }
};

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

