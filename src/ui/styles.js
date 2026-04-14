// src/ui/styles.js
import { getCore } from '../core/Utils.js';

const SCRIPT_ID = 'dnd_immersive_dashboard';

export const addStyles = () => {
    const { $, window: coreWin } = getCore();
    if (!$) return;
    const doc = coreWin?.document || document;
    const $root = coreWin?.jQuery || $;
    if ($root(doc).find(`#${SCRIPT_ID}-styles`).length) return;
    
    const css = `
        :root {
            /* ====== 颜色变量 ====== */
            --dnd-bg-main: #0f0b0a;
            --dnd-bg-panel-start: #2b1b17;
            --dnd-bg-panel-end: #1a100e;
            --dnd-bg-card-start: #242424;
            --dnd-bg-card-end: #1a1a1c;
            --dnd-bg-panel: linear-gradient(to bottom, var(--dnd-bg-panel-start), var(--dnd-bg-panel-end));
            --dnd-bg-card: linear-gradient(135deg, var(--dnd-bg-card-start) 0%, var(--dnd-bg-card-end) 100%);
            --dnd-bg-hud: linear-gradient(to bottom, var(--dnd-bg-panel-start), var(--dnd-bg-panel-end));
            --dnd-bg-popup: linear-gradient(to bottom, rgba(28, 28, 30, 0.99), rgba(18, 18, 20, 0.99));
            --dnd-bg-item: rgba(255,255,255,0.03);
            --dnd-bg-slot: rgba(0, 0, 0, 0.5);
            --dnd-border-gold: #9d8b6c;
            --dnd-border-inner: #5c4b35;
            --dnd-text-main: #dcd0c0;
            --dnd-text-header: #e6dcca;
            --dnd-text-highlight: #ffdb85;
            --dnd-text-dim: #888;
            --dnd-accent-red: #8a2c2c;
            --dnd-accent-green: #3a6b4a;
            --dnd-accent-blue: #2c4c8a;
            --dnd-shadow: 0 0 10px rgba(0,0,0,0.8);
            
            /* ====== 字体变量 ====== */
            --dnd-font-serif: 'Times New Roman', 'Songti SC', 'SimSun', serif;
            --dnd-font-sans: 'Segoe UI', 'Microsoft YaHei', sans-serif;
            --dnd-font-size-xs: 10px;
            --dnd-font-size-sm: 12px;
            --dnd-font-size-md: 14px;
            --dnd-font-size-lg: 16px;
            --dnd-font-size-xl: 18px;
            
            /* ====== 圆角变量 ====== */
            --dnd-radius-sm: 4px;
            --dnd-radius-md: 6px;
            --dnd-radius-lg: 8px;
            
            /* ====== 间距变量 ====== */
            --dnd-spacing-xs: 4px;
            --dnd-spacing-sm: 8px;
            --dnd-spacing-md: 12px;
            --dnd-spacing-lg: 20px;
            
            /* ====== 阴影变量 ====== */
            --dnd-shadow-sm: 0 2px 5px rgba(0,0,0,0.4);
            --dnd-shadow-md: 0 4px 15px rgba(0,0,0,0.5);
            --dnd-shadow-lg: 0 8px 25px rgba(0,0,0,0.6);
            
            /* ====== 过渡动画变量 ====== */
            --dnd-transition-fast: 0.15s ease;
            --dnd-transition-normal: 0.25s ease;
            --dnd-transition-slow: 0.4s ease;
            
            /* ====== 形态变量 (Morphology) ====== */
            /* 边框形态 */
            --dnd-border-style: solid;
            --dnd-border-width: 1px;
            --dnd-border-double-width: 3px;
            --dnd-border-outer-style: solid;
            
            /* 角部形态: 'rounded' | 'chamfer' | 'notched' | 'angular' */
            --dnd-corner-clip: none;
            --dnd-card-clip-path: none;
            
            /* 卡片形态 */
            --dnd-card-shape: rectangle;
            --dnd-card-aspect-ratio: auto;
            --dnd-card-skew: 0deg;
            --dnd-card-perspective: none;
            --dnd-card-decoration: none;
            
            /* 装饰元素 */
            --dnd-corner-ornament: none;
            --dnd-divider-style: solid;
            --dnd-divider-ornament: none;
            --dnd-header-decoration: none;
            
            /* 特效层 */
            --dnd-effect-overlay: none;
            --dnd-effect-inner-glow: none;
            --dnd-effect-border-glow: none;
            --dnd-effect-emboss: none;
            --dnd-effect-texture: none;
            
            /* 布局密度 */
            --dnd-layout-density: normal;
            --dnd-card-min-width: 280px;
            --dnd-card-max-width: 1fr;
            --dnd-grid-gap: 15px;
            
            /* 图标容器形态 */
            --dnd-icon-shape: circle;
            --dnd-icon-border-style: solid;
            --dnd-avatar-shape: circle;
            
            /* 按钮形态 */
            --dnd-btn-shape: rounded;
            --dnd-btn-style: filled;
            
            /* 进度条形态 */
            --dnd-bar-shape: rounded;
            --dnd-bar-style: gradient;
            --dnd-bar-segments: 0;
            
            /* ====== 功能性颜色变量 ====== */
            /* 进度条颜色 */
            --dnd-bar-hp-start: #8a2c2c;
            --dnd-bar-hp-end: #c0392b;
            --dnd-bar-exp-start: #8e44ad;
            --dnd-bar-exp-end: #9b59b6;
            --dnd-bar-bg: #222;
            
            /* 装饰元素颜色 */
            --dnd-ornament-color: var(--dnd-border-gold);
            --dnd-logo-bg-start: #2a2a2e;
            --dnd-logo-bg-end: #1a1a1c;
            
            /* 次要背景色 */
            --dnd-bg-secondary: #222;
            --dnd-bg-tertiary: #333;
            --dnd-bg-input: #1a1a1c;
            --dnd-border-subtle: #444;
            
            /* 稀有度颜色 */
            --dnd-rarity-common-bg: #555;
            --dnd-rarity-common-text: #ccc;
            --dnd-rarity-uncommon-bg: #1a5c1a;
            --dnd-rarity-uncommon-text: #5f5;
            --dnd-rarity-rare-bg: #1a3a6c;
            --dnd-rarity-rare-text: #5af;
            --dnd-rarity-veryrare-bg: #5c1a5c;
            --dnd-rarity-veryrare-text: #f5f;
            --dnd-rarity-legendary-bg: #6c4a1a;
            --dnd-rarity-legendary-text: #fa5;
            
            /* Toast/通知颜色 */
            --dnd-toast-info: #3498db;
            --dnd-toast-success: #2ecc71;
            --dnd-toast-warning: #f39c12;
            --dnd-toast-error: #e74c3c;
            
            /* 反色文本 (用于亮背景) */
            --dnd-text-inverse: #000;
            --dnd-text-inverse-dark: #2b1b17;
            
            /* ====== 交互状态变量 (Interactive States) ====== */
            /* 悬浮效果 (Hover) */
            --dnd-hover-brightness: 1.1;
            --dnd-hover-scale: 1.02;
            --dnd-hover-lift: -3px;
            --dnd-hover-shadow: 0 8px 25px rgba(0,0,0,0.4);
            --dnd-hover-border-color: var(--dnd-border-gold);
            --dnd-hover-glow: none;
            --dnd-hover-transition: var(--dnd-transition-normal);
            
            /* 卡片悬浮 */
            --dnd-card-hover-transform: translateY(-8px) rotateX(3deg) rotateY(-2deg) scale(1.02);
            --dnd-card-hover-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(157, 139, 108, 0.15);
            --dnd-card-hover-border-color: var(--dnd-border-gold);
            
            /* 按钮悬浮 */
            --dnd-btn-hover-brightness: 1.15;
            --dnd-btn-hover-transform: translateY(-2px);
            --dnd-btn-hover-shadow: 0 4px 12px rgba(0,0,0,0.3);
            
            /* 点击效果 (Active/Pressed) */
            --dnd-active-scale: 0.96;
            --dnd-active-brightness: 0.95;
            --dnd-active-transform: translateY(1px) scale(0.96);
            --dnd-active-shadow: 0 2px 5px rgba(0,0,0,0.3);
            
            /* 按钮点击 */
            --dnd-btn-active-transform: translateY(0) scale(0.98);
            --dnd-btn-active-shadow: 0 1px 3px rgba(0,0,0,0.2);
            
            /* 选中状态 (Selected/Active Class) */
            --dnd-selected-bg: linear-gradient(90deg, rgba(157, 139, 108, 0.2), transparent);
            --dnd-selected-border-color: var(--dnd-text-highlight);
            --dnd-selected-border-width: 2px;
            --dnd-selected-glow: 0 0 10px rgba(157, 139, 108, 0.3);
            --dnd-selected-text-color: var(--dnd-text-highlight);
            
            /* 导航选中 */
            --dnd-nav-active-bg: linear-gradient(90deg, rgba(157, 139, 108, 0.2), transparent);
            --dnd-nav-active-border: 3px solid var(--dnd-text-highlight);
            --dnd-nav-active-indicator: var(--dnd-text-highlight);
            
            /* 聚焦状态 (Focus) */
            --dnd-focus-border-color: var(--dnd-border-gold);
            --dnd-focus-shadow: 0 0 0 3px rgba(157, 139, 108, 0.2);
            --dnd-focus-outline: none;
            
            /* 禁用状态 (Disabled) */
            --dnd-disabled-opacity: 0.5;
            --dnd-disabled-cursor: not-allowed;
            --dnd-disabled-filter: grayscale(0.5);
            
            /* 图标悬浮光晕 */
            --dnd-icon-hover-glow: drop-shadow(0 0 5px currentColor);
            --dnd-icon-hover-scale: 1.1;
            
            /* 输入框聚焦 */
            --dnd-input-focus-border: var(--dnd-border-gold);
            --dnd-input-focus-shadow: 0 0 0 2px rgba(157, 139, 108, 0.15);
        }

        /* 网格布局 */
        .dnd-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
            gap: 15px !important;
            padding: 10px !important;
        }

        /* 卡片通用样式 */
        .dnd-char-card {
            background: var(--dnd-bg-card) !important;
            /* Morphology: Border */
            border: var(--dnd-border-width, 1px) var(--dnd-border-style, solid) var(--dnd-border-inner) !important;
            outline: var(--dnd-border-outer-style, none) !important; /* Outer border simulation */
            border-radius: var(--dnd-radius-md, 6px) !important;
            overflow: hidden !important;
            transition: all var(--dnd-transition-normal, 0.2s) !important;
            /* Combine standard shadow with glow effects */
            box-shadow: var(--dnd-shadow-md, 0 4px 15px rgba(0,0,0,0.3)), var(--dnd-effect-border-glow, none), var(--dnd-effect-inner-glow, none) !important;
            display: flex !important;
            flex-direction: column !important;
            
            /* Morphology: Shape & Transform */
            clip-path: var(--dnd-card-clip-path, none) !important;
            transform: var(--dnd-card-transform, none) !important;
            position: relative !important;
        }
        
        /* Morphology: Texture & Effects Layer */
        .dnd-char-card::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0;
            background: var(--dnd-effect-texture, none) !important;
            opacity: 1 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            mix-blend-mode: overlay !important;
        }
        .dnd-char-card::after {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0;
            background: var(--dnd-effect-overlay, none) !important;
            opacity: 1 !important;
            pointer-events: none !important;
            z-index: 1 !important;
        }
        
        .dnd-char-card:hover {
            border-color: var(--dnd-card-hover-border-color, var(--dnd-border-gold)) !important;
            /* Preserve transform but allow hover lift if not using complex transform */
            transform: var(--dnd-card-hover-transform, translateY(-4px)) !important;
            box-shadow: var(--dnd-card-hover-shadow, 0 8px 25px rgba(0,0,0,0.5)) !important;
            z-index: 10 !important;
        }

        /* 风格选择卡片 - 支持 Morphology */
        .dnd-style-card {
            padding: 12px !important;
            background: var(--dnd-bg-card) !important;
            /* Morphology Support */
            border: var(--dnd-border-width, 1px) var(--dnd-border-style, solid) var(--dnd-border-subtle) !important;
            border-radius: var(--dnd-radius-md, 6px) !important;
            cursor: pointer !important;
            text-align: center !important;
            transition: all 0.2s !important;
            position: relative !important;
            overflow: hidden !important;
            
            /* Morphology Shape */
            clip-path: var(--dnd-card-clip-path, none) !important;
            transform: var(--dnd-card-transform, none) !important;
        }
        
        /* 纹理叠加 */
        .dnd-style-card::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0;
            background: var(--dnd-effect-texture, none) !important;
            opacity: 0.5 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            mix-blend-mode: overlay !important;
        }
        
        .dnd-style-card.active {
            background: var(--dnd-selected-bg) !important;
            border-color: var(--dnd-border-gold) !important;
        }
        
        .dnd-style-card:hover {
            border-color: var(--dnd-border-gold) !important;
            transform: var(--dnd-card-transform, none) translateY(-2px) !important;
        }

        .dnd-card-header {
            padding: 10px 12px !important;
            background: rgba(255,255,255,0.03) !important;
            border-bottom: 1px var(--dnd-divider-style, solid) var(--dnd-border-inner) !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            position: relative !important;
            z-index: 2 !important; /* Ensure content is above effects */
        }
        .dnd-char-name {
            font-family: var(--dnd-font-serif) !important;
            font-size: 16px !important;
            font-weight: bold !important;
            color: var(--dnd-text-header) !important;
            text-shadow: 0 0 5px rgba(0,0,0,0.5) !important;
        }
        .dnd-char-lvl {
            font-size: 11px !important;
            color: var(--dnd-text-dim) !important;
            margin-top: 2px !important;
        }

        .dnd-card-body {
            padding: 12px !important;
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            color: var(--dnd-text-main) !important;
            font-size: 13px !important;
            position: relative !important;
            z-index: 2 !important; /* Ensure content is above effects */
        }

        /* 属性行 */
        .dnd-stat-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 4px 8px !important;
            background: rgba(0,0,0,0.2) !important;
            border-radius: 4px !important;
        }
        .dnd-stat-label { color: var(--dnd-text-dim) !important; font-size: 12px !important; }
        .dnd-stat-val { font-weight: bold !important; color: var(--dnd-text-highlight) !important; }

        /* 进度条 */
        .dnd-bar-container {
            height: 6px !important;
            background: rgba(0,0,0,0.5) !important;
            border-radius: 3px !important;
            overflow: hidden !important;
            margin-top: 2px !important;
        }
        .dnd-bar-fill { height: 100% !important; border-radius: 3px !important; transition: width 0.3s !important; }
        .dnd-bar-hp .dnd-bar-fill { background: linear-gradient(90deg, var(--dnd-bar-hp-start), var(--dnd-bar-hp-end)) !important; }
        .dnd-bar-exp .dnd-bar-fill { background: linear-gradient(90deg, var(--dnd-bar-exp-start), var(--dnd-bar-exp-end)) !important; }

        /* 导航侧边栏 */
        .dnd-nav-sidebar {
            width: 200px !important;
            background: var(--dnd-bg-hud) !important;
            border-right: var(--dnd-border-width, 1px) var(--dnd-divider-style, solid) var(--dnd-border-inner) !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 10px 0 !important;
            flex-shrink: 0 !important;
            position: relative !important;
            
            /* Morphology support */
            background-image: var(--dnd-effect-texture, none) !important;
        }
        
        /* 侧边栏纹理层 */
        .dnd-nav-sidebar::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0 !important;
            background: var(--dnd-effect-overlay, none) !important;
            pointer-events: none !important;
            z-index: 0 !important;
        }
        
        .dnd-nav-item {
            padding: 12px 20px !important;
            cursor: pointer !important;
            color: var(--dnd-text-main) !important;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            border-left: var(--dnd-border-width, 3px) solid transparent !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            font-size: 14px !important;
            position: relative !important;
            z-index: 1 !important;
            overflow: hidden !important;
            
            /* Morphology support */
            border-radius: 0 var(--dnd-radius-md, 6px) var(--dnd-radius-md, 6px) 0 !important;
            margin-bottom: 2px !important;
        }
        
        /* 导航项悬停 - 更加明显的滑动光效 */
        .dnd-nav-item::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(90deg, rgba(157, 139, 108, 0.15), transparent) !important;
            transform: translateX(-100%) !important;
            transition: transform 0.3s ease-out !important;
            z-index: -1 !important;
        }
        .dnd-nav-item:hover::before {
            transform: translateX(0) !important;
        }
        
        .dnd-nav-item:hover {
            color: var(--dnd-selected-text-color, var(--dnd-text-highlight)) !important;
            padding-left: 25px !important; /* 悬停时轻微右移 */
            text-shadow: 0 0 8px rgba(255, 219, 133, 0.4) !important;
        }
        
        .dnd-nav-item.active {
            background: var(--dnd-nav-active-bg, linear-gradient(90deg, rgba(157, 139, 108, 0.2), transparent)) !important;
            border-left-color: var(--dnd-nav-active-indicator, var(--dnd-border-gold)) !important;
            color: var(--dnd-selected-text-color, var(--dnd-text-highlight)) !important;
            text-shadow: 0 0 10px rgba(255, 219, 133, 0.6) !important;
            font-weight: bold !important;
        }
        
        /* 选中状态的光晕 */
        .dnd-nav-item.active::after {
            content: "" !important;
            position: absolute !important;
            left: 0; top: 0; bottom: 0;
            width: 4px;
            background: var(--dnd-nav-active-indicator, var(--dnd-border-gold)) !important;
            box-shadow: var(--dnd-selected-glow, 0 0 15px var(--dnd-border-gold)) !important;
        }

        /* 内容区域 */
        .dnd-content-area {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 20px !important;
            background: var(--dnd-bg-main) !important;
        }

        /* 滚动条美化 */
        .dnd-detail-body::-webkit-scrollbar,
        .dnd-content-area::-webkit-scrollbar,
        .dnd-hud-party-stats::-webkit-scrollbar,
        .dnd-party-list::-webkit-scrollbar,
        .dnd-hud-minimap::-webkit-scrollbar {
            width: 6px !important;
            height: 6px !important;
        }
        .dnd-detail-body::-webkit-scrollbar-track,
        .dnd-content-area::-webkit-scrollbar-track,
        .dnd-hud-party-stats::-webkit-scrollbar-track,
        .dnd-party-list::-webkit-scrollbar-track,
        .dnd-hud-minimap::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.2) !important;
        }
        .dnd-detail-body::-webkit-scrollbar-thumb,
        .dnd-content-area::-webkit-scrollbar-thumb,
        .dnd-hud-party-stats::-webkit-scrollbar-thumb,
        .dnd-party-list::-webkit-scrollbar-thumb,
        .dnd-hud-minimap::-webkit-scrollbar-thumb {
            background: var(--dnd-border-inner) !important;
            border-radius: 3px !important;
        }
        .dnd-detail-body::-webkit-scrollbar-thumb:hover,
        .dnd-content-area::-webkit-scrollbar-thumb:hover,
        .dnd-hud-party-stats::-webkit-scrollbar-thumb:hover,
        .dnd-party-list::-webkit-scrollbar-thumb:hover,
        .dnd-hud-minimap::-webkit-scrollbar-thumb:hover {
            background: var(--dnd-border-gold) !important;
        }

        /* 角色详情卡入场动画 */
        @keyframes dnd-card-in {
            0% {
                opacity: 0;
                transform: scale(0.92) translateY(-15px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        /* [新增] 淡出动画 */
        @keyframes dnd-fade-out {
            0% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                opacity: 0;
                transform: scale(0.95);
            }
        }
        
        @keyframes dnd-slide-out-left {
            0% {
                opacity: 1;
                transform: translateX(0);
            }
            100% {
                opacity: 0;
                transform: translateX(-30px);
            }
        }

        /* 角色详情卡 - 动态定位版本 (使用 block 布局) */
        .dnd-char-detail-card {
            position: fixed !important;
            /* 不再使用固定的 top/left，由 JS 动态设置 */
            width: 380px !important;
            max-width: 92vw !important;
            max-height: 85vh !important;
            background: var(--dnd-bg-popup) !important;
            border: 1px solid var(--dnd-border-gold) !important;
            border-radius: 8px !important;
            box-shadow: var(--dnd-shadow) !important;
            z-index: 2147483643 !important; /* Raised above Dashboard */
            color: var(--dnd-text-main) !important;
            font-family: var(--dnd-font-sans) !important;
            overflow: hidden !important;
            
            display: none; /* 默认隐藏，使用 display none/block 方式 */
        }
        .dnd-char-detail-card.visible {
            display: block !important;
            animation: dnd-card-in 0.25s ease-out forwards !important;
        }

        .dnd-detail-header {
            padding: 10px 15px !important;
            background: linear-gradient(to right, var(--dnd-bg-card-end), var(--dnd-bg-main)) !important;
            border-bottom: 1px solid var(--dnd-border-inner) !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .dnd-detail-close {
            cursor: pointer !important;
            padding: 5px !important;
            color: var(--dnd-text-dim) !important;
        }
        .dnd-detail-close:hover { color: var(--dnd-text-highlight) !important; }

        .dnd-detail-info {
            flex: 1 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
        }
        .dnd-detail-name {
            font-size: 18px !important;
            font-weight: bold !important;
            color: var(--dnd-text-highlight) !important;
            font-family: var(--dnd-font-serif) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        .dnd-detail-sub {
            font-size: 12px !important;
            color: var(--dnd-text-dim) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        .dnd-detail-stats-row {
            display: flex !important;
            justify-content: space-between !important;
            font-size: 13px !important;
            text-align: center !important;
            margin-bottom: 10px !important;
            padding: 0 10px !important;
        }

        .dnd-detail-body {
            padding: 15px !important;
            overflow-y: auto !important;
            flex: 1 !important;
        }
        
        .dnd-attr-grid {
            display: grid !important;
            grid-template-columns: repeat(6, 1fr) !important;
            gap: 5px !important;
            margin: 15px 0 !important;
            background: rgba(0,0,0,0.3) !important;
            padding: 8px !important;
            border-radius: 4px !important;
        }
        .dnd-attr-box {
            text-align: center !important;
        }
        .dnd-attr-val { font-size: 14px !important; font-weight: bold !important; color: var(--dnd-text-header) !important; }
        .dnd-attr-mod { font-size: 10px !important; color: var(--dnd-text-dim) !important; }
        .dnd-attr-lbl { font-size: 9px !important; color: var(--dnd-text-dim) !important; margin-top: 2px !important; }

        .dnd-detail-section { margin-bottom: 15px !important; }
        .dnd-detail-title {
            font-size: 12px !important;
            color: var(--dnd-text-highlight) !important;
            border-bottom: 1px solid var(--dnd-border-inner) !important;
            padding-bottom: 3px !important;
            margin-bottom: 8px !important;
            display: flex !important;
            justify-content: space-between !important;
            cursor: pointer !important;
        }
        
        .dnd-tag-list { display: flex !important; flex-wrap: wrap !important; gap: 5px !important; }
        .dnd-tag {
            background: rgba(255,255,255,0.08) !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            cursor: pointer !important;
            border: 1px solid transparent !important;
            transition: all 0.2s !important;
        }
        .dnd-tag:hover, .dnd-tag.active {
            background: rgba(197, 160, 89, 0.2) !important;
            border-color: var(--dnd-border-gold) !important;
            color: var(--dnd-text-highlight) !important;
        }

        /* 入场动画 keyframes */
        @keyframes dnd-fade-scale-in {
            0% {
                opacity: 0;
                transform: scale(0.9) translateY(-10px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        @keyframes dnd-popup-in {
            0% {
                opacity: 0;
                transform: scale(0.85) translateY(-8px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        /* 详情悬浮窗遮罩层 - 用于捕获点击关闭 */
        .dnd-popup-backdrop {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: transparent !important;
            z-index: 2147483644 !important;
            display: none;
        }
        .dnd-popup-backdrop.visible {
            display: block !important;
        }

        /* 详情悬浮窗 */
        .dnd-detail-popup {
            position: fixed !important;
            background: var(--dnd-bg-panel) !important;
            border: 1px solid var(--dnd-border-gold) !important;
            padding: 12px !important;
            z-index: 2147483645 !important; /* Highest priority */
            box-shadow: 0 5px 25px rgba(0,0,0,0.9), var(--dnd-effect-border-glow, none) !important;
            width: auto !important;
            min-width: 200px !important;
            max-width: 90vw !important;
            color: var(--dnd-text-main) !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            display: none; /* 默认隐藏，不使用 !important 以便 JS 控制 */
        }
        .dnd-detail-popup.visible {
            display: block !important;
            animation: dnd-popup-in 0.2s ease-out forwards !important;
        }
        .dnd-detail-popup.dnd-measuring {
            display: block !important;
        }

        /* 全局重置 (针对 HUD 内部) */
        #dnd-dashboard-root *, 
        #dnd-mini-hud *,
        #dnd-tooltip * {
            box-sizing: border-box !important;
        }

        /* 主容器 - 浮动在页面上 */
        #dnd-dashboard-root {
            position: fixed !important;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.85) !important;
            z-index: 2147483642 !important;
            display: none;
            flex-direction: column;
            color: var(--dnd-text-main) !important;
            font-family: var(--dnd-font-sans) !important;
            backdrop-filter: blur(5px);
        }

        #dnd-dashboard-root.visible {
            display: flex !important;
        }
        
        #dnd-dashboard-root .dnd-main-container {
            display: flex !important;
            flex: 1 !important;
            overflow: hidden !important;
            width: 100% !important;
        }

        /* 物品列表面板 */
        .dnd-inventory-panel {
            position: fixed !important;
            background: var(--dnd-bg-panel) !important;
            border: 1px solid var(--dnd-border-gold) !important;
            border-radius: 6px !important;
            padding: 10px !important;
            z-index: 2147483645 !important;
            box-shadow: 0 5px 25px rgba(0,0,0,0.9) !important;
            width: 250px !important;
            max-width: 90vw !important;
            max-height: 60vh !important;
            overflow-y: auto !important;
            display: none;
            flex-direction: column !important;
            gap: 5px !important;
        }
        .dnd-inventory-panel.visible {
            display: flex !important;
            animation: dnd-popup-in 0.2s ease-out forwards !important;
        }
        .dnd-inv-panel-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-bottom: 1px solid var(--dnd-border-inner) !important;
            padding-bottom: 5px !important;
            margin-bottom: 5px !important;
            font-weight: bold !important;
            color: var(--dnd-text-header) !important;
        }
        .dnd-inv-list-item {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 6px 8px !important;
            background: var(--dnd-bg-item) !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            transition: background 0.2s !important;
            font-size: 13px !important;
        }
        .dnd-inv-list-item:hover {
            background: rgba(255,255,255,0.1) !important;
            color: var(--dnd-text-highlight) !important;
        }
        .dnd-inv-btn {
            background: rgba(0,0,0,0.3) !important;
            border: 1px solid var(--dnd-border-inner) !important;
            color: var(--dnd-text-main) !important;
            padding: 6px 12px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            font-size: 12px !important;
            flex: 1 !important;
            justify-content: center !important;
            transition: all 0.2s !important;
        }
        .dnd-inv-btn:hover {
            background: rgba(255,255,255,0.1) !important;
            border-color: var(--dnd-border-gold) !important;
            color: var(--dnd-text-highlight) !important;
        }

        /* 势力声望面板 */
        .dnd-faction-item {
            background: rgba(255,255,255,0.03) !important;
            border-bottom: 1px solid rgba(255,255,255,0.05) !important;
            padding: 10px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 5px !important;
        }
        .dnd-faction-item:last-child { border-bottom: none !important; }
        .dnd-faction-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            font-weight: bold !important;
        }
        .dnd-faction-rep-bar {
            height: 4px !important;
            background: var(--dnd-bar-bg) !important;
            border-radius: 2px !important;
            overflow: hidden !important;
            position: relative !important;
            margin-top: 4px !important;
        }
        .dnd-faction-rep-fill {
            height: 100% !important;
            transition: width 0.3s !important;
        }

        /* 简略版 HUD */
        #dnd-mini-hud {
            position: fixed !important;
            /* 移除 !important 以便 JS 覆盖，设置回退值 */
            top: 60px;
            left: 10px;
            width: 480px !important; /* 桌面端固定宽度 */
            max-width: 90vw !important;
            max-height: 85vh !important;
            display: flex !important;
            flex-direction: column !important;
            
            background: var(--dnd-bg-hud) !important;
            
            /* Morphology: Border */
            border: var(--dnd-border-width, 2px) var(--dnd-border-style, solid) var(--dnd-border-inner) !important;
            border-radius: var(--dnd-radius-lg, 8px) !important;
            box-shadow: 0 0 0 2px rgba(0,0,0,0.5), 0 0 0 4px var(--dnd-border-gold), var(--dnd-shadow), var(--dnd-effect-border-glow, none), var(--dnd-effect-inner-glow, none) !important;
            
            /* Morphology: Shape */
            clip-path: var(--dnd-card-clip-path, none) !important;
            
            overflow: visible !important;
            font-family: var(--dnd-font-sans) !important;
            z-index: 2147483640 !important; /* Lower than Dashboard */
            
            /* 动画初始状态 */
            opacity: 0 !important;
            transform: translateX(-30px) !important;
            pointer-events: none !important;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
            
            color: var(--dnd-text-main) !important;
            margin: 0 !important;
        }
        
        /* HUD 纹理层 */
        #dnd-mini-hud > .dnd-hud-body::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0 !important;
            background: var(--dnd-effect-texture, none) !important;
            opacity: 0.5 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            mix-blend-mode: overlay !important;
        }
        #dnd-mini-hud::before {
            content: '❖';
            position: absolute;
            top: 4px;
            left: 4px;
            color: var(--dnd-ornament-color);
            font-size: 14px;
            pointer-events: none;
            z-index: 10;
        }
        #dnd-mini-hud::after {
            content: '❖';
            position: absolute;
            top: 4px;
            right: 4px;
            color: var(--dnd-ornament-color);
            font-size: 14px;
            pointer-events: none;
            z-index: 10;
        }
        #dnd-mini-hud.visible {
            opacity: 1 !important;
            transform: translateX(0) !important;
            pointer-events: auto !important;
        }
        
        /* 任务悬浮详情 */
        .dnd-quest-tooltip {
            position: fixed !important;
            background: var(--dnd-bg-panel) !important;
            border: 1px solid var(--dnd-border-gold) !important;
            padding: 15px !important;
            z-index: 2147483645 !important; /* Highest priority */
            box-shadow: 0 5px 25px rgba(0,0,0,0.9) !important;
            width: 300px !important;
            max-width: 90vw !important;
            display: none !important;
            color: var(--dnd-text-main) !important;
            border-radius: 4px !important;
        }
        .dnd-quest-tooltip.visible { 
            display: block !important; 
            animation: dnd-popup-in 0.2s ease-out forwards !important;
        }

        /* HUD 顶部栏 */
        .dnd-hud-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important; /* 改为居中对齐，更美观 */
            padding: 10px 15px !important; /* 增加内边距 */
            background: linear-gradient(to right, rgba(var(--dnd-border-inner-rgb, 92, 75, 53), 0.1), transparent) !important;
            border-bottom: 1px solid var(--dnd-border-inner) !important;
            font-size: 14px !important;
            color: var(--dnd-text-main) !important;
            line-height: normal !important;
            flex-shrink: 0 !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important; /* 增加阴影 */
        }
        .dnd-hud-status { 
            display: flex !important; 
            flex-direction: column !important; 
            gap: 2px !important; 
            flex: 1 !important; 
            overflow: hidden !important; 
            min-width: 0 !important; 
            margin-left: 12px !important; /* 与 Logo 保持距离 */
        }
        
        /* Logo 容器 */
        #dnd-logo-container {
            width: 42px !important;
            height: 42px !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, var(--dnd-logo-bg-start) 0%, var(--dnd-logo-bg-end) 100%) !important;
            border: 2px solid var(--dnd-border-gold) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 0 10px rgba(var(--dnd-border-gold-rgb, 157, 139, 108), 0.3) !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            flex-shrink: 0 !important;
        }
        #dnd-logo-container:hover {
            transform: scale(1.05) rotate(5deg) !important;
            box-shadow: 0 0 15px rgba(var(--dnd-border-gold-rgb, 157, 139, 108), 0.6) !important;
            border-color: var(--dnd-text-highlight) !important;
        }
        #dnd-logo-container:active {
            transform: scale(0.95) !important;
        }
        .dnd-logo-text {
            font-family: var(--dnd-font-serif) !important;
            font-weight: bold !important;
            font-size: 20px !important;
            color: var(--dnd-text-highlight) !important;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8) !important;
        }
        
        /* 位置文本样式优化 */
        .dnd-location-text {
            font-weight: bold !important;
            color: var(--dnd-text-highlight) !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            line-height: 1.4 !important;
            max-height: 1.4em !important;
            transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            word-break: break-word !important;
        }
        .dnd-location-text.dnd-expanded {
            -webkit-line-clamp: unset !important;
            max-height: 10em !important;
        }

        .dnd-hud-info-row {
            display: flex !important;
            align-items: center !important;
            font-size: 12px !important;
            color: var(--dnd-text-main) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            opacity: 0.9 !important;
        }
        
        .dnd-hud-expand-btn {
            background: transparent !important;
            border: 1px solid transparent !important;
            color: var(--dnd-text-highlight) !important;
            cursor: pointer !important;
            font-size: 12px !important;
            display: flex !important;
            align-items: center !important;
            gap: 5px !important;
            padding: 2px 8px !important;
            margin: 0 !important;
            line-height: normal !important;
            text-decoration: none !important;
            box-shadow: none !important;
            height: auto !important;
            width: auto !important;
        }
        .dnd-hud-expand-btn:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            border-color: var(--dnd-border-inner) !important;
            text-decoration: none !important;
        }

        /* HUD 内容区 */
        .dnd-hud-body { 
            padding: 10px 10px 0 10px !important; 
            overflow-y: auto !important; /* 内容超长时滚动 */
            flex: 1 !important;          /* 占据剩余空间 */
        }
        
        /* HUD 底部常驻资源栏 */
        .dnd-hud-footer {
            padding: 8px 10px !important;
            background: var(--dnd-bg-secondary) !important;
            border-top: 1px solid var(--dnd-border-subtle) !important;
            font-size: 11px !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .dnd-res-item { display: flex !important; align-items: center !important; gap: 4px !important; }
        .dnd-res-icon { opacity: 0.7 !important; }
        
        /* 队伍折叠面板 */
        .dnd-hud-party-collapse {
            background: var(--dnd-bg-tertiary) !important;
            border-top: 1px solid var(--dnd-border-subtle) !important;
        }
        .dnd-party-header {
            padding: 5px 10px !important;
            cursor: pointer !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            font-size: 11px !important;
            color: var(--dnd-text-dim) !important;
        }
        .dnd-party-header:hover { background: rgba(255,255,255,0.05) !important; color: var(--dnd-text-main) !important; }
        
        .dnd-party-list {
            padding: 5px 10px 10px 10px !important;
            display: none; /* 默认折叠 */
        }
        .dnd-party-list.expanded { display: block !important; }
        
        .dnd-party-detail-row {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            padding: 4px 0 !important;
            border-bottom: 1px dashed rgba(255,255,255,0.05) !important;
            font-size: 11px !important;
        }
        .dnd-party-detail-row:last-child { border-bottom: none !important; }

        /* 战斗模式布局 */
        .dnd-hud-combat-layout { display: flex !important; width: 100% !important; gap: 15px !important; }
        .dnd-hud-minimap {
            width: 180px !important;
            height: 180px !important;
            background: var(--dnd-bg-main) !important;
            border: 1px solid var(--dnd-border-gold) !important;
            border-radius: 6px !important;
            position: relative !important;
            flex-shrink: 0 !important;
            overflow: hidden !important;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.5) !important;
        }
        
        /* [新增] 地图内部容器样式 */
        .dnd-minimap-inner {
            /* [修复] 减少内阴影强度，使战斗地图不再过暗 */
            box-shadow: inset 0 0 20px rgba(0,0,0,0.4);
            transition: transform 0.2s ease-out;
        }
        /* [修复] 网格使用更低的透明度和更明亮的边框色，呈现透明线条效果 */
        .dnd-minimap-grid {
            opacity: 0.6;
            pointer-events: none;
        }

        /* [修改] 战斗列表限制高度与地图一致，允许滚动 */
        .dnd-hud-party-stats {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 5px !important;
            overflow-y: auto !important;
            min-width: 200px !important;
            max-height: 240px !important; /* 限制高度与地图组件近似 */
        }

        /* 迷你地图 Token 增强 */
        .dnd-minimap-token {
            position: absolute;
            border-radius: 50%;
            cursor: pointer;
            z-index: 10;
            /* 平滑移动过渡 */
            transition: left 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                        top 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                        width 0.3s, height 0.3s,
                        transform 0.2s;
            box-shadow: 0 3px 6px rgba(0,0,0,0.5);
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
            font-family: sans-serif !important;
        }
        .dnd-minimap-token:hover {
            transform: scale(1.2);
            z-index: 20;
            box-shadow: 0 6px 12px rgba(0,0,0,0.8);
        }
        
        /* 当前行动者光环特效 */
        .dnd-minimap-token.active::after {
            content: '';
            position: absolute;
            top: -6px; left: -6px; right: -6px; bottom: -6px;
            border: 1px dashed var(--dnd-border-gold);
            border-radius: 50%;
            animation: dnd-spin-slow 10s linear infinite;
            pointer-events: none;
        }
        .dnd-minimap-token.active::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(255, 219, 133, 0.6);
            animation: dnd-pulse-opacity 2s infinite;
            pointer-events: none;
        }
        
        @keyframes dnd-spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes dnd-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes dnd-pulse-opacity {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
        }

        /* 点击波纹 */
        @keyframes dnd-map-ripple {
            0% { transform: scale(0); opacity: 0.8; border-width: 4px; }
            100% { transform: scale(2.5); opacity: 0; border-width: 0; }
        }
        .dnd-map-ripple {
            position: absolute;
            border-radius: 50%;
            border: 2px solid var(--dnd-text-highlight);
            background: transparent;
            pointer-events: none;
            z-index: 50;
            animation: dnd-map-ripple 0.6s ease-out forwards;
            transform-origin: center center;
        }
        
        /* 探索模式布局 */
        .dnd-hud-explore-layout { display: flex !important; flex-direction: column !important; width: 100% !important; gap: 10px !important; }
        .dnd-hud-quests {
            background: linear-gradient(to right, var(--dnd-bg-tertiary), transparent) !important;
            padding: 8px !important;
            border-radius: 4px !important;
            border-left: 2px solid var(--dnd-border-gold) !important;
        }
        .dnd-hud-quest-item {
            display: flex !important; justify-content: space-between !important; font-size: 13px !important;
            padding: 4px 0 !important; border-bottom: 1px dashed var(--dnd-border-inner) !important;
            cursor: pointer !important;
        }
        .dnd-hud-quest-item:hover { color: var(--dnd-text-highlight) !important; background: var(--dnd-selected-bg) !important; }

        /* 行动按钮样式覆盖 */
        .dnd-action-btn {
            background: linear-gradient(to right, var(--dnd-bg-tertiary), var(--dnd-bg-secondary)) !important;
            border: 1px solid var(--dnd-border-inner) !important;
            color: var(--dnd-text-header) !important;
            border-left: 3px solid var(--dnd-border-gold) !important;
            border-radius: 4px !important;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            font-family: var(--dnd-font-serif) !important;
            position: relative !important;
            overflow: hidden !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
        }
        
        /* 按钮光泽扫过效果 */
        .dnd-action-btn::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent) !important;
            transition: left 0.5s !important;
        }
        .dnd-action-btn:hover::before {
            left: 100% !important;
        }

        .dnd-action-btn:hover {
            background: linear-gradient(to right, var(--dnd-selected-bg), var(--dnd-bg-tertiary)) !important;
            border-color: var(--dnd-text-highlight) !important;
            transform: translateX(4px) scale(1.02) !important;
            box-shadow: 0 4px 12px var(--dnd-border-inner), 0 0 10px var(--dnd-accent) !important;
            text-shadow: 0 0 5px var(--dnd-accent-hover) !important;
        }
        
        .dnd-action-btn:active {
            transform: translateX(2px) scale(0.98) !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.4) !important;
        }
        
        .dnd-hud-party-row { display: flex !important; gap: 10px !important; overflow-x: auto !important; padding-bottom: 5px !important; }
        
        /* 迷你角色条 */
        .dnd-mini-char {
            display: flex !important; align-items: center !important; gap: 10px !important;
            background: linear-gradient(to right, var(--dnd-bg-tertiary), transparent) !important;
            padding: 5px 10px !important; border-radius: 4px !important;
            border-left: 3px solid transparent !important;
            cursor: pointer !important;
            transition: background 0.2s !important;
            margin-bottom: 5px !important;
            border: 1px solid transparent !important;
        }
        .dnd-mini-char:hover {
            background: linear-gradient(to right, var(--dnd-selected-bg), transparent) !important;
            border-color: var(--dnd-border-gold) !important;
        }
        .dnd-mini-char.active {
            border-left-color: var(--dnd-text-highlight) !important;
            background: linear-gradient(to right, var(--dnd-selected-bg), transparent) !important;
        }
        
        .dnd-mini-char-avatar {
            width: 36px !important; height: 36px !important; border-radius: 50% !important; background: var(--dnd-bg-secondary) !important;
            border: 2px solid var(--dnd-border-gold) !important; display: flex !important; align-items: center !important; justify-content: center !important;
            font-size: 14px !important; color: var(--dnd-text-highlight) !important;
            flex-shrink: 0 !important;
            box-shadow: 0 0 5px rgba(0,0,0,0.5) !important;
        }

        .dnd-mini-char-info { flex: 1 !important; min-width: 120px !important; }
        .dnd-mini-name { font-size: 13px !important; font-weight: bold !important; color: var(--dnd-text-main) !important; }
        .dnd-mini-sub { font-size: 11px !important; color: var(--dnd-text-dim) !important; display: flex !important; gap: 8px !important; }

        .dnd-mini-bars { width: 80px !important; display: flex !important; flex-direction: column !important; gap: 3px !important; flex-shrink: 0 !important; }
        .dnd-micro-bar { height: 4px !important; background: var(--dnd-bar-bg) !important; border-radius: 2px !important; overflow: hidden !important; position: relative !important; }
        .dnd-micro-bar-fill { height: 100% !important; transition: width 0.3s !important; }
        .dnd-micro-bar.hp .dnd-micro-bar-fill { background: var(--dnd-accent-red) !important; }
        
        /* 顶部栏 */
        .dnd-top-bar {
            height: 60px !important;
            background: var(--dnd-bg-hud) !important;
            border-bottom: 2px solid var(--dnd-border-gold) !important;
            display: flex !important;
            align-items: center !important;
            padding: 0 20px !important;
            justify-content: space-between !important;
            box-shadow: var(--dnd-shadow-md) !important;
        }
        .dnd-title {
            font-family: var(--dnd-font-serif) !important;
            font-size: 24px !important;
            color: var(--dnd-text-highlight) !important;
            text-transform: uppercase !important;
            letter-spacing: 2px !important;
            text-shadow: 0 0 5px var(--dnd-text-highlight) !important;
        }
        .dnd-close-btn {
            background: transparent !important;
            border: 1px solid var(--dnd-border-gold) !important;
            color: var(--dnd-text-main) !important;
            padding: 5px 15px !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            font-family: var(--dnd-font-serif) !important;
        }
        .dnd-close-btn:hover {
            background: var(--dnd-border-gold) !important;
            color: var(--dnd-text-inverse) !important;
        }

            /* 悬浮按钮 - 左上角 + 动画 */
                #dnd-toggle-btn {
                    position: fixed !important;
                    top: 10px !important;
                    left: 10px !important;
                    bottom: auto !important; right: auto !important;
                    
                    width: 42px !important;
                    height: 42px !important;
                    background: var(--dnd-bg-hud) !important;
                    border: 2px solid var(--dnd-border-gold) !important;
                    border-radius: 50% !important;
                    color: var(--dnd-border-gold) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    z-index: 2147483641 !important;
                    box-shadow: var(--dnd-shadow-lg), inset 0 0 10px var(--dnd-bg-tertiary) !important;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                    font-size: 22px !important;
                    
                    opacity: 1 !important;
                    transform: scale(1) !important;
                    pointer-events: auto !important;
                    touch-action: none !important; /* 禁止浏览器默认触摸行为，确保拖拽流畅 */
                    user-select: none !important; /* 禁止文字选择 */
                    -webkit-user-select: none !important;
                }
            #dnd-toggle-btn:hover {
                background: var(--dnd-border-gold) !important;
                color: var(--dnd-text-inverse-dark) !important;
                transform: scale(1.1) rotate(90deg) !important;
                box-shadow: var(--dnd-selected-glow) !important;
            }
        #dnd-toggle-btn.dnd-hidden {
            opacity: 0 !important;
            transform: scale(0) !important;
            pointer-events: none !important;
        }
        #dnd-toggle-btn.dnd-force-hidden {
            opacity: 0 !important;
            transform: scale(0) !important;
            pointer-events: none !important;
        }
        #dnd-mini-hud.dnd-independent-mode {
            right: auto !important;
            bottom: auto !important;
        }
        #dnd-mini-hud.dnd-independent-mode .dnd-hud-header {
            cursor: move !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            touch-action: none !important;
        }
        #dnd-mini-hud.dnd-independent-mode #dnd-logo-container,
        #dnd-mini-hud.dnd-independent-mode .dnd-hud-expand-btn,
        #dnd-mini-hud.dnd-independent-mode #dnd-hud-toggle-bar {
            cursor: pointer !important;
        }

        /* 移动端角色卡片入场动画 */
        @keyframes dnd-card-in-mobile {
            0% {
                opacity: 0;
                transform: translateX(-50%) scale(0.92) translateY(-15px);
            }
            100% {
                opacity: 1;
                transform: translateX(-50%) scale(1) translateY(0);
            }
        }

        /* === 新增互动动效 === */
        
        /* 1. 列表项级联入场 */
        @keyframes dnd-slide-up-fade {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .dnd-anim-entry {
            opacity: 0; /* 初始隐藏，等待动画 */
            animation: dnd-slide-up-fade 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards !important;
        }
        /* 确保入场动画完成后卡片保持可见，不受主题动画影响 */
        .dnd-anim-entry.dnd-anim-done,
        .dnd-char-card.dnd-anim-done,
        .dnd-char-card.dnd-anim-done:hover {
            opacity: 1 !important;
        }
        /* 确保所有主题的卡片在 hover 时保持可见 */
        .dnd-char-card:hover {
            opacity: 1 !important;
        }

        /* HUD 专用微动效 */
        @keyframes dnd-hud-pop-in {
            0% { opacity: 0; transform: scale(0.95) translateY(5px); }
            60% { transform: scale(1.02); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dnd-hud-entry {
            opacity: 0;
            animation: dnd-hud-pop-in 0.3s ease-out forwards;
        }
        
        /* 呼吸光环 (用于当前行动者) */
        @keyframes dnd-pulse-border {
            0% { box-shadow: 0 0 0 0 var(--dnd-selected-glow); border-color: var(--dnd-border-gold); }
            70% { box-shadow: 0 0 0 6px transparent; border-color: var(--dnd-text-highlight); }
            100% { box-shadow: 0 0 0 0 transparent; border-color: var(--dnd-border-gold); }
        }
        .dnd-active-turn {
            animation: dnd-pulse-border 2s infinite !important;
        }
        

        /* 状态条流光效果 */
        @keyframes dnd-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        .dnd-bar-shimmer .dnd-micro-bar-fill, 
        .dnd-bar-shimmer .dnd-bar-fill {
            position: relative;
            overflow: hidden;
        }
        .dnd-bar-shimmer .dnd-micro-bar-fill::after,
        .dnd-bar-shimmer .dnd-bar-fill::after {
            content: "";
            position: absolute;
            top: 0; left: 0; width: 200%; height: 100%;
            background: linear-gradient(90deg, transparent 0%, var(--dnd-selected-bg) 50%, transparent 100%);
            animation: dnd-shimmer 10s infinite linear;
            transform: skewX(-20deg);
        }

        /* 2. 点击波纹/回弹反馈 */
        @keyframes dnd-pop-click {
            0% { transform: scale(1); }
            40% { transform: scale(0.95); }
            100% { transform: scale(1); }
        }
        .dnd-clicking {
            animation: dnd-pop-click 0.2s ease-out !important;
        }
        
        /* 通用可点击元素效果 (CSS active 态) */
        .dnd-clickable {
            transition: transform var(--dnd-hover-transition, 0.15s ease), background 0.2s, box-shadow 0.2s, border-color 0.2s !important;
            cursor: pointer !important;
        }
        .dnd-clickable:active {
            transform: var(--dnd-active-transform, scale(0.96)) !important;
        }
        .dnd-clickable:hover {
            filter: brightness(var(--dnd-hover-brightness, 1.1));
        }

        /* 3. 面板切换过渡 */
        @keyframes dnd-panel-in {
            0% { opacity: 0; transform: translateX(10px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        .dnd-panel-transition {
            animation: dnd-panel-in 0.3s ease-out;
        }

        /* 移动端/窄屏适配 */
        @media (max-width: 768px) {
            .dnd-char-detail-card {
                width: 94vw !important;
                max-height: calc(100vh - 20px) !important;
                /* 移动端固定定位：顶部10px，水平居中 */
                top: 10px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                right: auto !important;
                bottom: auto !important;
            }
            .dnd-char-detail-card.visible {
                animation: dnd-card-in-mobile 0.25s ease-out forwards !important;
            }
            
            /* 移动端悬浮详情窗 */
            .dnd-detail-popup {
                width: calc(100vw - 20px) !important;
                max-width: none !important;
                left: 10px !important;
                right: 10px !important;
                max-height: 80vh !important;
            }
            .dnd-attr-grid {
                grid-template-columns: repeat(3, 1fr) !important;
            }
            .dnd-detail-body {
                padding: 10px !important;
                font-size: 12px !important;
            }
            .dnd-detail-header {
                padding: 8px 12px !important;
            }
            
            #dnd-dashboard-root .dnd-main-container {
                flex-direction: column !important;
            }
            .dnd-nav-sidebar {
                width: 100% !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                padding: 5px !important;
                border-right: none !important;
                border-bottom: 1px solid var(--dnd-border-inner) !important;
                flex-shrink: 0 !important;
            }
            .dnd-nav-item {
                padding: 8px 12px !important;
                font-size: 14px !important;
                border-left: none !important;
                border-bottom: 3px solid transparent !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
            }
            .dnd-nav-item.active {
                border-bottom-color: var(--dnd-border-gold) !important;
                background: var(--dnd-selected-bg) !important;
            }
            .dnd-content-area {
                padding: 15px !important;
            }
            
            #dnd-mini-hud {
                /* 移动端强制居中靠上 */
                top: 10px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                width: 95vw !important;
                min-width: 0 !important;
            }
            #dnd-mini-hud.visible {
                transform: translateX(-50%) !important;
            }
        }

        /* 宽屏优化 */
        @media (min-width: 769px) {
            .dnd-attr-grid {
                grid-template-columns: repeat(6, 1fr) !important;
            }
            /* 确保侧边栏固定宽度 */
            .dnd-nav-sidebar {
                min-width: 200px !important;
                max-width: 200px !important;
            }
            /* 确保内容区域填充剩余空间 */
            .dnd-content-area {
                flex: 1 !important;
                min-width: 0 !important; /* 防止内容溢出 */
            }
        }

        /* Quick Access Bar - Attached to MiniHUD Right Border */
        .dnd-quick-trigger {
            position: absolute !important;
            left: 100%; /* Right of HUD */
            top: 60px;
            width: 16px;
            height: 40px;
            background: var(--dnd-bg-panel);
            border: 1px solid var(--dnd-border-gold);
            border-left: none;
            border-radius: 0 8px 8px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2147483639;
            font-size: 10px;
            color: var(--dnd-border-gold);
        }
        .dnd-quick-trigger:hover {
            background: var(--dnd-border-gold);
            color: var(--dnd-text-inverse);
        }

        .dnd-quick-bar {
            position: absolute !important;
            top: 0;
            left: 100%; /* Right border of HUD */
            width: 50px;
            height: auto;
            max-height: 100%;
            background: var(--dnd-bg-panel);
            border: 1px solid var(--dnd-border-gold);
            border-left: none;
            border-radius: 0 8px 8px 0;
            display: flex;
            flex-direction: column;
            padding: 5px;
            gap: 5px;
            overflow-y: auto;
            overflow-x: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: left center;
            transform: scaleX(0); /* Start hidden */
            opacity: 0;
            z-index: 2147483638;
        }
        
        .dnd-quick-bar.visible {
            transform: scaleX(1);
            opacity: 1;
        }

        /* Mobile Quick Bar Adjustment: Overlay from Right */
        @media (max-width: 768px) {
            .dnd-quick-bar {
                left: auto !important;
                right: 0 !important;
                transform-origin: right center !important;
                border-left: 1px solid var(--dnd-border-gold) !important;
                border-right: none !important;
                border-radius: 8px 0 0 8px !important;
                z-index: 2147483642 !important;
            }
            
            .dnd-quick-trigger {
                left: auto !important;
                right: 0 !important;
                border-left: 1px solid var(--dnd-border-gold) !important;
                border-right: none !important;
                border-radius: 4px 0 0 4px !important;
                transition: right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
                z-index: 2147483643 !important;
                /* Flip arrow direction on mobile */
                transform: rotate(180deg) !important;
            }
            
            .dnd-quick-bar.visible + .dnd-quick-trigger {
                right: 50px !important;
            }
        }

        /* HUD Party Bar */
        .dnd-hud-party-bar {
            display: flex !important;
            gap: 15px !important;
            overflow-x: auto !important;
            padding: 12px 10px !important;
            border-top: 1px solid var(--dnd-border-subtle) !important;
            background: var(--dnd-bg-secondary) !important;
        }
        .party-bar-item {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 4px !important;
            cursor: pointer !important;
            min-width: 48px !important;
            position: relative !important;
        }
        .party-avatar-container {
            width: 40px !important;
            height: 40px !important;
            border: 1px solid var(--dnd-border-gold) !important;
            border-radius: 50% !important;
            overflow: hidden !important;
            background: linear-gradient(135deg, var(--dnd-logo-bg-start) 0%, var(--dnd-logo-bg-end) 100%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .party-lvl-badge {
            position: absolute !important;
            bottom: -2px !important;
            right: -4px !important;
            background: var(--dnd-bg-tertiary) !important;
            border: 1px solid var(--dnd-border-gold) !important;
            color: var(--dnd-text-main) !important;
            font-size: 9px !important;
            padding: 0 3px !important;
            border-radius: 3px !important;
            font-weight: bold !important;
        }
        
        .party-control-btn {
            position: absolute;
            top: -5px;
            left: -5px;
            width: 18px;
            height: 18px;
            background: var(--dnd-bg-tertiary);
            border: 1px solid var(--dnd-border-subtle);
            border-radius: 50%;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
        }
        .party-bar-item:hover .party-control-btn {
            opacity: 1;
        }
        .party-control-btn.active {
            opacity: 1;
            border-color: var(--dnd-border-gold);
            background: var(--dnd-selected-bg);
        }

        /* Status Pills for Party Bar */
        .dnd-party-status-bar {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 2px !important;
            justify-content: center !important;
            margin-top: 2px !important;
            max-width: 60px !important;
        }
        .dnd-party-status-pill {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1px 4px !important;
            border-radius: 3px !important;
            font-size: 8px !important;
            font-weight: bold !important;
            gap: 2px !important;
            white-space: nowrap !important;
        }
        .dnd-party-status-pill.buff {
            background: rgba(58, 107, 74, 0.4) !important;
            border: 1px solid var(--dnd-accent-green) !important;
            color: #7fff7f !important;
        }
        .dnd-party-status-pill.debuff {
            background: rgba(138, 44, 44, 0.4) !important;
            border: 1px solid var(--dnd-accent-red) !important;
            color: #ff7f7f !important;
        }
        .dnd-party-status-pill i {
            font-size: 7px !important;
        }

        .dnd-item-damage {
            color: var(--dnd-accent-red);
            font-weight: bold;
            font-size: 12px;
        }
        .dnd-item-props {
            color: var(--dnd-text-dim);
            font-size: 11px;
            font-style: italic;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .dnd-item-rarity {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 3px;
            display: inline-block;
            margin-top: 2px;
        }
        .rarity-普通, .rarity-common { background: var(--dnd-rarity-common-bg); color: var(--dnd-rarity-common-text); }
        .rarity-非凡, .rarity-uncommon { background: var(--dnd-rarity-uncommon-bg); color: var(--dnd-rarity-uncommon-text); }
        .rarity-稀有, .rarity-rare { background: var(--dnd-rarity-rare-bg); color: var(--dnd-rarity-rare-text); }
        .rarity-极稀有, .rarity-veryrare { background: var(--dnd-rarity-veryrare-bg); color: var(--dnd-rarity-veryrare-text); }
        .rarity-传说, .rarity-legendary { background: var(--dnd-rarity-legendary-bg); color: var(--dnd-rarity-legendary-text); }

        .dnd-item-detail-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 0;
            border-bottom: 1px dashed rgba(255,255,255,0.1);
        }
        .dnd-item-detail-icon { width: 20px; text-align: center; }
        .dnd-item-detail-label { color: var(--dnd-text-dim); min-width: 60px; }
        .dnd-item-detail-value { color: var(--dnd-text-main); flex: 1; }
        
        .party-control-btn {
            position: absolute;
            top: -5px;
            left: -5px;
            width: 18px;
            height: 18px;
            background: var(--dnd-bg-tertiary);
            border: 1px solid var(--dnd-border-subtle);
            border-radius: 50%;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
        }
        .party-bar-item:hover .party-control-btn {
            opacity: 1;
        }
        .party-control-btn.active {
            opacity: 1;
            border-color: var(--dnd-border-gold);
            background: var(--dnd-selected-bg);
        }

        /* Dice Grid */
        .dnd-dice-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: var(--dnd-spacing-sm, 6px) !important;
        }
        .dnd-dice-btn {
            background: var(--dnd-bg-tertiary) !important;
            /* Morphology: Border */
            border: var(--dnd-border-width, 1px) var(--dnd-border-style, solid) var(--dnd-border-subtle) !important;
            color: var(--dnd-text-main) !important;
            padding: 10px 5px !important;
            /* Morphology: Radius */
            border-radius: var(--dnd-radius-sm, 4px) !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            font-size: 13px !important;
            font-weight: bold !important;
            text-align: center !important;
            position: relative !important;
            overflow: hidden !important;
            
            /* Morphology: Shape */
            clip-path: var(--dnd-card-clip-path, none) !important;
        }
        
        /* 骰子按钮纹理 */
        .dnd-dice-btn::after {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0 !important;
            background: var(--dnd-effect-texture, none) !important;
            opacity: 0.3 !important;
            pointer-events: none !important;
            mix-blend-mode: overlay !important;
        }
        
        .dnd-dice-btn:hover {
            border-color: var(--dnd-text-highlight) !important;
            color: var(--dnd-text-highlight) !important;
            transform: scale(1.05) !important;
        }

        .dnd-quick-slot {
            width: 48px;
            height: 48px;
            background: var(--dnd-bg-tertiary);
            /* Morphology: Border */
            border: var(--dnd-border-width, 1px) var(--dnd-border-style, solid) var(--dnd-border-inner);
            /* Morphology: Radius */
            border-radius: var(--dnd-radius-sm, 4px);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            font-size: 12px;
            font-weight: bold;
            color: var(--dnd-text-main);
            transition: all 0.2s;
            overflow: hidden;
            white-space: nowrap;
            text-align: center;
            
            /* Morphology: Shape */
            clip-path: var(--dnd-card-clip-path, none);
        }
        
        /* 快捷槽纹理 */
        .dnd-quick-slot::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: var(--dnd-effect-texture, none);
            opacity: 0.3;
            pointer-events: none;
            mix-blend-mode: overlay;
            z-index: 0;
        }
        
        .dnd-quick-slot:hover {
            border-color: var(--dnd-text-highlight);
            background: var(--dnd-selected-bg);
        }
        .dnd-quick-slot.add-btn {
            border: 1px dashed var(--dnd-border-inner) !important;
            color: var(--dnd-text-dim) !important;
            font-weight: bold;
            font-size: 24px;
        }
        .dnd-quick-slot.add-btn:hover {
            border-color: var(--dnd-text-highlight) !important;
            color: var(--dnd-text-highlight) !important;
        }
        
        .dnd-quick-slot-remove {
            position: absolute;
            top: -5px;
            right: -5px;
            width: 16px;
            height: 16px;
            background: var(--dnd-accent-red);
            border-radius: 50%;
            font-size: 10px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .dnd-quick-slot:hover .dnd-quick-slot-remove {
            opacity: 1;
        }

        /* Custom Dice Area */
        .dnd-dice-custom-area {
            margin-top: 10px !important;
            padding-top: 10px !important;
            border-top: 1px dashed var(--dnd-border-subtle) !important;
        }
        .dnd-dice-input-row {
            display: flex !important;
            gap: 5px !important;
        }
        .dnd-dice-input {
            flex: 1 !important;
            background: var(--dnd-bg-input) !important;
            border: 1px solid var(--dnd-border-subtle) !important;
            color: var(--dnd-text-main) !important;
            padding: 6px 10px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
        }
        .dnd-dice-submit-btn {
            background: var(--dnd-border-gold) !important;
            border: none !important;
            color: var(--dnd-text-inverse) !important;
            padding: 6px 12px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-weight: bold !important;
        }
        .dnd-dice-submit-btn:hover {
            filter: brightness(1.1) !important;
        }

        /* Markdown Styles */
        .dnd-md-h1 { font-size: 1.5em !important; font-weight: bold !important; color: var(--dnd-text-highlight) !important; margin: 0.5em 0 !important; }
        .dnd-md-h2 { font-size: 1.3em !important; font-weight: bold !important; color: var(--dnd-text-header) !important; margin: 0.4em 0 !important; }
        .dnd-md-h3 { font-size: 1.1em !important; font-weight: bold !important; color: var(--dnd-text-main) !important; margin: 0.3em 0 !important; }
        .dnd-md-pre { background: rgba(0,0,0,0.3) !important; padding: 10px !important; border-radius: 4px !important; overflow-x: auto !important; font-family: monospace !important; margin: 5px 0 !important; }
        .dnd-md-code { background: rgba(255,255,255,0.1) !important; padding: 2px 4px !important; border-radius: 3px !important; font-family: monospace !important; }
        .dnd-md-li { margin-left: 20px !important; list-style-type: disc !important; display: list-item !important; }

        /* ============================================
           自定义通知系统样式
           ============================================ */
        
        /* 通知容器 */
        #dnd-notification-container {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 2147483647 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            pointer-events: none !important;
            max-width: 400px !important;
        }

        /* Toast 通知样式 */
        .dnd-toast {
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 14px 16px !important;
            background: var(--dnd-bg-popup) !important;
            border: 1px solid var(--dnd-border-inner) !important;
            border-radius: 8px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4) !important;
            color: var(--dnd-text-main) !important;
            font-family: var(--dnd-font-sans) !important;
            font-size: 14px !important;
            pointer-events: auto !important;
            transform: translateX(120%) !important;
            opacity: 0 !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            backdrop-filter: blur(10px) !important;
        }
        .dnd-toast-visible {
            transform: translateX(0) !important;
            opacity: 1 !important;
        }
        .dnd-toast-exit {
            transform: translateX(120%) !important;
            opacity: 0 !important;
        }

        /* Toast 类型边框颜色 */
        .dnd-toast-info { border-left: 4px solid var(--dnd-toast-info) !important; }
        .dnd-toast-success { border-left: 4px solid var(--dnd-toast-success) !important; }
        .dnd-toast-warning { border-left: 4px solid var(--dnd-toast-warning) !important; }
        .dnd-toast-error { border-left: 4px solid var(--dnd-toast-error) !important; }

        .dnd-toast-icon {
            font-size: 20px !important;
            flex-shrink: 0 !important;
            line-height: 1 !important;
        }

        .dnd-toast-content {
            flex: 1 !important;
            min-width: 0 !important;
        }

        .dnd-toast-title {
            font-weight: bold !important;
            color: var(--dnd-text-header) !important;
            margin-bottom: 4px !important;
        }

        .dnd-toast-message {
            color: var(--dnd-text-main) !important;
            line-height: 1.4 !important;
            word-break: break-word !important;
        }

        .dnd-toast-close {
            background: transparent !important;
            border: none !important;
            color: var(--dnd-text-dim) !important;
            font-size: 18px !important;
            cursor: pointer !important;
            padding: 0 !important;
            line-height: 1 !important;
            opacity: 0.6 !important;
            transition: opacity 0.2s !important;
        }
        .dnd-toast-close:hover {
            opacity: 1 !important;
            color: var(--dnd-text-highlight) !important;
        }

        /* 对话框容器 */
        #dnd-dialog-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 2147483646 !important;
            pointer-events: none !important;
        }

        /* 对话框背景遮罩 - Flex 居中容器 */
        .dnd-dialog-backdrop {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.7) !important;
            backdrop-filter: blur(3px) !important;
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
            pointer-events: auto !important;
            /* Flex 居中 - 最暴力的居中方式 */
            display: none !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 20px !important;
            box-sizing: border-box !important;
        }
        .dnd-dialog-backdrop-visible {
            opacity: 1 !important;
            display: flex !important;
        }

        /* 对话框主体 - 由 backdrop flex 容器居中，不再依赖 fixed/top/transform */
        .dnd-dialog {
            position: relative !important;
            min-width: 280px !important;
            max-width: min(90vw, 450px) !important;
            max-height: 80vh !important;
            background: var(--dnd-bg-popup) !important;
            /* Morphology: Border */
            border: var(--dnd-border-width, 1px) var(--dnd-border-style, solid) var(--dnd-border-gold) !important;
            /* Morphology: Radius */
            border-radius: var(--dnd-radius-lg, 10px) !important;
            box-shadow: var(--dnd-shadow-lg), var(--dnd-selected-glow), var(--dnd-effect-border-glow, none) !important;
            color: var(--dnd-text-main) !important;
            font-family: var(--dnd-font-sans) !important;
            opacity: 0 !important;
            transform: scale(0.9) !important;
            transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            pointer-events: auto !important;
            
            /* 三段式 Flex 布局 - 确保内容正确滚动 */
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            /* 禁止主题的 clip-path 裁切对话框 */
            clip-path: none !important;
        }
        
        /* 对话框纹理层 */
        .dnd-dialog::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0 !important;
            background: var(--dnd-effect-texture, none) !important;
            opacity: 0.3 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            mix-blend-mode: overlay !important;
        }
        /* 可见状态 */
        .dnd-dialog-visible {
            opacity: 1 !important;
            transform: scale(1) !important;
        }

        /* 对话框类型 */
        .dnd-dialog-warning .dnd-dialog-header {
            border-bottom-color: var(--dnd-toast-warning) !important;
        }
        .dnd-dialog-danger .dnd-dialog-header {
            border-bottom-color: var(--dnd-toast-error) !important;
        }
        .dnd-dialog-danger .dnd-dialog-btn-confirm {
            background: linear-gradient(135deg, var(--dnd-toast-error), var(--dnd-accent-red)) !important;
        }

        /* 对话框头部 */
        .dnd-dialog-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 16px 20px !important;
            background: var(--dnd-bg-secondary) !important;
            border-bottom: 1px solid var(--dnd-border-gold) !important;
            /* 三段式布局：头部固定高度，不参与滚动 */
            flex-shrink: 0 !important;
            min-height: 0 !important;
        }

        .dnd-dialog-title {
            font-size: 16px !important;
            font-weight: bold !important;
            color: var(--dnd-text-highlight) !important;
            font-family: var(--dnd-font-serif) !important;
        }

        .dnd-dialog-close {
            background: transparent !important;
            border: none !important;
            color: var(--dnd-text-dim) !important;
            font-size: 24px !important;
            cursor: pointer !important;
            padding: 0 !important;
            line-height: 1 !important;
            transition: color 0.2s !important;
        }
        .dnd-dialog-close:hover {
            color: var(--dnd-text-highlight) !important;
        }

        /* 对话框内容 */
        .dnd-dialog-body {
            padding: 20px !important;
            /* 三段式布局：body 占据剩余空间，内容超出时滚动 */
            flex: 1 !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
        }

        .dnd-dialog-message {
            font-size: 14px !important;
            line-height: 1.6 !important;
            color: var(--dnd-text-main) !important;
            margin: 0 0 15px 0 !important;
            /* 使 TemplateSync 的 \n\n 换行符可读 */
            white-space: pre-line !important;
            word-break: break-word !important;
        }

        /* 对话框输入框 */
        .dnd-dialog-input {
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 10px 14px !important;
            background: var(--dnd-bg-input) !important;
            border: 1px solid var(--dnd-border-inner) !important;
            border-radius: 6px !important;
            color: var(--dnd-text-main) !important;
            font-size: 14px !important;
            font-family: var(--dnd-font-sans) !important;
            outline: none !important;
            transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .dnd-dialog-input:focus {
            border-color: var(--dnd-border-gold) !important;
            box-shadow: var(--dnd-focus-shadow) !important;
        }
        .dnd-dialog-input::placeholder {
            color: var(--dnd-text-dim) !important;
        }

        /* 对话框底部 */
        .dnd-dialog-footer {
            display: flex !important;
            justify-content: flex-end !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            padding: 16px 20px !important;
            background: var(--dnd-bg-secondary) !important;
            border-top: 1px solid var(--dnd-border-subtle) !important;
            /* 三段式布局：底部固定高度，不参与滚动 */
            flex-shrink: 0 !important;
            min-height: 0 !important;
        }

        /* 对话框按钮 */
        .dnd-dialog-btn {
            padding: 10px 20px !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            border: none !important;
        }

        .dnd-dialog-btn-cancel {
            background: var(--dnd-bg-tertiary) !important;
            color: var(--dnd-text-main) !important;
            border: 1px solid var(--dnd-border-subtle) !important;
        }
        .dnd-dialog-btn-cancel:hover {
            background: var(--dnd-selected-bg) !important;
            border-color: var(--dnd-border-gold) !important;
        }

        .dnd-dialog-btn-confirm {
            background: var(--dnd-btn-primary) !important;
            color: var(--dnd-btn-text) !important;
        }
        .dnd-dialog-btn-confirm:hover {
            filter: brightness(1.1) !important;
            transform: translateY(-1px) !important;
            box-shadow: var(--dnd-hover-shadow) !important;
        }
        .dnd-dialog-btn-confirm:active {
            transform: translateY(0) !important;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
            #dnd-notification-container {
                left: 10px !important;
                right: 10px !important;
                max-width: none !important;
            }
            
            .dnd-toast {
                transform: translateY(-100%) !important;
            }
            .dnd-toast-visible {
                transform: translateY(0) !important;
            }
            .dnd-toast-exit {
                transform: translateY(-100%) !important;
            }
            
            /* 对话框移动端适配：由 backdrop flex 居中，此处仅设置尺寸约束 */
            .dnd-dialog {
                min-width: 0 !important;
                width: calc(100vw - 40px) !important;
                max-width: 400px !important;
                max-height: calc(100vh - 40px) !important;
                max-height: calc(100dvh - 40px) !important; /* 动态视口高度，更适合移动端 */
            }
            
            /* 移动端对话框按钮可堆叠 */
            .dnd-dialog-footer {
                flex-direction: column !important;
            }
            
            .dnd-dialog-btn {
                width: 100% !important;
            }
        }

        /* ============================================
           NPC详情模态框 (Modal Overlay)
           ============================================ */
        
        /* 模态框遮罩层 */
        .dnd-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.85) !important;
            backdrop-filter: blur(5px) !important;
            z-index: 2147483646 !important;
            display: none !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 20px !important;
        }
        .dnd-modal-overlay.active {
            display: flex !important;
        }
        
        /* 模态框主体 */
        .dnd-modal {
            background: var(--dnd-bg-popup) !important;
            /* Morphology: Border */
            border: var(--dnd-border-width, 1px) var(--dnd-border-style, solid) var(--dnd-border-gold) !important;
            /* Morphology: Radius */
            border-radius: var(--dnd-radius-lg, 10px) !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(157, 139, 108, 0.1), var(--dnd-effect-border-glow, none) !important;
            color: var(--dnd-text-main) !important;
            font-family: var(--dnd-font-sans) !important;
            width: 420px !important;
            max-width: 90vw !important;
            max-height: 80vh !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            animation: dnd-modal-in 0.25s ease-out !important;
            position: relative !important;
            
            /* Morphology: Shape */
            clip-path: var(--dnd-card-clip-path, none) !important;
        }
        
        /* 模态框纹理层 */
        .dnd-modal::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0 !important;
            background: var(--dnd-effect-texture, none) !important;
            opacity: 0.3 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            mix-blend-mode: overlay !important;
        }
        
        @keyframes dnd-modal-in {
            0% {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        /* 模态框头部 */
        .dnd-modal-header {
            padding: 16px 20px !important;
            background: rgba(0, 0, 0, 0.3) !important;
            border-bottom: 1px solid var(--dnd-border-gold) !important;
            flex-shrink: 0 !important;
        }
        
        /* 模态框关闭按钮 */
        .dnd-modal-close {
            cursor: pointer !important;
            font-size: 20px !important;
            color: var(--dnd-text-dim) !important;
            width: 28px !important;
            height: 28px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 4px !important;
            transition: all 0.2s !important;
            flex-shrink: 0 !important;
        }
        .dnd-modal-close:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            color: var(--dnd-text-highlight) !important;
        }
        
        /* 模态框内容区 */
        .dnd-modal-body {
            padding: 20px !important;
            overflow-y: auto !important;
            flex: 1 !important;
        }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
            .dnd-modal {
                width: calc(100vw - 40px) !important;
                max-height: 85vh !important;
            }
        }

        /* ============================================
           SVG Icon Enhancements (FontAwesome)
           ============================================ */
        .svg-inline--fa {
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            display: inline-block !important;
            vertical-align: -0.125em !important; /* Fix alignment */
        }
        
        /* 悬停光晕效果 */
        .dnd-clickable:hover .svg-inline--fa,
        .dnd-btn:hover .svg-inline--fa,
        .dnd-nav-item:hover .svg-inline--fa,
        .dnd-footer-btn:hover .svg-inline--fa,
        .dnd-icon-hover:hover {
            filter: drop-shadow(0 0 5px currentColor) !important;
            transform: scale(1.2) !important;
        }
        
        /* 特定颜色的图标光晕增强 */
        .dnd-text-highlight .svg-inline--fa {
            filter: drop-shadow(0 0 2px var(--dnd-text-highlight));
        }

        /* 状态提示特效 */
        @keyframes dnd-icon-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }
        .dnd-icon-bounce {
            animation: dnd-icon-bounce 1s infinite ease-in-out !important;
            color: var(--dnd-text-highlight) !important;
        }

        @keyframes dnd-icon-pulse-gold {
            0% { filter: drop-shadow(0 0 0 transparent); }
            50% { filter: drop-shadow(0 0 8px var(--dnd-text-highlight)); }
            100% { filter: drop-shadow(0 0 0 transparent); }
        }
        .dnd-icon-notify {
            animation: dnd-icon-pulse-gold 2s infinite !important;
            color: var(--dnd-text-highlight) !important;
        }

        /* 悬停浮起效果 (Moved to end for precedence) */
        .dnd-hover-lift {
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
                        box-shadow 0.4s,
                        filter 0.4s,
                        background 0.4s,
                        border-color 0.4s,
                        color 0.4s !important;
        }
        .dnd-hover-lift:hover {
            transform: translateY(-3px) scale(1.02) !important;
            box-shadow: var(--dnd-shadow-md) !important;
            filter: brightness(1.1) !important;
            z-index: 10 !important;
        }

        /* ============================================
           🎨 高级动画美化系统 - 炫酷灵动效果
           ============================================ */

        /* === 1. 悬浮球 (Toggle Button) 增强动效 === */
        
        /* 呼吸光环动画 */
        @keyframes dnd-breathe-glow {
            0%, 100% {
                box-shadow: var(--dnd-shadow-md),
                            inset 0 0 10px var(--dnd-bg-tertiary),
                            0 0 20px var(--dnd-selected-glow),
                            0 0 40px var(--dnd-selected-bg);
            }
            50% {
                box-shadow: var(--dnd-shadow-md),
                            inset 0 0 10px var(--dnd-bg-tertiary),
                            0 0 30px var(--dnd-selected-glow),
                            0 0 60px var(--dnd-selected-bg);
            }
        }
        
        /* 环形扫光动画 */
        @keyframes dnd-ring-sweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* 悬浮球呼吸光效 - 仅添加动画，不覆盖其他样式 */
        #dnd-toggle-btn:not(.dnd-hidden):not(:hover) {
            animation: dnd-breathe-glow 3s ease-in-out infinite;
        }
        
        /* 悬浮球悬停增强 - 增强原有效果 */
        #dnd-toggle-btn:hover {
            box-shadow: 0 0 20px var(--dnd-selected-glow),
                        0 0 40px var(--dnd-selected-bg),
                        inset 0 0 10px var(--dnd-bg-panel-start) !important;
        }

        /* === 2. HUD 面板增强效果 === */
        
        /* 毛玻璃 + 边框光效 */
        @keyframes dnd-border-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        #dnd-mini-hud {
            backdrop-filter: blur(12px) saturate(150%) !important;
            -webkit-backdrop-filter: blur(12px) saturate(150%) !important;
        }
        
        #dnd-mini-hud::after {
            animation: dnd-icon-pulse-gold 3s ease-in-out infinite !important;
        }
        
        /* HUD 边框动态光效 */
        #dnd-mini-hud.visible {
            position: relative;
        }

        /* === 3. 角色卡片 3D 悬浮效果 === */
        
        .dnd-char-card {
            transform-style: preserve-3d !important;
            perspective: 1000px !important;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        
        .dnd-char-card:hover {
            transform: var(--dnd-card-hover-transform) !important;
            box-shadow: var(--dnd-card-hover-shadow),
                        inset 0 1px 0 var(--dnd-bg-panel-start) !important;
        }
        
        /* 卡片边框发光呼吸 */
        @keyframes dnd-card-glow {
            0%, 100% {
                border-color: var(--dnd-border-inner);
                box-shadow: var(--dnd-shadow-sm);
            }
            50% {
                border-color: var(--dnd-border-gold);
                box-shadow: var(--dnd-selected-glow);
            }
        }
        
        .dnd-char-card.dnd-highlight-card {
            animation: dnd-card-glow 2s ease-in-out infinite !important;
        }

        /* 头像光圈效果 */
        .dnd-avatar-container {
            position: relative !important;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        
        .dnd-avatar-container::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            background: conic-gradient(
                from 0deg,
                transparent,
                var(--dnd-border-gold),
                transparent,
                var(--dnd-text-highlight),
                transparent
            );
            opacity: 0;
            transition: opacity 0.3s;
            z-index: -1;
            animation: dnd-ring-sweep 3s linear infinite;
        }
        
        .dnd-avatar-container:hover::after {
            opacity: 1;
        }
        
        .dnd-avatar-container:hover {
            transform: scale(1.1) !important;
            box-shadow: var(--dnd-selected-glow) !important;
        }

        /* === 4. 骰子按钮 3D 翻转效果 === */
        
        .dnd-dice-btn {
            position: relative !important;
            transform-style: preserve-3d !important;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            overflow: hidden !important;
        }
        
        .dnd-dice-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: radial-gradient(circle, var(--dnd-selected-bg) 0%, transparent 70%);
            transition: all 0.4s ease;
            transform: translate(-50%, -50%);
            border-radius: 50%;
        }
        
        .dnd-dice-btn:hover::before {
            width: 150%;
            height: 150%;
        }
        
        .dnd-dice-btn:hover {
            transform: translateY(-3px) rotateX(-10deg) scale(1.08) !important;
            box-shadow: var(--dnd-shadow-md), var(--dnd-selected-glow) !important;
        }
        
        .dnd-dice-btn:active {
            transform: translateY(0) rotateX(0) scale(0.95) !important;
            transition: all 0.1s !important;
        }
        
        /* 骰子滚动动画 */
        @keyframes dnd-dice-roll {
            0% { transform: rotateY(0deg) rotateX(0deg); }
            25% { transform: rotateY(90deg) rotateX(90deg); }
            50% { transform: rotateY(180deg) rotateX(180deg); }
            75% { transform: rotateY(270deg) rotateX(90deg); }
            100% { transform: rotateY(360deg) rotateX(0deg); }
        }
        
        .dnd-dice-rolling {
            animation: dnd-dice-roll 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        
        /* 骰子结果特效 - NAT20 发光脉冲 */
        @keyframes dnd-nat20-glow {
            0% {
                text-shadow: 0 0 30px var(--dnd-accent-green),
                             0 0 60px var(--dnd-accent-green);
                transform: scale(1);
            }
            100% {
                text-shadow: 0 0 50px var(--dnd-accent-green),
                             0 0 100px var(--dnd-accent-green),
                             0 0 150px var(--dnd-accent-green);
                transform: scale(1.05);
            }
        }
        
        /* 骰子结果特效 - NAT1 抖动 */
        @keyframes dnd-shake {
            0%, 100% { transform: translateX(0) rotate(0); }
            10% { transform: translateX(-8px) rotate(-5deg); }
            20% { transform: translateX(8px) rotate(5deg); }
            30% { transform: translateX(-6px) rotate(-3deg); }
            40% { transform: translateX(6px) rotate(3deg); }
            50% { transform: translateX(-4px) rotate(-2deg); }
            60% { transform: translateX(4px) rotate(2deg); }
            70% { transform: translateX(-2px) rotate(-1deg); }
            80% { transform: translateX(2px) rotate(1deg); }
            90% { transform: translateX(-1px) rotate(0); }
        }
        
        .dnd-nat20-result {
            background: linear-gradient(135deg, var(--dnd-bg-tertiary), var(--dnd-bg-secondary)) !important;
            border-color: var(--dnd-accent-green) !important;
        }
        
        .dnd-nat1-result {
            background: linear-gradient(135deg, var(--dnd-bg-tertiary), var(--dnd-bg-secondary)) !important;
            border-color: var(--dnd-accent-red) !important;
        }
        
        /* 骰子结果数字弹跳入场 */
        @keyframes dnd-result-bounce {
            0% {
                opacity: 0;
                transform: scale(0.3) translateY(-50px);
            }
            50% {
                opacity: 1;
                transform: scale(1.1) translateY(10px);
            }
            70% {
                transform: scale(0.95) translateY(-5px);
            }
            100% {
                transform: scale(1) translateY(0);
            }
        }
        
        .dnd-dice-result-number {
            animation: dnd-result-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        }

        /* === 5. 进度条流动光效增强 === */
        
        @keyframes dnd-bar-flow {
            0% {
                background-position: -200% center;
            }
            100% {
                background-position: 200% center;
            }
        }
        
        .dnd-bar-fill,
        .dnd-micro-bar-fill {
            position: relative !important;
            overflow: hidden !important;
        }
        
        .dnd-bar-fill::after,
        .dnd-micro-bar-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
                90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.3) 25%,
                rgba(255, 255, 255, 0.5) 50%,
                rgba(255, 255, 255, 0.3) 75%,
                transparent 100%
            );
            background-size: 200% 100%;
            animation: dnd-bar-flow 8s linear infinite;
        }
        
        /* HP 条特效 - 低血量警告闪烁 */
        @keyframes dnd-hp-critical {
            0%, 100% {
                box-shadow: 0 0 5px rgba(231, 76, 60, 0.5);
                opacity: 1;
            }
            50% {
                box-shadow: 0 0 15px rgba(231, 76, 60, 0.8);
                opacity: 0.7;
            }
        }
        
        .dnd-bar-hp.dnd-critical .dnd-bar-fill {
            animation: dnd-hp-critical 1s ease-in-out infinite !important;
        }

        /* === 6. 按钮涟漪效果 === */
        
        @keyframes dnd-ripple {
            0% {
                transform: scale(0);
                opacity: 0.5;
            }
            100% {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .dnd-btn-ripple {
            position: relative !important;
            overflow: hidden !important;
        }
        
        .dnd-btn-ripple .dnd-ripple-effect {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, var(--dnd-selected-bg) 0%, transparent 70%); /* 更柔和的径向渐变 */
            pointer-events: none;
            animation: dnd-ripple 0.6s ease-out forwards;
            mix-blend-mode: screen; /* 混合模式让光效更亮 */
        }
        
        /* 新增：通用按钮样式 (用于内部组件) */
        .dnd-btn-primary, .dnd-btn-secondary {
            padding: 6px 14px !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            cursor: pointer !important;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            font-family: var(--dnd-font-sans) !important;
            border: 1px solid transparent !important;
            position: relative !important;
            overflow: hidden !important;
        }
        
        .dnd-btn-primary {
            background: linear-gradient(135deg, var(--dnd-border-gold), #7a6b52) !important;
            color: var(--dnd-text-inverse) !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
            font-weight: bold !important;
        }
        .dnd-btn-primary:hover {
            filter: brightness(var(--dnd-btn-hover-brightness, 1.15)) !important;
            transform: var(--dnd-btn-hover-transform, translateY(-2px)) !important;
            box-shadow: var(--dnd-btn-hover-shadow, 0 6px 15px rgba(157, 139, 108, 0.4)) !important;
        }
        .dnd-btn-primary:active {
            transform: var(--dnd-btn-active-transform, translateY(0) scale(0.98)) !important;
            box-shadow: var(--dnd-btn-active-shadow, 0 2px 5px rgba(0,0,0,0.3)) !important;
        }
        
        .dnd-btn-secondary {
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid var(--dnd-border-inner) !important;
            color: var(--dnd-text-main) !important;
        }
        .dnd-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            border-color: var(--dnd-hover-border-color, var(--dnd-border-gold)) !important;
            color: var(--dnd-selected-text-color, var(--dnd-text-highlight)) !important;
            transform: var(--dnd-btn-hover-transform, translateY(-1px)) !important;
        }

        /* 标签页 Tab 按钮 */
        .dnd-tab-btn {
            padding: 8px 16px !important;
            background: transparent !important;
            border: none !important;
            border-bottom: 2px solid transparent !important;
            color: var(--dnd-text-dim) !important;
            cursor: pointer !important;
            font-family: var(--dnd-font-serif) !important;
            font-size: 14px !important;
            transition: all var(--dnd-hover-transition, 0.3s) !important;
            position: relative !important;
        }
        .dnd-tab-btn:hover {
            color: var(--dnd-text-main) !important;
        }
        .dnd-tab-btn.active {
            color: var(--dnd-selected-text-color, var(--dnd-text-highlight)) !important;
            border-bottom-color: var(--dnd-nav-active-indicator, var(--dnd-border-gold)) !important;
        }
        .dnd-tab-btn.active::after {
            content: "◆" !important;
            position: absolute !important;
            bottom: -6px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            font-size: 10px !important;
            color: var(--dnd-nav-active-indicator, var(--dnd-border-gold)) !important;
            text-shadow: 0 0 5px var(--dnd-nav-active-indicator, var(--dnd-border-gold)) !important;
        }

        /* === 7. 导航项滑动指示器 === */
        
        .dnd-nav-item {
            position: relative !important;
            overflow: hidden !important;
        }
        
        .dnd-nav-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 0;
            background: linear-gradient(90deg,
                rgba(157, 139, 108, 0.3) 0%,
                transparent 100%);
            transition: width 0.3s ease;
        }
        
        .dnd-nav-item:hover::before {
            width: 100%;
        }
        
        .dnd-nav-item.active::before {
            width: 100%;
            background: linear-gradient(90deg,
                rgba(157, 139, 108, 0.4) 0%,
                transparent 100%);
        }
        
        .dnd-nav-item::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg,
                var(--dnd-border-gold),
                transparent);
            transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        
        .dnd-nav-item:hover::after,
        .dnd-nav-item.active::after {
            width: 100%;
        }

        /* === 8. 弹窗入场动画增强 === */
        
        /* 流畅的弹窗入场动画（无果冻弹跳） */
        @keyframes dnd-popup-smooth-in {
            0% {
                opacity: 0;
                transform: scale(0.92) translateY(-8px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        /* 保留原始弹跳动画供其他场景使用 */
        @keyframes dnd-popup-bounce-in {
            0% {
                opacity: 0;
                transform: scale(0.3) translateY(-20px);
            }
            50% {
                transform: scale(1.05) translateY(5px);
            }
            70% {
                transform: scale(0.95) translateY(-2px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        @keyframes dnd-popup-slide-up {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.96);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .dnd-detail-popup.visible,
        .dnd-quest-tooltip.visible {
            animation: dnd-popup-smooth-in 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        }
        
        .dnd-char-detail-card.visible {
            animation: dnd-popup-slide-up 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        }

        /* === 9. 迷你角色条悬浮增强 === */
        
        .dnd-mini-char {
            position: relative !important;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        
        .dnd-mini-char::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: transparent;
            transition: all 0.3s ease;
        }
        
        .dnd-mini-char:hover::before {
            background: linear-gradient(180deg,
                transparent,
                var(--dnd-border-gold),
                transparent);
            box-shadow: 0 0 10px rgba(157, 139, 108, 0.5);
        }
        
        .dnd-mini-char:hover {
            transform: translateX(5px) !important;
            background: linear-gradient(90deg,
                rgba(157, 139, 108, 0.25) 0%,
                rgba(157, 139, 108, 0.1) 30%,
                transparent 100%) !important;
        }
        
        .dnd-mini-char.active {
            background: linear-gradient(90deg,
                rgba(255, 219, 133, 0.3) 0%,
                rgba(157, 139, 108, 0.15) 30%,
                transparent 100%) !important;
        }
        
        .dnd-mini-char.active::before {
            background: linear-gradient(180deg,
                rgba(255, 219, 133, 0.3),
                var(--dnd-text-highlight),
                rgba(255, 219, 133, 0.3)) !important;
            box-shadow: 0 0 15px rgba(255, 219, 133, 0.6);
        }

        /* === 10. 快捷栏 3D 效果 === */
        
        .dnd-quick-slot {
            transform-style: preserve-3d !important;
            transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            position: relative !important;
        }
        
        .dnd-quick-slot::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg,
                rgba(255, 255, 255, 0.1) 0%,
                transparent 50%,
                rgba(0, 0, 0, 0.2) 100%);
            opacity: 0;
            transition: opacity 0.3s;
            border-radius: inherit;
        }
        
        .dnd-quick-slot:hover::before {
            opacity: 1;
        }
        
        .dnd-quick-slot:hover {
            transform: translateY(-5px) scale(1.1) rotateX(-5deg) !important;
            box-shadow:
                0 10px 20px rgba(0, 0, 0, 0.4),
                0 0 15px rgba(255, 219, 133, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }

        /* === 11. 资源栏动态效果 === */
        
        .dnd-res-item {
            transition: all 0.2s ease !important;
        }
        
        .dnd-res-item:hover {
            transform: scale(1.1) !important;
            color: var(--dnd-text-highlight) !important;
        }
        
        .dnd-res-item:hover .dnd-res-icon {
            opacity: 1 !important;
            filter: drop-shadow(0 0 5px currentColor);
        }

        /* === 12. 粒子/星尘背景效果 (可选开启) === */
        
        @keyframes dnd-float-particle {
            0%, 100% {
                transform: translateY(0) translateX(0) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.8;
            }
            90% {
                opacity: 0.8;
            }
            100% {
                transform: translateY(-100px) translateX(20px) rotate(360deg);
                opacity: 0;
            }
        }
        
        .dnd-particles-enabled::before {
            content: '';
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--dnd-border-gold);
            border-radius: 50%;
            animation: dnd-float-particle 5s ease-in-out infinite;
            pointer-events: none;
        }

        /* === 13. 状态徽章弹跳效果 === */
        
        @keyframes dnd-badge-bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        .dnd-status-badge {
            animation: dnd-badge-bounce 2s ease-in-out infinite !important;
        }
        
        .dnd-status-badge.urgent {
            animation: dnd-badge-bounce 0.5s ease-in-out infinite !important;
            box-shadow: 0 0 10px rgba(231, 76, 60, 0.5) !important;
        }

        /* === 14. 战斗模式特殊效果 === */
        
        @keyframes dnd-combat-pulse {
            0%, 100% {
                border-color: rgba(138, 44, 44, 0.6);
                box-shadow: 0 0 0 2px rgba(0,0,0,0.5),
                            0 0 0 4px rgba(138, 44, 44, 0.4),
                            0 0 20px rgba(138, 44, 44, 0.2);
            }
            50% {
                border-color: rgba(192, 57, 43, 0.8);
                box-shadow: 0 0 0 2px rgba(0,0,0,0.5),
                            0 0 0 4px rgba(192, 57, 43, 0.6),
                            0 0 30px rgba(192, 57, 43, 0.4);
            }
        }
        
        #dnd-mini-hud.dnd-combat-mode {
            animation: dnd-combat-pulse 2s ease-in-out infinite !important;
        }
        
        #dnd-mini-hud.dnd-combat-mode .dnd-hud-header {
            background: linear-gradient(to right,
                rgba(138, 44, 44, 0.3),
                rgba(92, 75, 53, 0.1),
                transparent) !important;
        }

        /* === 15. 文字渐显效果 === */
        
        @keyframes dnd-text-reveal {
            0% {
                opacity: 0;
                transform: translateY(10px);
                filter: blur(5px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
            }
        }
        
        .dnd-text-reveal {
            animation: dnd-text-reveal 0.5s ease-out forwards !important;
        }
        
        .dnd-text-reveal-delay-1 { animation-delay: 0.1s !important; }
        .dnd-text-reveal-delay-2 { animation-delay: 0.2s !important; }
        .dnd-text-reveal-delay-3 { animation-delay: 0.3s !important; }

        /* === 16. Logo 容器增强 === */
        
        #dnd-logo-container {
            position: relative !important;
        }
        
        #dnd-logo-container::before {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: conic-gradient(
                from 0deg,
                transparent 0deg,
                rgba(255, 219, 133, 0.4) 45deg,
                transparent 90deg,
                transparent 180deg,
                rgba(157, 139, 108, 0.3) 225deg,
                transparent 270deg
            );
            animation: dnd-ring-sweep 6s linear infinite;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        #dnd-logo-container:hover::before {
            opacity: 1;
        }
        
        .dnd-logo-text {
            transition: all 0.3s ease !important;
        }
        
        #dnd-logo-container:hover .dnd-logo-text {
            text-shadow: 0 2px 4px rgba(0,0,0,0.8),
                         0 0 20px rgba(255, 219, 133, 0.5) !important;
            transform: scale(1.1) !important;
        }

        /* === 17. 列表项交错入场 === */
        
        .dnd-stagger-enter > * {
            opacity: 0;
            animation: dnd-slide-up-fade 0.4s ease forwards;
        }
        
        .dnd-stagger-enter > *:nth-child(1) { animation-delay: 0.05s; }
        .dnd-stagger-enter > *:nth-child(2) { animation-delay: 0.1s; }
        .dnd-stagger-enter > *:nth-child(3) { animation-delay: 0.15s; }
        .dnd-stagger-enter > *:nth-child(4) { animation-delay: 0.2s; }
        .dnd-stagger-enter > *:nth-child(5) { animation-delay: 0.25s; }
        .dnd-stagger-enter > *:nth-child(6) { animation-delay: 0.3s; }
        .dnd-stagger-enter > *:nth-child(7) { animation-delay: 0.35s; }
        .dnd-stagger-enter > *:nth-child(8) { animation-delay: 0.4s; }
        .dnd-stagger-enter > *:nth-child(9) { animation-delay: 0.45s; }
        .dnd-stagger-enter > *:nth-child(10) { animation-delay: 0.5s; }

        /* === 18. 闪烁光标效果 === */
        
        @keyframes dnd-cursor-blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        
        .dnd-typing-cursor::after {
            content: '|';
            animation: dnd-cursor-blink 1s step-end infinite;
            color: var(--dnd-text-highlight);
            margin-left: 2px;
        }

        /* === 19. 悬浮信息卡片 3D 翻转 === */
        
        .dnd-flip-card {
            perspective: 1000px !important;
        }
        
        .dnd-flip-card-inner {
            transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            transform-style: preserve-3d !important;
        }
        
        .dnd-flip-card:hover .dnd-flip-card-inner {
            transform: rotateY(180deg) !important;
        }
        
        .dnd-flip-card-front,
        .dnd-flip-card-back {
            backface-visibility: hidden !important;
        }
        
        .dnd-flip-card-back {
            transform: rotateY(180deg) !important;
        }

        /* === 20. 工具提示增强 === */
        
        [data-tooltip] {
            position: relative !important;
        }
        
        [data-tooltip]::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-5px) scale(0.8);
            background: rgba(0, 0, 0, 0.9);
            color: var(--dnd-text-main);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 11px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            border: 1px solid var(--dnd-border-inner);
            z-index: 1000;
        }
        
        [data-tooltip]:hover::after {
            opacity: 1;
            transform: translateX(-50%) translateY(-10px) scale(1);
        }

        /* ============================================
           表单组件美化 (Form Elements)
           ============================================ */
        
        /* 输入框 */
        .dnd-input {
            background: rgba(0, 0, 0, 0.3) !important;
            border: 1px solid var(--dnd-border-subtle) !important;
            border-radius: 4px !important;
            color: var(--dnd-text-main) !important;
            padding: 8px 10px !important;
            font-family: var(--dnd-font-sans) !important;
            transition: all var(--dnd-hover-transition, 0.2s) !important;
            outline: var(--dnd-focus-outline, none) !important;
        }
        .dnd-input:focus {
            border-color: var(--dnd-input-focus-border, var(--dnd-border-gold)) !important;
            background: rgba(0, 0, 0, 0.5) !important;
            box-shadow: var(--dnd-input-focus-shadow, 0 0 0 2px rgba(157, 139, 108, 0.2)) !important;
        }
        .dnd-input:disabled {
            opacity: var(--dnd-disabled-opacity, 0.5) !important;
            cursor: var(--dnd-disabled-cursor, not-allowed) !important;
            filter: var(--dnd-disabled-filter, grayscale(0.5)) !important;
        }
        
        /* 下拉选框 */
        .dnd-select {
            appearance: none !important;
            -webkit-appearance: none !important;
            background: rgba(0, 0, 0, 0.3) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239d8b6c%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 10px center !important;
            background-size: 10px !important;
            border: 1px solid var(--dnd-border-subtle) !important;
            border-radius: 4px !important;
            color: var(--dnd-text-main) !important;
            padding: 8px 30px 8px 10px !important;
            cursor: pointer !important;
            font-family: var(--dnd-font-sans) !important;
            transition: all var(--dnd-hover-transition, 0.2s) !important;
        }
        .dnd-select:hover {
            border-color: var(--dnd-text-dim) !important;
        }
        .dnd-select:focus {
            border-color: var(--dnd-focus-border-color, var(--dnd-border-gold)) !important;
            box-shadow: var(--dnd-focus-shadow, 0 0 5px rgba(157, 139, 108, 0.3)) !important;
        }
        .dnd-select:disabled {
            opacity: var(--dnd-disabled-opacity, 0.5) !important;
            cursor: var(--dnd-disabled-cursor, not-allowed) !important;
        }
        
        /* 复选框美化 */
        .dnd-checkbox {
            appearance: none !important;
            -webkit-appearance: none !important;
            width: 16px !important;
            height: 16px !important;
            border: 1px solid var(--dnd-border-subtle) !important;
            border-radius: 3px !important;
            background: rgba(0,0,0,0.3) !important;
            cursor: pointer !important;
            position: relative !important;
            display: inline-block !important;
            vertical-align: middle !important;
            margin-right: 5px !important;
            transition: all var(--dnd-hover-transition, 0.2s) !important;
        }
        .dnd-checkbox:checked {
            background: var(--dnd-selected-border-color, var(--dnd-border-gold)) !important;
            border-color: var(--dnd-selected-border-color, var(--dnd-border-gold)) !important;
        }
        .dnd-checkbox:checked::after {
            content: "✔" !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            color: #000 !important;
            font-size: 10px !important;
            font-weight: bold !important;
        }
        .dnd-checkbox:hover {
            border-color: var(--dnd-hover-border-color, var(--dnd-text-highlight)) !important;
        }
        .dnd-checkbox:disabled {
            opacity: var(--dnd-disabled-opacity, 0.5) !important;
            cursor: var(--dnd-disabled-cursor, not-allowed) !important;
        }

        /* ============================================
           更多差异化动效 (Extra Animations)
           ============================================ */
           
        /* 悬停辉光扫描 */
        .dnd-hover-scan {
            position: relative !important;
            overflow: hidden !important;
        }
        .dnd-hover-scan::before {
            content: "" !important;
            position: absolute !important;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent) !important;
            transform: skewX(-25deg) !important;
            transition: left 0.5s !important;
            pointer-events: none !important;
        }
        .dnd-hover-scan:hover::before {
            left: 150% !important;
            transition: left 0.7s ease-in-out !important;
        }
        
        /* 脉冲缩放 (用于强调) */
        @keyframes dnd-pulse-scale {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .dnd-pulse-hover:hover {
            animation: dnd-pulse-scale 1s infinite ease-in-out !important;
        }
        
        /* 边框流光 (Border Flow) */
        @keyframes dnd-border-snake {
            0%, 100% { background-position: 0% 0%; }
            25% { background-position: 100% 0%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
        }
        
        /* 幽灵按钮 (Ghost Button) */
        .dnd-btn-ghost {
            background: transparent !important;
            border: 1px dashed var(--dnd-text-dim) !important;
            color: var(--dnd-text-dim) !important;
            padding: 6px 12px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            font-size: 12px !important;
        }
        .dnd-btn-ghost:hover {
            border-color: var(--dnd-text-highlight) !important;
            color: var(--dnd-text-highlight) !important;
            background: rgba(255, 255, 255, 0.05) !important;
        }
        
        /* ============================================
           浮动球隐藏模式样式
           ============================================ */
        
        /* 强制隐藏浮动球 */
        #dnd-toggle-btn.dnd-force-hidden {
            display: none !important;
        }
        
        /* 隐藏球模式下 Mini HUD 可拖拽 */
        #dnd-mini-hud.dnd-independent-mode {
            cursor: move !important;
        }
        
        #dnd-mini-hud.dnd-independent-mode .dnd-hud-header {
            cursor: move !important;
        }
    `;
    $root(doc.head || doc.documentElement).append(`<style id="${SCRIPT_ID}-styles">${css}</style>`);
};
