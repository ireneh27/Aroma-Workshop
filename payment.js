// 支付处理逻辑

// 从URL参数获取支付信息
function getPaymentParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        type: urlParams.get('type') || 'ai',
        amount: parseInt(urlParams.get('amount')) || 10,
        price: parseFloat(urlParams.get('price')) || 5.00
    };
}

// 初始化支付页面
function initPaymentPage() {
    const params = getPaymentParams();
    
    // 更新页面显示
    if (params.type === 'ai') {
        document.getElementById('productName').textContent = 'AI查询次数';
        document.getElementById('productAmount').textContent = `${params.amount}次`;
        document.getElementById('productPrice').textContent = `¥${params.price.toFixed(2)}`;
    }
    
    // 检查用户登录状态
    if (typeof window !== 'undefined' && window.authSystem) {
        if (!window.authSystem.isUserLoggedIn()) {
            showPaymentStatus('请先登录后再进行支付', 'error');
            document.getElementById('wechatPayBtn').disabled = true;
            return;
        }
    }
}

// 显示支付状态
function showPaymentStatus(message, type = 'processing') {
    const statusEl = document.getElementById('paymentStatus');
    statusEl.style.display = 'block';
    statusEl.className = `payment-status ${type}`;
    statusEl.innerHTML = `
        <h3>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⏳'} ${message}</h3>
    `;
}

// 隐藏支付状态
function hidePaymentStatus() {
    document.getElementById('paymentStatus').style.display = 'none';
}

// 初始化微信支付
async function initiateWeChatPay() {
    const params = getPaymentParams();
    const btn = document.getElementById('wechatPayBtn');
    
    // 检查用户登录
    if (typeof window === 'undefined' || !window.authSystem || !window.authSystem.isUserLoggedIn()) {
        showPaymentStatus('请先登录后再进行支付', 'error');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span><span>处理中...</span>';
    
    try {
        // 生成订单号
        const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // 开发模式：直接模拟支付成功（用于测试）
        const DEV_MODE = true; // 设置为false以使用真实微信支付
        
        if (DEV_MODE) {
            // 开发模式：模拟支付流程
            showPaymentStatus('模拟支付中...', 'processing');
            setTimeout(() => {
                handlePaymentSuccess(orderId, params);
            }, 2000);
            return;
        }
        
        // 生产模式：真实的微信支付流程
        // 检测设备类型
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // 移动端：调用微信支付JSAPI
            await initiateMobileWeChatPay(orderId, params);
        } else {
            // PC端：显示二维码
            await initiatePCWeChatPay(orderId, params);
        }
    } catch (error) {
        console.error('Payment error:', error);
        showPaymentStatus('支付失败：' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<span>确认支付 ¥' + params.price.toFixed(2) + '</span>';
    }
}

// 移动端微信支付（JSAPI）
async function initiateMobileWeChatPay(orderId, params) {
    // 注意：实际生产环境需要调用服务器端API生成支付参数
    // 这里提供一个模拟实现
    
    showPaymentStatus('正在调起微信支付...', 'processing');
    
    // 模拟调用服务器API获取支付参数
    // 实际应该调用：const payParams = await fetch('/api/wechat/pay', { method: 'POST', body: JSON.stringify({ orderId, amount: params.price }) })
    
    // 模拟支付参数
    const mockPayParams = {
        appId: 'YOUR_WECHAT_APP_ID',
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        nonceStr: Math.random().toString(36).substr(2, 15),
        package: 'prepay_id=mock_prepay_id',
        signType: 'RSA',
        paySign: 'mock_sign'
    };
    
    // 调用微信支付
    // 注意：实际需要使用微信JS-SDK
    // WeixinJSBridge.invoke('getBrandWCPayRequest', mockPayParams, function(res) { ... });
    
    // 模拟支付流程（实际应该等待微信支付回调）
    setTimeout(() => {
        // 模拟支付成功
        handlePaymentSuccess(orderId, params);
    }, 2000);
}

// PC端微信支付（二维码）
async function initiatePCWeChatPay(orderId, params) {
    // 注意：实际生产环境需要调用服务器端API生成支付二维码
    // 这里提供一个模拟实现
    
    showPaymentStatus('正在生成支付二维码...', 'processing');
    
    // 隐藏支付按钮，显示二维码
    document.getElementById('wechatPayBtn').style.display = 'none';
    document.getElementById('qrPayment').style.display = 'block';
    
    // 模拟生成二维码
    // 实际应该调用：const qrCodeUrl = await fetch('/api/wechat/qrcode', { method: 'POST', body: JSON.stringify({ orderId, amount: params.price }) })
    
    // 模拟二维码URL
    const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(`wechat://pay?orderId=${orderId}`);
    
    // 显示二维码（实际应该使用二维码库生成）
    document.getElementById('qrCode').innerHTML = `<img src="${qrCodeUrl}" alt="支付二维码" style="width: 100%; height: 100%; object-fit: contain;">`;
    
    // 开始轮询支付状态
    startPaymentPolling(orderId, params);
}

// 轮询支付状态（PC端）
function startPaymentPolling(orderId, params) {
    let pollCount = 0;
    const maxPolls = 60; // 最多轮询60次（5分钟）
    
    const pollInterval = setInterval(async () => {
        pollCount++;
        
        // 模拟检查支付状态
        // 实际应该调用：const status = await fetch(`/api/wechat/payment-status?orderId=${orderId}`)
        
        // 模拟支付成功（实际应该根据服务器返回的状态判断）
        if (pollCount >= 3) { // 模拟3次轮询后支付成功
            clearInterval(pollInterval);
            handlePaymentSuccess(orderId, params);
        }
        
        if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            showPaymentStatus('支付超时，请重新发起支付', 'error');
            document.getElementById('wechatPayBtn').style.display = 'block';
            document.getElementById('qrPayment').style.display = 'none';
        }
    }, 5000); // 每5秒轮询一次
}

// 处理支付成功
function handlePaymentSuccess(orderId, params) {
    hidePaymentStatus();
    
    // 调用auth系统处理支付成功
    if (typeof window !== 'undefined' && window.authSystem) {
        const result = window.authSystem.handlePaymentSuccess(orderId, params.type, params.amount);
        
        if (result.success) {
            showPaymentStatus(result.message, 'success');
            
            // 3秒后跳转
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showPaymentStatus(result.message, 'error');
        }
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initPaymentPage();
});

