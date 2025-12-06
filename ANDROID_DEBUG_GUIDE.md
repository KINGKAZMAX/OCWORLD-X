# Android 闪退问题排查指南

## 🔍 第一步：查看日志（最重要！）

### 方法 1：使用调试脚本
```bash
chmod +x debug-android.sh
./debug-android.sh
```

### 方法 2：手动查看日志
```bash
# 清除旧日志
adb logcat -c

# 查看所有错误
adb logcat *:E

# 查看 React Native 相关日志
adb logcat | grep -E "(ReactNative|ReactNativeJS|ExpoModules)"

# 查看崩溃日志
adb logcat | grep "FATAL"
```

### 方法 3：保存日志到文件
```bash
adb logcat > android-crash.log
```
然后在应用崩溃后，按 Ctrl+C 停止，查看 `android-crash.log` 文件。

---

## 🛠️ 常见问题和解决方案

### 问题 1：新架构兼容性问题
你的 `app.json` 启用了新架构（`newArchEnabled: true`）。如果是兼容性问题：

**临时禁用新架构：**
编辑 `app.json`:
```json
{
  "expo": {
    "newArchEnabled": false
  }
}
```

然后重新构建：
```bash
npx expo prebuild --clean
npm run android
```

### 问题 2：react-native-worklets 依赖问题
Reanimated v4 需要 `react-native-worklets`。检查是否正确安装：

```bash
npx expo install react-native-worklets@~0.5.1
```

### 问题 3：内存不足
Android 设备可能内存不足。在 `android/gradle.properties` 中增加堆内存：

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### 问题 4：Hermes 引擎问题
尝试禁用 Hermes。编辑 `android/gradle.properties`:

```properties
hermesEnabled=false
```

### 问题 5：字体加载问题
如果使用自定义字体，确保字体已加载。在 `_layout.tsx` 中：

```tsx
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // 你的字体
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }
  
  // 其余代码...
}
```

### 问题 6：GluestackUI 样式问题
GluestackUI 可能与新架构有兼容性问题。尝试降级版本或检查样式配置。

---

## 🔧 清理和重建

如果上述方法都不行，尝试完全清理项目：

```bash
# 1. 清理所有缓存
rm -rf node_modules
rm -rf android/build
rm -rf android/app/build
rm -rf ios/build
rm -rf .expo

# 2. 清理 Metro bundler 缓存
npx expo start -c

# 3. 重新安装依赖
npm install

# 4. 重新生成原生项目
npx expo prebuild --clean

# 5. 重新构建 Android
npm run android
```

---

## 📊 收集崩溃信息

在发给开发者或提问时，请提供：

1. **完整的 logcat 日志**（特别是 FATAL 错误部分）
2. **Android 版本**：`adb shell getprop ro.build.version.release`
3. **设备型号**：`adb shell getprop ro.product.model`
4. **应用版本**：查看 `package.json` 中的版本号
5. **崩溃的具体操作步骤**

---

## 🐛 启用开发者菜单

在应用运行时：
- 摇晃设备
- 或运行命令：`adb shell input keyevent 82`

在开发者菜单中：
- 选择 "Enable Remote JS Debugging" 查看 Chrome DevTools 中的日志
- 选择 "Toggle Inspector" 查看布局问题

---

## 💡 调试技巧

### 1. 逐步注释代码
从 `app/_layout.tsx` 开始，逐步注释组件，找出是哪个组件导致崩溃：

```tsx
export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Test</Text>
    </View>
  );
}
```

如果这样不崩溃，逐步添加回组件。

### 2. 添加更多日志
在怀疑的地方添加 `console.log`：

```tsx
console.log('Before rendering component X');
// 你的组件
console.log('After rendering component X');
```

### 3. 检查原生崩溃
有时崩溃是原生层面的。查看 logcat 中的堆栈跟踪（Stack trace），特别是包含 `java.lang` 或 `android.` 的错误。

---

## ⚠️ 已知问题

1. **React 19 + 某些库**：React 19 刚发布不久，某些第三方库可能还不兼容
2. **新架构 + 老库**：如果使用了不支持新架构的库，会导致崩溃
3. **Android 16 + Edge-to-Edge**：SDK 54 默认启用 edge-to-edge，可能导致布局问题

---

## 📞 获取帮助

如果以上方法都无法解决：

1. 将完整的 logcat 日志发送给我
2. 描述崩溃的具体步骤
3. 提供设备和系统信息
4. 告知是否在 iOS 上正常运行
