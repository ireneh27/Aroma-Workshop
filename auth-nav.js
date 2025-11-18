// 通用导航栏登录状态更新脚本
// 在所有页面加载此脚本以显示登录状态
// 确保登录前后导航栏布局保持一致，只有一行

function updateNavAuthStatus() {
    if (typeof window.authSystem === 'undefined') return;
    
    const navLoginLink = document.getElementById('navLoginLink');
    const navUserInfo = document.getElementById('navUserInfo');

    if (window.authSystem.isUserLoggedIn()) {
        const userInfo = window.authSystem.getUserInfo();
        // 隐藏登录链接，显示用户信息
        if (navLoginLink) {
            navLoginLink.style.display = 'none';
        }
        if (navUserInfo) {
            navUserInfo.style.display = 'inline-flex';
            // 简化显示内容，保持紧凑，只显示用户名
            const displayName = userInfo.name || (userInfo.email ? userInfo.email.split('@')[0] : '用户');
            navUserInfo.innerHTML = `<span style="white-space: nowrap;">👤 ${displayName}</span>`;
            navUserInfo.title = `${userInfo.name || userInfo.email} (剩余${userInfo.remainingInquiries}次AI查询)`;
        }
    } else {
        // 显示登录链接，隐藏用户信息
        if (navLoginLink) {
            navLoginLink.style.display = 'inline-block';
        }
        if (navUserInfo) {
            navUserInfo.style.display = 'none';
        }
    }
}

// 页面加载时更新
document.addEventListener('DOMContentLoaded', function() {
    updateNavAuthStatus();
    // 定期检查状态变化（如果从登录页面返回）
    setInterval(updateNavAuthStatus, 2000);
});

