// DOM 操作优化工具
// 提供高效的 DOM 操作方法，减少重排和重绘

// DOM 查询缓存
const domCache = new Map();

/**
 * 缓存 DOM 查询结果
 * @param {string} selector - CSS 选择器或 ID
 * @param {boolean} useQuerySelector - 是否使用 querySelector（默认使用 getElementById）
 * @returns {HTMLElement|null}
 */
function getCachedElement(selector, useQuerySelector = false) {
    const cacheKey = `${selector}_${useQuerySelector}`;
    
    if (domCache.has(cacheKey)) {
        const cached = domCache.get(cacheKey);
        // 验证元素是否仍在 DOM 中
        if (cached && document.contains(cached)) {
            return cached;
        } else {
            domCache.delete(cacheKey);
        }
    }
    
    const element = useQuerySelector 
        ? document.querySelector(selector)
        : document.getElementById(selector);
    
    if (element) {
        domCache.set(cacheKey, element);
    }
    
    return element;
}

/**
 * 清除 DOM 缓存
 * @param {string} selector - 可选，清除特定选择器的缓存
 */
function clearDomCache(selector = null) {
    if (selector) {
        const keys = Array.from(domCache.keys()).filter(key => key.startsWith(selector));
        keys.forEach(key => domCache.delete(key));
    } else {
        domCache.clear();
    }
}

/**
 * 使用 DocumentFragment 批量插入元素
 * @param {HTMLElement} container - 容器元素
 * @param {Array<HTMLElement|string>} elements - 要插入的元素数组或 HTML 字符串数组
 * @param {boolean} clearFirst - 是否先清空容器
 */
function batchAppend(container, elements, clearFirst = false) {
    if (!container) return;
    
    const fragment = document.createDocumentFragment();
    
    elements.forEach(element => {
        if (typeof element === 'string') {
            // 如果是字符串，创建临时容器解析
            const temp = document.createElement('div');
            temp.innerHTML = element;
            while (temp.firstChild) {
                fragment.appendChild(temp.firstChild);
            }
        } else if (element instanceof HTMLElement) {
            fragment.appendChild(element);
        }
    });
    
    if (clearFirst) {
        container.innerHTML = '';
    }
    
    container.appendChild(fragment);
}

/**
 * 安全地设置 innerHTML（使用 DocumentFragment）
 * @param {HTMLElement} element - 目标元素
 * @param {string} html - HTML 字符串
 */
function setHTML(element, html) {
    if (!element) return;
    
    // 对于简单内容，直接使用 innerHTML 更快
    // 对于复杂内容，使用 DocumentFragment
    if (html.includes('<') && html.split('<').length > 10) {
        // 复杂 HTML，使用 DocumentFragment
        const fragment = document.createDocumentFragment();
        const temp = document.createElement('div');
        temp.innerHTML = html;
        while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
        }
        element.innerHTML = '';
        element.appendChild(fragment);
    } else {
        // 简单 HTML，直接使用 innerHTML
        element.innerHTML = html;
    }
}

/**
 * 创建元素（带属性和子元素）
 * @param {string} tag - 标签名
 * @param {Object} attributes - 属性对象
 * @param {Array<HTMLElement|string>} children - 子元素数组
 * @returns {HTMLElement}
 */
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'style' && typeof value === 'string') {
            element.style.cssText = value;
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else {
            element[key] = value;
        }
    });
    
    // 添加子元素
    if (children.length > 0) {
        batchAppend(element, children);
    }
    
    return element;
}

/**
 * 批量创建元素
 * @param {Array<Object>} configs - 元素配置数组
 * @returns {DocumentFragment}
 */
function createElementsBatch(configs) {
    const fragment = document.createDocumentFragment();
    
    configs.forEach(config => {
        const element = createElement(
            config.tag || 'div',
            config.attributes || {},
            config.children || []
        );
        fragment.appendChild(element);
    });
    
    return fragment;
}

/**
 * 使用 requestAnimationFrame 优化 DOM 更新
 * @param {Function} callback - 回调函数
 * @returns {Promise}
 */
function rafUpdate(callback) {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            callback();
            requestAnimationFrame(resolve);
        });
    });
}

/**
 * 防抖函数（用于优化频繁的 DOM 操作）
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function}
 */
function debounce(func, wait = 100) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数（用于优化频繁的 DOM 操作）
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function}
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 批量更新 DOM（使用 DocumentFragment 和 requestAnimationFrame）
 * @param {HTMLElement} container - 容器元素
 * @param {Function} renderFn - 渲染函数，返回元素数组或 HTML 字符串数组
 * @param {boolean} clearFirst - 是否先清空容器
 */
async function batchUpdate(container, renderFn, clearFirst = true) {
    if (!container) return;
    
    return rafUpdate(() => {
        const elements = renderFn();
        batchAppend(container, elements, clearFirst);
    });
}

/**
 * 替换元素内容（优化版本）
 * @param {HTMLElement} oldElement - 旧元素
 * @param {HTMLElement|string} newContent - 新内容（元素或 HTML 字符串）
 */
function replaceElement(oldElement, newContent) {
    if (!oldElement || !oldElement.parentNode) return;
    
    if (typeof newContent === 'string') {
        const temp = document.createElement('div');
        temp.innerHTML = newContent;
        const newElement = temp.firstElementChild;
        if (newElement) {
            oldElement.parentNode.replaceChild(newElement, oldElement);
        }
    } else if (newContent instanceof HTMLElement) {
        oldElement.parentNode.replaceChild(newContent, oldElement);
    }
}

// 导出到全局（如果使用模块系统，可以改为 export）
if (typeof window !== 'undefined') {
    window.DOMUtils = {
        getCachedElement,
        clearDomCache,
        batchAppend,
        setHTML,
        createElement,
        createElementsBatch,
        rafUpdate,
        debounce,
        throttle,
        batchUpdate,
        replaceElement
    };
}

