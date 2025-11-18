// 问卷数据管理 - 支持用户关联和多档案
const QUESTIONNAIRE_STORAGE_KEY = 'healthQuestionnaireData'; // 向后兼容的全局key
const USER_QUESTIONNAIRE_PREFIX = 'user_questionnaire_'; // 用户特定的key前缀
const USER_PROFILES_KEY = 'user_profiles_'; // 用户档案列表key

// 获取当前用户的问卷数据存储key（单个档案，向后兼容）
function getUserQuestionnaireKey() {
    if (typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn()) {
        const user = window.authSystem.getCurrentUser();
        if (user) {
            return `${USER_QUESTIONNAIRE_PREFIX}${user.id}`;
        }
    }
    return QUESTIONNAIRE_STORAGE_KEY; // 未登录用户使用全局key
}

// 获取用户档案列表key
function getUserProfilesKey() {
    if (typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn()) {
        const user = window.authSystem.getCurrentUser();
        if (user) {
            return `${USER_PROFILES_KEY}${user.id}`;
        }
    }
    return null;
}

// 获取用户的所有档案
function getUserProfiles() {
    const profilesKey = getUserProfilesKey();
    if (!profilesKey) return [];
    
    try {
        const data = localStorage.getItem(profilesKey);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading user profiles:', e);
        return [];
    }
}

// 保存用户档案列表
function saveUserProfiles(profiles) {
    const profilesKey = getUserProfilesKey();
    if (!profilesKey) return false;
    
    try {
        localStorage.setItem(profilesKey, JSON.stringify(profiles));
        return true;
    } catch (e) {
        console.error('Error saving user profiles:', e);
        return false;
    }
}

// 保存问卷数据为命名档案（最多2个）
function saveQuestionnaireAsProfile(profileName, questionnaireData) {
    if (!profileName || !profileName.trim()) {
        return { success: false, message: '请输入档案名称' };
    }
    
    if (!questionnaireData) {
        return { success: false, message: '问卷数据不能为空' };
    }
    
    const profiles = getUserProfiles();
    if (!Array.isArray(profiles)) {
        return { success: false, message: '无法读取档案列表' };
    }
    
    // 检查是否已存在同名档案
    const existingIndex = profiles.findIndex(p => p && p.name === profileName.trim());
    
    // 检查档案数量限制（最多2个）
    if (existingIndex === -1 && profiles.length >= 2) {
        return { success: false, message: '最多只能保存2个档案，请先删除一个' };
    }
    
    const profileData = {
        id: existingIndex !== -1 && profiles[existingIndex] && profiles[existingIndex].id 
            ? profiles[existingIndex].id 
            : 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: profileName.trim(),
        data: questionnaireData,
        createdAt: existingIndex !== -1 && profiles[existingIndex] && profiles[existingIndex].createdAt
            ? profiles[existingIndex].createdAt
            : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (existingIndex !== -1 && existingIndex < profiles.length) {
        // 更新现有档案
        profiles[existingIndex] = profileData;
    } else {
        // 添加新档案
        profiles.push(profileData);
    }
    
    if (saveUserProfiles(profiles)) {
        return { success: true, message: existingIndex !== -1 ? '档案已更新' : '档案已保存', profile: profileData };
    } else {
        return { success: false, message: '保存失败，请重试' };
    }
}

// 删除用户档案
function deleteUserProfile(profileId) {
    if (!profileId) {
        return { success: false, message: '档案ID无效' };
    }
    
    const profiles = getUserProfiles();
    if (!Array.isArray(profiles)) {
        return { success: false, message: '无法读取档案列表' };
    }
    
    const filtered = profiles.filter(p => p && p.id !== profileId);
    
    if (filtered.length === profiles.length) {
        return { success: false, message: '档案不存在' };
    }
    
    if (saveUserProfiles(filtered)) {
        return { success: true, message: '档案已删除' };
    } else {
        return { success: false, message: '删除失败，请重试' };
    }
}

// 加载指定的用户档案
function loadUserProfile(profileId) {
    if (!profileId) {
        return null;
    }
    
    const profiles = getUserProfiles();
    if (!Array.isArray(profiles)) {
        return null;
    }
    
    const profile = profiles.find(p => p && p.id === profileId);
    return profile && profile.data ? profile.data : null;
}

// 显示消息
function showQuestionnaireMessage(message, type = 'success') {
    const indicator = document.getElementById('savedIndicator');
    if (!indicator) return;
    
    indicator.textContent = message;
    indicator.className = `saved-indicator show`;
    indicator.style.background = type === 'success' ? 'var(--success-color)' : 
                                  type === 'error' ? '#ef4444' : 'var(--warning-color)';
    
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 3000);
}

// 更新进度条
function updateProgress() {
    const form = document.getElementById('healthQuestionnaire');
    if (!form) return;
    
    const totalQuestions = form.querySelectorAll('.question-section').length;
    let answeredSections = 0;
    
    form.querySelectorAll('.question-section').forEach(section => {
        const hasAnswer = section.querySelector('input:checked, input[type="number"]:not([value=""])');
        if (hasAnswer) answeredSections++;
    });
    
    const progress = (answeredSections / totalQuestions) * 100;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
}

// 保存问卷数据（关联到当前用户，支持命名档案）
function saveQuestionnaire() {
    const form = document.getElementById('healthQuestionnaire');
    if (!form) return;
    
    // 检查用户登录状态
    const isLoggedIn = typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn();
    if (!isLoggedIn) {
        showQuestionnaireMessage('请先登录以保存您的健康档案', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const data = {
        timestamp: new Date().toISOString(),
        userId: isLoggedIn ? window.authSystem.getCurrentUser().id : null,
        userEmail: isLoggedIn ? window.authSystem.getCurrentUser().email : null,
        age: formData.get('age') || null,
        gender: formData.get('gender') || null,
        pregnancy: formData.get('pregnancy') || null,
        circulation: formData.getAll('circulation'),
        sleep: formData.getAll('sleep'),
        digestive: formData.getAll('digestive'),
        gynecological: formData.getAll('gynecological'),
        constitution: formData.getAll('constitution'),
        other: formData.getAll('other'),
        caution: formData.getAll('caution'),
        fragrance: formData.getAll('fragrance'),
        usage: formData.getAll('usage')
    };
    
    // 对于已登录用户，提示输入档案名称
    const profiles = getUserProfiles();
    const profileName = prompt(
        profiles.length > 0 
            ? `请输入档案名称（当前已有 ${profiles.length}/2 个档案）：\n\n已有档案：${profiles.map(p => p.name).join('、')}`
            : '请输入档案名称（最多可保存2个档案）：',
        profiles.length === 0 ? '我的档案' : ''
    );
    
    if (!profileName || !profileName.trim()) {
        showQuestionnaireMessage('已取消保存', 'error');
        return;
    }
    
    // 检查档案数量限制（最多2个）
    const existingIndex = profiles.findIndex(p => p.name === profileName.trim());
    if (existingIndex === -1 && profiles.length >= 2) {
        showQuestionnaireMessage('最多只能保存2个档案，请先删除一个或使用现有档案名称', 'error');
        return;
    }
    
    // 保存为命名档案
    const result = saveQuestionnaireAsProfile(profileName.trim(), data);
    if (result.success) {
        // 同时保存到全局key（向后兼容）
        localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(data));
        showQuestionnaireMessage(`✓ 档案"${profileName.trim()}"已保存`, 'success');
        updateProgress();
        
        // 刷新档案选择器（如果存在）
        if (typeof renderProfileSelector === 'function') {
            renderProfileSelector();
        }
    } else {
        showQuestionnaireMessage(result.message, 'error');
    }
}

// 加载问卷数据（从当前用户的存储中加载，支持选择档案）
function loadQuestionnaire(profileId = null) {
    try {
        let data = null;
        
        // 如果指定了档案ID，加载该档案
        if (profileId) {
            data = loadUserProfile(profileId);
        } else {
            // 否则尝试加载默认数据
            const storageKey = getUserQuestionnaireKey();
            let saved = localStorage.getItem(storageKey);
            
            // 如果用户未登录或没有用户数据，尝试加载全局数据（向后兼容）
            if (!saved) {
                saved = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
            }
            
            if (saved) {
                data = JSON.parse(saved);
            }
        }
        
        if (!data) {
            showQuestionnaireMessage('未找到已保存的数据', 'error');
            return;
        }
        
        const form = document.getElementById('healthQuestionnaire');
        if (!form) return;
        
        // 重置表单
        form.reset();
        
        // 填充表单
        if (data.age) {
            const ageInput = form.querySelector('#age');
            if (ageInput) ageInput.value = data.age;
        }
        
        if (data.gender) {
            const genderInput = form.querySelector(`input[name="gender"][value="${data.gender}"]`);
            if (genderInput) genderInput.checked = true;
        }
        
        if (data.pregnancy) {
            const pregnancyInput = form.querySelector(`input[name="pregnancy"][value="${data.pregnancy}"]`);
            if (pregnancyInput) pregnancyInput.checked = true;
        }
        
        // 处理多选
        ['circulation', 'sleep', 'digestive', 'gynecological', 'constitution', 'other', 'caution', 'fragrance', 'usage'].forEach(category => {
            if (data[category] && Array.isArray(data[category])) {
                data[category].forEach(value => {
                    const input = form.querySelector(`input[name="${category}"][value="${value}"]`);
                    if (input) input.checked = true;
                });
            }
        });
        
        // 根据性别显示/隐藏妇科部分和怀孕/哺乳期部分
        if (data.gender) {
            toggleGynecologicalSection(data.gender);
            togglePregnancySection(data.gender);
        }
        
        const userInfo = typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn() 
            ? '（已加载您的个人健康档案）' : '';
        showQuestionnaireMessage(`✓ 数据已加载${userInfo}`, 'success');
        updateProgress();
    } catch (error) {
        showQuestionnaireMessage('加载失败', 'error');
        console.error('Load error:', error);
    }
}

// 渲染档案选择器（在health-profile.html中使用）
function renderProfileSelector() {
    const container = document.getElementById('profileSelector');
    if (!container) return;
    
    const isLoggedIn = typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn();
    if (!isLoggedIn) {
        container.style.display = 'none';
        return;
    }
    
    const profiles = getUserProfiles();
    if (!Array.isArray(profiles)) {
        container.innerHTML = '<p style="color: var(--secondary-color);">无法加载档案列表</p>';
        container.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    
    if (profiles.length === 0) {
        container.innerHTML = '<p style="color: var(--secondary-color);">暂无已保存的档案</p>';
        return;
    }
    
    let html = '<div style="margin-bottom: 15px;"><strong>已保存的档案：</strong></div>';
    html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
    
    profiles.forEach(profile => {
        if (!profile || !profile.id) return;
        const profileId = escapeHtml(profile.id);
        const profileName = profile.name ? escapeHtml(profile.name) : '未命名档案';
        const updatedAt = profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('zh-CN') : '未知时间';
        html += `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="flex: 1;">
                    <strong>${profileName}</strong>
                    <div style="font-size: 12px; color: var(--secondary-color);">
                        更新于：${updatedAt}
                    </div>
                </div>
                <button onclick="loadQuestionnaire('${profileId}')" style="padding: 6px 12px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">加载</button>
                <button onclick="deleteProfile('${profileId}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">删除</button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// 删除档案（全局函数）
window.deleteProfile = function(profileId) {
    if (!confirm('确定要删除这个档案吗？')) return;
    
    const result = deleteUserProfile(profileId);
    if (result.success) {
        showQuestionnaireMessage(result.message, 'success');
        renderProfileSelector();
    } else {
        showQuestionnaireMessage(result.message, 'error');
    }
};

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 切换妇科部分显示
function toggleGynecologicalSection(gender) {
    const section = document.getElementById('gynecological-section');
    if (!section) return;
    
    if (gender === 'male' || !gender) {
        section.style.display = 'none';
        // 取消选中妇科相关选项
        section.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    } else if (gender === 'female') {
        section.style.display = 'block';
    }
}

// 切换怀孕/哺乳期部分显示
function togglePregnancySection(gender) {
    const section = document.getElementById('pregnancy-section');
    if (!section) return;
    
    const pregnancyInputs = section.querySelectorAll('input[name="pregnancy"]');
    
    if (gender === 'male' || !gender) {
        section.style.display = 'none';
        // 取消选中怀孕/哺乳期相关选项
        pregnancyInputs.forEach(radio => {
            radio.checked = false;
            radio.removeAttribute('required');
        });
    } else if (gender === 'female') {
        section.style.display = 'block';
        // 为女性用户添加必填要求
        pregnancyInputs.forEach(radio => {
            radio.setAttribute('required', 'required');
        });
    }
}

// 提交问卷并跳转到场景建议页面
function submitQuestionnaire() {
    // 检查必填项
    const form = document.getElementById('healthQuestionnaire');
    if (!form) return;
    
    const gender = form.querySelector('input[name="gender"]:checked');
    
    if (!gender) {
        showQuestionnaireMessage('请至少填写基本信息和健康状况', 'error');
        return;
    }
    
    // 只有女性用户需要填写怀孕/哺乳期信息
    if (gender.value === 'female') {
        const pregnancy = form.querySelector('input[name="pregnancy"]:checked');
        if (!pregnancy) {
            showQuestionnaireMessage('请填写是否怀孕或哺乳期', 'error');
            return;
        }
    }
    
    // 检查是否选择了使用方式
    const usage = form.querySelectorAll('input[name="usage"]:checked');
    if (usage.length === 0) {
        showQuestionnaireMessage('请至少选择一种使用方式', 'error');
        return;
    }
    
    // 尝试保存问卷（但不阻止跳转，即使未登录也可以查看建议）
    try {
        const formData = new FormData(form);
        const data = {
            timestamp: new Date().toISOString(),
            age: formData.get('age') || null,
            gender: formData.get('gender') || null,
            pregnancy: formData.get('pregnancy') || null,
            circulation: formData.getAll('circulation'),
            sleep: formData.getAll('sleep'),
            digestive: formData.getAll('digestive'),
            gynecological: formData.getAll('gynecological'),
            constitution: formData.getAll('constitution'),
            other: formData.getAll('other'),
            caution: formData.getAll('caution'),
            fragrance: formData.getAll('fragrance'),
            usage: formData.getAll('usage')
        };
        
        // 如果用户已登录，保存到用户账户
        const isLoggedIn = typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn();
        if (isLoggedIn) {
            const storageKey = getUserQuestionnaireKey();
            data.userId = window.authSystem.getCurrentUser().id;
            data.userEmail = window.authSystem.getCurrentUser().email;
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
        
        // 同时保存到全局key（供未登录用户使用）
        localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(data));
        showQuestionnaireMessage('✓ 问卷数据已保存', 'success');
    } catch (error) {
        console.error('Save error:', error);
        // 即使保存失败也继续跳转
    }
    
    // 延迟跳转，让用户看到保存消息
    setTimeout(() => {
        window.location.href = 'scenario-suggestions.html';
    }, 500);
}

// 获取问卷数据（供其他页面使用，优先从用户账户加载）
function getQuestionnaireData(profileId = null) {
    try {
        // 如果指定了档案ID，加载该档案
        if (profileId) {
            return loadUserProfile(profileId);
        }
        
        // 优先从用户账户加载（最新档案或默认档案）
        const profiles = getUserProfiles();
        if (profiles && profiles.length > 0) {
            // 创建副本以避免修改原数组，返回最新的档案
            const sorted = [...profiles].sort((a, b) => {
                const dateA = new Date(a.updatedAt || 0);
                const dateB = new Date(b.updatedAt || 0);
                return dateB - dateA;
            });
            const latestProfile = sorted[0];
            return latestProfile && latestProfile.data ? latestProfile.data : null;
        }
        
        // 向后兼容：尝试加载旧的单档案格式
        const storageKey = getUserQuestionnaireKey();
        let saved = localStorage.getItem(storageKey);
        
        // 如果用户未登录或没有用户数据，尝试加载全局数据（向后兼容）
        if (!saved) {
            saved = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
        }
        
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Get questionnaire error:', error);
        return null;
    }
}

// 处理"none"选项与其他选项的互斥逻辑
function setupMutuallyExclusiveCheckboxes() {
    const form = document.getElementById('healthQuestionnaire');
    if (!form) return;
    
    // 定义有"none"选项的checkbox组
    const groupsWithNone = ['circulation', 'sleep', 'digestive', 'gynecological', 'constitution', 'caution', 'fragrance'];
    
    groupsWithNone.forEach(groupName => {
        const noneCheckbox = form.querySelector(`input[name="${groupName}"][value="none"]`);
        const otherCheckboxes = form.querySelectorAll(`input[name="${groupName}"]:not([value="none"])`);
        
        if (!noneCheckbox) return;
        
        // 当选择"none"时，取消选择其他选项
        noneCheckbox.addEventListener('change', function() {
            if (this.checked) {
                otherCheckboxes.forEach(cb => cb.checked = false);
            }
        });
        
        // 当选择其他选项时，取消选择"none"
        otherCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    noneCheckbox.checked = false;
                }
            });
        });
    });
}

// 页面加载时
document.addEventListener('DOMContentLoaded', function() {
    // 监听表单变化，更新进度
    const form = document.getElementById('healthQuestionnaire');
    if (form) {
        form.addEventListener('change', updateProgress);
        form.addEventListener('input', updateProgress);
        
        // 设置"none"选项与其他选项的互斥逻辑
        setupMutuallyExclusiveCheckboxes();
        
        // 监听性别变化，显示/隐藏妇科部分和怀孕/哺乳期部分
        form.querySelectorAll('input[name="gender"]').forEach(radio => {
            radio.addEventListener('change', function() {
                toggleGynecologicalSection(this.value);
                togglePregnancySection(this.value);
            });
        });
        
        // 尝试加载已保存的数据
        const saved = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.gender) {
                    toggleGynecologicalSection(data.gender);
                    togglePregnancySection(data.gender);
                }
            } catch (e) {
                // Ignore
            }
        }
        
        // 初始化：根据当前选中的性别显示/隐藏相关部分
        const currentGender = form.querySelector('input[name="gender"]:checked');
        if (currentGender) {
            toggleGynecologicalSection(currentGender.value);
            togglePregnancySection(currentGender.value);
        } else {
            // 默认隐藏（等待用户选择性别）
            toggleGynecologicalSection(null);
            togglePregnancySection(null);
        }
        
        updateProgress();
    }
});

