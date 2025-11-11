# 精油图片说明

## 当前实现

目前精油详情页使用的是 Unsplash 的在线图片，通过 URL 直接引用。这种方式：
- ✅ 无需下载图片到本地
- ✅ 图片质量高，加载速度快
- ✅ 自动优化和缓存

## 如需下载图片到本地

如果您希望将图片下载到本地文件夹，可以：

1. 访问 Unsplash 网站：https://unsplash.com/
2. 搜索对应的精油关键词（如 "lavender", "rose", "essential oil" 等）
3. 下载图片并保存到 `images/oils/` 文件夹
4. 更新 `oil-database.js` 中的 `imageUrl` 字段，改为本地路径：
   ```javascript
   imageUrl: 'images/oils/lavender.jpg'
   ```

## 当前使用的图片URL

所有精油图片都使用 Unsplash 的图片服务，URL格式为：
```
https://images.unsplash.com/photo-{id}?w=600&h=400&fit=crop
```

这些图片会根据精油类型自动匹配相关的植物或精油图片。

