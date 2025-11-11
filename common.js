// 固定导航栏 - 始终显示，滚动时增强阴影
const fixedNav = document.getElementById('fixedNav');

if (fixedNav) {
    // 确保导航栏在页面加载时就是可见的
    fixedNav.classList.add('visible');
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 滚动时增强阴影效果
        if (scrollTop > 50) {
            fixedNav.classList.add('scrolled');
        } else {
            fixedNav.classList.remove('scrolled');
        }
        
        // 返回顶部按钮
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            if (scrollTop > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    });
    
    // 页面加载时检查是否需要添加scrolled类
    if (window.pageYOffset > 50) {
        fixedNav.classList.add('scrolled');
    }
}

// 返回顶部功能
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 移动端菜单切换
const menuToggle = document.getElementById('menuToggle');
if (menuToggle) {
    menuToggle.addEventListener('click', function() {
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            const isActive = navMenu.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive);
        }
    });
}

// 点击导航链接后关闭移动端菜单
document.querySelectorAll('#navMenu a').forEach(link => {
    link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            const navMenu = document.getElementById('navMenu');
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        }
    });
});

// 页面加载完成后添加淡入动画
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 为主要内容块添加观察
    document.querySelectorAll('.oil-card, .formula-box, .dosage-card, .feature-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Set active navigation link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#navMenu a').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
    
    // Ensure navigation is always visible on page load
    const nav = document.getElementById('fixedNav');
    if (nav) {
        nav.classList.add('visible');
    }
});

