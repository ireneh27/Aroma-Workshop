# 本地测试指南

本指南将帮助您在本地测试芳疗方案网站，特别是场景建议功能。

## 🚀 快速开始

### 方法1: 使用 Python 内置服务器（推荐）

1. **打开终端**，进入项目目录：
```bash
cd /Users/ireneh/Downloads/aromatherapy
```

2. **启动本地服务器**：

   **Python 3:**
   ```bash
   python3 -m http.server 8000
   ```

   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```

3. **在浏览器中打开**：
   ```
   http://localhost:8000
   ```

### 方法2: 使用 Node.js http-server

1. **安装 http-server**（如果还没有）：
```bash
npm install -g http-server
```

2. **启动服务器**：
```bash
cd /Users/ireneh/Downloads/aromatherapy
http-server -p 8000
```

3. **在浏览器中打开**：
   ```
   http://localhost:8000
   ```

### 方法3: 使用 VS Code Live Server

1. 在 VS Code 中安装 "Live Server" 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

## 📋 测试流程

### 步骤1: 检查基础功能

1. **打开首页** (`http://localhost:8000/index.html`)
   - 检查页面是否正常加载
   - 检查导航栏是否正常显示

2. **检查脚本加载**
   - 打开浏览器开发者工具（F12 或 Cmd+Option+I）
   - 查看 Console 标签页，确认没有错误
   - 检查 Network 标签页，确认所有 JS 文件都成功加载

### 步骤2: 测试问卷功能

1. **填写健康状况问卷**
   - 访问 `http://localhost:8000/health-profile.html`
   - 填写基本信息（性别、年龄、孕期状态）
   - 选择至少一种症状
   - **重要**: 选择至少一种使用方式（护手霜、身体乳、泡脚/泡澡、扩香、喷雾）
   - 点击"保存"按钮

2. **验证数据保存**
   - 打开浏览器开发者工具
   - 进入 Application/Storage 标签页
   - 查看 Local Storage
   - 确认 `healthQuestionnaireData` 键存在并有数据

### 步骤3: 测试场景建议功能

#### 3.1 未登录状态测试

1. **访问配方页面**
   - 打开 `http://localhost:8000/formulas.html`

2. **检查场景建议区域**
   - 应该看到"综合使用场景建议"标题
   - 应该看到登录提示："💡 登录后可获得AI智能场景建议"
   - 不应该看到错误信息

#### 3.2 登录状态测试

1. **注册/登录账户**
   - 访问 `http://localhost:8000/login.html`
   - 注册一个新账户或登录现有账户
   - 确认登录成功

2. **检查AI配置**
   - 打开 `ai-service.js`
   - 确认 `AI_CONFIG.provider` 不是 `'none'`
   - 确认已配置有效的 API Key（如果使用AI功能）

3. **测试场景建议生成**
   - 访问 `http://localhost:8000/formulas.html`
   - 等待场景建议加载（可能需要几秒钟）
   - 检查是否显示2个场景建议
   - 检查每个场景是否包含时间线
   - 检查配方卡片是否只显示精油tag
   - 点击配方卡片，确认能跳转到配方详情页

### 步骤4: 测试AI功能（如果已配置）

1. **检查AI配置**
   ```javascript
   // 在浏览器控制台运行
   console.log(AI_CONFIG.provider);
   console.log(AI_CONFIG.deepseek.apiKey ? 'API Key已配置' : 'API Key未配置');
   ```

2. **测试AI调用**
   - 打开浏览器开发者工具
   - 查看 Network 标签页
   - 访问 `formulas.html`
   - 查看是否有对 AI API 的请求
   - 检查响应是否成功

3. **检查错误日志**
   - 查看 Console 标签页
   - 确认没有错误信息
   - 如果有错误，查看详细错误信息

## 🔍 调试技巧

### 1. 检查 FORMULA_DATABASE 是否加载

在浏览器控制台运行：
```javascript
console.log(typeof FORMULA_DATABASE);
console.log(Object.keys(FORMULA_DATABASE).length);
```

应该看到：
- `typeof FORMULA_DATABASE` 为 `"object"`
- 配方数量大于 0

### 2. 检查问卷数据

在浏览器控制台运行：
```javascript
const data = getQuestionnaireData();
console.log(data);
```

应该看到包含 `usage` 数组的对象。

### 3. 检查AI配置

在浏览器控制台运行：
```javascript
console.log('AI Provider:', AI_CONFIG.provider);
console.log('Can use AI:', AI_CONFIG.provider !== 'none');
```

### 4. 手动测试场景建议生成

在浏览器控制台运行：
```javascript
const data = getQuestionnaireData();
if (data && data.usage && data.usage.length > 0) {
    generateScenarioSuggestions(data).then(result => {
        console.log('场景建议:', result);
    }).catch(error => {
        console.error('错误:', error);
    });
} else {
    console.log('请先填写问卷并选择使用方式');
}
```

## ⚠️ 常见问题

### 问题1: "FORMULA_DATABASE is not available"

**原因**: `formula-suggestions.js` 未加载或加载顺序错误

**解决**:
1. 检查 `formulas.html` 中脚本加载顺序
2. 确认 `formula-suggestions.js` 在 `ai-service.js` 之前加载
3. 检查 Network 标签页，确认文件成功加载

### 问题2: "AI_QUERY_REQUIRES_LOGIN"

**原因**: 未登录用户尝试使用AI功能

**解决**:
- 这是正常行为，应该显示登录提示
- 如果显示错误信息，检查 `formulas-page.js` 中的错误处理逻辑

### 问题3: "No available formulas found"

**原因**: 选择的使用方式没有匹配的配方

**解决**:
1. 检查 `FORMULA_DATABASE` 中的配方
2. 确认配方名称或副标题包含使用方式关键词（护手霜、身体乳等）
3. 在控制台运行：
   ```javascript
   Object.values(FORMULA_DATABASE).forEach(f => {
       console.log(f.id, f.name, f.subtitle);
   });
   ```

### 问题4: AI API 调用失败

**原因**: API Key 无效或网络问题

**解决**:
1. 检查 `ai-service.js` 中的 API Key 配置
2. 检查网络连接
3. 查看 Network 标签页中的 API 请求详情
4. 查看 Console 中的错误信息

### 问题5: JSON 解析失败

**原因**: AI 返回的响应格式不正确

**解决**:
1. 在控制台查看原始响应：
   ```javascript
   // 在 ai-service.js 的 generateScenarioSuggestions 函数中
   console.log('Raw AI Response:', response);
   ```
2. 检查响应是否包含有效的 JSON
3. 可能需要调整 AI prompt 或使用不同的模型

## 📝 测试清单

- [ ] 页面正常加载，无控制台错误
- [ ] 问卷数据可以保存到 Local Storage
- [ ] 未登录时显示友好的登录提示
- [ ] 登录后可以正常使用AI功能（如果已配置）
- [ ] 场景建议正确生成（2个场景）
- [ ] 每个场景包含时间线
- [ ] 配方卡片只显示精油tag
- [ ] 点击配方卡片可以跳转到详情页
- [ ] 每种使用方式最多显示1-2个配方

## 🎯 快速测试命令

在项目根目录创建一个测试脚本：

```bash
#!/bin/bash
# test.sh

echo "启动本地服务器..."
echo "访问 http://localhost:8000"
echo "按 Ctrl+C 停止服务器"
python3 -m http.server 8000
```

使用方法：
```bash
chmod +x test.sh
./test.sh
```

## 💡 提示

1. **使用无痕模式测试**: 避免缓存和已保存数据的影响
2. **清除 Local Storage**: 在 Application/Storage 中手动清除，或使用：
   ```javascript
   localStorage.clear();
   ```
3. **检查网络请求**: 使用 Network 标签页监控所有请求
4. **查看详细日志**: 在代码中添加 `console.log` 来追踪执行流程

---

**注意**: 如果使用 AI 功能，确保已正确配置 API Key，并且有足够的配额。

