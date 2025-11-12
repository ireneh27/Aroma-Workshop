// 用户认证和AI查询次数管理系统
// 使用localStorage存储用户数据（生产环境建议使用后端数据库）

const AUTH_STORAGE_KEY = 'aromatherapy_users';
const CURRENT_USER_KEY = 'aromatherapy_current_user';
const AI_INQUIRY_LIMIT = 3; // 每个注册用户3次免费AI查询
const AI_PURCHASE_PRICE = 5; // 购买10次AI查询的价格（元）
const AI_PURCHASE_AMOUNT = 10; // 每次购买获得的AI查询次数

// 会员类型常量
const MEMBERSHIP_TYPE = {
    FREE: 'free',      // 免费用户
    PREMIUM: 'premium' // 付费会员
};

// 用户权限限制
const USER_LIMITS = {
    [MEMBERSHIP_TYPE.FREE]: {
        maxProfiles: 1,        // 最多1个信息档案
        maxRecipes: 10,        // 最多10个配方
        aiInquiriesLimit: 3    // 3次免费AI查询
    },
    [MEMBERSHIP_TYPE.PREMIUM]: {
        maxProfiles: Infinity, // 无限信息档案
        maxRecipes: Infinity,  // 无限配方
        aiInquiriesLimit: 30   // 30次AI查询（赠送）
    }
};

// 初始化用户存储
function initUserStorage() {
    if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({}));
    }
}

// 获取所有用户数据
function getAllUsers() {
    initUserStorage();
    const users = localStorage.getItem(AUTH_STORAGE_KEY);
    return users ? JSON.parse(users) : {};
}

// 保存用户数据
function saveAllUsers(users) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
}

// 注册新用户
function registerUser(email, password, name = '') {
    initUserStorage();
    const users = getAllUsers();
    
    // 检查邮箱是否已存在
    if (users[email]) {
        return {
            success: false,
            message: '该邮箱已被注册，请直接登录'
        };
    }
    
    // 创建新用户
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    users[email] = {
        id: userId,
        email: email,
        password: password, // 注意：实际应用中应该加密存储
        name: name || email.split('@')[0],
        registeredAt: new Date().toISOString(),
        membershipType: MEMBERSHIP_TYPE.FREE, // 默认免费用户
        aiInquiriesUsed: 0,
        aiInquiriesLimit: USER_LIMITS[MEMBERSHIP_TYPE.FREE].aiInquiriesLimit,
        lastLogin: new Date().toISOString(),
        loginType: 'email', // 'email' 或 'wechat'
        wechatOpenId: null,
        purchaseHistory: [] // 购买记录
    };
    
    saveAllUsers(users);
    
    // 自动登录
    setCurrentUser(email);
    
    return {
        success: true,
        message: '注册成功！您已获得3次免费AI查询机会',
        user: users[email]
    };
}

// 用户登录
function loginUser(email, password) {
    initUserStorage();
    const users = getAllUsers();
    
    if (!users[email]) {
        return {
            success: false,
            message: '邮箱未注册，请先注册'
        };
    }
    
    if (users[email].password !== password) {
        return {
            success: false,
            message: '密码错误'
        };
    }
    
    // 更新最后登录时间
    users[email].lastLogin = new Date().toISOString();
    saveAllUsers(users);
    
    // 设置当前用户
    setCurrentUser(email);
    
    return {
        success: true,
        message: '登录成功',
        user: users[email]
    };
}

// 设置当前登录用户
function setCurrentUser(email) {
    localStorage.setItem(CURRENT_USER_KEY, email);
}

// 获取当前登录用户
function getCurrentUser() {
    const email = localStorage.getItem(CURRENT_USER_KEY);
    if (!email) return null;
    
    const users = getAllUsers();
    return users[email] || null;
}

// 用户登出
function logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
    return {
        success: true,
        message: '已登出'
    };
}

// 检查用户是否已登录
function isUserLoggedIn() {
    return getCurrentUser() !== null;
}

// 获取用户剩余AI查询次数
function getRemainingAIInquiries() {
    const user = getCurrentUser();
    if (!user) return 0;
    
    return Math.max(0, user.aiInquiriesLimit - user.aiInquiriesUsed);
}

// 检查是否可以执行AI查询
function canUseAIInquiry() {
    const user = getCurrentUser();
    if (!user) return false;
    
    return user.aiInquiriesUsed < user.aiInquiriesLimit;
}

// 使用一次AI查询
function useAIInquiry() {
    const user = getCurrentUser();
    if (!user) {
        return {
            success: false,
            message: '请先登录或注册'
        };
    }
    
    if (!canUseAIInquiry()) {
        return {
            success: false,
            message: '您的免费AI查询次数已用完',
            remaining: 0
        };
    }
    
    // 更新使用次数
    const users = getAllUsers();
    users[user.email].aiInquiriesUsed += 1;
    saveAllUsers(users);
    
    // 更新当前用户数据
    setCurrentUser(user.email);
    
    return {
        success: true,
        remaining: getRemainingAIInquiries(),
        message: `AI查询成功，剩余 ${getRemainingAIInquiries()} 次`
    };
}

// 获取用户信息（包括剩余次数）
function getUserInfo() {
    const user = getCurrentUser();
    if (!user) return null;
    
    return {
        ...user,
        remainingInquiries: getRemainingAIInquiries(),
        canUseAI: canUseAIInquiry()
    };
}

// 微信登录（需要服务器端OAuth支持）
// 注意：实际生产环境需要服务器端处理微信OAuth流程
async function loginWithWeChat() {
    // 微信登录流程：
    // 1. 跳转到微信授权页面（需要服务器端生成授权URL）
    // 2. 用户授权后，微信回调到服务器
    // 3. 服务器获取用户信息后，返回给前端
    
    const WECHAT_APP_ID = 'YOUR_WECHAT_APP_ID'; // 需要配置微信AppID
    const DEV_MODE = WECHAT_APP_ID === 'YOUR_WECHAT_APP_ID'; // 开发模式：AppID未配置时使用模拟登录
    
    if (DEV_MODE) {
        // 开发模式：模拟微信登录（用于测试）
        return handleWeChatCallback('dev_code_' + Date.now(), 'dev_state_' + Date.now());
    }
    
    // 生产模式：真实的微信OAuth流程
    const REDIRECT_URI = encodeURIComponent(window.location.origin + '/wechat-callback.html');
    const STATE = 'wechat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // 保存state用于验证回调
    sessionStorage.setItem('wechat_state', STATE);
    
    // 构建微信授权URL
    const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_APP_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=snsapi_login&state=${STATE}#wechat_redirect`;
    
    // 跳转到微信授权页面
    window.location.href = authUrl;
    
    // 注意：实际实现中，授权后会跳转到回调页面，在回调页面中处理登录逻辑
}

// 处理微信登录回调（在wechat-callback.html中调用）
function handleWeChatCallback(code, state) {
    // 验证state（开发模式跳过验证）
    const isDevMode = code && code.startsWith('dev_code_');
    if (!isDevMode) {
        const savedState = sessionStorage.getItem('wechat_state');
        if (state !== savedState) {
            return Promise.resolve({
                success: false,
                message: '授权验证失败'
            });
        }
    }
    
    // 这里应该调用服务器端API，通过code获取用户信息
    // 模拟实现：
    return new Promise((resolve) => {
        // 模拟API调用
        setTimeout(async () => {
            try {
                // 实际应该调用：const response = await fetch('/api/wechat/login', { method: 'POST', body: JSON.stringify({ code, state }) })
                // 服务器返回：{ openId, nickname, avatar, ... }
                
                // 开发模式：直接使用模拟数据
                // 生产模式：应该从服务器获取真实数据
                let mockWeChatUser;
                if (isDevMode) {
                    // 开发模式：使用模拟数据
                    mockWeChatUser = {
                        openId: 'wechat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        nickname: '微信用户' + Math.floor(Math.random() * 10000),
                        avatar: ''
                    };
                } else {
                    // 生产模式：应该调用服务器API
                    // const response = await fetch('/api/wechat/login', { method: 'POST', body: JSON.stringify({ code, state }) });
                    // const data = await response.json();
                    // mockWeChatUser = data;
                    
                    // 临时使用模拟数据（实际应该替换为API调用）
                    mockWeChatUser = {
                        openId: 'wechat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        nickname: '微信用户' + Math.floor(Math.random() * 10000),
                        avatar: ''
                    };
                }
                
                // 检查用户是否已存在
                initUserStorage();
                const users = getAllUsers();
                
                // 通过openId查找用户
                let existingUser = null;
                for (const email in users) {
                    if (users[email].wechatOpenId === mockWeChatUser.openId) {
                        existingUser = users[email];
                        break;
                    }
                }
                
                if (existingUser) {
                    // 用户已存在，直接登录
                    existingUser.lastLogin = new Date().toISOString();
                    saveAllUsers(users);
                    setCurrentUser(existingUser.email);
                    
                    resolve({
                        success: true,
                        message: '微信登录成功',
                        user: existingUser
                    });
                } else {
                    // 新用户，创建账户
                    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    const email = mockWeChatUser.openId + '@wechat.local'; // 使用openId作为唯一标识
                    
                    users[email] = {
                        id: userId,
                        email: email,
                        name: mockWeChatUser.nickname,
                        registeredAt: new Date().toISOString(),
                        membershipType: MEMBERSHIP_TYPE.FREE, // 默认免费用户
                        aiInquiriesUsed: 0,
                        aiInquiriesLimit: USER_LIMITS[MEMBERSHIP_TYPE.FREE].aiInquiriesLimit,
                        lastLogin: new Date().toISOString(),
                        loginType: 'wechat',
                        wechatOpenId: mockWeChatUser.openId,
                        wechatNickname: mockWeChatUser.nickname,
                        wechatAvatar: mockWeChatUser.avatar,
                        purchaseHistory: []
                    };
                    
                    saveAllUsers(users);
                    setCurrentUser(email);
                    
                    resolve({
                        success: true,
                        message: '微信注册成功！您已获得3次免费AI查询机会',
                        user: users[email]
                    });
                }
            } catch (error) {
                resolve({
                    success: false,
                    message: '微信登录失败：' + error.message
                });
            }
        }, 500);
    });
}

// 购买AI查询次数
async function purchaseAIInquiries() {
    const user = getCurrentUser();
    if (!user) {
        return {
            success: false,
            message: '请先登录'
        };
    }
    
    // 跳转到支付页面
    window.location.href = `payment.html?type=ai&amount=${AI_PURCHASE_AMOUNT}&price=${AI_PURCHASE_PRICE}`;
}

// ==================== 用户收藏和使用历史管理 ====================

// 获取用户收藏的配方ID列表
function getUserFavorites() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const favoritesKey = `user_favorites_${user.id}`;
    try {
        const favorites = localStorage.getItem(favoritesKey);
        return favorites ? JSON.parse(favorites) : [];
    } catch (e) {
        console.error('Error loading favorites:', e);
        return [];
    }
}

// 添加配方到收藏
function addToFavorites(formulaId) {
    const user = getCurrentUser();
    if (!user) {
        return {
            success: false,
            message: '请先登录'
        };
    }
    
    const favorites = getUserFavorites();
    if (favorites.includes(formulaId)) {
        return {
            success: false,
            message: '该配方已在收藏中'
        };
    }
    
    favorites.push(formulaId);
    const favoritesKey = `user_favorites_${user.id}`;
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    
    return {
        success: true,
        message: '已添加到收藏'
    };
}

// 从收藏中移除配方
function removeFromFavorites(formulaId) {
    const user = getCurrentUser();
    if (!user) {
        return {
            success: false,
            message: '请先登录'
        };
    }
    
    const favorites = getUserFavorites();
    const index = favorites.indexOf(formulaId);
    if (index === -1) {
        return {
            success: false,
            message: '该配方不在收藏中'
        };
    }
    
    favorites.splice(index, 1);
    const favoritesKey = `user_favorites_${user.id}`;
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    
    return {
        success: true,
        message: '已从收藏中移除'
    };
}

// 检查配方是否已收藏
function isFavorite(formulaId) {
    const favorites = getUserFavorites();
    return favorites.includes(formulaId);
}

// 获取用户使用历史（最近查看的配方）
function getUserHistory(maxItems = 20) {
    const user = getCurrentUser();
    if (!user) return [];
    
    const historyKey = `user_history_${user.id}`;
    try {
        const history = localStorage.getItem(historyKey);
        return history ? JSON.parse(history) : [];
    } catch (e) {
        console.error('Error loading history:', e);
        return [];
    }
}

// 添加到使用历史
function addToHistory(formulaId, formulaName = '') {
    const user = getCurrentUser();
    if (!user) return;
    
    const history = getUserHistory();
    
    // 移除已存在的相同配方（避免重复）
    const existingIndex = history.findIndex(item => item.id === formulaId);
    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }
    
    // 添加到开头
    history.unshift({
        id: formulaId,
        name: formulaName,
        timestamp: new Date().toISOString()
    });
    
    // 限制历史记录数量
    const maxItems = 20;
    if (history.length > maxItems) {
        history.splice(maxItems);
    }
    
    const historyKey = `user_history_${user.id}`;
    localStorage.setItem(historyKey, JSON.stringify(history));
}

// 清空使用历史
function clearHistory() {
    const user = getCurrentUser();
    if (!user) {
        return {
            success: false,
            message: '请先登录'
        };
    }
    
    const historyKey = `user_history_${user.id}`;
    localStorage.removeItem(historyKey);
    
    return {
        success: true,
        message: '历史记录已清空'
    };
}

// 获取用户统计信息
function getUserStatistics() {
    const user = getCurrentUser();
    if (!user) {
        return {
            totalFavorites: 0,
            totalHistory: 0,
            totalAIInquiries: 0,
            remainingAIInquiries: 0
        };
    }
    
    const favorites = getUserFavorites();
    const history = getUserHistory();
    
    return {
        totalFavorites: favorites.length,
        totalHistory: history.length,
        totalAIInquiries: user.aiInquiriesUsed || 0,
        remainingAIInquiries: getRemainingAIInquiries()
    };
}

// 检查用户会员类型
function getUserMembershipType() {
    const user = getCurrentUser();
    if (!user) return MEMBERSHIP_TYPE.FREE;
    return user.membershipType || MEMBERSHIP_TYPE.FREE;
}

// 检查用户是否为付费会员
function isPremiumMember() {
    return getUserMembershipType() === MEMBERSHIP_TYPE.PREMIUM;
}

// 获取用户权限限制
function getUserLimits() {
    const membershipType = getUserMembershipType();
    return USER_LIMITS[membershipType] || USER_LIMITS[MEMBERSHIP_TYPE.FREE];
}

// 检查是否可以创建新的信息档案
function canCreateProfile() {
    const limits = getUserLimits();
    if (limits.maxProfiles === Infinity) return true;
    
    // 统计当前用户的信息档案数量
    const user = getCurrentUser();
    if (!user) return false;
    
    const profileKey = `user_questionnaire_${user.id}`;
    // 检查是否有已保存的档案
    const existingProfile = localStorage.getItem(profileKey);
    if (existingProfile) {
        return limits.maxProfiles > 1; // 如果已有1个，且限制是1，则不能再创建
    }
    
    return true;
}

// 检查是否可以创建新配方
function canCreateRecipe() {
    const limits = getUserLimits();
    if (limits.maxRecipes === Infinity) return true;
    
    // 统计当前用户的配方数量
    let recipeCount = 0;
    if (typeof UnifiedDataManager !== 'undefined') {
        const allRecipes = UnifiedDataManager.getAllRecipes();
        const user = getCurrentUser();
        if (user) {
            recipeCount = allRecipes.filter(r => r.userId === user.id).length;
        }
    } else if (typeof RecipeDB !== 'undefined') {
        const allRecipes = RecipeDB.loadRecipes();
        recipeCount = allRecipes.length; // 简化：统计所有配方
    }
    
    return recipeCount < limits.maxRecipes;
}

// 获取当前用户的配方数量
function getUserRecipeCount() {
    let recipeCount = 0;
    if (typeof UnifiedDataManager !== 'undefined') {
        const allRecipes = UnifiedDataManager.getAllRecipes();
        const user = getCurrentUser();
        if (user) {
            recipeCount = allRecipes.filter(r => r.userId === user.id).length;
        }
    } else if (typeof RecipeDB !== 'undefined') {
        const allRecipes = RecipeDB.loadRecipes();
        recipeCount = allRecipes.length;
    }
    return recipeCount;
}

// 升级为付费会员（处理支付成功回调）
function upgradeToPremium(orderId) {
    const user = getCurrentUser();
    if (!user) {
        return {
            success: false,
            message: '用户未登录'
        };
    }
    
    const users = getAllUsers();
    users[user.email].membershipType = MEMBERSHIP_TYPE.PREMIUM;
    users[user.email].aiInquiriesLimit = USER_LIMITS[MEMBERSHIP_TYPE.PREMIUM].aiInquiriesLimit;
    users[user.email].aiInquiriesUsed = 0; // 重置使用次数
    
    // 记录购买历史
    users[user.email].purchaseHistory.push({
        orderId: orderId,
        type: 'premium_membership',
        purchaseTime: new Date().toISOString()
    });
    
    saveAllUsers(users);
    setCurrentUser(user.email);
    
    return {
        success: true,
        message: '升级成功！您现在是付费会员，享受无限配方和30次AI查询',
        user: users[user.email]
    };
}

// 处理支付成功回调（在支付成功后调用）
function handlePaymentSuccess(orderId, paymentType, amount) {
    const user = getCurrentUser();
    if (!user) {
        return {
            success: false,
            message: '用户未登录'
        };
    }
    
    if (paymentType === 'premium') {
        // 升级为付费会员
        return upgradeToPremium(orderId);
    }
    
    if (paymentType === 'ai') {
        // 增加AI查询次数
        const users = getAllUsers();
        users[user.email].aiInquiriesLimit += amount;
        
        // 记录购买历史
        users[user.email].purchaseHistory.push({
            orderId: orderId,
            type: 'ai_inquiries',
            amount: amount,
            price: AI_PURCHASE_PRICE,
            purchaseTime: new Date().toISOString()
        });
        
        saveAllUsers(users);
        setCurrentUser(user.email);
        
        return {
            success: true,
            message: `购买成功！您已获得 ${amount} 次AI查询机会`,
            remaining: getRemainingAIInquiries()
        };
    }
    
    return {
        success: false,
        message: '未知的支付类型'
    };
}

// 导出函数
if (typeof window !== 'undefined') {
    window.authSystem = {
        registerUser,
        loginUser,
        logoutUser,
        getCurrentUser,
        isUserLoggedIn,
        getRemainingAIInquiries,
        canUseAIInquiry,
        useAIInquiry,
        getUserInfo,
        loginWithWeChat,
        handleWeChatCallback,
        purchaseAIInquiries,
        handlePaymentSuccess,
        // 收藏功能
        getUserFavorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        // 使用历史
        getUserHistory,
        addToHistory,
        clearHistory,
        // 统计信息
        getUserStatistics,
        // 会员功能
        getUserMembershipType,
        isPremiumMember,
        getUserLimits,
        canCreateProfile,
        canCreateRecipe,
        getUserRecipeCount,
        upgradeToPremium,
        // 常量
        MEMBERSHIP_TYPE,
        USER_LIMITS,
        AI_INQUIRY_LIMIT,
        AI_PURCHASE_PRICE,
        AI_PURCHASE_AMOUNT
    };
}

