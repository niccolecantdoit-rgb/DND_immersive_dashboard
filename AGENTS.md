# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## 项目概述
SillyTavern 的 DND 5E 沉浸式仪表盘 Userscript 插件。通过 Tampermonkey/Violentmonkey 加载。

## 构建命令
- `npm run dev` - 开发模式 (watch + Socket.IO 热更新到端口 6621)
- `npm run build` - 生产构建
- `npm run minify` - 额外压缩 (生成 .min.js)
- **交付/发布前必须连续执行**：`npm run build` 后立即执行 `npm run minify`，确保 `.user.js` 与 `.min.js` 同步更新。

## 版本同步 (非常重要)
修改版本时必须同时更新以下 4 处：
1. [`package.json`](package.json:3) - `version` 字段
2. [`src/header.js`](src/header.js:4) - `@version` 注释
3. [`src/config/Config.js`](src/config/Config.js) - `TEMPLATE_SYNC.CURRENT_VERSION` 字段
4. [`CHANGELOG.md`](CHANGELOG.md:4) - 添加新版本条目

## 模板同步机制
- 插件启动时会对比 `TEMPLATE_SYNC.CURRENT_VERSION` 与 IndexedDB 中记录的已同步版本
- 版本不同时弹窗询问用户是否从 GitHub Raw 拉取最新配套模板并导入到神·数据库
- 模板文件位于 [`dist/DND仪表盘配套模板.json`](dist/DND仪表盘配套模板.json)
- 远程 URL 配置在 [`CONFIG.TEMPLATE_SYNC.REMOTE_URL`](src/config/Config.js)
- **修改模板结构后**，必须确保 `dist/DND仪表盘配套模板.json` 已更新并推送到远程仓库，否则用户拉取到的是旧模板

## Changelog 工作流程
- [`CHANGELOG.md`](CHANGELOG.md) - 开发者日志，每次代码修改后立即更新
- [`CHANGELOG for users.md`](CHANGELOG%20for%20users.md) - 用户端日志，仅在用户命令下同步并提交 git

## 代码风格
- ES6 模块，单例对象导出 (如 `export const Logger = {...}`)
- 中文注释，文件头标注路径 `// src/path/file.js`
- 使用 [`Logger`](src/core/Logger.js:2) 进行日志输出，禁止直接 console.log
- UI 组件使用 jQuery (从 SillyTavern 获取)，通过 [`getCore()`](src/core/Utils.js) 获取
- CSS 类名前缀 `dnd-`，z-index 使用 [`CONFIG.Z_INDEX`](src/config/Config.js:4)

## 架构
- `src/core/` - 核心工具 (Logger, DBAdapter, Utils, TavernAPI)
- `src/config/` - 配置常量和主题预设
- `src/ui/` - UI 渲染和样式
- `src/features/` - 功能模块 (主题、地图、预设切换、模板同步等)
- `src/data/` - 数据管理 (角色、物品、骰子)
