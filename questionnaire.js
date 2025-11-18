// 问卷数据管理 - 支持用户关联
const QUESTIONNAIRE_STORAGE_KEY = 'healthQuestionnaireData'; // 向后兼容的全局key
const USER_QUESTIONNAIRE_PREFIX = 'user_questionnaire_'; // 用户特定的key前缀

// 获取当前用户的问卷数据存储key
function getUserQuestionnaireKey() {
    if (typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn()) {
        const user = window.authSystem.getCurrentUser();
        if (user) {
            return `${USER_QUESTIONNAIRE_PREFIX}${user.id}`;
        }
    }
    return QUESTIONNAIRE_STORAGE_KEY; // 未登录用户使用全局key
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

// 保存问卷数据（关联到当前用户）
function saveQuestionnaire() {
    const form = document.getElementById('healthQuestionnaire');
    if (!form) return;
    
    // 检查用户登录状态
    const isLoggedIn = typeof window !== 'undefined' && window.authSystem && window.authSystem.isUserLoggedIn();
    if (!isLoggedIn) {
        showQuestionnaireMessage('请先登录以保存您的健康档案', 'error');
        return;
    }
    
    // 检查是否可以保存问卷答案（免费用户只能保存2个）
    if (typeof window.authSystem !== 'undefined' && window.authSystem.canSaveQuestionnaire) {
        const canSave = window.authSystem.canSaveQuestionnaire();
        if (!canSave) {
            const limits = window.authSystem.getUserLimits();
            const currentCount = window.authSystem.getUserQuestionnaireCount();
            const isPremium = window.authSystem.isPremiumMember();
            if (!isPremium) {
                showQuestionnaireMessage(`免费用户只能保存${limits.maxQuestionnaires}个问卷答案。您当前已有${currentCount}个。升级为付费会员可保存无限问卷。`, 'error');
                // 可以选择跳转到支付页面
                if (confirm('是否升级为付费会员以保存无限问卷答案？')) {
                    window.location.href = 'payment.html?type=premium';
                }
                return;
            }
        }
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
    
    try {
        const storageKey = getUserQuestionnaireKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
        
        // 同时保存到全局key（向后兼容）
        localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(data));
        
        showQuestionnaireMessage('✓ 问卷数据已保存到您的账户', 'success');
        updateProgress();
    } catch (error) {
        showQuestionnaireMessage('保存失败，请检查浏览器设置', 'error');
        console.error('Save error:', error);
    }
}

// 加载问卷数据（从当前用户的存储中加载）
function loadQuestionnaire() {
    try {
        const storageKey = getUserQuestionnaireKey();
        let saved = localStorage.getItem(storageKey);
        
        // 如果用户未登录或没有用户数据，尝试加载全局数据（向后兼容）
        if (!saved) {
            saved = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
        }
        
        if (!saved) {
            showQuestionnaireMessage('未找到已保存的数据', 'error');
            return;
        }
        
        const data = JSON.parse(saved);
        const form = document.getElementById('healthQuestionnaire');
        if (!form) return;
        
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
        window.location.href = 'formulas.html';
    }, 500);
}

// 获取问卷数据（供其他页面使用，优先从用户账户加载）
function getQuestionnaireData() {
    try {
        // 优先从用户账户加载
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

