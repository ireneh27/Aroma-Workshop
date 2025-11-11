// 通用导航栏登录状态更新脚本
// 在所有页面加载此脚本以显示登录状态

function updateNavAuthStatus() {
    if (typeof window.authSystem === 'undefined') return;
    
    const navLoginLink = document.getElementById('navLoginLink');
    const navUserInfo = document.getElementById('navUserInfo');
    
    if (window.authSystem.isUserLoggedIn()) {
        const userInfo = window.authSystem.getUserInfo();
        if (navLoginLink) navLoginLink.style.display = 'none';
        if (navUserInfo) {
            navUserInfo.style.display = 'inline-block';
            navUserInfo.innerHTML = `👤 ${userInfo.name || userInfo.email} (剩余${userInfo.remainingInquiries}次)`;
        }
    } else {
        if (navLoginLink) navLoginLink.style.display = 'inline-block';
        if (navUserInfo) navUserInfo.style.display = 'none';
    }
}

// 页面加载时更新
document.addEventListener('DOMContentLoaded', function() {
    updateNavAuthStatus();
    // 定期检查状态变化（如果从登录页面返回）
    setInterval(updateNavAuthStatus, 2000);
});

