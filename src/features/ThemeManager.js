// src/features/ThemeManager.js
import { DBAdapter } from '../core/DBAdapter.js';
import { Logger } from '../core/Logger.js';
import { safeSave, getCore } from '../core/Utils.js';
import { CONFIG } from '../config/Config.js';

export const ThemeManager = {
    currentTheme: 'dark',
    
    init: () => {
        DBAdapter.getSetting(CONFIG.STORAGE_KEYS.THEME).then(saved => {
            if (saved && CONFIG.THEMES[saved]) {
                ThemeManager.apply(saved);
            }
        });
    },
    
    apply: (themeId) => {
        const theme = CONFIG.THEMES[themeId];
        if (!theme) return;
        
        ThemeManager.currentTheme = themeId;
        safeSave(CONFIG.STORAGE_KEYS.THEME, themeId);
        
        // [修复] 确保应用到正确的文档根节点 (兼容 iframe)
        // 增加 try-catch 防止跨域访问错误
        try {
            const { window: coreWin } = getCore();
            let root;
            try {
                root = coreWin.document.documentElement;
            } catch(e) {
                // 如果访问父窗口失败，回退到当前窗口
                root = document.documentElement;
            }

            if (root) {
                Object.keys(theme.vars).forEach(key => {
                    root.style.setProperty(key, theme.vars[key]);
                });
            }
        } catch (e) {
            Logger.error('Failed to apply theme styles:', e);
        }
        
        Logger.info('主题已切换:', theme.name);
    },
    
    getList: () => Object.keys(CONFIG.THEMES).map(id => ({ id, ...CONFIG.THEMES[id] }))
};
