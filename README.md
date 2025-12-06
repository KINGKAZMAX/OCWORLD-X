# Minimal Expo 学习模板

## 启动步骤

1. 安装依赖
   ```bash
   npm install
   ```
2. 启动 Metro（默认使用开发版客户端）
   ```bash
   npm run start
   ```
3. 运行原生客户端（首次需要构建 Dev Client）
   ```bash
   npm run ios   # 或 npm run android
   ```
4. 清除缓存重新构建   
   ```
   npx expo start --clear
   ```
## 目录 & 文件说明

- `app/`：Expo Router 的页面目录。现在只有 `index.tsx`（主界面）和 `_layout.tsx`（路由结构）。
- `assets/`：图标、Splash 等静态资源，启动器会自动读取 `app.json` 中引用的图片。
- `android/`、`ios/`：`npx expo prebuild` 生成的原生工程，用来在模拟器或真机上跑 Dev Client。
- `app.json`：Expo 项目的配置（应用名称、包名、图标、实验特性等）。
- `package.json`：npm 依赖列表与脚本命令，例如 `npm run start`、`npm run ios`。
- `tsconfig.json`：TypeScript 设置，包含 `@/*` 的路径别名。
- `eslint.config.js`：代码检查规则。
- `expo-env.d.ts`：让 TypeScript 能识别 Expo 的全局类型。
- `README.md`：当前这份说明，记得更新它来记录你的学习笔记。
- （自动生成）`node_modules/`：安装依赖后出现的目录，存放第三方库。

## 下一步可以做什么？

- 直接编辑 `app/index.tsx` 改成你想要的 UI。
- 在 `app/` 里新建 `details.tsx` 等文件感受文件路由。
- 修改 `app.json` 里的图标、包名、Splash，让应用更像自己的作品。
