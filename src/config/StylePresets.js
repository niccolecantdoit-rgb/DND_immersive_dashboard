// src/config/StylePresets.js

/**
 * 内置风格预设定义
 * 每个风格包含完整的视觉配置
 * 
 * 风格包结构：
 * - meta: 元数据 (id, name, icon, description, author)
 * - colors: 颜色变量 (Base, Primary, Secondary, UI, Text)
 * - dimensions: 尺寸变量 (Spacing, Radius, Border)
 * - typography: 字体变量 (Font Family, Size, Weight)
 * - animations: 动画变量 (Duration, Easing)
 * - morphology: 形态配置 (Border, Corners, Card, Decorations, Effects, Layout)
 * - background: 动态背景配置 (Type, Colors)
 * - overrides: 组件特定的 CSS 覆盖
 */

export const STYLE_PRESETS = {
    // 1. 经典DND (原版风格) - 羊皮纸、墨水、古典
    'classic-dnd': {
        meta: {
            id: 'classic-dnd',
            name: '经典羊皮纸',
            icon: '📜',
            description: '传统的D&D风格，仿佛置身于古老的书卷之中',
            author: 'System'
        },
        colors: {
            '--dnd-bg-main': '#1a100e',
            '--dnd-bg-panel': '#2b1b17',
            '--dnd-bg-panel-start': '#2b1b17',
            '--dnd-bg-panel-end': '#1a100e',
            '--dnd-text-main': '#e0cda8',
            '--dnd-text-header': '#d4c4a0',
            '--dnd-text-highlight': '#ffdb85',
            '--dnd-text-dim': '#8a7a6a',
            '--dnd-accent': '#8a2be2',
            '--dnd-accent-hover': '#9b4dca',
            '--dnd-border': '#4a3b2a',
            '--dnd-border-light': '#6a5b4a',
            '--dnd-bg-card': '#242424',
            '--dnd-bg-card-start': '#242424',
            '--dnd-bg-card-end': '#1a1a1c',
            '--dnd-btn-primary': '#4a148c',
            '--dnd-btn-primary-hover': '#6a1b9a',
            '--dnd-btn-text': '#e0cda8',
            '--dnd-border-gold': '#9d8b6c',
            '--dnd-border-inner': '#5c4b35'
        },
        morphology: {
            border: { style: 'solid', width: '2px', outerStyle: 'none' },
            corners: { style: 'rounded', clipPath: 'none' },
            card: { shape: 'normal', decoration: 'ornate' },
            effects: { texture: 'paper', innerGlow: 'subtle', borderGlow: 'gold', overlay: 'vignette' },
            layout: { density: 'normal' },
            decorations: { corners: 'flourish', dividers: 'ornate', headers: 'banner' },
            buttons: { style: 'classic', shape: 'rounded' },
            progressBars: { style: 'parchment', animated: true }
        },
        typography: {
            '--dnd-font-serif': '"Cinzel", "Palatino Linotype", "Book Antiqua", serif',
            '--dnd-font-size-base': '1rem',
            '--dnd-font-size-header': '1.2rem',
            '--dnd-font-weight-header': '600',
            '--dnd-letter-spacing': '0.03em'
        },
        animations: {
            '--dnd-transition-fast': '0.2s ease-out',
            '--dnd-transition-normal': '0.3s ease-out',
            '--dnd-animation-glow': 'parchment-glow 4s ease-in-out infinite'
        },
        interactiveStates: {
            hover: {
                brightness: 1.1,
                scale: 1.02,
                lift: '-4px',
                shadow: '0 10px 30px rgba(0,0,0,0.45), 0 0 15px rgba(157, 139, 108, 0.15)',
                borderColor: '#9d8b6c',
                glow: 'drop-shadow(0 0 5px rgba(157, 139, 108, 0.3))',
                transition: '0.3s ease-out'
            },
            cardHover: {
                transform: 'translateY(-8px) rotateX(3deg) rotateY(-2deg) scale(1.02)',
                shadow: '0 25px 50px rgba(0,0,0,0.55), 0 0 40px rgba(157, 139, 108, 0.2)',
                borderColor: '#b8a07a'
            },
            buttonHover: {
                brightness: 1.18,
                transform: 'translateY(-3px) scale(1.02)',
                shadow: '0 8px 20px rgba(138, 43, 226, 0.4), 0 0 10px rgba(157, 139, 108, 0.3)'
            },
            active: {
                scale: 0.96,
                brightness: 0.92,
                transform: 'translateY(2px) scale(0.96)',
                shadow: '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 3px rgba(0,0,0,0.2)'
            },
            buttonActive: {
                transform: 'translateY(2px) scale(0.97)',
                shadow: '0 1px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.2)'
            },
            selected: {
                background: 'linear-gradient(90deg, rgba(157, 139, 108, 0.25), rgba(138, 43, 226, 0.1), transparent)',
                borderColor: '#ffdb85',
                borderWidth: '2px',
                glow: '0 0 15px rgba(157, 139, 108, 0.35)',
                textColor: '#ffdb85'
            },
            navActive: {
                background: 'linear-gradient(90deg, rgba(157, 139, 108, 0.25), transparent)',
                border: '3px solid #9d8b6c',
                indicator: '#b8a07a'
            },
            focus: {
                borderColor: '#9d8b6c',
                shadow: '0 0 0 4px rgba(157, 139, 108, 0.25)',
                outline: 'none'
            },
            disabled: {
                opacity: 0.45,
                cursor: 'not-allowed',
                filter: 'grayscale(0.6) sepia(0.2) brightness(0.8)'
            },
            iconHover: {
                glow: 'drop-shadow(0 0 6px rgba(138, 43, 226, 0.6)) drop-shadow(0 0 12px rgba(157, 139, 108, 0.4))',
                scale: 1.12
            },
            inputFocus: {
                border: '#9d8b6c',
                shadow: '0 0 10px rgba(157, 139, 108, 0.3), inset 0 0 8px rgba(157, 139, 108, 0.1)'
            }
        },
        overrides: {
            /* ====== 卡片 - 羊皮纸卷轴形态 ====== */
            '.dnd-char-card': {
                'box-shadow': '0 6px 20px rgba(0,0,0,0.45), inset 0 0 40px rgba(0,0,0,0.4), 0 0 20px rgba(157, 139, 108, 0.1)',
                'border': '3px double #5c4b35',
                'border-radius': '3px',
                'background': 'linear-gradient(135deg, #2b2420 0%, #1e1815 50%, #1a1510 100%)'
            },
            '.dnd-card-header': {
                'border-bottom': '2px solid #5c4b35',
                'background': 'linear-gradient(to right, rgba(157, 139, 108, 0.18), rgba(92, 75, 53, 0.1), rgba(157, 139, 108, 0.18))',
                'position': 'relative',
                'padding': '12px 16px'
            },
            '.dnd-card-body': {
                'background': 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(92, 75, 53, 0.08) 24px, rgba(92, 75, 53, 0.08) 25px)',
                'padding': '15px'
            },
            /* ====== 导航栏 - 书签标签形态 ====== */
            '.dnd-nav-sidebar': {
                'background': 'linear-gradient(180deg, #2b1b17 0%, #1a100e 100%)',
                'border-right': '3px double #5c4b35'
            },
            '.dnd-nav-item': {
                'border-radius': '0 8px 8px 0',
                'margin': '4px 0',
                'border-left': '4px solid transparent',
                'transition': 'all 0.3s ease-out'
            },
            '.dnd-nav-item:hover': {
                'background': 'linear-gradient(90deg, rgba(157, 139, 108, 0.15), transparent)',
                'border-left-color': '#9d8b6c',
                'padding-left': '24px'
            },
            '.dnd-nav-item.active': {
                'background': 'linear-gradient(90deg, rgba(157, 139, 108, 0.25), transparent)',
                'box-shadow': 'inset 4px 0 0 #b8a07a, 0 0 15px rgba(157, 139, 108, 0.2)',
                'border-left-color': '#ffdb85'
            },
            /* ====== 进度条 - 墨水羽毛笔样式 ====== */
            '.dnd-bar-container': {
                'background': 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(30,20,15,0.8))',
                'border': '1px solid #5c4b35',
                'border-radius': '2px',
                'height': '10px',
                'box-shadow': 'inset 0 1px 3px rgba(0,0,0,0.5)'
            },
            '.dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #5c4b35 0%, #9d8b6c 50%, #b8a07a 75%, #9d8b6c 100%)',
                'box-shadow': '0 0 8px rgba(157, 139, 108, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                'border-radius': '1px'
            },
            '.dnd-bar-hp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #6a2c2c 0%, #8a3c3c 50%, #a04040 75%, #8a3c3c 100%)'
            },
            '.dnd-bar-exp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #4a3080 0%, #6a40a0 50%, #8050c0 75%, #6a40a0 100%)'
            },
            /* ====== 按钮 - 蜡封/印章形态 ====== */
            '.dnd-btn, .dnd-action-btn': {
                'border': '2px solid #5c4b35',
                'background': 'linear-gradient(145deg, #3a2a20 0%, #2a1a15 50%, #1f1510 100%)',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.4)',
                'border-radius': '4px',
                'text-shadow': '0 1px 2px rgba(0,0,0,0.5)',
                'font-family': '"Cinzel", serif',
                'letter-spacing': '0.05em'
            },
            '.dnd-btn:hover, .dnd-action-btn:hover': {
                'background': 'linear-gradient(145deg, #4a3a30 0%, #3a2a20 50%, #2a1a15 100%)',
                'border-color': '#9d8b6c',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.15), 0 5px 15px rgba(0,0,0,0.5), 0 0 10px rgba(157, 139, 108, 0.2)'
            },
            '.dnd-btn:active, .dnd-action-btn:active': {
                'background': 'linear-gradient(145deg, #2a1a15 0%, #1f1510 100%)',
                'box-shadow': 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)'
            },
            /* ====== 属性行 - 羊皮纸条目 ====== */
            '.dnd-stat-row': {
                'background': 'linear-gradient(90deg, rgba(43, 36, 32, 0.6), rgba(30, 24, 21, 0.4))',
                'border': '1px solid rgba(92, 75, 53, 0.3)',
                'border-radius': '3px',
                'padding': '6px 10px',
                'margin': '3px 0'
            },
            '.dnd-stat-row:nth-child(odd)': {
                'background': 'linear-gradient(90deg, rgba(43, 36, 32, 0.4), rgba(30, 24, 21, 0.2))'
            },
            /* ====== 标题样式 ====== */
            '.dnd-title, .dnd-char-name': {
                'text-shadow': '0 2px 6px rgba(0,0,0,0.5), 0 0 20px rgba(157, 139, 108, 0.3)',
                'font-family': '"Cinzel", "Palatino Linotype", serif',
                'letter-spacing': '0.08em'
            },
            /* ====== 面板/弹窗 ====== */
            '.dnd-panel, .dnd-dialog': {
                'border': '3px double #5c4b35',
                'border-radius': '4px',
                'box-shadow': '0 10px 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.3)'
            },
            /* ====== 输入框 ====== */
            '.dnd-input, .dnd-select, .dnd-textarea': {
                'background': 'rgba(26, 16, 14, 0.8)',
                'border': '1px solid #5c4b35',
                'border-radius': '3px',
                'color': '#e0cda8'
            },
            '.dnd-input:focus, .dnd-select:focus, .dnd-textarea:focus': {
                'border-color': '#9d8b6c',
                'box-shadow': '0 0 8px rgba(157, 139, 108, 0.3), inset 0 0 5px rgba(157, 139, 108, 0.1)'
            },
            /* ====== 表格 ====== */
            '.dnd-table th': {
                'background': 'linear-gradient(to bottom, #3a2a20, #2a1a15)',
                'border-bottom': '2px solid #5c4b35',
                'color': '#ffdb85'
            },
            '.dnd-table td': {
                'border-bottom': '1px solid rgba(92, 75, 53, 0.3)'
            },
            '.dnd-table tr:hover td': {
                'background': 'rgba(157, 139, 108, 0.1)'
            },
            /* ====== 徽章/标签 ====== */
            '.dnd-badge': {
                'background': 'linear-gradient(135deg, #5c4b35, #3a2a20)',
                'border': '1px solid #9d8b6c',
                'border-radius': '3px',
                'box-shadow': '0 1px 3px rgba(0,0,0,0.3)'
            },
            /* ====== 迷你HUD ====== */
            '#dnd-mini-hud': {
                'border': '2px solid #5c4b35',
                'border-radius': '4px',
                'background': 'linear-gradient(180deg, rgba(43, 27, 23, 0.95), rgba(26, 16, 14, 0.98))'
            }
        },
        customCSS: `
            /* ====== 经典羊皮纸皮肤 - 独特动画与装饰 ====== */
            
            /* 羊皮纸呼吸光效 */
            @keyframes parchment-glow {
                0%, 100% {
                    box-shadow: 0 6px 20px rgba(0,0,0,0.45), inset 0 0 40px rgba(0,0,0,0.4), 0 0 20px rgba(157, 139, 108, 0.1);
                    filter: brightness(1);
                }
                50% {
                    box-shadow: 0 6px 20px rgba(0,0,0,0.45), inset 0 0 40px rgba(0,0,0,0.4), 0 0 35px rgba(157, 139, 108, 0.25);
                    filter: brightness(1.02);
                }
            }
            
            /* 墨水书写动画 */
            @keyframes ink-write {
                0% { width: 0; opacity: 0; }
                10% { opacity: 1; }
                100% { width: 100%; opacity: 1; }
            }
            
            /* 羽毛笔书写线条动画 */
            @keyframes quill-underline {
                0% { transform: scaleX(0); transform-origin: left; }
                100% { transform: scaleX(1); transform-origin: left; }
            }
            
            /* 蜡烛闪烁效果（用于重要元素） */
            @keyframes candle-flicker {
                0%, 100% { opacity: 1; filter: brightness(1); }
                25% { opacity: 0.95; filter: brightness(0.98); }
                50% { opacity: 1; filter: brightness(1.02); }
                75% { opacity: 0.97; filter: brightness(0.99); }
            }
            
            /* 卡片 - 羊皮纸纹理与卷轴边缘 */
            .dnd-char-card {
                position: relative;
                animation: parchment-glow 5s ease-in-out infinite;
            }
            
            /* 羊皮纸纹理层 */
            .dnd-char-card::before {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background:
                    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.03'/%3E%3C/svg%3E"),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.1) 100%);
                pointer-events: none;
                border-radius: inherit;
                z-index: 0;
            }
            
            /* 内边框装饰线 */
            .dnd-char-card::after {
                content: "";
                position: absolute;
                top: 6px; left: 6px; right: 6px; bottom: 6px;
                border: 1px solid rgba(157, 139, 108, 0.2);
                border-radius: 2px;
                pointer-events: none;
                z-index: 1;
            }
            
            /* 卡片头部 - 华丽横幅装饰 */
            .dnd-card-header::before {
                content: "";
                position: absolute;
                left: 50%;
                bottom: -8px;
                transform: translateX(-50%);
                width: 60px;
                height: 16px;
                background: linear-gradient(to bottom, #5c4b35 0%, #3a2a20 100%);
                clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%);
                z-index: 10;
            }
            
            .dnd-card-header::after {
                content: "❧";
                position: absolute;
                left: 50%;
                bottom: -5px;
                transform: translateX(-50%);
                color: #9d8b6c;
                font-size: 12px;
                z-index: 11;
            }
            
            /* 导航项 - 书签标签效果 */
            .dnd-nav-item::before {
                content: "";
                position: absolute;
                left: 0; top: 0; bottom: 0;
                width: 4px;
                background: linear-gradient(to bottom, transparent, #9d8b6c, transparent);
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .dnd-nav-item:hover::before,
            .dnd-nav-item.active::before {
                opacity: 1;
            }
            
            .dnd-nav-item.active::after {
                content: "◆";
                position: absolute;
                right: 10px;
                color: #ffdb85;
                font-size: 8px;
                animation: candle-flicker 2s infinite;
            }
            
            /* 按钮 - 蜡封印章效果 */
            .dnd-btn::before {
                content: "";
                position: absolute;
                top: 2px; left: 2px; right: 2px; bottom: 2px;
                border: 1px dashed rgba(157, 139, 108, 0.2);
                border-radius: 2px;
                pointer-events: none;
            }
            
            /* 进度条动画 */
            .dnd-bar-fill {
                position: relative;
                overflow: hidden;
            }
            
            .dnd-bar-fill::after {
                content: "";
                position: absolute;
                top: 0; left: -100%; width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: progress-shine 3s ease-in-out infinite;
            }
            
            @keyframes progress-shine {
                0% { left: -100%; }
                50%, 100% { left: 100%; }
            }
            
            /* 分隔线装饰 */
            .dnd-divider {
                height: 2px;
                background: linear-gradient(90deg, transparent, #5c4b35, #9d8b6c, #5c4b35, transparent);
                position: relative;
                margin: 10px 0;
            }
            
            .dnd-divider::before {
                content: "✦";
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                background: #1a1510;
                padding: 0 8px;
                color: #9d8b6c;
                font-size: 10px;
            }
            
            /* 角落装饰花纹 */
            .dnd-panel::before,
            .dnd-dialog::before {
                content: "❦";
                position: absolute;
                top: 5px; left: 8px;
                color: rgba(157, 139, 108, 0.4);
                font-size: 14px;
            }
            
            .dnd-panel::after,
            .dnd-dialog::after {
                content: "❦";
                position: absolute;
                bottom: 5px; right: 8px;
                color: rgba(157, 139, 108, 0.4);
                font-size: 14px;
                transform: rotate(180deg);
            }
            
            /* 滚动条 - 羊皮纸风格 */
            .dnd-content-area::-webkit-scrollbar {
                width: 8px;
            }
            
            .dnd-content-area::-webkit-scrollbar-track {
                background: rgba(26, 16, 14, 0.5);
                border-left: 1px solid #5c4b35;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #5c4b35, #3a2a20);
                border-radius: 2px;
                border: 1px solid #9d8b6c;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #9d8b6c, #5c4b35);
            }
            
            /* 悬浮提示框 */
            .dnd-tooltip {
                background: linear-gradient(135deg, #2b2420, #1a1510);
                border: 2px solid #5c4b35;
                border-radius: 4px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            }
            
            .dnd-tooltip::before {
                border-color: #5c4b35 transparent transparent transparent;
            }
            
            /* 图标容器 - 古典圆形徽章 */
            .dnd-icon-circle {
                border: 2px solid #5c4b35;
                background: radial-gradient(circle at 30% 30%, #3a2a20, #1a1510);
                box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 2px 5px rgba(0,0,0,0.3);
            }
            
            /* 头像框 - 椭圆肖像画框 */
            .dnd-avatar {
                border: 3px solid #9d8b6c;
                box-shadow: 0 0 0 2px #5c4b35, 0 4px 10px rgba(0,0,0,0.4);
            }
        `,
        background: {
            type: 'particles',
            colors: ['rgba(255, 219, 133, 0.8)', 'rgba(157, 139, 108, 0.6)', 'rgba(255, 255, 255, 0.5)', 'rgba(138, 43, 226, 0.4)'],
            minSize: 1,
            maxSize: 4,
            count: 20,
            speed: 0.03,
            glow: true
        }
    },

    // 2. 赛博朋克 (未来科技) - 霓虹、高对比、故障风
    'cyber-neon': {
        meta: {
            id: 'cyber-neon',
            name: '赛博霓虹',
            icon: '🌃',
            description: '高对比度的未来科技风格，充满霓虹光影',
            author: 'System'
        },
        colors: {
            '--dnd-bg-main': '#050510',
            '--dnd-bg-panel-start': '#0a0a1a',
            '--dnd-bg-panel-end': '#050510',
            '--dnd-text-main': '#00f3ff',
            '--dnd-text-header': '#ff00ff',
            '--dnd-text-dim': '#007a80',
            '--dnd-text-highlight': '#ffff00',
            '--dnd-accent': '#ff00ff',
            '--dnd-accent-hover': '#ff66ff',
            '--dnd-border-gold': '#00f3ff',
            '--dnd-border-inner': '#ff00ff',
            '--dnd-bg-card-start': 'rgba(10, 10, 26, 0.95)',
            '--dnd-bg-card-end': 'rgba(5, 5, 16, 0.95)',
            '--dnd-btn-primary': 'rgba(255, 0, 255, 0.25)',
            '--dnd-btn-primary-hover': 'rgba(255, 0, 255, 0.45)',
            '--dnd-btn-text': '#00f3ff'
        },
        morphology: {
            border: { style: 'solid', width: '2px', outerStyle: 'none' },
            corners: { style: 'cut', clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' },
            card: { shape: 'sharp', decoration: 'tech' },
            effects: { texture: 'circuit', innerGlow: 'neon', borderGlow: 'neon', overlay: 'scanlines' },
            layout: { density: 'compact', cardMinWidth: '300px' },
            decorations: { corners: 'tech-bracket', dividers: 'glitch', headers: 'hologram' },
            buttons: { style: 'cyber', shape: 'cut' },
            progressBars: { style: 'neon', animated: true, glitch: true }
        },
        typography: {
            '--dnd-font-serif': '"Orbitron", "Roboto Mono", "Consolas", monospace',
            '--dnd-font-size-base': '0.9rem',
            '--dnd-font-size-header': '1.1rem',
            '--dnd-font-weight-header': '700',
            '--dnd-letter-spacing': '0.1em',
            '--dnd-text-transform': 'uppercase'
        },
        animations: {
            '--dnd-transition-fast': '0.1s cubic-bezier(0.4, 0, 0.2, 1)',
            '--dnd-transition-normal': '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '--dnd-animation-neon': 'neon-flicker 3s ease-in-out infinite',
            '--dnd-animation-glitch': 'cyber-glitch 0.3s ease-in-out',
            '--dnd-animation-scan': 'scanline 8s linear infinite'
        },
        interactiveStates: {
            hover: {
                brightness: 1.25,
                scale: 1.03,
                lift: '-5px',
                shadow: '0 12px 35px rgba(0, 243, 255, 0.35), 0 0 20px rgba(255, 0, 255, 0.2)',
                borderColor: '#00f3ff',
                glow: 'drop-shadow(0 0 12px #00f3ff) drop-shadow(0 0 25px rgba(255, 0, 255, 0.4))',
                transition: '0.15s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            cardHover: {
                transform: 'translateY(-8px) scale(1.02) perspective(1000px) rotateX(2deg)',
                shadow: '0 0 40px rgba(0, 243, 255, 0.5), 0 0 80px rgba(255, 0, 255, 0.25), inset 0 0 30px rgba(0, 243, 255, 0.08)',
                borderColor: '#ff00ff'
            },
            buttonHover: {
                brightness: 1.35,
                transform: 'translateY(-4px) scale(1.03)',
                shadow: '0 0 25px rgba(255, 0, 255, 0.6), inset 0 0 15px rgba(0, 243, 255, 0.35), 0 8px 20px rgba(0,0,0,0.4)'
            },
            active: {
                scale: 0.94,
                brightness: 0.85,
                transform: 'scale(0.94)',
                shadow: '0 0 15px rgba(0, 243, 255, 0.6), inset 0 0 10px rgba(255, 0, 255, 0.2)'
            },
            buttonActive: {
                transform: 'translateY(3px) scale(0.97)',
                shadow: '0 0 8px rgba(0, 243, 255, 0.4), inset 0 2px 8px rgba(0,0,0,0.4)'
            },
            selected: {
                background: 'linear-gradient(90deg, rgba(255, 0, 255, 0.35), rgba(0, 243, 255, 0.15), transparent)',
                borderColor: '#00f3ff',
                borderWidth: '2px',
                glow: '0 0 20px rgba(0, 243, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.2)',
                textColor: '#ffff00'
            },
            navActive: {
                background: 'linear-gradient(90deg, rgba(0, 243, 255, 0.25), rgba(255, 0, 255, 0.1), transparent)',
                border: '2px solid #ff00ff',
                indicator: '#00f3ff'
            },
            focus: {
                borderColor: '#ff00ff',
                shadow: '0 0 0 4px rgba(255, 0, 255, 0.35), 0 0 20px rgba(0, 243, 255, 0.3)',
                outline: 'none'
            },
            disabled: {
                opacity: 0.35,
                cursor: 'not-allowed',
                filter: 'grayscale(0.85) brightness(0.5)'
            },
            iconHover: {
                glow: 'drop-shadow(0 0 10px #00f3ff) drop-shadow(0 0 20px #ff00ff) drop-shadow(0 0 30px rgba(255, 255, 0, 0.3))',
                scale: 1.18
            },
            inputFocus: {
                border: '#00f3ff',
                shadow: '0 0 15px rgba(0, 243, 255, 0.5), inset 0 0 8px rgba(0, 243, 255, 0.15), 0 0 30px rgba(255, 0, 255, 0.15)'
            }
        },
        overrides: {
            /* ====== 卡片 - 六边形切角科技面板 ====== */
            '.dnd-char-card': {
                'box-shadow': '0 0 25px rgba(0, 243, 255, 0.3), inset 0 0 30px rgba(0, 243, 255, 0.1), 0 0 80px rgba(255, 0, 255, 0.15)',
                'border': '2px solid #00f3ff',
                'border-radius': '0',
                'clip-path': 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)',
                'background': 'linear-gradient(135deg, rgba(10, 10, 30, 0.95) 0%, rgba(5, 5, 20, 0.98) 100%)'
            },
            '.dnd-card-header': {
                'border-bottom': '2px solid #ff00ff',
                'background': 'linear-gradient(90deg, rgba(255, 0, 255, 0.2), rgba(0,0,0,0.5), rgba(0, 243, 255, 0.15))',
                'text-transform': 'uppercase',
                'letter-spacing': '0.2em',
                'padding': '14px 18px',
                'position': 'relative'
            },
            '.dnd-card-body': {
                'background': 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(0, 243, 255, 0.02) 30px, rgba(0, 243, 255, 0.02) 31px)',
                'padding': '16px'
            },
            /* ====== 导航栏 - 霓虹数据终端 ====== */
            '.dnd-nav-sidebar': {
                'background': 'linear-gradient(180deg, rgba(10, 10, 26, 0.98), rgba(5, 5, 16, 1))',
                'border-right': '3px solid #ff00ff',
                'box-shadow': '5px 0 30px rgba(255, 0, 255, 0.2)'
            },
            '.dnd-nav-item': {
                'clip-path': 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                'margin': '4px 0',
                'padding': '12px 20px',
                'border-left': '3px solid transparent',
                'background': 'rgba(0, 243, 255, 0.05)',
                'transition': 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            '.dnd-nav-item:hover': {
                'background': 'linear-gradient(90deg, rgba(0, 243, 255, 0.2), rgba(255, 0, 255, 0.1))',
                'border-left-color': '#00f3ff',
                'text-shadow': '0 0 10px #00f3ff'
            },
            '.dnd-nav-item.active': {
                'background': 'linear-gradient(90deg, rgba(255, 0, 255, 0.4), rgba(0, 243, 255, 0.15), transparent)',
                'box-shadow': 'inset 4px 0 0 #00f3ff, 0 0 25px rgba(0, 243, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.15)',
                'border-left-color': '#ffff00'
            },
            /* ====== 进度条 - 数据流光带 ====== */
            '.dnd-bar-container': {
                'background': 'rgba(0, 0, 0, 0.8)',
                'border': '1px solid rgba(0, 243, 255, 0.5)',
                'border-radius': '0',
                'height': '12px',
                'clip-path': 'polygon(5px 0, calc(100% - 5px) 0, 100% 50%, calc(100% - 5px) 100%, 5px 100%, 0 50%)',
                'box-shadow': 'inset 0 0 10px rgba(0, 0, 0, 0.8)'
            },
            '.dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #ff00ff, #00f3ff, #ffff00, #00f3ff, #ff00ff)',
                'background-size': '300% 100%',
                'box-shadow': '0 0 15px rgba(0, 243, 255, 0.7), 0 0 30px rgba(255, 0, 255, 0.4)',
                'border-radius': '0',
                'animation': 'neon-progress 3s linear infinite'
            },
            '.dnd-bar-hp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #ff0040, #ff00ff, #ff0080, #ff00ff, #ff0040)',
                'background-size': '300% 100%'
            },
            '.dnd-bar-exp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #8000ff, #00f3ff, #ff00ff, #00f3ff, #8000ff)',
                'background-size': '300% 100%'
            },
            /* ====== 按钮 - 全息触控按钮 ====== */
            '.dnd-btn, .dnd-action-btn': {
                'text-transform': 'uppercase',
                'letter-spacing': '3px',
                'clip-path': 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                'border': '2px solid #ff00ff',
                'background': 'linear-gradient(135deg, rgba(255, 0, 255, 0.15), rgba(0, 243, 255, 0.08))',
                'box-shadow': '0 0 15px rgba(255, 0, 255, 0.3), inset 0 0 20px rgba(0, 243, 255, 0.1)',
                'font-family': '"Orbitron", monospace',
                'position': 'relative',
                'overflow': 'hidden'
            },
            '.dnd-btn:hover, .dnd-action-btn:hover': {
                'background': 'linear-gradient(135deg, rgba(0, 243, 255, 0.25), rgba(255, 0, 255, 0.15))',
                'border-color': '#00f3ff',
                'box-shadow': '0 0 30px rgba(0, 243, 255, 0.5), 0 0 60px rgba(255, 0, 255, 0.3), inset 0 0 25px rgba(0, 243, 255, 0.15)'
            },
            '.dnd-btn:active, .dnd-action-btn:active': {
                'background': 'linear-gradient(135deg, rgba(255, 255, 0, 0.2), rgba(255, 0, 255, 0.1))',
                'box-shadow': 'inset 0 0 30px rgba(0, 243, 255, 0.3)'
            },
            /* ====== 属性行 - 数据终端条目 ====== */
            '.dnd-stat-row': {
                'background': 'linear-gradient(90deg, rgba(0, 243, 255, 0.08), rgba(255, 0, 255, 0.05), transparent)',
                'border': '1px solid rgba(0, 243, 255, 0.2)',
                'border-left': '3px solid #ff00ff',
                'border-radius': '0',
                'clip-path': 'polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%)',
                'padding': '8px 12px',
                'margin': '4px 0'
            },
            '.dnd-stat-row:hover': {
                'background': 'linear-gradient(90deg, rgba(0, 243, 255, 0.15), rgba(255, 0, 255, 0.1), transparent)',
                'border-left-color': '#00f3ff'
            },
            /* ====== 标题样式 ====== */
            '.dnd-title, .dnd-char-name': {
                'text-shadow': '0 0 10px #00f3ff, 0 0 20px #ff00ff, 0 0 40px rgba(255, 255, 0, 0.6), 0 2px 0 #000',
                'text-transform': 'uppercase',
                'letter-spacing': '0.25em',
                'font-family': '"Orbitron", monospace'
            },
            /* ====== 面板/弹窗 - 全息投影面板 ====== */
            '.dnd-panel, .dnd-dialog': {
                'border': '2px solid #00f3ff',
                'border-radius': '0',
                'clip-path': 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)',
                'box-shadow': '0 0 40px rgba(0, 243, 255, 0.3), 0 0 80px rgba(255, 0, 255, 0.15), inset 0 0 50px rgba(0, 243, 255, 0.05)'
            },
            /* ====== 输入框 - 终端输入 ====== */
            '.dnd-input, .dnd-select, .dnd-textarea': {
                'background': 'rgba(0, 0, 0, 0.8)',
                'border': '1px solid #ff00ff',
                'border-radius': '0',
                'color': '#00f3ff',
                'font-family': '"Roboto Mono", monospace',
                'clip-path': 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
            },
            '.dnd-input:focus, .dnd-select:focus, .dnd-textarea:focus': {
                'border-color': '#00f3ff',
                'box-shadow': '0 0 20px rgba(0, 243, 255, 0.5), inset 0 0 10px rgba(0, 243, 255, 0.1)'
            },
            /* ====== 表格 - 数据矩阵 ====== */
            '.dnd-table': {
                'border': '1px solid rgba(0, 243, 255, 0.3)'
            },
            '.dnd-table th': {
                'background': 'linear-gradient(180deg, rgba(255, 0, 255, 0.2), rgba(0, 0, 0, 0.8))',
                'border-bottom': '2px solid #00f3ff',
                'color': '#ffff00',
                'text-transform': 'uppercase',
                'letter-spacing': '0.1em'
            },
            '.dnd-table td': {
                'border-bottom': '1px solid rgba(0, 243, 255, 0.2)',
                'border-right': '1px solid rgba(255, 0, 255, 0.1)'
            },
            '.dnd-table tr:hover td': {
                'background': 'rgba(0, 243, 255, 0.1)',
                'text-shadow': '0 0 5px #00f3ff'
            },
            /* ====== 徽章/标签 ====== */
            '.dnd-badge': {
                'background': 'linear-gradient(135deg, rgba(255, 0, 255, 0.3), rgba(0, 243, 255, 0.2))',
                'border': '1px solid #00f3ff',
                'border-radius': '0',
                'clip-path': 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                'box-shadow': '0 0 10px rgba(0, 243, 255, 0.4)'
            },
            /* ====== 迷你HUD ====== */
            '#dnd-mini-hud': {
                'border': '2px solid #ff00ff',
                'border-radius': '0',
                'clip-path': 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
                'background': 'linear-gradient(180deg, rgba(10, 10, 26, 0.98), rgba(5, 5, 16, 1))',
                'box-shadow': '0 0 30px rgba(255, 0, 255, 0.3)'
            },
            /* ====== 图标 ====== */
            '.dnd-icon': {
                'filter': 'drop-shadow(0 0 5px #00f3ff)'
            }
        },
        customCSS: `
            /* ====== 赛博霓虹皮肤 - 全息科技动画与特效 ====== */
            
            /* 霓虹闪烁动画 */
            @keyframes neon-flicker {
                0%, 18%, 22%, 25%, 53%, 57%, 100% {
                    box-shadow: 0 0 25px rgba(0, 243, 255, 0.3), inset 0 0 30px rgba(0, 243, 255, 0.1), 0 0 80px rgba(255, 0, 255, 0.15);
                    filter: brightness(1);
                }
                20%, 24%, 55% {
                    box-shadow: 0 0 8px rgba(0, 243, 255, 0.15), inset 0 0 15px rgba(0, 243, 255, 0.05), 0 0 30px rgba(255, 0, 255, 0.08);
                    filter: brightness(0.9);
                }
            }
            
            /* 故障效果动画 */
            @keyframes cyber-glitch {
                0%, 100% { transform: translate(0) skewX(0); filter: hue-rotate(0deg); }
                10% { transform: translate(-3px, 2px) skewX(-2deg); filter: hue-rotate(90deg); }
                20% { transform: translate(3px, -2px) skewX(2deg); filter: hue-rotate(-90deg); }
                30% { transform: translate(-2px, -1px); filter: hue-rotate(180deg); }
                40% { transform: translate(2px, 1px); filter: hue-rotate(0deg); }
                50% { transform: translate(-1px, 2px) skewX(-1deg); }
                60% { transform: translate(1px, -2px) skewX(1deg); }
            }
            
            /* 扫描线动画 */
            @keyframes scanline-sweep {
                0% { top: -10%; }
                100% { top: 110%; }
            }
            
            /* 霓虹进度条动画 */
            @keyframes neon-progress {
                0% { background-position: 0% 50%; }
                100% { background-position: 300% 50%; }
            }
            
            /* 数据流动画 */
            @keyframes data-flow {
                0% { background-position: 0 0; }
                100% { background-position: 50px 50px; }
            }
            
            /* 全息闪烁 */
            @keyframes hologram-flicker {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.95; }
                52% { opacity: 0.85; }
                54% { opacity: 1; }
            }
            
            /* 边框流光 */
            @keyframes border-flow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            /* 卡片 - 赛博朋克科技面板 */
            .dnd-char-card {
                position: relative;
                animation: neon-flicker 4s ease-in-out infinite;
            }
            
            /* 扫描线叠加层 */
            .dnd-char-card::before {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background:
                    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 243, 255, 0.03) 2px, rgba(0, 243, 255, 0.03) 4px),
                    repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255, 0, 255, 0.02) 50px, rgba(255, 0, 255, 0.02) 51px);
                pointer-events: none;
                z-index: 2;
            }
            
            /* 外发光边框 */
            .dnd-char-card::after {
                content: "";
                position: absolute;
                top: -4px; left: -4px; right: -4px; bottom: -4px;
                background: linear-gradient(45deg, #00f3ff, #ff00ff, #ffff00, #00f3ff);
                background-size: 400% 400%;
                z-index: -1;
                opacity: 0.6;
                filter: blur(12px);
                animation: border-flow 5s ease infinite;
            }
            
            /* 动态扫描线 */
            .dnd-char-card > .dnd-card-body::after {
                content: "";
                position: absolute;
                left: 0; right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, #00f3ff, transparent);
                opacity: 0.5;
                animation: scanline-sweep 3s linear infinite;
                pointer-events: none;
            }
            
            /* 卡片头部 - 全息标题栏 */
            .dnd-card-header::before {
                content: "◢";
                position: absolute;
                left: 8px; top: 50%;
                transform: translateY(-50%);
                color: #00f3ff;
                font-size: 12px;
                text-shadow: 0 0 10px #00f3ff;
                animation: hologram-flicker 2s infinite;
            }
            
            .dnd-card-header::after {
                content: "◣";
                position: absolute;
                right: 8px; top: 50%;
                transform: translateY(-50%);
                color: #ff00ff;
                font-size: 12px;
                text-shadow: 0 0 10px #ff00ff;
                animation: hologram-flicker 2s infinite 0.5s;
            }
            
            /* 导航项 - 霓虹指示灯效果 */
            .dnd-nav-item::before {
                content: "";
                position: absolute;
                left: 0; top: 50%;
                transform: translateY(-50%);
                width: 4px; height: 0;
                background: linear-gradient(to bottom, #00f3ff, #ff00ff);
                box-shadow: 0 0 10px #00f3ff;
                transition: height 0.2s ease-out;
            }
            
            .dnd-nav-item:hover::before {
                height: 80%;
            }
            
            .dnd-nav-item.active::before {
                height: 100%;
                box-shadow: 0 0 20px #00f3ff, 0 0 40px #ff00ff;
            }
            
            .dnd-nav-item.active::after {
                content: "▶";
                position: absolute;
                right: 12px;
                color: #ffff00;
                font-size: 10px;
                text-shadow: 0 0 10px #ffff00;
                animation: hologram-flicker 1.5s infinite;
            }
            
            /* 按钮 - 全息触控反馈 */
            .dnd-btn::before,
            .dnd-action-btn::before {
                content: "";
                position: absolute;
                top: 0; left: -100%;
                width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.4), transparent);
                transition: left 0.4s ease;
            }
            
            .dnd-btn:hover::before,
            .dnd-action-btn:hover::before {
                left: 100%;
            }
            
            .dnd-btn::after,
            .dnd-action-btn::after {
                content: "";
                position: absolute;
                bottom: 2px; left: 10%; right: 10%;
                height: 1px;
                background: linear-gradient(90deg, transparent, #00f3ff, transparent);
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .dnd-btn:hover::after,
            .dnd-action-btn:hover::after {
                opacity: 1;
            }
            
            /* 进度条 - 数据流动效果 */
            .dnd-bar-fill::before {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 5px,
                    rgba(255,255,255,0.1) 5px,
                    rgba(255,255,255,0.1) 10px
                );
                animation: data-flow 1s linear infinite;
            }
            
            /* 分隔线 - 霓虹线 */
            .dnd-divider {
                height: 2px;
                background: linear-gradient(90deg, transparent, #ff00ff, #00f3ff, #ff00ff, transparent);
                box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
                position: relative;
            }
            
            .dnd-divider::before {
                content: "◇";
                position: absolute;
                left: 50%; top: 50%;
                transform: translate(-50%, -50%);
                background: #050510;
                padding: 0 10px;
                color: #00f3ff;
                font-size: 10px;
                text-shadow: 0 0 10px #00f3ff;
            }
            
            /* 面板角落装饰 */
            .dnd-panel::before,
            .dnd-dialog::before {
                content: "「";
                position: absolute;
                top: 5px; left: 8px;
                color: #00f3ff;
                font-size: 18px;
                text-shadow: 0 0 10px #00f3ff;
            }
            
            .dnd-panel::after,
            .dnd-dialog::after {
                content: "」";
                position: absolute;
                bottom: 5px; right: 8px;
                color: #ff00ff;
                font-size: 18px;
                text-shadow: 0 0 10px #ff00ff;
            }
            
            /* 滚动条 - 霓虹风格 */
            .dnd-content-area::-webkit-scrollbar {
                width: 8px;
            }
            
            .dnd-content-area::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.8);
                border-left: 1px solid #ff00ff;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #ff00ff, #00f3ff);
                box-shadow: 0 0 10px #00f3ff;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #00f3ff, #ffff00);
                box-shadow: 0 0 15px #ffff00;
            }
            
            /* 图标容器 - 六边形 */
            .dnd-icon-circle {
                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                border: none;
                background: linear-gradient(135deg, rgba(0, 243, 255, 0.2), rgba(255, 0, 255, 0.2));
                box-shadow: 0 0 15px rgba(0, 243, 255, 0.5);
            }
            
            /* 头像框 - 菱形 */
            .dnd-avatar {
                clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
                border: 2px solid #00f3ff;
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3);
            }
            
            /* 故障效果触发 */
            .dnd-char-card:hover {
                animation: cyber-glitch 0.3s ease-in-out;
            }
            
            /* 工具提示 */
            .dnd-tooltip {
                background: rgba(5, 5, 16, 0.98);
                border: 1px solid #00f3ff;
                clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.4);
            }
        `,
        background: {
            type: 'radar',
            gridColor: 'rgba(0, 243, 255, 0.18)',
            sweepColor: 'rgba(0, 243, 255, 0.35)',
            accentColor: 'rgba(255, 0, 255, 0.2)',
            speed: 0.025,
            gridSize: 40,
            animated: true
        }
    },

    // 3. 暗黑哥特 (恐怖、压抑) - 深红、黑色、尖刺
    'gothic-horror': {
        meta: {
            id: 'gothic-horror',
            name: '暗黑哥特',
            icon: '🧛',
            description: '深邃压抑的血色风格，适合恐怖战役',
            author: 'System'
        },
        colors: {
            '--dnd-bg-main': '#0a0a0a',
            '--dnd-bg-panel-start': '#1a0505',
            '--dnd-bg-panel-end': '#000000',
            '--dnd-text-main': '#b3b3b3',
            '--dnd-text-header': '#cc0000',
            '--dnd-text-dim': '#666666',
            '--dnd-text-highlight': '#ff3333',
            '--dnd-accent': '#8a0a0a',
            '--dnd-accent-hover': '#aa2020',
            '--dnd-border-gold': '#4d0000',
            '--dnd-border-inner': '#2a0000',
            '--dnd-bg-card-start': '#140a0a',
            '--dnd-bg-card-end': '#0a0505',
            '--dnd-btn-primary': '#3d0000',
            '--dnd-btn-primary-hover': '#5c0000',
            '--dnd-btn-text': '#cccccc'
        },
        morphology: {
            border: { style: 'double', width: '4px', outerStyle: 'none' },
            corners: { style: 'sharp', clipPath: 'none' },
            card: { shape: 'gothic', decoration: 'ornate' },
            effects: { texture: 'fabric', innerGlow: 'none', borderGlow: 'evil', overlay: 'blood-vignette' },
            layout: { density: 'spacious' },
            decorations: { headers: 'banner', corners: 'flourish' },
            buttons: { style: 'gothic', shape: 'pointed' },
            progressBars: { style: 'blood', animated: true }
        },
        typography: {
            '--dnd-font-serif': '"Cinzel", "Times New Roman", serif',
            '--dnd-font-size-header': '1.3rem',
            '--dnd-letter-spacing': '0.05em'
        },
        animations: {
            '--dnd-transition-fast': '0.15s ease-out',
            '--dnd-transition-normal': '0.3s ease-out',
            '--dnd-animation-pulse': 'gothic-pulse 3s ease-in-out infinite'
        },
        interactiveStates: {
            hover: {
                brightness: 1.15,
                scale: 1.02,
                lift: '-4px',
                shadow: '0 12px 35px rgba(138, 10, 10, 0.5), 0 0 20px rgba(138, 10, 10, 0.3)',
                borderColor: '#8a0a0a',
                glow: 'drop-shadow(0 0 8px rgba(138, 10, 10, 0.6))',
                transition: '0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
            },
            cardHover: {
                transform: 'translateY(-8px) scale(1.02) rotateX(2deg)',
                shadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 40px rgba(138, 10, 10, 0.4), inset 0 0 30px rgba(138, 10, 10, 0.1)',
                borderColor: '#cc0000'
            },
            buttonHover: {
                brightness: 1.3,
                transform: 'translateY(-3px) scale(1.03)',
                shadow: '0 8px 25px rgba(138, 10, 10, 0.6), 0 0 15px rgba(255, 0, 0, 0.4)'
            },
            active: {
                scale: 0.95,
                brightness: 0.85,
                transform: 'translateY(2px) scale(0.95)',
                shadow: '0 2px 10px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.3)'
            },
            buttonActive: {
                transform: 'translateY(3px) scale(0.97)',
                shadow: '0 1px 5px rgba(0,0,0,0.5), inset 0 2px 5px rgba(0,0,0,0.3)'
            },
            selected: {
                background: 'linear-gradient(90deg, rgba(138, 10, 10, 0.4), rgba(77, 0, 0, 0.2), transparent)',
                borderColor: '#ff3333',
                borderWidth: '2px',
                glow: '0 0 20px rgba(138, 10, 10, 0.5)',
                textColor: '#ff6666'
            },
            navActive: {
                background: 'linear-gradient(90deg, rgba(138, 10, 10, 0.5), rgba(77, 0, 0, 0.3), transparent)',
                border: '3px solid #8a0a0a',
                indicator: '#cc0000'
            },
            focus: {
                borderColor: '#cc0000',
                shadow: '0 0 0 4px rgba(138, 10, 10, 0.3), 0 0 20px rgba(138, 10, 10, 0.2)',
                outline: 'none'
            },
            disabled: {
                opacity: 0.35,
                cursor: 'not-allowed',
                filter: 'grayscale(0.7) brightness(0.5)'
            },
            iconHover: {
                glow: 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.8)) drop-shadow(0 0 20px rgba(138, 10, 10, 0.5))',
                scale: 1.2
            },
            inputFocus: {
                border: '#8a0a0a',
                shadow: '0 0 15px rgba(138, 10, 10, 0.4), inset 0 0 10px rgba(138, 10, 10, 0.15)'
            }
        },
        overrides: {
            /* ====== 卡片 - 哥特式尖顶拱门形态 ====== */
            '.dnd-char-card': {
                'border': '3px double #4d0000',
                'border-radius': '0',
                'clip-path': 'polygon(0 15px, 15px 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)',
                'box-shadow': '0 10px 40px rgba(0,0,0,0.95), inset 0 0 60px rgba(138, 10, 10, 0.15), 0 0 30px rgba(138, 10, 10, 0.2)',
                'background': 'linear-gradient(180deg, #140a0a 0%, #0a0505 50%, #050202 100%)'
            },
            '.dnd-card-header': {
                'border-bottom': '2px solid #4d0000',
                'background': 'linear-gradient(to right, rgba(138, 10, 10, 0.35), rgba(0,0,0,0.8), rgba(138, 10, 10, 0.35))',
                'padding': '14px 18px',
                'position': 'relative'
            },
            '.dnd-card-body': {
                'background': 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(138, 10, 10, 0.03) 40px, rgba(138, 10, 10, 0.03) 41px)',
                'padding': '16px'
            },
            /* ====== 导航栏 - 血色石柱 ====== */
            '.dnd-nav-sidebar': {
                'background': 'linear-gradient(180deg, #1a0505 0%, #0a0202 100%)',
                'border-right': '3px solid #4d0000',
                'box-shadow': '5px 0 20px rgba(0,0,0,0.8)'
            },
            '.dnd-nav-item': {
                'border-left': '4px solid transparent',
                'margin': '2px 0',
                'padding': '14px 20px',
                'background': 'rgba(138, 10, 10, 0.05)',
                'transition': 'all 0.3s ease-out',
                'clip-path': 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
            },
            '.dnd-nav-item:hover': {
                'background': 'linear-gradient(90deg, rgba(138, 10, 10, 0.3), rgba(77, 0, 0, 0.15))',
                'border-left-color': '#8a0a0a',
                'text-shadow': '0 0 8px rgba(255, 0, 0, 0.5)'
            },
            '.dnd-nav-item.active': {
                'background': 'linear-gradient(90deg, rgba(138, 10, 10, 0.5), rgba(77, 0, 0, 0.25), transparent)',
                'box-shadow': 'inset 4px 0 0 #cc0000, 0 0 25px rgba(138, 10, 10, 0.4)',
                'border-left-color': '#ff3333'
            },
            /* ====== 进度条 - 血液流动 ====== */
            '.dnd-bar-container': {
                'background': 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(20,5,5,0.8))',
                'border': '1px solid #4d0000',
                'border-radius': '0',
                'height': '10px',
                'box-shadow': 'inset 0 2px 5px rgba(0,0,0,0.8)'
            },
            '.dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #3d0000 0%, #8a0a0a 40%, #cc0000 60%, #8a0a0a 80%, #3d0000 100%)',
                'box-shadow': '0 0 12px rgba(204, 0, 0, 0.6), inset 0 0 5px rgba(255, 100, 100, 0.3)',
                'border-radius': '0'
            },
            '.dnd-bar-hp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #2a0000 0%, #6a0000 40%, #aa0000 60%, #6a0000 80%, #2a0000 100%)'
            },
            '.dnd-bar-exp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #200020 0%, #400040 40%, #600060 60%, #400040 80%, #200020 100%)'
            },
            /* ====== 按钮 - 哥特式石碑 ====== */
            '.dnd-btn, .dnd-action-btn': {
                'text-transform': 'uppercase',
                'letter-spacing': '0.12em',
                'border': '2px solid #4d0000',
                'background': 'linear-gradient(180deg, #2a0a0a 0%, #1a0505 50%, #0f0303 100%)',
                'box-shadow': 'inset 0 1px 0 rgba(255,100,100,0.1), 0 4px 10px rgba(0,0,0,0.6)',
                'clip-path': 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
                'font-family': '"Cinzel", serif',
                'position': 'relative'
            },
            '.dnd-btn:hover, .dnd-action-btn:hover': {
                'background': 'linear-gradient(180deg, #3d0a0a 0%, #2a0505 50%, #1a0303 100%)',
                'border-color': '#8a0a0a',
                'box-shadow': '0 0 20px rgba(138, 10, 10, 0.5), 0 6px 15px rgba(0,0,0,0.7)'
            },
            '.dnd-btn:active, .dnd-action-btn:active': {
                'background': 'linear-gradient(180deg, #1a0505 0%, #0f0303 100%)',
                'box-shadow': 'inset 0 3px 8px rgba(0,0,0,0.6)'
            },
            /* ====== 属性行 - 墓碑铭文 ====== */
            '.dnd-stat-row': {
                'background': 'linear-gradient(90deg, rgba(77, 0, 0, 0.15), rgba(20, 10, 10, 0.3), rgba(77, 0, 0, 0.15))',
                'border': '1px solid rgba(77, 0, 0, 0.4)',
                'border-top': '1px solid rgba(138, 10, 10, 0.3)',
                'border-radius': '0',
                'padding': '8px 12px',
                'margin': '3px 0'
            },
            '.dnd-stat-row:hover': {
                'background': 'linear-gradient(90deg, rgba(138, 10, 10, 0.25), rgba(20, 10, 10, 0.4), rgba(138, 10, 10, 0.25))'
            },
            /* ====== 标题样式 - 血色铭文 ====== */
            '.dnd-title, .dnd-char-name': {
                'text-shadow': '0 0 10px #ff0000, 0 0 25px rgba(255, 0, 0, 0.6), 0 2px 4px rgba(0,0,0,0.8)',
                'font-family': '"Cinzel", serif',
                'letter-spacing': '0.1em'
            },
            /* ====== 面板/弹窗 - 哥特式窗框 ====== */
            '.dnd-panel, .dnd-dialog': {
                'border': '3px double #4d0000',
                'border-radius': '0',
                'clip-path': 'polygon(0 20px, 20px 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
                'box-shadow': '0 15px 50px rgba(0,0,0,0.9), inset 0 0 80px rgba(138, 10, 10, 0.1)'
            },
            /* ====== 输入框 ====== */
            '.dnd-input, .dnd-select, .dnd-textarea': {
                'background': 'rgba(10, 5, 5, 0.9)',
                'border': '1px solid #4d0000',
                'border-radius': '0',
                'color': '#b3b3b3'
            },
            '.dnd-input:focus, .dnd-select:focus, .dnd-textarea:focus': {
                'border-color': '#8a0a0a',
                'box-shadow': '0 0 15px rgba(138, 10, 10, 0.4), inset 0 0 8px rgba(138, 10, 10, 0.15)'
            },
            /* ====== 表格 ====== */
            '.dnd-table': {
                'border': '1px solid #4d0000'
            },
            '.dnd-table th': {
                'background': 'linear-gradient(180deg, #2a0505, #1a0303)',
                'border-bottom': '2px solid #8a0a0a',
                'color': '#ff3333',
                'letter-spacing': '0.08em'
            },
            '.dnd-table td': {
                'border-bottom': '1px solid rgba(77, 0, 0, 0.4)'
            },
            '.dnd-table tr:hover td': {
                'background': 'rgba(138, 10, 10, 0.15)'
            },
            /* ====== 徽章 ====== */
            '.dnd-badge': {
                'background': 'linear-gradient(135deg, #4d0000, #2a0000)',
                'border': '1px solid #8a0a0a',
                'border-radius': '0',
                'clip-path': 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)'
            },
            /* ====== 迷你HUD ====== */
            '#dnd-mini-hud': {
                'border': '2px solid #4d0000',
                'border-radius': '0',
                'clip-path': 'polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                'background': 'linear-gradient(180deg, rgba(26, 5, 5, 0.98), rgba(10, 2, 2, 1))'
            }
        },
        customCSS: `
            /* ====== 暗黑哥特皮肤 - 恐怖氛围动画与装饰 ====== */
            
            /* 血红脉动光效 */
            @keyframes gothic-pulse {
                0%, 100% {
                    box-shadow: 0 10px 40px rgba(0,0,0,0.95), inset 0 0 60px rgba(138, 10, 10, 0.15), 0 0 30px rgba(138, 10, 10, 0.2);
                    filter: brightness(1);
                }
                50% {
                    box-shadow: 0 10px 40px rgba(0,0,0,0.95), inset 0 0 80px rgba(138, 10, 10, 0.25), 0 0 50px rgba(138, 10, 10, 0.35);
                    filter: brightness(1.03);
                }
            }
            
            /* 血液滴落动画 */
            @keyframes blood-drip {
                0% { height: 0; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { height: 30px; opacity: 0; }
            }
            
            /* 阴影呼吸效果 */
            @keyframes shadow-breathe {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 0.6; transform: scale(1.02); }
            }
            
            /* 恐怖闪烁 */
            @keyframes horror-flicker {
                0%, 100% { opacity: 1; }
                92% { opacity: 1; }
                93% { opacity: 0.3; }
                94% { opacity: 1; }
                96% { opacity: 0.5; }
                97% { opacity: 1; }
            }
            
            /* 血红边框流动 */
            @keyframes blood-flow {
                0% { background-position: 0% 0%; }
                100% { background-position: 200% 0%; }
            }
            
            /* 卡片 - 哥特式恐怖氛围 */
            .dnd-char-card {
                position: relative;
                animation: gothic-pulse 4s ease-in-out infinite;
            }
            
            /* 血色暗角叠加 */
            .dnd-char-card::before {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.8) 100%);
                pointer-events: none;
                z-index: 1;
            }
            
            /* 装饰性裂痕纹理 */
            .dnd-char-card::after {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background:
                    linear-gradient(45deg, transparent 48%, rgba(77, 0, 0, 0.1) 49%, rgba(77, 0, 0, 0.1) 51%, transparent 52%),
                    linear-gradient(-45deg, transparent 48%, rgba(77, 0, 0, 0.1) 49%, rgba(77, 0, 0, 0.1) 51%, transparent 52%);
                background-size: 40px 40px;
                pointer-events: none;
                z-index: 0;
                opacity: 0.5;
            }
            
            /* 卡片头部 - 尖顶拱门装饰 */
            .dnd-card-header::before {
                content: "†";
                position: absolute;
                left: 12px; top: 50%;
                transform: translateY(-50%);
                color: #8a0a0a;
                font-size: 16px;
                text-shadow: 0 0 10px rgba(138, 10, 10, 0.8);
            }
            
            .dnd-card-header::after {
                content: "†";
                position: absolute;
                right: 12px; top: 50%;
                transform: translateY(-50%);
                color: #8a0a0a;
                font-size: 16px;
                text-shadow: 0 0 10px rgba(138, 10, 10, 0.8);
            }
            
            /* 导航项 - 血迹指示 */
            .dnd-nav-item::before {
                content: "";
                position: absolute;
                left: 0; top: 50%;
                transform: translateY(-50%);
                width: 4px; height: 0;
                background: linear-gradient(to bottom, #cc0000, #8a0a0a);
                transition: height 0.3s ease-out;
                box-shadow: 0 0 10px rgba(204, 0, 0, 0.5);
            }
            
            .dnd-nav-item:hover::before {
                height: 70%;
            }
            
            .dnd-nav-item.active::before {
                height: 100%;
                box-shadow: 0 0 15px rgba(204, 0, 0, 0.8);
            }
            
            .dnd-nav-item.active::after {
                content: "⛧";
                position: absolute;
                right: 12px;
                color: #cc0000;
                font-size: 12px;
                text-shadow: 0 0 8px rgba(204, 0, 0, 0.8);
                animation: horror-flicker 3s infinite;
            }
            
            /* 按钮 - 石碑雕刻效果 */
            .dnd-btn::before,
            .dnd-action-btn::before {
                content: "";
                position: absolute;
                top: 3px; left: 3px; right: 3px; bottom: 3px;
                border: 1px solid rgba(138, 10, 10, 0.2);
                pointer-events: none;
            }
            
            /* 进度条 - 血液流动效果 */
            .dnd-bar-fill {
                position: relative;
                overflow: hidden;
            }
            
            .dnd-bar-fill::before {
                content: "";
                position: absolute;
                top: 0; left: -100%; width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 100, 100, 0.3), transparent);
                animation: blood-flow 2s ease-in-out infinite;
            }
            
            /* 分隔线 - 铁栅栏 */
            .dnd-divider {
                height: 3px;
                background:
                    linear-gradient(90deg, transparent, #4d0000 20%, #8a0a0a 50%, #4d0000 80%, transparent),
                    repeating-linear-gradient(90deg, transparent, transparent 10px, #2a0000 10px, #2a0000 11px);
                position: relative;
            }
            
            .dnd-divider::before {
                content: "☠";
                position: absolute;
                left: 50%; top: 50%;
                transform: translate(-50%, -50%);
                background: #0a0505;
                padding: 0 12px;
                color: #8a0a0a;
                font-size: 14px;
                text-shadow: 0 0 8px rgba(138, 10, 10, 0.6);
            }
            
            /* 面板角落 - 哥特式装饰 */
            .dnd-panel::before,
            .dnd-dialog::before {
                content: "⚜";
                position: absolute;
                top: 8px; left: 10px;
                color: #4d0000;
                font-size: 16px;
                text-shadow: 0 0 5px rgba(77, 0, 0, 0.5);
            }
            
            .dnd-panel::after,
            .dnd-dialog::after {
                content: "⚜";
                position: absolute;
                bottom: 8px; right: 10px;
                color: #4d0000;
                font-size: 16px;
                text-shadow: 0 0 5px rgba(77, 0, 0, 0.5);
                transform: rotate(180deg);
            }
            
            /* 滚动条 - 血迹风格 */
            .dnd-content-area::-webkit-scrollbar {
                width: 10px;
            }
            
            .dnd-content-area::-webkit-scrollbar-track {
                background: #0a0505;
                border-left: 1px solid #4d0000;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #4d0000, #8a0a0a, #4d0000);
                border: 1px solid #2a0000;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #8a0a0a, #cc0000, #8a0a0a);
                box-shadow: 0 0 10px rgba(204, 0, 0, 0.5);
            }
            
            /* 图标容器 - 五芒星形 */
            .dnd-icon-circle {
                clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                border: none;
                background: linear-gradient(135deg, #4d0000, #2a0000);
                box-shadow: 0 0 15px rgba(138, 10, 10, 0.5);
            }
            
            /* 头像框 - 棺材形 */
            .dnd-avatar {
                clip-path: polygon(20% 0%, 80% 0%, 100% 15%, 100% 85%, 80% 100%, 20% 100%, 0% 85%, 0% 15%);
                border: 2px solid #4d0000;
                box-shadow: 0 0 20px rgba(138, 10, 10, 0.4);
            }
            
            /* 悬停时的恐怖效果 */
            .dnd-char-card:hover {
                animation: horror-flicker 0.5s ease-in-out;
            }
            
            /* 工具提示 - 墓碑 */
            .dnd-tooltip {
                background: linear-gradient(180deg, #1a0505, #0a0303);
                border: 2px solid #4d0000;
                clip-path: polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
                box-shadow: 0 5px 20px rgba(0,0,0,0.8);
            }
        `,
        background: {
            type: 'particles',
            colors: ['rgba(138, 10, 10, 0.6)', 'rgba(50, 0, 0, 0.8)', 'rgba(20, 0, 0, 0.9)'],
            minSize: 1,
            maxSize: 4,
            count: 30,
            speed: 0.08,
            shape: 'circle',
            glow: true
        }
    },

    // 4. 精灵森林 (自然、清新) - 绿色、木质、柔和
    'elven-forest': {
        meta: {
            id: 'elven-forest',
            name: '精灵之森',
            icon: '🍃',
            description: '清新自然的森林风格，带有木质纹理',
            author: 'System'
        },
        colors: {
            '--dnd-bg-main': '#1a261a',
            '--dnd-bg-panel-start': '#2d402d',
            '--dnd-bg-panel-end': '#1e2b1e',
            '--dnd-text-main': '#e0f2e0',
            '--dnd-text-header': '#aaddaa',
            '--dnd-text-highlight': '#ffffff',
            '--dnd-text-dim': '#8ba38b',
            '--dnd-accent': '#4caf50',
            '--dnd-accent-hover': '#66bb6a',
            '--dnd-border-gold': '#8a9a5b',
            '--dnd-border-inner': '#3e5c3e',
            '--dnd-bg-card-start': 'rgba(45, 64, 45, 0.9)',
            '--dnd-bg-card-end': 'rgba(30, 43, 30, 0.9)',
            '--dnd-btn-primary': '#2e7d32',
            '--dnd-btn-primary-hover': '#388e3c',
            '--dnd-btn-text': '#ffffff'
        },
        morphology: {
            border: { style: 'solid', width: '2px', outerStyle: 'none' },
            corners: { style: 'organic', clipPath: 'none' },
            card: { shape: 'organic', decoration: 'vines' },
            effects: { texture: 'wood', innerGlow: 'subtle', borderGlow: 'none', overlay: 'gradient' },
            layout: { density: 'normal' },
            decorations: { dividers: 'leaves', corners: 'flourish' },
            buttons: { style: 'leaf', shape: 'rounded' },
            progressBars: { style: 'nature', animated: true }
        },
        typography: {
            '--dnd-font-serif': '"Palatino Linotype", "Book Antiqua", Palatino, serif',
            '--dnd-font-size-base': '0.95rem',
            '--dnd-letter-spacing': '0.02em'
        },
        animations: {
            '--dnd-transition-fast': '0.2s ease-out',
            '--dnd-transition-normal': '0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            '--dnd-animation-sway': 'elven-sway 4s ease-in-out infinite'
        },
        interactiveStates: {
            hover: {
                brightness: 1.12,
                scale: 1.02,
                lift: '-4px',
                shadow: '0 10px 30px rgba(76, 175, 80, 0.25), 0 0 15px rgba(139, 195, 74, 0.2)',
                borderColor: '#8a9a5b',
                glow: 'drop-shadow(0 0 6px rgba(76, 175, 80, 0.4))',
                transition: '0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            cardHover: {
                transform: 'translateY(-6px) scale(1.015) rotate(-0.5deg)',
                shadow: '0 18px 40px rgba(30, 43, 30, 0.5), 0 0 25px rgba(76, 175, 80, 0.2)',
                borderColor: '#aaddaa'
            },
            buttonHover: {
                brightness: 1.2,
                transform: 'translateY(-2px) scale(1.03)',
                shadow: '0 6px 20px rgba(76, 175, 80, 0.4), 0 0 10px rgba(139, 195, 74, 0.3)'
            },
            active: {
                scale: 0.97,
                brightness: 0.92,
                transform: 'translateY(1px) scale(0.97)',
                shadow: '0 2px 8px rgba(0,0,0,0.3)'
            },
            buttonActive: {
                transform: 'translateY(2px) scale(0.98)',
                shadow: '0 1px 4px rgba(0,0,0,0.3), inset 0 1px 3px rgba(0,0,0,0.2)'
            },
            selected: {
                background: 'linear-gradient(90deg, rgba(76, 175, 80, 0.25), rgba(139, 195, 74, 0.15), transparent)',
                borderColor: '#aaddaa',
                borderWidth: '2px',
                glow: '0 0 15px rgba(76, 175, 80, 0.3)',
                textColor: '#ffffff'
            },
            navActive: {
                background: 'linear-gradient(90deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.15), transparent)',
                border: '3px solid #8a9a5b',
                indicator: '#4caf50'
            },
            focus: {
                borderColor: '#4caf50',
                shadow: '0 0 0 3px rgba(76, 175, 80, 0.25)',
                outline: 'none'
            },
            disabled: {
                opacity: 0.45,
                cursor: 'not-allowed',
                filter: 'grayscale(0.6) brightness(0.7)'
            },
            iconHover: {
                glow: 'drop-shadow(0 0 8px rgba(76, 175, 80, 0.7)) drop-shadow(0 0 15px rgba(139, 195, 74, 0.4))',
                scale: 1.15
            },
            inputFocus: {
                border: '#4caf50',
                shadow: '0 0 12px rgba(76, 175, 80, 0.35), inset 0 0 8px rgba(76, 175, 80, 0.1)'
            }
        },
        overrides: {
            /* ====== 卡片 - 树叶/有机形态 ====== */
            '.dnd-char-card': {
                'border-radius': '25px 8px 25px 8px',
                'border': '2px solid #3e5c3e',
                'box-shadow': '0 8px 30px rgba(30, 43, 30, 0.5), inset 0 0 40px rgba(76, 175, 80, 0.08), 0 0 20px rgba(139, 195, 74, 0.1)',
                'background': 'linear-gradient(135deg, rgba(45, 64, 45, 0.95) 0%, rgba(35, 50, 35, 0.97) 50%, rgba(30, 43, 30, 0.98) 100%)'
            },
            '.dnd-card-header': {
                'border-bottom': '2px solid #3e5c3e',
                'background': 'linear-gradient(to right, rgba(76, 175, 80, 0.2), rgba(62, 92, 62, 0.15), rgba(139, 195, 74, 0.15))',
                'border-radius': '23px 6px 0 0',
                'padding': '14px 18px',
                'position': 'relative'
            },
            '.dnd-card-body': {
                'background': 'radial-gradient(ellipse at bottom right, rgba(76, 175, 80, 0.05), transparent 70%)',
                'padding': '16px'
            },
            /* ====== 导航栏 - 树干纹理 ====== */
            '.dnd-nav-sidebar': {
                'background': 'linear-gradient(180deg, #2d402d 0%, #1e2b1e 100%)',
                'border-right': '3px solid #3e5c3e',
                'box-shadow': '3px 0 15px rgba(30, 43, 30, 0.4)'
            },
            '.dnd-nav-item': {
                'border-radius': '0 20px 20px 0',
                'margin': '4px 0',
                'padding': '12px 20px',
                'border-left': '4px solid transparent',
                'background': 'rgba(76, 175, 80, 0.03)',
                'transition': 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            '.dnd-nav-item:hover': {
                'background': 'linear-gradient(90deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1), transparent)',
                'border-left-color': '#8bc34a',
                'padding-left': '24px'
            },
            '.dnd-nav-item.active': {
                'background': 'linear-gradient(90deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.15), transparent)',
                'border-left-color': '#4caf50',
                'box-shadow': 'inset 4px 0 0 #8bc34a, 0 0 20px rgba(76, 175, 80, 0.25)',
                'border-radius': '0 20px 20px 0'
            },
            /* ====== 进度条 - 藤蔓生长 ====== */
            '.dnd-bar-container': {
                'background': 'linear-gradient(180deg, rgba(30, 43, 30, 0.8), rgba(45, 64, 45, 0.6))',
                'border': '1px solid #3e5c3e',
                'border-radius': '10px',
                'height': '10px',
                'box-shadow': 'inset 0 1px 4px rgba(0,0,0,0.4)'
            },
            '.dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #2e7d32 0%, #4caf50 40%, #8bc34a 70%, #4caf50 100%)',
                'box-shadow': '0 0 10px rgba(76, 175, 80, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                'border-radius': '8px'
            },
            '.dnd-bar-hp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #1b5e20 0%, #2e7d32 40%, #43a047 70%, #2e7d32 100%)'
            },
            '.dnd-bar-exp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #33691e 0%, #558b2f 40%, #7cb342 70%, #558b2f 100%)'
            },
            /* ====== 按钮 - 树叶形态 ====== */
            '.dnd-btn, .dnd-action-btn': {
                'border': '2px solid #3e5c3e',
                'background': 'linear-gradient(135deg, #2d402d 0%, #243424 100%)',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.1), 0 3px 8px rgba(0,0,0,0.3)',
                'border-radius': '20px 8px 20px 8px',
                'font-family': '"Palatino Linotype", serif',
                'position': 'relative',
                'overflow': 'hidden'
            },
            '.dnd-btn:hover, .dnd-action-btn:hover': {
                'background': 'linear-gradient(135deg, #3d503d 0%, #2d402d 100%)',
                'border-color': '#4caf50',
                'box-shadow': '0 0 15px rgba(76, 175, 80, 0.3), 0 5px 12px rgba(0,0,0,0.4)'
            },
            '.dnd-btn:active, .dnd-action-btn:active': {
                'background': 'linear-gradient(135deg, #243424 0%, #1a261a 100%)',
                'box-shadow': 'inset 0 2px 4px rgba(0,0,0,0.3)'
            },
            /* ====== 属性行 - 苔藓纹理 ====== */
            '.dnd-stat-row': {
                'background': 'linear-gradient(90deg, rgba(76, 175, 80, 0.1), rgba(62, 92, 62, 0.15), rgba(76, 175, 80, 0.08))',
                'border': '1px solid rgba(62, 92, 62, 0.3)',
                'border-radius': '12px 4px 12px 4px',
                'padding': '8px 12px',
                'margin': '4px 0'
            },
            '.dnd-stat-row:hover': {
                'background': 'linear-gradient(90deg, rgba(76, 175, 80, 0.18), rgba(62, 92, 62, 0.2), rgba(76, 175, 80, 0.15))'
            },
            /* ====== 标题样式 - 精灵文字 ====== */
            '.dnd-title, .dnd-char-name': {
                'text-shadow': '0 2px 10px rgba(76, 175, 80, 0.4), 0 0 20px rgba(139, 195, 74, 0.2)',
                'font-family': '"Palatino Linotype", "Book Antiqua", serif',
                'letter-spacing': '0.05em'
            },
            /* ====== 面板/弹窗 - 树洞形态 ====== */
            '.dnd-panel, .dnd-dialog': {
                'border': '2px solid #3e5c3e',
                'border-radius': '30px 10px 30px 10px',
                'box-shadow': '0 10px 40px rgba(30, 43, 30, 0.6), inset 0 0 50px rgba(76, 175, 80, 0.05)'
            },
            '#dnd-mini-hud': {
                'border': '2px solid #3e5c3e',
                'border-radius': '20px 6px 20px 6px',
                'background': 'linear-gradient(180deg, rgba(45, 64, 45, 0.98), rgba(30, 43, 30, 0.99))'
            },
            /* ====== 输入框 ====== */
            '.dnd-input, .dnd-select, .dnd-textarea': {
                'background': 'rgba(30, 43, 30, 0.8)',
                'border': '1px solid #3e5c3e',
                'border-radius': '12px 4px 12px 4px',
                'color': '#e0f2e0'
            },
            '.dnd-input:focus, .dnd-select:focus, .dnd-textarea:focus': {
                'border-color': '#4caf50',
                'box-shadow': '0 0 12px rgba(76, 175, 80, 0.4), inset 0 0 6px rgba(76, 175, 80, 0.1)'
            },
            /* ====== 表格 ====== */
            '.dnd-table th': {
                'background': 'linear-gradient(180deg, #2d402d, #243424)',
                'border-bottom': '2px solid #4caf50',
                'color': '#aaddaa'
            },
            '.dnd-table td': {
                'border-bottom': '1px solid rgba(62, 92, 62, 0.3)'
            },
            '.dnd-table tr:hover td': {
                'background': 'rgba(76, 175, 80, 0.1)'
            },
            /* ====== 徽章 ====== */
            '.dnd-badge': {
                'background': 'linear-gradient(135deg, #3e5c3e, #2d402d)',
                'border': '1px solid #4caf50',
                'border-radius': '15px 5px 15px 5px'
            }
        },
        customCSS: `
            /* ====== 精灵之森皮肤 - 自然有机动画与装饰 ====== */
            
            /* 轻柔摇摆动画 */
            @keyframes elven-sway {
                0%, 100% { transform: rotate(0deg) translateY(0); }
                25% { transform: rotate(0.5deg) translateY(-1px); }
                50% { transform: rotate(0deg) translateY(0); }
                75% { transform: rotate(-0.5deg) translateY(-1px); }
            }
            
            /* 叶片飘落动画 */
            @keyframes leaf-fall {
                0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
            }
            
            /* 萤火虫光效 */
            @keyframes firefly-glow {
                0%, 100% { opacity: 0.3; box-shadow: 0 0 5px rgba(200, 230, 100, 0.5); }
                50% { opacity: 1; box-shadow: 0 0 15px rgba(200, 230, 100, 0.8); }
            }
            
            /* 藤蔓生长动画 */
            @keyframes vine-grow {
                0% { width: 0; }
                100% { width: 100%; }
            }
            
            /* 露珠闪烁 */
            @keyframes dewdrop-sparkle {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }
            
            /* 卡片 - 森林树叶形态 */
            .dnd-char-card {
                position: relative;
                animation: elven-sway 6s ease-in-out infinite;
            }
            
            /* 外发光边框 - 自然光晕 */
            .dnd-char-card::before {
                content: "";
                position: absolute;
                top: -3px; left: -3px; right: -3px; bottom: -3px;
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.4) 0%, transparent 25%, transparent 75%, rgba(139, 195, 74, 0.3) 100%);
                border-radius: 27px 10px 27px 10px;
                pointer-events: none;
                z-index: -1;
                filter: blur(3px);
            }
            
            /* 木纹/树皮纹理叠加 */
            .dnd-char-card::after {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02 0.08' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)' opacity='0.04'/%3E%3C/svg%3E");
                pointer-events: none;
                border-radius: inherit;
                z-index: 0;
            }
            
            /* 卡片头部 - 树枝装饰 */
            .dnd-card-header::before {
                content: "❧";
                position: absolute;
                left: 12px; top: 50%;
                transform: translateY(-50%);
                color: #4caf50;
                font-size: 14px;
                opacity: 0.6;
            }
            
            .dnd-card-header::after {
                content: "❧";
                position: absolute;
                right: 12px; top: 50%;
                transform: translateY(-50%) scaleX(-1);
                color: #8bc34a;
                font-size: 14px;
                opacity: 0.6;
            }
            
            /* 导航项 - 藤蔓延伸效果 */
            .dnd-nav-item::before {
                content: "";
                position: absolute;
                left: 0; top: 50%;
                transform: translateY(-50%);
                width: 0; height: 3px;
                background: linear-gradient(90deg, #4caf50, #8bc34a);
                transition: width 0.3s ease-out;
                border-radius: 0 3px 3px 0;
            }
            
            .dnd-nav-item:hover::before {
                width: 20px;
            }
            
            .dnd-nav-item.active::before {
                width: 30px;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
            }
            
            .dnd-nav-item.active::after {
                content: "🍃";
                position: absolute;
                right: 12px;
                font-size: 12px;
                animation: elven-sway 3s ease-in-out infinite;
            }
            
            /* 按钮 - 叶脉纹理 */
            .dnd-btn::before,
            .dnd-action-btn::before {
                content: "";
                position: absolute;
                top: 50%; left: 10%;
                width: 80%; height: 1px;
                background: linear-gradient(90deg, transparent, rgba(139, 195, 74, 0.3), transparent);
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .dnd-btn:hover::before,
            .dnd-action-btn:hover::before {
                opacity: 1;
            }
            
            /* 进度条 - 生长动画 */
            .dnd-bar-fill {
                position: relative;
                overflow: hidden;
            }
            
            .dnd-bar-fill::before {
                content: "";
                position: absolute;
                top: 0; left: -50%; width: 50%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
                animation: vine-grow 2s ease-in-out infinite;
            }
            
            /* 分隔线 - 藤蔓 */
            .dnd-divider {
                height: 2px;
                background: linear-gradient(90deg, transparent, #3e5c3e, #4caf50, #8bc34a, #4caf50, #3e5c3e, transparent);
                position: relative;
                margin: 12px 0;
            }
            
            .dnd-divider::before {
                content: "✿";
                position: absolute;
                left: 50%; top: 50%;
                transform: translate(-50%, -50%);
                background: #1e2b1e;
                padding: 0 10px;
                color: #4caf50;
                font-size: 12px;
            }
            
            /* 面板角落 - 树叶装饰 */
            .dnd-panel::before,
            .dnd-dialog::before {
                content: "🌿";
                position: absolute;
                top: 8px; left: 10px;
                font-size: 14px;
                opacity: 0.6;
            }
            
            .dnd-panel::after,
            .dnd-dialog::after {
                content: "🌿";
                position: absolute;
                bottom: 8px; right: 10px;
                font-size: 14px;
                opacity: 0.6;
                transform: rotate(180deg);
            }
            
            /* 滚动条 - 树干风格 */
            .dnd-content-area::-webkit-scrollbar {
                width: 10px;
            }
            
            .dnd-content-area::-webkit-scrollbar-track {
                background: rgba(30, 43, 30, 0.5);
                border-left: 1px solid #3e5c3e;
                border-radius: 5px;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #3e5c3e, #4caf50, #3e5c3e);
                border-radius: 5px;
                border: 1px solid #2d402d;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #4caf50, #8bc34a, #4caf50);
            }
            
            /* 图标容器 - 花朵形 */
            .dnd-icon-circle {
                border-radius: 50%;
                border: 2px solid #4caf50;
                background: radial-gradient(circle at 30% 30%, #3e5c3e, #2d402d);
                box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
            }
            
            /* 头像框 - 有机不规则形 */
            .dnd-avatar {
                border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%;
                border: 2px solid #4caf50;
                box-shadow: 0 0 15px rgba(76, 175, 80, 0.3), 0 0 30px rgba(139, 195, 74, 0.15);
            }
            
            /* 工具提示 */
            .dnd-tooltip {
                background: linear-gradient(135deg, #2d402d, #1e2b1e);
                border: 1px solid #4caf50;
                border-radius: 15px 5px 15px 5px;
                box-shadow: 0 5px 20px rgba(30, 43, 30, 0.6);
            }
            
            /* 悬浮光效 */
            .dnd-char-card:hover {
                box-shadow: 0 12px 40px rgba(30, 43, 30, 0.6), inset 0 0 50px rgba(76, 175, 80, 0.1), 0 0 30px rgba(139, 195, 74, 0.2);
            }
        `,
        background: {
            type: 'particles',
            colors: ['rgba(76, 175, 80, 0.5)', 'rgba(139, 195, 74, 0.4)', 'rgba(255, 255, 255, 0.4)', 'rgba(200, 230, 200, 0.3)'],
            minSize: 2,
            maxSize: 6,
            count: 25,
            speed: 0.05,
            shape: 'circle',
            glow: true
        }
    },

    // 5. 矮人锻炉 (工业、硬朗) - 铁灰、橙色、金属
    'dwarven-forge': {
        meta: {
            id: 'dwarven-forge',
            name: '矮人锻炉',
            icon: '⚒️',
            description: '坚固硬朗的金属风格，仿佛刚出炉的兵器',
            author: 'System'
        },
        colors: {
            '--dnd-bg-main': '#1c1c1c',
            '--dnd-bg-panel-start': '#2b2b2b',
            '--dnd-bg-panel-end': '#1f1f1f',
            '--dnd-text-main': '#dcdcdc',
            '--dnd-text-header': '#ffaa00',
            '--dnd-text-highlight': '#ffcc00',
            '--dnd-text-dim': '#909090',
            '--dnd-accent': '#ff9800',
            '--dnd-accent-hover': '#ffb74d',
            '--dnd-border-gold': '#cd7f32',
            '--dnd-border-inner': '#555555',
            '--dnd-bg-card-start': '#333333',
            '--dnd-bg-card-end': '#262626',
            '--dnd-btn-primary': '#e65100',
            '--dnd-btn-primary-hover': '#f57c00',
            '--dnd-btn-text': '#ffffff'
        },
        morphology: {
            border: { style: 'groove', width: '4px', outerStyle: 'none' },
            corners: { style: 'chamfer', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' },
            card: { shape: 'blocky', decoration: 'rivets' },
            effects: { texture: 'metal', innerGlow: 'none', borderGlow: 'gold', overlay: 'none' },
            layout: { density: 'compact' },
            decorations: { corners: 'bolts', dividers: 'bars' },
            buttons: { style: 'metallic', shape: 'chamfer' },
            progressBars: { style: 'molten', animated: true }
        },
        typography: {
            '--dnd-font-serif': '"Trebuchet MS", Arial, sans-serif',
            '--dnd-font-size-header': '1.1rem',
            '--dnd-font-weight-header': '700',
            '--dnd-letter-spacing': '0.03em'
        },
        animations: {
            '--dnd-transition-fast': '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            '--dnd-transition-normal': '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '--dnd-animation-forge': 'forge-glow 2s ease-in-out infinite'
        },
        interactiveStates: {
            hover: {
                brightness: 1.15,
                scale: 1.01,
                lift: '-2px',
                shadow: '0 6px 20px rgba(255, 152, 0, 0.3), 0 0 10px rgba(205, 127, 50, 0.4)',
                borderColor: '#cd7f32',
                glow: 'drop-shadow(0 0 5px rgba(255, 152, 0, 0.5))',
                transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            cardHover: {
                transform: 'translateY(-4px) scale(1.01)',
                shadow: '0 12px 30px rgba(0,0,0,0.6), 0 0 20px rgba(255, 152, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                borderColor: '#ffaa00'
            },
            buttonHover: {
                brightness: 1.25,
                transform: 'translateY(-2px) scale(1.02)',
                shadow: '0 6px 18px rgba(230, 81, 0, 0.5), 0 0 8px rgba(255, 152, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
            },
            active: {
                scale: 0.98,
                brightness: 0.9,
                transform: 'translateY(2px) scale(0.98)',
                shadow: 'inset 0 3px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)'
            },
            buttonActive: {
                transform: 'translateY(2px) scale(0.97)',
                shadow: 'inset 0 3px 10px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.3)'
            },
            selected: {
                background: 'linear-gradient(90deg, rgba(255, 152, 0, 0.3), rgba(205, 127, 50, 0.2), transparent)',
                borderColor: '#ffcc00',
                borderWidth: '3px',
                glow: '0 0 15px rgba(255, 152, 0, 0.4)',
                textColor: '#ffcc00'
            },
            navActive: {
                background: 'linear-gradient(90deg, rgba(255, 152, 0, 0.35), rgba(205, 127, 50, 0.2), transparent)',
                border: '3px solid #cd7f32',
                indicator: '#ff9800'
            },
            focus: {
                borderColor: '#ff9800',
                shadow: '0 0 0 3px rgba(255, 152, 0, 0.3)',
                outline: 'none'
            },
            disabled: {
                opacity: 0.4,
                cursor: 'not-allowed',
                filter: 'grayscale(0.6) brightness(0.6)'
            },
            iconHover: {
                glow: 'drop-shadow(0 0 6px rgba(255, 170, 0, 0.8)) drop-shadow(0 0 12px rgba(205, 127, 50, 0.5))',
                scale: 1.12
            },
            inputFocus: {
                border: '#cd7f32',
                shadow: '0 0 10px rgba(205, 127, 50, 0.4), inset 0 1px 3px rgba(0,0,0,0.3)'
            }
        },
        overrides: {
            /* ====== 卡片 - 金属铆钉面板 ====== */
            '.dnd-char-card': {
                'box-shadow': 'inset 0 0 10px rgba(0,0,0,0.9), 5px 5px 0px rgba(0,0,0,0.6), 0 0 20px rgba(205, 127, 50, 0.2)',
                'border': '4px solid #555',
                'border-radius': '0',
                'clip-path': 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
                'background': 'linear-gradient(135deg, #404040 0%, #2e2e2e 30%, #282828 70%, #222222 100%)'
            },
            '.dnd-card-header': {
                'background': 'linear-gradient(180deg, #454545 0%, #353535 50%, #303030 100%)',
                'border-bottom': '4px solid #cd7f32',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 0 rgba(0,0,0,0.3), 0 2px 5px rgba(0,0,0,0.4)',
                'padding': '14px 18px',
                'position': 'relative'
            },
            '.dnd-card-body': {
                'background': 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px)',
                'padding': '16px'
            },
            /* ====== 导航栏 - 铁板结构 ====== */
            '.dnd-nav-sidebar': {
                'background': 'linear-gradient(180deg, #2b2b2b 0%, #1f1f1f 100%)',
                'border-right': '4px solid #555',
                'box-shadow': '4px 0 10px rgba(0,0,0,0.5)'
            },
            '.dnd-nav-item': {
                'clip-path': 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
                'margin': '3px 0',
                'padding': '12px 20px',
                'border-left': '5px solid transparent',
                'background': 'linear-gradient(90deg, rgba(85, 85, 85, 0.3), transparent)',
                'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            '.dnd-nav-item:hover': {
                'background': 'linear-gradient(90deg, rgba(255, 152, 0, 0.2), rgba(205, 127, 50, 0.1), transparent)',
                'border-left-color': '#cd7f32'
            },
            '.dnd-nav-item.active': {
                'background': 'linear-gradient(90deg, rgba(255, 152, 0, 0.35), rgba(205, 127, 50, 0.2), transparent)',
                'box-shadow': 'inset 5px 0 0 #ff9800, 0 0 15px rgba(255, 152, 0, 0.25)',
                'border-left-color': '#ffaa00'
            },
            /* ====== 进度条 - 熔岩/锻造火焰 ====== */
            '.dnd-bar-container': {
                'background': 'linear-gradient(180deg, #1a1a1a, #252525, #1a1a1a)',
                'border': '2px solid #555',
                'border-radius': '0',
                'height': '14px',
                'box-shadow': 'inset 0 2px 5px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)'
            },
            '.dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #8B0000 0%, #bf360c 20%, #e65100 40%, #ff9800 60%, #ffb74d 80%, #ff9800 100%)',
                'background-size': '200% 100%',
                'box-shadow': '0 0 15px rgba(255, 152, 0, 0.6), inset 0 0 8px rgba(255, 200, 100, 0.4)',
                'border-radius': '0'
            },
            '.dnd-bar-hp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #4a0000 0%, #7a0000 30%, #aa2020 60%, #7a0000 100%)'
            },
            '.dnd-bar-exp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #1a237e 0%, #303f9f 30%, #5c6bc0 60%, #303f9f 100%)'
            },
            /* ====== 按钮 - 金属铆钉按钮 ====== */
            '.dnd-btn, .dnd-action-btn': {
                'background': 'linear-gradient(180deg, #505050 0%, #3a3a3a 40%, #2a2a2a 100%)',
                'border': '3px solid #555',
                'border-radius': '0',
                'clip-path': 'polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3), 0 3px 6px rgba(0,0,0,0.4)',
                'font-family': '"Trebuchet MS", sans-serif',
                'text-transform': 'uppercase',
                'letter-spacing': '0.05em',
                'position': 'relative'
            },
            '.dnd-btn:hover, .dnd-action-btn:hover': {
                'background': 'linear-gradient(180deg, #606060 0%, #4a4a4a 40%, #3a3a3a 100%)',
                'border-color': '#cd7f32',
                'box-shadow': '0 0 15px rgba(255, 152, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.5)'
            },
            '.dnd-btn:active, .dnd-action-btn:active': {
                'background': 'linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%)',
                'box-shadow': 'inset 0 3px 8px rgba(0,0,0,0.6)'
            },
            /* ====== 属性行 - 金属凹槽 ====== */
            '.dnd-stat-row': {
                'background': 'linear-gradient(180deg, rgba(60, 60, 60, 0.5), rgba(40, 40, 40, 0.6))',
                'border': '1px solid #444',
                'border-top-color': '#555',
                'border-radius': '0',
                'padding': '8px 12px',
                'margin': '3px 0',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.3)'
            },
            '.dnd-stat-row:hover': {
                'background': 'linear-gradient(180deg, rgba(80, 80, 80, 0.5), rgba(60, 60, 60, 0.6))',
                'border-color': '#cd7f32'
            },
            /* ====== 标题样式 - 熔炉火焰 ====== */
            '.dnd-title, .dnd-char-name': {
                'text-shadow': '0 2px 4px rgba(0,0,0,0.6), 0 0 15px rgba(255, 152, 0, 0.4), 0 0 30px rgba(205, 127, 50, 0.2)',
                'font-family': '"Trebuchet MS", Arial, sans-serif',
                'letter-spacing': '0.08em'
            },
            /* ====== 面板/弹窗 - 金属框架 ====== */
            '.dnd-panel, .dnd-dialog': {
                'border': '4px solid #555',
                'border-radius': '0',
                'clip-path': 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)',
                'box-shadow': '5px 5px 0 rgba(0,0,0,0.5), inset 0 0 50px rgba(0,0,0,0.3)'
            },
            '#dnd-mini-hud': {
                'border': '3px solid #555',
                'border-radius': '0',
                'clip-path': 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
                'background': 'linear-gradient(180deg, #2b2b2b 0%, #1f1f1f 100%)'
            },
            /* ====== 输入框 ====== */
            '.dnd-input, .dnd-select, .dnd-textarea': {
                'background': '#1a1a1a',
                'border': '2px solid #555',
                'border-radius': '0',
                'color': '#dcdcdc',
                'box-shadow': 'inset 0 2px 4px rgba(0,0,0,0.5)'
            },
            '.dnd-input:focus, .dnd-select:focus, .dnd-textarea:focus': {
                'border-color': '#cd7f32',
                'box-shadow': '0 0 10px rgba(205, 127, 50, 0.3), inset 0 2px 4px rgba(0,0,0,0.5)'
            },
            /* ====== 表格 ====== */
            '.dnd-table': {
                'border': '2px solid #555'
            },
            '.dnd-table th': {
                'background': 'linear-gradient(180deg, #404040, #303030)',
                'border-bottom': '3px solid #cd7f32',
                'color': '#ffaa00',
                'text-transform': 'uppercase'
            },
            '.dnd-table td': {
                'border-bottom': '1px solid #444'
            },
            '.dnd-table tr:hover td': {
                'background': 'rgba(255, 152, 0, 0.1)'
            },
            /* ====== 徽章 ====== */
            '.dnd-badge': {
                'background': 'linear-gradient(135deg, #555, #333)',
                'border': '2px solid #cd7f32',
                'border-radius': '0',
                'clip-path': 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)'
            }
        },
        customCSS: `
            /* ====== 矮人锻炉皮肤 - 工业金属动画与装饰 ====== */
            
            /* 熔炉脉动光效 */
            @keyframes forge-glow {
                0%, 100% {
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.9), 5px 5px 0px rgba(0,0,0,0.6), 0 0 20px rgba(205, 127, 50, 0.2);
                    filter: brightness(1);
                }
                50% {
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.9), 5px 5px 0px rgba(0,0,0,0.6), 0 0 35px rgba(255, 152, 0, 0.4);
                    filter: brightness(1.02);
                }
            }
            
            /* 熔岩流动动画 */
            @keyframes molten-flow {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
            }
            
            /* 火花飞溅 */
            @keyframes spark-fly {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-30px) scale(0); opacity: 0; }
            }
            
            /* 锤击震动 */
            @keyframes hammer-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
            }
            
            /* 金属光泽闪动 */
            @keyframes metal-shine {
                0% { left: -100%; }
                50%, 100% { left: 100%; }
            }
            
            /* 卡片 - 金属面板效果 */
            .dnd-char-card {
                position: relative;
                animation: forge-glow 3s ease-in-out infinite;
            }
            
            /* 金属高光线 */
            .dnd-char-card::before {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent 20%, rgba(255, 200, 100, 0.4) 50%, transparent 80%);
                pointer-events: none;
                z-index: 10;
            }
            
            /* 四角铆钉装饰 */
            .dnd-char-card::after {
                content: "";
                position: absolute;
                top: 8px; left: 8px;
                width: 12px; height: 12px;
                background: radial-gradient(circle at 30% 30%, #777 0%, #555 40%, #333 100%);
                border-radius: 50%;
                border: 1px solid #666;
                box-shadow:
                    calc(100% - 28px) 0 0 0 #555,
                    0 calc(100% - 28px) 0 0 #555,
                    calc(100% - 28px) calc(100% - 28px) 0 0 #555,
                    inset 0 -1px 2px rgba(0,0,0,0.5),
                    inset 0 1px 1px rgba(255,255,255,0.2);
                pointer-events: none;
                z-index: 10;
            }
            
            /* 卡片头部 - 铁板标题栏 */
            .dnd-card-header::before {
                content: "⚒";
                position: absolute;
                left: 14px; top: 50%;
                transform: translateY(-50%);
                color: #cd7f32;
                font-size: 14px;
                text-shadow: 0 0 5px rgba(205, 127, 50, 0.5);
            }
            
            .dnd-card-header::after {
                content: "";
                position: absolute;
                right: 14px; top: 50%;
                transform: translateY(-50%);
                width: 30px; height: 6px;
                background: repeating-linear-gradient(90deg, #cd7f32, #cd7f32 4px, transparent 4px, transparent 8px);
            }
            
            /* 导航项 - 金属标签 */
            .dnd-nav-item::before {
                content: "";
                position: absolute;
                left: 0; top: 50%;
                transform: translateY(-50%);
                width: 5px; height: 0;
                background: linear-gradient(to bottom, #ff9800, #cd7f32);
                transition: height 0.2s ease-out;
            }
            
            .dnd-nav-item:hover::before {
                height: 60%;
            }
            
            .dnd-nav-item.active::before {
                height: 80%;
                box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
            }
            
            .dnd-nav-item.active::after {
                content: "▸";
                position: absolute;
                right: 12px;
                color: #ffaa00;
                font-size: 14px;
            }
            
            /* 按钮 - 锻造按压效果 */
            .dnd-btn::before,
            .dnd-action-btn::before {
                content: "";
                position: absolute;
                top: 0; left: -100%;
                width: 50%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                transition: left 0.4s;
            }
            
            .dnd-btn:hover::before,
            .dnd-action-btn:hover::before {
                left: 150%;
            }
            
            /* 进度条 - 熔岩动画 */
            .dnd-bar-fill {
                position: relative;
                overflow: hidden;
                animation: molten-flow 3s linear infinite;
            }
            
            .dnd-bar-fill::before {
                content: "";
                position: absolute;
                top: 0; bottom: 0; left: 0; right: 0;
                background: repeating-linear-gradient(
                    110deg,
                    transparent,
                    transparent 8px,
                    rgba(255,255,255,0.1) 8px,
                    rgba(255,255,255,0.1) 16px
                );
            }
            
            /* 分隔线 - 铁条 */
            .dnd-divider {
                height: 4px;
                background: linear-gradient(180deg, #555 0%, #333 50%, #555 100%);
                border-top: 1px solid #666;
                border-bottom: 1px solid #222;
                position: relative;
            }
            
            .dnd-divider::before {
                content: "⚙";
                position: absolute;
                left: 50%; top: 50%;
                transform: translate(-50%, -50%);
                background: #2b2b2b;
                padding: 0 12px;
                color: #cd7f32;
                font-size: 14px;
            }
            
            /* 面板角落 - 金属铆钉 */
            .dnd-panel::before,
            .dnd-dialog::before {
                content: "";
                position: absolute;
                top: 10px; left: 10px;
                width: 14px; height: 14px;
                background: radial-gradient(circle at 30% 30%, #888, #555, #333);
                border-radius: 50%;
                border: 1px solid #666;
                box-shadow: inset 0 -1px 2px rgba(0,0,0,0.5);
            }
            
            .dnd-panel::after,
            .dnd-dialog::after {
                content: "";
                position: absolute;
                bottom: 10px; right: 10px;
                width: 14px; height: 14px;
                background: radial-gradient(circle at 30% 30%, #888, #555, #333);
                border-radius: 50%;
                border: 1px solid #666;
                box-shadow: inset 0 -1px 2px rgba(0,0,0,0.5);
            }
            
            /* 滚动条 - 金属风格 */
            .dnd-content-area::-webkit-scrollbar {
                width: 12px;
            }
            
            .dnd-content-area::-webkit-scrollbar-track {
                background: #1a1a1a;
                border-left: 1px solid #555;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #555, #444, #555);
                border: 1px solid #666;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #666, #555, #666);
                border-color: #cd7f32;
            }
            
            /* 图标容器 - 齿轮形 */
            .dnd-icon-circle {
                clip-path: polygon(50% 0%, 63% 5%, 75% 0%, 80% 12%, 100% 20%, 95% 35%, 100% 50%, 95% 65%, 100% 80%, 80% 88%, 75% 100%, 63% 95%, 50% 100%, 37% 95%, 25% 100%, 20% 88%, 0% 80%, 5% 65%, 0% 50%, 5% 35%, 0% 20%, 20% 12%, 25% 0%, 37% 5%);
                border: none;
                background: linear-gradient(135deg, #555, #333);
                box-shadow: 0 0 10px rgba(205, 127, 50, 0.3);
            }
            
            /* 头像框 - 八边形盾牌 */
            .dnd-avatar {
                clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
                border: 3px solid #cd7f32;
                box-shadow: 0 0 15px rgba(205, 127, 50, 0.4);
            }
            
            /* 悬停震动效果 */
            .dnd-char-card:hover {
                animation: hammer-shake 0.3s ease-in-out;
            }
            
            /* 工具提示 */
            .dnd-tooltip {
                background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
                border: 2px solid #555;
                clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
                box-shadow: 3px 3px 0 rgba(0,0,0,0.4);
            }
        `,
        background: {
            type: 'blueprint',
            majorColor: 'rgba(255, 152, 0, 0.12)',
            minorColor: 'rgba(255, 152, 0, 0.06)',
            gridSize: 30,
            animated: true
        }
    },

    // 6. 星际迷航 (科幻、洁净) - 白色、蓝色、极简
    'star-trek': {
        meta: {
            id: 'star-trek',
            name: '星际联邦',
            icon: '🚀',
            description: '极简干净的科幻风格，类似于LCARS界面',
            author: 'System'
        },
        colors: {
            '--dnd-bg-main': '#000000',
            '--dnd-bg-panel-start': '#000000',
            '--dnd-bg-panel-end': '#0a0a0a',
            '--dnd-text-main': '#ffcc00',
            '--dnd-text-header': '#ff9900',
            '--dnd-text-highlight': '#ffffff',
            '--dnd-text-dim': '#99ccff',
            '--dnd-accent': '#ff9900',
            '--dnd-accent-hover': '#ffbb33',
            '--dnd-border-gold': '#ff9900',
            '--dnd-border-inner': '#000000',
            '--dnd-bg-card-start': '#000000',
            '--dnd-bg-card-end': '#050505',
            '--dnd-btn-primary': '#cc0000',
            '--dnd-btn-primary-hover': '#ff3333',
            '--dnd-btn-text': '#000000'
        },
        morphology: {
            border: { style: 'none', width: '0', outerStyle: 'none' },
            corners: { style: 'rounded-large', clipPath: 'none' },
            card: { shape: 'pill', decoration: 'lcars' },
            effects: { texture: 'stars', innerGlow: 'none', borderGlow: 'none', overlay: 'none' },
            layout: { density: 'spacious', cardMinWidth: '320px' },
            decorations: { headers: 'bar', dividers: 'solid' },
            buttons: { style: 'lcars', shape: 'pill' },
            progressBars: { style: 'lcars', animated: true }
        },
        typography: {
            '--dnd-font-serif': '"Helvetica Neue", Arial, sans-serif',
            '--dnd-font-size-base': '0.95rem',
            '--dnd-font-weight-header': '600',
            '--dnd-letter-spacing': '0.05em',
            '--dnd-text-transform': 'uppercase'
        },
        animations: {
            '--dnd-transition-fast': '0.1s ease-out',
            '--dnd-transition-normal': '0.2s ease-out',
            '--dnd-animation-blink': 'lcars-blink 1.5s ease-in-out infinite'
        },
        interactiveStates: {
            hover: {
                brightness: 1.2,
                scale: 1.01,
                lift: '-2px',
                shadow: '0 4px 15px rgba(255, 153, 0, 0.3)',
                borderColor: '#ff9900',
                glow: 'drop-shadow(0 0 8px rgba(255, 153, 0, 0.5))',
                transition: '0.15s ease-out'
            },
            cardHover: {
                transform: 'translateY(-3px) scale(1.01)',
                shadow: '0 8px 25px rgba(0,0,0,0.5), 0 0 20px rgba(255, 153, 0, 0.2)',
                borderColor: '#ffcc00'
            },
            buttonHover: {
                brightness: 1.3,
                transform: 'translateY(-1px) scale(1.02)',
                shadow: '0 4px 12px rgba(204, 0, 0, 0.4), 0 0 10px rgba(255, 51, 51, 0.3)'
            },
            active: {
                scale: 0.98,
                brightness: 0.85,
                transform: 'translateY(1px) scale(0.98)',
                shadow: '0 1px 5px rgba(0,0,0,0.4)'
            },
            buttonActive: {
                transform: 'translateY(1px) scale(0.97)',
                shadow: '0 1px 3px rgba(0,0,0,0.4)'
            },
            selected: {
                background: '#ff9900',
                borderColor: '#ffcc00',
                borderWidth: '2px',
                glow: '0 0 10px rgba(255, 153, 0, 0.4)',
                textColor: '#000000'
            },
            navActive: {
                background: '#ff9900',
                border: 'none',
                indicator: '#ffcc00'
            },
            focus: {
                borderColor: '#ffcc00',
                shadow: '0 0 0 3px rgba(255, 204, 0, 0.3)',
                outline: 'none'
            },
            disabled: {
                opacity: 0.35,
                cursor: 'not-allowed',
                filter: 'grayscale(0.8) brightness(0.5)'
            },
            iconHover: {
                glow: 'drop-shadow(0 0 8px rgba(255, 204, 0, 0.8))',
                scale: 1.1
            },
            inputFocus: {
                border: '#ff9900',
                shadow: '0 0 10px rgba(255, 153, 0, 0.3)'
            }
        },
        overrides: {
            // 导航栏 - LCARS药丸形侧边栏
            '.dnd-nav-sidebar': {
                'border-right': 'none',
                'padding': '15px 0 15px 20px',
                'background': 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(10,10,20,0.9) 100%)',
                'position': 'relative'
            },
            '.dnd-nav-item': {
                'background': '#99ccff',
                'color': '#000',
                'margin-bottom': '6px',
                'border-radius': '25px 0 0 25px',
                'justify-content': 'flex-end',
                'padding': '12px 20px 12px 30px',
                'font-weight': '700',
                'text-transform': 'uppercase',
                'letter-spacing': '0.08em',
                'font-size': '0.85rem',
                'position': 'relative',
                'transition': 'all 0.15s ease-out',
                'clip-path': 'polygon(0% 0%, 100% 0%, 100% 100%, 15px 100%, 0% calc(100% - 15px))'
            },
            '.dnd-nav-item:hover': {
                'background': '#cc9933',
                'transform': 'translateX(5px)',
                'box-shadow': '0 0 15px rgba(255, 153, 0, 0.4)'
            },
            '.dnd-nav-item.active': {
                'background': '#ff9900',
                'color': '#000',
                'transform': 'translateX(10px)',
                'box-shadow': '0 0 20px rgba(255, 153, 0, 0.6), inset 0 0 10px rgba(255,255,255,0.2)',
                'z-index': '10'
            },

            // 卡片 - LCARS面板框架
            '.dnd-char-card': {
                'border': 'none',
                'border-radius': '30px',
                'background': '#000',
                'box-shadow': '0 0 30px rgba(153, 204, 255, 0.15)',
                'position': 'relative',
                'margin-left': '35px',
                'overflow': 'visible'
            },
            '.dnd-card-header': {
                'border-bottom': 'none',
                'background': 'linear-gradient(90deg, #ff9900 0%, #ff9900 calc(100% - 80px), transparent calc(100% - 80px))',
                'text-transform': 'uppercase',
                'letter-spacing': '0.12em',
                'color': '#000',
                'font-weight': '700',
                'padding': '12px 90px 12px 25px',
                'border-radius': '30px 30px 0 0',
                'position': 'relative',
                'clip-path': 'polygon(0 0, 100% 0, 100% 100%, 60px 100%, 0 calc(100% - 10px))'
            },
            '.dnd-card-body': {
                'padding': '20px 20px 20px 25px',
                'border-left': '25px solid #99ccff',
                'border-bottom': '15px solid #cc6699',
                'border-radius': '0 0 20px 0',
                'position': 'relative'
            },

            // 进度条 - LCARS条形
            '.dnd-bar-container': {
                'background': '#1a1a2e',
                'border-radius': '12px',
                'height': '22px',
                'border': 'none',
                'position': 'relative',
                'overflow': 'hidden'
            },
            '.dnd-bar-fill': {
                'border-radius': '12px',
                'transition': 'width 0.4s ease-out',
                'position': 'relative'
            },
            '.dnd-bar-hp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #cc0000 0%, #ff3333 50%, #ff6666 100%)'
            },
            '.dnd-bar-exp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #ff9900 0%, #ffcc00 50%, #ffee88 100%)'
            },

            // 按钮 - LCARS药丸按钮
            '.dnd-btn, .dnd-action-btn': {
                'border-radius': '20px',
                'text-transform': 'uppercase',
                'letter-spacing': '0.08em',
                'font-weight': '700',
                'padding': '10px 25px',
                'border': 'none',
                'position': 'relative',
                'overflow': 'hidden',
                'clip-path': 'polygon(15px 0, 100% 0, 100% 100%, 0 100%, 0 15px)'
            },
            '.dnd-btn:hover, .dnd-action-btn:hover': {
                'filter': 'brightness(1.3)',
                'box-shadow': '0 0 20px rgba(255, 153, 0, 0.5)'
            },
            '.dnd-btn:active, .dnd-action-btn:active': {
                'transform': 'scale(0.97)',
                'filter': 'brightness(0.9)'
            },

            // 属性行 - 扫描线样式
            '.dnd-stat-row': {
                'padding': '10px 15px',
                'margin': '4px 0',
                'background': 'linear-gradient(90deg, rgba(153, 204, 255, 0.1) 0%, transparent 100%)',
                'border-left': '4px solid #99ccff',
                'position': 'relative',
                'transition': 'all 0.2s ease'
            },
            '.dnd-stat-row:hover': {
                'background': 'linear-gradient(90deg, rgba(255, 153, 0, 0.15) 0%, transparent 100%)',
                'border-left-color': '#ff9900'
            },

            // 标题 - 星际风格
            '.dnd-title, .dnd-char-name': {
                'text-transform': 'uppercase',
                'letter-spacing': '0.2em',
                'font-weight': '300',
                'text-shadow': '0 0 10px rgba(255, 204, 0, 0.5)'
            },

            // 面板 - LCARS框架
            '.dnd-panel, .dnd-dialog': {
                'background': '#000',
                'border': 'none',
                'border-radius': '25px',
                'position': 'relative',
                'overflow': 'visible',
                'box-shadow': '0 0 30px rgba(153, 204, 255, 0.2)'
            },
            '#dnd-mini-hud': {
                'background': 'rgba(0, 0, 0, 0.95)',
                'border': '3px solid #99ccff',
                'border-radius': '20px',
                'box-shadow': '0 0 20px rgba(153, 204, 255, 0.3)'
            },

            // 输入框 - 极简科幻
            '.dnd-input, .dnd-select, .dnd-textarea': {
                'background': 'rgba(20, 20, 40, 0.9)',
                'border': '2px solid #336699',
                'border-radius': '10px',
                'color': '#99ccff',
                'font-family': '"Helvetica Neue", Arial, sans-serif'
            },
            '.dnd-input:focus, .dnd-select:focus, .dnd-textarea:focus': {
                'border-color': '#ff9900',
                'box-shadow': '0 0 15px rgba(255, 153, 0, 0.3)'
            },

            // 表格 - 数据显示
            '.dnd-table th': {
                'background': 'linear-gradient(90deg, #99ccff 0%, #6699cc 100%)',
                'color': '#000',
                'text-transform': 'uppercase',
                'letter-spacing': '0.1em',
                'font-weight': '700',
                'border-radius': '0'
            },
            '.dnd-table td': {
                'border-bottom': '1px solid rgba(153, 204, 255, 0.2)',
                'padding': '12px'
            },
            '.dnd-table tr:hover td': {
                'background': 'rgba(255, 153, 0, 0.1)'
            },

            // 徽章
            '.dnd-badge': {
                'background': 'linear-gradient(135deg, #cc0000, #ff3333)',
                'border-radius': '15px',
                'text-transform': 'uppercase',
                'font-weight': '700',
                'letter-spacing': '0.05em'
            }
        },
        customCSS: `
            /* LCARS动画 */
            @keyframes lcars-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            @keyframes lcars-scan {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
            
            @keyframes lcars-pulse {
                0%, 100% { box-shadow: 0 0 10px rgba(255, 153, 0, 0.3); }
                50% { box-shadow: 0 0 25px rgba(255, 153, 0, 0.6); }
            }
            
            @keyframes warp-stars {
                0% { transform: translateZ(0) scale(1); opacity: 1; }
                100% { transform: translateZ(200px) scale(0); opacity: 0; }
            }
            
            /* 卡片左侧LCARS条带 */
            .dnd-char-card::before {
                content: "";
                position: absolute;
                top: 0;
                left: -35px;
                width: 30px;
                height: 100%;
                background: linear-gradient(
                    to bottom,
                    #99ccff 0%,
                    #99ccff 25%,
                    #ff9900 25%,
                    #ff9900 50%,
                    #cc6699 50%,
                    #cc6699 75%,
                    #9966cc 75%,
                    #9966cc 100%
                );
                border-radius: 15px 0 0 15px;
            }
            
            /* 卡片头部装饰块 */
            .dnd-card-header::before {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                width: 70px;
                height: 100%;
                background: linear-gradient(to bottom, #cc6699 0%, #cc6699 50%, #9966cc 50%, #9966cc 100%);
                border-radius: 0 30px 0 0;
            }
            
            .dnd-card-header::after {
                content: "●●●";
                position: absolute;
                top: 50%;
                right: 80px;
                transform: translateY(-50%);
                color: #99ccff;
                font-size: 10px;
                letter-spacing: 3px;
                animation: lcars-blink 2s ease-in-out infinite;
            }
            
            /* 进度条扫描效果 */
            .dnd-bar-fill::after {
                content: "";
                position: absolute;
                top: 0; bottom: 0;
                left: 0;
                width: 50%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                animation: lcars-scan 2s ease-in-out infinite;
            }
            
            /* 导航项装饰 */
            .dnd-nav-item::before {
                content: "";
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 12px;
                height: 12px;
                background: #000;
                border-radius: 50%;
            }
            
            .dnd-nav-item::after {
                content: "";
                position: absolute;
                right: -5px;
                top: 0;
                height: 100%;
                width: 5px;
                background: inherit;
            }
            
            /* LCARS分隔线 */
            .dnd-divider {
                height: 3px;
                background: linear-gradient(90deg, #99ccff 0%, #99ccff 20%, transparent 20%, transparent 80%, #ff9900 80%, #ff9900 100%);
                position: relative;
                margin: 15px 0;
            }
            
            .dnd-divider::before {
                content: "";
                position: absolute;
                left: 20%;
                top: -5px;
                width: 60%;
                height: 13px;
                background: linear-gradient(90deg, #1a1a2e, #0a0a1e, #1a1a2e);
                border: 1px solid #336699;
                border-radius: 6px;
            }
            
            /* 面板角落装饰 */
            .dnd-panel::before,
            .dnd-dialog::before {
                content: "";
                position: absolute;
                top: 0; left: 0;
                width: 80px;
                height: 25px;
                background: #99ccff;
                border-radius: 25px 0 15px 0;
                z-index: 1;
            }
            
            .dnd-panel::after,
            .dnd-dialog::after {
                content: "";
                position: absolute;
                bottom: 0; right: 0;
                width: 60px;
                height: 20px;
                background: #cc6699;
                border-radius: 15px 0 25px 0;
            }
            
            /* 滚动条 - LCARS风格 */
            .dnd-content-area::-webkit-scrollbar {
                width: 15px;
            }
            
            .dnd-content-area::-webkit-scrollbar-track {
                background: #0a0a1e;
                border-left: 2px solid #336699;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #99ccff, #6699cc);
                border-radius: 10px;
                border: 2px solid #0a0a1e;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #ff9900, #cc7700);
            }
            
            /* 图标容器 - 圆形徽章 */
            .dnd-icon-circle {
                border-radius: 50%;
                border: 3px solid #99ccff;
                background: linear-gradient(135deg, #1a1a3e, #0a0a2e);
                box-shadow: 0 0 15px rgba(153, 204, 255, 0.4);
                position: relative;
            }
            
            .dnd-icon-circle::after {
                content: "";
                position: absolute;
                inset: 3px;
                border: 1px solid rgba(153, 204, 255, 0.3);
                border-radius: 50%;
            }
            
            /* 头像框 - 星际联邦徽章 */
            .dnd-avatar {
                border-radius: 50%;
                border: 4px solid #ff9900;
                box-shadow:
                    0 0 0 3px #000,
                    0 0 0 6px #99ccff,
                    0 0 20px rgba(255, 153, 0, 0.5);
                position: relative;
            }
            
            .dnd-avatar::before {
                content: "";
                position: absolute;
                inset: -15px;
                border: 2px solid rgba(153, 204, 255, 0.3);
                border-radius: 50%;
                animation: lcars-pulse 3s ease-in-out infinite;
            }
            
            /* 状态指示灯 */
            .dnd-status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                animation: lcars-blink 1.5s ease-in-out infinite;
            }
            
            .dnd-status-indicator.active {
                background: #00ff00;
                box-shadow: 0 0 10px #00ff00;
            }
            
            .dnd-status-indicator.warning {
                background: #ff9900;
                box-shadow: 0 0 10px #ff9900;
            }
            
            .dnd-status-indicator.danger {
                background: #cc0000;
                box-shadow: 0 0 10px #cc0000;
            }
            
            /* 工具提示 */
            .dnd-tooltip {
                background: rgba(10, 10, 30, 0.95);
                border: 2px solid #99ccff;
                border-radius: 15px;
                box-shadow: 0 0 20px rgba(153, 204, 255, 0.3);
                padding: 10px 20px;
            }
            
            .dnd-tooltip::before {
                content: "";
                position: absolute;
                top: 0; left: 0;
                width: 40px;
                height: 8px;
                background: #ff9900;
                border-radius: 15px 0 8px 0;
            }
            
            /* 数据标签 */
            .dnd-stat-label {
                color: #99ccff;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                font-size: 0.8em;
            }
            
            .dnd-stat-value {
                color: #ffcc00;
                font-weight: 700;
                text-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
            }
            
            /* 卡片悬停效果 */
            .dnd-char-card:hover {
                box-shadow: 0 0 40px rgba(255, 153, 0, 0.3);
            }
            
            .dnd-char-card:hover::before {
                filter: brightness(1.2);
            }
        `,
        background: {
            type: 'starfield',
            colors: ['rgba(255, 255, 255, 0.9)', 'rgba(153, 204, 255, 0.8)', 'rgba(255, 204, 0, 0.7)'],
            density: 150,
            speed: 0.02,
            twinkle: true
        }
    },

    // 7. 克苏鲁 (疯狂、混沌) - 墨绿、紫色、扭曲
    'lovecraftian': {
        meta: {
            id: 'lovecraftian',
            name: '旧日支配者',
            icon: '🐙',
            description: '混沌扭曲的克苏鲁风格，挑战你的理智',
            author: 'System'
        },
        colors: {
            '--dnd-bg-main': '#051010',
            '--dnd-bg-panel-start': '#0a1a15',
            '--dnd-bg-panel-end': '#050a0a',
            '--dnd-text-main': '#a0c0a0',
            '--dnd-text-header': '#d0a0d0',
            '--dnd-text-highlight': '#00ffaa',
            '--dnd-text-dim': '#507060',
            '--dnd-accent': '#800080',
            '--dnd-accent-hover': '#a020a0',
            '--dnd-border-gold': '#306040',
            '--dnd-border-inner': '#204030',
            '--dnd-bg-card-start': 'rgba(10, 26, 21, 0.9)',
            '--dnd-bg-card-end': 'rgba(5, 16, 16, 0.95)',
            '--dnd-btn-primary': '#402060',
            '--dnd-btn-primary-hover': '#603080',
            '--dnd-btn-text': '#a0c0a0'
        },
        morphology: {
            border: { style: 'solid', width: '1px', outerStyle: 'none' },
            corners: { style: 'irregular', clipPath: 'polygon(0% 0%, 100% 2%, 98% 100%, 2% 98%)' },
            card: { shape: 'distorted', decoration: 'runes' },
            effects: { texture: 'scales', innerGlow: 'medium', borderGlow: 'subtle', overlay: 'noise' },
            layout: { density: 'normal' },
            decorations: { icons: 'tentacles', corners: 'tentacle' },
            buttons: { style: 'eldritch', shape: 'irregular' },
            progressBars: { style: 'sanity', animated: true }
        },
        typography: {
            '--dnd-font-serif': '"Courier New", monospace',
            '--dnd-font-size-base': '0.95rem',
            '--dnd-letter-spacing': '0.03em'
        },
        animations: {
            '--dnd-transition-fast': '0.2s cubic-bezier(0.4, 0, 0.6, 1)',
            '--dnd-transition-normal': '0.4s cubic-bezier(0.4, 0, 0.6, 1)',
            '--dnd-animation-madness': 'eldritch-pulse 4s ease-in-out infinite',
            '--dnd-animation-distort': 'subtle-distort 8s ease-in-out infinite'
        },
        interactiveStates: {
            hover: {
                brightness: 1.15,
                scale: 1.02,
                lift: '-3px',
                shadow: '0 8px 25px rgba(0, 255, 170, 0.2), 0 0 15px rgba(128, 0, 128, 0.3)',
                borderColor: '#00ffaa',
                glow: 'drop-shadow(0 0 8px rgba(0, 255, 170, 0.4)) drop-shadow(0 0 15px rgba(128, 0, 128, 0.3))',
                transition: '0.3s cubic-bezier(0.4, 0, 0.6, 1)'
            },
            cardHover: {
                transform: 'translateY(-5px) rotate(0.8deg) scale(1.01)',
                shadow: '0 15px 40px rgba(5, 16, 16, 0.8), 0 0 30px rgba(0, 255, 170, 0.15), 0 0 50px rgba(128, 0, 128, 0.1)',
                borderColor: '#00ffaa'
            },
            buttonHover: {
                brightness: 1.25,
                transform: 'translateY(-2px) scale(1.02) skewX(-1deg)',
                shadow: '0 6px 20px rgba(128, 0, 128, 0.5), 0 0 12px rgba(0, 255, 170, 0.3)'
            },
            active: {
                scale: 0.96,
                brightness: 0.85,
                transform: 'translateY(2px) scale(0.96) rotate(-0.5deg)',
                shadow: '0 2px 8px rgba(0,0,0,0.6), inset 0 0 15px rgba(0, 255, 170, 0.1)'
            },
            buttonActive: {
                transform: 'translateY(2px) scale(0.97) skewX(1deg)',
                shadow: '0 1px 4px rgba(0,0,0,0.5), inset 0 2px 6px rgba(0,0,0,0.4)'
            },
            selected: {
                background: 'linear-gradient(90deg, rgba(0, 255, 170, 0.2), rgba(128, 0, 128, 0.15), transparent)',
                borderColor: '#00ffaa',
                borderWidth: '2px',
                glow: '0 0 20px rgba(0, 255, 170, 0.3), 0 0 40px rgba(128, 0, 128, 0.15)',
                textColor: '#00ffaa'
            },
            navActive: {
                background: 'linear-gradient(90deg, rgba(0, 255, 170, 0.25), rgba(128, 0, 128, 0.15), transparent)',
                border: '2px solid #306040',
                indicator: '#00ffaa'
            },
            focus: {
                borderColor: '#800080',
                shadow: '0 0 0 3px rgba(128, 0, 128, 0.3), 0 0 15px rgba(0, 255, 170, 0.2)',
                outline: 'none'
            },
            disabled: {
                opacity: 0.3,
                cursor: 'not-allowed',
                filter: 'grayscale(0.7) brightness(0.5) hue-rotate(30deg)'
            },
            iconHover: {
                glow: 'drop-shadow(0 0 10px rgba(0, 255, 170, 0.8)) drop-shadow(0 0 20px rgba(128, 0, 128, 0.5))',
                scale: 1.15
            },
            inputFocus: {
                border: '#306040',
                shadow: '0 0 15px rgba(0, 255, 170, 0.3), inset 0 0 10px rgba(128, 0, 128, 0.15)'
            }
        },
        overrides: {
            // 导航栏 - 扭曲的深渊入口
            '.dnd-nav-sidebar': {
                'background': 'linear-gradient(180deg, rgba(10, 26, 21, 0.98) 0%, rgba(5, 16, 16, 0.95) 100%)',
                'border-right': '2px solid #306040',
                'position': 'relative',
                'overflow': 'visible'
            },
            '.dnd-nav-item': {
                'background': 'linear-gradient(90deg, rgba(48, 96, 64, 0.3), transparent)',
                'border': '1px solid rgba(48, 96, 64, 0.5)',
                'border-radius': '0',
                'margin': '8px 10px',
                'padding': '12px 15px',
                'position': 'relative',
                'transition': 'all 0.4s cubic-bezier(0.4, 0, 0.6, 1)',
                'clip-path': 'polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)'
            },
            '.dnd-nav-item:hover': {
                'background': 'linear-gradient(90deg, rgba(0, 255, 170, 0.15), rgba(128, 0, 128, 0.1), transparent)',
                'transform': 'skewX(-2deg) translateX(5px)',
                'border-color': '#00ffaa',
                'box-shadow': '0 0 20px rgba(0, 255, 170, 0.3)'
            },
            '.dnd-nav-item.active': {
                'background': 'linear-gradient(90deg, rgba(0, 255, 170, 0.25), rgba(128, 0, 128, 0.15), transparent)',
                'box-shadow': 'inset 0 0 20px rgba(0, 255, 170, 0.2), 0 0 25px rgba(128, 0, 128, 0.3)',
                'transform': 'skewX(-3deg) translateX(8px)',
                'border-color': '#00ffaa'
            },

            // 卡片 - 远古石板
            '.dnd-char-card': {
                'transform': 'rotate(0.5deg)',
                'border-radius': '0',
                'border': '2px solid #306040',
                'box-shadow': '0 10px 30px rgba(5, 16, 16, 0.8), inset 0 0 40px rgba(0, 255, 170, 0.05)',
                'position': 'relative',
                'clip-path': 'polygon(0% 2%, 3% 0%, 97% 0%, 100% 3%, 100% 97%, 98% 100%, 2% 100%, 0% 98%)',
                'overflow': 'visible'
            },
            '.dnd-char-card:nth-child(even)': {
                'transform': 'rotate(-0.5deg)'
            },
            '.dnd-card-header': {
                'border-bottom': '2px solid #306040',
                'background': 'linear-gradient(to right, rgba(128, 0, 128, 0.15), rgba(10, 26, 21, 0.9), rgba(0, 255, 170, 0.08))',
                'padding': '15px 20px',
                'position': 'relative'
            },
            '.dnd-card-body': {
                'padding': '20px',
                'background': 'linear-gradient(180deg, rgba(10, 26, 21, 0.6) 0%, rgba(5, 16, 16, 0.8) 100%)',
                'position': 'relative'
            },

            // 进度条 - 理智值/腐化度
            '.dnd-bar-container': {
                'background': 'linear-gradient(90deg, #0a1a15, #051010, #0a1a15)',
                'border': '1px solid #306040',
                'border-radius': '0',
                'height': '20px',
                'position': 'relative',
                'clip-path': 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)'
            },
            '.dnd-bar-fill': {
                'border-radius': '0',
                'position': 'relative',
                'overflow': 'hidden'
            },
            '.dnd-bar-hp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #402060, #800080, #00ffaa, #800080)'
            },
            '.dnd-bar-exp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #204030, #306040, #00ffaa)'
            },

            // 按钮 - 邪恶符文
            '.dnd-btn, .dnd-action-btn': {
                'border': '2px solid #306040',
                'border-radius': '0',
                'transform': 'skewX(-3deg)',
                'background': 'linear-gradient(135deg, rgba(64, 32, 96, 0.8), rgba(32, 64, 48, 0.8))',
                'position': 'relative',
                'overflow': 'hidden',
                'text-shadow': '0 0 5px rgba(0, 255, 170, 0.5)',
                'clip-path': 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)'
            },
            '.dnd-btn:hover, .dnd-action-btn:hover': {
                'border-color': '#00ffaa',
                'box-shadow': '0 0 25px rgba(0, 255, 170, 0.4), inset 0 0 15px rgba(128, 0, 128, 0.3)',
                'transform': 'skewX(-3deg) translateY(-2px)'
            },
            '.dnd-btn:active, .dnd-action-btn:active': {
                'transform': 'skewX(-3deg) scale(0.97)',
                'box-shadow': 'inset 0 0 20px rgba(0, 255, 170, 0.2)'
            },

            // 属性行 - 刻印文字
            '.dnd-stat-row': {
                'padding': '10px 15px',
                'margin': '4px 0',
                'background': 'linear-gradient(90deg, rgba(48, 96, 64, 0.1), transparent)',
                'border-left': '3px solid transparent',
                'position': 'relative',
                'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.6, 1)'
            },
            '.dnd-stat-row:hover': {
                'background': 'linear-gradient(90deg, rgba(0, 255, 170, 0.1), rgba(128, 0, 128, 0.05), transparent)',
                'border-left-color': '#00ffaa',
                'transform': 'skewX(-1deg)'
            },

            // 标题 - 远古语言
            '.dnd-title, .dnd-char-name': {
                'text-shadow': '0 0 15px rgba(208, 160, 208, 0.6), 0 0 30px rgba(128, 0, 128, 0.4)',
                'letter-spacing': '0.15em',
                'font-style': 'italic'
            },

            // 面板 - 深渊之门
            '.dnd-panel, .dnd-dialog': {
                'background': 'linear-gradient(135deg, rgba(10, 26, 21, 0.98), rgba(5, 16, 16, 0.95))',
                'border': '2px solid #306040',
                'border-radius': '0',
                'box-shadow': '0 0 40px rgba(5, 16, 16, 0.9), inset 0 0 60px rgba(128, 0, 128, 0.05)',
                'position': 'relative',
                'clip-path': 'polygon(0% 3%, 3% 0%, 97% 0%, 100% 3%, 100% 97%, 97% 100%, 3% 100%, 0% 97%)'
            },
            '#dnd-mini-hud': {
                'background': 'rgba(5, 16, 16, 0.95)',
                'border': '2px solid #306040',
                'box-shadow': '0 0 30px rgba(0, 255, 170, 0.2), inset 0 0 20px rgba(128, 0, 128, 0.1)'
            },

            // 输入框 - 黑暗卷轴
            '.dnd-input, .dnd-select, .dnd-textarea': {
                'background': 'rgba(5, 10, 10, 0.9)',
                'border': '1px solid #306040',
                'border-radius': '0',
                'color': '#a0c0a0',
                'font-family': '"Courier New", monospace'
            },
            '.dnd-input:focus, .dnd-select:focus, .dnd-textarea:focus': {
                'border-color': '#00ffaa',
                'box-shadow': '0 0 15px rgba(0, 255, 170, 0.3), inset 0 0 10px rgba(128, 0, 128, 0.15)'
            },

            // 表格 - 禁忌典籍
            '.dnd-table th': {
                'background': 'linear-gradient(90deg, rgba(64, 32, 96, 0.6), rgba(32, 64, 48, 0.6))',
                'color': '#d0a0d0',
                'border-bottom': '2px solid #306040',
                'text-transform': 'uppercase',
                'letter-spacing': '0.1em'
            },
            '.dnd-table td': {
                'border-bottom': '1px solid rgba(48, 96, 64, 0.3)',
                'padding': '12px'
            },
            '.dnd-table tr:hover td': {
                'background': 'rgba(0, 255, 170, 0.05)'
            },

            // 徽章 - 诅咒印记
            '.dnd-badge': {
                'background': 'linear-gradient(135deg, #402060, #204030)',
                'border': '1px solid #00ffaa',
                'border-radius': '0',
                'clip-path': 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
                'text-shadow': '0 0 5px rgba(0, 255, 170, 0.8)'
            }
        },
        customCSS: `
            /* 克苏鲁动画 */
            @keyframes eldritch-pulse {
                0%, 100% {
                    box-shadow: 0 10px 30px rgba(5, 16, 16, 0.8), inset 0 0 40px rgba(0, 255, 170, 0.05);
                    filter: hue-rotate(0deg);
                }
                25% {
                    box-shadow: 0 10px 35px rgba(5, 16, 16, 0.85), inset 0 0 50px rgba(128, 0, 128, 0.1);
                    filter: hue-rotate(8deg);
                }
                50% {
                    box-shadow: 0 10px 40px rgba(5, 16, 16, 0.8), inset 0 0 60px rgba(0, 255, 170, 0.08);
                    filter: hue-rotate(-5deg);
                }
                75% {
                    box-shadow: 0 10px 35px rgba(5, 16, 16, 0.85), inset 0 0 50px rgba(128, 0, 128, 0.08);
                    filter: hue-rotate(5deg);
                }
            }
            
            @keyframes subtle-distort {
                0%, 100% { transform: rotate(0.5deg) skewX(0deg); }
                20% { transform: rotate(0.8deg) skewX(0.5deg); }
                40% { transform: rotate(0.2deg) skewX(-0.3deg); }
                60% { transform: rotate(0.7deg) skewX(0.4deg); }
                80% { transform: rotate(0.4deg) skewX(-0.2deg); }
            }
            
            @keyframes tentacle-writhe {
                0%, 100% {
                    transform: rotate(0deg) scale(1);
                    opacity: 0.6;
                }
                25% {
                    transform: rotate(5deg) scale(1.05);
                    opacity: 0.8;
                }
                50% {
                    transform: rotate(-3deg) scale(0.95);
                    opacity: 0.5;
                }
                75% {
                    transform: rotate(4deg) scale(1.02);
                    opacity: 0.7;
                }
            }
            
            @keyframes madness-flicker {
                0%, 95%, 100% { opacity: 1; filter: none; }
                96% { opacity: 0.8; filter: hue-rotate(30deg) saturate(1.5); }
                97% { opacity: 1; filter: none; }
                98% { opacity: 0.6; filter: hue-rotate(-20deg) brightness(1.2); }
                99% { opacity: 0.9; filter: hue-rotate(10deg); }
            }
            
            @keyframes sanity-drain {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            @keyframes void-gaze {
                0%, 100% {
                    box-shadow: 0 0 30px rgba(0, 255, 170, 0.2);
                    border-color: #306040;
                }
                50% {
                    box-shadow: 0 0 50px rgba(128, 0, 128, 0.4);
                    border-color: #800080;
                }
            }
            
            /* 卡片噪点纹理 */
            .dnd-char-card::before {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
                pointer-events: none;
                z-index: 1;
            }
            
            /* 卡片触手装饰 */
            .dnd-char-card::after {
                content: "𐌎";
                position: absolute;
                top: -15px;
                right: -15px;
                font-size: 40px;
                color: rgba(0, 255, 170, 0.3);
                text-shadow: 0 0 20px rgba(128, 0, 128, 0.5);
                animation: tentacle-writhe 6s ease-in-out infinite;
                z-index: 10;
            }
            
            /* 卡片头部符文 */
            .dnd-card-header::before {
                content: "⍟ ⎊ ⍟";
                position: absolute;
                left: 15px;
                top: 50%;
                transform: translateY(-50%);
                color: rgba(0, 255, 170, 0.4);
                font-size: 12px;
                letter-spacing: 5px;
                animation: madness-flicker 10s ease-in-out infinite;
            }
            
            .dnd-card-header::after {
                content: "";
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, #00ffaa, #800080, #00ffaa, transparent);
            }
            
            /* 进度条 - 理智流失效果 */
            .dnd-bar-fill::before {
                content: "";
                position: absolute;
                top: 0; bottom: 0; left: 0; right: 0;
                background: linear-gradient(90deg,
                    transparent,
                    rgba(128, 0, 128, 0.3),
                    transparent,
                    rgba(0, 255, 170, 0.2),
                    transparent
                );
                background-size: 200% 100%;
                animation: sanity-drain 4s ease-in-out infinite;
            }
            
            .dnd-bar-fill::after {
                content: "";
                position: absolute;
                top: 0; bottom: 0;
                right: 0;
                width: 20px;
                background: linear-gradient(90deg, transparent, rgba(0, 255, 170, 0.8));
                filter: blur(3px);
            }
            
            /* 导航项触手装饰 */
            .dnd-nav-item::before {
                content: "⌬";
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                color: rgba(0, 255, 170, 0.5);
                font-size: 14px;
            }
            
            .dnd-nav-item::after {
                content: "";
                position: absolute;
                right: 0;
                top: 0;
                height: 100%;
                width: 3px;
                background: linear-gradient(180deg, transparent, #800080, #00ffaa, #800080, transparent);
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .dnd-nav-item:hover::after,
            .dnd-nav-item.active::after {
                opacity: 1;
            }
            
            /* 分隔线 - 虚空裂缝 */
            .dnd-divider {
                height: 3px;
                background: linear-gradient(90deg,
                    transparent,
                    #306040,
                    #00ffaa,
                    #800080,
                    #00ffaa,
                    #306040,
                    transparent
                );
                position: relative;
                margin: 20px 0;
            }
            
            .dnd-divider::before {
                content: "◈";
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                background: #051010;
                padding: 0 15px;
                color: #00ffaa;
                font-size: 16px;
                text-shadow: 0 0 10px rgba(128, 0, 128, 0.8);
            }
            
            /* 面板角落触手 */
            .dnd-panel::before,
            .dnd-dialog::before {
                content: "⎔";
                position: absolute;
                top: 10px;
                left: 10px;
                font-size: 24px;
                color: rgba(0, 255, 170, 0.4);
                animation: tentacle-writhe 8s ease-in-out infinite;
            }
            
            .dnd-panel::after,
            .dnd-dialog::after {
                content: "⎔";
                position: absolute;
                bottom: 10px;
                right: 10px;
                font-size: 24px;
                color: rgba(128, 0, 128, 0.4);
                transform: rotate(180deg);
                animation: tentacle-writhe 8s ease-in-out infinite reverse;
            }
            
            /* 滚动条 - 深渊通道 */
            .dnd-content-area::-webkit-scrollbar {
                width: 12px;
            }
            
            .dnd-content-area::-webkit-scrollbar-track {
                background: #051010;
                border-left: 1px solid #306040;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #306040, #204030, #306040);
                border: 1px solid #306040;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, #00ffaa, #306040, #800080, #306040, #00ffaa);
            }
            
            /* 图标容器 - 邪眼 */
            .dnd-icon-circle {
                border-radius: 50%;
                border: 2px solid #306040;
                background: radial-gradient(circle at 30% 30%, #0a1a15, #051010);
                box-shadow: 0 0 20px rgba(0, 255, 170, 0.3), inset 0 0 15px rgba(128, 0, 128, 0.2);
                position: relative;
                animation: void-gaze 5s ease-in-out infinite;
            }
            
            .dnd-icon-circle::before {
                content: "";
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40%;
                height: 40%;
                background: radial-gradient(circle, #00ffaa, transparent);
                border-radius: 50%;
                opacity: 0.6;
            }
            
            /* 头像框 - 深渊凝视 */
            .dnd-avatar {
                border-radius: 0;
                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                border: 3px solid #306040;
                box-shadow: 0 0 30px rgba(0, 255, 170, 0.3), 0 0 60px rgba(128, 0, 128, 0.2);
                position: relative;
            }
            
            .dnd-avatar::before {
                content: "";
                position: absolute;
                inset: -5px;
                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                background: linear-gradient(45deg, #00ffaa, transparent, #800080, transparent);
                z-index: -1;
                animation: void-gaze 4s ease-in-out infinite;
            }
            
            /* 悬停 - 疯狂侵蚀 */
            .dnd-char-card:hover {
                animation: eldritch-pulse 2s ease-in-out infinite, subtle-distort 4s ease-in-out infinite;
            }
            
            .dnd-char-card:hover::after {
                animation: tentacle-writhe 2s ease-in-out infinite;
                color: rgba(0, 255, 170, 0.6);
            }
            
            /* 工具提示 - 禁忌知识 */
            .dnd-tooltip {
                background: rgba(5, 16, 16, 0.98);
                border: 1px solid #306040;
                clip-path: polygon(0% 5%, 5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%);
                box-shadow: 0 0 30px rgba(0, 255, 170, 0.3), 0 0 50px rgba(128, 0, 128, 0.2);
            }
            
            .dnd-tooltip::before {
                content: "⍟";
                position: absolute;
                top: 5px;
                left: 10px;
                color: #00ffaa;
                font-size: 12px;
            }
            
            /* 随机扭曲效果 */
            .dnd-char-card:nth-child(3n)::after {
                content: "☠";
                color: rgba(128, 0, 128, 0.4);
            }
            
            .dnd-char-card:nth-child(3n+1)::after {
                content: "⛧";
                color: rgba(0, 255, 170, 0.4);
            }
            
            .dnd-char-card:nth-child(3n+2)::after {
                content: "⌘";
                color: rgba(208, 160, 208, 0.4);
            }
        `,
        background: {
            type: 'runes',
            colors: ['rgba(0, 255, 170, 0.25)', 'rgba(128, 0, 128, 0.2)', 'rgba(208, 160, 208, 0.15)'],
            count: 15,
            speed: 0.03,
            glow: true,
            animated: true
        }
    },

    // 8. 蒸汽朋克 (复古、机械) - 黄铜、齿轮、皮革
    'steampunk': {
        meta: {
            id: 'steampunk',
            name: '蒸汽纪元',
            icon: '⚙️',
            description: '维多利亚时代的机械美学，黄铜与皮革的交响',
            author: 'System'
        },
        colors: {
            '--dnd-bg-main': '#2b2015',
            '--dnd-bg-panel-start': '#3e3020',
            '--dnd-bg-panel-end': '#2b2015',
            '--dnd-text-main': '#e6d0a0',
            '--dnd-text-header': '#ffddaa',
            '--dnd-text-highlight': '#ffffaa',
            '--dnd-text-dim': '#a69070',
            '--dnd-accent': '#cd7f32',
            '--dnd-accent-hover': '#daa060',
            '--dnd-border-gold': '#b8860b',
            '--dnd-border-inner': '#8b4513',
            '--dnd-bg-card-start': '#3a2a1a',
            '--dnd-bg-card-end': '#2a1f15',
            '--dnd-btn-primary': '#8b4513',
            '--dnd-btn-primary-hover': '#a0522d',
            '--dnd-btn-text': '#e6d0a0'
        },
        morphology: {
            border: { style: 'ridge', width: '3px', outerStyle: 'dashed' },
            corners: { style: 'ornate', clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)' },
            card: { shape: 'panel', decoration: 'gears' },
            effects: { texture: 'fabric', innerGlow: 'gold', borderGlow: 'none', overlay: 'vignette' },
            layout: { density: 'normal' },
            decorations: { corners: 'gears', dividers: 'pipes', headers: 'banner' },
            buttons: { style: 'brass', shape: 'rounded' },
            progressBars: { style: 'gauge', animated: true }
        },
        typography: {
            '--dnd-font-serif': '"Georgia", "Times New Roman", serif',
            '--dnd-font-size-header': '1.15rem',
            '--dnd-font-weight-header': '600',
            '--dnd-letter-spacing': '0.04em'
        },
        animations: {
            '--dnd-transition-fast': '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '--dnd-transition-normal': '0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            '--dnd-animation-gear': 'gear-rotate 10s linear infinite'
        },
        interactiveStates: {
            hover: {
                brightness: 1.12,
                scale: 1.02,
                lift: '-4px',
                shadow: '0 10px 30px rgba(139, 69, 19, 0.4), 0 0 15px rgba(184, 134, 11, 0.3)',
                borderColor: '#b8860b',
                glow: 'drop-shadow(0 0 6px rgba(205, 127, 50, 0.5))',
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            cardHover: {
                transform: 'translateY(-6px) scale(1.015)',
                shadow: '0 18px 45px rgba(43, 32, 21, 0.6), 0 0 25px rgba(184, 134, 11, 0.25), inset 0 0 20px rgba(205, 127, 50, 0.08)',
                borderColor: '#cd7f32'
            },
            buttonHover: {
                brightness: 1.2,
                transform: 'translateY(-2px) scale(1.03)',
                shadow: '0 6px 18px rgba(139, 69, 19, 0.5), 0 0 10px rgba(184, 134, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
            },
            active: {
                scale: 0.97,
                brightness: 0.9,
                transform: 'translateY(2px) scale(0.97)',
                shadow: 'inset 0 3px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)'
            },
            buttonActive: {
                transform: 'translateY(2px) scale(0.97)',
                shadow: 'inset 0 3px 10px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2)'
            },
            selected: {
                background: 'linear-gradient(90deg, rgba(184, 134, 11, 0.3), rgba(139, 69, 19, 0.2), transparent)',
                borderColor: '#ffddaa',
                borderWidth: '3px',
                glow: '0 0 15px rgba(184, 134, 11, 0.4)',
                textColor: '#ffffaa'
            },
            navActive: {
                background: 'linear-gradient(90deg, rgba(184, 134, 11, 0.35), rgba(139, 69, 19, 0.2), transparent)',
                border: '3px solid #b8860b',
                indicator: '#cd7f32'
            },
            focus: {
                borderColor: '#cd7f32',
                shadow: '0 0 0 3px rgba(205, 127, 50, 0.3)',
                outline: 'none'
            },
            disabled: {
                opacity: 0.4,
                cursor: 'not-allowed',
                filter: 'grayscale(0.5) sepia(0.3) brightness(0.7)'
            },
            iconHover: {
                glow: 'drop-shadow(0 0 8px rgba(184, 134, 11, 0.8)) drop-shadow(0 0 15px rgba(205, 127, 50, 0.5))',
                scale: 1.15
            },
            inputFocus: {
                border: '#b8860b',
                shadow: '0 0 12px rgba(184, 134, 11, 0.4), inset 0 1px 3px rgba(0,0,0,0.2)'
            }
        },
        overrides: {
            // 导航栏 - 铜管工艺
            '.dnd-nav-sidebar': {
                'background': 'linear-gradient(180deg, #3e3020 0%, #2b2015 100%)',
                'border-right': '4px solid #8b4513',
                'position': 'relative',
                'box-shadow': 'inset -5px 0 15px rgba(0,0,0,0.3)'
            },
            '.dnd-nav-item': {
                'background': 'linear-gradient(90deg, #4a3a2a, #3a2a1a)',
                'border': '2px solid #8b4513',
                'border-radius': '8px 0 0 8px',
                'margin': '8px 0 8px 10px',
                'padding': '12px 15px',
                'position': 'relative',
                'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.1), 2px 2px 5px rgba(0,0,0,0.3)'
            },
            '.dnd-nav-item:hover': {
                'background': 'linear-gradient(90deg, #5a4a3a, #4a3a2a)',
                'border-color': '#b8860b',
                'transform': 'translateX(5px)',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.2), 3px 3px 10px rgba(0,0,0,0.4), 0 0 15px rgba(184, 134, 11, 0.2)'
            },
            '.dnd-nav-item.active': {
                'background': 'linear-gradient(90deg, rgba(184, 134, 11, 0.4), rgba(139, 69, 19, 0.3))',
                'box-shadow': 'inset 0 0 20px rgba(184, 134, 11, 0.2), 0 0 20px rgba(205, 127, 50, 0.3)',
                'border-color': '#cd7f32',
                'transform': 'translateX(8px)'
            },

            // 卡片 - 皮革边框机械面板
            '.dnd-char-card': {
                'box-shadow': '0 0 0 4px #3e3020, 0 0 0 7px #b8860b, 0 0 0 9px #5c3a1a, 0 12px 35px rgba(43, 32, 21, 0.6)',
                'border': '3px solid #8b4513',
                'border-radius': '12px',
                'background': 'linear-gradient(135deg, #3a2a1a 0%, #2f2318 50%, #2a1f15 100%)',
                'position': 'relative',
                'overflow': 'visible'
            },
            '.dnd-card-header': {
                'border-bottom': '4px double #b8860b',
                'background': 'linear-gradient(90deg, rgba(184, 134, 11, 0.2), rgba(139, 69, 19, 0.15), rgba(184, 134, 11, 0.2))',
                'padding': '15px 20px',
                'position': 'relative',
                'border-radius': '9px 9px 0 0'
            },
            '.dnd-card-body': {
                'padding': '20px',
                'background': 'linear-gradient(180deg, rgba(58, 42, 26, 0.5) 0%, rgba(42, 31, 21, 0.8) 100%)',
                'position': 'relative'
            },

            // 进度条 - 压力表仪表盘
            '.dnd-bar-container': {
                'background': 'linear-gradient(180deg, #1a1510, #2a2015, #1a1510)',
                'border': '3px solid #8b4513',
                'border-radius': '10px',
                'height': '24px',
                'position': 'relative',
                'box-shadow': 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)'
            },
            '.dnd-bar-fill': {
                'border-radius': '7px',
                'position': 'relative',
                'overflow': 'hidden'
            },
            '.dnd-bar-hp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #8b4513, #cd7f32, #daa060, #cd7f32, #8b4513)'
            },
            '.dnd-bar-exp .dnd-bar-fill': {
                'background': 'linear-gradient(90deg, #5c3a1a, #b8860b, #ffddaa, #b8860b, #5c3a1a)'
            },

            // 按钮 - 黄铜铆钉
            '.dnd-btn, .dnd-action-btn': {
                'border': '3px solid #8b4513',
                'border-radius': '8px',
                'background': 'linear-gradient(180deg, #5a4a3a 0%, #4a3a2a 50%, #3a2a1a 100%)',
                'box-shadow': 'inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -2px 5px rgba(0,0,0,0.3), 0 3px 8px rgba(0,0,0,0.4)',
                'position': 'relative',
                'text-shadow': '0 1px 2px rgba(0,0,0,0.5)'
            },
            '.dnd-btn:hover, .dnd-action-btn:hover': {
                'background': 'linear-gradient(180deg, #6a5a4a 0%, #5a4a3a 50%, #4a3a2a 100%)',
                'border-color': '#b8860b',
                'box-shadow': 'inset 0 2px 0 rgba(255,255,255,0.2), 0 5px 15px rgba(184, 134, 11, 0.3), 0 0 20px rgba(205, 127, 50, 0.2)'
            },
            '.dnd-btn:active, .dnd-action-btn:active': {
                'background': 'linear-gradient(180deg, #3a2a1a 0%, #4a3a2a 50%, #5a4a3a 100%)',
                'box-shadow': 'inset 0 3px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)'
            },

            // 属性行 - 刻度读数
            '.dnd-stat-row': {
                'padding': '10px 15px',
                'margin': '4px 0',
                'background': 'linear-gradient(90deg, rgba(139, 69, 19, 0.1), transparent)',
                'border-left': '4px solid #8b4513',
                'position': 'relative',
                'transition': 'all 0.25s ease'
            },
            '.dnd-stat-row:hover': {
                'background': 'linear-gradient(90deg, rgba(184, 134, 11, 0.15), rgba(139, 69, 19, 0.1), transparent)',
                'border-left-color': '#cd7f32',
                'padding-left': '20px'
            },

            // 标题 - 维多利亚雕刻字
            '.dnd-title, .dnd-char-name': {
                'text-shadow': '0 2px 4px rgba(0,0,0,0.5), 0 0 15px rgba(184, 134, 11, 0.4)',
                'letter-spacing': '0.08em',
                'font-weight': '600'
            },

            // 面板 - 黄铜框架
            '.dnd-panel, .dnd-dialog': {
                'background': 'linear-gradient(135deg, #3e3020, #2b2015)',
                'border': '4px solid #8b4513',
                'border-radius': '15px',
                'box-shadow': '0 0 0 2px #5c3a1a, 0 0 0 5px #b8860b, 0 10px 40px rgba(43, 32, 21, 0.7)',
                'position': 'relative'
            },
            '#dnd-mini-hud': {
                'background': 'linear-gradient(135deg, #3a2a1a, #2a1f15)',
                'border': '3px solid #b8860b',
                'border-radius': '12px',
                'box-shadow': '0 0 20px rgba(184, 134, 11, 0.3), inset 0 0 30px rgba(0,0,0,0.3)'
            },

            // 输入框 - 铜边皮革
            '.dnd-input, .dnd-select, .dnd-textarea': {
                'background': 'linear-gradient(180deg, #2a2015, #3a2a1a)',
                'border': '2px solid #8b4513',
                'border-radius': '6px',
                'color': '#e6d0a0',
                'box-shadow': 'inset 0 2px 5px rgba(0,0,0,0.3)'
            },
            '.dnd-input:focus, .dnd-select:focus, .dnd-textarea:focus': {
                'border-color': '#cd7f32',
                'box-shadow': 'inset 0 2px 5px rgba(0,0,0,0.3), 0 0 15px rgba(184, 134, 11, 0.3)'
            },

            // 表格 - 工程图纸
            '.dnd-table th': {
                'background': 'linear-gradient(180deg, #5a4a3a, #4a3a2a)',
                'color': '#ffddaa',
                'border-bottom': '3px solid #b8860b',
                'text-transform': 'uppercase',
                'letter-spacing': '0.08em',
                'font-weight': '600'
            },
            '.dnd-table td': {
                'border-bottom': '1px solid rgba(139, 69, 19, 0.3)',
                'padding': '12px'
            },
            '.dnd-table tr:hover td': {
                'background': 'rgba(184, 134, 11, 0.1)'
            },

            // 徽章 - 铜牌
            '.dnd-badge': {
                'background': 'linear-gradient(135deg, #cd7f32, #b8860b, #8b4513)',
                'border': '2px solid #5c3a1a',
                'border-radius': '5px',
                'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 5px rgba(0,0,0,0.3)',
                'color': '#2b2015',
                'font-weight': '700'
            }
        },
        customCSS: `
            /* 蒸汽朋克动画 */
            @keyframes gear-rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes gear-rotate-reverse {
                from { transform: rotate(360deg); }
                to { transform: rotate(0deg); }
            }
            
            @keyframes steam-release {
                0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
                20% { opacity: 0.8; }
                100% { opacity: 0; transform: translateY(-30px) scale(1.5); }
            }
            
            @keyframes pressure-pulse {
                0%, 100% { box-shadow: inset 0 0 10px rgba(205, 127, 50, 0.3); }
                50% { box-shadow: inset 0 0 20px rgba(255, 200, 100, 0.5); }
            }
            
            @keyframes piston-move {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(3px); }
            }
            
            @keyframes dial-flicker {
                0%, 90%, 100% { opacity: 1; }
                92%, 98% { opacity: 0.7; }
            }
            
            /* 卡片齿轮装饰 - 右上角大齿轮 */
            .dnd-char-card::before {
                content: "⚙";
                position: absolute;
                top: -15px;
                right: -15px;
                font-size: 45px;
                color: #b8860b;
                text-shadow:
                    2px 2px 0 #5c3a1a,
                    -1px -1px 0 #cd7f32,
                    0 0 10px rgba(184, 134, 11, 0.5);
                animation: gear-rotate 12s linear infinite;
                z-index: 10;
            }
            
            /* 卡片齿轮装饰 - 左下角小齿轮 */
            .dnd-char-card::after {
                content: "⚙";
                position: absolute;
                bottom: -10px;
                left: -10px;
                font-size: 30px;
                color: #8b4513;
                text-shadow:
                    1px 1px 0 #5c3a1a,
                    0 0 8px rgba(139, 69, 19, 0.5);
                animation: gear-rotate-reverse 8s linear infinite;
                z-index: 10;
            }
            
            /* 卡片头部铆钉装饰 */
            .dnd-card-header::before {
                content: "● ● ●";
                position: absolute;
                left: 15px;
                top: 50%;
                transform: translateY(-50%);
                color: #cd7f32;
                font-size: 8px;
                letter-spacing: 8px;
                text-shadow:
                    0 1px 0 #5c3a1a,
                    0 -1px 0 rgba(255,255,255,0.3);
            }
            
            .dnd-card-header::after {
                content: "● ● ●";
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                color: #cd7f32;
                font-size: 8px;
                letter-spacing: 8px;
                text-shadow:
                    0 1px 0 #5c3a1a,
                    0 -1px 0 rgba(255,255,255,0.3);
            }
            
            /* 进度条 - 压力表效果 */
            .dnd-bar-fill::before {
                content: "";
                position: absolute;
                top: 0; bottom: 0; left: 0; right: 0;
                background: repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 8px,
                    rgba(0,0,0,0.2) 8px,
                    rgba(0,0,0,0.2) 10px
                );
            }
            
            .dnd-bar-fill::after {
                content: "";
                position: absolute;
                top: 2px;
                left: 0;
                right: 0;
                height: 40%;
                background: linear-gradient(180deg, rgba(255,255,255,0.3), transparent);
                border-radius: 5px 5px 0 0;
            }
            
            /* 进度条容器压力表刻度 */
            .dnd-bar-container::before {
                content: "";
                position: absolute;
                top: -8px;
                left: 10%;
                width: 80%;
                height: 5px;
                background: repeating-linear-gradient(
                    90deg,
                    #8b4513,
                    #8b4513 2px,
                    transparent 2px,
                    transparent 10px
                );
            }
            
            .dnd-bar-container::after {
                content: "PSI";
                position: absolute;
                right: 5px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 8px;
                color: #b8860b;
                font-weight: 700;
                letter-spacing: 1px;
            }
            
            /* 导航项齿轮图标 */
            .dnd-nav-item::before {
                content: "⚙";
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                color: #8b4513;
                font-size: 14px;
                transition: transform 0.5s ease;
            }
            
            .dnd-nav-item:hover::before,
            .dnd-nav-item.active::before {
                animation: gear-rotate 2s linear infinite;
                color: #cd7f32;
            }
            
            .dnd-nav-item::after {
                content: "";
                position: absolute;
                right: 5px;
                top: 50%;
                transform: translateY(-50%);
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #cd7f32, #8b4513);
                border-radius: 50%;
                border: 2px solid #5c3a1a;
                box-shadow: inset 0 -1px 2px rgba(0,0,0,0.5);
            }
            
            /* 分隔线 - 铜管 */
            .dnd-divider {
                height: 8px;
                background: linear-gradient(180deg,
                    #5c3a1a 0%,
                    #cd7f32 20%,
                    #ffddaa 50%,
                    #cd7f32 80%,
                    #5c3a1a 100%
                );
                border-radius: 4px;
                position: relative;
                margin: 20px 0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
            }
            
            .dnd-divider::before {
                content: "";
                position: absolute;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 16px;
                height: 16px;
                background: radial-gradient(circle at 30% 30%, #cd7f32, #8b4513);
                border-radius: 50%;
                border: 2px solid #5c3a1a;
                box-shadow: inset 0 -2px 4px rgba(0,0,0,0.4);
            }
            
            .dnd-divider::after {
                content: "";
                position: absolute;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 16px;
                height: 16px;
                background: radial-gradient(circle at 30% 30%, #cd7f32, #8b4513);
                border-radius: 50%;
                border: 2px solid #5c3a1a;
                box-shadow: inset 0 -2px 4px rgba(0,0,0,0.4);
            }
            
            /* 面板角落齿轮装饰 */
            .dnd-panel::before,
            .dnd-dialog::before {
                content: "⚙";
                position: absolute;
                top: 10px;
                left: 10px;
                font-size: 24px;
                color: #b8860b;
                text-shadow: 1px 1px 0 #5c3a1a;
                animation: gear-rotate 15s linear infinite;
            }
            
            .dnd-panel::after,
            .dnd-dialog::after {
                content: "⚙";
                position: absolute;
                bottom: 10px;
                right: 10px;
                font-size: 20px;
                color: #8b4513;
                text-shadow: 1px 1px 0 #5c3a1a;
                animation: gear-rotate-reverse 10s linear infinite;
            }
            
            /* 滚动条 - 铜管轨道 */
            .dnd-content-area::-webkit-scrollbar {
                width: 14px;
            }
            
            .dnd-content-area::-webkit-scrollbar-track {
                background: linear-gradient(90deg, #2a2015, #3a2a1a, #2a2015);
                border: 2px solid #5c3a1a;
                border-radius: 7px;
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #cd7f32, #b8860b, #8b4513, #b8860b, #cd7f32);
                border-radius: 7px;
                border: 2px solid #5c3a1a;
                box-shadow: inset 0 0 5px rgba(255,255,255,0.2);
            }
            
            .dnd-content-area::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, #daa060, #cd7f32, #b8860b, #cd7f32, #daa060);
            }
            
            /* 图标容器 - 圆形压力表 */
            .dnd-icon-circle {
                border-radius: 50%;
                border: 4px solid #8b4513;
                background: radial-gradient(circle at 30% 30%, #4a3a2a, #2a1f15);
                box-shadow:
                    0 0 0 2px #b8860b,
                    0 0 15px rgba(184, 134, 11, 0.4),
                    inset 0 0 20px rgba(0,0,0,0.5);
                position: relative;
            }
            
            .dnd-icon-circle::before {
                content: "";
                position: absolute;
                inset: 3px;
                border: 1px solid rgba(184, 134, 11, 0.3);
                border-radius: 50%;
            }
            
            .dnd-icon-circle::after {
                content: "";
                position: absolute;
                top: 5px;
                left: 20%;
                width: 60%;
                height: 30%;
                background: linear-gradient(180deg, rgba(255,255,255,0.2), transparent);
                border-radius: 50%;
            }
            
            /* 头像框 - 八角铜框 */
            .dnd-avatar {
                clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
                border: 4px solid #b8860b;
                box-shadow:
                    0 0 0 3px #5c3a1a,
                    0 0 20px rgba(184, 134, 11, 0.4);
                position: relative;
            }
            
            .dnd-avatar::before {
                content: "";
                position: absolute;
                inset: -8px;
                clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
                background: linear-gradient(135deg, #cd7f32, #8b4513, #b8860b);
                z-index: -1;
            }
            
            /* 卡片悬停蒸汽效果 */
            .dnd-char-card:hover {
                box-shadow:
                    0 0 0 4px #3e3020,
                    0 0 0 7px #cd7f32,
                    0 0 0 9px #5c3a1a,
                    0 15px 45px rgba(43, 32, 21, 0.7),
                    0 0 30px rgba(184, 134, 11, 0.3);
            }
            
            .dnd-char-card:hover::before {
                animation: gear-rotate 4s linear infinite;
                text-shadow:
                    2px 2px 0 #5c3a1a,
                    -1px -1px 0 #cd7f32,
                    0 0 20px rgba(255, 200, 100, 0.8);
            }
            
            /* 工具提示 - 铜牌 */
            .dnd-tooltip {
                background: linear-gradient(135deg, #3e3020, #2b2015);
                border: 3px solid #8b4513;
                border-radius: 8px;
                box-shadow:
                    0 0 0 1px #b8860b,
                    0 5px 20px rgba(0,0,0,0.5);
            }
            
            .dnd-tooltip::before {
                content: "⚙";
                position: absolute;
                top: 5px;
                left: 8px;
                color: #cd7f32;
                font-size: 12px;
            }
            
            /* 皮革纹理叠加 */
            .dnd-char-card > .dnd-card-body::before {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
                pointer-events: none;
            }
            
            /* 不同位置卡片的齿轮变化 */
            .dnd-char-card:nth-child(2n)::before {
                content: "⚙";
                top: -12px;
                right: auto;
                left: -12px;
                animation-direction: reverse;
            }
            
            .dnd-char-card:nth-child(2n)::after {
                bottom: auto;
                top: -8px;
                left: auto;
                right: -8px;
            }
            
            .dnd-char-card:nth-child(3n)::before {
                font-size: 35px;
                animation-duration: 8s;
            }
        `,
        background: {
            type: 'gears',
            colors: ['rgba(184, 134, 11, 0.35)', 'rgba(139, 69, 19, 0.3)', 'rgba(205, 127, 50, 0.25)'],
            count: 8,
            speed: 0.01,
            size: { min: 40, max: 100 },
            animated: true
        }
    }
};

/**
 * 获取所有可用风格列表（用于UI展示）
 */
export const getStyleList = () => {
    return Object.values(STYLE_PRESETS).map(style => ({
        id: style.meta.id,
        name: style.meta.name,
        icon: style.meta.icon,
        description: style.meta.description,
        author: style.meta.author
    }));
};

/**
 * 获取指定风格的完整配置
 */
export const getStylePreset = (styleId) => {
    return STYLE_PRESETS[styleId] || null;
};

/**
 * 检查是否为内置风格
 */
export const isBuiltinStyle = (styleId) => {
    return styleId in STYLE_PRESETS;
};
