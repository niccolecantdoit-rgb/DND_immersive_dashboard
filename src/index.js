// src/index.js
import { Logger } from './core/Logger.js';
import { getCore, safeSave } from './core/Utils.js';
import { CONFIG } from './config/Config.js';
import { addStyles } from './ui/styles.js';
import './ui/icons.js'; // FontAwesome SVGs
import { UIRenderer } from './ui/UIRenderer.js';
import { ThemeManager } from './features/ThemeManager.js';
import { StyleManager } from './features/StyleManager.js';
import { DBAdapter } from './core/DBAdapter.js';
import { DiceManager } from './data/DiceManager.js';
import { UpdateController } from './features/UpdateController.js';
import { PresetSwitcher } from './features/PresetSwitcher.js';
import { DataManager } from './data/DataManager.js';
import { TavernSettingsSync } from './core/TavernSettingsSync.js';
import { NotificationSystem } from './ui/modules/UIUtils.js';

(function () {
    'use strict';

    const SCRIPT_ID = 'dnd_immersive_dashboard';
    
    // ==========================================
    // 5. 初始化
    // ==========================================
    let initAttempts = 0;
    const MAX_ATTEMPTS = 30;

    const init = () => {
        Logger.info('init() 开始执行');
        const { $, getDB } = getCore();
        
        Logger.debug('jQuery 状态:', !!$, $ ? $.fn.jquery : 'N/A');
        
        // 核心修复：确保 jQuery 存在
        if (!$) {
            Logger.warn('jQuery not found, retrying in 500ms...');
            setTimeout(init, 500);
            return;
        }

        const tryInit = () => {
            const api = getDB();
            Logger.debug('tryInit - API 状态:', !!api, 'body 存在:', !!$('body').length);
            
            // 只要 body 存在即可开始渲染基础 UI
            if ($('body').length) {
                Logger.info('开始渲染 UI...');
                addStyles();
                
                // [新增] 全局点击动效绑定 (先 off 再 on 确保不重复)
                $(document).off('mousedown.dndClick').on('mousedown.dndClick', '.dnd-clickable, .dnd-btn, button, .dnd-nav-item, .dnd-char-card, .dnd-item-card, .dnd-mini-char', function() {
                    const $el = $(this);
                    $el.removeClass('dnd-clicking'); // 重置
                    void $el[0].offsetWidth; // 强制重绘
                    $el.addClass('dnd-clicking');
                }).on('animationend', '.dnd-clicking', function() {
                    $(this).removeClass('dnd-clicking');
                });

                UIRenderer.init();
                ThemeManager.init(); // [修复] 初始化主题
                StyleManager.init(); // [新增] 初始化风格管理器
                
                // [新增] 异步加载设置 (覆盖默认/localStorage配置)
                DBAdapter.getSetting(CONFIG.STORAGE_KEYS.PRESET_CONFIG).then(saved => {
                    if (saved) {
                        try {
                            const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                            Object.assign(CONFIG.PRESET_SWITCHING, parsed);
                            Logger.info('已从 IndexedDB 加载配置:', parsed);
                            
                            // 加载后立即检查状态 (如果已经在战斗中)
                            const global = DataManager.getTable('SYS_GlobalState');
                            if (global && global[0]) {
                                PresetSwitcher.checkCombatStateChange(global[0]['战斗模式'] === '战斗中');
                            }
                        } catch(e) { Logger.error('Config load error:', e); }
                    }
                });

                // 初始化设置同步 (优先酒馆原生)
                TavernSettingsSync.setNotifyCallback((type, message, title) => {
                    // 映射 type 到 NotificationSystem 支持的类型
                    const method = NotificationSystem[type] ? type : 'info';
                    NotificationSystem[method](message, title);
                });
                // 延迟初始化以确保酒馆环境加载完成
                setTimeout(() => TavernSettingsSync.init(), 1000);
                
                if (api) {
                    console.log('[DND Dashboard] Connected to Database API');
                    
                    // 尝试迁移旧数据以释放空间
                    setTimeout(() => DBAdapter.migrateFromLocalStorage(), 5000);

                    // 初始检查骰子池
                    setTimeout(DiceManager.checkAndRefill, 3000);

                    if (api.registerTableUpdateCallback) {
                        // 使用 UpdateController 统一管理回调
                        api.registerTableUpdateCallback(UpdateController.handleUpdate);
                        
                        // 初始渲染一次 HUD
                        setTimeout(UIRenderer.renderHUD, 1000);
                    }
                } else if (initAttempts < MAX_ATTEMPTS) {
                    initAttempts++;
                    setTimeout(tryInit, 1000);
                }
            } else {
                setTimeout(tryInit, 500);
            }
        };

        tryInit();
    };

    // 启动逻辑
    const { $ } = getCore();
    if ($) {
        $(document).ready(init);
    } else {
        const win = window.parent || window;
        win.addEventListener('load', init);
    }

})();
