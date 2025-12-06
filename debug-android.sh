#!/bin/bash

# Android 调试脚本 - 用于排查闪退问题

echo "========================================="
echo "Android 调试工具"
echo "========================================="
echo ""

# 检查设备连接
echo "1. 检查连接的设备..."
adb devices
echo ""

# 清除旧日志
echo "2. 清除旧日志..."
adb logcat -c
echo "日志已清除"
echo ""

echo "3. 开始监听日志（按 Ctrl+C 停止）..."
echo "   现在请启动你的应用，观察日志输出"
echo ""
echo "========================================="
echo ""

# 监听所有错误和关键信息
adb logcat -v time \
  AndroidRuntime:E \
  ReactNative:V \
  ReactNativeJS:V \
  ExpoModules:V \
  System.err:V \
  *:F
