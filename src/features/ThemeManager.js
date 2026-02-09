// src/features/ThemeManager.js
import { DBAdapter } from '../core/DBAdapter.js';
import { Logger } from '../core/Logger.js';
import { safeSave, getCore } from '../core/Utils.js';
import { CONFIG } from '../config/Config.js';

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

export const ThemeManager = {
    currentTheme: 'dark',
    customTheme: null,  // 存储自定义配色
    
    // 定义可自定义的配色变量及其默认值和描述
    COLOR_VARS: {
        '--dnd-bg-main': { label: '主背景', type: 'color', default: '#0f0b0a' },
        '--dnd-bg-panel-start': { label: '面板背景(上)', type: 'color', default: '#2b1b17' },
        '--dnd-bg-panel-end': { label: '面板背景(下)', type: 'color', default: '#1a100e' },
        '--dnd-bg-card-start': { label: '卡片背景(亮)', type: 'color', default: '#242424' },
        '--dnd-bg-card-end': { label: '卡片背景(暗)', type: 'color', default: '#1a1a1c' },
        '--dnd-border-gold': { label: '主边框', type: 'color', default: '#9d8b6c' },
        '--dnd-border-inner': { label: '内边框', type: 'color', default: '#5c4b35' },
        '--dnd-text-main': { label: '主文本', type: 'color', default: '#dcd0c0' },
        '--dnd-text-header': { label: '标题文本', type: 'color', default: '#e6dcca' },
        '--dnd-text-highlight': { label: '高亮文本', type: 'color', default: '#ffdb85' },
        '--dnd-text-dim': { label: '次要文本', type: 'color', default: '#888888' },
        '--dnd-accent-red': { label: '红色强调', type: 'color', default: '#8a2c2c' },
        '--dnd-accent-green': { label: '绿色强调', type: 'color', default: '#3a6b4a' },
        '--dnd-accent-blue': { label: '蓝色强调', type: 'color', default: '#2c4c8a' }
    },
    
    init: async () => {
        // 加载自定义主题
        try {
            const savedCustom = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.CUSTOM_THEME);
            if (savedCustom) {
                ThemeManager.customTheme = JSON.parse(savedCustom);
            }
        } catch(e) {
            Logger.error('Failed to load custom theme:', e);
        }
        
        // 应用保存的主题
        const saved = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.THEME);
        if (saved === 'custom' && ThemeManager.customTheme) {
            ThemeManager.applyCustom(ThemeManager.customTheme);
        } else if (saved && CONFIG.THEMES[saved]) {
            ThemeManager.apply(saved);
        }
    },
    
    apply: (themeId) => {
        const theme = CONFIG.THEMES[themeId];
        if (!theme) return;
        
        ThemeManager.currentTheme = themeId;
        safeSave(CONFIG.STORAGE_KEYS.THEME, themeId);
        
        ThemeManager._applyVars(theme.vars);
        
        Logger.info('主题已切换:', theme.name);
    },
    
    // 应用自定义配色
    applyCustom: (customVars) => {
        if (!customVars || typeof customVars !== 'object') return;
        
        ThemeManager.currentTheme = 'custom';
        ThemeManager.customTheme = customVars;
        safeSave(CONFIG.STORAGE_KEYS.THEME, 'custom');
        
        // 基于当前预设主题，覆盖自定义颜色
        const baseTheme = CONFIG.THEMES.dark;
        const mergedVars = { ...baseTheme.vars };
        
        // 覆盖简单颜色变量
        Object.keys(customVars).forEach(key => {
            if (ThemeManager.COLOR_VARS[key]) {
                mergedVars[key] = customVars[key];
            }
        });
        
        // 根据背景颜色变量动态生成渐变值
        const panelStart = customVars['--dnd-bg-panel-start'] || ThemeManager.COLOR_VARS['--dnd-bg-panel-start'].default;
        const panelEnd = customVars['--dnd-bg-panel-end'] || ThemeManager.COLOR_VARS['--dnd-bg-panel-end'].default;
        const cardStart = customVars['--dnd-bg-card-start'] || ThemeManager.COLOR_VARS['--dnd-bg-card-start'].default;
        const cardEnd = customVars['--dnd-bg-card-end'] || ThemeManager.COLOR_VARS['--dnd-bg-card-end'].default;
        
        // 生成渐变背景
        mergedVars['--dnd-bg-panel'] = `linear-gradient(to bottom, ${panelStart}, ${panelEnd})`;
        mergedVars['--dnd-bg-hud'] = `linear-gradient(to bottom, ${panelStart}, ${panelEnd})`;
        // 使用辅助函数确保卡片和弹窗背景高不透明度，避免透明度问题
        mergedVars['--dnd-bg-card'] = `linear-gradient(135deg, ${ensureOpaqueColor(cardStart, 0.98)} 0%, ${ensureOpaqueColor(cardEnd, 0.98)} 100%)`;
        mergedVars['--dnd-bg-popup'] = `linear-gradient(to bottom, ${ensureOpaqueColor(cardStart)}, ${ensureOpaqueColor(cardEnd)})`;
        
        ThemeManager._applyVars(mergedVars);
        
        Logger.info('自定义配色已应用');
    },
    
    // 保存自定义配色
    saveCustom: async (customVars) => {
        ThemeManager.customTheme = customVars;
        await DBAdapter.setSetting(CONFIG.STORAGE_KEYS.CUSTOM_THEME, JSON.stringify(customVars));
        Logger.info('自定义配色已保存');
    },
    
    // 获取当前使用的配色变量
    getCurrentVars: () => {
        if (ThemeManager.currentTheme === 'custom' && ThemeManager.customTheme) {
            const baseVars = { ...CONFIG.THEMES.dark.vars };
            return { ...baseVars, ...ThemeManager.customTheme };
        }
        const theme = CONFIG.THEMES[ThemeManager.currentTheme];
        return theme ? { ...theme.vars } : { ...CONFIG.THEMES.dark.vars };
    },
    
    // 获取可编辑的颜色变量列表
    getEditableVars: () => {
        const currentVars = ThemeManager.getCurrentVars();
        const result = {};
        Object.keys(ThemeManager.COLOR_VARS).forEach(key => {
            result[key] = {
                ...ThemeManager.COLOR_VARS[key],
                value: currentVars[key] || ThemeManager.COLOR_VARS[key].default
            };
        });
        return result;
    },
    
    // 内部方法：应用 CSS 变量
    _applyVars: (vars) => {
        try {
            const { window: coreWin } = getCore();
            let root;
            try {
                root = coreWin.document.documentElement;
            } catch(e) {
                root = document.documentElement;
            }

            if (root) {
                Object.keys(vars).forEach(key => {
                    root.style.setProperty(key, vars[key]);
                });
            }
        } catch (e) {
            Logger.error('Failed to apply theme styles:', e);
        }
    },
    
    getList: () => {
        const list = Object.keys(CONFIG.THEMES).map(id => ({ id, ...CONFIG.THEMES[id] }));
        // 如果有自定义配色，添加到列表
        if (ThemeManager.customTheme) {
            list.push({ id: 'custom', name: '自定义配色', icon: '🎨' });
        }
        return list;
    }
};
