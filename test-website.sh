#!/bin/bash

# 网站测试脚本
echo "=========================================="
echo "   芳疗网站测试脚本"
echo "=========================================="
echo ""

# 检查服务器是否运行
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "✅ 服务器正在运行 (端口 8000)"
    SERVER_PID=$(lsof -ti:8000)
    echo "   进程ID: $SERVER_PID"
else
    echo "❌ 服务器未运行"
    echo "   请先运行: python3 -m http.server 8000"
    exit 1
fi

echo ""
echo "📍 访问地址:"
echo "   - 首页: http://localhost:8000/index.html"
echo "   - 直接访问: http://localhost:8000"
echo ""

# 检查主要文件是否存在
echo "📋 检查主要文件..."
FILES=(
    "index.html"
    "health-profile.html"
    "essential-oils.html"
    "safety.html"
    "formula-builder.html"
    "formulas.html"
    "styles.css"
    "common.js"
)

MISSING_FILES=()
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (缺失)"
        MISSING_FILES+=("$file")
    fi
done

echo ""
if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo "✅ 所有主要文件都存在"
else
    echo "⚠️  发现 ${#MISSING_FILES[@]} 个缺失文件"
fi

echo ""
echo "=========================================="
echo "💡 测试建议:"
echo "   1. 在浏览器中打开 http://localhost:8000"
echo "   2. 打开开发者工具 (F12) 查看控制台"
echo "   3. 测试各个页面的导航功能"
echo "   4. 填写健康问卷并保存"
echo "   5. 检查配方页面是否正常显示"
echo "=========================================="

