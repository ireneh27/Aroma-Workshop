# 配方数据库导出说明

## 概述

经典配方库的配方数据已从 `formula-suggestions.js` 中导出为独立的 `formula-database.js` 文件，便于维护和管理。

## 文件变更

### 新增文件
- **`formula-database.js`** - 包含完整的 `FORMULA_DATABASE` 对象（所有预设配方数据）

### 修改文件

#### JavaScript 文件
- **`formula-suggestions.js`** 
  - 移除了 `FORMULA_DATABASE` 对象定义（约1094行）
  - 添加注释说明数据已移至独立文件
  - 保留所有推荐算法和函数

#### HTML 文件（已更新脚本加载顺序）
以下文件已更新，确保在加载 `formula-suggestions.js` 之前先加载 `formula-database.js`：

1. `formula-library.html` - 经典配方库页面
2. `formula-detail.html` - 配方详情页面
3. `index.html` - 首页
4. `formulas.html` - 定制芳疗体验页面
5. `my-formulas.html` - 我的配方页面
6. `scenario-suggestions.html` - 场景建议页面

#### 文档文件（已更新说明）
- `WEBSITE_CHECK_REPORT.md` - 更新 FORMULA_DATABASE 位置说明
- `DATA_ANALYSIS.md` - 更新配方数据库说明
- `LOCAL_TESTING.md` - 更新故障排除指南
- `AI_CALL_FLOW.md` - 更新依赖关系说明
- `FUNCTIONALITY_CHECK.md` - 更新文件列表
- `IMPROVEMENTS.md` - 更新文件变更清单
- `test-check.js` - 更新检查脚本提示信息

## 加载顺序要求

**重要**：使用 `FORMULA_DATABASE` 的页面必须按以下顺序加载脚本：

```html
<script src="formula-database.js"></script>
<script src="formula-suggestions.js"></script>
```

## 文件结构

```
formula-database.js          # 配方数据（独立文件）
    ↓
formula-suggestions.js       # 推荐算法（依赖 formula-database.js）
    ↓
其他使用配方的页面和脚本
```

## 使用方式

### 在 HTML 中使用

```html
<!-- 必须先加载 formula-database.js -->
<script src="formula-database.js"></script>
<!-- 然后加载 formula-suggestions.js -->
<script src="formula-suggestions.js"></script>
```

### 在 JavaScript 中使用

```javascript
// FORMULA_DATABASE 在 formula-database.js 中定义
// 确保 formula-database.js 已加载后即可使用
if (typeof FORMULA_DATABASE !== 'undefined') {
    const formulas = Object.values(FORMULA_DATABASE);
    // 使用配方数据...
}
```

## 优势

1. **代码分离**：配方数据与推荐算法分离，结构更清晰
2. **易于维护**：配方数据可独立更新，不影响算法代码
3. **便于扩展**：可以轻松添加新配方或修改现有配方
4. **更好的组织**：数据文件独立，便于版本控制和协作

## 注意事项

- 所有使用 `FORMULA_DATABASE` 的页面都必须先加载 `formula-database.js`
- `formula-library.js` 和 `formula-filter.js` 等文件会自动检测 `FORMULA_DATABASE` 是否加载
- 如果 `FORMULA_DATABASE` 未加载，相关功能会显示错误提示

## 验证

可以使用 `test-check.js` 脚本验证所有文件是否正确加载：

```javascript
// 在浏览器控制台运行
// 或直接加载 test-check.js 文件
```

检查项包括：
- `FORMULA_DATABASE` 是否已加载
- 配方数量是否正确
- 配方数据是否完整

