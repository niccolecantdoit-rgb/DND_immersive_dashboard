// src/features/StyleEffects.js
/**
 * 风格特效生成器 - 将 morphology 配置转换为真正的 CSS 效果
 * 
 * 这个模块解决了 morphology 配置只设置变量但不产生实际效果的问题
 * 通过生成完整的 CSS 规则，实现真正的视觉差异化
 */

import { getCore } from '../core/Utils.js';
import { Logger } from '../core/Logger.js';

export const StyleEffects = {
    // 特效样式元素ID
    EFFECTS_STYLE_ID: 'dnd-style-effects',
    
    /**
     * 应用完整的风格特效
     * @param {Object} stylePack - 完整的风格包配置
     */
    apply(stylePack) {
        if (!stylePack) return;
        
        const cssRules = [];
        
        // 1. 生成角部形态样式
        if (stylePack.morphology?.corners) {
            cssRules.push(...this._generateCornerStyles(stylePack.morphology.corners, stylePack.colors));
        }
        
        // 2. 生成卡片形态样式
        if (stylePack.morphology?.card) {
            cssRules.push(...this._generateCardStyles(stylePack.morphology.card, stylePack.colors));
        }
        
        // 3. 生成装饰元素样式
        if (stylePack.morphology?.decorations) {
            cssRules.push(...this._generateDecorationStyles(stylePack.morphology.decorations, stylePack.colors));
        }
        
        // 4. 生成视觉特效样式
        if (stylePack.morphology?.effects) {
            cssRules.push(...this._generateEffectStyles(stylePack.morphology.effects, stylePack.colors));
        }
        
        // 5. 生成按钮变体样式
        if (stylePack.morphology?.buttons) {
            cssRules.push(...this._generateButtonStyles(stylePack.morphology.buttons, stylePack.colors));
        }
        
        // 6. 生成进度条变体样式
        if (stylePack.morphology?.progressBars) {
            cssRules.push(...this._generateProgressStyles(stylePack.morphology.progressBars, stylePack.colors));
        }
        
        // 7. 生成图标容器样式
        if (stylePack.morphology?.decorations?.icons) {
            cssRules.push(...this._generateIconStyles(stylePack.morphology.decorations.icons, stylePack.colors));
        }
        
        // 8. 生成布局密度样式
        if (stylePack.morphology?.layout) {
            cssRules.push(...this._generateLayoutStyles(stylePack.morphology.layout));
        }
        
        // 9. 应用自定义 CSS 片段
        if (stylePack.customCSS) {
            cssRules.push(stylePack.customCSS);
        }
        
        // 注入样式
        this._injectStyles(cssRules.join('\n'));
        
        Logger.debug('StyleEffects: 已应用', cssRules.length, '条特效规则');
    },
    
    /**
     * 清除特效样式
     */
    clear() {
        const { window: coreWin } = getCore();
        const doc = coreWin?.document || document;
        const el = doc.getElementById(this.EFFECTS_STYLE_ID);
        if (el) el.remove();
    },
    
    // ==================== 角部形态 ====================
    
    _generateCornerStyles(corners, colors) {
        const rules = [];
        const { style, clipPath } = corners;
        const borderColor = colors?.['--dnd-border-gold'] || '#9d8b6c';
        
        switch (style) {
            case 'chamfer':
                // 切角效果
                rules.push(`
                    .dnd-char-card,
                    .dnd-panel,
                    .dnd-dialog {
                        clip-path: ${clipPath || 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)'} !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'notched':
                // 缺口效果
                rules.push(`
                    .dnd-char-card,
                    .dnd-panel {
                        clip-path: polygon(
                            0 8px, 8px 8px, 8px 0,
                            calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px,
                            100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%,
                            8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px)
                        ) !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'angular':
                // 尖角效果（科技风）
                rules.push(`
                    .dnd-char-card,
                    .dnd-panel {
                        clip-path: ${clipPath || 'polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)'} !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'organic':
                // 有机/不规则圆角
                rules.push(`
                    .dnd-char-card,
                    .dnd-panel {
                        border-radius: 30% 70% 70% 30% / 30% 30% 70% 70% !important;
                    }
                `);
                break;
                
            case 'shield':
                // 盾牌形状
                rules.push(`
                    .dnd-char-card {
                        clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%) !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'hexagon':
                // 六边形
                rules.push(`
                    .dnd-char-card {
                        clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%) !important;
                        border-radius: 0 !important;
                    }
                `);
                break;

            case 'cut':
                // 切角 (Cyberpunk style)
                rules.push(`
                    .dnd-char-card,
                    .dnd-panel,
                    .dnd-dialog {
                        clip-path: ${clipPath || 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)'} !important;
                        border-radius: 0 !important;
                    }
                `);
                break;

            case 'rounded-soft':
                // 柔和圆角
                rules.push(`
                    .dnd-char-card,
                    .dnd-panel {
                        border-radius: 12px 12px 12px 12px !important;
                    }
                `);
                break;

            case 'rounded-large':
                // 大圆角 (LCARS style)
                rules.push(`
                    .dnd-char-card,
                    .dnd-panel {
                        border-radius: 20px !important;
                    }
                `);
                break;

            case 'irregular':
                // 不规则/扭曲
                rules.push(`
                    .dnd-char-card {
                        clip-path: ${clipPath || 'polygon(2% 0%, 100% 2%, 98% 100%, 0% 98%)'} !important;
                        border-radius: 2px !important;
                    }
                `);
                break;

            case 'ornate':
                // 华丽/复杂多边形
                rules.push(`
                    .dnd-char-card {
                        clip-path: ${clipPath || 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)'} !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
        }
        
        return rules;
    },
    
    // ==================== 卡片形态 ====================
    
    _generateCardStyles(card, colors) {
        const rules = [];
        const { shape, aspectRatio, transform, decoration } = card;
        const borderColor = colors?.['--dnd-border-gold'] || '#9d8b6c';
        const accentColor = colors?.['--dnd-text-highlight'] || '#ffdb85';
        
        // 宽高比
        if (aspectRatio && aspectRatio !== 'auto') {
            rules.push(`
                .dnd-char-card {
                    aspect-ratio: ${aspectRatio} !important;
                }
            `);
        }
        
        // 变形效果
        if (transform && transform !== 'none') {
            rules.push(`
                .dnd-char-card {
                    transform: ${transform} !important;
                }
            `);
        }
        
        // 装饰风格
        switch (decoration) {
            case 'ornate':
                // 华丽装饰边框
                rules.push(`
                    .dnd-char-card {
                        border: 2px solid ${borderColor} !important;
                        box-shadow: 
                            inset 0 0 0 3px rgba(0,0,0,0.3),
                            inset 0 0 0 4px ${borderColor},
                            0 4px 20px rgba(0,0,0,0.5) !important;
                    }
                    .dnd-char-card::before {
                        content: "" !important;
                        position: absolute !important;
                        top: 8px; left: 8px; right: 8px; bottom: 8px !important;
                        border: 1px dashed ${borderColor}40 !important;
                        pointer-events: none !important;
                        z-index: 1 !important;
                    }
                `);
                break;
                
            case 'tech':
                // 科技风装饰
                rules.push(`
                    .dnd-char-card {
                        border: 1px solid ${borderColor} !important;
                        position: relative !important;
                    }
                    .dnd-char-card::before,
                    .dnd-char-card::after {
                        content: "" !important;
                        position: absolute !important;
                        width: 20px !important;
                        height: 20px !important;
                        border: 2px solid ${accentColor} !important;
                        pointer-events: none !important;
                        z-index: 10 !important;
                    }
                    .dnd-char-card::before {
                        top: -1px !important;
                        left: -1px !important;
                        border-right: none !important;
                        border-bottom: none !important;
                    }
                    .dnd-char-card::after {
                        bottom: -1px !important;
                        right: -1px !important;
                        border-left: none !important;
                        border-top: none !important;
                    }
                `);
                break;
                
            case 'medieval':
                // 中世纪风格
                rules.push(`
                    .dnd-char-card {
                        border: 3px double ${borderColor} !important;
                        box-shadow: 
                            inset 0 0 20px rgba(0,0,0,0.4),
                            0 5px 15px rgba(0,0,0,0.5) !important;
                    }
                `);
                break;
                
            case 'neon':
                // 霓虹发光
                rules.push(`
                    .dnd-char-card {
                        border: 1px solid ${accentColor} !important;
                        box-shadow: 
                            0 0 10px ${accentColor}40,
                            0 0 20px ${accentColor}20,
                            inset 0 0 15px ${accentColor}10 !important;
                    }
                    .dnd-char-card:hover {
                        box-shadow: 
                            0 0 20px ${accentColor}60,
                            0 0 40px ${accentColor}30,
                            inset 0 0 20px ${accentColor}20 !important;
                    }
                `);
                break;
                
            case 'minimal':
                // 极简
                rules.push(`
                    .dnd-char-card {
                        border: none !important;
                        box-shadow: none !important;
                        border-bottom: 2px solid ${borderColor} !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'card3d':
                // 3D卡片效果
                rules.push(`
                    .dnd-char-card {
                        transform-style: preserve-3d !important;
                        perspective: 1000px !important;
                        transition: transform 0.3s ease !important;
                    }
                    .dnd-char-card:hover {
                        transform: rotateX(-5deg) rotateY(5deg) translateZ(10px) !important;
                    }
                `);
                break;

            case 'vines':
                // 藤蔓装饰
                rules.push(`
                    .dnd-char-card {
                        border: 1px solid ${borderColor} !important;
                        position: relative !important;
                    }
                    .dnd-char-card::before {
                        content: "" !important;
                        position: absolute !important;
                        top: 0; left: 0; right: 0; bottom: 0 !important;
                        border: 2px solid transparent !important;
                        border-image: linear-gradient(to bottom right, ${borderColor}, transparent 40%, transparent 60%, ${borderColor}) 1 !important;
                        pointer-events: none !important;
                        z-index: 1 !important;
                    }
                `);
                break;

            case 'rivets':
                // 铆钉装饰
                rules.push(`
                    .dnd-char-card {
                        border: 2px solid ${borderColor} !important;
                        position: relative !important;
                        margin: 4px !important;
                    }
                    .dnd-char-card::after {
                        content: "" !important;
                        position: absolute !important;
                        top: -6px; left: -6px; right: -6px; bottom: -6px !important;
                        background-image:
                            radial-gradient(circle, ${borderColor} 30%, transparent 35%),
                            radial-gradient(circle, ${borderColor} 30%, transparent 35%),
                            radial-gradient(circle, ${borderColor} 30%, transparent 35%),
                            radial-gradient(circle, ${borderColor} 30%, transparent 35%) !important;
                        background-position: 0 0, 100% 0, 0 100%, 100% 100% !important;
                        background-repeat: no-repeat !important;
                        background-size: 12px 12px !important;
                        pointer-events: none !important;
                        z-index: 10 !important;
                    }
                `);
                break;

            case 'lcars':
                // LCARS 风格
                rules.push(`
                    .dnd-char-card {
                        border: none !important;
                        border-left: 20px solid ${accentColor} !important;
                        border-radius: 0 10px 10px 0 !important;
                        background: ${colors?.['--dnd-bg-card-start'] || '#000'} !important;
                    }
                    .dnd-card-header {
                        background: ${accentColor} !important;
                        color: #000 !important;
                        margin-left: -20px !important;
                        padding-left: 30px !important;
                        border-radius: 0 0 20px 0 !important;
                        margin-bottom: 10px !important;
                    }
                `);
                break;

            case 'gears':
                // 齿轮装饰 (背景)
                rules.push(`
                    .dnd-char-card {
                        border: 3px double ${borderColor} !important;
                    }
                    @keyframes spin-slow {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .dnd-char-card::before {
                        content: "⚙️" !important;
                        position: absolute !important;
                        font-size: 100px !important;
                        opacity: 0.05 !important;
                        top: -20px !important;
                        right: -20px !important;
                        animation: spin-slow 20s linear infinite !important;
                        pointer-events: none !important;
                    }
                `);
                break;

            case 'runes':
                // 符文覆盖
                rules.push(`
                    .dnd-char-card::before {
                        content: "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ" !important;
                        position: absolute !important;
                        top: 0; left: 0; right: 0; bottom: 0 !important;
                        font-size: 24px !important;
                        line-height: 24px !important;
                        color: ${accentColor} !important;
                        opacity: 0.03 !important;
                        word-break: break-all !important;
                        overflow: hidden !important;
                        pointer-events: none !important;
                        mix-blend-mode: overlay !important;
                    }
                `);
                break;
        }
        
        return rules;
    },
    
    // ==================== 装饰元素 ====================
    
    _generateDecorationStyles(decorations, colors) {
        const rules = [];
        const { corners, dividers, headers } = decorations;
        const borderColor = colors?.['--dnd-border-gold'] || '#9d8b6c';
        const accentColor = colors?.['--dnd-text-highlight'] || '#ffdb85';
        
        // 角部装饰
        switch (corners) {
            case 'flourish':
                // 花饰角（SVG伪元素）
                rules.push(`
                    .dnd-card-header::before,
                    .dnd-card-header::after {
                        content: "❧" !important;
                        position: absolute !important;
                        font-size: 16px !important;
                        color: ${borderColor} !important;
                        opacity: 0.6 !important;
                    }
                    .dnd-card-header::before {
                        left: 8px !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                    }
                    .dnd-card-header::after {
                        right: 8px !important;
                        top: 50% !important;
                        transform: translateY(-50%) scaleX(-1) !important;
                    }
                `);
                break;
                
            case 'tech-bracket':
                // 科技方括号
                rules.push(`
                    .dnd-card-header {
                        position: relative !important;
                    }
                    .dnd-card-header::before,
                    .dnd-card-header::after {
                        content: "" !important;
                        position: absolute !important;
                        width: 8px !important;
                        height: 60% !important;
                        border: 2px solid ${accentColor} !important;
                        top: 20% !important;
                    }
                    .dnd-card-header::before {
                        left: 4px !important;
                        border-right: none !important;
                    }
                    .dnd-card-header::after {
                        right: 4px !important;
                        border-left: none !important;
                    }
                `);
                break;
                
            case 'rune':
                // 符文装饰
                rules.push(`
                    .dnd-card-header::before {
                        content: "᛭" !important;
                        position: absolute !important;
                        left: 10px !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                        font-size: 14px !important;
                        color: ${accentColor} !important;
                    }
                    .dnd-card-header::after {
                        content: "᛭" !important;
                        position: absolute !important;
                        right: 10px !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                        font-size: 14px !important;
                        color: ${accentColor} !important;
                    }
                `);
                break;
                
            case 'simple-dot':
                // 简单圆点
                rules.push(`
                    .dnd-card-header::before,
                    .dnd-card-header::after {
                        content: "" !important;
                        position: absolute !important;
                        width: 6px !important;
                        height: 6px !important;
                        background: ${borderColor} !important;
                        border-radius: 50% !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                    }
                    .dnd-card-header::before { left: 8px !important; }
                    .dnd-card-header::after { right: 8px !important; }
                `);
                break;

            case 'bolts':
                // 螺栓
                rules.push(`
                    .dnd-card-header::before,
                    .dnd-card-header::after {
                        content: "⬡" !important;
                        position: absolute !important;
                        font-size: 12px !important;
                        color: ${borderColor} !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                        opacity: 0.8 !important;
                    }
                    .dnd-card-header::before { left: 8px !important; }
                    .dnd-card-header::after { right: 8px !important; }
                `);
                break;

            case 'gears':
                // 齿轮角
                rules.push(`
                    .dnd-card-header::before,
                    .dnd-card-header::after {
                        content: "⚙️" !important;
                        position: absolute !important;
                        font-size: 14px !important;
                        color: ${borderColor} !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                        opacity: 0.8 !important;
                    }
                    .dnd-card-header::before { left: 6px !important; }
                    .dnd-card-header::after { right: 6px !important; }
                `);
                break;
        }
        
        // 分隔线样式
        switch (dividers) {
            case 'ornate':
                rules.push(`
                    .dnd-card-header {
                        border-bottom: none !important;
                        position: relative !important;
                        padding-bottom: 12px !important;
                    }
                    .dnd-card-header::after {
                        content: "─────── ✦ ───────" !important;
                        position: absolute !important;
                        bottom: 0 !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        font-size: 10px !important;
                        color: ${borderColor} !important;
                        white-space: nowrap !important;
                    }
                `);
                break;
                
            case 'tech':
                rules.push(`
                    .dnd-card-header {
                        border-bottom: none !important;
                        position: relative !important;
                    }
                    .dnd-card-header::after {
                        content: "" !important;
                        position: absolute !important;
                        bottom: 0 !important;
                        left: 10% !important;
                        right: 10% !important;
                        height: 2px !important;
                        background: linear-gradient(90deg, transparent, ${accentColor}, transparent) !important;
                    }
                `);
                break;
                
            case 'double':
                rules.push(`
                    .dnd-card-header {
                        border-bottom: 3px double ${borderColor} !important;
                    }
                `);
                break;
                
            case 'gradient':
                rules.push(`
                    .dnd-card-header {
                        border-bottom: none !important;
                        background: linear-gradient(to bottom, transparent 90%, ${borderColor}40 100%) !important;
                    }
                `);
                break;

            case 'leaves':
                // 叶子分隔
                rules.push(`
                    .dnd-card-header {
                        border-bottom: 1px solid ${borderColor} !important;
                        position: relative !important;
                    }
                    .dnd-card-header::after {
                        content: "🍃" !important;
                        position: absolute !important;
                        bottom: -10px !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        font-size: 14px !important;
                        color: ${accentColor} !important;
                        background: var(--dnd-bg-card) !important;
                        padding: 0 5px !important;
                    }
                `);
                break;

            case 'pipes':
                // 管道分隔
                rules.push(`
                    .dnd-card-header {
                        border-bottom: 4px double ${borderColor} !important;
                        margin-bottom: 8px !important;
                    }
                `);
                break;
        }
        
        // 标题装饰
        switch (headers) {
            case 'underline':
                rules.push(`
                    .dnd-card-header .dnd-title {
                        position: relative !important;
                        display: inline-block !important;
                    }
                    .dnd-card-header .dnd-title::after {
                        content: "" !important;
                        position: absolute !important;
                        bottom: -4px !important;
                        left: 0 !important;
                        right: 0 !important;
                        height: 2px !important;
                        background: ${accentColor} !important;
                    }
                `);
                break;
                
            case 'banner':
                rules.push(`
                    .dnd-card-header {
                        background: linear-gradient(135deg, ${borderColor}30, transparent 70%) !important;
                        clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%) !important;
                    }
                `);
                break;
                
            case 'ribbon':
                rules.push(`
                    .dnd-card-header {
                        position: relative !important;
                        margin: 0 -10px !important;
                        padding: 8px 20px !important;
                        background: ${borderColor}40 !important;
                    }
                    .dnd-card-header::before,
                    .dnd-card-header::after {
                        content: "" !important;
                        position: absolute !important;
                        bottom: -8px !important;
                        border: 4px solid ${borderColor}60 !important;
                        border-bottom-color: transparent !important;
                    }
                    .dnd-card-header::before {
                        left: 0 !important;
                        border-left-color: transparent !important;
                    }
                    .dnd-card-header::after {
                        right: 0 !important;
                        border-right-color: transparent !important;
                    }
                `);
                break;
                
            case 'tech-bar':
                rules.push(`
                    .dnd-card-header {
                        background: linear-gradient(90deg, ${accentColor}20, transparent 30%, transparent 70%, ${accentColor}20) !important;
                        border-left: 3px solid ${accentColor} !important;
                    }
                `);
                break;

            case 'bar':
                // 纯色条 (LCARS)
                rules.push(`
                    .dnd-card-header {
                        background: ${accentColor} !important;
                        color: #000 !important;
                        border-radius: 0 0 10px 0 !important;
                    }
                    .dnd-char-name {
                        color: #000 !important;
                        font-weight: 900 !important;
                        text-transform: uppercase !important;
                    }
                `);
                break;
        }
        
        return rules;
    },
    
    // ==================== 视觉特效 ====================
    
    _generateEffectStyles(effects, colors) {
        const rules = [];
        const { overlay, innerGlow, borderGlow, texture, animation } = effects;
        const accentColor = colors?.['--dnd-text-highlight'] || '#ffdb85';
        
        // 扫描线效果（增强版）
        if (overlay === 'scanlines') {
            rules.push(`
                .dnd-char-card::after {
                    content: "" !important;
                    position: absolute !important;
                    top: 0; left: 0; right: 0; bottom: 0 !important;
                    background: repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0,0,0,0.1) 2px,
                        rgba(0,0,0,0.1) 4px
                    ) !important;
                    pointer-events: none !important;
                    z-index: 100 !important;
                    animation: scanline 8s linear infinite !important;
                }
                @keyframes scanline {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 100px; }
                }
            `);
        }
        
        // 脉冲边框发光
        if (borderGlow === 'pulse') {
            rules.push(`
                @keyframes borderPulse {
                    0%, 100% { box-shadow: 0 0 10px ${accentColor}40; }
                    50% { box-shadow: 0 0 25px ${accentColor}80, 0 0 40px ${accentColor}40; }
                }
                .dnd-char-card {
                    animation: borderPulse 3s ease-in-out infinite !important;
                }
            `);
        }
        
        // 自定义动画效果
        if (animation) {
            switch (animation) {
                case 'float':
                    rules.push(`
                        @keyframes cardFloat {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-5px); }
                        }
                        .dnd-char-card {
                            animation: cardFloat 4s ease-in-out infinite !important;
                        }
                    `);
                    break;
                    
                case 'shimmer':
                    rules.push(`
                        @keyframes shimmer {
                            0% { background-position: -200% 0; }
                            100% { background-position: 200% 0; }
                        }
                        .dnd-char-card::before {
                            content: "" !important;
                            position: absolute !important;
                            top: 0; left: 0; right: 0; bottom: 0 !important;
                            background: linear-gradient(
                                90deg,
                                transparent,
                                rgba(255,255,255,0.05),
                                transparent
                            ) !important;
                            background-size: 200% 100% !important;
                            animation: shimmer 3s infinite !important;
                            pointer-events: none !important;
                            z-index: 1 !important;
                        }
                    `);
                    break;
                    
                case 'glow-breathe':
                    rules.push(`
                        @keyframes glowBreathe {
                            0%, 100% { filter: brightness(1); }
                            50% { filter: brightness(1.1); }
                        }
                        .dnd-char-card {
                            animation: glowBreathe 4s ease-in-out infinite !important;
                        }
                    `);
                    break;
            }
        }
        
        return rules;
    },
    
    // ==================== 按钮变体 ====================
    
    _generateButtonStyles(buttons, colors) {
        const rules = [];
        const { shape, style: btnStyle } = buttons;
        const borderColor = colors?.['--dnd-border-gold'] || '#9d8b6c';
        const accentColor = colors?.['--dnd-text-highlight'] || '#ffdb85';
        
        switch (shape) {
            case 'pill':
                rules.push(`
                    .dnd-btn {
                        border-radius: 50px !important;
                        padding: 6px 20px !important;
                    }
                `);
                break;
                
            case 'angular':
                rules.push(`
                    .dnd-btn {
                        border-radius: 0 !important;
                        clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px) !important;
                    }
                `);
                break;
                
            case 'hexagon':
                rules.push(`
                    .dnd-btn {
                        clip-path: polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%) !important;
                        padding: 8px 24px !important;
                    }
                `);
                break;
        }
        
        switch (btnStyle) {
            case 'outline':
                rules.push(`
                    .dnd-btn {
                        background: transparent !important;
                        border: 2px solid ${borderColor} !important;
                    }
                    .dnd-btn:hover {
                        background: ${borderColor}30 !important;
                    }
                `);
                break;
                
            case 'ghost':
                rules.push(`
                    .dnd-btn {
                        background: transparent !important;
                        border: none !important;
                    }
                    .dnd-btn:hover {
                        background: ${borderColor}20 !important;
                    }
                `);
                break;
                
            case 'neon':
                rules.push(`
                    .dnd-btn {
                        background: transparent !important;
                        border: 1px solid ${accentColor} !important;
                        box-shadow: 0 0 10px ${accentColor}40, inset 0 0 10px ${accentColor}20 !important;
                        text-shadow: 0 0 5px ${accentColor} !important;
                    }
                    .dnd-btn:hover {
                        box-shadow: 0 0 20px ${accentColor}60, inset 0 0 15px ${accentColor}30 !important;
                    }
                `);
                break;
                
            case '3d':
                rules.push(`
                    .dnd-btn {
                        box-shadow: 0 4px 0 ${borderColor}80 !important;
                        transform: translateY(0) !important;
                        transition: all 0.1s ease !important;
                    }
                    .dnd-btn:hover {
                        transform: translateY(2px) !important;
                        box-shadow: 0 2px 0 ${borderColor}80 !important;
                    }
                    .dnd-btn:active {
                        transform: translateY(4px) !important;
                        box-shadow: 0 0 0 ${borderColor}80 !important;
                    }
                `);
                break;
        }
        
        return rules;
    },
    
    // ==================== 进度条变体 ====================
    
    _generateProgressStyles(progressBars, colors) {
        const rules = [];
        const { shape, style: barStyle, segments } = progressBars;
        const hpStart = colors?.['--dnd-bar-hp-start'] || '#8a2c2c';
        const hpEnd = colors?.['--dnd-bar-hp-end'] || '#c0392b';
        
        switch (shape) {
            case 'angular':
                rules.push(`
                    .dnd-bar, .dnd-bar-fill {
                        border-radius: 0 !important;
                        clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%) !important;
                    }
                `);
                break;
                
            case 'pointed':
                rules.push(`
                    .dnd-bar-fill {
                        clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%) !important;
                    }
                `);
                break;
        }
        
        switch (barStyle) {
            case 'striped':
                rules.push(`
                    .dnd-bar-fill {
                        background-image: linear-gradient(
                            45deg,
                            rgba(255,255,255,0.15) 25%,
                            transparent 25%,
                            transparent 50%,
                            rgba(255,255,255,0.15) 50%,
                            rgba(255,255,255,0.15) 75%,
                            transparent 75%,
                            transparent
                        ) !important;
                        background-size: 20px 20px !important;
                    }
                `);
                break;
                
            case 'animated':
                rules.push(`
                    @keyframes barStripe {
                        0% { background-position: 0 0; }
                        100% { background-position: 40px 0; }
                    }
                    .dnd-bar-fill {
                        background-image: linear-gradient(
                            45deg,
                            rgba(255,255,255,0.15) 25%,
                            transparent 25%,
                            transparent 50%,
                            rgba(255,255,255,0.15) 50%,
                            rgba(255,255,255,0.15) 75%,
                            transparent 75%,
                            transparent
                        ) !important;
                        background-size: 40px 40px !important;
                        animation: barStripe 1s linear infinite !important;
                    }
                `);
                break;
                
            case 'glow':
                rules.push(`
                    .dnd-bar-fill {
                        box-shadow: 0 0 10px currentColor, inset 0 0 5px rgba(255,255,255,0.3) !important;
                    }
                `);
                break;
        }
        
        // 分段进度条
        if (segments && segments > 0) {
            rules.push(`
                .dnd-bar {
                    background: repeating-linear-gradient(
                        90deg,
                        var(--dnd-bar-bg) 0px,
                        var(--dnd-bar-bg) calc(100% / ${segments} - 2px),
                        transparent calc(100% / ${segments} - 2px),
                        transparent calc(100% / ${segments})
                    ) !important;
                }
            `);
        }
        
        return rules;
    },
    
    // ==================== 图标容器 ====================
    
    _generateIconStyles(iconShape, colors) {
        const rules = [];
        const borderColor = colors?.['--dnd-border-gold'] || '#9d8b6c';
        
        switch (iconShape) {
            case 'square':
                rules.push(`
                    .dnd-char-avatar,
                    .dnd-icon-container {
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'rounded':
                rules.push(`
                    .dnd-char-avatar,
                    .dnd-icon-container {
                        border-radius: 8px !important;
                    }
                `);
                break;
                
            case 'hexagon':
                rules.push(`
                    .dnd-char-avatar,
                    .dnd-icon-container {
                        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'diamond':
                rules.push(`
                    .dnd-char-avatar,
                    .dnd-icon-container {
                        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%) !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'shield':
                rules.push(`
                    .dnd-char-avatar,
                    .dnd-icon-container {
                        clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%) !important;
                        border-radius: 0 !important;
                    }
                `);
                break;
                
            case 'octagon':
                rules.push(`
                    .dnd-char-avatar,
                    .dnd-icon-container {
                        clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%) !important;
                        border-radius: 0 !important;
                    }
                `);
                break;

            case 'tentacles':
                // 触手图标 (Lovecraftian)
                rules.push(`
                    .dnd-char-avatar {
                        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50% !important;
                        animation: blob 5s ease-in-out infinite alternate !important;
                    }
                    @keyframes blob {
                        0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
                        100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                    }
                `);
                break;
        }
        
        return rules;
    },
    
    // ==================== 布局密度 ====================
    
    _generateLayoutStyles(layout) {
        const rules = [];
        const { density, cardMinWidth, gridGap } = layout;
        
        const spacingScale = {
            'compact': 0.7,
            'normal': 1,
            'spacious': 1.4
        };
        
        const scale = spacingScale[density] || 1;
        
        if (density) {
            rules.push(`
                .dnd-grid {
                    gap: calc(${gridGap || '15px'} * ${scale}) !important;
                    padding: calc(10px * ${scale}) !important;
                }
                .dnd-char-card {
                    padding: calc(12px * ${scale}) !important;
                }
                .dnd-card-header {
                    padding: calc(10px * ${scale}) calc(12px * ${scale}) !important;
                    margin: calc(-12px * ${scale}) calc(-12px * ${scale}) calc(8px * ${scale}) !important;
                }
                .dnd-spacing-sm { margin-bottom: calc(8px * ${scale}) !important; }
                .dnd-spacing-md { margin-bottom: calc(12px * ${scale}) !important; }
                .dnd-spacing-lg { margin-bottom: calc(20px * ${scale}) !important; }
            `);
        }
        
        if (cardMinWidth) {
            rules.push(`
                .dnd-grid {
                    grid-template-columns: repeat(auto-fill, minmax(${cardMinWidth}, 1fr)) !important;
                }
            `);
        }
        
        return rules;
    },
    
    // ==================== 工具方法 ====================
    
    _injectStyles(cssText) {
        const { window: coreWin } = getCore();
        const doc = coreWin?.document || document;
        
        // 先清除旧的
        this.clear();
        
        if (!cssText || cssText.trim().length === 0) return;
        
        const styleEl = doc.createElement('style');
        styleEl.id = this.EFFECTS_STYLE_ID;
        styleEl.textContent = cssText;
        doc.head.appendChild(styleEl);
    }
};
