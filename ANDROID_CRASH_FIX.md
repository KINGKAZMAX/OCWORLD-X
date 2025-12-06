# Android 登录闪退问题修复指南

## 问题描述
在 Android 应用中，点击登录按钮后应用闪退。

## 已实施的修复

### 1. 路由跳转优化
- **文件**: `app/index.tsx`
- **修改**: 将 `router.replace('/home')` 改为 `router.push('/home')`
- **原因**: `replace` 在某些情况下会导致路由栈混乱，使用 `push` 更安全
- **添加**: 更详细的错误日志和 console.log，便于调试

### 2. 布局和导航配置增强
- **文件**: `app/_layout.tsx`
- **修改**: 
  - 为 Stack 添加 `screenOptions` 配置
  - home 页面设置 `headerShown: false`
  - 添加更多调试日志
- **原因**: 确保导航配置在 Android 上正确工作

### 3. Home 页面错误处理
- **文件**: `app/home.tsx`
- **修改**:
  - 添加 `useEffect` 监听组件挂载
  - 创建 `handleModulePress` 函数包裹导航逻辑
  - 添加 try-catch 错误捕获
  - 添加平台检测和日志
- **原因**: 提供更好的错误处理和调试信息

## 如何测试修复

### 方法 1: 使用开发模式运行
```bash
# 清理缓存
cd /Users/yankun/.cursor/worktrees/store/rfr8Q
rm -rf android/app/build
rm -rf .expo

# 重新安装依赖
npm install

# 运行开发服务器
npx expo start --clear

# 在另一个终端，运行 Android
npx expo run:android
```

### 方法 2: 查看 Android 日志
```bash
# 连接设备或模拟器后，查看实时日志
adb logcat | grep -i "ReactNative\|Expo\|store"

# 或者查看所有崩溃相关日志
adb logcat | grep -i "crash\|fatal\|exception"

# 清除之前的日志
adb logcat -c

# 然后重新运行应用并查看新日志
adb logcat
```

### 方法 3: 使用 Chrome DevTools 调试
1. 运行 `npx expo start`
2. 按 `j` 打开 Chrome DevTools
3. 在控制台中查看所有 console.log 输出
4. 点击登录按钮，观察日志输出

## 可能的其他问题

### 1. react-native-svg 在 Android 上的问题
如果 SVG 图标导致崩溃，可以尝试：

```bash
# 重新安装 react-native-svg
npm install react-native-svg@latest

# 清理 Android 构建
cd android
./gradlew clean
cd ..
```

### 2. GluestackUI 配置问题
如果是 GluestackUI 导致的问题，可以尝试：

```bash
npm install @gluestack-ui/themed@latest @gluestack-ui/config@latest
```

### 3. Metro Bundler 缓存问题
```bash
# 清理 Metro 缓存
npx expo start --clear

# 或者
npm start -- --reset-cache
```

### 4. Gradle 守护进程问题
```bash
cd android
./gradlew --stop
./gradlew clean
cd ..
```

## 调试检查清单

- [ ] 查看 Chrome DevTools 控制台，确认 "登录成功，准备跳转到 /home" 日志
- [ ] 查看 "HomeScreen mounted" 日志，确认 home 页面开始渲染
- [ ] 检查是否有 "Navigation error" 或其他错误日志
- [ ] 使用 `adb logcat` 查看 Android 系统日志中的错误堆栈
- [ ] 确认所有依赖都已正确安装
- [ ] 确认 Android 构建配置正确

## 常见错误及解决方案

### 错误 1: "Cannot read property 'push' of undefined"
**解决**: 确保在 `expo-router` 上下文中使用 router

### 错误 2: "View config not found for name RNSVGPath"
**解决**: 重新安装 react-native-svg 并清理构建
```bash
npm install react-native-svg
cd android && ./gradlew clean && cd ..
```

### 错误 3: "Unable to resolve module..."
**解决**: 清理缓存并重新安装
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

## 获取详细崩溃信息

### 使用 adb 获取崩溃堆栈
```bash
# 获取应用崩溃日志
adb logcat -d | grep -A 50 "FATAL EXCEPTION"

# 保存日志到文件
adb logcat -d > android_crash.log
```

### 使用 React Native 调试工具
1. 摇晃设备或按 Cmd+M (模拟器) 打开开发菜单
2. 选择 "Debug"
3. 在浏览器控制台查看错误信息

## 联系支持

如果问题仍未解决，请提供以下信息：
1. `adb logcat` 的完整输出
2. Chrome DevTools 控制台的截图
3. 应用崩溃时的具体操作步骤
4. Android 设备/模拟器的版本信息

