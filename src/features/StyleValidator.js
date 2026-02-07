// src/features/StyleValidator.js
import { Logger } from '../core/Logger.js';

/**
 * 样式验证器 - 确保导入的风格包安全可用
 */
export const StyleValidator = {
    // 允许的CSS属性白名单
    ALLOWED_PROPERTIES: [
        // 颜色相关
        'color', 'background', 'background-color', 'background-image', 'background-gradient',
        // 边框相关
        'border', 'border-color', 'border-width', 'border-style', 'border-radius',
        'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
        'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
        'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
        // 间距相关
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'gap', 'row-gap', 'column-gap',
        // 字体相关
        'font-size', 'font-weight', 'font-family', 'font-style',
        'line-height', 'letter-spacing', 'text-align', 'text-transform', 'text-decoration',
        // 阴影相关
        'box-shadow', 'text-shadow',
        // 透明度与过渡
        'opacity', 'transition', 'transform',
        // 尺寸相关（有限制）
        'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
        // 滤镜
        'filter', 'backdrop-filter'
    ],

    // 禁止的CSS属性（安全考虑）
    FORBIDDEN_PROPERTIES: [
        'position', 'top', 'left', 'right', 'bottom', 'z-index',
        'display', 'visibility', 'overflow', 'overflow-x', 'overflow-y',
        'content', 'cursor', 'pointer-events',
        'animation', 'animation-name', // 动画由系统控制
        'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', // 布局由系统控制
        'grid', 'grid-template-columns', 'grid-template-rows'
    ],

    // 允许的CSS类名模式（正则）
    ALLOWED_CLASS_PATTERNS: [
        /^\.dnd-char-card$/,
        /^\.dnd-card-/,
        /^\.dnd-nav-item/,
        /^\.dnd-btn/,
        /^\.dnd-dice-btn/,
        /^\.dnd-action-btn/,
        /^\.dnd-bar-/,
        /^\.dnd-micro-bar/,
        /^\.dnd-tag/,
        /^\.dnd-badge/,
        /^\.dnd-dialog-/,
        /^\.dnd-modal-/,
        /^\.dnd-toast-/,
        /^\.dnd-hud-/,
        /^\.dnd-mini-/,
        /^\.dnd-tm-/,
        /^\.dnd-inv-/,
        /^\.dnd-detail-/,
        /^\.dnd-attr-/,
        /^\.dnd-stat-/,
        /^\.dnd-quick-/,
        /^\.dnd-res-/,
        /^\.dnd-party-/,
        /^\.dnd-spell-/,
        /^\.dnd-item-/,
        /^\.dnd-quest-/,
        /^\.dnd-faction-/,
        /^\.dnd-top-bar/,
        /^\.dnd-close-btn/,
        /^\.dnd-title/,
        /^\.dnd-logo/,
        /^\.dnd-location/,
        /^\.dnd-content-area/,
        /^\.dnd-grid/,
        /^\.dnd-popup/,
        /^\.dnd-md-/,
        /^\.dnd-clickable/,
        /^\.dnd-hover-/,
        /^\.dnd-avatar/
    ],

    // 允许的CSS变量名模式
    ALLOWED_VAR_PATTERNS: [
        /^--dnd-bg-/,
        /^--dnd-border-/,
        /^--dnd-text-/,
        /^--dnd-accent-/,
        /^--dnd-shadow/,
        /^--dnd-font-/,
        /^--dnd-spacing-/,
        /^--dnd-radius-/,
        /^--dnd-transition-/
    ],

    // 值验证正则
    VALUE_VALIDATORS: {
        color: /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\(--dnd-[a-z-]+\)|transparent|inherit|currentColor)$/i,
        dimension: /^(-?\d+(\.\d+)?(px|em|rem|%|vh|vw|vmin|vmax)|0|auto|var\(--dnd-[a-z-]+\))$/i,
        time: /^(\d+(\.\d+)?(s|ms)|var\(--dnd-[a-z-]+\))$/i,
        fontWeight: /^(normal|bold|bolder|lighter|[1-9]00|var\(--dnd-[a-z-]+\))$/i,
        fontFamily: /^[a-zA-Z\s,'"()-]+$/,
        gradient: /^linear-gradient\([^)]+\)$|^radial-gradient\([^)]+\)$|^var\(--dnd-[a-z-]+\)$/i
    },

    // 危险值模式（禁止）
    DANGEROUS_PATTERNS: [
        /javascript:/i,
        /expression\s*\(/i,
        /url\s*\(\s*["']?data:/i, // 允许普通url，但禁止data: url注入
        /<script/i,
        /on\w+\s*=/i, // onclick等事件
        /\beval\b/i,
        /\bFunction\b/i
    ],

    /**
     * 验证完整的风格包
     * @param {Object} stylePack - 风格包对象
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[], sanitized: Object }
     */
    validate(stylePack) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            sanitized: null
        };

        try {
            // 1. 基础结构验证
            if (!stylePack || typeof stylePack !== 'object') {
                result.valid = false;
                result.errors.push('风格包必须是一个有效的JSON对象');
                return result;
            }

            // 2. 元数据验证
            const metaValidation = this._validateMeta(stylePack.meta);
            if (!metaValidation.valid) {
                result.valid = false;
                result.errors.push(...metaValidation.errors);
                return result;
            }

            // 3. 开始构建净化后的风格包
            const sanitized = {
                meta: this._sanitizeMeta(stylePack.meta),
                colors: {},
                dimensions: {},
                typography: {},
                animations: {},
                components: {},
                morphology: {},  // 新增形态配置
                overrides: {}
            };

            // 4. 验证并净化 colors
            if (stylePack.colors) {
                const colorResult = this._validateAndSanitizeVars(stylePack.colors, 'color');
                sanitized.colors = colorResult.sanitized;
                result.warnings.push(...colorResult.warnings);
            }

            // 5. 验证并净化 dimensions
            if (stylePack.dimensions) {
                const dimResult = this._validateAndSanitizeVars(stylePack.dimensions, 'dimension');
                sanitized.dimensions = dimResult.sanitized;
                result.warnings.push(...dimResult.warnings);
            }

            // 6. 验证并净化 typography
            if (stylePack.typography) {
                const typoResult = this._validateAndSanitizeVars(stylePack.typography, 'typography');
                sanitized.typography = typoResult.sanitized;
                result.warnings.push(...typoResult.warnings);
            }

            // 7. 验证并净化 animations
            if (stylePack.animations) {
                const animResult = this._validateAndSanitizeVars(stylePack.animations, 'time');
                sanitized.animations = animResult.sanitized;
                result.warnings.push(...animResult.warnings);
            }

            // 8. 验证并净化 components
            if (stylePack.components) {
                const compResult = this._validateComponents(stylePack.components);
                sanitized.components = compResult.sanitized;
                result.warnings.push(...compResult.warnings);
            }

            // 9. 验证并净化 morphology (形态配置)
            if (stylePack.morphology) {
                const morphResult = this._validateMorphology(stylePack.morphology);
                sanitized.morphology = morphResult.sanitized;
                result.warnings.push(...morphResult.warnings);
            }

            // 10. 验证并净化 overrides (最关键的安全检查)
            if (stylePack.overrides) {
                const overrideResult = this._validateAndSanitizeOverrides(stylePack.overrides);
                sanitized.overrides = overrideResult.sanitized;
                result.warnings.push(...overrideResult.warnings);
                if (overrideResult.errors.length > 0) {
                    result.errors.push(...overrideResult.errors);
                }
            }

            // 11. 验证 customCSS (新增)
            if (stylePack.customCSS) {
                // 仅允许基础CSS内容，禁止危险代码
                if (this._containsDangerous(stylePack.customCSS)) {
                    result.warnings.push('customCSS 包含危险内容被忽略');
                } else {
                    // 简单的长度限制
                    if (stylePack.customCSS.length > 10000) {
                        result.warnings.push('customCSS 超过长度限制 (10000字符)');
                        sanitized.customCSS = stylePack.customCSS.substring(0, 10000);
                    } else {
                        sanitized.customCSS = stylePack.customCSS;
                    }
                }
            }

            result.sanitized = sanitized;
            Logger.info('风格包验证完成', { 
                warnings: result.warnings.length, 
                errors: result.errors.length 
            });

        } catch (e) {
            result.valid = false;
            result.errors.push(`验证过程出错: ${e.message}`);
            Logger.error('StyleValidator.validate error:', e);
        }

        return result;
    },

    /**
     * 验证元数据
     */
    _validateMeta(meta) {
        const result = { valid: true, errors: [] };

        if (!meta) {
            result.valid = false;
            result.errors.push('缺少 meta 元数据');
            return result;
        }

        if (!meta.id || typeof meta.id !== 'string') {
            result.valid = false;
            result.errors.push('meta.id 必须是非空字符串');
        } else if (!/^[a-z0-9-]+$/.test(meta.id)) {
            result.valid = false;
            result.errors.push('meta.id 只能包含小写字母、数字和连字符');
        }

        if (!meta.name || typeof meta.name !== 'string') {
            result.valid = false;
            result.errors.push('meta.name 必须是非空字符串');
        }

        return result;
    },

    /**
     * 净化元数据
     */
    _sanitizeMeta(meta) {
        return {
            id: String(meta.id || '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            name: String(meta.name || '未命名风格').substring(0, 50),
            version: String(meta.version || '1.0.0').substring(0, 20),
            author: String(meta.author || '').substring(0, 100),
            description: String(meta.description || '').substring(0, 500),
            icon: this._sanitizeEmoji(meta.icon) || '🎨',
            preview: this._sanitizePreview(meta.preview)
        };
    },

    /**
     * 净化emoji图标
     */
    _sanitizeEmoji(emoji) {
        if (!emoji) return null;
        // 只保留第一个emoji字符（最多4个Unicode码点）
        const emojiMatch = String(emoji).match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
        return emojiMatch ? emojiMatch[0] : null;
    },

    /**
     * 净化预览图
     */
    _sanitizePreview(preview) {
        if (!preview) return null;
        // 只允许base64格式的图片数据
        if (typeof preview === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(preview)) {
            // 限制大小（约100KB base64）
            if (preview.length <= 140000) {
                return preview;
            }
        }
        return null;
    },

    /**
     * 验证并净化CSS变量
     */
    _validateAndSanitizeVars(vars, type) {
        const result = { sanitized: {}, warnings: [] };

        if (!vars || typeof vars !== 'object') return result;

        for (const [key, value] of Object.entries(vars)) {
            // 检查变量名是否合法
            if (!this._isAllowedVarName(key)) {
                result.warnings.push(`跳过不允许的变量: ${key}`);
                continue;
            }

            // 检查值是否安全
            const sanitizedValue = this._sanitizeValue(value, type);
            if (sanitizedValue !== null) {
                result.sanitized[key] = sanitizedValue;
            } else {
                result.warnings.push(`变量值无效被移除: ${key}`);
            }
        }

        return result;
    },

    /**
     * 检查变量名是否在白名单中
     */
    _isAllowedVarName(varName) {
        return this.ALLOWED_VAR_PATTERNS.some(pattern => pattern.test(varName));
    },

    /**
     * 净化CSS值
     */
    _sanitizeValue(value, type) {
        if (typeof value !== 'string') {
            value = String(value);
        }

        // 检查危险模式
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(value)) {
                Logger.warn('检测到危险CSS值:', value);
                return null;
            }
        }

        // 根据类型验证
        switch (type) {
            case 'color':
                // 允许颜色值或渐变
                if (this.VALUE_VALIDATORS.color.test(value) || 
                    this.VALUE_VALIDATORS.gradient.test(value)) {
                    return value;
                }
                break;
            case 'dimension':
                if (this.VALUE_VALIDATORS.dimension.test(value)) {
                    return value;
                }
                break;
            case 'time':
                if (this.VALUE_VALIDATORS.time.test(value)) {
                    return value;
                }
                break;
            case 'typography':
                // 字体相关可以是尺寸、字重或字体族
                if (this.VALUE_VALIDATORS.dimension.test(value) ||
                    this.VALUE_VALIDATORS.fontWeight.test(value) ||
                    this.VALUE_VALIDATORS.fontFamily.test(value)) {
                    return value;
                }
                break;
            default:
                // 通用验证：长度限制 + 危险模式检查（已在上面完成）
                if (value.length <= 200) {
                    return value;
                }
        }

        return null;
    },

    /**
     * 验证组件配置
     */
    _validateComponents(components) {
        const result = { sanitized: {}, warnings: [] };

        if (!components || typeof components !== 'object') return result;

        const allowedComponents = ['card', 'button', 'navbar', 'progress', 'dialog', 'toast', 'hud', 'avatar'];
        const allowedProps = ['borderWidth', 'borderStyle', 'borderRadius', 'hoverEffect', 'textTransform', 
                              'itemSpacing', 'activeIndicator', 'height', 'shadow'];

        for (const [compName, compConfig] of Object.entries(components)) {
            if (!allowedComponents.includes(compName)) {
                result.warnings.push(`跳过未知组件: ${compName}`);
                continue;
            }

            if (!compConfig || typeof compConfig !== 'object') continue;

            const sanitizedComp = {};
            for (const [propName, propValue] of Object.entries(compConfig)) {
                if (!allowedProps.includes(propName)) {
                    result.warnings.push(`组件 ${compName} 跳过未知属性: ${propName}`);
                    continue;
                }
                // 简单值净化
                const sanitized = this._sanitizeValue(String(propValue), 'general');
                if (sanitized) {
                    sanitizedComp[propName] = sanitized;
                }
            }

            if (Object.keys(sanitizedComp).length > 0) {
                result.sanitized[compName] = sanitizedComp;
            }
        }

        return result;
    },

    /**
     * 验证形态配置
     */
    _validateMorphology(morphology) {
        const result = { sanitized: {}, warnings: [] };

        if (!morphology || typeof morphology !== 'object') return result;

        // 允许的形态配置键和值
        const allowedMorphology = {
            border: {
                style: ['solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'dashed', 'dotted', 'none'],
                width: 'dimension',
                outerStyle: ['solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'dashed', 'dotted', 'none']
            },
            corners: {
                style: ['rounded', 'chamfer', 'notched', 'angular', 'organic', 'shield', 'hexagon'],
                clipPath: 'clipPath'
            },
            card: {
                shape: ['rectangle', 'portrait', 'landscape', 'square', 'hexagon', 'shield'],
                aspectRatio: 'general',
                transform: 'transform',
                decoration: ['none', 'ornate', 'simple', 'tech', 'medieval', 'gothic', 'sketchy', 'pixel', 'neumorphic', 'ink-wash', 'neon', 'minimal', 'card3d']
            },
            decorations: {
                corners: ['none', 'flourish', 'tech-bracket', 'rune', 'simple-dot'],
                dividers: ['solid', 'dashed', 'dotted', 'double', 'ornate', 'tech', 'none', 'gradient'],
                headers: ['none', 'underline', 'banner', 'ribbon', 'tech-bar'],
                icons: ['circle', 'square', 'rounded', 'hexagon', 'diamond', 'shield', 'octagon']
            },
            effects: {
                overlay: ['none', 'noise', 'scanlines', 'vignette', 'gradient'],
                innerGlow: ['none', 'subtle', 'medium', 'strong'],
                borderGlow: ['none', 'subtle', 'pulse', 'strong'],
                texture: ['none', 'paper', 'metal', 'wood', 'fabric', 'stone'],
                animation: ['none', 'float', 'shimmer', 'glow-breathe']
            },
            layout: {
                density: ['compact', 'normal', 'spacious'],
                cardMinWidth: 'dimension',
                gridGap: 'dimension'
            },
            // 新增：按钮变体配置
            buttons: {
                shape: ['rounded', 'pill', 'angular', 'hexagon'],
                style: ['filled', 'outline', 'ghost', 'neon', '3d']
            },
            // 新增：进度条变体配置
            progressBars: {
                shape: ['rounded', 'angular', 'pointed'],
                style: ['solid', 'striped', 'animated', 'glow'],
                segments: 'number'
            }
        };

        // 遍历验证每个形态类别
        for (const [category, config] of Object.entries(morphology)) {
            if (!allowedMorphology[category]) {
                result.warnings.push(`跳过未知形态类别: ${category}`);
                continue;
            }

            if (!config || typeof config !== 'object') continue;

            const sanitizedCategory = {};
            const categoryDef = allowedMorphology[category];

            for (const [prop, value] of Object.entries(config)) {
                if (!categoryDef[prop]) {
                    result.warnings.push(`形态 ${category} 跳过未知属性: ${prop}`);
                    continue;
                }

                const propDef = categoryDef[prop];
                let sanitizedValue = null;

                if (Array.isArray(propDef)) {
                    // 枚举值验证
                    if (propDef.includes(value)) {
                        sanitizedValue = value;
                    } else {
                        result.warnings.push(`形态 ${category}.${prop} 值 "${value}" 不在允许列表中`);
                    }
                } else if (propDef === 'dimension') {
                    // 尺寸值验证
                    sanitizedValue = this._sanitizeValue(String(value), 'dimension');
                } else if (propDef === 'clipPath') {
                    // clip-path 验证（需要特殊处理）
                    sanitizedValue = this._sanitizeClipPath(value);
                } else if (propDef === 'transform') {
                    // transform 验证
                    sanitizedValue = this._sanitizeTransform(value);
                } else if (propDef === 'number') {
                    // 数字值验证
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num >= 0 && num <= 100) {
                        sanitizedValue = num;
                    }
                } else {
                    // 通用值验证
                    sanitizedValue = this._sanitizeValue(String(value), 'general');
                }

                if (sanitizedValue !== null) {
                    sanitizedCategory[prop] = sanitizedValue;
                }
            }

            if (Object.keys(sanitizedCategory).length > 0) {
                result.sanitized[category] = sanitizedCategory;
            }
        }

        return result;
    },

    /**
     * 净化 clip-path 值
     */
    _sanitizeClipPath(value) {
        if (!value || value === 'none') return 'none';
        
        const strValue = String(value);
        
        // 检查危险模式
        if (this._containsDangerous(strValue)) return null;
        
        // 只允许 polygon, circle, ellipse, inset, path 函数
        const allowedFunctions = /^(polygon|circle|ellipse|inset|path)\s*\([^)]+\)$/i;
        if (allowedFunctions.test(strValue)) {
            return strValue;
        }
        
        return null;
    },

    /**
     * 净化 transform 值
     */
    _sanitizeTransform(value) {
        if (!value || value === 'none') return 'none';
        
        const strValue = String(value);
        
        // 检查危险模式
        if (this._containsDangerous(strValue)) return null;
        
        // 只允许安全的 transform 函数
        const allowedTransforms = /^(rotate|scale|translate|skew|matrix|perspective)\s*\([^)]+\)(\s+(rotate|scale|translate|skew|matrix|perspective)\s*\([^)]+\))*$/i;
        if (allowedTransforms.test(strValue)) {
            return strValue;
        }
        
        // 允许简单的角度值
        if (/^-?\d+(\.\d+)?(deg|rad|turn)$/.test(strValue)) {
            return strValue;
        }
        
        return null;
    },

    /**
     * 验证并净化CSS覆盖（最严格的检查）
     */
    _validateAndSanitizeOverrides(overrides) {
        const result = { sanitized: {}, warnings: [], errors: [] };

        if (!overrides || typeof overrides !== 'object') return result;

        for (const [selector, styles] of Object.entries(overrides)) {
            // 1. 检查选择器是否在白名单中
            if (!this._isAllowedSelector(selector)) {
                result.warnings.push(`跳过不允许的选择器: ${selector}`);
                continue;
            }

            if (!styles || typeof styles !== 'object') continue;

            const sanitizedStyles = {};
            for (const [prop, value] of Object.entries(styles)) {
                // 2. 检查属性是否在白名单中
                const normalizedProp = this._normalizePropName(prop);
                
                if (this.FORBIDDEN_PROPERTIES.includes(normalizedProp)) {
                    result.warnings.push(`选择器 ${selector} 移除禁止属性: ${prop}`);
                    continue;
                }

                if (!this.ALLOWED_PROPERTIES.includes(normalizedProp)) {
                    result.warnings.push(`选择器 ${selector} 跳过未知属性: ${prop}`);
                    continue;
                }

                // 3. 净化值
                const sanitizedValue = this._sanitizeOverrideValue(value, normalizedProp);
                if (sanitizedValue !== null) {
                    sanitizedStyles[prop] = sanitizedValue;
                } else {
                    result.warnings.push(`选择器 ${selector} 属性 ${prop} 值无效`);
                }
            }

            if (Object.keys(sanitizedStyles).length > 0) {
                result.sanitized[selector] = sanitizedStyles;
            }
        }

        return result;
    },

    /**
     * 检查选择器是否在白名单中
     */
    _isAllowedSelector(selector) {
        // 支持基础选择器和伪类/伪元素
        const baseSelector = selector.split(/:|::|\.(?=[a-z])/)[0] + (selector.match(/^\.[a-z-]+/)?.[0] || '');
        
        return this.ALLOWED_CLASS_PATTERNS.some(pattern => {
            // 对于带伪类的选择器，只检查基础部分
            if (selector.includes(':')) {
                const base = selector.split(':')[0];
                return pattern.test(base);
            }
            return pattern.test(selector);
        });
    },

    /**
     * 标准化属性名（camelCase -> kebab-case）
     */
    _normalizePropName(prop) {
        return prop.replace(/([A-Z])/g, '-$1').toLowerCase();
    },

    /**
     * 净化覆盖值
     */
    _sanitizeOverrideValue(value, propName) {
        if (typeof value !== 'string') {
            value = String(value);
        }

        // 检查危险模式
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(value)) {
                return null;
            }
        }

        // 根据属性类型验证
        if (propName.includes('color') || propName === 'background' || propName.includes('shadow')) {
            // 颜色相关允许颜色、渐变、var()
            if (this.VALUE_VALIDATORS.color.test(value) || 
                this.VALUE_VALIDATORS.gradient.test(value) ||
                /^var\(--dnd-[a-z-]+\)$/.test(value) ||
                /^none$/.test(value)) {
                return value;
            }
        } else if (propName.includes('radius') || propName.includes('width') || 
                   propName.includes('height') || propName.includes('padding') ||
                   propName.includes('margin') || propName.includes('gap') ||
                   propName.includes('size')) {
            // 尺寸相关
            if (this.VALUE_VALIDATORS.dimension.test(value)) {
                return value;
            }
        } else if (propName.includes('font-weight')) {
            if (this.VALUE_VALIDATORS.fontWeight.test(value)) {
                return value;
            }
        } else if (propName.includes('font-family')) {
            if (this.VALUE_VALIDATORS.fontFamily.test(value)) {
                return value;
            }
        } else if (propName.includes('transition')) {
            // 过渡允许时间值
            if (this.VALUE_VALIDATORS.time.test(value) || /^[\w\s,-]+$/.test(value)) {
                return value;
            }
        } else if (propName.includes('border-style')) {
            if (/^(none|solid|dashed|dotted|double|groove|ridge|inset|outset)$/.test(value)) {
                return value;
            }
        } else if (propName === 'opacity') {
            const num = parseFloat(value);
            if (!isNaN(num) && num >= 0 && num <= 1) {
                return value;
            }
        } else if (propName === 'transform') {
            // 只允许安全的transform函数
            if (/^(scale|translate|rotate|skew)\([^)]+\)(\s+(scale|translate|rotate|skew)\([^)]+\))*$/.test(value) ||
                value === 'none') {
                return value;
            }
        } else if (propName === 'filter' || propName === 'backdrop-filter') {
            // 只允许安全的滤镜函数
            if (/^(blur|brightness|contrast|grayscale|saturate|sepia|drop-shadow)\([^)]+\)(\s+(blur|brightness|contrast|grayscale|saturate|sepia|drop-shadow)\([^)]+\))*$/.test(value) ||
                value === 'none') {
                return value;
            }
        } else {
            // 其他属性：基础验证
            if (value.length <= 200 && !/[<>{}]/.test(value)) {
                return value;
            }
        }

        return null;
    },

    /**
     * 检查值是否包含危险模式
     */
    _containsDangerous(value) {
        if (!value) return false;
        const strValue = String(value);
        
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(strValue)) {
                return true;
            }
        }
        
        return false;
    },

    /**
     * 快速验证（仅检查结构，不净化）
     */
    quickValidate(stylePack) {
        if (!stylePack || typeof stylePack !== 'object') return false;
        if (!stylePack.meta || !stylePack.meta.id || !stylePack.meta.name) return false;
        return true;
    }
};
