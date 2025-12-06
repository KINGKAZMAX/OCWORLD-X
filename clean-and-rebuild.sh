#!/bin/bash

# Android 完全清理和重新构建脚本

set -e  # 遇到错误立即退出

echo "========================================"
echo "🧹 Android 完全清理和重新构建"
echo "========================================"
echo ""

PROJECT_DIR="/Users/yankun/my_project/ios_app_demo/store"
cd "$PROJECT_DIR"

echo "📍 当前目录: $(pwd)"
echo ""

# 步骤 1: 停止所有 Metro 和 Gradle 进程
echo "🛑 步骤 1/7: 停止相关进程..."
pkill -f "react-native" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "gradle" 2>/dev/null || true
echo "✅ 进程已停止"
echo ""

# 步骤 2: 清理 Expo 缓存
echo "🧹 步骤 2/7: 清理 Expo 缓存..."
rm -rf .expo
rm -rf .metro
rm -rf $HOME/.expo/android-*
rm -rf $TMPDIR/react-* 2>/dev/null || true
if command -v watchman &> /dev/null; then
    echo "  - 清理 watchman"
    watchman watch-del-all 2>/dev/null || true
fi
echo "✅ Expo 缓存清理完成"
echo ""

# 步骤 3: 清理 Android 构建
echo "🏗️  步骤 3/7: 清理 Android 构建..."
if [ -d "android" ]; then
    echo "  - 清理 android/app/build"
    rm -rf android/app/build
    echo "  - 清理 android/build"
    rm -rf android/build
    echo "  - 清理 android/.gradle"
    rm -rf android/.gradle
    
    if [ -f "android/gradlew" ]; then
        echo "  - 停止 Gradle 守护进程"
        cd android
        ./gradlew --stop 2>/dev/null || true
        echo "  - 运行 Gradle clean"
        ./gradlew clean 2>/dev/null || true
        cd ..
    fi
    echo "✅ Android 构建清理完成"
else
    echo "⚠️  android 目录不存在（将在首次构建时创建）"
fi
echo ""

# 步骤 4: 清理 Gradle 缓存
echo "🗑️  步骤 4/7: 清理全局 Gradle 缓存..."
if [ -d "$HOME/.gradle/caches" ]; then
    echo "  - 清理 ~/.gradle/caches"
    rm -rf $HOME/.gradle/caches/transforms-* 
    rm -rf $HOME/.gradle/caches/8.* 
    # 只清理与 react-native 相关的缓存
    find $HOME/.gradle/caches -name "*react*" -type d -exec rm -rf {} + 2>/dev/null || true
    echo "✅ Gradle 缓存清理完成"
else
    echo "⏭️  没有找到 Gradle 缓存"
fi
echo ""

# 步骤 5: 清理 node_modules (可选)
echo "📦 步骤 5/7: 处理 node_modules..."
if [ -d "node_modules" ]; then
    read -p "是否清理并重新安装 node_modules? (推荐) (y/N): " -n 1 -r
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
        echo "⏭️  跳过 node_modules 清理"
    fi
else
    echo "  - 首次安装依赖"
    npm install
fi
echo ""

# 步骤 6: 清理 adb
echo "🔌 步骤 6/7: 重启 ADB..."
if command -v adb &> /dev/null; then
    adb kill-server 2>/dev/null || true
    sleep 1
    adb start-server 2>/dev/null || true
    echo "✅ ADB 已重启"
else
    echo "⚠️  ADB 未找到"
fi
echo ""

# 步骤 7: 显示设备信息
echo "📱 步骤 7/7: 检查设备..."
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)
    if [ "$DEVICES" -gt 0 ]; then
        echo "✅ 检测到 $DEVICES 个 Android 设备"
        adb devices
    else
        echo "⚠️  未检测到 Android 设备"
        echo "请确保:"
        echo "  - 设备已连接且 USB 调试已开启"
        echo "  - 或模拟器已启动"
    fi
fi
echo ""

echo "========================================"
echo "✨ 清理完成！"
echo "========================================"
echo ""
echo "现在可以重新构建应用:"
echo ""
echo "  方式 1: 启动开发服务器"
echo "    npx expo start --clear"
echo ""
echo "  方式 2: 直接构建并运行"
echo "    npx expo run:android"
echo ""
echo "  方式 3: 查看调试日志"
echo "    adb logcat | grep -E 'ReactNative|Expo|store|FATAL'"
echo ""

