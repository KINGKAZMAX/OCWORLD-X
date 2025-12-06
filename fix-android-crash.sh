#!/bin/bash

# Android 登录闪退一键修复脚本
# 此脚本会清理缓存、重新安装依赖并重新构建应用

set -e  # 遇到错误立即退出

echo "========================================"
echo "🔧 Android 登录闪退修复脚本"
echo "========================================"
echo ""

PROJECT_DIR="/Users/yankun/.cursor/worktrees/store/rfr8Q"

cd "$PROJECT_DIR"

echo "📍 当前目录: $(pwd)"
echo ""

# 步骤 1: 清理缓存
echo "🧹 步骤 1/5: 清理构建缓存..."
echo "  - 清理 .expo 缓存"
rm -rf .expo
echo "  - 清理 Metro bundler 缓存"
rm -rf .metro
echo "  - 清理 watchman (如果安装)"
if command -v watchman &> /dev/null; then
    watchman watch-del-all 2>/dev/null || true
fi
echo "✅ 缓存清理完成"
echo ""

# 步骤 2: 清理 Android 构建文件
echo "🏗️  步骤 2/5: 清理 Android 构建文件..."
if [ -d "android" ]; then
    echo "  - 清理 android/app/build"
    rm -rf android/app/build
    echo "  - 清理 android/build"
    rm -rf android/build
    
    if [ -f "android/gradlew" ]; then
        echo "  - 停止 Gradle 守护进程"
        cd android
        ./gradlew --stop 2>/dev/null || true
        ./gradlew clean 2>/dev/null || true
        cd ..
    fi
    echo "✅ Android 构建文件清理完成"
else
    echo "⚠️  android 目录不存在，将在首次运行时创建"
fi
echo ""

# 步骤 3: 重新安装依赖（可选）
echo "📦 步骤 3/5: 检查依赖..."
read -p "是否重新安装 node_modules? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  - 删除 node_modules"
    rm -rf node_modules
    echo "  - 删除 package-lock.json"
    rm -f package-lock.json
    echo "  - 重新安装依赖"
    npm install
    echo "✅ 依赖重新安装完成"
else
    echo "⏭️  跳过依赖重新安装"
fi
echo ""

# 步骤 4: 显示修改的文件
echo "📝 步骤 4/5: 查看已修改的关键文件..."
echo "  ✓ app.json - 禁用实验性功能"
echo "  ✓ app/index.tsx - 优化登录跳转"
echo "  ✓ app/_layout.tsx - 增强导航配置"
echo "  ✓ app/home.tsx - 添加错误处理"
echo ""

# 步骤 5: 构建选项
echo "🚀 步骤 5/5: 准备重新构建..."
echo ""
echo "请选择操作:"
echo "  1) 仅启动开发服务器 (推荐先执行此操作)"
echo "  2) 重新构建并运行 Android 应用"
echo "  3) 启动调试日志监控"
echo "  4) 全部执行 (服务器 + 构建)"
echo "  0) 退出"
echo ""

read -p "请输入选项 (0-4): " option

case $option in
    1)
        echo ""
        echo "🎯 启动开发服务器..."
        echo "========================================"
        echo "提示:"
        echo "  - 按 'a' 在 Android 上运行"
        echo "  - 按 'j' 打开 Chrome 调试器"
        echo "  - 按 'r' 重新加载应用"
        echo "========================================"
        echo ""
        npx expo start --clear
        ;;
    2)
        echo ""
        echo "🏗️  重新构建 Android 应用..."
        echo "这可能需要几分钟时间..."
        echo ""
        npx expo run:android
        ;;
    3)
        echo ""
        echo "📊 启动调试日志监控..."
        echo "========================================"
        echo "现在请在设备上操作应用"
        echo "按 Ctrl+C 停止监控"
        echo "========================================"
        echo ""
        if [ -f "./debug-crash.sh" ]; then
            ./debug-crash.sh
        else
            echo "⚠️  debug-crash.sh 未找到，使用 adb logcat"
            adb logcat | grep -iE "(ReactNative|Expo|store|FATAL)"
        fi
        ;;
    4)
        echo ""
        echo "🔄 执行完整流程..."
        echo ""
        echo "步骤 A: 启动开发服务器 (后台运行)..."
        npx expo start --clear > expo-server.log 2>&1 &
        EXPO_PID=$!
        echo "  服务器 PID: $EXPO_PID"
        echo "  日志输出到: expo-server.log"
        echo ""
        
        echo "步骤 B: 等待服务器启动..."
        sleep 10
        echo ""
        
        echo "步骤 C: 构建并运行 Android..."
        npx expo run:android
        ;;
    0)
        echo ""
        echo "👋 退出修复脚本"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "✨ 操作完成!"
echo "========================================"
echo ""
echo "📚 更多信息请查看: 修复说明.md"
echo ""

