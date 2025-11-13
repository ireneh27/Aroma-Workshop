// 快速测试脚本 - 在浏览器控制台运行
// 用于检查关键功能是否正常

console.log('=== 芳疗方案网站 - 功能检查 ===\n');

// 1. 检查关键变量
console.log('1. 检查关键变量:');
console.log('   FORMULA_DATABASE:', typeof FORMULA_DATABASE !== 'undefined' ? `✓ 已加载 (${Object.keys(FORMULA_DATABASE).length} 个配方) [来自 formula-database.js]` : '✗ 未加载 (请确认 formula-database.js 已加载)');
console.log('   AI_CONFIG:', typeof AI_CONFIG !== 'undefined' ? `✓ 已加载 (provider: ${AI_CONFIG.provider})` : '✗ 未加载');
console.log('   getQuestionnaireData:', typeof getQuestionnaireData !== 'undefined' ? '✓ 已加载' : '✗ 未加载');
console.log('   generateScenarioSuggestions:', typeof generateScenarioSuggestions !== 'undefined' ? '✓ 已加载' : '✗ 未加载');
console.log('');

// 2. 检查问卷数据
console.log('2. 检查问卷数据:');
const questionnaireData = typeof getQuestionnaireData !== 'undefined' ? getQuestionnaireData() : null;
if (questionnaireData) {
    console.log('   ✓ 问卷数据存在');
    console.log('   - 使用方式:', questionnaireData.usage || '未选择');
    console.log('   - 性别:', questionnaireData.gender || '未填写');
    console.log('   - 年龄:', questionnaireData.age || '未填写');
} else {
    console.log('   ✗ 未找到问卷数据');
    console.log('   💡 提示: 请先访问 health-profile.html 填写问卷');
}
console.log('');

// 3. 检查配方数据库
if (typeof FORMULA_DATABASE !== 'undefined') {
    console.log('3. 检查配方数据库:');
    const formulas = Object.values(FORMULA_DATABASE);
    console.log(`   ✓ 共 ${formulas.length} 个配方`);
    
    // 按使用方式分类
    const byUsage = {
        handcream: formulas.filter(f => f.name.includes('护手霜') || f.subtitle?.includes('护手霜')),
        bodylotion: formulas.filter(f => f.name.includes('身体乳') || f.subtitle?.includes('身体乳')),
        footbath: formulas.filter(f => f.name.includes('泡脚') || f.name.includes('泡澡') || f.subtitle?.includes('泡脚') || f.subtitle?.includes('泡澡')),
        diffuser: formulas.filter(f => f.name.includes('扩香') || f.subtitle?.includes('扩香')),
        spray: formulas.filter(f => f.name.includes('喷雾') || f.subtitle?.includes('喷雾'))
    };
    
    console.log('   按使用方式分类:');
    console.log('   - 护手霜:', byUsage.handcream.length);
    console.log('   - 身体乳:', byUsage.bodylotion.length);
    console.log('   - 泡脚/泡澡:', byUsage.footbath.length);
    console.log('   - 扩香:', byUsage.diffuser.length);
    console.log('   - 喷雾:', byUsage.spray.length);
} else {
    console.log('3. 检查配方数据库:');
    console.log('   ✗ FORMULA_DATABASE 未加载');
    console.log('   💡 提示: 请确认 formula-database.js 已正确加载');
}
console.log('');

// 4. 检查AI配置
if (typeof AI_CONFIG !== 'undefined') {
    console.log('4. 检查AI配置:');
    console.log('   Provider:', AI_CONFIG.provider);
    if (AI_CONFIG.provider !== 'none') {
        const config = AI_CONFIG[AI_CONFIG.provider];
        console.log('   API Key:', config.apiKey ? '✓ 已配置' : '✗ 未配置');
        console.log('   Model:', config.model);
        console.log('   Base URL:', config.baseURL);
    } else {
        console.log('   ⚠️ AI功能已禁用 (provider: none)');
    }
} else {
    console.log('4. 检查AI配置:');
    console.log('   ✗ AI_CONFIG 未加载');
}
console.log('');

// 5. 检查登录状态
console.log('5. 检查登录状态:');
if (typeof window !== 'undefined' && window.authSystem) {
    const isLoggedIn = window.authSystem.isUserLoggedIn();
    console.log('   Auth System:', '✓ 已加载');
    console.log('   登录状态:', isLoggedIn ? '✓ 已登录' : '✗ 未登录');
    if (isLoggedIn) {
        const user = window.authSystem.getCurrentUser();
        console.log('   用户:', user.email || user.id);
        const userInfo = window.authSystem.getUserInfo();
        console.log('   AI查询次数:', userInfo.remainingInquiries || 0);
    }
} else {
    console.log('   ✗ Auth System 未加载');
}
console.log('');

// 6. 测试场景建议生成（如果条件满足）
if (questionnaireData && questionnaireData.usage && questionnaireData.usage.length > 0) {
    console.log('6. 测试场景建议生成:');
    console.log('   ⏳ 正在测试...');
    
    if (typeof generateScenarioSuggestions !== 'undefined') {
        generateScenarioSuggestions(questionnaireData)
            .then(result => {
                if (result && result.scenarios) {
                    console.log('   ✓ 场景建议生成成功');
                    console.log('   - 场景数量:', result.scenarios.length);
                    result.scenarios.forEach((scenario, index) => {
                        console.log(`   - 场景 ${index + 1}: ${scenario.name}`);
                        if (scenario.timeline) {
                            console.log(`     时间线项目: ${scenario.timeline.length} 个`);
                        }
                    });
                } else {
                    console.log('   ✗ 场景建议生成失败: 返回结果为空');
                }
            })
            .catch(error => {
                console.log('   ✗ 场景建议生成失败:', error.message);
                if (error.message === 'AI_QUERY_REQUIRES_LOGIN') {
                    console.log('   💡 提示: 需要登录才能使用AI功能');
                } else if (error.message === 'AI_QUERY_LIMIT_EXCEEDED') {
                    console.log('   💡 提示: AI查询次数已用完');
                }
            });
    } else {
        console.log('   ✗ generateScenarioSuggestions 函数未加载');
    }
} else {
    console.log('6. 测试场景建议生成:');
    console.log('   ⚠️ 跳过: 请先填写问卷并选择使用方式');
}
console.log('');

console.log('=== 检查完成 ===');
console.log('\n💡 提示:');
console.log('   - 如果看到 ✗，请检查相关文件是否正确加载');
console.log('   - 如果AI功能未启用，请检查 ai-service.js 中的配置');
console.log('   - 如果场景建议生成失败，请查看上面的错误信息');

