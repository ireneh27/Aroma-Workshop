#!/bin/bash

# 芳疗方案网站 - 本地测试服务器启动脚本

echo "=========================================="
echo "  芳疗方案网站 - 本地测试服务器"
echo "=========================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    echo "   当前目录: $(pwd)"
    exit 1
fi

# 检查 Python 是否安装
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ 错误: 未找到 Python"
    echo "   请安装 Python 3 或使用其他方法启动服务器"
    exit 1
fi

PORT=8000

echo "✅ 使用 $PYTHON_CMD 启动服务器"
echo ""
echo "📍 服务器地址: http://localhost:$PORT"
echo "📍 首页地址: http://localhost:$PORT/index.html"
echo "📍 配方页面: http://localhost:$PORT/formulas.html"
echo ""
echo "💡 提示:"
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 使用无痕模式测试以避免缓存问题"
echo "   - 查看 LOCAL_TESTING.md 了解详细测试步骤"
echo ""
echo "=========================================="
echo ""

# 启动服务器
$PYTHON_CMD -m http.server $PORT

