# DND Immersive Dashboard (DND 沉浸式仪表盘)

[![GitHub license](https://img.shields.io/github/license/niccolecantdoit-rgb/DND_immersive_dashboard)](https://github.com/niccolecantdoit-rgb/DND_immersive_dashboard/blob/master/LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](package.json)
[![Downloads](https://img.shields.io/github/downloads/niccolecantdoit-rgb/DND_immersive_dashboard/total)](https://github.com/niccolecantdoit-rgb/DND_immersive_dashboard/releases)

## 简介 (Introduction)

**DND Immersive Dashboard** 是基于[类脑社区](https://discord.gg/leinao)的 [酒馆助手 (JS-Slash-Runner)](https://github.com/N0VI028/JS-Slash-Runner) 插件生态开发的一款 DND 5E (龙与地下城 5版) 沉浸式辅助 Userscript 脚本。它旨在为您的虚拟跑团体验提供丰富的功能支持，包括角色状态监控、地图探索、战斗管理、骰子投掷、法术/物品管理以及高度自定义的界面。

本脚本通过 Tampermonkey/Violentmonkey 等 Userscript 管理器加载，与 SillyTavern 界面无缝集成，配合酒馆助手插件提供更加直观和便捷的 DND 跑团体验。

## 主要功能 (Features)

*   **🛡️ 角色 HUD (Character HUD)**
    *   实时显示角色生命值 (HP)、护甲等级 (AC)、属性值等关键战斗信息。
    *   直观的状态监控与快速调整。
    
*   **🗺️ 地图探索 (Map Exploration)**
    *   支持沉浸式地图浏览与交互，可导入自定义地图。
    *   动态地图迷雾探索与标记功能。
    
*   **⚔️ 战斗管理 (Combat Management)**
    *   即时战斗追踪器，管理回合、先攻顺序和单位状态。
    *   快速施放法术、使用物品，辅助战斗决策。
    
*   **🎲 骰子投掷 (Dice Rolling)**
    *   内置 3D 物理骰子效果，提供真实的投掷体验。
    *   支持各类 DND 常用检定、豁免与伤害投掷，并自动计算结果。
    
*   **📜 法术与物品 (Spells & Items)**
    *   全面的法术列表查阅与施法管理，包括法术位追踪。
    *   详细的物品背包与装备管理，支持自定义物品。
    
*   **🎨 主题与预设 (Themes & Presets)**
    *   支持自定义 UI 主题，个性化您的仪表盘外观。
    *   保存和切换不同的配置预设，适应不同的游戏场景。

*   **⚙️ 高度可配置 (Highly Configurable)**
    *   通过直观的设置界面和 JSON 配置文件进行深度定制。
    *   灵活调整布局、功能模块，打造专属您的 DND 体验。

## 前置要求 (Prerequisites)

*   [SillyTavern](https://github.com/SillyTavern/SillyTavern) - AI 角色扮演前端
*   [酒馆助手 (JS-Slash-Runner)](https://github.com/N0VI028/JS-Slash-Runner) - 类脑社区开发的 SillyTavern 扩展插件，提供 JS 脚本运行环境

## 安装说明 (Installation)

1.  **安装酒馆助手**: 确保您的 SillyTavern 已安装 [酒馆助手 (JS-Slash-Runner)](https://github.com/N0VI028/JS-Slash-Runner) 插件。
2.  **安装 Userscript 管理器**: 确保您的浏览器（推荐 Chrome 或 Firefox）已安装 Userscript 管理器扩展，例如 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/get-it/)。
3.  **下载脚本**: 前往 [Releases](https://github.com/niccolecantdoit-rgb/DND_immersive_dashboard/releases) 页面下载最新版本的 `DND_Dashboard_Immersive.user.js` 文件。
4.  **安装脚本**: 将下载的 `.user.js` 文件拖拽到您的 Userscript 管理器扩展图标上，或通过管理器界面选择"从本地文件安装"。
5.  **打开 SillyTavern**: 确保 Userscript 和酒馆助手插件均已启用，然后打开您的 SillyTavern 页面。脚本应会自动加载并显示仪表盘。

## 使用指南 (Usage)

安装并激活脚本后，DND Immersive Dashboard 会自动出现在 SillyTavern 界面中。

*   **激活与隐藏**: 仪表盘通常可以通过页面上的一个切换按钮或快捷键进行显示/隐藏。
*   **初始设置**: 首次使用时，建议进入设置面板（通常通过齿轮图标访问）配置角色数据、导入地图等。
*   **数据同步**: 脚本会自动尝试与酒馆助手管理的角色数据进行同步，您也可以手动更新。

## 开发指南 (Development)

本项目使用 Webpack 进行模块打包和构建。

### 依赖安装

在项目根目录运行以下命令安装所有开发依赖：

```bash
npm install
```

### 开发模式 (Development Mode)

在开发过程中，您可以使用观察模式 (watch mode) 实时编译代码：

```bash
npm run dev
```

此命令会在文件发生变化时自动重新构建，便于开发调试。

### 构建生产版本 (Build Production)

要构建用于发布的脚本，请运行：

```bash
npm run build
```

生产版本文件将生成在 `dist/` 目录下，文件名为 `DND_Dashboard_Immersive.user.js`。

### 脚本压缩 (Minify Script)

每次完成生产构建后，发布/交付前都应立即运行压缩脚本，确保 `.min.js` 与最新构建同步：

```bash
npm run minify
```

最终分发时请确认以下两个文件都已更新：

- `dist/DND_Dashboard_Immersive.user.js`
- `dist/DND_Dashboard_Immersive.min.js`

如果 VSCode 没有显示 npm scripts，请确认打开的是项目根目录（包含 `package.json` 的 `插件/` 目录）。仓库已包含 `.vscode/settings.json`，用于显式开启 npm 脚本探测与脚本资源管理器。

## 贡献 (Contributing)

我们非常欢迎社区的贡献！如果您有任何功能建议、Bug 报告或想要提交代码，请随时通过 [Issue](https://github.com/niccolecantdoit-rgb/DND_immersive_dashboard/issues) 或 [Pull Request](https://github.com/niccolecantdoit-rgb/DND_immersive_dashboard/pulls) 参与进来。

## 许可证 (License)

本项目采用 MIT 许可证。详见 [LICENSE](https://github.com/niccolecantdoit-rgb/DND_immersive_dashboard/blob/master/LICENSE)。

---

*Author: Niccole*
