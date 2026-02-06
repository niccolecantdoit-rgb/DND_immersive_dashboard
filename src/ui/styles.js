// src/ui/styles.js
import { getCore } from '../core/Utils.js';

const SCRIPT_ID = 'dnd_immersive_dashboard';

export const addStyles = () => {
    const { $ } = getCore();
    if (!$) return;
    if ($(`#${SCRIPT_ID}-styles`).length) return;
    
    const css = `
        :root {
            --dnd-bg-main: #0f0b0a;
            --dnd-bg-panel: linear-gradient(to bottom, #2b1b17, #1a100e);
            --dnd-bg-card: linear-gradient(135deg, #242424 0%, #1a1a1c 100%);
            --dnd-bg-hud: linear-gradient(to bottom, #2b1b17, #1a100e);
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
            --dnd-font-serif: 'Times New Roman', 'Songti SC', 'SimSun', serif;
            --dnd-font-sans: 'Segoe UI', 'Microsoft YaHei', sans-serif;
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
            border: 1px solid var(--dnd-border-inner) !important;
            border-radius: 6px !important;
            overflow: hidden !important;
            transition: all 0.2s !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
            display: flex !important;
            flex-direction: column !important;
        }
        .dnd-char-card:hover {
            border-color: var(--dnd-border-gold) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 8px 25px rgba(0,0,0,0.5) !important;
        }

        .dnd-card-header {
            padding: 10px 12px !important;
            background: rgba(255,255,255,0.03) !important;
            border-bottom: 1px solid var(--dnd-border-inner) !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
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
        .dnd-stat-label { color: #888 !important; font-size: 12px !important; }
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
        .dnd-bar-hp .dnd-bar-fill { background: linear-gradient(90deg, #8a2c2c, #c0392b) !important; }
        .dnd-bar-exp .dnd-bar-fill { background: linear-gradient(90deg, #8e44ad, #9b59b6) !important; }

        /* 导航侧边栏 */
        .dnd-nav-sidebar {
            width: 200px !important;
            background: var(--dnd-bg-hud) !important;
            border-right: 1px solid var(--dnd-border-inner) !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 10px 0 !important;
            flex-shrink: 0 !important;
        }
        .dnd-nav-item {
            padding: 12px 20px !important;
            cursor: pointer !important;
            color: var(--dnd-text-main) !important;
            transition: all 0.2s !important;
            border-left: 3px solid transparent !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            font-size: 14px !important;
        }
        .dnd-nav-item:hover {
            background: rgba(255, 255, 255, 0.05) !important;
            color: var(--dnd-text-highlight) !important;
        }
        .dnd-nav-item.active {
            background: linear-gradient(90deg, rgba(157, 139, 108, 0.1), transparent) !important;
            border-left-color: var(--dnd-border-gold) !important;
            color: var(--dnd-text-highlight) !important;
            text-shadow: 0 0 10px rgba(157, 139, 108, 0.2) !important;
        }

        /* 内容区域 */
        .dnd-content-area {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 20px !important;
            background: radial-gradient(circle at center, rgba(30,30,35,0.8) 0%, rgba(10,10,12,0.9) 100%) !important;
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
            background: linear-gradient(to right, #1a1a1a, #0a0a0a) !important;
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
        .dnd-attr-lbl { font-size: 9px !important; color: #888 !important; margin-top: 2px !important; }

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
            box-shadow: 0 5px 25px rgba(0,0,0,0.9) !important;
            width: 280px !important;
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
            background: #222 !important;
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
            
            border: 2px solid var(--dnd-border-inner) !important;
            border-radius: 8px !important;
            box-shadow: 0 0 0 2px rgba(0,0,0,0.5), 0 0 0 4px var(--dnd-border-gold), var(--dnd-shadow) !important;
            
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
        #dnd-mini-hud::before {
            content: '❖';
            position: absolute;
            top: 4px;
            left: 4px;
            color: #9d8b6c;
            font-size: 14px;
            pointer-events: none;
            z-index: 10;
        }
        #dnd-mini-hud::after {
            content: '❖';
            position: absolute;
            top: 4px;
            right: 4px;
            color: #9d8b6c;
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
            background: linear-gradient(to right, rgba(92, 75, 53, 0.1), transparent) !important;
            border-bottom: 1px solid #5c4b35 !important;
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
            background: linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%) !important;
            border: 2px solid var(--dnd-border-gold) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 0 10px rgba(157, 139, 108, 0.3) !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            flex-shrink: 0 !important;
        }
        #dnd-logo-container:hover {
            transform: scale(1.05) rotate(5deg) !important;
            box-shadow: 0 0 15px rgba(157, 139, 108, 0.6) !important;
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
            color: #ccc !important;
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
            background: rgba(0,0,0,0.4) !important;
            border-top: 1px solid rgba(255,255,255,0.1) !important;
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
            background: rgba(0,0,0,0.2) !important;
            border-top: 1px solid rgba(255,255,255,0.1) !important;
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
            background: #0a0a0a !important;
            border: 1px solid var(--dnd-border-gold) !important;
            border-radius: 6px !important;
            position: relative !important;
            flex-shrink: 0 !important;
            overflow: hidden !important;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.5) !important;
        }
        
        /* [新增] 地图内部容器样式 */
        .dnd-minimap-inner {
            box-shadow: inset 0 0 40px rgba(0,0,0,0.9);
            transition: transform 0.2s ease-out;
        }
        .dnd-minimap-grid {
            opacity: 0.3;
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
            background: rgba(255, 255, 255, 0.1);
            pointer-events: none;
            z-index: 50;
            animation: dnd-map-ripple 0.6s ease-out forwards;
            transform-origin: center center;
        }
        
        /* 探索模式布局 */
        .dnd-hud-explore-layout { display: flex !important; flex-direction: column !important; width: 100% !important; gap: 10px !important; }
        .dnd-hud-quests {
            background: linear-gradient(to right, rgba(92, 75, 53, 0.2), transparent) !important;
            padding: 8px !important;
            border-radius: 4px !important;
            border-left: 2px solid var(--dnd-border-gold) !important;
        }
        .dnd-hud-quest-item {
            display: flex !important; justify-content: space-between !important; font-size: 13px !important;
            padding: 4px 0 !important; border-bottom: 1px dashed var(--dnd-border-inner) !important;
            cursor: pointer !important;
        }
        .dnd-hud-quest-item:hover { color: var(--dnd-text-highlight) !important; background: rgba(157, 139, 108, 0.1) !important; }

        /* 行动按钮样式覆盖 */
        .dnd-action-btn {
            background: linear-gradient(to right, rgba(92, 75, 53, 0.3), transparent) !important;
            border: 1px solid var(--dnd-border-inner) !important;
            color: var(--dnd-text-header) !important;
            border-left: 3px solid var(--dnd-border-gold) !important;
            border-radius: 4px !important;
            transition: all 0.2s !important;
            font-family: var(--dnd-font-serif) !important;
        }
        .dnd-action-btn:hover {
            background: linear-gradient(to right, rgba(157, 139, 108, 0.2), transparent) !important;
            border-color: var(--dnd-text-highlight) !important;
            transform: translateX(2px) !important;
        }
        
        .dnd-hud-party-row { display: flex !important; gap: 10px !important; overflow-x: auto !important; padding-bottom: 5px !important; }
        
        /* 迷你角色条 */
        .dnd-mini-char {
            display: flex !important; align-items: center !important; gap: 10px !important;
            background: linear-gradient(to right, rgba(92, 75, 53, 0.3), transparent) !important;
            padding: 5px 10px !important; border-radius: 4px !important;
            border-left: 3px solid transparent !important;
            cursor: pointer !important;
            transition: background 0.2s !important;
            margin-bottom: 5px !important;
            border: 1px solid transparent !important;
        }
        .dnd-mini-char:hover {
            background: linear-gradient(to right, rgba(157, 139, 108, 0.2), transparent) !important;
            border-color: var(--dnd-border-gold) !important;
        }
        .dnd-mini-char.active {
            border-left-color: var(--dnd-text-highlight) !important;
            background: linear-gradient(to right, rgba(157, 139, 108, 0.4), transparent) !important;
        }
        
        .dnd-mini-char-avatar {
            width: 36px !important; height: 36px !important; border-radius: 50% !important; background: #222 !important;
            border: 2px solid var(--dnd-border-gold) !important; display: flex !important; align-items: center !important; justify-content: center !important;
            font-size: 14px !important; color: var(--dnd-text-highlight) !important;
            flex-shrink: 0 !important;
            box-shadow: 0 0 5px rgba(0,0,0,0.5) !important;
        }

        .dnd-mini-char-info { flex: 1 !important; min-width: 120px !important; }
        .dnd-mini-name { font-size: 13px !important; font-weight: bold !important; color: var(--dnd-text-main) !important; }
        .dnd-mini-sub { font-size: 11px !important; color: var(--dnd-text-dim) !important; display: flex !important; gap: 8px !important; }

        .dnd-mini-bars { width: 80px !important; display: flex !important; flex-direction: column !important; gap: 3px !important; flex-shrink: 0 !important; }
        .dnd-micro-bar { height: 4px !important; background: #222 !important; border-radius: 2px !important; overflow: hidden !important; position: relative !important; }
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
            box-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
        }
        .dnd-title {
            font-family: var(--dnd-font-serif) !important;
            font-size: 24px !important;
            color: var(--dnd-text-highlight) !important;
            text-transform: uppercase !important;
            letter-spacing: 2px !important;
            text-shadow: 0 0 5px rgba(255, 219, 133, 0.3) !important;
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
            color: #000 !important;
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
                    box-shadow: 0 0 15px rgba(0,0,0,0.9), inset 0 0 10px rgba(0,0,0,0.5) !important;
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
                color: #2b1b17 !important;
                transform: scale(1.1) rotate(90deg) !important;
                box-shadow: 0 0 20px rgba(157, 139, 108, 0.6) !important;
            }
        #dnd-toggle-btn.dnd-hidden {
            opacity: 0 !important;
            transform: scale(0) !important;
            pointer-events: none !important;
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
            animation: dnd-slide-up-fade 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
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
            0% { box-shadow: 0 0 0 0 rgba(255, 219, 133, 0.4); border-color: rgba(255, 219, 133, 0.6); }
            70% { box-shadow: 0 0 0 6px rgba(255, 219, 133, 0); border-color: rgba(255, 219, 133, 1); }
            100% { box-shadow: 0 0 0 0 rgba(255, 219, 133, 0); border-color: rgba(255, 219, 133, 0.6); }
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
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%);
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
            transition: transform 0.1s, background 0.2s, box-shadow 0.2s, border-color 0.2s !important;
            cursor: pointer !important;
        }
        .dnd-clickable:active {
            transform: scale(0.96) !important;
        }
        .dnd-clickable:hover {
            filter: brightness(1.1);
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
                max-height: 60vh !important;
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
                background: rgba(197, 160, 89, 0.1) !important;
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
            color: #000;
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
            border-top: 1px solid rgba(255,255,255,0.1) !important;
            background: rgba(0,0,0,0.2) !important;
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
            background: linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .party-lvl-badge {
            position: absolute !important;
            bottom: -2px !important;
            right: -4px !important;
            background: #333 !important;
            border: 1px solid var(--dnd-border-gold) !important;
            color: #fff !important;
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
            background: rgba(0,0,0,0.7);
            border: 1px solid #555;
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
            background: rgba(197, 160, 89, 0.3);
        }

        .dnd-item-damage {
            color: var(--dnd-accent-red);
            font-weight: bold;
            font-size: 12px;
        }
        .dnd-item-props {
            color: #888;
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
        .rarity-普通, .rarity-common { background: #555; color: #ccc; }
        .rarity-非凡, .rarity-uncommon { background: #1a5c1a; color: #5f5; }
        .rarity-稀有, .rarity-rare { background: #1a3a6c; color: #5af; }
        .rarity-极稀有, .rarity-veryrare { background: #5c1a5c; color: #f5f; }
        .rarity-传说, .rarity-legendary { background: #6c4a1a; color: #fa5; }

        .dnd-item-detail-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 0;
            border-bottom: 1px dashed rgba(255,255,255,0.1);
        }
        .dnd-item-detail-icon { width: 20px; text-align: center; }
        .dnd-item-detail-label { color: #888; min-width: 60px; }
        .dnd-item-detail-value { color: var(--dnd-text-main); flex: 1; }
        
        .party-control-btn {
            position: absolute;
            top: -5px;
            left: -5px;
            width: 18px;
            height: 18px;
            background: rgba(0,0,0,0.7);
            border: 1px solid #555;
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
            background: rgba(197, 160, 89, 0.3);
        }

        /* Dice Grid */
        .dnd-dice-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 6px !important;
        }
        .dnd-dice-btn {
            background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)) !important;
            border: 1px solid #444 !important;
            color: #ccc !important;
            padding: 10px 5px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            font-size: 13px !important;
            font-weight: bold !important;
            text-align: center !important;
        }
        .dnd-dice-btn:hover {
            border-color: var(--dnd-text-highlight) !important;
            color: var(--dnd-text-highlight) !important;
            transform: scale(1.05) !important;
        }

        .dnd-quick-slot {
            width: 48px;
            height: 48px;
            background: rgba(0,0,0,0.5);
            border: 1px solid var(--dnd-border-inner);
            border-radius: 4px;
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
        }
        .dnd-quick-slot:hover {
            border-color: var(--dnd-text-highlight);
            background: rgba(255,255,255,0.1);
        }
        .dnd-quick-slot.add-btn {
            border: 1px dashed rgba(255,255,255,0.3) !important;
            color: rgba(255,255,255,0.6) !important;
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
            background: #8a2c2c;
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
            border-top: 1px dashed #444 !important;
        }
        .dnd-dice-input-row {
            display: flex !important;
            gap: 5px !important;
        }
        .dnd-dice-input {
            flex: 1 !important;
            background: #1a1a1c !important;
            border: 1px solid #444 !important;
            color: var(--dnd-text-main) !important;
            padding: 6px 10px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
        }
        .dnd-dice-submit-btn {
            background: var(--dnd-border-gold) !important;
            border: none !important;
            color: #000 !important;
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
        .dnd-toast-info { border-left: 4px solid #3498db !important; }
        .dnd-toast-success { border-left: 4px solid #2ecc71 !important; }
        .dnd-toast-warning { border-left: 4px solid #f39c12 !important; }
        .dnd-toast-error { border-left: 4px solid #e74c3c !important; }

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

        /* 对话框背景遮罩 */
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
        }
        .dnd-dialog-backdrop-visible {
            opacity: 1 !important;
        }

        /* 对话框主体 */
        .dnd-dialog {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) scale(0.9) !important;
            min-width: 320px !important;
            max-width: 90vw !important;
            max-height: 80vh !important;
            background: var(--dnd-bg-popup) !important;
            border: 1px solid var(--dnd-border-gold) !important;
            border-radius: 10px !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(157, 139, 108, 0.1) !important;
            color: var(--dnd-text-main) !important;
            font-family: var(--dnd-font-sans) !important;
            opacity: 0 !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            pointer-events: auto !important;
            overflow: hidden !important;
        }
        .dnd-dialog-visible {
            transform: translate(-50%, -50%) scale(1) !important;
            opacity: 1 !important;
        }

        /* 对话框类型 */
        .dnd-dialog-warning .dnd-dialog-header {
            border-bottom-color: #f39c12 !important;
        }
        .dnd-dialog-danger .dnd-dialog-header {
            border-bottom-color: #e74c3c !important;
        }
        .dnd-dialog-danger .dnd-dialog-btn-confirm {
            background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
        }

        /* 对话框头部 */
        .dnd-dialog-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 16px 20px !important;
            background: rgba(0, 0, 0, 0.3) !important;
            border-bottom: 1px solid var(--dnd-border-gold) !important;
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
        }

        .dnd-dialog-message {
            font-size: 14px !important;
            line-height: 1.6 !important;
            color: var(--dnd-text-main) !important;
            margin: 0 0 15px 0 !important;
        }

        /* 对话框输入框 */
        .dnd-dialog-input {
            width: 100% !important;
            padding: 10px 14px !important;
            background: rgba(0, 0, 0, 0.4) !important;
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
            box-shadow: 0 0 0 3px rgba(157, 139, 108, 0.2) !important;
        }
        .dnd-dialog-input::placeholder {
            color: var(--dnd-text-dim) !important;
        }

        /* 对话框底部 */
        .dnd-dialog-footer {
            display: flex !important;
            justify-content: flex-end !important;
            gap: 10px !important;
            padding: 16px 20px !important;
            background: rgba(0, 0, 0, 0.2) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
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
            background: rgba(255, 255, 255, 0.08) !important;
            color: var(--dnd-text-main) !important;
            border: 1px solid var(--dnd-border-inner) !important;
        }
        .dnd-dialog-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.15) !important;
            border-color: var(--dnd-border-gold) !important;
        }

        .dnd-dialog-btn-confirm {
            background: linear-gradient(135deg, var(--dnd-border-gold), #7a6b52) !important;
            color: #000 !important;
        }
        .dnd-dialog-btn-confirm:hover {
            filter: brightness(1.1) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(157, 139, 108, 0.4) !important;
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
            
            .dnd-dialog {
                min-width: 0 !important;
                width: calc(100vw - 40px) !important;
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
            filter: drop-shadow(0 0 2px rgba(255, 219, 133, 0.3));
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
            0% { filter: drop-shadow(0 0 0 rgba(255, 219, 133, 0)); }
            50% { filter: drop-shadow(0 0 8px rgba(255, 219, 133, 0.8)); }
            100% { filter: drop-shadow(0 0 0 rgba(255, 219, 133, 0)); }
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
            box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important;
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
                box-shadow: 0 0 15px rgba(0,0,0,0.9),
                            inset 0 0 10px rgba(0,0,0,0.5),
                            0 0 20px rgba(157, 139, 108, 0.2),
                            0 0 40px rgba(157, 139, 108, 0.1);
            }
            50% {
                box-shadow: 0 0 15px rgba(0,0,0,0.9),
                            inset 0 0 10px rgba(0,0,0,0.5),
                            0 0 30px rgba(157, 139, 108, 0.4),
                            0 0 60px rgba(157, 139, 108, 0.2);
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
            box-shadow: 0 0 20px rgba(157, 139, 108, 0.6),
                        0 0 40px rgba(157, 139, 108, 0.3),
                        inset 0 0 10px rgba(255, 219, 133, 0.15) !important;
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
            transform: translateY(-8px) rotateX(3deg) rotateY(-2deg) scale(1.02) !important;
            box-shadow:
                0 20px 40px rgba(0, 0, 0, 0.5),
                0 0 20px rgba(157, 139, 108, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        }
        
        /* 卡片边框发光呼吸 */
        @keyframes dnd-card-glow {
            0%, 100% {
                border-color: var(--dnd-border-inner);
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            50% {
                border-color: rgba(157, 139, 108, 0.6);
                box-shadow: 0 4px 20px rgba(157, 139, 108, 0.15);
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
                rgba(157, 139, 108, 0.5),
                transparent,
                rgba(255, 219, 133, 0.3),
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
            box-shadow: 0 0 15px rgba(157, 139, 108, 0.5) !important;
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
            background: radial-gradient(circle, rgba(255, 219, 133, 0.4) 0%, transparent 70%);
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
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4),
                        0 0 15px rgba(255, 219, 133, 0.3) !important;
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
                text-shadow: 0 0 30px rgba(46, 204, 113, 0.8),
                             0 0 60px rgba(46, 204, 113, 0.4);
                transform: scale(1);
            }
            100% {
                text-shadow: 0 0 50px rgba(46, 204, 113, 1),
                             0 0 100px rgba(46, 204, 113, 0.6),
                             0 0 150px rgba(46, 204, 113, 0.3);
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
            background: linear-gradient(135deg, rgba(46, 204, 113, 0.15), rgba(39, 174, 96, 0.1)) !important;
            border-color: rgba(46, 204, 113, 0.6) !important;
        }
        
        .dnd-nat1-result {
            background: linear-gradient(135deg, rgba(231, 76, 60, 0.15), rgba(192, 57, 43, 0.1)) !important;
            border-color: rgba(231, 76, 60, 0.6) !important;
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
            background: rgba(255, 219, 133, 0.4);
            pointer-events: none;
            animation: dnd-ripple 0.6s ease-out forwards;
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
    `;
    $('head').append(`<style id="${SCRIPT_ID}-styles">${css}</style>`);
};
