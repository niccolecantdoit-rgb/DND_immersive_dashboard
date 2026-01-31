# DND Immersive Dashboard (DND 沉浸式仪表盘)

[![GitHub license](https://img.shields.io/github/license/niccolecantdoit-rgb/DND_immersive_dashboard)](https://github.com/niccolecantdoit-rgb/DND_immersive_dashboard/blob/master/LICENSE)
[![Version](https://img.shields.io/badge/version-1.4.0-blue)](package.json)

## 简介 (Introduction)

**DND Immersive Dashboard** 是专为 SillyTavern 设计的一款 DND 5E (龙与地下城 5版) 沉浸式辅助插件。它旨在为跑团体验提供丰富的功能支持，包括角色状态监控、地图探索、战斗管理、骰子投掷以及法术/物品管理等。

本插件通过 Userscript 方式加载，能够与 SillyTavern 的界面无缝集成，提供更加直观和便捷的操作体验。

## 主要功能 (Features)

*   **🛡️ 角色 HUD (Character HUD)**
    *   实时显示角色生命值 (HP)、护甲等级 (AC) 等关键属性。
    *   状态监控与快速调整。
    
*   **🗺️ 地图探索 (Map Exploration)**
    *   支持沉浸式地图浏览与交互。
    *   地图迷雾探索与标记功能。
    
*   **⚔️ 战斗管理 (Combat Management)**
    *   即时战斗追踪器。
    *   先攻排序与回合管理。
    
*   **🎲 骰子投掷 (Dice Rolling)**
    *   内置 3D 骰子物理效果或快速投掷界面。
    *   支持各类 DND 常用检定与伤害投掷。
    
*   **📜 法术与物品 (Spells & Items)**
    *   法术列表查阅与施法管理。
    *   物品背包与装备管理。
    
*   **⚙️ 高度可配置 (Highly Configurable)**
    *   支持自定义主题与布局。
    *   通过 JSON 配置文件进行深度定制。

## 安装说明 (Installation)

1.  确保您的浏览器已安装 Userscript 管理器（如 Tampermonkey 或 Violentmonkey）。
2.  获取最新版本的脚本文件（通常为 `dist/DND_Dashboard_Immersive.user.js`）。
3.  在 Userscript 管理器中安装该脚本。
4.  打开 SillyTavern，脚本应会自动加载。

## 开发指南 (Development)

本项目使用 Webpack 进行构建。

### 依赖安装

```bash
npm install
```

### 开发模式 (Watch Mode)

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request 来改进本项目！

## 许可证 (License)

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件（如有）。

---

*Author: Niccole*
