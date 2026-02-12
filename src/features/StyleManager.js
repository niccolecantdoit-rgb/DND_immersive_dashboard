// src/features/StyleManager.js
import { DBAdapter } from '../core/DBAdapter.js';
import { Logger } from '../core/Logger.js';
import { getCore } from '../core/Utils.js';
import { CONFIG } from '../config/Config.js';
import { ThemeManager } from './ThemeManager.js';
import { StyleValidator } from './StyleValidator.js';
import { StyleEffects } from './StyleEffects.js';
import { STYLE_PRESETS, getStyleList, getStylePreset, isBuiltinStyle } from '../config/StylePresets.js';

/**
 * 将颜色转换为高不透明度的 rgba 格式
 * 支持 #RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba() 等格式
 * @param {string} color - 输入颜色
 * @param {number} alpha - 目标透明度 (0-1)，默认 0.99
 * @returns {string} rgba 格式的颜色
 */
function ensureOpaqueColor(color, alpha = 0.99) {
    if (!color || typeof color !== 'string') return `rgba(36, 36, 36, ${alpha})`;
    
    color = color.trim();
    
    // 处理 rgba 格式
    const rgbaMatch = color.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)$/i);
    if (rgbaMatch) {
        return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
    }
    
    // 处理十六进制格式
    let hex = color;
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    
    // 处理 3 位十六进制 (#RGB)
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // 处理 4 位十六进制 (#RGBA)
    if (hex.length === 4) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // 处理 8 位十六进制 (#RRGGBBAA) - 截取前6位
    if (hex.length === 8) {
        hex = hex.slice(0, 6);
    }
    
    // 确保是有效的 6 位十六进制
    if (hex.length !== 6 || !/^[0-9a-fA-F]+$/.test(hex)) {
        return `rgba(36, 36, 36, ${alpha})`;
    }
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 样式管理器 - 管理完整的视觉风格包
 * 
 * 与 ThemeManager 的关系：
 * - ThemeManager: 仅处理颜色变量
 * - StyleManager: 完整风格包（颜色 + 尺寸 + 圆角 + 动画 + 组件覆盖）
 * - StyleManager 会调用 ThemeManager 来应用颜色部分
 */
export const StyleManager = {
    // 当前应用的风格ID
    currentStyleId: 'classic-dnd',
    
    // 自定义风格存储（用户导入的）
    customStyles: {},
    
    // 动态注入的样式元素ID
    STYLE_ELEMENT_ID: 'dnd-style-manager-overrides',
    
    /**
     * 初始化样式管理器
     */
    async init() {
        try {
            // 1. 加载自定义风格
            const savedCustomStyles = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.CUSTOM_STYLES);
            if (savedCustomStyles) {
                try {
                    this.customStyles = JSON.parse(savedCustomStyles);
                    Logger.info('已加载自定义风格:', Object.keys(this.customStyles).length);
                } catch (e) {
                    Logger.error('解析自定义风格失败:', e);
                    this.customStyles = {};
                }
            }
            
            // 2. 加载上次使用的风格
            const savedStyleId = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.CURRENT_STYLE);
            if (savedStyleId) {
                await this.apply(savedStyleId, false); // 不保存，因为是加载
            } else {
                // 默认使用经典DND
                await this.apply('classic-dnd', false);
            }
            
            Logger.info('StyleManager 初始化完成，当前风格:', this.currentStyleId);
        } catch (e) {
            Logger.error('StyleManager 初始化失败:', e);
        }
    },
    
    /**
     * 应用指定风格
     * @param {string} styleId - 风格ID
     * @param {boolean} save - 是否保存到数据库
     */
    async apply(styleId, save = true) {
        try {
            // 获取风格配置
            const stylePack = this.getStyle(styleId);
            if (!stylePack) {
                Logger.warn('风格不存在:', styleId);
                return false;
            }
            
            // 1. 应用颜色变量（复用ThemeManager）
            if (stylePack.colors) {
                this._applyColorVars(stylePack.colors);
            }
            
            // 2. 应用尺寸变量
            if (stylePack.dimensions) {
                this._applyVars(stylePack.dimensions);
            }
            
            // 3. 应用字体变量
            if (stylePack.typography) {
                this._applyVars(stylePack.typography);
            }
            
            // 4. 应用动画变量
            if (stylePack.animations) {
                this._applyVars(stylePack.animations);
            }
            
            // 5. 应用形态配置 (设置CSS变量)
            if (stylePack.morphology) {
                this._applyMorphology(stylePack.morphology);
            }
            
            // 5.5 [新增] 应用交互状态配置 (hover/active/focus/disabled)
            if (stylePack.interactiveStates) {
                this._applyInteractiveStates(stylePack.interactiveStates);
            }
            
            // 6. 应用组件覆盖样式
            if (stylePack.overrides) {
                this._applyOverrides(stylePack.overrides);
            } else {
                this._clearOverrides();
            }
            
            // 7. 应用风格特效（将形态配置转换为真正的CSS效果）
            StyleEffects.apply(stylePack);

            // 8. [新增] 应用动态背景配置
            // 获取 UI 核心引用以调用背景更新
            const { window: coreWin } = getCore();
            if (coreWin && coreWin.DND_Dashboard_UI && coreWin.DND_Dashboard_UI.updateDynamicBackground) {
                // 如果 stylePack 中没有 background 字段，使用默认配置
                const bgConfig = stylePack.background || {
                    type: 'particles',
                    colors: ['rgba(255, 219, 133, 0.8)', 'rgba(157, 139, 108, 0.6)', 'rgba(255, 255, 255, 0.5)']
                };
                coreWin.DND_Dashboard_UI.updateDynamicBackground(bgConfig);
            }
            
            // 更新当前风格ID
            this.currentStyleId = styleId;
            
            // 保存到数据库
            if (save) {
                await DBAdapter.setSetting(CONFIG.STORAGE_KEYS.CURRENT_STYLE, styleId);
            }
            
            Logger.info('已应用风格:', stylePack.meta?.name || styleId);
            return true;
        } catch (e) {
            Logger.error('应用风格失败:', e);
            return false;
        }
    },
    
    /**
     * 获取风格配置（内置或自定义）
     */
    getStyle(styleId) {
        // 先检查内置风格
        if (isBuiltinStyle(styleId)) {
            return getStylePreset(styleId);
        }
        // 再检查自定义风格
        if (this.customStyles[styleId]) {
            return this.customStyles[styleId];
        }
        return null;
    },
    
    /**
     * 获取所有可用风格列表
     */
    getAvailableStyles() {
        const builtinList = getStyleList();
        const customList = Object.values(this.customStyles).map(style => ({
            id: style.meta.id,
            name: style.meta.name,
            icon: style.meta.icon || '<i class="fa-solid fa-palette"></i>',
            description: style.meta.description || '',
            author: style.meta.author || '用户',
            isCustom: true
        }));
        
        return [...builtinList, ...customList];
    },
    
    /**
     * 导入自定义风格包
     * @param {Object|string} styleData - 风格包对象或JSON字符串
     * @returns {Object} { success: boolean, message: string, styleId?: string }
     */
    async importStyle(styleData) {
        try {
            // 解析JSON（如果是字符串）
            let stylePack = styleData;
            if (typeof styleData === 'string') {
                try {
                    stylePack = JSON.parse(styleData);
                } catch (e) {
                    return { success: false, message: 'JSON格式无效' };
                }
            }
            
            // 验证风格包
            const validation = StyleValidator.validate(stylePack);
            
            if (!validation.valid) {
                return { 
                    success: false, 
                    message: '验证失败: ' + validation.errors.join('; ')
                };
            }
            
            // 使用净化后的风格包
            const sanitizedPack = validation.sanitized;
            const styleId = sanitizedPack.meta.id;
            
            // 检查是否与内置风格冲突
            if (isBuiltinStyle(styleId)) {
                // 自动添加 -custom 后缀
                sanitizedPack.meta.id = styleId + '-custom';
                sanitizedPack.meta.name = sanitizedPack.meta.name + ' (自定义)';
            }
            
            const finalId = sanitizedPack.meta.id;
            
            // 存储自定义风格
            this.customStyles[finalId] = sanitizedPack;
            await this._saveCustomStyles();
            
            // 返回结果
            const warningMsg = validation.warnings.length > 0 
                ? `\n注意: ${validation.warnings.length}个项目被自动修正`
                : '';
            
            return {
                success: true,
                message: `风格 "${sanitizedPack.meta.name}" 导入成功${warningMsg}`,
                styleId: finalId,
                warnings: validation.warnings
            };
        } catch (e) {
            Logger.error('导入风格失败:', e);
            return { success: false, message: '导入失败: ' + e.message };
        }
    },
    
    /**
     * 导出风格包
     * @param {string} styleId - 风格ID（留空导出当前风格）
     * @returns {string|null} JSON字符串
     */
    exportStyle(styleId) {
        const id = styleId || this.currentStyleId;
        const stylePack = this.getStyle(id);
        
        if (!stylePack) {
            Logger.warn('导出失败：风格不存在', id);
            return null;
        }
        
        return JSON.stringify(stylePack, null, 2);
    },
    
    /**
     * 删除自定义风格
     * @param {string} styleId - 风格ID
     */
    async deleteCustomStyle(styleId) {
        // 不能删除内置风格
        if (isBuiltinStyle(styleId)) {
            return { success: false, message: '不能删除内置风格' };
        }
        
        if (!this.customStyles[styleId]) {
            return { success: false, message: '风格不存在' };
        }
        
        // 如果当前正在使用这个风格，切换到默认
        if (this.currentStyleId === styleId) {
            await this.apply('classic-dnd');
        }
        
        delete this.customStyles[styleId];
        await this._saveCustomStyles();
        
        return { success: true, message: '已删除风格' };
    },
    
    /**
     * 重置为默认风格
     */
    async resetToDefault() {
        await this.apply('classic-dnd', true);
        return { success: true, message: '已重置为默认风格' };
    },
    
    // ==================== 内部方法 ====================
    
    /**
     * 应用颜色变量（包含渐变生成）
     */
    _applyColorVars(colors) {
        const { window: coreWin } = getCore();
        let root;
        try {
            root = coreWin?.document?.documentElement || document.documentElement;
        } catch (e) {
            root = document.documentElement;
        }
        
        if (!root) return;
        
        // 直接应用颜色变量
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        
        // 生成渐变背景（复用ThemeManager的逻辑）
        const panelStart = colors['--dnd-bg-panel-start'] || '#2b1b17';
        const panelEnd = colors['--dnd-bg-panel-end'] || '#1a100e';
        const cardStart = colors['--dnd-bg-card-start'] || '#242424';
        const cardEnd = colors['--dnd-bg-card-end'] || '#1a1a1c';
        
        root.style.setProperty('--dnd-bg-panel', `linear-gradient(to bottom, ${panelStart}, ${panelEnd})`);
        root.style.setProperty('--dnd-bg-hud', `linear-gradient(to bottom, ${panelStart}, ${panelEnd})`);
        // 使用辅助函数确保卡片和弹窗背景高不透明度，避免透明度问题
        root.style.setProperty('--dnd-bg-card', `linear-gradient(135deg, ${ensureOpaqueColor(cardStart, 0.98)} 0%, ${ensureOpaqueColor(cardEnd, 0.98)} 100%)`);
        root.style.setProperty('--dnd-bg-popup', `linear-gradient(to bottom, ${ensureOpaqueColor(cardStart)}, ${ensureOpaqueColor(cardEnd)})`);
    },
    
    /**
     * 应用通用CSS变量
     */
    _applyVars(vars) {
        const { window: coreWin } = getCore();
        let root;
        try {
            root = coreWin?.document?.documentElement || document.documentElement;
        } catch (e) {
            root = document.documentElement;
        }
        
        if (!root) return;
        
        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    },
    
    /**
     * 应用形态配置
     * 将 morphology 配置转换为 CSS 变量和样式
     */
    _applyMorphology(morphology) {
        if (!morphology || typeof morphology !== 'object') return;
        
        const { window: coreWin } = getCore();
        let root;
        try {
            root = coreWin?.document?.documentElement || document.documentElement;
        } catch (e) {
            root = document.documentElement;
        }
        
        if (!root) return;
        
        // 边框形态
        if (morphology.border) {
            const { style, width, outerStyle } = morphology.border;
            if (style) root.style.setProperty('--dnd-border-style', style);
            if (width) root.style.setProperty('--dnd-border-width', width);
            if (outerStyle) root.style.setProperty('--dnd-border-outer-style', outerStyle);
        }
        
        // 角部形态
        if (morphology.corners) {
            const { style, clipPath } = morphology.corners;
            if (clipPath && clipPath !== 'none') {
                root.style.setProperty('--dnd-card-clip-path', clipPath);
            } else {
                root.style.setProperty('--dnd-card-clip-path', 'none');
            }
            // 根据角部样式设置特殊的裁剪路径
            if (style) {
                root.style.setProperty('--dnd-corner-style', style);
            }
        }
        
        // 卡片形态
        if (morphology.card) {
            const { shape, aspectRatio, transform, decoration } = morphology.card;
            if (shape) root.style.setProperty('--dnd-card-shape', shape);
            if (aspectRatio) root.style.setProperty('--dnd-card-aspect-ratio', aspectRatio);
            if (transform && transform !== 'none') {
                root.style.setProperty('--dnd-card-transform', transform);
            }
            if (decoration) root.style.setProperty('--dnd-card-decoration', decoration);
        }
        
        // 装饰元素
        if (morphology.decorations) {
            const { corners, dividers, headers, icons } = morphology.decorations;
            if (corners) root.style.setProperty('--dnd-corner-ornament', corners);
            if (dividers) root.style.setProperty('--dnd-divider-style', dividers);
            if (headers) root.style.setProperty('--dnd-header-decoration', headers);
            if (icons) root.style.setProperty('--dnd-icon-shape', icons);
        }
        
        // 视觉特效
        if (morphology.effects) {
            const { overlay, innerGlow, borderGlow, texture } = morphology.effects;
            if (overlay) root.style.setProperty('--dnd-effect-overlay', this._getOverlayValue(overlay));
            if (innerGlow) root.style.setProperty('--dnd-effect-inner-glow', this._getGlowValue(innerGlow));
            if (borderGlow) root.style.setProperty('--dnd-effect-border-glow', this._getGlowValue(borderGlow));
            if (texture) root.style.setProperty('--dnd-effect-texture', this._getTextureValue(texture));
        }
        
        // 布局密度
        if (morphology.layout) {
            const { density, cardMinWidth, gridGap } = morphology.layout;
            if (density) {
                root.style.setProperty('--dnd-layout-density', density);
                // 根据密度调整间距
                const densityMultiplier = density === 'compact' ? 0.75 : (density === 'spacious' ? 1.25 : 1);
                root.style.setProperty('--dnd-density-multiplier', String(densityMultiplier));
            }
            if (cardMinWidth) root.style.setProperty('--dnd-card-min-width', cardMinWidth);
            if (gridGap) root.style.setProperty('--dnd-grid-gap', gridGap);
        }
        
        Logger.debug('已应用形态配置:', morphology);
    },
    
    /**
     * 应用交互状态配置
     * 处理 hover, active, focus, disabled, selected 等状态的样式变量
     * @param {Object} interactiveStates - 交互状态配置对象
     */
    _applyInteractiveStates(interactiveStates) {
        if (!interactiveStates || typeof interactiveStates !== 'object') return;
        
        const { window: coreWin } = getCore();
        let root;
        try {
            root = coreWin?.document?.documentElement || document.documentElement;
        } catch (e) {
            root = document.documentElement;
        }
        
        if (!root) return;
        
        // 悬浮状态 (Hover)
        if (interactiveStates.hover) {
            const { brightness, scale, lift, shadow, borderColor, glow, transition } = interactiveStates.hover;
            if (brightness) root.style.setProperty('--dnd-hover-brightness', String(brightness));
            if (scale) root.style.setProperty('--dnd-hover-scale', String(scale));
            if (lift) root.style.setProperty('--dnd-hover-lift', lift);
            if (shadow) root.style.setProperty('--dnd-hover-shadow', shadow);
            if (borderColor) root.style.setProperty('--dnd-hover-border-color', borderColor);
            if (glow) root.style.setProperty('--dnd-hover-glow', glow);
            if (transition) root.style.setProperty('--dnd-hover-transition', transition);
        }
        
        // 卡片悬浮
        if (interactiveStates.cardHover) {
            const { transform, shadow, borderColor } = interactiveStates.cardHover;
            if (transform) root.style.setProperty('--dnd-card-hover-transform', transform);
            if (shadow) root.style.setProperty('--dnd-card-hover-shadow', shadow);
            if (borderColor) root.style.setProperty('--dnd-card-hover-border-color', borderColor);
        }
        
        // 按钮悬浮
        if (interactiveStates.buttonHover) {
            const { brightness, transform, shadow } = interactiveStates.buttonHover;
            if (brightness) root.style.setProperty('--dnd-btn-hover-brightness', String(brightness));
            if (transform) root.style.setProperty('--dnd-btn-hover-transform', transform);
            if (shadow) root.style.setProperty('--dnd-btn-hover-shadow', shadow);
        }
        
        // 点击/激活状态 (Active/Pressed)
        if (interactiveStates.active) {
            const { scale, brightness, transform, shadow } = interactiveStates.active;
            if (scale) root.style.setProperty('--dnd-active-scale', String(scale));
            if (brightness) root.style.setProperty('--dnd-active-brightness', String(brightness));
            if (transform) root.style.setProperty('--dnd-active-transform', transform);
            if (shadow) root.style.setProperty('--dnd-active-shadow', shadow);
        }
        
        // 按钮点击
        if (interactiveStates.buttonActive) {
            const { transform, shadow } = interactiveStates.buttonActive;
            if (transform) root.style.setProperty('--dnd-btn-active-transform', transform);
            if (shadow) root.style.setProperty('--dnd-btn-active-shadow', shadow);
        }
        
        // 选中状态 (Selected)
        if (interactiveStates.selected) {
            const { background, borderColor, borderWidth, glow, textColor } = interactiveStates.selected;
            if (background) root.style.setProperty('--dnd-selected-bg', background);
            if (borderColor) root.style.setProperty('--dnd-selected-border-color', borderColor);
            if (borderWidth) root.style.setProperty('--dnd-selected-border-width', borderWidth);
            if (glow) root.style.setProperty('--dnd-selected-glow', glow);
            if (textColor) root.style.setProperty('--dnd-selected-text-color', textColor);
        }
        
        // 导航选中状态
        if (interactiveStates.navActive) {
            const { background, border, indicator } = interactiveStates.navActive;
            if (background) root.style.setProperty('--dnd-nav-active-bg', background);
            if (border) root.style.setProperty('--dnd-nav-active-border', border);
            if (indicator) root.style.setProperty('--dnd-nav-active-indicator', indicator);
        }
        
        // 聚焦状态 (Focus)
        if (interactiveStates.focus) {
            const { borderColor, shadow, outline } = interactiveStates.focus;
            if (borderColor) root.style.setProperty('--dnd-focus-border-color', borderColor);
            if (shadow) root.style.setProperty('--dnd-focus-shadow', shadow);
            if (outline) root.style.setProperty('--dnd-focus-outline', outline);
        }
        
        // 禁用状态 (Disabled)
        if (interactiveStates.disabled) {
            const { opacity, cursor, filter } = interactiveStates.disabled;
            if (opacity) root.style.setProperty('--dnd-disabled-opacity', String(opacity));
            if (cursor) root.style.setProperty('--dnd-disabled-cursor', cursor);
            if (filter) root.style.setProperty('--dnd-disabled-filter', filter);
        }
        
        // 图标悬浮
        if (interactiveStates.iconHover) {
            const { glow, scale } = interactiveStates.iconHover;
            if (glow) root.style.setProperty('--dnd-icon-hover-glow', glow);
            if (scale) root.style.setProperty('--dnd-icon-hover-scale', String(scale));
        }
        
        // 输入框聚焦
        if (interactiveStates.inputFocus) {
            const { border, shadow } = interactiveStates.inputFocus;
            if (border) root.style.setProperty('--dnd-input-focus-border', border);
            if (shadow) root.style.setProperty('--dnd-input-focus-shadow', shadow);
        }
        
        Logger.debug('已应用交互状态配置:', interactiveStates);
    },
    
    /**
     * 获取覆盖层效果值
     */
    _getOverlayValue(overlay) {
        const overlays = {
            'none': 'none',
            'noise': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
            'scanlines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
            'grid': 'linear-gradient(transparent 95%, rgba(0,255,255,0.1) 95%), linear-gradient(90deg, transparent 95%, rgba(0,255,255,0.1) 95%)',
            'hex': 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'40\' viewBox=\'0 0 24 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 40c5.523 0 10-4.477 10-10V10c0-5.523 4.477-10 10-10H0v40z\' fill=\'rgba(255,255,255,0.03)\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            'vignette': 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)',
            'blood-vignette': 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(80,0,0,0.2) 100%)',
            'gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)'
        };
        return overlays[overlay] || 'none';
    },
    
    /**
     * 获取发光效果值
     */
    _getGlowValue(glow) {
        const glows = {
            'none': 'none',
            'subtle': 'inset 0 0 10px rgba(255,255,255,0.05)',
            'medium': 'inset 0 0 20px rgba(255,255,255,0.1)',
            'strong': 'inset 0 0 30px rgba(255,255,255,0.15)',
            'neon': '0 0 5px rgba(0,243,255,0.5), inset 0 0 10px rgba(0,243,255,0.2)',
            'gold': 'inset 0 0 15px rgba(255,215,0,0.1), 0 0 5px rgba(255,215,0,0.2)',
            'evil': 'inset 0 0 20px rgba(138,0,0,0.2), 0 0 10px rgba(138,0,0,0.3)',
            'pulse': 'inset 0 0 20px rgba(255,255,255,0.1)' // pulse需要动画配合
        };
        return glows[glow] || 'none';
    },
    
    /**
     * 获取纹理效果值
     */
    _getTextureValue(texture) {
        const textures = {
            'none': 'none',
            'paper': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'paper\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.04\' numOctaves=\'5\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23paper)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
            'metal': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
            'wood': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'wood\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.15\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23wood)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
            'stone': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'stone\'%3E%3CfeTurbulence type=\'turbulence\' baseFrequency=\'0.05\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23stone)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
            'fabric': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\'%3E%3Crect width=\'5\' height=\'5\' fill=\'rgba(0,0,0,0.02)\'/%3E%3Crect x=\'5\' y=\'5\' width=\'5\' height=\'5\' fill=\'rgba(0,0,0,0.02)\'/%3E%3C/svg%3E")',
            'circuit': 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 10h80v80h-80z\' fill=\'none\' stroke=\'rgba(0,255,255,0.05)\' stroke-width=\'1\'/%3E%3Cpath d=\'M20 20l20 20h20l20-20\' fill=\'none\' stroke=\'rgba(0,255,255,0.05)\' stroke-width=\'1\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'5\' fill=\'rgba(0,255,255,0.05)\'/%3E%3C/svg%3E")',
            'scales': 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10 4.477 0 10 0z\' fill=\'none\' stroke=\'rgba(0,0,0,0.2)\' stroke-width=\'1\'/%3E%3C/svg%3E")',
            'stars': 'radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ddd, rgba(0,0,0,0))'
        };
        return textures[texture] || 'none';
    },
    
    /**
     * 应用组件覆盖样式
     */
    _applyOverrides(overrides) {
        const { $, window: coreWin } = getCore();
        const doc = coreWin?.document || document;
        
        // 移除旧的覆盖样式
        this._clearOverrides();
        
        if (!overrides || Object.keys(overrides).length === 0) return;
        
        // 构建CSS文本
        let cssText = '';
        Object.entries(overrides).forEach(([selector, styles]) => {
            if (!styles || typeof styles !== 'object') return;
            
            const styleStr = Object.entries(styles)
                .map(([prop, value]) => `${prop}: ${value} !important`)
                .join('; ');
            
            if (styleStr) {
                cssText += `${selector} { ${styleStr}; }\n`;
            }
        });
        
        if (cssText) {
            // 创建并注入样式元素
            const styleEl = doc.createElement('style');
            styleEl.id = this.STYLE_ELEMENT_ID;
            styleEl.textContent = cssText;
            doc.head.appendChild(styleEl);
            
            Logger.debug('已注入覆盖样式:', cssText.length, 'bytes');
        }
    },
    
    /**
     * 清除覆盖样式
     */
    _clearOverrides() {
        const { $, window: coreWin } = getCore();
        const doc = coreWin?.document || document;
        
        const existingStyle = doc.getElementById(this.STYLE_ELEMENT_ID);
        if (existingStyle) {
            existingStyle.remove();
        }
    },
    
    /**
     * 保存自定义风格到数据库
     */
    async _saveCustomStyles() {
        try {
            await DBAdapter.setSetting(
                CONFIG.STORAGE_KEYS.CUSTOM_STYLES, 
                JSON.stringify(this.customStyles)
            );
        } catch (e) {
            Logger.error('保存自定义风格失败:', e);
        }
    },
    
    // ==================== 工具方法 ====================
    
    /**
     * 获取当前风格信息
     */
    getCurrentStyle() {
        return {
            id: this.currentStyleId,
            ...(this.getStyle(this.currentStyleId)?.meta || {})
        };
    },
    
    /**
     * 检查指定风格是否为当前风格
     */
    isCurrentStyle(styleId) {
        return this.currentStyleId === styleId;
    },
    
    /**
     * 创建风格预览（不实际应用）
     * 返回一个可以撤销的函数
     */
    previewStyle(styleId) {
        const originalStyleId = this.currentStyleId;
        this.apply(styleId, false);
        
        // 返回撤销函数
        return () => {
            this.apply(originalStyleId, false);
        };
    },
    
    /**
     * 下载风格包为JSON文件
     */
    downloadStyle(styleId) {
        const json = this.exportStyle(styleId);
        if (!json) return false;
        
        const style = this.getStyle(styleId);
        const filename = `dnd-style-${style?.meta?.id || 'export'}.json`;
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    },
    
    /**
     * 从文件导入风格（供UI调用）
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const result = await this.importStyle(e.target.result);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
};
