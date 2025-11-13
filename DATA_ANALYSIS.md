# 数据管理和功能重叠分析报告

## 一、功能重叠问题

### 1. 配方数据库功能重复
- **recipe-database.html** + **recipe-database.js**: 模块化版本，使用 `RecipeDB` 模块
- **精油配方数据库（html_单文件）.html**: 单文件版本，独立实现
- **问题**: 两个版本功能几乎完全相同，造成维护困难

### 2. 配方创建功能重复
- **formula-builder.html**: 实验性配方创建，保存格式简单
- **recipe-database.html**: 完整配方管理，包含更多字段
- **问题**: 用户在不同页面创建的配方无法共享

## 二、数据存储问题

### 当前使用的 localStorage keys:
1. `savedFormulas` - formula-builder.js 使用
2. `eo_recipes_v1` - recipe-db.js 使用  
3. `eo_lists_v1` - recipe-db.js 使用（库存列表）
4. `healthQuestionnaireData` - questionnaire.js 使用
5. `user_questionnaire_{userId}` - questionnaire.js 使用（用户特定）
6. `aromatherapy_users` - auth.js 使用
7. `aromatherapy_current_user` - auth.js 使用

### 数据格式不统一:

#### formula-builder.js 格式:
```javascript
{
  id: timestamp,
  name: string,
  date: string,
  baseType: string,
  baseAmount: number,
  ingredients: [{name, latin, drops, caution}],
  totalDrops: number,
  totalMl: number,
  concentration: number
}
```

#### recipe-database.js 格式:
```javascript
{
  id: uuid,
  name: string,
  purpose: string,
  total: number,
  dilution: number,
  carrier: string,
  solvent: string,
  notes: string,
  oils: [{name, amount, note}],
  safetyFlag: string,
  updatedAt: string
}
```

## 三、数据联动问题

### 1. 配方数据无法共享
- `formula-builder.html` 创建的配方无法在 `recipe-database.html` 中查看
- 两个系统使用不同的数据格式和存储key

### 2. 预设配方与用户配方分离
- `FORMULA_DATABASE` 是硬编码的预设配方（已移至独立的 formula-database.js 文件）
- 用户创建的配方无法与预设配方一起显示
- 无法基于用户配方进行推荐

### 3. 问卷数据与配方联动不完整
- 问卷数据可以用于推荐预设配方（FORMULA_DATABASE）
- 但无法基于问卷推荐用户创建的配方
- 用户创建的配方无法根据问卷数据进行评分

## 四、解决方案

### 方案1: 统一数据管理接口
创建统一的 `DataManager` 模块，统一管理所有配方数据

### 方案2: 数据格式转换
实现格式转换函数，让不同格式的配方可以互操作

### 方案3: 整合功能
- 保留 `recipe-database.html` 作为主要配方管理页面
- 将 `formula-builder.html` 的配方自动同步到统一数据库
- 删除或标记 `精油配方数据库（html_单文件）.html` 为旧版本

### 方案4: 增强联动
- 让用户创建的配方也可以基于问卷数据进行推荐
- 在 `formulas.html` 中同时显示预设配方和用户配方

