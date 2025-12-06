#!/bin/bash

echo "======================================"
echo "Android 崩溃调试工具"
echo "======================================"
echo ""

# 检查 adb 是否可用
if ! command -v adb &> /dev/null; then
    echo "❌ 错误: adb 命令未找到"
    echo "请确保已安装 Android SDK 并将 adb 添加到 PATH"
    exit 1
fi

# 检查设备连接
echo "1️⃣ 检查连接的 Android 设备..."
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
    echo "❌ 未检测到 Android 设备或模拟器"
    echo "请确保:"
    echo "  - USB 调试已开启"
    echo "  - 设备已连接或模拟器已启动"
    echo "  - 运行 'adb devices' 确认设备"
    exit 1
fi
echo "✅ 检测到 $DEVICES 个设备"
echo ""

# 清除旧日志
echo "2️⃣ 清除旧日志..."
adb logcat -c
echo "✅ 日志已清除"
echo ""

# 获取应用包名
PACKAGE_NAME="com.wfkj.store"  # 根据你的 app.json 配置
echo "3️⃣ 应用包名: $PACKAGE_NAME"
echo ""

# 检查应用是否已安装
echo "4️⃣ 检查应用安装状态..."
if adb shell pm list packages | grep -q "$PACKAGE_NAME"; then
    echo "✅ 应用已安装"
    
    # 获取应用版本信息
    VERSION=$(adb shell dumpsys package "$PACKAGE_NAME" | grep versionName | head -1)
    echo "   $VERSION"
else
    echo "⚠️  应用未安装"
    echo "   请先运行: npx expo run:android"
fi
echo ""

# 启动实时日志监控
echo "5️⃣ 开始监控应用日志..."
echo "======================================"
echo "现在请在设备上操作应用并点击登录按钮"
echo "按 Ctrl+C 停止监控"
echo "======================================"
echo ""

# 过滤相关日志
adb logcat | grep -iE "(ReactNative|Expo|store|FATAL|AndroidRuntime|crash|exception|Error)" --color=always

