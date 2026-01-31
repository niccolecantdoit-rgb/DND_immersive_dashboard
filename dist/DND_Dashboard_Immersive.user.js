// ==UserScript==
// @name         DND 沉浸式仪表盘
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  专为 DND 模板设计的游戏风格仪表盘
// @author       Niccole
// @match        */*
// @grant        none
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/core/Logger.js
// src/core/Logger.js
const Logger = {
    // 日志等级: 0=关闭, 1=错误, 2=警告, 3=信息, 4=调试
    level: 4, // 默认全开，方便调试
    prefix: '[DND Dashboard]',
    
    error: (...args) => {
        if (Logger.level >= 1) console.error(Logger.prefix, '❌ ERROR:', ...args);
    },
    warn: (...args) => {
        if (Logger.level >= 2) console.warn(Logger.prefix, '⚠️ WARN:', ...args);
    },
    info: (...args) => {
        if (Logger.level >= 3) console.info(Logger.prefix, '📋 INFO:', ...args);
    },
    debug: (...args) => {
        if (Logger.level >= 4) console.log(Logger.prefix, '🔍 DEBUG:', ...args);
    },
    
    // 诊断函数：输出当前环境状态
    diagnose: () => {
        console.group(Logger.prefix + ' 🔬 环境诊断');
        
        // 检查 jQuery
        console.log('window.jQuery:', typeof window.jQuery, window.jQuery ? window.jQuery.fn.jquery : 'N/A');
        try {
            const parentJQ = window.parent?.jQuery;
            console.log('window.parent.jQuery:', typeof parentJQ, parentJQ ? parentJQ.fn.jquery : 'N/A');
        } catch(e) {
            console.log('window.parent.jQuery: 访问被阻止 (跨域)', e.message);
        }
        
        // 检查 DOM
        console.log('document.body:', !!document.body);
        console.log('#dnd-toggle-btn 存在:', !!document.getElementById('dnd-toggle-btn'));
        console.log('#dnd-dashboard-root 存在:', !!document.getElementById('dnd-dashboard-root'));
        console.log('#dnd-mini-hud 存在:', !!document.getElementById('dnd-mini-hud'));
        
        // 检查 API
        console.log('window.AutoCardUpdaterAPI:', typeof window.AutoCardUpdaterAPI);
        try {
            console.log('parent.AutoCardUpdaterAPI:', typeof window.parent?.AutoCardUpdaterAPI);
        } catch(e) {
            console.log('parent.AutoCardUpdaterAPI: 访问被阻止');
        }
        
        // 检查是否在 iframe 中
        console.log('在 iframe 中:', window !== window.top);
        console.log('window.location:', window.location.href.substring(0, 100));
        
        console.groupEnd();
    }
};

// 全局暴露 Logger 以便在控制台调用
window.DND_Dashboard_Logger = Logger;

;// ./src/core/DBAdapter.js
// src/core/DBAdapter.js
const DBAdapter = {
    dbName: 'DND_Immersive_DB',
    storeName: 'avatars',
    settingsStore: 'settings',
    svgStore: 'svg_maps', // New store for map SVGs
    version: 7, // Bump to 7 to force store creation if missing
    db: null,
    _openPromise: null, // Track opening state
    
    init: () => {
        if (DBAdapter.db) return Promise.resolve(DBAdapter.db);
        if (DBAdapter._openPromise) return DBAdapter._openPromise;

        DBAdapter._openPromise = new Promise((resolve, reject) => {
            // 处理兼容性
            const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            if (!indexedDB) {
                console.error('[DND DB] Browser does not support IndexedDB');
                DBAdapter._openPromise = null;
                return reject('IndexedDB not supported');
            }

            // [Fix] Add timeout to prevent hanging (which blocks LocalStorage fallback)
            const timeoutId = setTimeout(() => {
                if (DBAdapter._openPromise) {
                    console.warn('[DND DB] Connection timed out. Using fallback.');
                    DBAdapter._openPromise = null;
                    reject('Connection timeout');
                }
            }, 2000);

            const request = indexedDB.open(DBAdapter.dbName, DBAdapter.version);
            
            request.onblocked = (e) => {
                console.warn('[DND DB] Database blocked. Please close other tabs.');
                // Don't reject immediately, wait for timeout or unblock
            };

            request.onerror = (e) => {
                clearTimeout(timeoutId);
                console.error('[DND DB] Open Error:', e.target.error);
                DBAdapter._openPromise = null;
                reject(e.target.error);
            };
            
            request.onsuccess = (e) => {
                clearTimeout(timeoutId);
                const db = e.target.result;
                DBAdapter.db = db;
                // Keep promise to return same resolved DB for subsequent calls
                // But we MUST clear it if DB closes

                db.onclose = () => {
                    console.warn('[DND DB] Database connection closed unexpectedly.');
                    DBAdapter.db = null;
                    DBAdapter._openPromise = null; // Clear promise to allow re-opening
                };

                db.onversionchange = () => {
                    console.warn('[DND DB] Database version changed. Closing connection.');
                    db.close();
                    DBAdapter.db = null;
                    DBAdapter._openPromise = null; // Clear promise
                };

                resolve(db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // Ensure all stores exist
                if (!db.objectStoreNames.contains(DBAdapter.storeName)) {
                    db.createObjectStore(DBAdapter.storeName);
                }
                if (!db.objectStoreNames.contains(DBAdapter.settingsStore)) {
                    db.createObjectStore(DBAdapter.settingsStore);
                }
                if (!db.objectStoreNames.contains(DBAdapter.svgStore)) {
                    db.createObjectStore(DBAdapter.svgStore);
                }
            };
        });
        
        return DBAdapter._openPromise;
    },

    // 通用操作 helper
    _op: async (storeName, mode, callback) => {
        try {
            let db = await DBAdapter.init();
            return new Promise((resolve, reject) => {
                let transaction;
                try {
                    transaction = db.transaction([storeName], mode);
                } catch (err) {
                    // Retry init if transaction creation fails (e.g. closed connection)
                    console.warn('[DND DB] Transaction creation failed, retrying connection...', err);
                    
                    // Force reset state
                    DBAdapter.db = null;
                    DBAdapter._openPromise = null;
                    
                    // Retry once
                    DBAdapter.init().then(newDb => {
                        try {
                            transaction = newDb.transaction([storeName], mode);
                            const store = transaction.objectStore(storeName);
                            const request = callback(store);
                            request.onsuccess = (e) => resolve(e.target.result);
                            request.onerror = (e) => reject(e.target.error);
                        } catch (retryErr) {
                            console.error('[DND DB] Retry failed:', retryErr);
                            reject(retryErr);
                        }
                    }).catch(err => {
                        console.error('[DND DB] Re-init failed:', err);
                        reject(err);
                    });
                    return;
                }

                const store = transaction.objectStore(storeName);
                const request = callback(store);
                
                request.onsuccess = (e) => resolve(e.target.result);
                request.onerror = (e) => {
                    console.error(`[DND DB] Op Error (${storeName}):`, e.target.error);
                    reject(e.target.error);
                };
            });
        } catch(e) {
            console.error(`[DND DB] Operation Failed (${storeName}):`, e);
            return undefined; // Return undefined on failure so fallbacks work
        }
    },

    put: async (key, value) => {
        return DBAdapter._op(DBAdapter.storeName, 'readwrite', store => store.put(value, key));
    },

    get: async (key) => {
        return DBAdapter._op(DBAdapter.storeName, 'readonly', store => store.get(key));
    },
    
    setSetting: async (key, value) => {
        return DBAdapter._op(DBAdapter.settingsStore, 'readwrite', store => store.put(value, key));
    },

    setSVG: async (key, value) => {
        return DBAdapter._op(DBAdapter.svgStore, 'readwrite', store => store.put(value, key));
    },

    getSVG: async (key) => {
        return DBAdapter._op(DBAdapter.svgStore, 'readonly', store => store.get(key));
    },

    getSetting: async (key) => {
        // Try DB first
        try {
            let val = await DBAdapter._op(DBAdapter.settingsStore, 'readonly', store => store.get(key));
            if (val !== undefined && val !== null) return val;
        } catch(e) { console.warn('DB Get failed', e); }
        
        // [Fallback] Try LocalStorage if DB failed or missing
        try {
            const lsVal = localStorage.getItem(key);
            if (lsVal) return lsVal;
        } catch(e) {}

        return null;
    },

    delete: async (key) => {
        return DBAdapter._op(DBAdapter.storeName, 'readwrite', store => store.delete(key));
    },

    migrateFromLocalStorage: async () => {
        const keys = Object.keys(localStorage);
        let count = 0;
        for (const k of keys) {
            if (k.startsWith('dnd_')) {
                const val = localStorage.getItem(k);
                if (val) {
                    try {
                        if (k.startsWith('dnd_avatar_')) {
                            // Avatars are large, move to DB and delete from LS
                            await DBAdapter.put(k.replace('dnd_avatar_', ''), val);
                            localStorage.removeItem(k);
                            count++;
                        } else {
                            await DBAdapter.setSetting(k, val);
                            // Settings stay in LS as backup
                        }
                    } catch(e) { console.warn('Migration failed for', k); }
                }
            }
        }
        if (count > 0) console.log(`[DND Storage] Migrated ${count} items to DB.`);
    },

    // [新增] 存储空间分析
    analyzeStorage: () => {
        let total = 0;
        const usage = {};
        const details = [];
        
        for (let k in localStorage) {
            if (!localStorage.hasOwnProperty(k)) continue;
            const len = ((localStorage[k].length + k.length) * 2);
            total += len;
            
            let prefix = 'Other';
            if (k.startsWith('dnd_')) prefix = 'DND Script';
            else if (k.startsWith('SillyTavern') || k.startsWith('settings')) prefix = 'SillyTavern System';
            else if (k.includes('chat')) prefix = 'Chats/Logs';
            else if (k.includes('character')) prefix = 'Characters';
            
            usage[prefix] = (usage[prefix] || 0) + len;
            details.push({ key: k, size: len });
        }
        
        // Sort by size desc
        details.sort((a, b) => b.size - a.size);
        
        return {
            totalBytes: total,
            totalMB: (total / 1024 / 1024).toFixed(2),
            breakdown: usage,
            topKeys: details.slice(0, 5)
        };
    }
};

;// ./src/core/Utils.js
// src/core/Utils.js


const getCore = () => {
    try {
        const w = window.parent || window;
        const localJQuery = window.jQuery;
        const parentJQuery = w.jQuery;
        const $ = localJQuery || parentJQuery;
        
        return {
            window: w,
            $: $,
            getDB: () => w.AutoCardUpdaterAPI || window.AutoCardUpdaterAPI
        };
    } catch (e) {
        console.error('[DND Dashboard] getCore Error:', e);
        return { window: window, $: window.jQuery, getDB: () => window.AutoCardUpdaterAPI };
    }
};

const safeSave = async (key, val) => {
    try {
        await DBAdapter.setSetting(key, val);
    } catch(e) {
        console.warn('[DND Storage] DB Save failed:', e);
    }
    
    try {
        const valStr = typeof val === 'object' ? JSON.stringify(val) : val;
        localStorage.setItem(key, valStr);
    } catch(e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('[DND Storage] LocalStorage is full! Backup failed for:', key);
        } else {
            console.warn('[DND Storage] LS Save failed:', e);
        }
    }
};

;// ./src/config/Config.js
// src/config/Config.js
const CONFIG = {
    // Z-Index 层级管理
    Z_INDEX: {
        TOGGLE_BTN: 2147483641,
        MINI_HUD: 2147483640,
        DASHBOARD: 2147483642,
        CHAR_DETAIL: 2147483643,
        POPUP_BACKDROP: 2147483644,
        POPUP: 2147483645,
        AVATAR_DIALOG: 2147483650
    },
    // 尺寸配置
    SIZE: {
        TOGGLE_BTN: 40,
        MINI_HUD_WIDTH: 350,
        CHAR_CARD_WIDTH: 380,
        MINIMAP_SIZE: 180,
        AVATAR_DEFAULT: 40,
        AVATAR_LARGE: 48
    },
    // 动画时长 (ms)
    ANIMATION: {
        FADE_DURATION: 200,
        SLIDE_DURATION: 300,
        DEBOUNCE_DELAY: 150
    },
    // 骰子池配置
    DICE_POOL: {
        MIN_ROWS: 6,
        TARGET_ROWS: 20,
        REFILL_COOLDOWN: 3000
    },
    // 存储键名
    STORAGE_KEYS: {
        TOGGLE_POS: 'dnd_toggle_pos',
        PARTY_EXPANDED: 'dnd_party_expanded',
        THEME: 'dnd_theme',
        MAP_ZOOM: 'dnd_map_zoom',
        PRESET_CONFIG: 'dnd_preset_config',
        QUICK_SLOTS: 'dnd_quick_slots'
    },
    // 地图缩放配置
    MAP_ZOOM: {
        MIN: 0.5,
        MAX: 3.0,
        DEFAULT: 1.0,
        STEP: 0.15
    },
    // 主题配置
    THEMES: {
        dark: {
            name: '暗黑城堡',
            icon: '🏰',
            vars: {
                '--dnd-bg-main': '#0f0b0a',
                '--dnd-bg-panel': 'linear-gradient(to bottom, #2b1b17, #1a100e)',
                '--dnd-bg-card': 'linear-gradient(135deg, #242424 0%, #1a1a1c 100%)',
                '--dnd-bg-hud': 'linear-gradient(to bottom, #2b1b17, #1a100e)',
                '--dnd-bg-popup': 'linear-gradient(to bottom, rgba(28, 28, 30, 0.99), rgba(18, 18, 20, 0.99))',
                '--dnd-bg-item': 'rgba(255,255,255,0.03)',
                '--dnd-border-gold': '#9d8b6c',
                '--dnd-border-inner': '#5c4b35',
                '--dnd-text-main': '#dcd0c0',
                '--dnd-text-header': '#e6dcca',
                '--dnd-text-highlight': '#ffdb85',
                '--dnd-text-dim': '#888',
                '--dnd-accent-red': '#8a2c2c',
                '--dnd-accent-green': '#3a6b4a',
                '--dnd-accent-blue': '#2c4c8a',
                '--dnd-shadow': '0 5px 20px rgba(0,0,0,0.8)'
            }
        },
        forest: {
            name: '精灵森林',
            icon: '🌲',
            vars: {
                '--dnd-bg-main': '#0c1210',
                '--dnd-bg-panel': 'linear-gradient(to bottom, #1a2b22, #0e1a14)',
                '--dnd-bg-card': 'linear-gradient(135deg, #1c2e24 0%, #0f1c16 100%)',
                '--dnd-bg-hud': 'linear-gradient(to bottom, #1a2b22, #0e1a14)',
                '--dnd-bg-popup': 'linear-gradient(to bottom, rgba(20, 32, 26, 0.99), rgba(10, 20, 16, 0.99))',
                '--dnd-bg-item': 'rgba(255,255,255,0.05)',
                '--dnd-border-gold': '#5a8a6a',
                '--dnd-border-inner': '#2c4a3a',
                '--dnd-text-main': '#c0dcd0',
                '--dnd-text-header': '#cae6da',
                '--dnd-text-highlight': '#85ffb5',
                '--dnd-text-dim': '#6a8a7a',
                '--dnd-accent-red': '#8a4a4a',
                '--dnd-accent-green': '#3a8b5a',
                '--dnd-accent-blue': '#2c6c8a',
                '--dnd-shadow': '0 5px 20px rgba(0,20,10,0.8)'
            }
        },
        crimson: {
            name: '血色深渊',
            icon: '🔥',
            vars: {
                '--dnd-bg-main': '#120808',
                '--dnd-bg-panel': 'linear-gradient(to bottom, #2b1717, #1a0e0e)',
                '--dnd-bg-card': 'linear-gradient(135deg, #2e1c1c 0%, #1c0f0f 100%)',
                '--dnd-bg-hud': 'linear-gradient(to bottom, #2b1717, #1a0e0e)',
                '--dnd-bg-popup': 'linear-gradient(to bottom, rgba(32, 20, 20, 0.99), rgba(20, 10, 10, 0.99))',
                '--dnd-bg-item': 'rgba(255,200,200,0.03)',
                '--dnd-border-gold': '#8a5a5a',
                '--dnd-border-inner': '#4a2c2c',
                '--dnd-text-main': '#dcc0c0',
                '--dnd-text-header': '#e6cada',
                '--dnd-text-highlight': '#ff8585',
                '--dnd-text-dim': '#8a6a6a',
                '--dnd-accent-red': '#a82c2c',
                '--dnd-accent-green': '#4a6b4a',
                '--dnd-accent-blue': '#4a2c8a',
                '--dnd-shadow': '0 5px 20px rgba(20,0,0,0.8)'
            }
        },
        arcane: {
            name: '奥术塔楼',
            icon: '🔮',
            vars: {
                '--dnd-bg-main': '#0a0a14',
                '--dnd-bg-panel': 'linear-gradient(to bottom, #1a1a2e, #0e0e1a)',
                '--dnd-bg-card': 'linear-gradient(135deg, #1c1c2e 0%, #0f0f1c 100%)',
                '--dnd-bg-hud': 'linear-gradient(to bottom, #1a1a2e, #0e0e1a)',
                '--dnd-bg-popup': 'linear-gradient(to bottom, rgba(20, 20, 36, 0.99), rgba(10, 10, 20, 0.99))',
                '--dnd-bg-item': 'rgba(200,200,255,0.03)',
                '--dnd-border-gold': '#6a6a9d',
                '--dnd-border-inner': '#3a3a5a',
                '--dnd-text-main': '#c0c0dc',
                '--dnd-text-header': '#cacaE6',
                '--dnd-text-highlight': '#b585ff',
                '--dnd-text-dim': '#6a6a8a',
                '--dnd-accent-red': '#8a2c6c',
                '--dnd-accent-green': '#2c6b8a',
                '--dnd-accent-blue': '#3a5a8b',
                '--dnd-shadow': '0 5px 20px rgba(10,10,30,0.8)'
            }
        }
    },
    // 预设切换配置 (Default values, will be overwritten by DB)
    PRESET_SWITCHING: {
        COMBAT_PRESET: '战斗推进',
        EXPLORE_PRESET: '奶龙推进',
        ENABLED: true
    }
};

;// ./src/ui/styles.js
// src/ui/styles.js


const SCRIPT_ID = 'dnd_immersive_dashboard';

const addStyles = () => {
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
        
        /* 悬停浮起效果 */
        .dnd-hover-lift {
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s, filter 0.2s !important;
        }
        .dnd-hover-lift:hover {
            transform: translateY(-3px) scale(1.02) !important;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important;
            filter: brightness(1.1) !important;
            z-index: 10 !important;
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
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
            animation: dnd-shimmer 2s infinite linear;
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
    `;
    $('head').append(`<style id="${SCRIPT_ID}-styles">${css}</style>`);
};

;// ./src/features/UpdateController.js
// src/features/UpdateController.js




// [新增] 防回弹控制器 (参考自兼容性可视化表格 v9.0)
const UpdateController = {
    _suppressNext: false,
    // 执行静默保存
    runSilently: async action => {
        UpdateController._suppressNext = true;
        try {
            await action();
        } finally {
            // 2秒后恢复监听，给数据库一点写入时间
            setTimeout(() => {
                UpdateController._suppressNext = false;
                console.log('[DND Dashboard] 恢复数据库监听');
            }, 2000);
        }
    },
    // 过滤更新信号
    handleUpdate: () => {
        if (UpdateController._suppressNext) {
            console.log('[DND Dashboard] 拦截了回弹信号');
            return;
        }
        
        // 渲染全屏面板（如果可见）
        const { $ } = getCore();
        if ($('#dnd-dashboard-root').hasClass('visible')) {
            const $activeItem = $('.dnd-nav-item.active');
            if ($activeItem.length && UIRenderer && UIRenderer.renderPanel) {
                UIRenderer.renderPanel($activeItem.data('target'));
            }
        }
        // 始终渲染/更新简略 HUD
        if (UIRenderer && UIRenderer.renderHUD) {
            UIRenderer.renderHUD();
        }
        
        // 每次数据更新时检查骰子池
        DiceManager.checkAndRefill();
    },
};

;// ./src/data/DiceManager.js




const DiceManager = {
    isRefilling: false,
    
    // 生成一行随机骰子数据 [null, ID, D4, D6, D8, D10, D12, D20, D100]
    generateRow: (id) => {
        const roll = (sides) => Math.floor(Math.random() * sides) + 1;
        // [修复] ID 必须转为字符串，否则核心库调用 startsWith 时会报错
        return [null, String(id), roll(4), roll(6), roll(8), roll(10), roll(12), roll(20), roll(100)];
    },

    // [修复] 确保数据格式符合标准 (参考自兼容性可视化表格 v9.0)
    ensureProperFormat: (data) => {
        if (!data) return data;
        
        // 如果已有 mate 且类型正确，直接返回
        if (data.mate && data.mate.type === 'chatSheets') {
            return data;
        }

        // 深拷贝以避免修改原引用
        const result = JSON.parse(JSON.stringify(data));
        
        // 检查是否包含 sheet_ 开头的键
        const hasSheets = Object.keys(result).some(key => key.startsWith('sheet_'));

        // 如果有 sheet 但没有 mate，补充 mate
        if (hasSheets && !result.mate) {
            result.mate = { 
                type: 'chatSheets', 
                version: 2,
                schema: 'DND5E_TextRPG',
                created: Date.now()
            };
        }
        // 如果连 sheet 都没有，可能需要更复杂的转换（暂时不处理这种情况，避免误操作）

        return result;
    },

    // 强力保存逻辑 (参考自兼容性可视化表格 v9.0)
    saveData: async (tableData) => {
        const api = DataManager.getAPI();
        
        // [修复] 在保存前确保格式正确
        const formattedData = DiceManager.ensureProperFormat(tableData);
        
        // 使用控制器包裹保存过程，防止死循环
        await UpdateController.runSilently(async () => {
            try {
                // 1. 尝试直接注入到 SillyTavern 聊天记录 (最高兼容性)
                let injectedDirectly = false;
                try {
                    const w = window.parent || window;
                    let ST = w.SillyTavern || (w.top ? w.top.SillyTavern : null);
                    
                    if (ST && ST.chat && ST.chat.length > 0) {
                        // 查找最新 AI 消息
                        let targetMsg = null;
                        for (let i = ST.chat.length - 1; i >= 0; i--) {
                            if (!ST.chat[i].is_user) {
                                targetMsg = ST.chat[i];
                                break;
                            }
                        }

                        if (targetMsg) {
                            // 注入到旧版字段 (确保兼容 V5/V6 脚本)
                            if (!targetMsg.TavernDB_ACU_Data) targetMsg.TavernDB_ACU_Data = {};
                            
                            // 注入到新版隔离字段 (如果存在)
                            // 这里简化处理，主要为了确保数据能写入
                            
                            // 执行保存
                            if (ST.saveChat) {
                                await ST.saveChat();
                                injectedDirectly = true;
                                console.log('[DND Dashboard] 已通过 ST.saveChat() 注入数据');
                            }
                        }
                    }
                } catch (err) {
                    console.warn('[DND Dashboard] 直接注入失败:', err);
                }

                // 2. 调用 API 触发刷新 (即使直接注入成功也调用，以触发 UI 更新)
                if (api && api.importTableAsJson) {
                    // 使用修复后的数据
                    await api.importTableAsJson(JSON.stringify(formattedData));
                    console.log('[DND Dashboard] 已调用 api.importTableAsJson');
                } else if (!injectedDirectly) {
                    console.error('[DND Dashboard] 无法保存数据：API 不可用且注入失败');
                }
            } catch (e) {
                console.error('[DND Dashboard] 保存过程异常:', e);
            }
        });
    },

    checkAndRefill: async () => {
        if (DiceManager.isRefilling) return;

        const api = DataManager.getAPI();
        if (!api || !api.exportTableAsJson) return;

        try {
            const rawData = api.exportTableAsJson();
            if (!rawData) return;
            
            let dataObj = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
            
            // 寻找骰子池表 (根据名称或 uid)
            let poolKey = Object.keys(dataObj).find(k => {
                const sheet = dataObj[k];
                return sheet.name && (sheet.name === '🎲 骰子池' || sheet.name.includes('骰子池'));
            });

            if (!poolKey) return;

            const sheet = dataObj[poolKey];
            if (!sheet.content) sheet.content = [];

            // 检查行数 (第0行是表头)
            // 如果少于 6 行可用骰子 (总行数 < 7)
            // 这里的阈值设为 6，意味着至少保持 6 个预备骰子
            if (sheet.content.length < 7) {
                console.log('[DND Dashboard] Dice pool low, refilling...');
                DiceManager.isRefilling = true;

                // 获取当前最大ID
                let maxId = 0;
                if (sheet.content.length > 1) {
                    // 遍历现有行找到最大ID，防止乱序
                    for (let i = 1; i < sheet.content.length; i++) {
                        const rowId = parseInt(sheet.content[i][1]);
                        if (!isNaN(rowId) && rowId > maxId) maxId = rowId;
                    }
                }

                // 补充到 20 行 (20个可用骰子 + 1个表头 = 21行)
                const targetRows = 21;
                const currentRows = sheet.content.length;
                const addCount = targetRows - currentRows;

                if (addCount > 0) {
                    for (let i = 0; i < addCount; i++) {
                        maxId++;
                        sheet.content.push(DiceManager.generateRow(maxId));
                    }

                    // 使用增强的保存函数
                    await DiceManager.saveData(dataObj);
                    
                    console.log(`[DND Dashboard] Added ${addCount} dice rows.`);
                    
                    // 显示通知
                    const { $ } = getCore();
                    if ($('#dnd-hud-status-text').length) {
                        // 临时显示状态
                        const $status = $('#dnd-hud-status-text');
                        const originalHtml = $status.html();
                        $status.html('<span style="color:var(--dnd-text-highlight);animation:dnd-pulse 1s infinite;">🎲 骰子池已自动补充</span>');
                        setTimeout(() => {
                            // 只有当内容没变时才恢复，防止覆盖了新的状态更新
                            if ($status.text().includes('骰子池已自动补充')) {
                                $status.html(originalHtml);
                            }
                        }, 3000);
                    }
                }
            }
        } catch (e) {
            console.error('[DND Dashboard] Failed to refill dice pool:', e);
        } finally {
            // 无论成功失败，都在冷却后重置标志
            // 增加冷却时间以确保安全
            setTimeout(() => {
                DiceManager.isRefilling = false;
            }, 3000);
        }
    }
};
;// ./src/data/DataManager.js
// src/data/DataManager.js



const DataManager = {
    // [新增] 查找表键名 (模糊匹配)
    findTableKey: (rawData, nameFragment) => {
        if (!rawData) return null;
        return Object.keys(rawData).find(k =>
            k === nameFragment ||
            k.includes(nameFragment) ||
            (rawData[k].name && rawData[k].name.includes(nameFragment))
        );
    },

    // [新增] 在数据对象中应用系统通知 (不立即保存)
    applySystemNotification: (rawData, text) => {
        if (!rawData) return;
        let sheetKey = Object.keys(rawData).find(k => k.includes('SYS_GlobalState') || (rawData[k].name && rawData[k].name.includes('全局状态')));
        if (!sheetKey) return;
        
        const sheet = rawData[sheetKey];
        if (!sheet.content || sheet.content.length < 2) return;
        
        // 查找或创建 '系统通知' 列
        let colIndex = sheet.content[0].indexOf('系统通知');
        if (colIndex === -1) {
            sheet.content[0].push('系统通知');
            colIndex = sheet.content[0].length - 1;
            // 确保数据行有足够的列
            if (sheet.content[1].length <= colIndex) {
                sheet.content[1][colIndex] = null;
            }
        }
        
        // 写入文本
        sheet.content[1][colIndex] = text;
    },

    // [新增] 独立的设置通知函数 (立即保存)
    setSystemNotification: async (text) => {
        const rawData = DataManager.getAllData();
        DataManager.applySystemNotification(rawData, text);
        await DiceManager.saveData(rawData);
    },

    getAPI: () => getCore().getDB(),
    
    // 增加一个辅助获取 Core 的方法，供其他模块使用（如 DiceManager）
    getCore: getCore,

    // 通用解析器：支持 JSON 和自定义字符串格式
    parseValue: (val, type = 'json') => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        
        // 字符串格式解析 (优先尝试字符串解析)
        if (typeof val === 'string') {
            // 如果看起来像 JSON，尝试 JSON 解析 (为了兼容旧数据)
            if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(val);
                    if (parsed && typeof parsed === 'object') return parsed;
                } catch (e) {}
            }

            if (type === 'stats') {
                // 格式: STR:16|DEX:14 或 json
                const stats = {};
                // 处理 JSON 字符串格式: {"STR":16,...}
                if (val.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed) return parsed;
                    } catch(e) {}
                }
                
                // 处理自定义字符串格式
                val.split('|').forEach(part => {
                    const [k, v] = part.split(':');
                    if (k && v) stats[k.trim()] = isNaN(v) ? v : parseInt(v);
                });
                return Object.keys(stats).length > 0 ? stats : null;
            }
            if (type === 'coord') {
                // 格式: 7,13 -> {x:7, y:13}
                // 或者: x:7,y:13
                // 或者: {"x":7, "y":13}
                if (val.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed) return parsed;
                    } catch(e) {}
                }

                if (val.includes(':') && !val.includes('{')) {
                    const pos = {};
                    val.split(',').forEach(p => {
                        const [k, v] = p.split(':');
                        if (k && v) pos[k.trim()] = parseFloat(v);
                    });
                    return pos;
                }
                const parts = val.split(',');
                if (parts.length >= 2) return { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
            }
            if (type === 'size') {
                // 格式: 2,2 -> {w:2, h:2}
                // 或者: {"w":2, "h":2}
                if (val.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed) return parsed;
                    } catch(e) {}
                }

                const parts = val.split(',');
                if (parts.length >= 2) return { w: parseFloat(parts[0]), h: parseFloat(parts[1]) };
            }
            if (type === 'resources') {
                // 格式: 1级:3/4|2级:2/3
                // 或者: {"1级":"3/4",...}
                if (val.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed) return parsed;
                    } catch(e) {}
                }

                const res = {};
                val.split('|').forEach(part => {
                    const [k, v] = part.split(':');
                    if (k && v) res[k.trim()] = v.trim();
                });
                return Object.keys(res).length > 0 ? res : null;
            }
        }
        return null;
    },
    
    getAllData: () => {
        const api = DataManager.getAPI();
        if (!api || !api.exportTableAsJson) return null;
        const raw = api.exportTableAsJson();
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    },

    parseSheet: (sheet) => {
        if (!sheet || !sheet.content || sheet.content.length < 2) return [];
        const headers = sheet.content[0];
        const rows = sheet.content.slice(1);
        
        return rows.map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                if (h) obj[h] = row[i];
            });
            return obj;
        });
    },

    getTable: (tableNameFragment) => {
        const data = DataManager.getAllData();
        if (!data) return null;
        
        const key = Object.keys(data).find(k => k.includes(tableNameFragment) || (data[k].name && data[k].name.includes(tableNameFragment)));
        if (!key) return null;
        
        return DataManager.parseSheet(data[key]);
    },

    getPartyData: () => {
        const charReg = DataManager.getTable('CHARACTER_Registry');
        const charAttr = DataManager.getTable('CHARACTER_Attributes');
        const charRes = DataManager.getTable('CHARACTER_Resources');
        
        if (!charReg) return [];

        const party = [];

        charReg.forEach(char => {
            const charId = char['CHAR_ID'];
            const attr = charAttr ? charAttr.find(a => a['CHAR_ID'] === charId) : {};
            const res = charRes ? charRes.find(r => r['CHAR_ID'] === charId) : {};
            
            const type = char['成员类型'] === '主角' ? 'PC' : 'NPC';
            const isPC = type === 'PC';
            
            // 合并数据
            const merged = { ...char, ...attr, ...res, type, isPC };
            party.push(merged);
        });

        return party;
    },

    getCharacterSkills: (charId) => {
        const links = DataManager.getTable('CHARACTER_Skills');
        const library = DataManager.getTable('SKILL_Library');
        
        if (!links || !library) return [];

        // 兼容：尝试通过 ID 查找，或者通过名称查找
        let charLinks = links.filter(l => l['CHAR_ID'] === charId);
        
        // 如果按 ID 没找到，尝试按姓名
        if (charLinks.length === 0) {
             const party = DataManager.getPartyData();
             const char = party.find(p => p['姓名'] === charId);
             if (char) {
                 const realId = char['CHAR_ID'];
                 charLinks = links.filter(l => l['CHAR_ID'] === realId);
             }
        }
        
        return charLinks.map(link => {
            const skill = library.find(s => s['SKILL_ID'] === link['SKILL_ID']);
            return { ...link, ...skill };
        });
    },

    getCharacterFeats: (charId) => {
        const links = DataManager.getTable('CHARACTER_Feats');
        const library = DataManager.getTable('FEAT_Library');
        
        if (!links || !library) return [];

        let charLinks = links.filter(l => l['CHAR_ID'] === charId);
        
        if (charLinks.length === 0) {
             const party = DataManager.getPartyData();
             const char = party.find(p => p['姓名'] === charId);
             if (char) {
                 const realId = char['CHAR_ID'];
                 charLinks = links.filter(l => l['CHAR_ID'] === realId);
             }
        }
        
        return charLinks.map(link => {
            const feat = library.find(f => f['FEAT_ID'] === link['FEAT_ID']);
            return { ...link, ...feat };
        });
    },

    // [新增] 获取已知法术 (从技能库合成)
    getKnownSpells: (charId) => {
        // 如果未提供 ID，尝试查找主角
        if (!charId) {
            const party = DataManager.getPartyData();
            const pc = party.find(p => p.isPC);
            if (pc) charId = pc['CHAR_ID'];
        }
        
        if (!charId) return [];

        const links = DataManager.getTable('CHARACTER_Skills');
        const library = DataManager.getTable('SKILL_Library');
        
        if (!links || !library) return [];

        // 筛选该角色的技能关联
        let charLinks = links.filter(l => l['CHAR_ID'] === charId);
        
        if (charLinks.length === 0) {
             const party = DataManager.getPartyData();
             const char = party.find(p => p['姓名'] === charId);
             if (char) {
                 const realId = char['CHAR_ID'];
                 charLinks = links.filter(l => l['CHAR_ID'] === realId);
             }
        }
        
        const spells = [];
        charLinks.forEach(link => {
            const skill = library.find(s => s['SKILL_ID'] === link['SKILL_ID']);
            // 判断是否为法术 (仅当技能类型明确为'法术'时)
            // [修复] 移除对环阶的宽松判断，防止 '武技' 被误判为法术
            if (skill && skill['技能类型'] === '法术') {
                spells.push({
                    ...skill,
                    ...link,
                    '法术名称': skill['技能名称'], // 兼容旧字段名
                    '已准备': link['已准备']
                });
            }
        });
        
        return spells;
    },

    getMaxSpellSlotLevel: (char) => {
        if (!char || !char['法术位']) return 9; // 默认9以防万一
        const slots = DataManager.parseValue(char['法术位'], 'resources');
        if (!slots) return 0;
        
        let maxLevel = 0;
        Object.keys(slots).forEach(k => {
            // k 通常是 "1级", "2级" 等
            let lvl = parseInt(k);
            if (isNaN(lvl)) {
                const m = k.match(/(\d+)/);
                if (m) lvl = parseInt(m[1]);
            }
            
            if (!isNaN(lvl) && lvl > maxLevel) {
                // 检查是否有该环阶的槽位上限 (max > 0)
                const valStr = slots[k].toString();
                const parts = valStr.split('/');
                // 格式: 当前/最大
                if (parts.length >= 2) {
                    const maxSlots = parseInt(parts[1]);
                    if (!isNaN(maxSlots) && maxSlots > 0) {
                        maxLevel = lvl;
                    }
                } else {
                    // 如果只有数字，假设是数量? 或者是 "3" (当前3)?
                    // 保守起见，如果存在key且解析正常，就认为拥有
                    maxLevel = lvl;
                }
            }
        });
        return maxLevel;
    },

    // [新增] 导出队伍数据为 JSON
    exportPartyData: () => {
        const party = DataManager.getPartyData();
        if (!party || party.length === 0) {
            console.warn('[DND DataManager] 无队伍数据可导出');
            return null;
        }

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            exportSource: 'DND_Dashboard_Immersive',
            party: [],
            skills: {},
            feats: {},
            spells: {}
        };

        party.forEach(char => {
            const charId = char['CHAR_ID'] || char['PC_ID'] || char['姓名'];
            
            // 添加角色基础数据
            exportData.party.push({ ...char });
            
            // 获取技能数据
            const skills = DataManager.getCharacterSkills(charId);
            if (skills && skills.length > 0) {
                exportData.skills[charId] = skills;
            }
            
            // 获取专长数据
            const feats = DataManager.getCharacterFeats(charId);
            if (feats && feats.length > 0) {
                exportData.feats[charId] = feats;
            }
            
            // 获取法术数据
            const spells = DataManager.getKnownSpells(charId);
            if (spells && spells.length > 0) {
                exportData.spells[charId] = spells;
            }
        });

        return exportData;
    },

    // [新增] 导入队伍数据
    importPartyData: async (jsonData) => {
        try {
            // 验证数据格式
            if (!jsonData || !jsonData.party || !Array.isArray(jsonData.party)) {
                return { success: false, message: '无效的数据格式' };
            }

            const rawData = DataManager.getAllData();
            if (!rawData) return { success: false, message: '无法读取数据库' };

            // 辅助函数：处理单个表的更新/插入
            const processTable = (tableNameFragment, dataList) => {
                const tableKey = DataManager.findTableKey(rawData, tableNameFragment);
                if (!tableKey) return;
                
                const sheet = rawData[tableKey];
                if (!sheet || !sheet.content || sheet.content.length < 1) return;
                
                const headers = sheet.content[0];
                // 尝试找到 ID 列 (CHAR_ID 或 PC_ID 或 姓名)
                let idColName = 'CHAR_ID';
                if (headers.includes('PC_ID')) idColName = 'PC_ID';
                else if (headers.includes('姓名') && !headers.includes('CHAR_ID')) idColName = '姓名';
                
                const idIdx = headers.indexOf(idColName);
                if (idIdx === -1) return;

                dataList.forEach(item => {
                    // 确定该条目的 ID
                    const itemId = item[idColName] || item['CHAR_ID'] || item['姓名'];
                    if (!itemId) return;

                    // 在表中查找对应行
                    let rowIdx = -1;
                    // 跳过表头
                    for (let i = 1; i < sheet.content.length; i++) {
                        const rowVal = sheet.content[i][idIdx];
                        if (rowVal === itemId) {
                            rowIdx = i;
                            break;
                        }
                    }

                    if (rowIdx !== -1) {
                        // 更新: 遍历 header，如果 item 中有对应字段则更新
                        headers.forEach((h, colIdx) => {
                            if (item[h] !== undefined) {
                                sheet.content[rowIdx][colIdx] = item[h];
                            }
                        });
                    } else {
                        // 插入: 构建新行
                        const newRow = headers.map(h => item[h] !== undefined ? item[h] : null);
                        // 确保 ID 存在
                        if (item[idColName] !== undefined) {
                            newRow[idIdx] = item[idColName];
                        }
                        sheet.content.push(newRow);
                    }
                });
            };

            // 分别处理三个主表
            processTable('CHARACTER_Registry', jsonData.party);
            processTable('CHARACTER_Attributes', jsonData.party);
            processTable('CHARACTER_Resources', jsonData.party);

            // 辅助函数：处理关联数据 (技能/专长/法术)
            const processAuxData = (dataMap, libTableName, linkTableName, idField, nameField, typeField = null, fixedType = null) => {
                if (!dataMap) return;
                
                const libKey = DataManager.findTableKey(rawData, libTableName);
                const linkKey = DataManager.findTableKey(rawData, linkTableName);
                if (!libKey || !linkKey) return;
                
                const libSheet = rawData[libKey];
                const linkSheet = rawData[linkKey];
                const libHeaders = libSheet.content[0];
                const linkHeaders = linkSheet.content[0];
                
                Object.keys(dataMap).forEach(charId => {
                    const items = dataMap[charId];
                    if (!Array.isArray(items)) return;
                    
                    items.forEach(item => {
                        // 1. 处理库 (Library)
                        let itemId = item[idField];
                        const itemName = item[nameField];
                        
                        // 尝试通过 ID 查找
                        let libRowIdx = -1;
                        const libIdColIdx = libHeaders.indexOf(idField);
                        const libNameColIdx = libHeaders.indexOf(nameField);
                        
                        if (itemId && libIdColIdx !== -1) {
                            libRowIdx = libSheet.content.findIndex((r, i) => i > 0 && r[libIdColIdx] === itemId);
                        }
                        
                        // 如果没找到 ID，尝试通过名称查找
                        if (libRowIdx === -1 && itemName && libNameColIdx !== -1) {
                            libRowIdx = libSheet.content.findIndex((r, i) => i > 0 && r[libNameColIdx] === itemName);
                            if (libRowIdx !== -1) {
                                itemId = libSheet.content[libRowIdx][libIdColIdx]; // 使用现有的 ID
                            }
                        }
                        
                        // 如果还是没找到，创建新的
                        if (libRowIdx === -1) {
                            if (!itemId) itemId = (idField.startsWith('SKILL') ? 'SKL_' : 'FEAT_') + Math.random().toString(36).substr(2, 8);
                            
                            const newRow = libHeaders.map(h => {
                                if (h === idField) return itemId;
                                if (fixedType && h === typeField) return fixedType;
                                return item[h] !== undefined ? item[h] : null;
                            });
                            libSheet.content.push(newRow);
                        }
                        
                        // 2. 处理关联 (Link)
                        const linkCharColIdx = linkHeaders.indexOf('CHAR_ID');
                        const linkItemColIdx = linkHeaders.indexOf(idField);
                        
                        if (linkCharColIdx !== -1 && linkItemColIdx !== -1) {
                            // 检查是否已存在关联
                            const linkExists = linkSheet.content.some((r, i) =>
                                i > 0 && r[linkCharColIdx] === charId && r[linkItemColIdx] === itemId
                            );
                            
                            if (!linkExists) {
                                const newLinkRow = linkHeaders.map(h => {
                                    if (h === 'LINK_ID') return 'LNK_' + Math.random().toString(36).substr(2, 8);
                                    if (h === 'CHAR_ID') return charId;
                                    if (h === idField) return itemId;
                                    return item[h] !== undefined ? item[h] : null;
                                });
                                linkSheet.content.push(newLinkRow);
                            }
                        }
                    });
                });
            };

            // 处理技能
            processAuxData(jsonData.skills, 'SKILL_Library', 'CHARACTER_Skills', 'SKILL_ID', '技能名称');
            // 处理法术 (也是技能库，但可能有特殊字段)
            processAuxData(jsonData.spells, 'SKILL_Library', 'CHARACTER_Skills', 'SKILL_ID', '技能名称', '技能类型', '法术');
            // 处理专长
            processAuxData(jsonData.feats, 'FEAT_Library', 'CHARACTER_Feats', 'FEAT_ID', '专长名称');

            // 保存
            await DiceManager.saveData(rawData);

            return {
                success: true,
                message: `成功导入 ${jsonData.party.length} 个角色`,
                count: jsonData.party.length
            };
        } catch (err) {
            console.error('[DND DataManager] 导入队伍数据失败:', err);
            return { success: false, message: '导入失败: ' + err.message };
        }
    },

    // [新增] 导入 FVTT 角色数据
    importFVTTData: async (json) => {
        try {
            const api = DataManager.getAPI();
            if (!api) return { success: false, message: 'API 不可用' };

            // 简单验证
            if (!json.name || !json.system) {
                return { success: false, message: '无效的 FVTT 角色文件' };
            }

            // 1. 解析基础信息
            const name = json.name;
            const sys = json.system;
            const details = sys.details || {};
            const abilities = sys.abilities || {};
            const attributes = sys.attributes || {};
            
            // 职业
            const classItems = (json.items || []).filter(i => i.type === 'class');
            const classStr = classItems.map(c => `${c.name} ${(c.system?.levels || 1)}`).join(' / ') || '平民 1';
            const level = details.level || classItems.reduce((acc, c) => acc + (c.system?.levels || 0), 0) || 1;

            // 种族
            const raceItem = (json.items || []).find(i => i.type === 'race');
            const raceStr = raceItem ? raceItem.name : (details.race || '未知种族');

            // 属性
            const stats = {};
            const abbrMap = { str:'STR', dex:'DEX', con:'CON', int:'INT', wis:'WIS', cha:'CHA' };
            Object.keys(abilities).forEach(k => {
                if (abbrMap[k]) stats[abbrMap[k]] = abilities[k].value || 10;
            });

            // 技能
            const skillMap = {
                'acr': '杂技', 'ani': '驯兽', 'arc': '奥秘', 'ath': '运动',
                'dec': '欺瞒', 'his': '历史', 'ins': '洞悉', 'itm': '威吓',
                'inv': '调查', 'med': '医药', 'nat': '自然', 'prc': '察觉',
                'prf': '表演', 'per': '说服', 'rel': '宗教', 'slt': '手法',
                'ste': '隐匿', 'sur': '生存'
            };
            const profSkills = [];
            if (sys.skills) {
                Object.keys(sys.skills).forEach(k => {
                    if (sys.skills[k].value >= 1) { // 1=熟练, 2=专精
                        profSkills.push(skillMap[k] || k);
                    }
                });
            }

            // 豁免
            const saves = [];
            Object.keys(abilities).forEach(k => {
                if (abilities[k].proficient >= 1) saves.push(skillMap[k] || k.toUpperCase()); // 简单映射
            });

            // 构建导入对象
            const charData = {
                'CHAR_ID': 'FVTT_' + Date.now(),
                '成员类型': '同伴',
                '姓名': name,
                '种族/性别/年龄': `${raceStr} / - / -`,
                '职业': classStr,
                '外貌描述': details.appearance || '',
                '性格特点': (details.trait || '') + ' ' + (details.ideal || '') + ' ' + (details.bond || '') + ' ' + (details.flaw || ''),
                '背景故事': details.biography?.value?.replace(/<[^>]+>/g, '') || '', // 去除 HTML
                '加入时间': new Date().toISOString().slice(0,10),
                
                // Attributes
                '等级': level,
                'HP': `${attributes.hp?.value || 0}/${attributes.hp?.max || 1}`,
                'AC': attributes.ac?.value || 10,
                '先攻加值': attributes.init?.total || 0,
                '速度': attributes.movement?.walk ? `${attributes.movement.walk}尺` : '30尺',
                '属性值': JSON.stringify(stats),
                '豁免熟练': JSON.stringify(saves),
                '技能熟练': JSON.stringify(profSkills),
                '被动感知': sys.skills?.prc?.passive || 10,
                
                // Resources
                '法术位': '', // 暂不解析法术位详情
                '金币': sys.currency ? (sys.currency.gp || 0) : 0,
                '生命骰': `${attributes.hd || 0}/${attributes.hd || 0}`
            };

            // 解析物品 (Inventory)
            const inventory = [];
            (json.items || []).forEach(item => {
                if (['weapon', 'equipment', 'consumable', 'loot', 'backpack'].includes(item.type)) {
                    inventory.push({
                        '物品ID': item.name, // 简单使用名称
                        '物品名称': item.name,
                        '类别': item.type === 'weapon' ? '武器' : (item.type === 'equipment' ? '护甲' : '杂物'),
                        '数量': item.system?.quantity || 1,
                        '已装备': item.system?.equipped ? '是' : '否',
                        '所属人': name,
                        '稀有度': item.system?.rarity || '普通',
                        '描述': item.system?.description?.value?.replace(/<[^>]+>/g, '') || '',
                        '重量': item.system?.weight || 0,
                        '价值': item.system?.price?.value ? `${item.system.price.value}gp` : '-'
                    });
                }
            });

            // 解析法术 (Spells) -> 存入技能库并关联
            const spells = [];
            (json.items || []).forEach(item => {
                if (item.type === 'spell') {
                    spells.push({
                        'SKILL_ID': item.name, // 临时ID
                        '技能名称': item.name,
                        '技能类型': '法术',
                        '环阶': item.system?.level || 0,
                        '学派': item.system?.school || '-',
                        '施法时间': item.system?.activation?.type || '-',
                        '射程': item.system?.range?.value ? `${item.system.range.value} ${item.system.range.units}` : '-',
                        '成分': item.system?.components ? Object.keys(item.system.components).filter(k=>item.system.components[k]).join(',').toUpperCase() : '-',
                        '持续时间': item.system?.duration?.value ? `${item.system.duration.value} ${item.system.duration.units}` : '-',
                        '效果描述': item.system?.description?.value?.replace(/<[^>]+>/g, '') || ''
                    });
                }
            });

            // 开始写入数据库
            // 1. 获取现有数据
            const rawData = api.exportTableAsJson();
            const tableData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

            // 2. 写入角色注册表
            const regKey = DataManager.findTableKey(tableData, 'CHARACTER_Registry');
            const regSheet = regKey ? tableData[regKey] : null;
            if (regSheet && regSheet.content) {
                // 映射字段并添加行
                const headers = regSheet.content[0];
                const newRow = headers.map(h => charData[h] !== undefined ? charData[h] : null);
                regSheet.content.push(newRow);
            }

            // 3. 写入角色属性表
            const attrKey = DataManager.findTableKey(tableData, 'CHARACTER_Attributes');
            const attrSheet = attrKey ? tableData[attrKey] : null;
            if (attrSheet && attrSheet.content) {
                const headers = attrSheet.content[0];
                const newRow = headers.map(h => charData[h] !== undefined ? charData[h] : null);
                attrSheet.content.push(newRow);
            }

            // 4. 写入角色资源表
            const resKey = DataManager.findTableKey(tableData, 'CHARACTER_Resources');
            const resSheet = resKey ? tableData[resKey] : null;
            if (resSheet && resSheet.content) {
                const headers = resSheet.content[0];
                const newRow = headers.map(h => charData[h] !== undefined ? charData[h] : null);
                resSheet.content.push(newRow);
            }

            // 5. 写入物品表 (批量)
            const invKey = DataManager.findTableKey(tableData, 'ITEM_Inventory');
            const invSheet = invKey ? tableData[invKey] : null;
            if (invSheet && invSheet.content) {
                const headers = invSheet.content[0];
                inventory.forEach(item => {
                    const newRow = headers.map(h => item[h] !== undefined ? item[h] : null);
                    invSheet.content.push(newRow);
                });
            }

            // 6. 写入技能库和关联 (简化处理：只写入库，不查重可能导致冗余，暂不优化)
            const libKey = DataManager.findTableKey(tableData, 'SKILL_Library');
            const libSheet = libKey ? tableData[libKey] : null;
            
            const linkKey = DataManager.findTableKey(tableData, 'CHARACTER_Skills');
            const linkSheet = linkKey ? tableData[linkKey] : null;
            
            if (libSheet && libSheet.content && linkSheet && linkSheet.content) {
                const libHeaders = libSheet.content[0];
                const linkHeaders = linkSheet.content[0];
                
                spells.forEach(spell => {
                    // 添加到库 (如果不存在)
                    const exists = libSheet.content.some(r => r[1] === spell['技能名称']); // 假设列1是名称
                    let skillId = 'SKL_' + Math.random().toString(36).substr(2, 6);
                    
                    if (!exists) {
                        const libRow = libHeaders.map(h => {
                            if (h === 'SKILL_ID') return skillId;
                            return spell[h] !== undefined ? spell[h] : null;
                        });
                        libSheet.content.push(libRow);
                    } else {
                        // 查找现有ID
                        const row = libSheet.content.find(r => r[1] === spell['技能名称']);
                        if (row) skillId = row[libHeaders.indexOf('SKILL_ID')];
                    }
                    
                    // 添加关联
                    const linkRow = linkHeaders.map(h => {
                        if (h === 'LINK_ID') return 'LNK_' + Math.random().toString(36).substr(2, 6);
                        if (h === 'CHAR_ID') return charData['CHAR_ID'];
                        if (h === 'SKILL_ID') return skillId;
                        if (h === '已准备') return '是'; // 默认已准备
                        return null;
                    });
                    linkSheet.content.push(linkRow);
                });
            }

            // 保存
            await api.importTableAsJson(JSON.stringify(tableData));

            return { success: true, message: `成功导入 FVTT 角色: ${name}` };

        } catch (err) {
            console.error('[DND DataManager] FVTT 导入失败:', err);
            return { success: false, message: '解析或保存失败: ' + err.message };
        }
    }
};

;// ./src/ui/modules/UIUtils.js



// ============================================
// 自定义通知/对话框系统
// 替代浏览器原生 alert/confirm/prompt
// ============================================

const NotificationSystem = {
    _container: null,
    _dialogContainer: null,

    // 初始化容器
    _ensureContainer() {
        const { $ } = getCore();
        if (!this._container) {
            this._container = $('<div id="dnd-notification-container"></div>');
            $('body').append(this._container);
        }
        if (!this._dialogContainer) {
            this._dialogContainer = $('<div id="dnd-dialog-container"></div>');
            $('body').append(this._dialogContainer);
        }
    },

    /**
     * 显示通知消息 (替代 alert)
     * @param {string} message - 消息内容
     * @param {Object} options - 配置选项
     * @param {string} options.type - 类型: 'info' | 'success' | 'warning' | 'error'
     * @param {number} options.duration - 显示时长(ms), 0 表示不自动关闭
     * @param {string} options.title - 可选标题
     * @returns {Promise<void>}
     */
    notify(message, options = {}) {
        const { $ } = getCore();
        this._ensureContainer();
        
        const {
            type = 'info',
            duration = 3000,
            title = ''
        } = options;

        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const $toast = $(`
            <div class="dnd-toast dnd-toast-${type}">
                <div class="dnd-toast-icon">${icons[type] || icons.info}</div>
                <div class="dnd-toast-content">
                    ${title ? `<div class="dnd-toast-title">${title}</div>` : ''}
                    <div class="dnd-toast-message">${message}</div>
                </div>
                <button class="dnd-toast-close">×</button>
            </div>
        `);

        // 关闭按钮事件
        $toast.find('.dnd-toast-close').on('click', () => {
            this._dismissToast($toast);
        });

        this._container.append($toast);

        // 触发入场动画
        requestAnimationFrame(() => {
            $toast.addClass('dnd-toast-visible');
        });

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this._dismissToast($toast);
            }, duration);
        }

        return Promise.resolve();
    },

    _dismissToast($toast) {
        $toast.removeClass('dnd-toast-visible');
        $toast.addClass('dnd-toast-exit');
        setTimeout(() => {
            $toast.remove();
        }, 300);
    },

    /**
     * 显示确认对话框 (替代 confirm)
     * @param {string} message - 消息内容
     * @param {Object} options - 配置选项
     * @param {string} options.title - 标题
     * @param {string} options.confirmText - 确认按钮文字
     * @param {string} options.cancelText - 取消按钮文字
     * @param {string} options.type - 类型: 'info' | 'warning' | 'danger'
     * @returns {Promise<boolean>}
     */
    confirm(message, options = {}) {
        const { $ } = getCore();
        this._ensureContainer();

        const {
            title = '确认',
            confirmText = '确定',
            cancelText = '取消',
            type = 'info'
        } = options;

        return new Promise((resolve) => {
            const $backdrop = $('<div class="dnd-dialog-backdrop"></div>');
            const $dialog = $(`
                <div class="dnd-dialog dnd-dialog-${type}">
                    <div class="dnd-dialog-header">
                        <span class="dnd-dialog-title">${title}</span>
                        <button class="dnd-dialog-close">×</button>
                    </div>
                    <div class="dnd-dialog-body">
                        <p class="dnd-dialog-message">${message}</p>
                    </div>
                    <div class="dnd-dialog-footer">
                        <button class="dnd-dialog-btn dnd-dialog-btn-cancel">${cancelText}</button>
                        <button class="dnd-dialog-btn dnd-dialog-btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `);

            const closeDialog = (result) => {
                $dialog.removeClass('dnd-dialog-visible');
                $backdrop.removeClass('dnd-dialog-backdrop-visible');
                setTimeout(() => {
                    $backdrop.remove();
                    $dialog.remove();
                }, 200);
                resolve(result);
            };

            $dialog.find('.dnd-dialog-btn-confirm').on('click', () => closeDialog(true));
            $dialog.find('.dnd-dialog-btn-cancel').on('click', () => closeDialog(false));
            $dialog.find('.dnd-dialog-close').on('click', () => closeDialog(false));
            $backdrop.on('click', () => closeDialog(false));

            // ESC 键关闭
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeDialog(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            this._dialogContainer.append($backdrop).append($dialog);

            requestAnimationFrame(() => {
                $backdrop.addClass('dnd-dialog-backdrop-visible');
                $dialog.addClass('dnd-dialog-visible');
            });
        });
    },

    /**
     * 显示输入对话框 (替代 prompt)
     * @param {string} message - 提示消息
     * @param {Object} options - 配置选项
     * @param {string} options.title - 标题
     * @param {string} options.defaultValue - 默认值
     * @param {string} options.placeholder - 占位符
     * @param {string} options.confirmText - 确认按钮文字
     * @param {string} options.cancelText - 取消按钮文字
     * @returns {Promise<string|null>}
     */
    prompt(message, options = {}) {
        const { $ } = getCore();
        this._ensureContainer();

        const {
            title = '请输入',
            defaultValue = '',
            placeholder = '',
            confirmText = '确定',
            cancelText = '取消'
        } = options;

        return new Promise((resolve) => {
            const $backdrop = $('<div class="dnd-dialog-backdrop"></div>');
            const $dialog = $(`
                <div class="dnd-dialog dnd-dialog-prompt">
                    <div class="dnd-dialog-header">
                        <span class="dnd-dialog-title">${title}</span>
                        <button class="dnd-dialog-close">×</button>
                    </div>
                    <div class="dnd-dialog-body">
                        <p class="dnd-dialog-message">${message}</p>
                        <input type="text" class="dnd-dialog-input" value="${defaultValue}" placeholder="${placeholder}" />
                    </div>
                    <div class="dnd-dialog-footer">
                        <button class="dnd-dialog-btn dnd-dialog-btn-cancel">${cancelText}</button>
                        <button class="dnd-dialog-btn dnd-dialog-btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `);

            const $input = $dialog.find('.dnd-dialog-input');

            const closeDialog = (confirmed) => {
                const value = confirmed ? $input.val() : null;
                $dialog.removeClass('dnd-dialog-visible');
                $backdrop.removeClass('dnd-dialog-backdrop-visible');
                setTimeout(() => {
                    $backdrop.remove();
                    $dialog.remove();
                }, 200);
                resolve(value);
            };

            $dialog.find('.dnd-dialog-btn-confirm').on('click', () => closeDialog(true));
            $dialog.find('.dnd-dialog-btn-cancel').on('click', () => closeDialog(false));
            $dialog.find('.dnd-dialog-close').on('click', () => closeDialog(false));
            $backdrop.on('click', () => closeDialog(false));

            // Enter 确认, ESC 取消
            $input.on('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    closeDialog(true);
                } else if (e.key === 'Escape') {
                    closeDialog(false);
                }
            });

            this._dialogContainer.append($backdrop).append($dialog);

            requestAnimationFrame(() => {
                $backdrop.addClass('dnd-dialog-backdrop-visible');
                $dialog.addClass('dnd-dialog-visible');
                $input.focus().select();
            });
        });
    },

    // 快捷方法
    success(message, title = '') {
        return this.notify(message, { type: 'success', title });
    },

    error(message, title = '') {
        return this.notify(message, { type: 'error', title, duration: 5000 });
    },

    warning(message, title = '') {
        return this.notify(message, { type: 'warning', title, duration: 4000 });
    },

    info(message, title = '') {
        return this.notify(message, { type: 'info', title });
    }
};

// 导出通知系统


/* harmony default export */ const UIUtils = ({
    // 获取名字首字作为默认头像显示
    getNameInitial(name) {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    },

    // 压缩图片
    compressImage(base64, maxSize, callback) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // 计算缩放比例
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round(height * maxSize / width);
                    width = maxSize;
                } else {
                    width = Math.round(width * maxSize / height);
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转为 JPEG 并压缩
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            callback(compressed);
        };
        img.src = base64;
    },

    // 辅助：填入聊天框
    fillChatInput(text) {
        const { $, window: w } = getCore();
        // 尝试查找 SillyTavern 的输入框
        const $input = $('#send_textarea');
        if ($input.length) {
            const current = $input.val();
            const newVal = current ? (current + ' ' + text) : text;
            $input.val(newVal);
            // 触发 input 事件以适配 Vue/React
            const inputEvent = new Event('input', { bubbles: true });
            $input[0].dispatchEvent(inputEvent);
            $input.focus();
        } else {
            // 如果找不到，尝试复制到剪贴板
            try {
                navigator.clipboard.writeText(text).then(() => {
                    NotificationSystem.success('已复制行动文本到剪贴板', '复制成功');
                });
            } catch(e) {
                NotificationSystem.info(text, '行动文本');
            }
        }
    },

    formatClassRes(resVal) {
        try {
            const res = DataManager.parseValue(resVal, 'resources');
            if (!res) return '';
            
            return Object.keys(res).map(k => {
                return `<span style="background:rgba(255,255,255,0.05);padding:1px 4px;border-radius:3px;margin-right:3px;">${k}: ${res[k]}</span>`;
            }).join('');
        } catch(e) { return ''; }
    },

    // 计算点击的网格坐标
    getGridFromEvent(e, $container, $innerMap) {
        const rect = $container[0].getBoundingClientRect();
        
        // 获取当前的变换状态
        const state = this._mapZoom; // Uses this._mapZoom from the merged object
        const scale = state.scale || 1;
        
        // 更稳健的方法：利用 innerMap 的 getBoundingClientRect
        const innerRect = $innerMap[0].getBoundingClientRect();
        
        // 计算点击点相对于 innerMap 左上角的像素位置
        const relX = e.clientX - innerRect.left;
        const relY = e.clientY - innerRect.top;
        
        // 此时 relX, relY 是受 scale 影响后的屏幕像素值
        // 需要除以 scale 还原回原始像素值
        const originalX = relX / scale;
        const originalY = relY / scale;
        
        // 获取 cellSize (存储在 data 属性中)
        const cellSize = parseFloat($innerMap.data('cell-size')) || 20;
        
        // 转换为网格坐标 (向上取整，因为 0-20px 是第一格)
        const gridX = Math.ceil(originalX / cellSize);
        const gridY = Math.ceil(originalY / cellSize);
        
        return { x: gridX, y: gridY };
    }
});

;// ./src/features/ThemeManager.js
// src/features/ThemeManager.js





const ThemeManager = {
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

;// ./src/features/PresetSwitcher.js
// src/features/PresetSwitcher.js





const PresetSwitcher = {
    // 上一次检测到的战斗状态
    _lastCombatState: null,
    
    // 获取 shujuku 插件 API
    getAPI: function() {
        try {
            // 尝试从不同层级获取 API
            if (window.AutoCardUpdaterAPI) return window.AutoCardUpdaterAPI;
            if (window.parent && window.parent.AutoCardUpdaterAPI) return window.parent.AutoCardUpdaterAPI;
            if (window.top && window.top.AutoCardUpdaterAPI) return window.top.AutoCardUpdaterAPI;
        } catch(e) {
            Logger.error('[PresetSwitcher] 获取 API 失败:', e);
        }
        return null;
    },
    
    // 切换预设
    switchPreset: function(presetName) {
        const api = this.getAPI();
        if (!api) {
            Logger.warn('[PresetSwitcher] AutoCardUpdaterAPI 不可用，无法切换预设');
            return false;
        }
        
        if (!api.switchPlotPreset) {
            Logger.warn('[PresetSwitcher] switchPlotPreset 方法不可用');
            return false;
        }
        
        try {
            const success = api.switchPlotPreset(presetName);
            if (success) {
                Logger.info(`[PresetSwitcher] 预设已切换至: ${presetName}`);
            } else {
                Logger.warn(`[PresetSwitcher] 预设切换失败: ${presetName} (可能不存在)`);
            }
            return success;
        } catch(e) {
            Logger.error('[PresetSwitcher] 切换预设时发生错误:', e);
            return false;
        }
    },
    
    // 检查并处理战斗状态变化
    checkCombatStateChange: function(isCombat) {
        // [新增] 战斗状态变化时，初始化资源追踪器
        if (isCombat && (!this._lastCombatState)) {
            if (UIRenderer && UIRenderer.initResourceTracker) UIRenderer.initResourceTracker();
        }

        // 如果未启用自动切换，直接返回
        if (!CONFIG.PRESET_SWITCHING.ENABLED) return;
        
        // 首次检测，记录状态但不切换
        if (this._lastCombatState === null) {
            this._lastCombatState = isCombat;
            Logger.info(`[PresetSwitcher] 初始化战斗状态: ${isCombat ? '战斗中' : '探索中'}`);
            return;
        }
        
        // 状态未变化，不需要切换
        if (this._lastCombatState === isCombat) return;
        
        // 状态发生变化，执行切换
        this._lastCombatState = isCombat;
        
        const targetPreset = isCombat
            ? CONFIG.PRESET_SWITCHING.COMBAT_PRESET
            : CONFIG.PRESET_SWITCHING.EXPLORE_PRESET;
        
        Logger.info(`[PresetSwitcher] 检测到战斗状态变化: ${isCombat ? '进入战斗' : '退出战斗'}`);
        Logger.info(`[PresetSwitcher] 正在切换预设至: ${targetPreset}`);
        
        // 执行预设切换
        const success = this.switchPreset(targetPreset);
        
        // 显示 HUD 通知
        if (success) {
            this.showNotification(isCombat, `预设已切换: ${targetPreset}`);
        }
    },
    
    // 在 HUD 上显示切换通知
    showNotification: function(isCombat, message) {
        // [Fix] Support single argument (message only)
        if (message === undefined && typeof isCombat === 'string') {
            message = isCombat;
            isCombat = false; // Default to non-combat style
        }

        const { $ } = getCore();
        const $status = $('#dnd-hud-status-text');
        if (!$status.length) return;
        
        const icon = isCombat ? '⚔️' : '🧭';
        const color = isCombat ? 'var(--dnd-accent-red)' : 'var(--dnd-accent-green)';
        const originalHtml = $status.html();
        
        // message 如果是预设名，保持兼容；如果是完整消息，直接显示
        const displayMsg = (message && (message.includes('预设') || message.includes('切换'))) ? message : `通知: ${message}`;
        
        $status.html(`<span style="color:${color};animation:dnd-pulse 1s infinite;">${icon} ${displayMsg}</span>`);
        
        setTimeout(() => {
            // 只有当内容没变时才恢复
            if ($status.text().includes(displayMsg.replace(/<[^>]+>/g, ''))) {
                $status.html(originalHtml);
            }
        }, 3000);
    },
    
    // 获取当前预设名称
    getCurrentPreset: function() {
        const api = this.getAPI();
        if (!api || !api.getCurrentPlotPreset) return null;
        return api.getCurrentPlotPreset();
    },
    
    // 获取可用预设列表
    getAvailablePresets: function() {
        const api = this.getAPI();
        if (!api || !api.getPlotPresetNames) return [];
        return api.getPlotPresetNames();
    }
};

;// ./src/ui/modules/UICore.js









/* harmony default export */ const UICore = ({
    state: 'collapsed', // 'collapsed', 'mini', 'full'
    _lastToggleTime: 0, // 用于防止重复触发
    _controlledCharId: null, // [新增] 当前操控的角色ID，null表示默认PC

    setControlledCharacter(charId) {
        this._controlledCharId = charId;
        // [修复] 先初始化追踪器快照，再渲染HUD，防止显示错误的资源消耗
        if (this.initResourceTracker) this.initResourceTracker();
        // 刷新战斗HUD
        this.renderHUD();
        // 显示切换通知
        PresetSwitcher.showNotification(true, `已切换操控: ${charId || '默认'}`);
    },

    getControlledCharacter() {
        if (this._controlledCharId) {
            const party = DataManager.getPartyData();
            return party.find(p =>
                p['CHAR_ID'] === this._controlledCharId ||
                p['PC_ID'] === this._controlledCharId ||
                p['姓名'] === this._controlledCharId
            );
        }
        return this.getCurrentActiveCharacter();
    },

    // [新增] 获取当前活跃角色 (PC 或 回合轮到的队友)
    getCurrentActiveCharacter() {
        const party = DataManager.getPartyData();
        const encounters = DataManager.getTable('COMBAT_Encounter');
        
        // 1. 尝试从战斗数据中找 "是否为当前行动者"
        if (encounters) {
            const active = encounters.find(e => e['是否为当前行动者'] === '是');
            if (active) {
                // 匹配回 Party 数据以获取详情
                const match = party.find(p => p['姓名'] === active['单位名称']);
                if (match) return match;
            }
        }
        
        // 2. 默认返回 PC
        return party.find(p => p.type === 'PC' || p.isPC) || party[0];
    },

    // [新增] 切换仪表盘状态的辅助方法
    toggleDashboard() {
        Logger.info('toggleDashboard 被调用，当前状态:', this.state);
        this._lastToggleTime = Date.now();
        
        if (this.state === 'collapsed') {
            this.setState('mini');
        } else {
            this.setState('collapsed');
        }
    },

    setState(newState) {
        const { $ } = getCore();
        this.state = newState;
        
        const $full = $('#dnd-dashboard-root');
        const $mini = $('#dnd-mini-hud');
        const $btn = $('#dnd-toggle-btn');

        $full.removeClass('visible');
        $mini.removeClass('visible');
        
        // 确保按钮显示状态 (使用 class 控制动画)
        $btn.show(); // 确保不是 display:none
        
        switch (newState) {
            case 'collapsed':
                $btn.removeClass('dnd-hidden');
                break;
            case 'mini':
                $btn.removeClass('dnd-hidden');
                // 稍微延迟添加 visible 类以触发 transition (如果刚从 display:none 切换)
                requestAnimationFrame(() => $mini.addClass('visible'));
                this.renderHUD();
                break;
            case 'full':
                $btn.addClass('dnd-hidden');
                $full.addClass('visible');
                const $active = $('.dnd-nav-item.active');
                if ($active.length) {
                    this.renderPanel($active.data('target'));
                } else {
                    this.renderPanel('party');
                }
                break;
        }
    },

    init() {
        Logger.info('[UIRenderer] init() called');
        const { $ } = getCore();
        if ($('#dnd-dashboard-root').length) {
            Logger.warn('[UIRenderer] Dashboard already exists, skipping init');
            return;
        }

        const html = `
            <div id="dnd-dashboard-root">
                <div class="dnd-top-bar">
                    <div class="dnd-title">DND Adventure Log</div>
                    <button class="dnd-close-btn" id="dnd-close">✕ 关闭面板</button>
                </div>
                <div class="dnd-main-container">
                    <div class="dnd-nav-sidebar">
                        <div class="dnd-nav-item" data-target="create" style="color:#ffdb85;border-left-color:#ffdb85"><i class="fa-solid fa-plus-circle"></i> 创建角色</div>
                        <div class="dnd-nav-item active" data-target="party"><i class="fa-solid fa-users"></i> 冒险队伍</div>
                        <div class="dnd-nav-item" data-target="npcs"><i class="fa-solid fa-address-book"></i> 人物图鉴</div>
                        <div class="dnd-nav-item" data-target="quests"><i class="fa-solid fa-scroll"></i> 任务日志</div>
                        <div class="dnd-nav-item" data-target="inventory"><i class="fa-solid fa-suitcase"></i> 背包物品</div>
                        <!-- <div class="dnd-nav-item" data-target="combat"><i class="fa-solid fa-swords"></i> 战术地图</div> -->
                        <div class="dnd-nav-item" data-target="world"><i class="fa-solid fa-globe"></i> 世界信息</div>
                        <div class="dnd-nav-item" data-target="logs"><i class="fa-solid fa-book"></i> 历史记录</div>
                        <div class="dnd-nav-item" data-target="archives"><i class="fa-solid fa-database"></i> 数据归档</div>
                        <div class="dnd-nav-item" data-target="settings"><i class="fa-solid fa-cog"></i> 设置</div>
                    </div>
                    <div class="dnd-content-area" id="dnd-content">
                        <!-- 内容动态加载 -->
                    </div>
                </div>
                <div class="dnd-modal-overlay" id="dnd-modal-overlay">
                    <div class="dnd-modal" id="dnd-modal-content"></div>
                </div>
            </div>
            
            <!-- 简略版 HUD -->
            <div id="dnd-mini-hud">
                <div class="dnd-hud-header">
                    <!-- Logo (点击切换/展开) -->
                    <div id="dnd-logo-container" title="DND 仪表盘">
                        <span class="dnd-logo-text">D20</span>
                    </div>
                    
                    <div class="dnd-hud-status" id="dnd-hud-status-text">
                        <!-- 动态加载 -->
                    </div>
                    
                    <div style="display:flex;gap:5px;align-items:center;margin-left:10px;">
                        <button class="dnd-hud-expand-btn" id="dnd-hud-theme" title="切换主题">
                            🎨
                        </button>
                    </div>
                </div>
                <div class="dnd-hud-body" id="dnd-hud-body">
                    <!-- 动态加载 -->
                </div>
            </div>

            <!-- 浮窗 Tooltip -->
            <div id="dnd-tooltip"></div>
            
            <div id="dnd-toggle-btn" title="显示 DND 面板">
                <svg viewBox="0 0 100 100" width="24" height="24" style="fill:currentColor;">
                    <polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="none" stroke="currentColor" stroke-width="4"/>
                    <polygon points="50,5 95,30 50,50 5,30" fill="none" stroke="currentColor" stroke-width="2"/>
                    <line x1="50" y1="50" x2="50" y2="95" stroke="currentColor" stroke-width="2"/>
                    <line x1="50" y1="50" x2="95" y2="70" stroke="currentColor" stroke-width="2"/>
                    <line x1="50" y1="50" x2="5" y2="70" stroke="currentColor" stroke-width="2"/>
                    <text x="50" y="58" text-anchor="middle" font-size="24" font-weight="bold" fill="currentColor">20</text>
                </svg>
            </div>
        `;
        $('body').append(html);

        // 事件绑定
        // [恢复] 悬浮球支持拖拽 + 点击切换
        const $btn = $('#dnd-toggle-btn');
        
        // [DEBUG] 检查悬浮球元素
        Logger.debug('🔧 [DEBUG] 悬浮球初始化检查:');
        Logger.debug('  - $btn 元素:', $btn.length > 0 ? '存在' : '不存在');
        Logger.debug('  - $btn[0]:', $btn[0]);
        Logger.debug('  - $btn 位置:', $btn.css('position'), 'top:', $btn.css('top'), 'left:', $btn.css('left'));
        Logger.debug('  - $btn z-index:', $btn.css('z-index'));
        Logger.debug('  - $btn display:', $btn.css('display'));
        Logger.debug('  - $btn pointer-events:', $btn.css('pointer-events'));

        // 恢复保存的位置（从设置中读取）
        DBAdapter.getSetting(CONFIG.STORAGE_KEYS.TOGGLE_POS).then(savedPos => {
            if (savedPos) {
                try {
                    // 尝试多次解析以防双重编码
                    let pos = savedPos;
                    if (typeof pos === 'string') {
                        try { pos = JSON.parse(pos); } catch(e) {}
                    }
                    if (typeof pos === 'string') {
                        try { pos = JSON.parse(pos); } catch(e) {}
                    }

                    if (pos && pos.left) {
                        // [Fix] Ensure we override CSS !important rules
                        const btn = $btn[0];
                        if (btn) {
                            btn.style.setProperty('left', pos.left, 'important');
                            btn.style.setProperty('top', pos.top, 'important');
                            btn.style.setProperty('right', 'auto', 'important');
                            btn.style.setProperty('bottom', 'auto', 'important');
                            // 初始位置恢复后更新 HUD
                            setTimeout(() => this.updateHUDPosition(), 100);
                        }
                        Logger.debug('🔧 [DEBUG] 恢复保存的位置:', pos);
                    } else {
                        Logger.warn('🔧 [DEBUG] 位置数据无效:', savedPos);
                    }
                } catch(e) {
                    Logger.warn('🔧 [DEBUG] 位置恢复失败:', e);
                }
            }
        });

        // 拖拽状态管理
        let isDragging = false;
        let dragStartX = 0, dragStartY = 0;
        let btnStartX = 0, btnStartY = 0;
        const DRAG_THRESHOLD = 5; // 拖拽阈值（像素）

        // [优化] 使用原生 Pointer Events API 实现拖拽
        const handlePointerDown = (e) => {
            const btnDom = $btn[0];
            Logger.debug('🖱️ [PointerDown] Triggered', { type: e.type, x: e.screenX, y: e.screenY });

            // 视觉反馈：红色高亮
            btnDom.style.borderColor = '#ff0000';
            btnDom.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.8)';

            if (e.button !== 0 && e.pointerType === 'mouse') return;
            
            // 阻止默认行为
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            
            isDragging = false;
            // [关键修改] 使用 screenX/Y 避免 iframe 坐标系问题
            dragStartX = e.screenX;
            dragStartY = e.screenY;
            
            // 获取当前位置 (相对于视口)
            const rect = btnDom.getBoundingClientRect();
            btnStartX = rect.left;
            btnStartY = rect.top;
            
            if (btnDom.setPointerCapture) {
                try {
                    btnDom.setPointerCapture(e.pointerId);
                    Logger.debug('🖱️ [PointerDown] Capture set');
                } catch (err) {
                    Logger.warn('setPointerCapture failed:', err);
                }
            }
            
            // 绑定到 window
            const win = btnDom.ownerDocument.defaultView || window;
            win.addEventListener('pointermove', handlePointerMove);
            win.addEventListener('pointerup', handlePointerUp);
            win.addEventListener('pointercancel', handlePointerUp);
            win.addEventListener('blur', handlePointerUp);
        };

        const handlePointerMove = (e) => {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();

            // [关键修改] 使用 screenX/Y 计算位移
            const dx = e.screenX - dragStartX;
            const dy = e.screenY - dragStartY;
            
            // 始终记录一些移动日志以供调试 (节流)
            if (Math.random() < 0.05) {
                Logger.debug(`🖱️ [Move] dx:${dx} dy:${dy} screen:${e.screenX},${e.screenY}`);
            }
            
            if (!isDragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
                isDragging = true;
                $btn.addClass('is-dragging');
                Logger.debug('🚀 [Drag Start] Threshold passed');
            }

            if (isDragging) {
                let newLeft = btnStartX + dx;
                let newTop = btnStartY + dy;
                
                const btnDom = $btn[0];
                const win = btnDom.ownerDocument.defaultView || window;
                const winW = win.innerWidth;
                const winH = win.innerHeight;
                const btnSize = CONFIG.SIZE.TOGGLE_BTN;
                
                // 边界限制
                newLeft = Math.max(5, Math.min(newLeft, winW - btnSize - 5));
                newTop = Math.max(5, Math.min(newTop, winH - btnSize - 5));
                
                // [关键修改] 直接操作 DOM 样式，使用 setProperty 覆盖 !important
                btnDom.style.setProperty('left', newLeft + 'px', 'important');
                btnDom.style.setProperty('top', newTop + 'px', 'important');
                btnDom.style.setProperty('right', 'auto', 'important');
                btnDom.style.setProperty('bottom', 'auto', 'important');
                btnDom.style.setProperty('transition', 'none', 'important');
                
                // 实时更新 HUD 位置
                this.updateHUDPosition();
            }
        };


        const handlePointerUp = (e) => {
            console.log('[DND Debug] 🖱️ PointerUp/Cancel/Blur', e.type);
            
            const btnDom = $btn[0];
            const win = btnDom.ownerDocument.defaultView || window;
            
            btnDom.style.borderColor = ''; 
            btnDom.style.boxShadow = '';
            
            win.removeEventListener('pointermove', handlePointerMove);
            win.removeEventListener('pointerup', handlePointerUp);
            win.removeEventListener('pointercancel', handlePointerUp);
            win.removeEventListener('blur', handlePointerUp);
            
            if (btnDom.releasePointerCapture) {
                try {
                    btnDom.releasePointerCapture(e.pointerId);
                } catch (err) {}
            }
            
            $btn.css('transition', '');
            
            if (isDragging) {
                const rect = btnDom.getBoundingClientRect();
                safeSave(CONFIG.STORAGE_KEYS.TOGGLE_POS, JSON.stringify({
                    left: rect.left + 'px',
                    top: rect.top + 'px'
                }));
                this.updateHUDPosition();
                setTimeout(() => $btn.removeClass('is-dragging'), 50);
            } else if (e.type === 'pointerup') {
                // 仅 pointerup 时触发点击（排除 cancel/blur）
                if (this.state === 'collapsed') {
                    this.setState('mini');
                } else {
                    this.setState('collapsed');
                }
            }
            
            isDragging = false;
        };

        // [核心] 绑定 Pointer Events (使用原生事件以避免 jQuery 兼容性问题)
        const btnDom = $btn[0];
        
        // 强制设置防干扰样式
        btnDom.style.touchAction = 'none';
        btnDom.style.userSelect = 'none';
        btnDom.style.webkitUserSelect = 'none';
        
        btnDom.addEventListener('pointerdown', handlePointerDown);
        
        // 额外防止 touchstart 触发滚动/选择 (兼容性)
        btnDom.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
        }, { passive: false });

        // 移除旧的 onclick 绑定
        btnDom.onclick = null;
        
        // 监听窗口调整
        $(window).on('resize.dnd', () => this.updateHUDPosition());

        // [新增] 定时器强制更新位置 (防止样式被覆盖或初始化失败)
        setInterval(() => this.updateHUDPosition(), 1000);

        // [DEBUG] 检查是否有元素遮挡悬浮球
        setTimeout(() => {
            const btnRect = $btn[0].getBoundingClientRect();
            const centerX = btnRect.left + btnRect.width / 2;
            const centerY = btnRect.top + btnRect.height / 2;
            const elementAtPoint = document.elementFromPoint(centerX, centerY);
            
            Logger.debug('🔧 [DEBUG] 遮挡检测:');
            Logger.debug('  - 悬浮球中心:', centerX, centerY);
            Logger.debug('  - 该位置顶层元素:', elementAtPoint);
            Logger.debug('  - 是否是悬浮球本身:', elementAtPoint === $btn[0] || $.contains($btn[0], elementAtPoint));
            
            if (elementAtPoint && elementAtPoint !== $btn[0] && !$.contains($btn[0], elementAtPoint)) {
                Logger.error('🔧 [DEBUG] ❌ 悬浮球被其他元素遮挡:', elementAtPoint);
                Logger.error('  - 遮挡元素 ID:', elementAtPoint.id);
                Logger.error('  - 遮挡元素 class:', elementAtPoint.className);
                Logger.error('  - 遮挡元素 z-index:', window.getComputedStyle(elementAtPoint).zIndex);
            }
        }, 1000);

        $('#dnd-close').on('click', () => this.setState('mini'));
        
        // Logo 点击事件：切换完整面板
        $('#dnd-logo-container').on('click', (e) => {
            e.stopPropagation();
            // 简单的动画反馈
            const $logo = $('#dnd-logo-container');
            $logo.css('transform', 'scale(0.9)');
            setTimeout(() => $logo.css('transform', ''), 150);
            
            this.setState('full');
        });
        
        
        // 主题切换按钮
        $('#dnd-hud-theme').on('click', function(e) {
            e.stopPropagation();
            try {
                const themes = ThemeManager.getList();
                const currentIdx = themes.findIndex(t => t.id === ThemeManager.currentTheme);
                const nextIdx = (currentIdx + 1) % themes.length;
                
                Logger.debug('Switching theme from', ThemeManager.currentTheme, 'to', themes[nextIdx].id);
                ThemeManager.apply(themes[nextIdx].id);
                
                // 视觉反馈
                const theme = themes[nextIdx];
                $(this).attr('title', theme.name);
                
                // HUD 状态栏显示切换提示
                const $status = $('#dnd-hud-status-text');
                const originalHtml = $status.html();
                $status.html(`<span style="color:var(--dnd-text-highlight);">${theme.icon} 主题: ${theme.name}</span>`);
                setTimeout(() => {
                    if ($status.text().includes(theme.name)) $status.html(originalHtml);
                }, 2000);
            } catch (err) {
                Logger.error('Theme switch failed:', err);
            }
        });

        // Use arrow function for `this` context binding
        const self = this;
        $('.dnd-nav-item').on('click', function() {
            $('.dnd-nav-item').removeClass('active');
            $(this).addClass('active');
            const target = $(this).data('target');
            // 角色创建现在使用内置面板
            self.renderPanel(target);
        });
        
        $('#dnd-modal-overlay').on('click', function(e) {
            if (e.target.id === 'dnd-modal-overlay') $(this).removeClass('active');
        });

        // 初始状态
        this.setState('collapsed');
        
        // [新增] 全局快捷键支持
        $(document).on('keydown.dndHotkeys', (e) => {
            // 忽略输入框内的按键
            if ($(e.target).is('input, textarea, [contenteditable="true"]')) return;
            
            const key = e.key;
            const keyCode = e.keyCode;
            
            // ESC - 关闭面板/弹窗
            if (key === 'Escape' || keyCode === 27) {
                // 优先关闭弹窗
                if ($('#dnd-detail-popup-el').hasClass('visible')) {
                    this.hideDetailPopup();
                    e.preventDefault();
                    return;
                }
                // 其次关闭角色详情卡
                if ($('#dnd-char-detail-card-el').hasClass('visible')) {
                    this.hideCharacterCard();
                    e.preventDefault();
                    return;
                }
                // 最后关闭主面板/HUD
                if (this.state !== 'collapsed') {
                    this.setState('collapsed');
                    e.preventDefault();
                    return;
                }
            }
            
            // 数字键 1-9 - 快速切换到对应角色 (仅在 mini 状态下生效)
            if (this.state === 'mini' && key >= '1' && key <= '9') {
                const idx = parseInt(key) - 1;
                const party = DataManager.getPartyData();
                if (party && party[idx]) {
                    const { window: coreWin } = getCore();
                    this.showCharacterCard(party[idx], { clientX: coreWin.innerWidth / 2, clientY: 100 });
                    e.preventDefault();
                    return;
                }
            }
            
            // Tab - 切换 HUD 显示/隐藏 (按住 Alt 时)
            if (e.altKey && (key === 'Tab' || keyCode === 9)) {
                this.toggleDashboard();
                e.preventDefault();
                return;
            }
            
            // D - 快速投骰子 (按住 Alt 时)
            if (e.altKey && (key === 'd' || key === 'D')) {
                const roll = Math.floor(Math.random() * 20) + 1;
                NotificationSystem.info(`🎲 D20: ${roll}`, '快速投骰');
                e.preventDefault();
                return;
            }
        });
        
        // 全局事件委托：头像双击上传
        $(document).on('dblclick', '.dnd-avatar-container', (e) => {
            e.stopPropagation();
            const $target = $(e.currentTarget);
            const charId = $target.data('char-id');
            const charName = $target.attr('title') || $target.find('span').text() || $target.find('.dnd-avatar-initial').text() || '角色';
            
            if (charId) {
                // 验证是否为主角或队友 (只允许修改己方头像)
                const party = DataManager.getPartyData();
                const isPartyMember = party && party.some(p => {
                    // 匹配 ID 或 姓名
                    return (p['PC_ID'] == charId) || 
                        (p['CHAR_ID'] == charId) || 
                        (p['姓名'] == charId) || 
                        (p['姓名'] == charName);
                });

                if (isPartyMember) {
                    this.showAvatarUploadDialog(charId, charName);
                } else {
                    console.log('[DND Dashboard] 仅限修改主角或队友头像');
                    // 可以选择添加一个视觉反馈，比如 shake 动画
                    const $el = $target;
                    $el.css('animation', 'none');
                    setTimeout(() => $el.css('animation', 'dnd-shake 0.3s'), 10);
                    
                    // 添加 shake 动画样式
                    if (!$('#dnd-shake-style').length) {
                        $('head').append(`<style id="dnd-shake-style">@keyframes dnd-shake { 0% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } 100% { transform: translateX(0); } }</style>`);
                    }
                }
            }
        });
    }
});

;// ./src/ui/modules/UIHUD.js








/* harmony default export */ const UIHUD = ({
    renderHUD() {
        const { $ } = getCore();
        const $hud = $('#dnd-mini-hud');
        const $body = $('#dnd-hud-body');
        const $status = $('#dnd-hud-status-text');
        
        if (!$hud.length) return;
        
        // 仅在 mini 状态下渲染
        if (this.state !== 'mini') return;

        // 获取全局状态
        const global = DataManager.getTable('SYS_GlobalState');
        const gInfo = (global && global[0]) ? global[0] : { '当前场景': '未知', '游戏时间': '', '天气状况': '', '战斗模式': '' };
        const weather = gInfo['天气状况'] || '';
        
        // 检查战斗状态 - 通过全局状态的"战斗模式"字段判断，只有为"战斗中"才触发战斗HUD
        const isCombat = gInfo['战斗模式'] === '战斗中';
        
        // [新增] 检测战斗状态变化并切换预设
        PresetSwitcher.checkCombatStateChange(isCombat);

        // 提取时间 (仅显示 HH:MM 或原始内容)
        const timeStr = gInfo['游戏时间'] && gInfo['游戏时间'].includes(' ') ? gInfo['游戏时间'].split(' ')[1] : gInfo['游戏时间'];
        // 提取天气图标 (简单匹配)
        const weatherIcon = weather ? (weather.match(/[🌤️☀️☁️🌧️⛈️🌩️🌨️❄️🌫️🌪️]/)?.[0] || '🌤️') : '';

        // [修复] 恢复头部完整显示逻辑 - 优化布局和图标显示
        const statusIcon = isCombat ? '⚔️' : '🧭';
        const statusText = isCombat ? '战斗中' : '探索中';
        const statusColor = isCombat ? 'var(--dnd-accent-red)' : 'var(--dnd-accent-green)';
        
        // 构建信息行 (时间 | 天气 | 状态)
        const infoParts = [];
        if (timeStr) infoParts.push(`<span title="游戏时间">⏰ ${timeStr}</span>`);
        if (weather || weatherIcon) infoParts.push(`<span title="${weather}">${weatherIcon} ${weather}</span>`);
        infoParts.push(`<span style="color:${statusColor}">${statusIcon} ${statusText}</span>`);
        
        $status.html(`
            <div id="dnd-hud-location" class="dnd-location-text dnd-hud-entry" title="${gInfo['当前场景']}">
                ${gInfo['当前场景']}
            </div>
            <div class="dnd-hud-info-row dnd-hud-entry" style="animation-delay: 0.1s;">
                ${infoParts.join('<span style="color:#444;margin:0 6px;">|</span>')}
            </div>
        `);
        
        // 添加展开按钮 (如果尚未存在)
        if ($('#dnd-hud-toggle-bar').length === 0) {
            const $toggleBar = $(`<div id="dnd-hud-toggle-bar" style="height:12px;background:linear-gradient(to bottom, #1a1a1a, #0a0a0a);border-bottom:1px solid var(--dnd-border-inner);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#666;font-size:8px;transition:all 0.2s;" title="展开/收起头部">▼</div>`);
            
            $toggleBar.hover(
                function() { $(this).css({color: 'var(--dnd-text-highlight)', background: 'rgba(255,255,255,0.05)'}); },
                function() { $(this).css({color: '#666', background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)'}); }
            );
            
            $toggleBar.on('click', function() {
                const $loc = $('#dnd-hud-location');
                const isExpanded = $loc.hasClass('dnd-expanded');
                
                if (isExpanded) {
                    $loc.removeClass('dnd-expanded');
                    $(this).text('▼').attr('title', '展开头部');
                } else {
                    $loc.addClass('dnd-expanded');
                    $(this).text('▲').attr('title', '收起头部');
                }
            });
            
            // 插入到 Header 和 Body 之间
            $('#dnd-mini-hud .dnd-hud-header').after($toggleBar);
        }

        // 清空主体
        $body.empty();

        if (isCombat) {
            this.renderCombatHUD($body);
        } else {
            this.renderExploreHUD($body);
        }

        // [优化] 渲染常驻横向队伍栏 (替代原有的折叠列表)
        this.renderPartyBar($body);

        // [新增] 渲染主角法术位 (迷你版)
        this.renderMiniSpellSlots($body);

        // [优化] 渲染快捷物品栏 (替代原有的下拉列表)
        this.renderQuickInventory($body);

        // 渲染常驻资源栏
        this.renderFooter($body);

        // [新增] 渲染行动队列面板 (如果有待执行行动)
        if (this._actionQueue && this._actionQueue.length > 0) {
            const $queuePanel = $(`
                <div style="margin-top:10px;background:rgba(0,0,0,0.3);border:1px solid var(--dnd-border-gold);border-radius:4px;overflow:hidden;">
                    <div style="background:rgba(197, 160, 89, 0.1);padding:5px 10px;font-weight:bold;color:var(--dnd-text-highlight);display:flex;justify-content:space-between;align-items:center;">
                        <span>⏳ 待执行行动 (${this._actionQueue.length})</span>
                        <div style="display:flex;gap:5px;">
                            <button class="dnd-clickable" onclick="window.DND_Dashboard_UI.commitActions()" style="background:var(--dnd-accent-green);border:none;color:#fff;padding:2px 8px;border-radius:3px;cursor:pointer;">✅ 执行</button>
                            <button class="dnd-clickable" onclick="window.DND_Dashboard_UI.clearActions()" style="background:var(--dnd-accent-red);border:none;color:#fff;padding:2px 8px;border-radius:3px;cursor:pointer;">❌ 清空</button>
                        </div>
                    </div>
                    <div style="padding:5px 10px;font-size:12px;color:#ccc;">
                        ${this._actionQueue.map((a, i) => `<div style="margin-bottom:2px;">${i+1}. ${a.desc}</div>`).join('')}
                    </div>
                </div>
            `);
            $body.append($queuePanel);
        }

        // [新增] 渲染快捷栏 (Quick Bar) - 附着在 HUD 右侧
        if ($('#dnd-quick-bar').length === 0) {
            const $bar = $(`<div id="dnd-quick-bar" class="dnd-quick-bar"></div>`);
            const $trigger = $(`<div id="dnd-quick-trigger" class="dnd-quick-trigger" onclick="window.DND_Dashboard_UI.toggleQuickBar()">▶</div>`);
            
            const $hud = $('#dnd-mini-hud');
            $hud.append($bar).append($trigger);
        }
        this.renderQuickBar();
        
        // 每次渲染后更新位置
        this.updateHUDPosition();
    },

    // [新增] 更新 HUD 位置使其跟随悬浮球
    updateHUDPosition() {
        const { $, window: coreWin } = getCore(); // 获取正确的 window 对象
        // [修复] 使用 coreWin 获取尺寸，确保与 DOM 元素所在的文档一致 (兼容 iframe)
        const winW = coreWin.innerWidth || $(coreWin).width();
        
        // 移动端：完全交给 CSS 处理 (居中靠上)，JS 不干预
        if (winW <= 768) {
            const $hud = $('#dnd-mini-hud');
            if ($hud.length) {
                $hud[0].style.removeProperty('top');
                $hud[0].style.removeProperty('left');
            }
            return;
        }

        const $btn = $('#dnd-toggle-btn');
        const $hud = $('#dnd-mini-hud');
        
        if (!$btn.length || !$hud.length) return;
        
        const btnRect = $btn[0].getBoundingClientRect();
        const hudRect = $hud[0].getBoundingClientRect();
        // [修复] 使用 coreWin 获取尺寸
        const winH = coreWin.innerHeight || $(coreWin).height();
        const margin = 10;
        
        // Log for debugging
        Logger.debug('[HUD Pos] Btn:', btnRect.left, btnRect.top, 'HUD:', hudRect.width, hudRect.height, 'Win:', winW, winH);

        // 即使尺寸看起来是0 (可能刚初始化)，也尝试根据默认宽度计算
        const hudW = hudRect.width || 360;
        const hudH = hudRect.height || 400;

        let top, left;
        
        // 垂直定位策略
        if (btnRect.bottom + margin + hudH <= winH - margin) {
            top = btnRect.bottom + margin;
        } else if (btnRect.top - margin - hudH >= margin) {
            top = btnRect.top - margin - hudH;
        } else {
            top = (winH - btnRect.bottom > btnRect.top) ? (btnRect.bottom + margin) : (btnRect.top - margin - hudH);
        }
        
        // 水平定位策略: 默认左对齐按钮
        left = btnRect.left;
        
        // 边界约束
        top = Math.max(margin, Math.min(top, winH - hudH - margin));
        
        // 如果左对齐导致右侧溢出 (left + width > winW)
        if (left + hudW > winW - margin) {
            // 尝试右对齐按钮右侧 (left = btnRight - hudW)
            left = btnRect.right - hudW;
        }
        // 再次检查左边界
        left = Math.max(margin, Math.min(left, winW - hudW - margin));
        
        Logger.debug('[HUD Pos] Calculated:', left, top);

        $hud[0].style.setProperty('top', top + 'px', 'important');
        $hud[0].style.setProperty('left', left + 'px', 'important');
    },

    // [新增] 显示位置设置对话框
    showPositionDialog() {
        const { $, window: coreWin } = getCore();
        $('#dnd-position-dialog').remove();
        
        const $btn = $('#dnd-toggle-btn');
        // [修复] 使用 coreWin
        const winW = coreWin.innerWidth || $(coreWin).width();
        const winH = coreWin.innerHeight || $(coreWin).height();
        const btnSize = 40;
        const margin = 10;
        
        const positions = [
            { pos: 'tl', label: '↖ 左上', left: margin, top: margin },
            { pos: 'tc', label: '↑ 顶部', left: (winW - btnSize) / 2, top: margin },
            { pos: 'tr', label: '↗ 右上', left: winW - btnSize - margin, top: margin },
            { pos: 'ml', label: '← 左侧', left: margin, top: (winH - btnSize) / 2 },
            { pos: 'mc', label: '● 中央', left: (winW - btnSize) / 2, top: (winH - btnSize) / 2 },
            { pos: 'mr', label: '→ 右侧', left: winW - btnSize - margin, top: (winH - btnSize) / 2 },
            { pos: 'bl', label: '↙ 左下', left: margin, top: winH - btnSize - margin },
            { pos: 'bc', label: '↓ 底部', left: (winW - btnSize) / 2, top: winH - btnSize - margin },
            { pos: 'br', label: '↘ 右下', left: winW - btnSize - margin, top: winH - btnSize - margin }
        ];
        
        let btnsHtml = positions.map(p => 
            `<button class="dnd-pos-btn" data-left="${p.left}" data-top="${p.top}" style="padding:8px;background:#2a2a2c;border:1px solid #444;color:#ccc;border-radius:4px;cursor:pointer;">${p.label}</button>`
        ).join('');
        
        const html = `
            <div id="dnd-position-dialog" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#161618;border:1px solid #9d8b6c;border-radius:8px;padding:15px;z-index:2147483650;box-shadow:0 10px 40px rgba(0,0,0,0.8);min-width:280px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:15px;border-bottom:1px solid #444;padding-bottom:8px;">
                    <span style="color:#ffdb85;font-weight:bold;">📍 悬浮球位置</span>
                    <span id="dnd-pos-close" style="cursor:pointer;color:#888;">✕</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin-bottom:10px;">${btnsHtml}</div>
                <div style="font-size:11px;color:#666;text-align:center;">单击=切换HUD | 双击/长按=此设置</div>
            </div>
            <div id="dnd-pos-backdrop" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:2147483646;"></div>
        `;
        
        $('body').append(html);
        
        $('#dnd-pos-close, #dnd-pos-backdrop').on('click', () => $('#dnd-position-dialog, #dnd-pos-backdrop').remove());
        
        // [修复] 使用事件委托和更稳健的数据获取
        $(document).off('click.dndPos').on('click.dndPos', '.dnd-pos-btn', function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // 重新获取按钮元素以防丢失引用
            const $targetBtn = $('#dnd-toggle-btn');
            
            // 使用 attr 确保获取到原始字符串
            const left = $(this).attr('data-left');
            const top = $(this).attr('data-top');
            
            console.log('[DND Dashboard] Setting position to:', left, top);
            
            if ($targetBtn.length && left && top) {
                $targetBtn.css({
                    left: left + 'px',
                    top: top + 'px',
                    right: 'auto',
                    bottom: 'auto',
                    transform: 'none' // 清除可能影响位置的 transform
                });
                
                safeSave(CONFIG.STORAGE_KEYS.TOGGLE_POS, JSON.stringify({ left: left + 'px', top: top + 'px' }));
            } else {
                console.error('[DND Dashboard] Position update failed:', { btnLen: $targetBtn.length, left, top });
            }
            
            $('#dnd-position-dialog, #dnd-pos-backdrop').remove();
        });
        
        // 辅助样式效果
        $(document).on('mouseover', '.dnd-pos-btn', function() {
            $(this).css({ 'border-color': '#9d8b6c', 'color': '#ffdb85' });
        }).on('mouseout', '.dnd-pos-btn', function() {
            $(this).css({ 'border-color': '#444', 'color': '#ccc' });
        });
    },

    renderCombatHUD($container) {
        const { $ } = getCore();
        const encounters = DataManager.getTable('COMBAT_Encounter');
        const global = DataManager.getTable('SYS_GlobalState');
        const round = (global && global[0]) ? global[0]['当前回合'] : 0;
        
        // 布局
        let html = `<div class="dnd-hud-combat-layout">`;
        
        // 左侧：迷你地图
        const turnRes = this._turnResources || { action: 1, bonus: 1, reaction: 1, movement: 30 };
        html += `
            <div style="display:flex;flex-direction:column;gap:5px;">
                <div class="dnd-hud-minimap" id="dnd-hud-minimap-content" style="width:180px;height:180px;"></div>
                
                <!-- 动作经济展示 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;font-size:10px;background:rgba(0,0,0,0.3);padding:4px;border-radius:4px;">
                    <div class="dnd-clickable" onclick="window.DND_Dashboard_UI.adjustTurnResource('action')" title="点击增加动作" style="cursor:pointer;color:${turnRes.action>0?'#2ecc71':'#555'}">🟢 动作: ${turnRes.action}</div>
                    <div class="dnd-clickable" onclick="window.DND_Dashboard_UI.adjustTurnResource('bonus')" title="点击增加附赠动作" style="cursor:pointer;color:${turnRes.bonus>0?'#e67e22':'#555'}">🔺 附赠: ${turnRes.bonus}</div>
                    <div class="dnd-clickable" onclick="window.DND_Dashboard_UI.adjustTurnResource('reaction')" title="点击增加反应" style="cursor:pointer;color:${turnRes.reaction>0?'#f1c40f':'#555'}">🔁 反应: ${turnRes.reaction}</div>
                    <div class="dnd-clickable" onclick="window.DND_Dashboard_UI.adjustTurnResource('movement')" title="点击增加30尺移动力" style="cursor:pointer;color:${turnRes.movement>0?'#3498db':'#555'}">👣 移动: ${turnRes.movement}</div>
                </div>

                <div style="display:flex;gap:5px;">
                    <button class="dnd-clickable" style="
                        flex: 1;
                        background: linear-gradient(135deg, #2c3e50, #2980b9);
                        border: 1px solid #3498db;
                        color: #fff;
                        padding: 5px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 12px;
                    " onclick="window.DND_Dashboard_UI.startTargeting({
                        type: 'move',
                        rangeText: '30尺',
                        skillName: '移动',
                        callback: (res) => window.DND_Dashboard_UI.executeAction('move', res)
                    })">👣 移动</button>
                    <button class="dnd-clickable" style="
                        flex: 1;
                        background: linear-gradient(135deg, #8e44ad, #9b59b6);
                        border: 1px solid #9b59b6;
                        color: #fff;
                        padding: 5px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 12px;
                    " onclick="window.DND_Dashboard_UI.showCombatSkillList(event)">⚔️ 技能</button>
                </div>
            </div>
        `;
        
        // 右侧：战斗列表
        html += `<div class="dnd-hud-party-stats">`;
        html += `<div id="dnd-combat-resource-panel"></div>`;
        
        if (encounters && encounters.length > 0) {
            // 按先攻排序
            const sorted = [...encounters].sort((a, b) => {
                const valA = parseInt(a['先攻/位置']) || 0;
                const valB = parseInt(b['先攻/位置']) || 0;
                return valB - valA;
            });

            sorted.forEach(unit => {
                const isActive = unit['是否为当前行动者'] === '是';
                const buffs = unit['附着状态'] || '';
                const isEnemy = unit['阵营'] === '敌方';
                
                // 解析 HP
                let hpCurrent = 0, hpMax = 1, hpPercent = 100;
                const hpStr = unit['HP状态'] || '0/0';
                const hpParts = hpStr.split('/');
                if (hpParts.length >= 2) {
                    hpCurrent = parseInt(hpParts[0]) || 0;
                    hpMax = parseInt(hpParts[1]) || 1;
                    hpPercent = Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100));
                }
                
                const defInfo = unit['防御/抗性'] || '-';
                const acMatch = defInfo.match(/AC(\d+)/);
                const acVal = acMatch ? acMatch[1] : (defInfo.length < 5 ? defInfo : '??');
                
                const charIdCombat = unit['单位名称'];
                const initialCombat = this.getNameInitial(unit['单位名称']);
                const uid = `combat-avatar-${charIdCombat.replace(/[^a-zA-Z0-9]/g, '_')}-${Math.random().toString(36).substr(2,5)}`;
                
                // Trigger async load
                setTimeout(() => this.loadAvatarAsync(charIdCombat, uid), 0);
                
                let nameColor = 'var(--dnd-text-main)';
                if (isEnemy) nameColor = 'var(--dnd-accent-red)';
                if (isActive) nameColor = 'var(--dnd-text-highlight)';
                
                html += `
                    <div class="dnd-mini-char dnd-hud-entry ${isActive ? 'active' : ''}" style="${isEnemy ? 'border-left-color:var(--dnd-accent-red) !important;' : ''}">
                        <div id="${uid}" class="dnd-mini-char-avatar dnd-avatar-container ${isActive ? 'dnd-active-turn' : ''}" data-char-id="${charIdCombat}" style="overflow:hidden;background:linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%);position:relative;cursor:pointer;border-color:${isEnemy?'var(--dnd-accent-red)':'var(--dnd-border-gold)'};" title="${unit['单位名称']}">
                            <div class="dnd-avatar-initial" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${isEnemy?'#ff6b6b':'var(--dnd-text-highlight)'};font-weight:bold;font-size:16px;">${initialCombat}</div>
                        </div>
                        <div class="dnd-mini-char-info">
                            <div style="display:flex;justify-content:space-between">
                                <div class="dnd-mini-name" style="color:${nameColor}">${unit['单位名称']} ${isActive ? '⚡' : ''}</div>
                                <div style="font-size:11px;color:#888">AC: ${acVal}</div>
                            </div>
                            <div class="dnd-mini-bars">
                                <div class="dnd-micro-bar hp dnd-bar-shimmer" title="${hpStr}"><div class="dnd-micro-bar-fill" style="width:${hpPercent}%;background:${isEnemy?'#c0392b':'var(--dnd-accent-green)'} !important;"></div></div>
                            </div>
                            ${buffs ? `<div style="font-size:10px;color:#aaa;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${buffs}</div>` : ''}
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<div style="color:#666;text-align:center;padding:10px;">等待战斗数据...</div>`;
        }
        
        html += `</div></div>`;
        $container.append(html);
        
        // Bind events
        const self = this;
        $container.find('.dnd-mini-char-avatar').on('click', function(e) {
            e.stopPropagation();
            const name = $(this).attr('title');
            const unit = encounters.find(u => u['单位名称'] === name);
            if (unit) {
                self.showCombatUnitDetail(unit, e);
            }
        });

        if (this.renderResourceConsumption) {
            this.renderResourceConsumption($('#dnd-combat-resource-panel'));
        }

        this.renderMiniMap($('#dnd-hud-minimap-content'));
    },

    renderExploreHUD($container) {
        const { $ } = getCore();

        // 0. 渲染探索地图 (新增)
        // 使用 100% 宽度，高度设为 240px 以便更好地展示艺术地图
        const $mapContainer = $('<div class="dnd-hud-minimap" id="dnd-hud-minimap-content" style="width:100% !important; height:240px !important; margin-bottom:10px; border:1px solid var(--dnd-border-gold);"></div>');
        $container.append($mapContainer);
        
        // 异步渲染地图
        this.renderMiniMap($mapContainer);
        
        // 1. 渲染行动选项 (优先)
        this.renderActionOptions($container);

        // 2. 渲染任务 (精简版)
        const quests = DataManager.getTable('QUEST_Active');
        if (quests && quests.length > 0) {
            // 只显示第一个进行中的任务
            const activeQ = quests.find(q => q['状态'] === '进行中') || quests[0];
            
            // 提取任务类型和时限
            const type = activeQ['类型'] || '';
            const timeLimit = activeQ['时限'] || '';
            
            const qHtml = `
                <div class="dnd-hud-quests dnd-hud-entry" style="animation-delay:0.2s; margin-top:5px;background:rgba(0,0,0,0.2);padding:6px;border-radius:4px;border-left:2px solid var(--dnd-border-gold);cursor:pointer;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                        <div style="font-weight:bold;color:var(--dnd-text-header);font-size:12px;display:flex;align-items:center;gap:5px;">
                            <span>📌 ${activeQ['任务名称']}</span>
                            ${type ? `<span style="font-size:10px;background:rgba(255,255,255,0.1);padding:0 4px;border-radius:2px;color:var(--dnd-text-dim);">${type}</span>` : ''}
                        </div>
                        ${timeLimit && timeLimit !== '无限制' ? `<div style="font-size:10px;color:#e67e22;">⏳ ${timeLimit}</div>` : ''}
                    </div>
                    <div style="font-size:11px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${activeQ['当前进度'] || activeQ['目标描述'] || '...'}
                    </div>
                </div>
            `;
            const $el = $(qHtml);
            $el.on('click', (e) => this.showQuestTooltip(activeQ, e.clientX, e.clientY));
            $container.append($el);
        }
    },

    // [新增] 渲染行动选项
    renderActionOptions($container) {
        const { $ } = getCore();
        const optionsTable = DataManager.getTable('UI_ActionOptions');
        if (!optionsTable || optionsTable.length === 0) return;
        
        const opts = optionsTable[0]; // 取第一行
        const validOpts = [];
        
        // 检查 A-D 选项
        ['选项A', '选项B', '选项C', '选项D'].forEach(key => {
            if (opts[key] && opts[key].trim()) {
                validOpts.push({ key: key.replace('选项',''), text: opts[key] });
            }
        });
        
        if (validOpts.length === 0) return;
        
        let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">`;
        
        validOpts.forEach((opt, idx) => {
            html += `
                <button class="dnd-action-btn dnd-clickable dnd-hud-entry dnd-hover-lift" data-text="${opt.text}" style="animation-delay:${idx * 0.05}s;
                    background: linear-gradient(to bottom, #2a2a2c, #1a1a1c);
                    border: 1px solid var(--dnd-border-inner);
                    color: var(--dnd-text-main);
                    padding: 8px 5px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: left;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    transition: all 0.2s;
                " onmouseover="this.style.borderColor='var(--dnd-text-highlight)';this.style.color='var(--dnd-text-highlight)'" 
                onmouseout="this.style.borderColor='var(--dnd-border-inner)';this.style.color='var(--dnd-text-main)'">
                    <span style="color:var(--dnd-border-gold);font-weight:bold;margin-right:4px;">${opt.key}.</span> ${opt.text}
                </button>
            `;
        });
        
        html += `</div>`;
        const $el = $(html);
        
        // 绑定点击事件 (填入聊天框)
        const self = this;
        $el.find('.dnd-action-btn').on('click', function() {
            const text = $(this).data('text');
            self.fillChatInput(text);
        });
        
        $container.append($el);
    },

    // [新增] 渲染横向队伍栏 (Refactored to use CSS classes)
    renderPartyBar($container) {
        const { $ } = getCore();
        const party = DataManager.getPartyData();
        if (!party || party.length === 0) return;

        let html = `<div class="dnd-hud-party-bar">`;
        
        party.forEach((char, idx) => {
            // 解析 HP
            let hpCurrent = 0, hpMax = 0, hpPercent = 0;
            if (char['HP']) {
                const parts = char['HP'].split('/');
                if (parts.length === 2) {
                    hpCurrent = parseInt(parts[0]) || 0;
                    hpMax = parseInt(parts[1]) || 1;
                    hpPercent = Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100));
                }
            }
            
            // 解析经验值
            let xpPercent = 0;
            let xpText = '';
            if (char['经验值']) {
                const parts = char['经验值'].toString().split('/');
                if (parts.length === 2) {
                    const curr = parseInt(parts[0]) || 0;
                    const max = parseInt(parts[1]) || 1;
                    xpPercent = Math.min(100, Math.max(0, (curr / max) * 100));
                    xpText = `${curr}/${max}`;
                }
            }

            // 获取等级
            const level = char['等级'] || 1;
            
            const charId = char['PC_ID'] || char['CHAR_ID'] || char['姓名'];
            const initial = this.getNameInitial(char['姓名']);
            const avatarUid = `party-avatar-${charId}-${idx}`;
            
            // 触发异步头像加载
            setTimeout(() => this.loadAvatarAsync(charId, avatarUid), 0);
            
            // [新增] 检查是否为当前操控角色
            const isControlled = (this._controlledCharId === charId);
                
            html += `
                <div class="party-bar-item dnd-clickable dnd-hud-entry dnd-hover-lift" data-idx="${idx}" style="animation-delay:${idx * 0.05}s;">
                    <div style="position:relative;">
                        <div id="${avatarUid}" class="dnd-avatar-container party-avatar-container" data-char-id="${charId}" title="${char['姓名']}">
                            <span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:16px;">${initial}</span>
                        </div>
                        <div class="party-lvl-badge">Lv.${level}</div>
                        <!-- [新增] 操控切换按钮 -->
                        <div class="party-control-btn ${isControlled ? 'active' : ''}"
                                onclick="event.stopPropagation(); window.DND_Dashboard_UI.setControlledCharacter('${charId}')"
                                title="切换操控此角色">
                            🎮
                        </div>
                    </div>
                    
                    <!-- HP条 -->
                    <div class="dnd-bar-shimmer" style="width:100%;height:4px;background:#333;border-radius:2px;overflow:hidden;margin-top:2px;">
                        <div class="dnd-bar-fill" style="width:${hpPercent}%;height:100%;background:${hpPercent < 30 ? '#c0392b' : 'var(--dnd-accent-green)'};transition:width 0.3s;"></div>
                    </div>
                    
                    <!-- XP条 -->
                    ${xpText ? `
                    <div class="dnd-bar-shimmer" style="width:100%;height:2px;background:#222;border-radius:1px;overflow:hidden;margin-top:1px;" title="XP: ${xpText}">
                        <div class="dnd-bar-fill" style="width:${xpPercent}%;height:100%;background:#8e44ad;transition:width 0.3s;"></div>
                    </div>` : ''}
                </div>
            `;
        });
        
        html += `</div>`;
        const $el = $(html);
        
        // 绑定点击事件
        const self = this;
        $el.find('.party-bar-item').on('click', function(e) {
            Logger.debug('[PartyBar] Clicked item', $(this).data('idx'));
            e.stopPropagation();
            const idx = $(this).data('idx');
            const char = party[idx];
            if (char) {
                self.showCharacterCard(char, e);
            } else {
                Logger.error('[PartyBar] Character data not found for index', idx);
            }
        });

        $container.append($el);
    },

    renderFooter($container) {
        const { $ } = getCore();
        
        // 获取当前操控角色资源
        const char = this.getControlledCharacter();
        const res = char || {};
        
        // 获取势力数据
        const factions = DataManager.getTable('FACTION_Standing') || [];
        
        // 获取法术书
        const charId = char ? (char['CHAR_ID'] || char['PC_ID'] || char['姓名']) : null;
        const spells = DataManager.getKnownSpells(charId);
        const hasSpells = spells && spells.length > 0;
        
        let html = `<div class="dnd-hud-footer">`;
        
        if (char) {
            html += `<div class="dnd-res-item" title="金币"><span class="dnd-res-icon">💰</span> ${res['金币']||0} gp</div>`;
            
            if (res['生命骰']) {
                html += `<div class="dnd-res-item" title="生命骰"><span class="dnd-res-icon">💓</span> ${res['生命骰']}</div>`;
            }
            
            // 职业资源简报
            if (res['职业资源']) {
                try {
                    const classRes = DataManager.parseValue(res['职业资源'], 'resources');
                    if (classRes) {
                        const firstKey = Object.keys(classRes)[0];
                        if (firstKey) {
                            html += `<div class="dnd-res-item" title="${firstKey}"><span class="dnd-res-icon">⚡</span> ${classRes[firstKey]}</div>`;
                        }
                    }
                } catch(e) {}
            }
        }
        
        // 势力声望快览 (只显示前2个非中立势力)
        if (factions.length > 0) {
            let factionHtml = '';
            let count = 0;
            
            factions.forEach(f => {
                if (count >= 2) return;
                const relation = parseInt(f['关系等级']) || 0;
                if (relation !== 0) {
                    const icon = relation > 0 ? '🏛️' : '⚔️';
                    const color = relation > 0 ? 'var(--dnd-accent-green)' : 'var(--dnd-accent-red)';
                    factionHtml += `<span style="color:${color};margin-left:5px;cursor:help;" title="${f['势力名称']}: ${f['关系等级']} (声望:${f['声望值']||0})">${icon}</span>`;
                    count++;
                }
            });
            
            if (factionHtml) {
                html += `<div class="dnd-res-item" style="border-left:1px solid rgba(255,255,255,0.1);padding-left:8px;margin-left:5px;">${factionHtml}</div>`;
            }
        }
        
        // 右侧按钮组
        html += `<div style="margin-left:auto;display:flex;gap:10px;">`;
        
        // [修复] 使用 data-action 属性，后续用事件委托绑定
        html += `
            <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="inventory" style="cursor:pointer;" title="背包物品">
                <span class="dnd-res-icon" style="font-size:16px;color:var(--dnd-text-main)">🎒</span>
            </div>
        `;
        
        html += `
            <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="equipment" style="cursor:pointer;" title="已装备物品">
                <span class="dnd-res-icon" style="font-size:16px;color:var(--dnd-text-highlight)">⚔️</span>
            </div>
        `;
        
        if (factions.length > 0) {
            html += `
                <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="faction" style="cursor:pointer;" title="势力与声望">
                    <span class="dnd-res-icon" style="font-size:16px;color:var(--dnd-text-highlight)">🏛️</span>
                </div>
            `;
        }

        if (hasSpells) {
            html += `
                <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="spellbook" style="cursor:pointer;" title="法术书">
                    <span class="dnd-res-icon" style="font-size:16px;color:#aab">📖</span>
                </div>
            `;
        }
        
        html += `
            <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="dice" style="cursor:pointer;" title="快速投掷">
                <span class="dnd-res-icon" style="font-size:16px;color:var(--dnd-text-highlight)">🎲</span>
            </div>
        `;
        
        // [新增] 手动更新数据按钮
        html += `
            <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="manual-update" style="cursor:pointer;" title="手动刷新数据">
                <span class="dnd-res-icon dnd-refresh-icon" style="font-size:16px;color:var(--dnd-text-main)">🔄</span>
            </div>
        `;
        
        html += `</div></div>`; // End buttons & footer
        
        const $footerEl = $(html);
        
        // [修复] 使用事件委托绑定按钮点击
        const self = this;
        $footerEl.find('.dnd-footer-btn').on('click', function(e) {
            e.stopPropagation();
            const action = $(this).data('action');
            Logger.debug('Footer button clicked:', action);
            
            switch(action) {
                case 'inventory': self.showInventoryPanel(e); break;
                case 'equipment': self.showEquipmentPanel(e); break;
                case 'faction': self.showFactionPanel(e); break;
                case 'spellbook': self.showSpellBook(e); break;
                case 'dice': self.showQuickDice(e); break;
                case 'manual-update': self.triggerManualUpdate(e); break;
            }
        });
        
        $container.append($footerEl);
    },

    // [新增] 渲染迷你法术位
    renderMiniSpellSlots($container) {
        const { $ } = getCore();
        // 获取当前操控角色
        const char = this.getControlledCharacter();
        
        if (!char) return;
        
        // char 对象已包含合并的资源数据
        const res = char;
        
        if (res && res['法术位']) {
            const slotsHtml = this.formatSpellSlots(res['法术位'], true); // 启用 mini 模式
            if (slotsHtml) {
                const $el = $(`
                    <div style="padding:0 10px 5px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:10px;color:#888;margin-bottom:2px;">法术位 (${char['姓名']})</div>
                        ${slotsHtml}
                    </div>
                `);
                $container.append($el);
            }
        }
    }
});

;// ./src/data/ItemManager.js
// src/data/ItemManager.js



const ItemManager = {
    update: async (itemId, changes, notificationText = null) => {
        const api = DataManager.getAPI();
        const items = DataManager.getTable('ITEM_Inventory');
        if (!items) return;
        
        // 查找索引
        let itemIndex = -1;
        const targetItem = items.find((item, index) => {
            if ((item['物品ID'] === itemId) || (item['物品名称'] === itemId)) {
                itemIndex = index;
                return true;
            }
            return false;
        });
        
        if (itemIndex === -1) {
            console.error('[DND ItemManager] Item not found:', itemId);
            return;
        }
        
        // 获取原始数据结构
        const rawData = DataManager.getAllData();
        let sheetKey = Object.keys(rawData).find(k => k.includes('ITEM_Inventory') || (rawData[k].name && rawData[k].name.includes('背包')));
        
        if (!sheetKey) return;
        
        const sheet = rawData[sheetKey];
        const headers = sheet.content[0];
        
        // itemIndex 对应的是 items 数组的索引，对应 sheet.content 的索引需要 +1 (因为有表头)
        const rowIndex = itemIndex + 1;
        
        // 应用变更
        Object.keys(changes).forEach(key => {
            const colIndex = headers.indexOf(key);
            if (colIndex !== -1) {
                sheet.content[rowIndex][colIndex] = changes[key];
            }
        });
        
        // 如果数量 <= 0，删除该行
        if (changes['数量'] !== undefined && changes['数量'] <= 0) {
            sheet.content.splice(rowIndex, 1);
        }

        // [新增] 如果有通知文本，写入全局状态表
        if (notificationText) {
            DataManager.applySystemNotification(rawData, notificationText);
        }
        
        // 保存
        await DiceManager.saveData(rawData);
    }
};

;// ./src/core/TavernAPI.js
// src/core/TavernAPI.js
// src/core/TavernAPI.js

const TavernAPI = {
    // 获取全局核心对象（兼容 iframe 和 父窗口）
    getCore: function() {
        let st = null;
        let helper = null;
        
        // 尝试从不同层级获取 SillyTavern 对象
        try {
            if (window.SillyTavern) st = window.SillyTavern;
            else if (window.parent && window.parent.SillyTavern) st = window.parent.SillyTavern;
            else if (window.top && window.top.SillyTavern) st = window.top.SillyTavern;
            
            if (window.TavernHelper) helper = window.TavernHelper;
            else if (window.parent && window.parent.TavernHelper) helper = window.parent.TavernHelper;
            else if (window.top && window.top.TavernHelper) helper = window.top.TavernHelper;
        } catch(e) {
            console.error('[TavernAPI] 获取核心对象失败:', e);
        }

        return {
            SillyTavern: st,
            TavernHelper: helper
        };
    },

    /**
     * 规范化 API URL (去除尾部斜杠，去除 /chat/completions)
     */
    _normalizeUrl: function(url) {
        if (!url) return '';
        let cleanUrl = url.trim();
        // 去除尾部斜杠
        while (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        // 如果用户不小心加了 /chat/completions，尝试去除
        if (cleanUrl.endsWith('/chat/completions')) {
            cleanUrl = cleanUrl.replace(/\/chat\/completions$/, '');
        }
        return cleanUrl;
    },

    /**
     * 获取所有可用的 API 连接预设
     * @returns {Array} 预设列表 [{id, name}, ...]
     */
    getPresets: function() {
        const { SillyTavern } = this.getCore();
        
        console.log('[TavernAPI] 正在尝试获取 API 预设...');
        if (!SillyTavern) {
            console.error('[TavernAPI] 未找到 SillyTavern 对象');
            return [];
        }

        // 路径 A: 标准路径
        if (SillyTavern.extensionSettings?.connectionManager?.profiles) {
            return SillyTavern.extensionSettings.connectionManager.profiles;
        }
        
        // 路径 B: 可能是 connection 而不是 connectionManager
        if (SillyTavern.extensionSettings?.connection?.profiles) {
            return SillyTavern.extensionSettings.connection.profiles;
        }

        // 路径 C: 尝试从 contexts 中查找 (某些新版架构)
        if (SillyTavern.contexts?.connection?.profiles) {
            return SillyTavern.contexts.connection.profiles;
        }

        console.warn('[TavernAPI] 未能找到 connectionManager.profiles，请检查酒馆版本');
        return [];
    },

    /**
     * 获取自定义 API 的模型列表 (通过酒馆后端检查连接)
     * @param {string} apiUrl - API 基础 URL
     * @param {string} apiKey - API 密钥
     * @returns {Promise<Array>} 模型列表 ['model1', 'model2']
     */
    fetchModels: async function(rawApiUrl, apiKey) {
        if (!rawApiUrl) throw new Error('API URL 不能为空');
        
        const apiUrl = this._normalizeUrl(rawApiUrl);

        // 确保 URL 格式正确 (指向 status 接口或 models 接口)
        const statusUrl = '/api/backends/chat-completions/status';
        const { SillyTavern } = this.getCore();
        
        const body = {
            "reverse_proxy": apiUrl,
            "proxy_password": "",
            "chat_completion_source": "custom",
            "custom_url": apiUrl,
            "custom_include_headers": apiKey ? `Authorization: Bearer ${apiKey}` : ""
        };

        const response = await fetch(statusUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(SillyTavern?.getRequestHeaders ? SillyTavern.getRequestHeaders() : {})
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`连接失败: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        // Tavern 返回格式兼容: { models: [...] } 或直接数组 或 { data: [...] }
        let models = [];
        if (data.models && Array.isArray(data.models)) models = data.models;
        else if (Array.isArray(data)) models = data;
        else if (data.data && Array.isArray(data.data)) models = data.data;

        return models.map(m => (typeof m === 'string' ? m : m.id));
    },

    /**
     * 发送请求给 AI
     * @param {Array} messages - 消息数组 [{role: 'user', content: '...'}, ...]
     * @param {Object} options - 配置项
     * @param {string} [options.presetId] - (可选) API预设ID，留空则使用主API
     * @param {Object} [options.customConfig] - (可选) 自定义配置 { url, key, model }，优先级高于 presetId
     * @param {number} [options.maxTokens=4096] - 最大生成长度
     * @returns {Promise<string>} AI回复的内容
     */
    generate: async function(messages, options = {}) {
        const { SillyTavern, TavernHelper } = this.getCore();
        const { presetId, customConfig, maxTokens = 4096 } = options;

        if (!SillyTavern && !TavernHelper) {
            throw new Error("SillyTavern 核心 API 未就绪");
        }

        // --- 方式 C: 使用自定义配置 (通过酒馆后端代理调用) ---
        if (customConfig && customConfig.url && customConfig.model) {
            console.log(`[TavernAPI] 使用自定义配置发送请求: ${customConfig.url}`);
            
            const { url: rawApiUrl, key: apiKey, model } = customConfig;
            const apiUrl = this._normalizeUrl(rawApiUrl);

            try {
                const requestBody = {
                    messages: messages,
                    model: model,
                    max_tokens: maxTokens,
                    temperature: 0.7,
                    top_p: 0.9,
                    stream: false,
                    chat_completion_source: 'custom',
                    reverse_proxy: apiUrl,
                    proxy_password: '',
                    custom_url: apiUrl,
                    custom_include_headers: apiKey ? `Authorization: Bearer ${apiKey}` : '',
                    enable_web_search: false,
                    request_images: false
                };

                const response = await fetch('/api/backends/chat-completions/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(SillyTavern?.getRequestHeaders ? SillyTavern.getRequestHeaders() : {})
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API 请求失败: ${response.status} - ${errText}`);
                }

                const data = await response.json();
                
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content.trim();
                } else if (data && data.content) {
                    return data.content.trim();
                } else {
                    throw new Error('API 返回了意外的数据结构');
                }
            } catch (err) {
                console.error('[TavernAPI] Proxy Fetch Error:', err);
                throw err;
            }
        }

        // --- 方式 A: 使用指定的 API 预设 (通过酒馆后端代理调用) ---
        else if (presetId) {
            console.log(`[TavernAPI] 使用预设 ID: ${presetId} 发送请求`);
            
            // 1. 检查预设是否存在
            const profile = this.getPresets().find(p => p.id === presetId);
            if (!profile) throw new Error(`找不到 ID 为 "${presetId}" 的 API 预设`);

            // 2. 提取配置
            let apiKey = profile.api_key || profile.key || '';
            let apiUrl = profile.api_url || profile.url || '';
            let model = profile.openai_model || profile.model || 'gpt-3.5-turbo';
            
            // 特殊处理：如果是 settings 嵌套对象
            if (profile.settings) {
                apiKey = apiKey || profile.settings.api_key || profile.settings.key;
                apiUrl = apiUrl || profile.settings.api_url || profile.settings.url;
                model = model || profile.settings.openai_model || profile.settings.model;
            }

            if (!apiUrl) {
                throw new Error(`无法从预设 "${presetId}" 中解析出 API URL。`);
            }

            // 规范化 URL
            apiUrl = this._normalizeUrl(apiUrl);

            console.log(`[TavernAPI] Proxy via Backend: ${apiUrl}, Model: ${model}`);

            try {
                // 构造 Tavern 后端代理请求体
                const requestBody = {
                    messages: messages,
                    model: model,
                    max_tokens: maxTokens,
                    temperature: 0.7,
                    top_p: 0.9,
                    stream: false,
                    chat_completion_source: 'custom',
                    reverse_proxy: apiUrl,
                    proxy_password: '',
                    custom_url: apiUrl,
                    custom_include_headers: apiKey ? `Authorization: Bearer ${apiKey}` : '',
                    enable_web_search: false,
                    request_images: false
                };

                const response = await fetch('/api/backends/chat-completions/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(SillyTavern?.getRequestHeaders ? SillyTavern.getRequestHeaders() : {})
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API 请求失败: ${response.status} - ${errText}`);
                }

                const data = await response.json();
                
                // 解析结果 (兼容不同的返回结构)
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content.trim();
                } else if (data && data.content) {
                    return data.content.trim();
                } else {
                    throw new Error('API 返回了意外的数据结构');
                }
            } catch (err) {
                console.error('[TavernAPI] Proxy Fetch Error:', err);
                throw err;
            }
        }
        
        // --- 方式 B: 直接使用当前主 API ---
        else {
            console.log(`[TavernAPI] 使用主 API 发送请求`);
            
            const response = await TavernHelper.generateRaw({
                ordered_prompts: messages,
                should_stream: false,
            });
            
            return response.trim();
        }
    }
};

;// ./src/core/SettingsManager.js
// src/core/SettingsManager.js




const SettingsManager = {
    getAPIConfig: async () => {
        // 1. 优先尝试从 LocalStorage 读取 (最可靠，避免 DB 写入失败导致的旧数据回滚)
        let saved = null;
        try {
            saved = localStorage.getItem('dnd_global_api_config');
        } catch(e) {}

        // 2. 如果 LS 为空，尝试读取 DB (Global)
        if (!saved) {
            saved = await DBAdapter.getSetting('dnd_global_api_config');
        }
        
        // 3. 如果仍为空，尝试读取旧 Key (Creator/Legacy) - 支持从 DB 或 LS 读取
        if (!saved) {
            Logger.debug('[SettingsManager] Global config missing, checking legacy key...');
            try {
                saved = localStorage.getItem('dnd_creator_api_config');
            } catch(e) {}
            
            if (!saved) {
                saved = await DBAdapter.getSetting('dnd_creator_api_config');
            }
            
            if (saved) Logger.info('[SettingsManager] Recovered config from legacy key (dnd_creator_api_config)');
        }

        Logger.debug('[SettingsManager] Loaded API Config (Raw):', saved, typeof saved);

        let parsed = saved;
        
        // 3. 如果是字符串，尝试解析
        if (typeof saved === 'string') {
            try {
                parsed = JSON.parse(saved);
            } catch (e) {
                Logger.warn('[SettingsManager] JSON parse failed, using raw value');
            }
        }

        // 4. 防御性检查：防止双重序列化 (Double Stringify)
        if (typeof parsed === 'string') {
            try {
                const doubleParsed = JSON.parse(parsed);
                if (doubleParsed && typeof doubleParsed === 'object') {
                    parsed = doubleParsed;
                    Logger.debug('[SettingsManager] Detected and fixed double-serialized config');
                }
            } catch(e) {}
        }

        // 5. 确保是对象
        if (!parsed || typeof parsed !== 'object') {
            parsed = {};
        }

        // [新增] 6. 如果解析出的配置为空（没有URL），再次尝试从 dnd_creator_api_config 读取 (防止 dnd_global_api_config 存在但为空的情况)
        if (!parsed.url) {
            try {
                const legacy = localStorage.getItem('dnd_creator_api_config');
                if (legacy) {
                    const legacyParsed = JSON.parse(legacy);
                    if (legacyParsed && legacyParsed.url) {
                        Logger.info('[SettingsManager] Recovered config from legacy key');
                        parsed = legacyParsed;
                    }
                }
            } catch(e) {}
        }

        return {
            url: parsed.url || '',
            key: parsed.key || '',
            model: parsed.model || ''
        };
    },
    setAPIConfig: async (config) => {
        Logger.info('[SettingsManager] Saving API Config:', config);
        // 使用 safeSave 同时保存到 DB 和 LocalStorage
        await safeSave('dnd_global_api_config', config);
        
        // [双重保险] 强制写入 LocalStorage，防止 safeSave 中的逻辑被跳过
        try {
            localStorage.setItem('dnd_global_api_config', JSON.stringify(config));
            // 同时更新旧 key 以保持兼容（可选，但为了保险起见）
            localStorage.setItem('dnd_creator_api_config', JSON.stringify(config));
        } catch(e) {
            Logger.error('[SettingsManager] Force LS Save failed:', e);
        }
    }
};

;// ./src/ui/modules/UICharacter.js










/* harmony default export */ const UICharacter = ({
    // 头像存储管理 (使用 IndexedDB)
    avatarStorage: {
        get: async (charId) => {
            // 优先尝试 IndexedDB
            let val = await DBAdapter.get(charId);
            // 兼容旧版 localStorage (迁移数据)
            if (!val) {
                const old = localStorage.getItem(`dnd_avatar_${charId}`);
                if (old) {
                    await DBAdapter.put(charId, old);
                    localStorage.removeItem(`dnd_avatar_${charId}`); // 迁移后删除
                    val = old;
                }
            }
            return val;
        },
        set: async (charId, base64Data) => {
            return await DBAdapter.put(charId, base64Data);
        },
        remove: async (charId) => {
            return await DBAdapter.delete(charId);
        }
    },

    // 异步加载头像
    async loadAvatarAsync(charId, elemId) {
        const { $ } = getCore();
        const base64 = await this.avatarStorage.get(charId);
        if (base64) {
            const $el = $(`#${elemId}`);
            if ($el.length) {
                $el.html(`<img src="${base64}" style="width:100%;height:100%;object-fit:cover;">`);
                // 如果加载失败，显示回退的字母 (虽然 img onerror 应该处理了，但这里是直接替换 HTML)
                const self = this;
                $el.find('img').on('error', function() {
                    $(this).hide();
                    // 重新插入字母
                    const initial = self.getNameInitial($el.attr('title'));
                    const fontSize = Math.floor($el.width() * 0.5);
                    $el.html(`<div class="dnd-avatar-initial" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--dnd-text-highlight);font-weight:bold;font-size:${fontSize}px;">${initial}</div>`);
                });
            }
        }
    },

    // 生成头像HTML (异步模式)
    renderAvatar(name, charId, size = 40) {
        const initial = this.getNameInitial(name);
        const fontSize = Math.floor(size * 0.5);
        // 生成唯一ID以便异步填充
        const uid = `avatar-${charId}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 触发异步加载
        setTimeout(() => this.loadAvatarAsync(charId, uid), 0);

        // 返回占位符 (显示首字母)
        return `
            <div id="${uid}" class="dnd-avatar-container" data-char-id="${charId}" style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:1px solid var(--dnd-border-gold);flex-shrink:0;background:linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;" title="${name}">
                <span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:${fontSize}px;">${initial}</span>
            </div>
        `;
    },

    // 显示头像上传对话框
    showAvatarUploadDialog(charId, charName) {
        const { $, window: coreWin } = getCore();
        
        // 移除已存在的对话框
        $('#dnd-avatar-upload-dialog').remove();
        
        // Note: avatarStorage.get is async, but here we need synchronous display for dialog init?
        // Actually we can await or just load it. The original code used synchronous localstorage get?
        // Original code: const storedAvatar = UIRenderer.avatarStorage.get(charId); -> Returns Promise!
        // The original code treated it as sync?
        // "let val = await DBAdapter.get(charId);" inside get.
        // So avatarStorage.get returns a Promise.
        // Original code:
        /*
        const storedAvatar = UIRenderer.avatarStorage.get(charId);
        // ...
        ${storedAvatar ? ... }
        */
        // If storedAvatar is a Promise, it is truthy. This might have been a bug in original code or I misread.
        // UIRenderer.avatarStorage.get is async.
        // Let's fix this properly by using .then or await.
        // But showAvatarUploadDialog is called from onclick attribute string in some places?
        // "onclick="window.DND_Dashboard_UI.showAvatarUploadDialog..."
        // So it can be async.
        
        this.avatarStorage.get(charId).then(storedAvatar => {
            const initial = this.getNameInitial(charName);
            
            // 检测是否为移动端
            const isMobileDialog = (coreWin.innerWidth || $(coreWin).width()) < 768;
            
            const dialogHtml = `
                <div id="dnd-avatar-upload-dialog" style="
                    position: fixed;
                    ${isMobileDialog ? `
                        top: 20px;
                        left: 10px;
                        right: 10px;
                        transform: none;
                        width: auto;
                    ` : `
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        min-width: 300px;
                        max-width: 90vw;
                    `}
                    background: var(--dnd-bg-panel, #161618);
                    border: 1px solid var(--dnd-border-gold, #9d8b6c);
                    border-radius: 8px;
                    padding: 20px;
                    z-index: 2147483650;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                ">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid var(--dnd-border-inner);padding-bottom:10px;">
                        <span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:16px;">设置头像 - ${charName}</span>
                        <span id="dnd-avatar-dialog-close" style="cursor:pointer;color:#888;font-size:18px;" title="关闭">✕</span>
                    </div>
                    
                    <div style="display:flex;flex-direction:column;align-items:center;gap:15px;">
                        <div id="dnd-avatar-preview" style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:2px solid var(--dnd-border-gold);background:linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%);display:flex;align-items:center;justify-content:center;">
                            ${storedAvatar 
                                ? `<img src="${storedAvatar}" style="width:100%;height:100%;object-fit:cover;">` 
                                : `<span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:36px;">${initial}</span>`
                            }
                        </div>
                        
                        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
                            <label style="
                                background: rgba(157, 139, 108, 0.2);
                                border: 1px solid var(--dnd-border-gold);
                                color: var(--dnd-text-highlight);
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='rgba(157, 139, 108, 0.4)'" onmouseout="this.style.background='rgba(157, 139, 108, 0.2)'">
                                📷 选择图片
                                <input type="file" id="dnd-avatar-file-input" accept="image/*" style="display:none;">
                            </label>
                            
                            ${storedAvatar ? `
                                <button id="dnd-avatar-remove-btn" style="
                                    background: rgba(138, 44, 44, 0.3);
                                    border: 1px solid #8a2c2c;
                                    color: #ff6b6b;
                                    padding: 8px 16px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 13px;
                                    transition: all 0.2s;
                                " onmouseover="this.style.background='rgba(138, 44, 44, 0.5)'" onmouseout="this.style.background='rgba(138, 44, 44, 0.3)'">
                                    🗑️ 移除头像
                                </button>
                            ` : ''}
                        </div>
                        
                        <div style="font-size:11px;color:#888;text-align:center;">
                            支持 JPG、PNG、GIF 格式<br>
                            图片将存储在浏览器本地
                        </div>
                    </div>
                </div>
                <div id="dnd-avatar-dialog-backdrop" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.6);
                    z-index: 2147483646;
                "></div>
            `;
            
            $('body').append(dialogHtml);
            
            // 绑定事件
            $('#dnd-avatar-dialog-close, #dnd-avatar-dialog-backdrop').on('click', () => {
                $('#dnd-avatar-upload-dialog, #dnd-avatar-dialog-backdrop').remove();
            });
            
            const self = this;
            $('#dnd-avatar-file-input').on('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                // 检查文件大小 (限制 5MB - IndexedDB 可存储大量数据)
                if (file.size > 5 * 1024 * 1024) {
                    NotificationSystem.warning('图片文件过大，请选择小于 5MB 的图片');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const base64 = evt.target.result;
                    
                    // 压缩图片
                    self.compressImage(base64, 150, (compressedBase64) => {
                        // 保存到 localStorage
                        self.avatarStorage.set(charId, compressedBase64).then(success => {
                            if (success) {
                                // 更新预览
                                $('#dnd-avatar-preview').html(`<img src="${compressedBase64}" style="width:100%;height:100%;object-fit:cover;">`);
                                
                                // 更新页面上所有该角色的头像
                                self.refreshAvatars(charId);
                                
                                // 关闭对话框
                                setTimeout(() => {
                                    $('#dnd-avatar-upload-dialog, #dnd-avatar-dialog-backdrop').remove();
                                }, 500);
                            } else {
                                NotificationSystem.error('保存失败，可能是浏览器存储空间不足');
                            }
                        });
                    });
                };
                reader.readAsDataURL(file);
            });
            
            $('#dnd-avatar-remove-btn').on('click', async () => {
                const confirmed = await NotificationSystem.confirm('确定要移除头像吗？', {
                    title: '移除头像',
                    confirmText: '移除',
                    type: 'danger'
                });
                if (confirmed) {
                    this.avatarStorage.remove(charId);
                    this.refreshAvatars(charId);
                    $('#dnd-avatar-upload-dialog, #dnd-avatar-dialog-backdrop').remove();
                }
            });
        });
    },

    // 刷新页面上指定角色的所有头像
    refreshAvatars(charId) {
        const { $ } = getCore();
        this.avatarStorage.get(charId).then(storedAvatar => {
            $(`.dnd-avatar-container[data-char-id="${charId}"]`).each(function() {
                const $container = $(this);
                const size = $container.width();
                const fontSize = Math.floor(size * 0.5);
                
                // 获取角色名（从 title 属性或子元素）
                const initial = $container.find('.dnd-avatar-initial').text() || $container.find('span').text() || '?';
                
                if (storedAvatar) {
                    $container.html(`
                        <img src="${storedAvatar}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                        <div class="dnd-avatar-initial" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:var(--dnd-text-highlight);font-weight:bold;font-size:${fontSize}px;background:linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%);">${initial}</div>
                    `);
                } else {
                    $container.html(`<span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:${fontSize}px;">${initial}</span>`);
                    $container.css({
                        'display': 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'background': 'linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%)'
                    });
                }
            });
            
            // 同时刷新 HUD
            if (this.state === 'mini') {
                this.renderHUD();
            }
        });
    },

    // 保存最后一次点击位置，用于定位卡片
    _lastClickPos: { x: 0, y: 0 },
    
    showCharacterCard(char, clickEvent) {
        Logger.info('[UIRenderer] showCharacterCard called for:', char ? char['姓名'] : 'Unknown');
        const { $ } = getCore();
        let $card = $('#dnd-char-detail-card-el');
        
        // 记录点击位置（如果有事件对象）
        if (clickEvent && clickEvent.clientX !== undefined) {
            this._lastClickPos = { x: clickEvent.clientX, y: clickEvent.clientY };
        }
        
        // 如果卡片不存在则创建
        if (!$card.length) {
            $card = $('<div id="dnd-char-detail-card-el" class="dnd-char-detail-card"></div>');
            $('body').append($card);
        }
        
        // 每次显示卡片时重新绑定关闭事件（使用命名空间避免重复）
        $(document).off('click.dndCharCard');
        
        const self = this;
        // 使用 setTimeout 避免当前点击立即触发关闭
        setTimeout(() => {
            $(document).on('click.dndCharCard', (e) => {
                const $target = $(e.target);
                
                // 如果点击的是卡片内部，不关闭
                if ($target.closest('#dnd-char-detail-card-el').length) return;
                
                // 如果点击的是悬浮窗内部，不关闭
                if ($target.closest('#dnd-detail-popup-el').length) return;
                
                // 如果点击的是技能/专长标签（会打开悬浮窗），不关闭卡片
                if ($target.closest('.dnd-skill-trigger, .dnd-feat-trigger').length) return;
                
                // 如果点击的是触发打开卡片的元素（头像等），让那边的 toggle 逻辑处理
                if ($target.closest('.dnd-mini-char-avatar, .dnd-mini-char, .party-list-avatar, .party-quick-avatar, .dnd-char-card, .party-bar-item, #dnd-logo-container').length) return;
                
                // 其他情况关闭卡片和悬浮窗
                if ($card.hasClass('visible')) {
                    self.hideCharacterCard();
                    self.hideDetailPopup();
                    $(document).off('click.dndCharCard');
                }
            });
        }, 150);

        // 如果已经显示且是同一个角色，则关闭
        if ($card.hasClass('visible') && $card.data('charId') === (char['PC_ID'] || char['CHAR_ID'])) {
            this.hideCharacterCard();
            this.hideDetailPopup();
            return;
        }

        const charId = char['PC_ID'] || char['CHAR_ID'];
        $card.data('charId', charId);

        // 解析属性
        const stats = DataManager.parseValue(char['属性值'], 'stats') || {};

        // 计算属性调整值 (Value - 10) / 2 向下取整
        const getMod = (val) => {
            const mod = Math.floor((val - 10) / 2);
            return mod >= 0 ? `+${mod}` : mod;
        };

        // 解析 HP
        let hpCurrent = 0, hpMax = 0, hpPercent = 0;
        if (char['HP']) {
            const parts = char['HP'].split('/');
            if (parts.length === 2) {
                hpCurrent = parseInt(parts[0]) || 0;
                hpMax = parseInt(parts[1]) || 1;
                hpPercent = Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100));
            }
        }

        // 获取技能和专长
        const skills = charId ? DataManager.getCharacterSkills(charId) : [];
        const feats = charId ? DataManager.getCharacterFeats(charId) : [];
        
        // 获取资源
        const pcRes = DataManager.getTable('PC_Resources');
        const memRes = DataManager.getTable('PARTY_Resources');
        let res = {};
        if (char['type'] === 'PC' && pcRes) res = pcRes[0] || {};
        else if (memRes) res = memRes.find(r => r['CHAR_ID'] === charId) || {};
        
        // 构建 HTML
        const detailAvatarHtml = this.renderAvatar(char['姓名'], charId, 48);
        
        // [新增] 只有当是主角或队友时，才显示上传按钮
        const party = DataManager.getPartyData();
        const isPartyMember = party && party.some(p => (p['PC_ID'] == charId) || (p['CHAR_ID'] == charId) || (p['姓名'] == charId) || (p['姓名'] == char['姓名']));
        
        let html = `
            <div class="dnd-detail-header">
                <div style="display:flex;align-items:center;gap:15px;flex:1;overflow:hidden;">
                    <div style="position:relative;cursor:pointer;" class="dnd-avatar-wrapper" onclick="${isPartyMember ? `window.DND_Dashboard_UI.showAvatarUploadDialog('${charId}', '${char['姓名']}')` : ''}" title="${isPartyMember ? '点击修改头像' : ''}">
                        ${detailAvatarHtml}
                        ${isPartyMember ? `<div style="position:absolute;bottom:-2px;right:-2px;background:#333;border:1px solid var(--dnd-border-gold);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--dnd-text-highlight);">📷</div>` : ''}
                    </div>
                    <div class="dnd-detail-info">
                        <div class="dnd-detail-name">${char['姓名']}</div>
                        <div class="dnd-detail-sub">${char['种族/性别/年龄'] || '未知'} | ${char['职业'] || '无职业'}</div>
                    </div>
                </div>
                <div class="dnd-detail-close" id="dnd-card-close">✕</div>
            </div>
            
            <div class="dnd-detail-body">
                <div style="margin-bottom:15px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;color:#ccc;">
                        <span>HP (生命值)</span>
                        <span style="color:${hpPercent < 30 ? '#e74c3c' : 'inherit'}">${hpCurrent} / ${hpMax}</span>
                    </div>
                    <div class="dnd-bar-container dnd-bar-hp">
                        <div class="dnd-bar-fill" style="width: ${hpPercent}%"></div>
                    </div>
                </div>
                
                <div class="dnd-detail-stats-row">
                    <div class="dnd-detail-stat-item"><span style="color:#888">AC</span> <strong style="color:var(--dnd-text-highlight);font-size:15px;">${char['AC']||'-'}</strong></div>
                    <div class="dnd-detail-stat-item"><span style="color:#888">先攻</span> <strong>${char['先攻加值']||'+0'}</strong></div>
                    <div class="dnd-detail-stat-item"><span style="color:#888">感知</span> <strong>${char['被动感知']||'10'}</strong></div>
                    <div class="dnd-detail-stat-item"><span style="color:#888">速度</span> <strong>${char['速度']||'-'}</strong></div>
                </div>

                <div class="dnd-attr-grid">
                    ${['STR','DEX','CON','INT','WIS','CHA'].map(attr => `
                        <div class="dnd-attr-box">
                            <div class="dnd-attr-val">${stats[attr]||10}</div>
                            <div class="dnd-attr-mod">${getMod(stats[attr]||10)}</div>
                            <div class="dnd-attr-lbl">${attr}</div>
                        </div>
                    `).join('')}
                </div>

                ${(res['法术位'] || res['职业资源']) ? `
                <div class="dnd-detail-section">
                    <div class="dnd-detail-title">资源</div>
                    <div style="font-size:12px;color:var(--dnd-text-main)">
                        ${res['法术位'] ? `<div style="margin-bottom:4px;">${this.formatSpellSlots(res['法术位'])}</div>` : ''}
                        ${res['职业资源'] ? `<div>${this.formatClassRes(res['职业资源'])}</div>` : ''}
                        <div style="margin-top:4px;color:#aaa">
                            ${res['生命骰'] ? `HD: ${res['生命骰']} ` : ''}
                            ${res['金币'] ? `GP: ${res['金币']}` : ''}
                        </div>
                    </div>
                </div>` : ''}

                ${skills.length > 0 ? `
                <div class="dnd-detail-section">
                    <div class="dnd-detail-title">技能 & 法术 (${skills.length})</div>
                    <div class="dnd-tag-list">
                        ${skills.map((s, i) => {
                            return `<div class="dnd-tag dnd-skill-trigger" onclick="window.DND_Dashboard_UI.handleSkillClick(${i}, event)">${s['技能名称']}</div>`;
                        }).join('')}
                    </div>
                </div>` : ''}

                ${feats.length > 0 ? `
                <div class="dnd-detail-section">
                    <div class="dnd-detail-title">专长 (${feats.length})</div>
                    <div class="dnd-tag-list">
                        ${feats.map((f, i) => {
                            return `<div class="dnd-tag dnd-feat-trigger" onclick="window.DND_Dashboard_UI.handleFeatClick(${i}, event)">${f['专长名称']}</div>`;
                        }).join('')}
                    </div>
                </div>` : ''}

                <div class="dnd-detail-section">
                    <div class="dnd-detail-title" id="dnd-bio-toggle">背景故事 <span style="float:right">▼</span></div>
                    <div id="dnd-bio-content" style="display:none;font-size:12px;color:#ccc;line-height:1.5;margin-top:5px;">
                        ${char['背景故事'] || '暂无背景故事'}
                    </div>
                </div>
            </div>
        `;
        
        $card.html(html);

        // 绑定事件
        $card.find('#dnd-card-close').on('click', () => {
            this.hideCharacterCard();
            this.hideDetailPopup();
        });
        
        $card.find('#dnd-bio-toggle').on('click', function() {
            const $content = $('#dnd-bio-content');
            if ($content.is(':visible')) {
                $content.hide();
                $(this).find('span').text('▼');
            } else {
                $content.show();
                $(this).find('span').text('▲');
            }
        });

        // ========== 智能定位逻辑 ==========
        const { window: coreWin } = getCore();
        const $w = $(coreWin);
        const winW = $w.width();
        const winH = $w.height();
        const isMobile = winW < 768;
        
        if (isMobile) {
            $card.css({
                top: '10px',
                left: '50%',
                right: 'auto',
                bottom: 'auto'
            }).addClass('visible');
        } else {
            $card.removeClass('visible').css({
                display: 'flex',
                visibility: 'hidden',
                top: '-9999px',
                left: '-9999px'
            });
            
            requestAnimationFrame(() => {
                const cardW = $card.outerWidth() || 380;
                const cardH = $card.outerHeight() || 500;
                const padding = 15;
                
                const clickX = this._lastClickPos.x || winW / 2;
                const clickY = this._lastClickPos.y || 100;
                
                let left, top;
                
                if (clickX + cardW + padding < winW) {
                    left = clickX + padding;
                } else if (clickX - cardW - padding > 0) {
                    left = clickX - cardW - padding;
                } else {
                    left = Math.max(padding, (winW - cardW) / 2);
                }
                
                top = clickY - 50; 
                
                if (top < padding) {
                    top = padding;
                }
                
                if (top + cardH > winH - padding) {
                    top = Math.max(padding, winH - cardH - padding);
                }
                
                left = Math.max(padding, Math.min(left, winW - cardW - padding));
                top = Math.max(padding, Math.min(top, winH - cardH - padding));
                
                $card.css({
                    top: top + 'px',
                    left: left + 'px',
                    right: 'auto',
                    bottom: 'auto',
                    display: '', 
                    visibility: '' 
                }).addClass('visible');
            });
        }
    },

    hideCharacterCard() {
        $('#dnd-char-detail-card-el').removeClass('visible');
    },

    handleSkillClick(idx, event) {
        console.log('[DND Dashboard] handleSkillClick', idx);
        if (event) { event.stopPropagation(); event.preventDefault(); }
        
        const { $ } = getCore();
        const $card = $('#dnd-char-detail-card-el');
        const charId = $card.data('charId');
        
        if (!charId) { console.error('No charId found'); return; }
        
        const skills = DataManager.getCharacterSkills(charId);
        const skill = skills[idx];
        
        if (!skill) { console.error('Skill not found', idx); return; }
        
        const safeName = (skill['技能名称']||'').replace(/'/g, "\\'");
        const safeRange = (skill['射程']||'接触').replace(/'/g, "\\'");
        const html = `
            <div style="color:var(--dnd-text-highlight);font-weight:bold;border-bottom:1px solid #444;margin-bottom:5px;padding-bottom:3px;display:flex;justify-content:space-between;align-items:center;">
                <span>${skill['技能名称']} <span style="font-size:10px;color:#888;font-weight:normal">(${skill['环阶']||'-'} · ${skill['学派']||'-'})</span></span>
                <button class="dnd-clickable" style="background:var(--dnd-accent-green);border:none;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;cursor:pointer;"
                    onclick="window.DND_Dashboard_UI.handleCastClick('${safeName}', '${safeRange}', '${skill['环阶']||''}', 'skill')">
                    ✨ 施放
                </button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:11px;color:#aaa;margin-bottom:8px;">
                <div>时间: ${skill['施法时间']||'-'}</div>
                <div>射程: ${skill['射程']||'-'}</div>
                <div>成分: ${skill['成分']||'-'}</div>
                <div>持续: ${skill['持续时间']||'-'}</div>
            </div>
            <div style="line-height:1.4;color:#ccc;">${skill['效果描述']||'无描述'}</div>
        `;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },
    
    handleFeatClick(idx, event) {
        console.log('[DND Dashboard] handleFeatClick', idx);
        if (event) { event.stopPropagation(); event.preventDefault(); }
        
        const { $ } = getCore();
        const $card = $('#dnd-char-detail-card-el');
        const charId = $card.data('charId');
        
        if (!charId) { console.error('No charId found'); return; }
        
        const feats = DataManager.getCharacterFeats(charId);
        const feat = feats[idx];
        
        if (!feat) { console.error('Feat not found', idx); return; }
        
        const html = `
            <div style="color:var(--dnd-text-highlight);font-weight:bold;border-bottom:1px solid #444;margin-bottom:5px;padding-bottom:3px;">
                ${feat['专长名称']} <span style="font-size:10px;color:#888;font-weight:normal">(${feat['类别']||'-'})</span>
            </div>
            <div style="font-size:11px;color:#aaa;margin-bottom:5px;">前置: ${feat['前置条件']||'无'}</div>
            <div style="line-height:1.4;color:#ccc;">${feat['效果描述']||'无描述'}</div>
        `;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // ==========================================
    // 角色创建面板 (AI 多轮对话引导)
    // ==========================================
    
    // [新增] 保存角色创建状态
    _charCreatorState: null,
    _charCreatorLoading: false,

    saveCreatorState() {
        if (this._charCreatorState) {
            safeSave('dnd_creator_state', JSON.stringify(this._charCreatorState));
        }
    },

    // [新增] 格式化聊天消息 (Markdown + 清理数据块)
    formatChatMessage(content) {
        if (!content) return '';
        
        // 1. 移除 CHARACTER_OPTIONS 和 CHARACTER_DATA 块
        let text = content
            .replace(/```CHARACTER_OPTIONS\s*[\s\S]*?```/g, '')
            .replace(/```CHARACTER_DATA\s*[\s\S]*?```/g, '')
            .trim();
        
        // 2. HTML 转义 (基本)
        text = text
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">");

        // 3. Markdown 渲染
        // Code blocks
        text = text.replace(/```([\s\S]*?)```/g, '<pre class="dnd-md-pre"><code>$1</code></pre>');
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code class="dnd-md-code">$1</code>');
        // Headers
        text = text.replace(/^### (.*$)/gm, '<h3 class="dnd-md-h3">$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2 class="dnd-md-h2">$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1 class="dnd-md-h1">$1</h1>');
        // Bold & Italic
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Lists
        text = text.replace(/^\s*-\s+(.*$)/gm, '<li class="dnd-md-li">$1</li>');
        
        return text;
    },

    renderCharacterCreationPanel($container) {
        const { $ } = getCore();
        
        // 获取 API 预设列表
        const presets = TavernAPI.getPresets();
        
        // 初始化角色创建状态 (支持持久化恢复)
        if (!this._charCreatorState) {
            // 防止重复加载
            if (this._charCreatorLoading) {
                $container.html('<div style="padding:50px;text-align:center;color:#888;">⏳ 正在恢复会话...</div>');
                return;
            }

            this._charCreatorLoading = true;
            $container.html('<div style="padding:50px;text-align:center;color:#888;">⏳ 正在初始化...</div>');

            // 尝试从存储加载状态
            DBAdapter.getSetting('dnd_creator_state').then(savedState => {
                this._charCreatorLoading = false;
                
                if (savedState) {
                    try {
                        this._charCreatorState = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
                        console.log('[DND Creator] 已恢复上次未完成的创建会话');
                    } catch(e) { console.error('[DND Creator] 状态解析失败', e); }
                }

                // 如果仍未初始化 (无存档或解析失败)，则使用默认值
                if (!this._charCreatorState) {
                    let apiConfig = { url: '', key: '', model: '' };
                    
                    this._charCreatorState = {
                        selectedPresetId: null,
                        apiConfig: apiConfig,
                        modelList: [],
                        conversationHistory: [],
                        characterData: {},
                        isGenerating: false,
                        currentStep: 'init',
                        characterType: 'pc'
                    };
                    
                    // 异步加载全局 API 配置 (仅在全新开始时加载)
                    SettingsManager.getAPIConfig().then(config => {
                        if (config && config.url) {
                            if (this._charCreatorState) {
                                this._charCreatorState.apiConfig = config;
                            }
                        }
                        // 加载配置后刷新显示
                        this.renderCharacterCreationPanel($container);
                    });
                    return; // 等待回调刷新
                }
                
                // 状态已就绪，刷新显示
                this.renderCharacterCreationPanel($container);
            });
            return; // 等待异步加载
        }
        
        const state = this._charCreatorState;
        
        // 构建模型选择器 HTML
        let modelOptionsHtml = '<option value="">-- 请先获取模型 --</option>';
        if (state.modelList && state.modelList.length > 0) {
            modelOptionsHtml = '<option value="">-- 选择模型 --</option>';
            state.modelList.forEach(m => {
                const selected = state.apiConfig.model === m ? 'selected' : '';
                modelOptionsHtml += `<option value="${m}" ${selected}>${m}</option>`;
            });
        } else if (state.apiConfig.model) {
            // 如果有保存的模型但没列表，先显示当前保存的
            modelOptionsHtml = `<option value="${state.apiConfig.model}" selected>${state.apiConfig.model}</option>`;
        }
        
        // 对话历史 HTML
        let chatHistoryHtml = '';
        if (state.conversationHistory.length > 0) {
            state.conversationHistory.forEach((msg, idx) => {
                const isUser = msg.role === 'user';
                const bgColor = isUser ? 'rgba(52, 152, 219, 0.1)' : 'rgba(155, 89, 182, 0.1)';
                const borderColor = isUser ? '#3498db' : '#9b59b6';
                const icon = isUser ? '👤' : '🤖';
                chatHistoryHtml += `
                    <div class="dnd-chat-msg dnd-anim-entry" style="animation-delay:${idx * 0.05}s; background:${bgColor}; border-left:3px solid ${borderColor}; padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;">${icon} ${isUser ? '你' : 'AI 向导'}</div>
                        <div style="color:var(--dnd-text-main);line-height:1.5;white-space:pre-wrap;">${this.formatChatMessage(msg.content)}</div>
                    </div>
                `;
            });
        }
        
        // 当前步骤提示
        let stepHint = '';
        switch(state.currentStep) {
            case 'init':
                stepHint = '选择 API 预设后，点击"开始创建"与 AI 向导对话，逐步构建你的角色。';
                break;
            case 'chatting':
                stepHint = '与 AI 向导对话中...回答问题或提出你的想法，AI 会帮助你完善角色设定。';
                break;
            case 'reviewing':
                stepHint = '角色信息已生成！请检查下方预览，确认无误后点击"确认创建"。';
                break;
            case 'complete':
                stepHint = '🎉 角色创建完成！数据已保存到角色卡。';
                break;
        }
        
        const html = `
            <div class="dnd-char-creator-panel" style="max-width:800px;margin:0 auto;">
                <!-- 标题区 -->
                <div style="text-align:center;margin-bottom:20px;">
                    <h2 style="color:var(--dnd-text-highlight);font-family:var(--dnd-font-serif);margin:0 0 10px 0;">
                        ⚔️ AI 角色创建向导
                    </h2>
                    <p style="color:#888;font-size:13px;margin:0;">${stepHint}</p>
                </div>
                
                <!-- 设置区域 -->
                <div style="background:rgba(0,0,0,0.3);padding:15px;border-radius:6px;margin-bottom:15px;border:1px solid var(--dnd-border-inner);">
                    <div style="display:flex;align-items:center;gap:15px;flex-wrap:wrap;">
                        <!-- 角色类型选择 -->
                        <div style="min-width:150px;">
                            <label style="font-size:12px;color:#888;display:block;margin-bottom:5px;">角色类型</label>
                            <div style="display:flex;gap:5px;">
                                <button id="dnd-creator-type-pc" class="dnd-clickable" style="
                                    flex:1;
                                    padding:8px 12px;
                                    background:${state.characterType === 'pc' ? 'var(--dnd-border-gold)' : '#1a1a1c'};
                                    border:1px solid ${state.characterType === 'pc' ? 'var(--dnd-border-gold)' : 'var(--dnd-border-inner)'};
                                    color:${state.characterType === 'pc' ? '#000' : 'var(--dnd-text-main)'};
                                    border-radius:4px;
                                    font-size:12px;
                                    cursor:pointer;
                                " ${state.currentStep !== 'init' ? 'disabled' : ''}>👤 主角</button>
                                <button id="dnd-creator-type-party" class="dnd-clickable" style="
                                    flex:1;
                                    padding:8px 12px;
                                    background:${state.characterType === 'party' ? 'var(--dnd-border-gold)' : '#1a1a1c'};
                                    border:1px solid ${state.characterType === 'party' ? 'var(--dnd-border-gold)' : 'var(--dnd-border-inner)'};
                                    color:${state.characterType === 'party' ? '#000' : 'var(--dnd-text-main)'};
                                    border-radius:4px;
                                    font-size:12px;
                                    cursor:pointer;
                                " ${state.currentStep !== 'init' ? 'disabled' : ''}>👥 队友</button>
                            </div>
                        </div>
                        
                        <!-- API 状态显示 -->
                        <div style="flex:1;min-width:300px;background:rgba(0,0,0,0.2);padding:10px;border-radius:4px;border:1px solid var(--dnd-border-inner);">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                <label style="font-size:12px;color:#888;">API 状态</label>
                                <div style="font-size:11px;color:${state.apiConfig.key ? '#2ecc71' : '#e74c3c'}">
                                    ${state.apiConfig.key ? '✅ 已配置' : '❌ 未配置'}
                                </div>
                            </div>
                            <div style="font-size:11px;color:#aaa;margin-bottom:8px;">
                                URL: ${state.apiConfig.url || '未设置'}<br>
                                Model: ${state.apiConfig.model || '未设置'}
                            </div>
                            <button type="button" onclick="window.DND_Dashboard_UI.renderPanel('settings')" class="dnd-clickable" style="width:100%;padding:6px;background:#2a2a2c;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer;font-size:12px;">
                                ⚙️ 前往设置配置 API
                            </button>
                        </div>
                        <div style="display:flex;gap:10px;">
                            ${state.currentStep === 'init' ? `
                                <button id="dnd-creator-start-btn" class="dnd-clickable" style="
                                    background:linear-gradient(135deg, var(--dnd-accent-green), #27ae60);
                                    border:none;
                                    color:#fff;
                                    padding:10px 20px;
                                    border-radius:4px;
                                    cursor:pointer;
                                    font-weight:bold;
                                    font-size:13px;
                                ">🚀 开始创建</button>
                            ` : ''}
                            ${state.currentStep !== 'init' ? `
                                <button id="dnd-creator-reset-btn" class="dnd-clickable" style="
                                    background:rgba(192, 57, 43, 0.2);
                                    border:1px solid #c0392b;
                                    color:#e74c3c;
                                    padding:8px 15px;
                                    border-radius:4px;
                                    cursor:pointer;
                                    font-size:12px;
                                ">🔄 重新开始</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- 对话区域 -->
                <div style="display:flex;gap:15px;flex-wrap:wrap;">
                    <!-- 左侧：对话历史 -->
                    <div style="flex:2;min-width:300px;">
                        <div style="background:rgba(0,0,0,0.2);border:1px solid var(--dnd-border-inner);border-radius:6px;overflow:hidden;">
                            <div style="background:rgba(255,255,255,0.05);padding:10px 15px;border-bottom:1px solid var(--dnd-border-inner);">
                                <span style="color:var(--dnd-text-header);font-weight:bold;">💬 对话记录</span>
                                <span style="float:right;font-size:11px;color:#666;">${state.conversationHistory.length} 条消息</span>
                            </div>
                            <div id="dnd-creator-chat-history" style="height:350px;overflow-y:auto;padding:15px;">
                                ${chatHistoryHtml || '<div style="color:#666;text-align:center;padding:50px 20px;">对话将在这里显示...<br><br>点击"开始创建"与 AI 向导对话</div>'}
                            </div>
                        </div>
                        
                        <!-- 输入区 -->
                        <div style="margin-top:10px;display:flex;gap:10px;">
                            <button id="dnd-creator-stats-btn" class="dnd-clickable" style="
                                background:rgba(255,255,255,0.1);
                                border:1px solid #555;
                                color:#ccc;
                                padding:0 12px;
                                border-radius:4px;
                                cursor:pointer;
                                font-size:16px;
                            " title="属性生成器">🔢</button>
                            <input type="text" id="dnd-creator-user-input" placeholder="输入你的回答或想法..." style="
                                flex:1;
                                padding:10px 15px;
                                background:#1a1a1c;
                                border:1px solid var(--dnd-border-inner);
                                color:var(--dnd-text-main);
                                border-radius:4px;
                                font-size:13px;
                            " ${state.currentStep === 'init' || state.isGenerating ? 'disabled' : ''}>
                            <button id="dnd-creator-send-btn" class="dnd-clickable" style="
                                background:var(--dnd-border-gold);
                                border:none;
                                color:#000;
                                padding:10px 20px;
                                border-radius:4px;
                                cursor:pointer;
                                font-weight:bold;
                            " ${state.currentStep === 'init' || state.isGenerating ? 'disabled' : ''}>
                                ${state.isGenerating ? '⏳ 生成中...' : '📤 发送'}
                            </button>
                        </div>
                        
                        <!-- 快捷回复按钮 -->
                        <div id="dnd-creator-quick-replies" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                            <!-- 动态生成 -->
                        </div>
                    </div>
                    
                    <!-- 右侧：角色预览 -->
                    <div style="flex:1;min-width:250px;">
                        <div style="background:rgba(0,0,0,0.2);border:1px solid var(--dnd-border-gold);border-radius:6px;overflow:hidden;">
                            <div style="background:linear-gradient(135deg, rgba(157, 139, 108, 0.2), rgba(157, 139, 108, 0.1));padding:10px 15px;border-bottom:1px solid var(--dnd-border-gold);">
                                <span style="color:var(--dnd-text-highlight);font-weight:bold;">📋 角色预览</span>
                            </div>
                            <div id="dnd-creator-preview" style="padding:15px;min-height:300px;">
                                ${this.renderCharacterPreview(state.characterData)}
                            </div>
                        </div>
                        
                        ${state.currentStep === 'reviewing' ? `
                            <div style="margin-top:15px;display:flex;gap:10px;">
                                <button id="dnd-creator-confirm-btn" class="dnd-clickable" style="
                                    flex:1;
                                    background:linear-gradient(135deg, var(--dnd-accent-green), #27ae60);
                                    border:none;
                                    color:#fff;
                                    padding:12px;
                                    border-radius:4px;
                                    cursor:pointer;
                                    font-weight:bold;
                                ">✅ 确认创建</button>
                                <button id="dnd-creator-modify-btn" class="dnd-clickable" style="
                                    background:rgba(241, 196, 15, 0.2);
                                    border:1px solid #f1c40f;
                                    color:#f1c40f;
                                    padding:12px 20px;
                                    border-radius:4px;
                                    cursor:pointer;
                                ">✏️ 继续修改</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        $container.html(html);
        
        // 绑定事件
        this.bindCharacterCreatorEvents($container);
    },

    // [新增] 显示属性生成器
    showStatsGenerator(e) {
        const html = `
            <div style="padding-bottom:10px; border-bottom:1px solid #444; margin-bottom:10px; font-weight:bold; color:var(--dnd-text-highlight);">
                🎲 属性分配生成器
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <!-- 标准数列 -->
                <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px;">
                    <div style="font-size:13px; font-weight:bold; margin-bottom:5px;">1. 标准数列 (Standard Array)</div>
                    <div style="font-family:monospace; color:#ccc; margin-bottom:5px;">[15, 14, 13, 12, 10, 8]</div>
                    <button onclick="window.DND_Dashboard_UI.applyStatsOption('standard')" style="width:100%; padding:5px; background:#333; border:1px solid #555; color:#fff; border-radius:3px; cursor:pointer;">使用此数列</button>
                </div>

                <!-- 购点法 -->
                <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px;">
                    <div style="font-size:13px; font-weight:bold; margin-bottom:5px;">2. 购点法 (Point Buy)</div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="window.DND_Dashboard_UI.applyStatsOption('pointbuy_27')" style="flex:1; padding:5px; background:#333; border:1px solid #555; color:#fff; border-radius:3px; cursor:pointer;">标准 (27点)</button>
                        <button onclick="window.DND_Dashboard_UI.applyStatsOption('pointbuy_32')" style="flex:1; padding:5px; background:#333; border:1px solid #555; color:#fff; border-radius:3px; cursor:pointer;">宽裕 (32点)</button>
                    </div>
                </div>

                <!-- 骰子决定 -->
                <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px;">
                    <div style="font-size:13px; font-weight:bold; margin-bottom:5px;">3. 骰子决定 (4d6 drop lowest)</div>
                    <div id="dnd-stats-roll-result" style="font-family:monospace; color:var(--dnd-text-highlight); margin-bottom:5px; min-height:20px; font-size:14px; text-align:center;">???</div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="window.DND_Dashboard_UI.performStatsRoll()" style="flex:1; padding:5px; background:var(--dnd-border-gold); color:#000; border:none; border-radius:3px; cursor:pointer; font-weight:bold;">🎲 投掷 (x6)</button>
                        <button id="dnd-btn-use-roll" onclick="window.DND_Dashboard_UI.confirmStatsRoll()" style="flex:1; padding:5px; background:#333; border:1px solid #555; color:#fff; border-radius:3px; cursor:pointer;" disabled>使用结果</button>
                    </div>
                </div>
            </div>
        `;
        
        this.showItemDetailPopup(html, e.clientX, e.clientY);
    },

    applyStatsOption(type) {
        let text = '';
        if (type === 'standard') text = "我选择使用【标准数列】进行属性分配：15, 14, 13, 12, 10, 8。请帮我分配到合适的属性上。";
        if (type === 'pointbuy_27') text = "我选择使用【标准购点法 (27点)】。请帮我规划属性分配。";
        if (type === 'pointbuy_32') text = "我选择使用【宽裕购点法 (32点)】。请帮我规划属性分配。";
        
        if (text) {
            this.fillCreatorInput(text);
            this.hideDetailPopup();
        }
    },

    performStatsRoll() {
        const roll4d6k3 = () => {
            const rolls = [
                Math.floor(Math.random()*6)+1,
                Math.floor(Math.random()*6)+1,
                Math.floor(Math.random()*6)+1,
                Math.floor(Math.random()*6)+1
            ];
            rolls.sort((a,b) => b-a);
            return rolls[0] + rolls[1] + rolls[2];
        };
        
        const results = [];
        for(let i=0; i<6; i++) results.push(roll4d6k3());
        
        const resultStr = results.join(', ');
        const { $ } = getCore();
        $('#dnd-stats-roll-result').text(`[${resultStr}]`);
        $('#dnd-btn-use-roll').prop('disabled', false).attr('data-results', resultStr);
    },

    confirmStatsRoll() {
        const { $ } = getCore();
        const res = $('#dnd-btn-use-roll').attr('data-results');
        if (res) {
            this.fillCreatorInput(`我选择使用【骰子投掷结果】：[${res}]。请帮我分配到合适的属性上。`);
            this.hideDetailPopup();
        }
    },

    fillCreatorInput(text) {
        const { $ } = getCore();
        const $input = $('#dnd-creator-user-input');
        const current = $input.val();
        $input.val(current ? current + ' ' + text : text).focus();
    },

    // 渲染角色预览
    renderCharacterPreview(data) {
        if (!data || Object.keys(data).length === 0) {
            return `
                <div style="color:#666;text-align:center;padding:30px 15px;">
                    <div style="font-size:48px;margin-bottom:15px;opacity:0.3;">🧙</div>
                    <div>角色信息将随对话逐步生成...</div>
                </div>
            `;
        }
        
        // 解析属性值
        const stats = data.stats || {};
        const getMod = (val) => {
            const v = parseInt(val) || 10;
            const mod = Math.floor((v - 10) / 2);
            return mod >= 0 ? `+${mod}` : mod;
        };

        // 辅助函数: 渲染列表
        const renderList = (title, list, renderer) => {
            if (!list || list.length === 0) return '';
            return `
                <div style="margin-top:10px;">
                    <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:5px;font-size:12px;">${title}</div>
                    <div>${list.map(renderer).join('')}</div>
                </div>
            `;
        };

        // 资源显示
        let resHtml = '';
        if (data.resources) {
            const r = data.resources;
            let items = [];
            if (r.spell_slots) Object.keys(r.spell_slots).forEach(k => items.push(`${k}: ${r.spell_slots[k]}`));
            if (r.class_resources) Object.keys(r.class_resources).forEach(k => items.push(`${k}: ${r.class_resources[k]}`));
            if (r.hit_dice) items.push(`生命骰: ${r.hit_dice}`);
            
            if (items.length > 0) {
                resHtml = `
                    <div style="margin-bottom:10px;font-size:11px;background:rgba(255,255,255,0.05);padding:6px;border-radius:4px;">
                        <div style="color:#888;margin-bottom:2px;">资源</div>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;color:#ccc;">
                            ${items.map(i => `<span>${i}</span>`).join('<span style="color:#444">|</span>')}
                        </div>
                    </div>
                `;
            }
        }

        // 熟练项
        let profHtml = '';
        const skills = data.skill_proficiencies || [];
        const saves = data.saving_throws || [];
        if (skills.length > 0 || saves.length > 0) {
            profHtml = `
                <div style="font-size:11px;margin-bottom:10px;color:#aaa;">
                    ${saves.length ? `<div><span style="color:#888">豁免:</span> ${saves.join(', ')}</div>` : ''}
                    ${skills.length ? `<div><span style="color:#888">技能:</span> ${skills.join(', ')}</div>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="dnd-preview-content">
                <!-- 基本信息 -->
                <div style="text-align:center;margin-bottom:15px;">
                    <div style="font-size:20px;font-weight:bold;color:var(--dnd-text-highlight);">${data.name || '未命名'}</div>
                    <div style="font-size:12px;color:#888;margin-top:3px;">${data.race_gender_age || (data.race || '?')} · ${data.class || '?'} · Lv.${data.level || 1}</div>
                </div>
                
                <!-- 属性值 -->
                ${Object.keys(stats).length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:5px;margin-bottom:15px;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;">
                    ${['STR','DEX','CON','INT','WIS','CHA'].map(attr => `
                        <div style="text-align:center;">
                            <div style="font-size:12px;font-weight:bold;color:var(--dnd-text-header);">${stats[attr] || 10}</div>
                            <div style="font-size:9px;color:#666;">${getMod(stats[attr])} ${attr}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resHtml}
                ${profHtml}

                <!-- 特性 & 专长 -->
                ${renderList('🌟 特性 & 专长', data.features, f => `
                    <div style="margin-bottom:4px;font-size:12px;">
                        <span style="color:#ccc;font-weight:bold;">${f.name}</span>
                        <div style="color:#888;font-size:10px;line-height:1.3;">${f.desc || ''}</div>
                    </div>
                `)}

                <!-- 法术 -->
                ${renderList('✨ 法术', data.spells, s => `
                    <div style="margin-bottom:4px;font-size:12px;">
                        <span style="color:#b585ff;font-weight:bold;">${s.name}</span>
                        <span style="color:#666;font-size:10px;">(${s.level===0?'戏法':s.level+'环'})</span>
                        <div style="color:#888;font-size:10px;line-height:1.3;">${s.desc || ''}</div>
                    </div>
                `)}
                
                <!-- 其他信息 -->
                ${data.background ? `<div style="font-size:12px;margin-top:10px;"><span style="color:#888;">背景:</span> ${data.background}</div>` : ''}
                ${data.alignment ? `<div style="font-size:12px;"><span style="color:#888;">阵营:</span> ${data.alignment}</div>` : ''}
                ${data.personality ? `<div style="font-size:12px;"><span style="color:#888;">性格:</span> ${data.personality}</div>` : ''}
                ${data.backstory ? `<div style="font-size:11px;color:#aaa;margin-top:10px;padding-top:10px;border-top:1px dashed #444;line-height:1.5;">${data.backstory.substring(0, 200)}${data.backstory.length > 200 ? '...' : ''}</div>` : ''}
            </div>
        `;
    },

    // 绑定角色创建器事件
    bindCharacterCreatorEvents($container) {
        const { $ } = getCore();
        const state = this._charCreatorState;
        
        // 角色类型切换按钮
        $container.find('#dnd-creator-type-pc').on('click', () => {
            if (state.currentStep !== 'init') return;
            state.characterType = 'pc';
            this.saveCreatorState();
            this.renderCharacterCreationPanel($container.parent()); // re-render panel
        });
        $container.find('#dnd-creator-type-party').on('click', () => {
            if (state.currentStep !== 'init') return;
            state.characterType = 'party';
            this.saveCreatorState();
            this.renderCharacterCreationPanel($container.parent());
        });

        // 属性生成器按钮
        $container.find('#dnd-creator-stats-btn').on('click', (e) => {
            if ($(e.target).prop('disabled')) return;
            this.showStatsGenerator(e);
        });

        // 开始创建按钮
        $container.find('#dnd-creator-start-btn').on('click', async () => {
            // 检查配置 (从 SettingsManager 获取最新)
            const currentConfig = await SettingsManager.getAPIConfig();
            // 更新本地状态以确保同步
            state.apiConfig = currentConfig;

            if (!state.apiConfig.url || !state.apiConfig.model) {
                NotificationSystem.warning('请先在设置中配置 API 地址和模型', '配置缺失');
                // Use global reference for cross-module call if needed, but this is mixin
                // UIRenderer is 'this' when called
                this.renderPanel('settings');
                return;
            }

            state.currentStep = 'chatting';
            state.conversationHistory = [];
            state.characterData = {};
            this.saveCreatorState(); // 保存状态变更
            
            // 发送初始系统消息给 AI
            await this.sendCreatorMessage(null, true);
        });
        
        // 重置按钮
        $container.find('#dnd-creator-reset-btn').on('click', async () => {
            const confirmed = await NotificationSystem.confirm('确定要重新开始吗？当前对话和角色数据将被清除。', {
                title: '重新开始',
                confirmText: '确定',
                type: 'warning'
            });
            if (confirmed) {
                // 重置为初始状态，但保留配置
                this._charCreatorState = {
                    selectedPresetId: state.selectedPresetId,
                    apiConfig: state.apiConfig,
                    modelList: state.modelList,
                    characterType: state.characterType,
                    conversationHistory: [],
                    characterData: {},
                    isGenerating: false,
                    currentStep: 'init'
                };
                this.saveCreatorState(); // 保存（覆盖）旧状态
                this.renderCharacterCreationPanel($container.parent());
            }
        });
        
        // 发送按钮
        $container.find('#dnd-creator-send-btn').on('click', () => {
            const $input = $container.find('#dnd-creator-user-input');
            const text = $input.val().trim();
            if (text) {
                this.sendCreatorMessage(text);
                $input.val('');
            }
        });
        
        // 回车发送
        $container.find('#dnd-creator-user-input').on('keypress', (e) => {
            if (e.which === 13 && !e.shiftKey) {
                e.preventDefault();
                $container.find('#dnd-creator-send-btn').click();
            }
        });
        
        // 确认创建
        $container.find('#dnd-creator-confirm-btn').on('click', async () => {
            await this.finalizeCharacterCreation();
        });
        
        // 继续修改
        $container.find('#dnd-creator-modify-btn').on('click', () => {
            state.currentStep = 'chatting';
            this.saveCreatorState();
            this.renderCharacterCreationPanel($container.parent());
        });
        
        // 滚动到底部
        const $chatHistory = $container.find('#dnd-creator-chat-history');
        if ($chatHistory.length) {
            $chatHistory.scrollTop($chatHistory[0].scrollHeight);
        }
    },

    // [新增] 渲染聊天选项
    renderChatOptions(config) {
        const { $ } = getCore();
        const $chatHistory = $('#dnd-creator-chat-history');
        const { question, options, type } = config;
        const isMulti = type === 'multiple';
        
        const buttonsHtml = options.map(opt => `
            <button class="dnd-creator-option-btn" style="
                background:rgba(255,255,255,0.05);
                border:1px solid var(--dnd-border-gold);
                color:var(--dnd-text-main);
                padding:8px 12px;
                border-radius:4px;
                cursor:pointer;
                text-align:left;
                transition:all 0.2s;
                font-size:13px;
            " onclick="window.DND_Dashboard_UI.handleCreatorOption('${opt}', '${isMulti}')">
                ${opt}
            </button>
        `).join('');

        const html = `
            <div class="dnd-chat-msg dnd-anim-entry" style="background:rgba(157, 139, 108, 0.1); border-left:3px solid var(--dnd-border-gold); padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                <div style="font-size:12px;color:var(--dnd-text-highlight);margin-bottom:8px;font-weight:bold;">❓ ${question}</div>
                <div style="display:flex;flex-direction:column;gap:5px;">
                    ${buttonsHtml}
                </div>
            </div>
        `;
        
        $chatHistory.append(html);
        $chatHistory.scrollTop($chatHistory[0].scrollHeight);
    },

    // [新增] 处理选项点击
    handleCreatorOption(value, isMulti) {
        // 暂时只支持单选，多选后续扩展
        // 模拟用户输入
        this.sendCreatorMessage(value);
    },

    // 发送消息给 AI
    async sendCreatorMessage(userMessage, isInitial = false) {
        const { $ } = getCore();
        const state = this._charCreatorState;
        const $chatHistory = $('#dnd-creator-chat-history');
        const $input = $('#dnd-creator-user-input');
        const $sendBtn = $('#dnd-creator-send-btn');
        
        if (state.isGenerating) return;
        state.isGenerating = true;
        
        // 优化：不直接重绘整个面板，而是通过 DOM 操作更新
        $input.prop('disabled', true);
        $sendBtn.text('⏳ 生成中...').prop('disabled', true);
        
        try {
            // 如果有用户消息，立即追加到聊天记录 DOM
            if (userMessage) {
                const idx = state.conversationHistory.length;
                const userMsgHtml = `
                    <div class="dnd-chat-msg dnd-anim-entry" style="background:rgba(52, 152, 219, 0.1); border-left:3px solid #3498db; padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;">👤 你</div>
                        <div style="color:var(--dnd-text-main);line-height:1.5;white-space:pre-wrap;">${this.formatChatMessage(userMessage)}</div>
                    </div>`;
                $chatHistory.append(userMsgHtml);
                $chatHistory.scrollTop($chatHistory[0].scrollHeight);
                
                state.conversationHistory.push({ role: 'user', content: userMessage });
                this.saveCreatorState(); // 保存
            } else if (isInitial) {
                const initMsg = '你好，我想创建一个 DND 5E 角色。请引导我开始。';
                state.conversationHistory.push({ role: 'user', content: initMsg });
                this.saveCreatorState(); // 保存
            }

            // 构建发送给 API 的消息数组
            const messages = [];
            const charTypeLabel = state.characterType === 'pc' ? '主角' : '队友';
            const systemPrompt = `你是一个 DND 5E 角色创建向导。你的任务是通过对话引导用户创建一个完整的${charTypeLabel}角色。

请遵循以下流程：
1. 首先询问用户想要创建什么类型的角色（战士、法师、盗贼等），或者让他们描述一个角色概念
2. 根据用户的回答，建议合适的种族和职业组合
3. 帮助用户确定属性值分配（使用标准点数购买或让用户自选）
4. 询问角色的背景、性格特点（理想、牵绊、缺陷）
5. 询问角色的外貌特征（发色、眼睛、身高、特征）
6. 帮助用户构思一个简短的背景故事（不超过300字）

在对话过程中，请：
- 每次只问1-2个问题，不要一次问太多
- 提供具体的选项供用户选择（通过 CHARACTER_OPTIONS 输出）
- 解释你的建议理由
- 保持友好和鼓励的语气

当需要用户做选择时（如选择种族、职业、属性分配方式），请输出一个选项块：
\`\`\`CHARACTER_OPTIONS
{
"question": "请选择你的种族...",
"type": "single",
"options": ["人类", "精灵", "矮人", "其他"]
}
\`\`\`

当收集到足够信息后，输出一个特殊格式的角色数据块（严格遵守此JSON格式）：
\`\`\`CHARACTER_DATA
{
"name": "角色全名",
"race_gender_age": "种族/性别/年龄（如：半精灵/男/32岁）",
"class": "职业及子职（如：圣武士(复仇誓言) Lv1）",
"level": 1,
"appearance": "外貌描述（详细的外貌特征）",
"personality": "性格特点（核心性格、理想、牵绊、缺陷）",
"backstory": "背景故事（不超过300字）",
"stats": {"STR": 10, "DEX": 10, "CON": 10, "INT": 10, "WIS": 10, "CHA": 10},
"hp": "当前HP/最大HP（如：12/12）",
"ac": 10,
"initiative": 0,
"speed": "30尺(6格)",
"saving_throws": ["力量", "体质"],
"skill_proficiencies": ["运动", "威吓"],
"passive_perception": 10,
"resources": {
    "spell_slots": {"1级": "3/4"},
    "class_resources": {"动作如潮": "1/1"},
    "hit_dice": "3/3"
},
"features": [
    {"name": "战斗风格(防御)", "type": "职业特性", "desc": "着装护甲时AC+1"},
    {"name": "复苏之风", "type": "职业特性", "desc": "用附赠动作恢复1d10+等级点HP"}
],
"spells": [
    {"name": "魔能爆", "level": 0, "school": "塑能", "time": "1动作", "range": "120尺", "comp": "V,S", "duration": "立即", "desc": "1d10力场伤害..."},
    {"name": "护盾术", "level": 1, "school": "防护", "time": "1反应", "range": "自身", "comp": "V,S", "duration": "1轮", "desc": "AC+5直到回合结束..."}
]${state.characterType === 'party' ? `,
"member_type": "同伴",
"control_method": "AI控制"` : ''}
}
\`\`\`

现在开始与用户对话。`;

            messages.push({ role: 'system', content: systemPrompt });
            state.conversationHistory.forEach(msg => {
                messages.push({ role: msg.role, content: msg.content });
            });
            
            // 调用 API
            const response = await TavernAPI.generate(messages, {
                customConfig: state.apiConfig,
                maxTokens: 4096 // 增加最大 Token 数以防止截断
            });
            
            // 处理响应
            if (response) {
                state.conversationHistory.push({ role: 'assistant', content: response });
                
                // 追加到 DOM
                const aiMsgHtml = `
                    <div class="dnd-chat-msg dnd-anim-entry" style="background:rgba(155, 89, 182, 0.1); border-left:3px solid #9b59b6; padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;">🤖 AI 向导</div>
                        <div style="color:var(--dnd-text-main);line-height:1.5;white-space:pre-wrap;">${this.formatChatMessage(response)}</div>
                    </div>`;
                $chatHistory.append(aiMsgHtml);
                
                // [新增] 解析选项
                const optMatch = response.match(/```CHARACTER_OPTIONS\s*([\s\S]*?)```/);
                if (optMatch) {
                    try {
                        const optData = JSON.parse(optMatch[1]);
                        this.renderChatOptions(optData);
                    } catch(e) { console.error('Options parse error', e); }
                }

                $chatHistory.scrollTop($chatHistory[0].scrollHeight);
                
                // 尝试解析角色数据
                const dataMatch = response.match(/```CHARACTER_DATA\s*([\s\S]*?)```/);
                if (dataMatch) {
                    try {
                        const charData = JSON.parse(dataMatch[1]);
                        state.characterData = charData;
                        state.currentStep = 'reviewing';
                        // 更新预览区域
                        $('#dnd-creator-preview').html(this.renderCharacterPreview(state.characterData));
                        console.log('[CharCreator] 角色数据已解析:', charData);
                    } catch(e) {
                        console.error('[CharCreator] 解析角色数据失败:', e);
                    }
                }
                
                // 保存更新后的状态
                this.saveCreatorState();
            }
        } catch (error) {
            console.error('[CharCreator] API 调用失败:', error);
            const errMsgHtml = `
                <div class="dnd-chat-msg dnd-anim-entry" style="background:rgba(192, 57, 43, 0.1); border-left:3px solid #e74c3c; padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                    <div style="font-size:11px;color:#888;margin-bottom:4px;">🤖 系统消息</div>
                    <div style="color:var(--dnd-text-main);line-height:1.5;">❌ 抱歉，生成失败：${error.message}</div>
                </div>`;
            $chatHistory.append(errMsgHtml);
            $chatHistory.scrollTop($chatHistory[0].scrollHeight);
            
            state.conversationHistory.push({
                role: 'assistant',
                content: `❌ 抱歉，生成失败：${error.message}\n\n请检查 API 连接或重试。`
            });
        } finally {
            state.isGenerating = false;
            
            // 恢复 UI 状态
            $input.prop('disabled', false).val('').focus();
            $sendBtn.text('📤 发送').prop('disabled', false);
            
            // 如果状态变为 reviewing 且确认按钮未显示（即刚完成解析），则需要完整重绘以显示确认按钮
            // 或者我们可以只追加按钮到 DOM
            if (state.currentStep === 'reviewing' && $('#dnd-creator-confirm-btn').length === 0) {
                // Re-render to show buttons
                this.renderCharacterCreationPanel($('#dnd-creator-chat-history').closest('#dnd-content'));
            }
        }
    },

    // 完成角色创建，保存数据
    async finalizeCharacterCreation() {
        const { $ } = getCore();
        const state = this._charCreatorState;
        const data = state.characterData;
        
        if (!data || !data.name) {
            NotificationSystem.warning('角色数据不完整，无法保存');
            return;
        }
        
        try {
            // 获取原始数据
            const rawData = DataManager.getAllData();
            if (!rawData) {
                throw new Error('无法获取数据库');
            }
            
            // 确定是主角(PC) 还是 队友(Party)
            const isPC = state.characterType === 'pc';
            
            // 统一使用 CHARACTER_* 表
            // 查找表对象 (增强查找逻辑，兼容不同前缀)
            const findTable = (frag) => Object.values(rawData).find(s =>
                s.uid === frag ||
                s.uid === `sheet_${frag}` ||
                s.uid === `sheet_CHARACTER_${frag}` ||
                (s.name && s.name.includes(frag))
            );
            
            const mainTable = findTable('CHARACTER_Registry') || findTable('Registry');
            const attrTable = findTable('CHARACTER_Attributes') || findTable('Attributes');
            const resTable = findTable('CHARACTER_Resources') || findTable('Resources');
            const skillLibTable = findTable('SKILL_Library');
            const skillLinkTable = findTable('CHARACTER_Skills');
            const featLibTable = findTable('FEAT_Library');
            const featLinkTable = findTable('CHARACTER_Feats');
            
            if (!mainTable) throw new Error('找不到角色注册表 (CHARACTER_Registry)');
            
            let charId;
            
            if (isPC) {
                charId = 'PC_MAIN';
                // 确保主角行存在 (通常初始化时已创建)
            } else {
                charId = 'ALLY_' + Date.now();
            }
            
            // 辅助函数：更新或插入行
            const updateOrInsert = (table, idVal) => {
                if (!table.content) table.content = [];
                if (table.content.length === 0) return; // 无表头，无法操作
                
                const headers = table.content[0];
                const idIdx = headers.indexOf('CHAR_ID');
                if (idIdx === -1) return;
                
                // 查找现有行
                let rowIndex = -1;
                // 从索引1开始遍历
                for (let i = 1; i < table.content.length; i++) {
                    if (table.content[i][idIdx] === idVal) {
                        rowIndex = i;
                        break;
                    }
                }
                
                // 构建新数据行 (基于 headers)
                const newRow = headers.map((h, i) => {
                    if (h === 'CHAR_ID') return idVal;
                    
                    // 映射字段
                    // Registry
                    if (h === '成员类型') return isPC ? '主角' : (data.member_type || '同伴');
                    if (h === '姓名') return data.name;
                    if (h === '种族/性别/年龄') return data.race_gender_age || `${data.race}/-/1`;
                    if (h === '职业') return data.class;
                    if (h === '外貌描述') return data.appearance;
                    if (h === '性格特点') return data.personality;
                    if (h === '背景故事') return data.backstory;
                    if (h === '加入时间' && !isPC) return '第1天'; // 简化处理
                    
                    // Attributes
                    if (h === '等级') return data.level || 1;
                    if (h === 'HP') return data.hp || '10/10';
                    if (h === 'AC') return data.ac || 10;
                    if (h === '先攻加值') return data.initiative || 0;
                    if (h === '速度') return data.speed || '30尺';
                    if (h === '属性值') return JSON.stringify(data.stats || {});
                    if (h === '豁免熟练') return JSON.stringify(data.saving_throws || []);
                    if (h === '技能熟练') return JSON.stringify(data.skill_proficiencies || []);
                    if (h === '被动感知') return data.passive_perception || 10;
                    if (h === '经验值' && isPC) return '0/300';
                    
                    // Resources
                    if (h === '法术位') return data.resources?.spell_slots ? JSON.stringify(data.resources.spell_slots) : null;
                    if (h === '职业资源') return data.resources?.class_resources ? JSON.stringify(data.resources.class_resources) : null;
                    if (h === '生命骰') return data.resources?.hit_dice || null;
                    if (h === '金币' && isPC) return 0;
                    
                    // 如果是更新，且没有提供新值，保留旧值
                    if (rowIndex !== -1 && table.content[rowIndex][i] !== undefined) {
                        return table.content[rowIndex][i];
                    }
                    return null;
                });
                
                if (rowIndex !== -1) {
                    table.content[rowIndex] = newRow;
                } else {
                    table.content.push(newRow);
                }
            };
            
            updateOrInsert(mainTable, charId);
            if (attrTable) updateOrInsert(attrTable, charId);
            if (resTable) updateOrInsert(resTable, charId);

            // 处理技能和法术
            const spells = data.spells || [];
            if (spells.length > 0 && skillLibTable && skillLinkTable) {
                spells.forEach(spell => {
                    // 1. 添加到技能库 (SKILL_Library)
                    let skillId = 'SKILL_' + Math.random().toString(36).substr(2, 8);
                    // 检查是否存在
                    const existingSkill = skillLibTable.content.find(row => row[1] === spell.name); // 假设第二列是名称
                    
                    if (existingSkill) {
                        skillId = existingSkill[0]; // 假设第一列是ID
                    } else {
                        const libHeaders = skillLibTable.content[0];
                        const newLibRow = libHeaders.map(h => {
                            if (h === 'SKILL_ID') return skillId;
                            if (h === '技能名称') return spell.name;
                            if (h === '技能类型') return '法术';
                            if (h === '环阶') return spell.level !== undefined ? spell.level : '0';
                            if (h === '学派') return spell.school || '-';
                            if (h === '施法时间') return spell.time || '-';
                            if (h === '射程') return spell.range || '-';
                            if (h === '成分') return spell.comp || '-';
                            if (h === '持续时间') return spell.duration || '-';
                            if (h === '效果描述') return spell.desc;
                            return null;
                        });
                        skillLibTable.content.push(newLibRow);
                    }

                    // 2. 添加到关联表 (CHARACTER_Skills)
                    // 这里简化：直接添加
                    const linkHeaders = skillLinkTable.content[0];
                    const newLinkRow = linkHeaders.map(h => {
                        if (h === 'LINK_ID') return 'LNK_' + Math.random().toString(36).substr(2, 8);
                        if (h === 'CHAR_ID') return charId;
                        if (h === 'SKILL_ID') return skillId;
                        if (h === '已准备') return '是';
                        return null;
                    });
                    skillLinkTable.content.push(newLinkRow);
                });
            }

            // 处理专长和特性
            const features = data.features || [];
            if (features.length > 0 && featLibTable && featLinkTable) {
                features.forEach(feat => {
                    let featId = 'FEAT_' + Math.random().toString(36).substr(2, 8);
                    const existingFeat = featLibTable.content.find(row => row[1] === feat.name);
                    
                    if (existingFeat) {
                        featId = existingFeat[0];
                    } else {
                        const libHeaders = featLibTable.content[0];
                        const newLibRow = libHeaders.map(h => {
                            if (h === 'FEAT_ID') return featId;
                            if (h === '专长名称') return feat.name;
                            if (h === '类别') return feat.type || '职业特性';
                            if (h === '效果描述') return feat.desc;
                            return null;
                        });
                        featLibTable.content.push(newLibRow);
                    }

                    const linkHeaders = featLinkTable.content[0];
                    const newLinkRow = linkHeaders.map(h => {
                        if (h === 'LINK_ID') return 'LNK_' + Math.random().toString(36).substr(2, 8);
                        if (h === 'CHAR_ID') return charId;
                        if (h === 'FEAT_ID') return featId;
                        return null;
                    });
                    featLinkTable.content.push(newLinkRow);
                });
            }
            
            // 保存
            await DiceManager.saveData(rawData);
            
            // 更新状态
            state.currentStep = 'complete';
            this.saveCreatorState(); // 保存状态
            this.renderCharacterCreationPanel($('#dnd-creator-chat-history').closest('#dnd-content'));
            
            // 显示成功通知
            NotificationSystem.success(`🎉 ${isPC ? '主角' : '队友'} "${data.name}" 创建成功！`, '角色创建');
            
        } catch (error) {
            console.error('[CharCreator] 保存失败:', error);
            NotificationSystem.error('保存失败：' + error.message);
        }
    }
});

;// ./src/ui/modules/UIPanels.js







/* harmony default export */ const UIPanels = ({
    renderPanel(panelName) {
        const { $ } = getCore();
        const $content = $('#dnd-content');
        if (!$content.length) return;
        
        $content.empty();
        
        // 添加面板切换过渡
        $content.removeClass('dnd-panel-transition');
        // 强制重绘以重置动画
        void $content[0].offsetWidth;
        $content.addClass('dnd-panel-transition');

        switch (panelName) {
            case 'create':
                // Use the enhanced version from UICharacter (mix-in style)
                UICharacter.renderCharacterCreationPanel.call(this, $content);
                break;
            case 'party':
                this.renderPartyPanel($content);
                break;
            case 'quests':
                this.renderQuestsPanel($content);
                break;
            case 'inventory':
                this.renderInventoryPanel($content);
                break;
            case 'combat':
                this.renderCombatPanel($content);
                break;
            case 'world':
                this.renderWorldPanel($content);
                break;
            case 'logs':
                this.renderLogsPanel($content);
                break;
            case 'npcs':
                this.renderNPCPanel($content);
                break;
            case 'archives':
                this.renderArchivesPanel($content);
                break;
            case 'settings':
                this.renderSettingsPanel($content);
                break;
            default:
                $content.html('<div style="padding:20px">开发中...</div>');
        }
    },

    renderPartyPanel($container) {
        const { $ } = getCore();
        const party = DataManager.getPartyData() || [];
        
        // [新增] 队伍工具栏 - 导入/导出按钮
        const $toolbar = $(`
            <div class="dnd-party-toolbar" style="display:flex;gap:10px;margin-bottom:15px;padding:10px;background:rgba(0,0,0,0.3);border-radius:6px;border:1px solid var(--dnd-border-inner);">
                <div style="flex:1;display:flex;align-items:center;gap:10px;">
                    <span style="font-weight:bold;color:var(--dnd-text-highlight);">👥 冒险队伍</span>
                    <span style="font-size:12px;color:#888;">(${party.length} 名成员)</span>
                </div>
                <button class="dnd-btn dnd-clickable dnd-export-party-btn" style="background:#1a1a1c;border:1px solid var(--dnd-border-gold);color:var(--dnd-text-main);padding:6px 12px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-download"></i> 导出队伍
                </button>
                <button class="dnd-btn dnd-clickable dnd-import-party-btn" style="background:#1a1a1c;border:1px solid var(--dnd-border-inner);color:var(--dnd-text-main);padding:6px 12px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-upload"></i> 导入队伍
                </button>
                <button class="dnd-btn dnd-clickable dnd-import-fvtt-btn" style="background:#1a1a1c;border:1px solid var(--dnd-border-inner);color:#e67e22;padding:6px 12px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-file-import"></i> 导入 FVTT
                </button>
            </div>
        `);

        const self = this;
        // 绑定导出按钮事件
        $toolbar.find('.dnd-export-party-btn').on('click', function() {
            self.exportPartyToFile();
        });

        // 绑定导入按钮事件
        $toolbar.find('.dnd-import-party-btn').on('click', function() {
            self.importPartyFromFile();
        });

        // 绑定 FVTT 导入按钮事件
        $toolbar.find('.dnd-import-fvtt-btn').on('click', function() {
            self.importFVTTFromFile();
        });

        $container.empty();
        $container.append($toolbar);

        if (party.length === 0) {
            $container.append('<div style="padding:20px; text-align:center;">暂无队伍数据，请确保已连接数据库并加载 DND 模板。</div>');
            return;
        }

        const $grid = $('<div class="dnd-grid"></div>');

        party.forEach((char, index) => {
            // 解析 HP
            let hpCurrent = 0, hpMax = 0, hpPercent = 0;
            if (char['HP']) {
                const parts = char['HP'].toString().split('/');
                if (parts.length === 2) {
                    hpCurrent = parseInt(parts[0]) || 0;
                    hpMax = parseInt(parts[1]) || 1;
                    hpPercent = Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100));
                }
            }

            // 解析属性
            let statsHtml = '';
            // 优先尝试通用解析 (支持 JSON 和 STR:10|DEX:12 格式)
            const statsObj = DataManager.parseValue(char['属性值'], 'stats') || {};

            if (Object.keys(statsObj).length > 0) {
                statsHtml = '<div style="display:flex; justify-content:space-between; margin-bottom:10px; background:rgba(0,0,0,0.2); padding:5px; border-radius:4px;">';
                Object.keys(statsObj).forEach(k => {
                    statsHtml += `<div style="text-align:center;"><div style="font-size:10px;color:#888">${k}</div><div style="font-weight:bold">${statsObj[k]}</div></div>`;
                });
                statsHtml += '</div>';
            }

            const charId = char['PC_ID'] || char['CHAR_ID'] || char['姓名'];
            const avatarHtml = this.renderAvatar(char['姓名'], charId, 40);
            
            // 解析熟练技能 (用于悬浮提示)
            let skillTooltip = '点击查看详情';
            try {
                if (char['技能熟练']) {
                    let skills = [];
                    // 处理 JSON 字符串或数组字符串
                    if (typeof char['技能熟练'] === 'string') {
                        if (char['技能熟练'].startsWith('[')) {
                            skills = JSON.parse(char['技能熟练']);
                        } else {
                            skills = char['技能熟练'].split(/[,;，；]/);
                        }
                    } else if (Array.isArray(char['技能熟练'])) {
                        skills = char['技能熟练'];
                    }
                    
                    if (skills && skills.length > 0) {
                        skillTooltip = '熟练技能: ' + skills.map(s => s.trim()).join(', ');
                    }
                }
            } catch(e) {}

            const cardHtml = `
                <div class="dnd-char-card dnd-anim-entry dnd-clickable" style="cursor:pointer; animation-delay: ${index * 0.05}s" title="${skillTooltip}">
                    <div class="dnd-card-header" style="justify-content:flex-start;gap:10px;">
                        ${avatarHtml}
                        <div style="flex:1;overflow:hidden;">
                            <div class="dnd-char-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${char['姓名'] || '未知'}</div>
                            <div class="dnd-char-lvl" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${char['种族/性别/年龄'] || ''} | ${char['职业'] || ''}</div>
                        </div>
                    </div>
                    <div class="dnd-card-body">
                        ${statsHtml}
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">AC (护甲)</span>
                            <span class="dnd-stat-val">${char['AC'] || '-'}</span>
                        </div>
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">先攻加值</span>
                            <span class="dnd-stat-val">${char['先攻加值'] || '+0'}</span>
                        </div>
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">被动感知</span>
                            <span class="dnd-stat-val">${char['被动感知'] || '10'}</span>
                        </div>
                        
                        <div>
                            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
                                <span>HP</span>
                                <span>${hpCurrent} / ${hpMax}</span>
                            </div>
                            <div class="dnd-bar-container dnd-bar-hp">
                                <div class="dnd-bar-fill" style="width: ${hpPercent}%"></div>
                            </div>
                        </div>

                        ${char['经验值'] ? `
                        <div>
                            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
                                <span>XP</span>
                                <span>${char['经验值']}</span>
                            </div>
                            <div class="dnd-bar-container dnd-bar-exp">
                                <div class="dnd-bar-fill" style="width: 50%"></div>
                            </div>
                        </div>` : ''}
                        
                        <div style="margin-top:5px;font-size:12px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                            ${char['外貌描述'] || '无描述'}
                        </div>
                    </div>
                </div>
            `;
            
            const $card = $(cardHtml);
            $card.on('click', (e) => {
                Logger.debug('[PartyPanel] Clicked card for', char['姓名']);
                // 使用统一的角色详情卡片，而不是简陋的 Modal
                // 传递点击事件以便在鼠标位置显示卡片
                self.showCharacterCard(char, e);
            });
            
            $grid.append($card);
        });
        $container.append($grid);
    },

    renderQuestsPanel($container) {
        const { $ } = getCore();
        const quests = DataManager.getTable('QUEST_Active');
        if (!quests) {
            $container.html('暂无任务数据。');
            return;
        }

        const $list = $('<div style="display:flex;flex-direction:column;gap:15px;"></div>');

        quests.forEach((q, index) => {
            const statusColor = q['状态'] === '已完成' ? '#3a6b4a' : (q['状态'] === '已失败' ? '#8a2c2c' : '#c5a059');
            
            const itemHtml = `
                <div class="dnd-anim-entry" style="animation-delay:${index * 0.05}s; background:var(--dnd-bg-panel);border:1px solid var(--dnd-border-inner);padding:15px;border-radius:4px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                        <span style="font-weight:bold;color:var(--dnd-text-header);font-size:18px;">${q['任务名称']}</span>
                        <span style="background:${statusColor};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">${q['状态']}</span>
                    </div>
                    <div style="font-size:14px;color:var(--dnd-text-main);margin-bottom:8px;">${q['目标描述'] || ''}</div>
                    <div style="font-size:12px;color:var(--dnd-text-dim);">
                        发布者: ${q['发布者'] || '-'} | 奖励: ${q['奖励'] || '-'}
                    </div>
                </div>
            `;
            $list.append(itemHtml);
        });
        $container.append($list);
    },

    renderCombatPanel($container) {
        const { $ } = getCore();
        const encounters = DataManager.getTable('COMBAT_Encounter');
        const mapData = DataManager.getTable('COMBAT_BattleMap');

        // 布局
        const $layout = $('<div style="display:flex;gap:20px;height:100%;"></div>');
        const $sidebar = $('<div style="width:250px;background:rgba(0,0,0,0.3);padding:10px;overflow-y:auto;"></div>');
        const $mapArea = $('<div class="dnd-map-container"></div>');

        $sidebar.html('<h3 style="color:var(--dnd-text-header);border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;">先攻列表</h3>');
        
        if (encounters) {
            const sorted = [...encounters].sort((a, b) => {
                const valA = parseInt(a['先攻/位置']) || 0;
                const valB = parseInt(b['先攻/位置']) || 0;
                return valB - valA;
            });

            sorted.forEach(unit => {
                const isActive = unit['是否为当前行动者'] === '是';
                const hp = unit['HP状态'] || '??/??';
                const activeStyle = isActive ? 'background:rgba(197, 160, 89, 0.2);border-left:3px solid var(--dnd-border-gold);' : '';
                
                const rowHtml = `
                    <div style="padding:8px;border-bottom:1px solid #333;display:flex;justify-content:space-between;${activeStyle}">
                        <div>
                            <div style="font-weight:bold;color:${unit['阵营'] === '敌方' ? 'var(--dnd-accent-red)' : 'var(--dnd-text-main)'}">${unit['单位名称']}</div>
                            <div style="font-size:12px;color:#888;">HP: ${hp}</div>
                        </div>
                        <div style="font-size:16px;font-weight:bold;color:var(--dnd-text-header)">${parseInt(unit['先攻/位置'])||0}</div>
                    </div>
                `;
                $sidebar.append(rowHtml);
            });
        } else {
            $sidebar.append('<div style="color:#666">非战斗状态</div>');
        }

        if (mapData && mapData.length > 0) {
            const config = mapData.find(m => m['类型'] === 'Config');
            let cols = 20, rows = 20;
            if (config && config['坐标']) {
                // Config 行的坐标字段存的是尺寸: {w:20,h:20} 或 "20,20"
                const size = DataManager.parseValue(config['坐标'], 'size'); // 使用 size 解析器
                if (size) {
                    if (size.w) cols = size.w;
                    if (size.h) rows = size.h;
                }
            }

            // 移除全屏版战斗地图显示，仅保留文字提示或预留空间
            $mapArea.html('<div style="color:#888;padding:20px;text-align:center;">（战斗地图已隐藏，请使用 HUD 查看）</div>');
        } else {
            $mapArea.html('<div style="color:#666">无地图数据</div>');
        }

        $layout.append($sidebar).append($mapArea);
        $container.append($layout);
    },

    renderInventoryPanel($c) {
        const items = DataManager.getTable('ITEM_Inventory');
        if(!items || items.length === 0) {
            $c.html('<div style="padding:20px;text-align:center;color:#888">🎒 背包空空如也</div>');
            return;
        }

        // 按类别分组
        const categories = {};
        const equippedItems = [];
        const allCats = new Set();
        
        items.forEach(i => {
            const isEquipped = i['已装备'] === '是' || i['已装备'] === true || String(i['已装备']).toLowerCase() === 'true';
            if (isEquipped) {
                equippedItems.push(i);
            }
            
            const cat = i['类别'] || '杂物';
            allCats.add(cat);
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(i);
        });

        const sortedCats = [...allCats].sort();

        const { $ } = getCore();
        const $container = $('<div style="display:flex;flex-direction:column;gap:20px;"></div>');

        // 获取所有持有者 (Owner)
        const allOwners = new Set();
        items.forEach(i => {
            if (i['所属人']) allOwners.add(i['所属人']);
        });
        const sortedOwners = [...allOwners].sort();

        // 搜索和筛选区域 (Panel)
        const searchHtml = `
            <div style="background:rgba(0,0,0,0.3);padding:10px;border-radius:6px;border:1px solid var(--dnd-border-inner);display:flex;gap:10px;align-items:center;">
                <div style="font-weight:bold;color:var(--dnd-text-highlight);white-space:nowrap;">🔍 查找物品</div>
                <input type="text" id="dnd-panel-inv-search" placeholder="物品名称..." style="flex:1;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:6px 10px;border-radius:4px;" oninput="window.DND_Dashboard_UI.filterPanelInventory()">
                <select id="dnd-panel-inv-filter" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:6px;border-radius:4px;" onchange="window.DND_Dashboard_UI.filterPanelInventory()">
                    <option value="">全部分类</option>
                    ${sortedCats.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="dnd-panel-inv-owner" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:6px;border-radius:4px;" onchange="window.DND_Dashboard_UI.filterPanelInventory()">
                    <option value="">全部持有者</option>
                    ${sortedOwners.map(o => `<option value="${o}">${o}</option>`).join('')}
                    <option value="无">无持有者</option>
                </select>
            </div>
        `;
        $container.append(searchHtml);

        // 1. 已装备区域 (仪表盘样式)
        if (equippedItems.length > 0) {
            const $equipSection = $(`
                <div class="dnd-inv-section-equipped" style="background:rgba(0,0,0,0.3);padding:15px;border-radius:6px;border:1px solid var(--dnd-border-gold);">
                    <div style="font-size:16px;font-weight:bold;color:var(--dnd-text-header);margin-bottom:10px;display:flex;align-items:center;gap:10px;">
                        <span>⚔️ 已装备</span>
                        <span style="font-size:12px;background:var(--dnd-accent-green);color:#fff;padding:2px 6px;border-radius:4px;">${equippedItems.length}</span>
                    </div>
                    <div class="dnd-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;"></div>
                </div>
            `);
            
            const $grid = $equipSection.find('.dnd-grid');
            equippedItems.forEach((i, idx) => {
                const card = this.renderItemCard(i, true, idx * 0.05);
                // 为卡片添加 data 属性以便筛选
                const $card = $(card);
                $card.attr('data-name', i['物品名称']);
                $card.attr('data-category', i['类别'] || '杂物');
                $card.attr('data-owner', i['所属人'] || '');
                $grid.append($card);
            });
            $container.append($equipSection);
        }

        // 2. 分类列表 (可折叠)
        Object.keys(categories).forEach(cat => {
            const catItems = categories[cat];
            const $catSection = $(`
                <div class="dnd-inv-category" data-category="${cat}" style="background:var(--dnd-bg-panel);border:1px solid var(--dnd-border-inner);border-radius:4px;overflow:hidden;">
                    <div class="dnd-inv-header" style="padding:10px 15px;background:rgba(255,255,255,0.05);cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:bold;color:var(--dnd-text-main);">${cat} (${catItems.length})</span>
                        <span class="dnd-collapse-icon" style="color:var(--dnd-text-dim)">▼</span>
                    </div>
                    <div class="dnd-inv-body" style="padding:15px;display:none;">
                        <div class="dnd-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;"></div>
                    </div>
                </div>
            `);

            const $grid = $catSection.find('.dnd-grid');
            catItems.forEach((i, idx) => {
                const card = this.renderItemCard(i, false, idx * 0.05);
                const $card = $(card);
                $card.attr('data-name', i['物品名称']);
                $card.attr('data-category', cat);
                $card.attr('data-owner', i['所属人'] || '');
                $grid.append($card);
            });

            // 折叠逻辑
            $catSection.find('.dnd-inv-header').on('click', function() {
                const $body = $(this).next();
                const $icon = $(this).find('.dnd-collapse-icon');
                if ($body.is(':visible')) {
                    $body.slideUp(200);
                    $icon.text('▼');
                } else {
                    $body.slideDown(200);
                    $icon.text('▲');
                }
            });

            $container.append($catSection);
        });

        $c.html($container);
    },

    // [新增] 主面板物品过滤逻辑
    filterPanelInventory() {
        const { $ } = getCore();
        const searchText = $('#dnd-panel-inv-search').val().toLowerCase();
        const filterCat = $('#dnd-panel-inv-filter').val();
        const filterOwner = $('#dnd-panel-inv-owner').val();
        
        // 筛选所有卡片
        $('.dnd-item-card').each(function() {
            const $el = $(this);
            const name = ($el.attr('data-name') || '').toLowerCase();
            const category = ($el.attr('data-category') || '');
            const owner = ($el.attr('data-owner') || '');
            
            const matchSearch = !searchText || name.includes(searchText);
            const matchFilter = !filterCat || category === filterCat;
            // 如果选择了 owner，则必须匹配；如果没有选择，则显示所有
            // 如果 owner 是 '无'，则显示没有 owner 的物品
            const matchOwner = !filterOwner || (filterOwner === '无' ? !owner : owner === filterOwner);
            
            if (matchSearch && matchFilter && matchOwner) {
                $el.show();
            } else {
                $el.hide();
            }
        });
        
        // 处理分类容器的显示/隐藏和自动展开
        $('.dnd-inv-category').each(function() {
            const $cat = $(this);
            const catName = $cat.data('category');
            
            // 如果选择了特定分类，直接隐藏不匹配的分类块
            if (filterCat && catName !== filterCat) {
                $cat.hide();
                return;
            }
            
            // 检查该分类下是否有可见物品
            const hasVisibleItems = $cat.find('.dnd-item-card:visible').length > 0;
            
            if (hasVisibleItems) {
                $cat.show();
                // 如果有搜索词，自动展开以便查看结果
                if (searchText) {
                    $cat.find('.dnd-inv-body').slideDown(200);
                    $cat.find('.dnd-collapse-icon').text('▲');
                }
            } else {
                $cat.hide();
            }
        });
    },

    renderWorldPanel($c) {
        const global = DataManager.getTable('SYS_GlobalState');
        if(!global || !global[0]) { $c.html('无世界数据'); return; }
        const g = global[0];
        $c.html(`
            <div style="background:var(--dnd-bg-panel);padding:20px;border:1px solid var(--dnd-border-gold);">
                <h2 style="color:var(--dnd-text-header);margin-top:0;">${g['当前场景']}</h2>
                <p style="color:var(--dnd-text-main);">${g['场景描述']}</p>
                <hr style="border:0;border-bottom:1px solid #333;margin:15px 0;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div><span style="color:#888">时间:</span> ${g['游戏时间']}</div>
                    <div><span style="color:#888">天气:</span> ${g['天气状况']}</div>
                    <div><span style="color:#888">战斗模式:</span> ${g['战斗模式']}</div>
                </div>
            </div>
        `);
    },

    renderLogsPanel($c) {
        const logs = DataManager.getTable('LOG_Summary');
        if(!logs) { $c.html('无日志数据'); return; }
        let html = '<div style="display:flex;flex-direction:column;gap:15px;">';
        [...logs].reverse().forEach(l => {
            html += `
            <div style="background:rgba(255,255,255,0.05);padding:15px;border-left:3px solid var(--dnd-border-gold);">
                <div style="display:flex;justify-content:space-between;color:var(--dnd-text-dim);font-size:12px;margin-bottom:5px;">
                    <span>${l['时间跨度']} @ ${l['地点']}</span>
                    <span>${l['编码索引']}</span>
                </div>
                <div style="color:var(--dnd-text-main);line-height:1.5;">${l['纪要']}</div>
            </div>`;
        });
        html += '</div>';
        $c.html(html);
    },

    renderNPCPanel($c) {
        const { $ } = getCore();
        const npcs = DataManager.getTable('NPC_Registry');
        if (!npcs) { $c.html('无 NPC 数据'); return; }
        
        const $grid = $('<div class="dnd-grid"></div>');
        
        npcs.forEach((npc, index) => {
            const statusColor = npc['当前状态'] === '死亡' ? '#8a2c2c' : (npc['当前状态'] === '在场' ? '#3a6b4a' : '#888');
            
            const cardHtml = `
                <div class="dnd-char-card dnd-anim-entry dnd-clickable" style="cursor:pointer; animation-delay:${index * 0.05}s">
                    <div class="dnd-card-header">
                        <span class="dnd-char-name">${npc['姓名'] || '未知'}</span>
                        <span style="font-size:12px;color:${statusColor}">${npc['当前状态']}</span>
                    </div>
                    <div class="dnd-card-body">
                        <div style="font-size:12px;color:#aaa">${npc['种族/性别/年龄'] || '-'} | ${npc['职业/身份'] || '-'}</div>
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">位置</span>
                            <span class="dnd-stat-val">${npc['所在位置'] || '-'}</span>
                        </div>
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">关系</span>
                            <span class="dnd-stat-val">${npc['与主角关系'] || '-'}</span>
                        </div>
                        <div style="margin-top:10px;font-size:13px;line-height:1.4;color:#ccc;max-height:80px;overflow:hidden;">
                            ${npc['外貌描述'] || ''}
                        </div>
                    </div>
                </div>
            `;
            
            const $card = $(cardHtml);
            $card.on('click', () => {
                let detail = '';
                detail += `<div style="margin-bottom:10px"><strong>关键经历:</strong><br>${npc['关键经历'] || '无'}</div>`;
                detail += `<div style="margin-bottom:10px"><strong>外貌:</strong><br>${npc['外貌描述'] || '无'}</div>`;
                detail += `<div style="margin-top:20px;font-size:10px;color:#666">ID: ${npc['NPC_ID']}</div>`;
                this.showModal(npc['姓名'], detail); // Assuming showModal exists? Wait, showModal is not in list.
                // Original UIRenderer has showModal? No, it used UIRenderer.showItemDetailPopup in most places.
                // Checking original code for showModal...
                // renderNPCPanel calls UIRenderer.showModal(npc['姓名'], detail);
                // But showModal is NOT defined in UIRenderer object in the file provided!
                // Ah, check the very end of file or if I missed it.
                // init() has:
                // <div class="dnd-modal-overlay" id="dnd-modal-overlay">
                //    <div class="dnd-modal" id="dnd-modal-content"></div>
                // </div>
                // But no showModal function in the large object.
                // Wait, maybe I missed it in reading?
                // Let's check lines around 2482.
                // Line 2482: UIRenderer.showModal(npc['姓名'], detail);
                // I need to implement showModal or use showItemDetailPopup.
                // Given the HTML structure for modal exists in init(), I should implement it.
            });
            
            $grid.append($card);
        });
        $c.append($grid);
    },

    // Missing showModal implementation based on init HTML
    showModal(title, content) {
        const { $ } = getCore();
        const $overlay = $('#dnd-modal-overlay');
        const $modal = $('#dnd-modal-content');
        
        $modal.html(`
            <div style="display:flex;justify-content:space-between;margin-bottom:15px;border-bottom:1px solid #444;padding-bottom:10px;">
                <h3 style="margin:0;color:var(--dnd-text-highlight)">${title}</h3>
                <span style="cursor:pointer" onclick="$('#dnd-modal-overlay').removeClass('active')">✕</span>
            </div>
            <div>${content}</div>
        `);
        
        $overlay.addClass('active');
    },

    renderArchivesPanel($c) {
        const { $ } = getCore();
        const data = DataManager.getAllData();
        if (!data) { $c.html('无数据'); return; }
        
        const $selector = $('<div style="margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;"></div>');
        const $viewArea = $('<div style="overflow-x:auto;"></div>');
        
        Object.keys(data).forEach(key => {
            if (key === 'mate') return;
            const sheet = data[key];
            const $btn = $(`<button style="padding:5px 10px;background:#333;border:1px solid #555;color:#ccc;cursor:pointer;">${sheet.name || key}</button>`);
            
            $btn.on('click', () => {
                let html = `<h3 style="color:var(--dnd-text-highlight)">${sheet.name}</h3>`;
                html += `<table class="dnd-table"><thead><tr>`;
                if (sheet.content && sheet.content.length > 0) {
                    sheet.content[0].forEach(h => html += `<th>${h || ''}</th>`);
                    html += `</tr></thead><tbody>`;
                    sheet.content.slice(1).forEach(row => {
                        html += `<tr>`;
                        row.forEach(cell => html += `<td>${cell || ''}</td>`);
                        html += `</tr>`;
                    });
                    html += `</tbody></table>`;
                } else {
                    html += `<p>空表</p>`;
                }
                $viewArea.html(html);
                
                $selector.children().css('border-color', '#555');
                $btn.css('border-color', 'var(--dnd-border-gold)');
            });
            $selector.append($btn);
        });
        
        $c.append($selector).append($viewArea);
    },

    // [优化] 渲染快捷物品栏 (只显示装备和消耗品)
    renderQuickInventory($container) {
        const { $ } = getCore();
        const items = DataManager.getTable('ITEM_Inventory');
        if (!items) return;
        
        const equipped = [];
        const consumables = [];
        
        items.forEach(i => {
            const isEq = i['已装备'] === '是' || i['已装备'] === true || String(i['已装备']).toLowerCase() === 'true';
            const type = i['类别'] || '';
            
            if (isEq) equipped.push(i);
            else if (type.includes('消耗') || type.includes('药水') || type.includes('卷轴') || type.includes('食物')) {
                consumables.push(i);
            }
        });
        
        if (equipped.length === 0 && consumables.length === 0) return;
        
        let html = `<div style="padding:5px 10px;border-top:1px solid rgba(255,255,255,0.05);">`;
        
        // [已删除] 装备图标流 - 已移至底部装备按钮
        
        // 消耗品快捷栏
        if (consumables.length > 0) {
            html += `<div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:2px;">`;
            consumables.forEach((item, idx) => {
                const itemId = item['物品ID'] || item['物品名称'];
                html += `
                    <div class="dnd-quick-item dnd-clickable dnd-hud-entry dnd-hover-lift" data-id="${itemId}" title="[${item['数量']}] ${item['物品名称']}" style="animation-delay:${idx * 0.03}s; padding:2px 6px;background:rgba(255,255,255,0.05);border:1px solid #444;border-radius:10px;font-size:10px;white-space:nowrap;cursor:pointer;flex-shrink:0;">
                        ${item['物品名称']} x${item['数量']}
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        html += `</div>`;
        const $el = $(html);
        
        // 绑定点击事件
        const self = this;
        $el.find('.dnd-quick-item').on('click', function(e) {
            e.stopPropagation();
            const itemId = $(this).data('id');
            const item = items.find(i => (i['物品ID'] === itemId) || (i['物品名称'] === itemId));
            if (item) self.showMiniItemActions(item, e);
        });
        
        $container.append($el);
    }
});

;// ./src/ui/modules/UISettings.js










/* harmony default export */ const UISettings = ({
    async renderSettingsPanel($c) {
        const { $ } = getCore();
        const config = CONFIG.PRESET_SWITCHING;
        const presets = PresetSwitcher.getAvailablePresets();
        const apiConfig = await SettingsManager.getAPIConfig();
        
        // 构建预设选项 HTML
        const buildOptions = (selected) => {
            let html = `<option value="">-- 手动输入 --</option>`;
            presets.forEach(p => {
                const isSel = p === selected ? 'selected' : '';
                html += `<option value="${p}" ${isSel}>${p}</option>`;
            });
            return html;
        };

        const html = `
            <div style="padding:20px; max-width: 600px;">
                <h2 style="color:var(--dnd-text-highlight);border-bottom:1px solid var(--dnd-border-gold);padding-bottom:10px;margin-top:0;">
                    ⚙️ 仪表盘设置
                </h2>

                <!-- API 配置 -->
                <div style="background:rgba(0,0,0,0.3);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">🔌 API 连接配置</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        配置 OpenAI 兼容 API，用于角色生成和地图绘制。
                    </p>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">API 地址 (URL)</label>
                        <input type="text" id="dnd-set-api-url" value="${apiConfig.url || ''}" placeholder="https://api.openai.com/v1" style="width:100%;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">API 密钥 (Key)</label>
                        <input type="password" id="dnd-set-api-key" value="${apiConfig.key || ''}" placeholder="sk-..." style="width:100%;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">模型名称 (Model)</label>
                        <div style="display:flex;gap:10px;">
                            <input type="text" id="dnd-set-api-model" value="${apiConfig.model || ''}" placeholder="gpt-3.5-turbo" style="flex:1;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                            <button type="button" id="dnd-set-fetch-models" style="padding:0 15px;background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer;">获取列表</button>
                        </div>
                        <!-- 模型下拉列表容器 -->
                        <div id="dnd-model-list-container" style="display:none;margin-top:5px;">
                            <select id="dnd-set-model-select" style="width:100%;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                                <option value="">-- 选择模型 --</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div style="background:rgba(0,0,0,0.3);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">🔁 自动预设切换</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:20px;">
                        根据游戏内的战斗状态（全局状态表中的"战斗模式"字段），自动切换酒馆的 Plot/World Info 预设。
                    </p>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="dnd-cfg-enabled" ${config.ENABLED ? 'checked' : ''} style="margin-right:10px;transform:scale(1.2);">
                            <span style="font-weight:bold;">启用自动切换功能</span>
                        </label>
                    </div>
                    
                    <div class="dnd-cfg-group" style="opacity:${config.ENABLED ? 1 : 0.5};pointer-events:${config.ENABLED ? 'auto' : 'none'};transition:all 0.3s;">
                        <div style="margin-bottom:15px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">⚔️ 战斗状态预设</label>
                            <div style="display:flex;gap:10px;">
                                <select id="dnd-cfg-combat-sel" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;flex:1;">
                                    ${buildOptions(config.COMBAT_PRESET)}
                                </select>
                                <input type="text" id="dnd-cfg-combat-input" value="${config.COMBAT_PRESET}" placeholder="预设名称" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;flex:1;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">🧭 探索状态预设</label>
                            <div style="display:flex;gap:10px;">
                                <select id="dnd-cfg-explore-sel" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;flex:1;">
                                    ${buildOptions(config.EXPLORE_PRESET)}
                                </select>
                                <input type="text" id="dnd-cfg-explore-input" value="${config.EXPLORE_PRESET}" placeholder="预设名称" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;flex:1;">
                            </div>
                        </div>
                    </div>
                    
                    <div style="border-top:1px solid var(--dnd-border-inner);padding-top:20px;display:flex;justify-content:flex-end;gap:10px;">
                        <button type="button" id="dnd-cfg-refresh-presets" style="
                            background:rgba(52, 152, 219, 0.2);
                            border:1px solid #3498db;
                            color:#3498db;
                            padding:10px 15px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:13px;
                        ">🔄 刷新预设列表</button>
                        <button type="button" id="dnd-cfg-save" style="
                            background:linear-gradient(135deg, var(--dnd-accent-green), #27ae60);
                            border:none;
                            color:#fff;
                            padding:10px 25px;
                            border-radius:4px;
                            cursor:pointer;
                            font-weight:bold;
                            font-size:14px;
                            display:flex;align-items:center;gap:5px;
                        ">💾 保存设置</button>
                    </div>
                </div>

                <!-- 存储诊断工具 -->
                <div style="margin-top:20px;background:rgba(0,0,0,0.3);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">💾 存储空间诊断</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        检查 LocalStorage 使用情况。如果提示“存储已满”，请尝试清理旧数据。
                    </p>
                    <div id="dnd-storage-stats" style="margin-bottom:15px;font-size:12px;color:#ccc;"></div>
                    <button type="button" id="dnd-check-storage" class="dnd-clickable" style="
                        background:rgba(52, 152, 219, 0.2);
                        border:1px solid #3498db;
                        color:#3498db;
                        padding:8px 15px;
                        border-radius:4px;
                        cursor:pointer;
                        font-size:13px;
                    ">🔍 检查存储使用量</button>
                </div>
                
                <div style="margin-top:20px;padding:15px;background:rgba(197, 160, 89, 0.1);border-left:3px solid var(--dnd-border-gold);border-radius:4px;">
                    <div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:5px;">💡 提示</div>
                    <div style="font-size:12px;color:#ccc;line-height:1.5;">
                        预设名称必须与酒馆 World Info 界面中的 Plot 预设名称完全一致。<br>
                        如未找到预设，将会在控制台输出警告且不执行切换。
                    </div>
                </div>
            </div>
        `;
        
        $c.html(html);

        // 绑定存储检查按钮
        $c.find('#dnd-check-storage').on('click', function() {
            const stats = DBAdapter.analyzeStorage();
            let breakdownHtml = '<ul style="padding-left:20px;margin:5px 0;">';
            
            // Sort usage by size
            const sortedUsage = Object.entries(stats.breakdown).sort((a,b) => b[1] - a[1]);
            
            sortedUsage.forEach(([key, bytes]) => {
                const mb = (bytes / 1024 / 1024).toFixed(2);
                const percent = Math.round((bytes / stats.totalBytes) * 100);
                breakdownHtml += `<li><strong>${key}</strong>: ${mb} MB (${percent}%)</li>`;
            });
            breakdownHtml += '</ul>';
            
            let topKeysHtml = '<div style="margin-top:10px;"><strong>占用最大的 Top 5:</strong><br>';
            stats.topKeys.forEach(item => {
                topKeysHtml += `<div style="font-family:monospace;font-size:11px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(item.size/1024).toFixed(1)} KB - ${item.key}</div>`;
            });
            topKeysHtml += '</div>';

            const totalColor = stats.totalBytes > 4.5 * 1024 * 1024 ? '#e74c3c' : (stats.totalBytes > 3 * 1024 * 1024 ? '#f1c40f' : '#2ecc71');
            
            $c.find('#dnd-storage-stats').html(`
                <div style="margin-bottom:10px;">总使用量: <span style="color:${totalColor};font-weight:bold;font-size:14px;">${stats.totalMB} MB</span> / ~5.00 MB</div>
                ${breakdownHtml}
                ${topKeysHtml}
            `);
        });

        // 绑定刷新按钮 (API)
        $c.find('#dnd-set-fetch-models').on('click', async function(e) {
            if(e) e.preventDefault();
            const url = $c.find('#dnd-set-api-url').val().trim();
            const key = $c.find('#dnd-set-api-key').val().trim();
            const $btn = $(this);
            const $listContainer = $c.find('#dnd-model-list-container');
            const $select = $c.find('#dnd-set-model-select');
            
            if (!url) { NotificationSystem.warning('请输入 API URL'); return; }
            
            $btn.text('⌛').prop('disabled', true);
            try {
                const models = await TavernAPI.fetchModels(url, key);
                
                // 填充下拉列表
                let options = '<option value="">-- 选择模型 --</option>';
                models.forEach(m => {
                    options += `<option value="${m}">${m}</option>`;
                });
                $select.html(options);
                $listContainer.show();
                
                // 如果当前模型为空，自动填入第一个
                if (!$c.find('#dnd-set-api-model').val() && models.length > 0) {
                    $c.find('#dnd-set-api-model').val(models[0]);
                }
                
                NotificationSystem.success(`获取成功，共 ${models.length} 个模型。请从下拉列表选择。`);
            } catch(e) {
                NotificationSystem.error('获取失败: ' + e.message);
            } finally {
                $btn.text('获取列表').prop('disabled', false);
            }
        });

        // 绑定下拉列表选择事件
        $c.find('#dnd-set-model-select').on('change', function() {
            const val = $(this).val();
            if (val) {
                $c.find('#dnd-set-api-model').val(val);
            }
        });

        // 绑定刷新按钮 (预设)
        $c.find('#dnd-cfg-refresh-presets').on('click', function(e) {
            if(e) e.preventDefault();
            const $btn = $(this);
            $btn.text('⌛ 刷新中...').prop('disabled', true);
            
            // 重新获取列表
            const newPresets = PresetSwitcher.getAvailablePresets();
            
            // 更新下拉框
            const updateSelect = ($sel, currentVal) => {
                let html = `<option value="">-- 手动输入 --</option>`;
                newPresets.forEach(p => {
                    const isSel = p === currentVal ? 'selected' : '';
                    html += `<option value="${p}" ${isSel}>${p}</option>`;
                });
                $sel.html(html);
            };
            
            updateSelect($c.find('#dnd-cfg-combat-sel'), $c.find('#dnd-cfg-combat-input').val());
            updateSelect($c.find('#dnd-cfg-explore-sel'), $c.find('#dnd-cfg-explore-input').val());
            
            setTimeout(() => {
                $btn.text('🔄 刷新预设列表').prop('disabled', false);
            }, 500);
        });
        
        // 绑定事件
        const $enabled = $c.find('#dnd-cfg-enabled');
        const $group = $c.find('.dnd-cfg-group');
        
        $enabled.on('change', function() {
            const checked = $(this).prop('checked');
            $group.css({ opacity: checked ? 1 : 0.5, pointerEvents: checked ? 'auto' : 'none' });
        });
        
        // 下拉框与输入框联动
        $c.find('#dnd-cfg-combat-sel').on('change', function() {
            if(this.value) $c.find('#dnd-cfg-combat-input').val(this.value);
        });
        $c.find('#dnd-cfg-explore-sel').on('change', function() {
            if(this.value) $c.find('#dnd-cfg-explore-input').val(this.value);
        });
        
        // 保存
        $c.find('#dnd-cfg-save').on('click', async function(e) {
            if(e) e.preventDefault();
            // 1. 保存预设配置
            const newConfig = {
                ENABLED: $enabled.prop('checked'),
                COMBAT_PRESET: $c.find('#dnd-cfg-combat-input').val().trim(),
                EXPLORE_PRESET: $c.find('#dnd-cfg-explore-input').val().trim()
            };
            
            Object.assign(CONFIG.PRESET_SWITCHING, newConfig);
            safeSave(CONFIG.STORAGE_KEYS.PRESET_CONFIG, newConfig);
            
            // 2. 保存 API 配置
            const newApiConfig = {
                url: $c.find('#dnd-set-api-url').val().trim(),
                key: $c.find('#dnd-set-api-key').val().trim(),
                model: $c.find('#dnd-set-api-model').val().trim()
            };
            await SettingsManager.setAPIConfig(newApiConfig);

            // 视觉反馈
            const $btn = $(this);
            const originalText = $btn.html();
            $btn.html('✅ 已保存').prop('disabled', true);
            setTimeout(() => {
                $btn.html(originalText).prop('disabled', false);
            }, 1500);
            
            Logger.info('设置已更新:', newConfig, newApiConfig);
            
            // 立即触发一次状态检查以应用新设置
            PresetSwitcher._lastCombatState = null; // 重置状态以强制触发
            const global = DataManager.getTable('SYS_GlobalState');
            if (global && global[0]) {
                PresetSwitcher.checkCombatStateChange(global[0]['战斗模式'] === '战斗中');
            }
        });
    }
});

;// ./src/ui/modules/UIItems.js






/* harmony default export */ const UIItems = ({
    renderItemCard(item, isEquippedHighlight, delay = 0) {
        // 注意：因为 item 对象可能包含特殊字符，传递整个对象给 onclick 会有问题
        // 所以我们只传递 ID，然后在 showItemDetail 中重新查找
        // 或者将对象存储在 DOM data 属性中
        const isEquipped = item['已装备'] === '是' || item['已装备'] === true || String(item['已装备']).toLowerCase() === 'true';
        const bg = isEquippedHighlight ? 'background:rgba(197, 160, 89, 0.1);border-color:var(--dnd-border-gold);' : '';
        
        // 使用 data-item-id 存储 ID，避免 onclick 传递复杂对象
        const itemId = item['物品ID'] || item['物品名称'];
        const safeId = (itemId || '').replace(/'/g, "\\'");
        
        // [Feature 4] 更多属性
        const damage = item['伤害'] || item['damage'] || '';
        const properties = item['特性'] || item['properties'] || '';
        const rarity = item['稀有度'] || item['rarity'] || '普通';
        const owner = item['所属人'] || '';
        
        // 生成 HTML
        return `
            <div style="background:rgba(255,255,255,0.03);padding:10px;border:1px solid var(--dnd-border-inner);border-radius:4px;position:relative;cursor:pointer;animation-delay:${delay}s;${bg}"
                class="dnd-item-card dnd-anim-entry dnd-clickable"
                onclick="window.DND_Dashboard_UI.showItemDetail('${safeId}', event)">
                <div style="font-weight:bold;color:${isEquipped ? 'var(--dnd-text-highlight)' : 'var(--dnd-text-main)'};margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${item['物品名称']}
                    ${isEquipped ? '<i class="fa-solid fa-shield-halved" style="float:right;font-size:12px;color:var(--dnd-text-highlight)"></i>' : ''}
                </div>
                
                ${damage ? `<div class="dnd-item-damage">⚔️ ${damage}</div>` : ''}
                
                <div style="font-size:12px;color:#888;display:flex;justify-content:space-between;margin-top:4px;">
                    <span>x${item['数量']}</span>
                    <span>${item['价值'] || '-'}</span>
                </div>
                
                ${properties ? `<div class="dnd-item-props">${properties}</div>` : ''}
                
                <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px;">
                    <div class="dnd-item-rarity rarity-${rarity.toLowerCase()}">${rarity}</div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;">
                        ${owner ? `<div style="font-size:10px;color:var(--dnd-accent-blue);background:rgba(44, 76, 138, 0.2);padding:1px 4px;border-radius:2px;margin-bottom:2px;">👤 ${owner}</div>` : ''}
                        ${item['重量'] ? `<div style="font-size:11px;color:#666;">${item['重量']} lb</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    showItemDetail(itemId, event) {
        if (event) { event.stopPropagation(); }
        
        const items = DataManager.getTable('ITEM_Inventory');
        if (!items) return;
        
        const item = items.find(i => (i['物品ID'] === itemId) || (i['物品名称'] === itemId));
        if (!item) return;
        
        const isEquipped = item['已装备'] === '是' || item['已装备'] === true || String(item['已装备']).toLowerCase() === 'true';
        
        // [Feature 4] 详细属性
        const detailFields = [
            { key: '所属人', icon: '👤', label: '持有者' },
            { key: '伤害', icon: '⚔️', label: '伤害' },
            { key: '护甲等级', icon: '🛡️', label: 'AC' },
            { key: '特性', icon: '✨', label: '特性' },
            { key: '稀有度', icon: '💎', label: '稀有度' },
            { key: '重量', icon: '⚖️', label: '重量' },
            { key: '价值', icon: '💰', label: '价值' },
            { key: '需求', icon: '📋', label: '需求' },
            { key: '类别', icon: '🏷️', label: '类别' },
            { key: '数量', icon: '🔢', label: '数量' }
        ];

        let detailHtml = '';
        detailFields.forEach(field => {
            // 尝试中文key，如果不行尝试英文key (简单映射)
            let val = item[field.key];
            if (!val && field.key === '护甲等级') val = item['AC'];
            
            if (val) {
                detailHtml += `
                    <div class="dnd-item-detail-row">
                        <span class="dnd-item-detail-icon">${field.icon}</span>
                        <span class="dnd-item-detail-label">${field.label}:</span>
                        <span class="dnd-item-detail-value">${val}</span>
                    </div>
                `;
            }
        });

        const html = `
            <div style="color:var(--dnd-text-highlight);font-weight:bold;font-size:16px;border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <span>${item['物品名称']}</span>
                ${isEquipped ? '<span style="font-size:12px;background:var(--dnd-accent-green);color:#fff;padding:2px 6px;border-radius:4px;">已装备</span>' : ''}
            </div>
            
            <div style="margin-bottom:15px;background:rgba(255,255,255,0.05);padding:10px;border-radius:4px;font-size:12px;">
                ${detailHtml}
            </div>
            
            <div style="line-height:1.6;color:#ccc;font-size:13px;">
                ${item['描述'] || '暂无描述'}
            </div>
            <div style="margin-top:15px;font-size:10px;color:#666;text-align:right;">ID: ${item['物品ID'] || '-'}</div>
        `;
        
        const { window: coreWin } = getCore();
        this.showItemDetailPopup(html, event ? event.clientX : coreWin.innerWidth/2, event ? event.clientY : coreWin.innerHeight/2);
    },

    showItemDetailPopup(contentHtml, x, y) {
        console.log(`[DND Dashboard] showItemDetailPopup called at ${x},${y}`);
        const { $, window: coreWin } = getCore();
        let $popup = $('#dnd-detail-popup-el');
        let $backdrop = $('#dnd-popup-backdrop-el');
        
        // 创建遮罩层（如果不存在）
        if (!$backdrop.length) {
            $backdrop = $('<div id="dnd-popup-backdrop-el" class="dnd-popup-backdrop"></div>');
            $('body').append($backdrop);
            
            // 点击遮罩层关闭悬浮窗 - 最简单可靠的方式
            const self = this;
            $backdrop.on('click', () => {
                self.hideDetailPopup();
            });
        }
        
        if (!$popup.length) {
            $popup = $('<div id="dnd-detail-popup-el" class="dnd-detail-popup" style="max-height:80vh;overflow-y:auto;"></div>');
            $('body').append($popup);
        }

        // 添加关闭按钮到内容顶部
        const closeBtn = `<div style="position:absolute;top:8px;right:8px;cursor:pointer;color:#888;font-size:16px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all 0.2s;" onmouseover="this.style.color='var(--dnd-text-highlight)';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='#888';this.style.background='transparent'" onclick="window.DND_Dashboard_UI.hideDetailPopup()">✕</div>`;
        $popup.html(closeBtn + '<div style="padding-right:20px;">' + contentHtml + '</div>');
        
        // 使用 coreWin 获取正确的窗口尺寸（兼容 iframe）
        const winW = coreWin.innerWidth || $(coreWin).width() || window.innerWidth || 800;
        const winH = coreWin.innerHeight || $(coreWin).height() || window.innerHeight || 600;
        const isMobile = winW < 768;
        const padding = 10;
        
        if (isMobile) {
            // 移动端：水平方向由 CSS 控制 (left:10px, right:10px)
            // 只需计算垂直位置
            
            // 先显示以便测量高度
            $popup.css({
                display: 'block',
                visibility: 'hidden',
                opacity: 0,
                top: '-9999px',
                left: '', // 清除，让 CSS 生效
                right: ''
            }).addClass('visible');
            
            const popH = $popup.outerHeight() || 200;
            
            // 垂直方向：优先显示在点击位置下方
            let top = y + 15;
            
            // 如果下方放不下，显示在上方
            if (top + popH > winH - padding) {
                top = y - popH - 10;
            }
            
            // 边界约束
            if (top < padding) top = padding;
            if (top + popH > winH - padding) {
                top = Math.max(padding, winH - popH - padding);
            }
            
            // 应用位置 (水平方向不设置，让 CSS @media 规则生效)
            $popup.css({
                top: top + 'px',
                left: '', // 保持空让 CSS 生效
                right: '', // 保持空让 CSS 生效
                bottom: 'auto',
                visibility: 'visible',
                opacity: 1,
                display: 'block'
            });
        } else {
            // 桌面端：基于鼠标位置智能定位
            // 1. 先设置 display:block 但 opacity:0，以便测量
            $popup.css({
                display: 'block',
                visibility: 'hidden',
                opacity: 0,
                left: '-9999px',
                top: '-9999px'
            }).addClass('visible');
            
            const popW = $popup.outerWidth() || 280;
            const popH = $popup.outerHeight() || 200;
            
            console.log(`[DND Dashboard] Popup measuring: win=${winW}x${winH}, pop=${popW}x${popH}, mouse=${x},${y}`);

            // 2. 计算位置 - 优先显示在鼠标右下
            let left = x + 15;
            let top = y + 15;
            
            // 水平方向检查：如果右侧放不下，尝试放左侧
            if (left + popW > winW - padding) {
                left = x - popW - 15;
            }
            
            // 垂直方向检查：如果下方放不下，尝试放上方
            if (top + popH > winH - padding) {
                top = y - popH - 10;
            }
            
            // 3. 最终边界强制约束
            if (left < padding) left = padding;
            if (top < padding) top = padding;
            if (left + popW > winW - padding) {
                left = Math.max(padding, winW - popW - padding);
            }
            if (top + popH > winH - padding) {
                top = Math.max(padding, winH - popH - padding);
            }
            
            // 4. 应用位置并显示
            $popup.css({
                top: top + 'px',
                left: left + 'px',
                bottom: 'auto',
                right: 'auto',
                visibility: 'visible',
                opacity: 1,
                display: 'block'
            });
        }
        
        // 显示遮罩层
        $backdrop.addClass('visible');
    },

    hideDetailPopup() {
        const { $ } = getCore();
        // 隐藏悬浮窗
        $('#dnd-detail-popup-el').removeClass('visible').css('display', 'none');
        // 隐藏遮罩层
        $('#dnd-popup-backdrop-el').removeClass('visible');
    },

    showMiniItemActions(itemOrId, e) {
        // [修复] 支持传递 ID 字符串或对象
        let item = itemOrId;
        const items = DataManager.getTable('ITEM_Inventory');

        if (typeof itemOrId === 'string') {
            item = items ? items.find(i => (i['物品ID'] === itemOrId) || (i['物品名称'] === itemOrId)) : null;
        }
        if (!item) return;

        const itemId = item['物品ID'] || item['物品名称'];
        const isEquipped = item['已装备'] === '是' || item['已装备'] === true || String(item['已装备']).toLowerCase() === 'true';
        
        // 确保获取完整信息 (如果是从对象传递的可能不完整)
        const fullItem = items ? items.find(i => (i['物品ID'] === itemId) || (i['物品名称'] === itemId)) : item;
        
        const actions = [
            { label: isEquipped ? '卸下' : '装备', icon: '🛡️', action: 'equip' },
            { label: '使用/消耗', icon: '🧪', action: 'use' },
            { label: '丢弃', icon: '🗑️', action: 'drop' }
        ];
        
        let html = `<div style="display:flex;flex-direction:column;gap:5px;">`;
        html += `<div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:5px;">
            ${fullItem['物品名称']}
            ${isEquipped ? '<span style="font-size:10px;background:var(--dnd-accent-green);color:#fff;padding:1px 4px;border-radius:3px;margin-left:5px;">已装备</span>' : ''}
        </div>`;
        
        // 显示简要信息
        html += `<div style="font-size:11px;color:#888;margin-bottom:5px;padding:4px 6px;background:rgba(0,0,0,0.2);border-radius:3px;">
            <div>类别: ${fullItem['类别'] || '-'} | 数量: ${fullItem['数量'] || 1}</div>
            ${fullItem['价值'] ? `<div>价值: ${fullItem['价值']}</div>` : ''}
        </div>`;

        // Description with collapse/expand
        const desc = fullItem['描述'] || '暂无描述';
        html += `
            <div style="font-size:12px;color:#ccc;line-height:1.5;margin-bottom:8px;padding:5px;background:rgba(0,0,0,0.2);border-radius:4px;border-left:2px solid #555;cursor:pointer;max-height:60px;overflow:hidden;transition:max-height 0.3s ease-out;text-overflow:ellipsis;"
                onclick="this.style.maxHeight = this.style.maxHeight==='60px' ? '500px' : '60px'"
                title="点击展开/收起">
                ${desc}
            </div>
        `;
        
        actions.forEach(act => {
            html += `
                <div style="cursor:pointer;padding:6px 10px;border-radius:4px;display:flex;align-items:center;gap:8px;font-size:13px;" 
                    onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                    onmouseout="this.style.background='transparent'"
                    onclick="window.DND_Dashboard_UI.handleItemAction('${itemId}', '${act.action}', ${fullItem['数量'] || 1})">
                    <span>${act.icon}</span> <span>${act.label}</span>
                </div>
            `;
        });
        html += `</div>`;
        
        // 计算合适的位置，避免弹出屏幕
        const x = e.clientX;
        const y = e.clientY;
        
        this.showItemDetailPopup(html, x, y);
    },

    async handleItemAction(itemId, action, currentQty) {
        this.hideDetailPopup();
        
        if (typeof ItemManager === 'undefined') {
            console.error('ItemManager not loaded');
            return;
        }

        if (action === 'equip') {
            // 获取最新状态
            const items = DataManager.getTable('ITEM_Inventory');
            const item = items.find(i => (i['物品ID'] === itemId) || (i['物品名称'] === itemId));
            if (item) {
                const isEquipped = item['已装备'] === '是' || item['已装备'] === true || String(item['已装备']).toLowerCase() === 'true';
                // 装备/卸下操作暂不记录 Log，或可根据需求添加
                ItemManager.update(itemId, { '已装备': isEquipped ? '否' : '是' });
            }
        }
        else if (action === 'use' || action === 'drop') {
            const actionName = action === 'use' ? '使用' : '丢弃';
            const confirmed = await NotificationSystem.confirm(`确定要${actionName} 1 个 ${itemId} 吗？`, {
                title: `${actionName}物品`,
                confirmText: actionName,
                type: action === 'drop' ? 'danger' : 'info'
            });
            if (confirmed) {
                // [更新] 生成通知文本并传递给 Update
                const note = `[系统] 玩家${actionName}了 1x ${itemId}`;
                ItemManager.update(itemId, { '数量': parseInt(currentQty) - 1 }, note);
            }
        }
    },

    // [修复] 显示背包面板 - 统一使用 showItemDetailPopup (与装备实现保持一致)
    showInventoryPanel(event) {
        Logger.info('showInventoryPanel 被调用', event);
        const items = DataManager.getTable('ITEM_Inventory');
        
        if (!items || items.length === 0) {
            this.showItemDetailPopup('<div style="text-align:center;color:#888;">🎒 背包空空如也</div>', event.clientX, event.clientY);
            return;
        }
        
        // 过滤未装备物品
        const backpackItems = items.filter(i => {
            const isEq = i['已装备'] === '是' || i['已装备'] === true || String(i['已装备']).toLowerCase() === 'true';
            return !isEq;
        });

        // 获取所有类别
        const categories = [...new Set(backpackItems.map(i => i['类别'] || '杂物'))].sort();
        
        let html = `<div style="font-weight:bold;color:var(--dnd-text-main);border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
            <span>🎒 背包物品</span>
            <span style="font-size:11px;color:#888;">${backpackItems.length} 件</span>
        </div>`;

        // 搜索和筛选
        html += `
            <div style="display:flex;gap:5px;margin-bottom:10px;">
                <input type="text" id="dnd-inv-search" placeholder="搜索物品..." style="flex:1;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:4px 8px;border-radius:4px;font-size:12px;" oninput="window.DND_Dashboard_UI.filterInventory()">
                <select id="dnd-inv-filter" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:4px;border-radius:4px;font-size:12px;" onchange="window.DND_Dashboard_UI.filterInventory()">
                    <option value="">全部分类</option>
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
        `;

        html += `<div style="max-height:350px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;" id="dnd-inv-list">`;
        
        if (backpackItems.length === 0) {
            html += `<div style="color:#666;text-align:center;padding:10px;">背包中没有未装备的物品</div>`;
        } else {
            backpackItems.forEach(item => {
                const itemId = item['物品ID'] || item['物品名称'];
                const safeId = (itemId || '').replace(/'/g, "\\'");
                const category = item['类别'] || '杂物';
                html += `
                    <div class="dnd-inv-list-item" data-name="${item['物品名称']}" data-category="${category}" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(255,255,255,0.03);border:1px solid var(--dnd-border-inner);border-radius:4px;cursor:pointer;font-size:12px;"
                        onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.03)'"
                        onclick="window.DND_Dashboard_UI.showMiniItemActions('${safeId}', event)">
                        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;display:flex;flex-direction:column;">
                            <span>${item['物品名称']}</span>
                            <span style="font-size:10px;color:#666;">${category} ${item['所属人'] ? ` · 👤${item['所属人']}` : ''}</span>
                        </div>
                        <span style="color:#888;flex-shrink:0;">x${item['数量']}</span>
                    </div>
                `;
            });
        }
        html += `</div>`;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [新增] 过滤物品列表
    filterInventory() {
        const { $ } = getCore();
        const searchText = $('#dnd-inv-search').val().toLowerCase();
        const filterCat = $('#dnd-inv-filter').val();
        
        $('.dnd-inv-list-item').each(function() {
            const $el = $(this);
            const name = ($el.data('name') || '').toLowerCase();
            const category = ($el.data('category') || '');
            
            const matchSearch = !searchText || name.includes(searchText);
            const matchFilter = !filterCat || category === filterCat;
            
            if (matchSearch && matchFilter) {
                $el.show();
            } else {
                $el.hide();
            }
        });
    },

    // [新增] 显示装备面板
    showEquipmentPanel(event) {
        const items = DataManager.getTable('ITEM_Inventory');
        if (!items) {
            this.showItemDetailPopup('<div style="text-align:center;color:#888;">⚔️ 无装备数据</div>', event.clientX, event.clientY);
            return;
        }
        
        // 过滤已装备物品
        const equippedItems = items.filter(i => {
            const isEq = i['已装备'] === '是' || i['已装备'] === true || String(i['已装备']).toLowerCase() === 'true';
            return isEq;
        });
        
        let html = `<div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
            <span>⚔️ 已装备</span>
            <span style="font-size:11px;color:#888;">${equippedItems.length} 件</span>
        </div>`;
        html += `<div style="max-height:350px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">`;
        
        if (equippedItems.length === 0) {
            html += `<div style="color:#666;text-align:center;padding:10px;">尚未装备任何物品</div>`;
        } else {
            equippedItems.forEach(item => {
                const itemId = item['物品ID'] || item['物品名称'];
                const safeId = (itemId || '').replace(/'/g, "\\'");
                html += `
                    <div class="dnd-inv-list-item" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(197, 160, 89, 0.1);border:1px solid var(--dnd-border-gold);border-radius:4px;cursor:pointer;font-size:12px;"
                        onmouseover="this.style.background='rgba(197, 160, 89, 0.2)'"
                        onmouseout="this.style.background='rgba(197, 160, 89, 0.1)'"
                        onclick="window.DND_Dashboard_UI.showMiniItemActions('${safeId}', event)">
                        <div style="display:flex;flex-direction:column;overflow:hidden;max-width:180px;">
                            <span style="color:var(--dnd-text-highlight);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🛡️ ${item['物品名称']}</span>
                            ${item['所属人'] ? `<span style="font-size:10px;color:var(--dnd-accent-blue);">👤 ${item['所属人']}</span>` : ''}
                        </div>
                        <span style="color:#888;flex-shrink:0;">${item['类别'] || '-'}</span>
                    </div>
                `;
            });
        }
        html += `</div>`;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [新增] 显示势力声望面板
    showFactionPanel(event) {
        const factions = DataManager.getTable('FACTION_Standing');
        if (!factions || factions.length === 0) return;
        
        let html = `
            <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <span>🏛️ 势力与声望</span>
                <span style="font-size:11px;color:#888;">${factions.length} 个势力</span>
            </div>
            <div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
        `;
        
        factions.forEach(f => {
            const relation = parseInt(f['关系等级']) || 0;
            let icon = '⚖️';
            let color = '#ccc';
            let statusText = '中立';
            let percent = 50; // 中立默认 50%
            
            if (relation > 0) {
                icon = '🤝';
                color = 'var(--dnd-accent-green)';
                statusText = '友好';
                percent = Math.min(100, 50 + (relation * 5));
            } else if (relation < 0) {
                icon = '⚔️';
                color = 'var(--dnd-accent-red)';
                statusText = '敌对';
                percent = Math.max(0, 50 + (relation * 5));
            }
            
            const repVal = f['声望值'] || 0;
            
            html += `
                <div class="dnd-faction-item">
                    <div class="dnd-faction-header">
                        <span style="color:${color}">${icon} ${f['势力名称']}</span>
                        <span style="font-size:11px;background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:3px;">${statusText} (${relation})</span>
                    </div>
                    <div style="font-size:11px;color:#aaa;margin-top:2px;">
                        ${f['势力描述'] || '无描述'}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;font-size:10px;color:#888;margin-top:4px;">
                        <span>声望: ${repVal}</span>
                        <div class="dnd-faction-rep-bar" style="flex:1;">
                            <div class="dnd-faction-rep-fill" style="width:${percent}%;background:${color};"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [修复] 显示任务详情 - 统一使用 showItemDetailPopup (与装备实现保持一致)
    showQuestTooltip(quest, x, y) {
        Logger.info('showQuestTooltip 被调用', quest['任务名称']);
        
        const statusColor = quest['状态'] === '已完成' ? '#3a6b4a' : (quest['状态'] === '已失败' ? '#8a2c2c' : '#c5a059');
        
        const html = `
            <div style="border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;margin-bottom:10px;font-weight:bold;color:var(--dnd-text-highlight);font-size:16px;display:flex;justify-content:space-between;align-items:center;">
                <span>📜 ${quest['任务名称']}</span>
                <span style="font-size:11px;background:${statusColor};color:#fff;padding:2px 6px;border-radius:4px;">${quest['状态'] || '进行中'}</span>
            </div>
            
            <div style="font-size:13px;line-height:1.5;margin-bottom:15px;color:#ccc;">
                ${quest['目标描述'] || '暂无描述'}
            </div>
            
            ${quest['当前进度'] ? `
            <div style="margin-bottom:10px;padding:6px 8px;background:rgba(197, 160, 89, 0.1);border-left:2px solid var(--dnd-border-gold);border-radius:2px;">
                <div style="font-size:11px;color:#888;margin-bottom:2px;">当前进度</div>
                <div style="font-size:12px;color:var(--dnd-text-main);">${quest['当前进度']}</div>
            </div>` : ''}
            
            <div style="font-size:12px;color:#aaa;background:rgba(255,255,255,0.05);padding:8px;border-radius:4px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
                    <div><strong>发布者:</strong> ${quest['发布者']||'-'}</div>
                    <div><strong>类型:</strong> ${quest['类型']||'-'}</div>
                    <div><strong>时限:</strong> ${quest['时限']||'无限制'}</div>
                    <div><strong>难度:</strong> ${quest['难度']||'-'}</div>
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #444;color:var(--dnd-text-highlight);">
                    <strong>🏆 奖励:</strong> ${quest['奖励']||'-'}
                </div>
            </div>
        `;
        
        this.showItemDetailPopup(html, x, y);
    }
});

;// ./src/ui/modules/UICombat.js






/* harmony default export */ const UICombat = ({
    _resourceTracker: {
        // Keyed by charId: { spellSlots: {}, classResources: {} }
        snapshots: {}
    },

    // [新增] 动作经济追踪
    _turnResources: {
        action: 1,
        bonus: 1,
        reaction: 1,
        movement: 30 // 默认 30尺
    },

    // [新增] 瞄准模式状态
    _targetingMode: {
        active: false,
        type: null, // 'move' or 'skill'
        source: null, // character object
        range: 0, // in grid units
        skillName: null,
        callback: null
    },

    // [新增] 行动队列状态
    _actionQueue: [],
    _virtualPos: null, // {x, y} 记录移动后的虚拟位置

    // [新增] 手动调整动作资源
    adjustTurnResource(type) {
        // type: 'action', 'bonus', 'reaction', 'movement'
        if (type === 'movement') {
            // 移动力增加 30尺
            this._turnResources.movement += 30;
        } else {
            // 其他资源 +1
            if (this._turnResources[type] !== undefined) {
                this._turnResources[type]++;
            }
        }
        this.renderHUD();
        PresetSwitcher.showNotification(true, `已添加资源: ${type}`);
    },

    resetActionEconomy() {
        const char = this.getControlledCharacter();
        // 尝试从属性读取速度
        let speed = 30;
        if (char && char['速度']) {
            const parsed = parseInt(char['速度']);
            if (!isNaN(parsed)) speed = parsed;
        }

        // 尝试从职业资源中读取自定义覆盖 (如 "每轮动作: 2")
        const res = DataManager.parseValue(char['职业资源'], 'resources') || {};
        const findMax = (keywords, defaultVal) => {
            const key = Object.keys(res).find(k => keywords.some(w => k.toLowerCase().includes(w.toLowerCase())));
            if (key) {
                const parts = res[key].toString().split('/');
                return parseInt(parts[1]) || parseInt(parts[0]) || defaultVal;
            }
            return defaultVal;
        };

        this._turnResources = {
            action: findMax(['每轮动作', 'Actions Per Turn'], 1),
            bonus: findMax(['每轮附赠', 'Bonus Per Turn'], 1),
            reaction: findMax(['每轮反应', 'Reactions Per Turn'], 1),
            movement: speed
        };
        this.renderHUD();
    },

    initResourceTracker() {
        const char = this.getControlledCharacter();
        if (!char) return;
        
        const charId = char['CHAR_ID'] || char['PC_ID'] || char['姓名'];
        
        this._resourceTracker.snapshots[charId] = {
            spellSlots: JSON.parse(JSON.stringify(DataManager.parseValue(char['法术位'], 'resources') || {})),
            classResources: JSON.parse(JSON.stringify(DataManager.parseValue(char['职业资源'], 'resources') || {}))
        };
        Logger.info('Resource tracker initialized for', char['姓名']);
    },

    calculateResourceConsumption() {
        const char = this.getControlledCharacter();
        if (!char) return null;
        
        const charId = char['CHAR_ID'] || char['PC_ID'] || char['姓名'];
        const snapshot = this._resourceTracker.snapshots[charId];
        
        if (!snapshot) return null;
        
        const currentSlots = DataManager.parseValue(char['法术位'], 'resources') || {};
        const currentRes = DataManager.parseValue(char['职业资源'], 'resources') || {};
        
        const consumption = {
            spellSlots: {},
            classResources: {}
        };
        
        // 计算法术位消耗
        if (snapshot.spellSlots) {
            for (const [level, val] of Object.entries(snapshot.spellSlots)) {
                const startParts = val.toString().split('/');
                const startCurr = parseInt(startParts[0]) || 0;
                
                const currVal = currentSlots[level] || "0/0";
                const currParts = currVal.toString().split('/');
                const currCurr = parseInt(currParts[0]) || 0;
                
                if (startCurr > currCurr) {
                    consumption.spellSlots[level] = startCurr - currCurr;
                }
            }
        }
        
        // 计算职业资源消耗
        if (snapshot.classResources) {
            for (const [name, val] of Object.entries(snapshot.classResources)) {
                let startVal = parseInt(val);
                if (val.toString().includes('/')) {
                    startVal = parseInt(val.toString().split('/')[0]) || 0;
                }
                
                let currRaw = currentRes[name] || 0;
                let currVal = parseInt(currRaw);
                if (currRaw.toString().includes('/')) {
                    currVal = parseInt(currRaw.toString().split('/')[0]) || 0;
                }
                
                if (!isNaN(startVal) && !isNaN(currVal) && startVal > currVal) {
                    consumption.classResources[name] = startVal - currVal;
                }
            }
        }
        
        return consumption;
    },

    renderResourceConsumption($container) {
        const consumption = this.calculateResourceConsumption();
        if (!consumption) {
            $container.html('');
            return;
        }
        
        const hasSlots = Object.keys(consumption.spellSlots).length > 0;
        const hasRes = Object.keys(consumption.classResources).length > 0;
        
        if (!hasSlots && !hasRes) {
            $container.html('');
            return;
        }
        
        let html = `<div class="dnd-resource-consumption" style="margin-top:10px;padding:8px;background:rgba(0,0,0,0.3);border-radius:4px;border:1px dashed rgba(255,255,255,0.1);">
            <div style="font-size:11px;color:#aaa;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;">
                <span>⚡ 本场战斗消耗</span>
                <span class="dnd-clickable" style="cursor:pointer;color:var(--dnd-text-dim);font-size:14px;line-height:1;" title="重置统计" onclick="window.DND_Dashboard_UI.initResourceTracker(); window.DND_Dashboard_UI.renderHUD();">🔄</span>
            </div>`;
        
        if (hasSlots) {
            html += `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px;">`;
            for (const [level, used] of Object.entries(consumption.spellSlots)) {
                html += `<span style="font-size:10px;color:#e74c3c;background:rgba(231, 76, 60, 0.1);padding:1px 4px;border-radius:2px;">${level}: -${used}</span>`;
            }
            html += `</div>`;
        }
        
        if (hasRes) {
            html += `<div style="display:flex;flex-wrap:wrap;gap:5px;">`;
            for (const [name, used] of Object.entries(consumption.classResources)) {
                html += `<span style="font-size:10px;color:#e67e22;background:rgba(230, 126, 34, 0.1);padding:1px 4px;border-radius:2px;">${name}: -${used}</span>`;
            }
            html += `</div>`;
        }
        
        html += `</div>`;
        $container.html(html);
    },

    // [新增] 解析距离文本为格子数 (默认 1格=5尺)
    parseDistance(text) {
        if (!text) return 1; // 默认接触
        const str = String(text).toLowerCase();
        
        // 接触/自身
        if (str.includes('接触') || str.includes('touch') || str.includes('self') || str.includes('自身')) return 1;
        
        // 提取数字
        const match = str.match(/(\d+)/);
        if (match) {
            const val = parseInt(match[1]);
            // 假设单位是尺/ft，转换为格子 (5ft = 1格)
            return Math.max(1, Math.ceil(val / 5));
        }
        return 6; // 默认 30尺
    },

    // [新增] 智能施法处理 (根据战斗状态决定逻辑)
    handleCastClick(name, range, level, type, costType) {
        const global = DataManager.getTable('SYS_GlobalState');
        const isCombat = global && global[0] && global[0]['战斗模式'] === '战斗中';
        
        this.hideDetailPopup();
        
        if (isCombat) {
            // 战斗状态：进入瞄准模式
            this.startTargeting({
                type: type || 'skill',
                rangeText: range,
                skillName: name,
                costType: costType || 'Action', // 默认标准动作
                callback: (res) => this.executeAction(type || 'skill', res, costType || 'Action')
            });
        } else {
            // 非战斗状态：直接输出文本
            let text = '';
            if (type === 'spell') {
                if (level === '0' || level === '戏法' || !level) {
                    text = `我施放了戏法：${name}`;
                } else {
                    text = `我使用 ${level} 环法术位施放了 ${name}`;
                }
            } else {
                text = `我使用了技能：${name}`;
            }
            this.fillChatInput(text);
        }
    },

    // [新增] 准备施法 (选择环阶)
    prepareCast(spellName, rangeText, baseLevelStr) {
        // 解析环阶
        let baseLevel = 0;
        if (baseLevelStr && baseLevelStr !== '戏法' && baseLevelStr !== '0') {
            baseLevel = parseInt(baseLevelStr) || 1;
        }
        
        // 如果是戏法，直接调用处理
        if (baseLevel === 0) {
            this.handleCastClick(spellName, rangeText, '0', 'spell');
            return;
        }
        
        // 获取当前角色及其法术位
        const pc = this.getControlledCharacter();
        const maxSlot = DataManager.getMaxSpellSlotLevel(pc) || 9;
        const slots = DataManager.parseValue(pc['法术位'], 'resources') || {};
        
        // 如果基础环阶高于最大环阶（例如卷轴施法），则以上限为准，或者至少允许施放基础
        const limit = Math.max(baseLevel, maxSlot);

        // 否则显示环阶选择
        const { $ } = getCore();
        const $popup = $('#dnd-detail-popup-el');
        if ($popup.length) {
            let html = `<div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:10px;text-align:center;">✨ 选择施法环阶 (${spellName})</div>`;
            html += `<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;">`;
            
            for (let i = baseLevel; i <= limit; i++) {
                // 检查是否有可用法术位
                const slotKey = Object.keys(slots).find(k => parseInt(k) === i);
                let available = 0;
                if (slotKey) {
                    const parts = slots[slotKey].toString().split('/');
                    available = parseInt(parts[0]) || 0;
                }
                const isDisabled = available <= 0;
                
                // 使用转义字符处理 spellName 中的潜在特殊字符
                const safeName = spellName.replace(/'/g, "\\'");
                
                // 样式处理
                const style = isDisabled
                    ? "background:rgba(0,0,0,0.3);border:1px solid #333;color:#666;padding:8px;border-radius:4px;cursor:not-allowed;"
                    : "background:rgba(255,255,255,0.05);border:1px solid #555;color:#ccc;padding:8px;border-radius:4px;cursor:pointer;font-weight:bold;";
                
                const action = isDisabled
                    ? ""
                    : `onclick="window.DND_Dashboard_UI.handleCastClick('${safeName}', '${rangeText}', '${i}', 'spell')"`;
                    
                const mouseOver = isDisabled
                    ? ""
                    : `onmouseover="this.style.borderColor='var(--dnd-border-gold)';this.style.color='#fff';this.style.background='rgba(255,255,255,0.1)'"`;
                    
                const mouseOut = isDisabled
                    ? ""
                    : `onmouseout="this.style.borderColor='#555';this.style.color='#ccc';this.style.background='rgba(255,255,255,0.05)'"`;

                html += `
                    <button class="dnd-clickable" style="${style}" ${mouseOver} ${mouseOut} ${action}>
                        ${i} 环 ${isDisabled ? '(0)' : `(${available})`}
                    </button>
                `;
            }
            html += `</div>`;
            
            // 替换当前弹窗内容
            const $content = $popup.find('> div:not(:first-child)');
            if ($content.length) {
                $content.html(html);
            } else {
                // Fallback
                $popup.append('<div style="padding-right:20px;">' + html + '</div>');
            }
        }
    },

    // [新增] 开启瞄准模式
    startTargeting(config) {
        Logger.debug('[Targeting] Start config:', config);
        const { type, source, rangeText, skillName, costType } = config;
        const range = this.parseDistance(rangeText);
        
        // 检查资源是否足够 (提前检查)
        if (type !== 'move' && costType) {
            const key = costType.toLowerCase();
            if (this._turnResources[key] <= 0) {
                NotificationSystem.warning(`❌ 无法执行：${costType} 资源已耗尽！`);
                return;
            }
        }
        
        this._targetingMode = {
            active: true,
            type: type || 'skill',
            source: source || null, // 需要包含坐标信息
            range: range,
            skillName: skillName || '行动',
            costType: costType,
            callback: config.callback
        };
        
        // 刷新地图以显示范围
        this.renderHUD();
        
        // 显示提示
        const { window: coreWin } = getCore();
        const msg = type === 'move' ? '请选择移动目标点' : `请选择 ${skillName} 的目标`;
        this.showItemDetailPopup(`<div style="text-align:center;color:var(--dnd-accent-green);font-weight:bold;">🎯 ${msg}</div>`, coreWin.innerWidth/2, 100);
    },

    // [新增] 结束瞄准模式
    endTargeting() {
        this._targetingMode = { active: false, type: null, source: null, range: 0 };
        // 清除虚拟位置，以确保下次瞄准从真实位置开始 (或者在 executeAction 中更新)
        
        this.renderHUD();
        this.hideDetailPopup();
    },

    // [新增] 执行最终动作 (加入队列)
    executeAction(type, data, costType) {
        const { x, y, target, distance } = data;
        const activeChar = this.getControlledCharacter();
        const charName = activeChar ? activeChar['姓名'] : '我';
        
        const coord = `${String.fromCharCode(64 + x)}${y}`;
        let desc = '';
        
        // 特殊技能自动化逻辑
        const skillName = (this._targetingMode.skillName || '').toLowerCase();
        let extraDesc = '';
        
        // 疾走 (Dash): 消耗动作(由costType处理)，增加移动力
        if (skillName.includes('dash') || skillName.includes('疾走') || skillName.includes('冲刺')) {
            const speed = parseInt(activeChar['速度']) || 30;
            this._turnResources.movement += speed;
            extraDesc = ` (疾走: +${speed}尺移动)`;
        }
        
        // 动作如潮 (Action Surge): 增加动作
        if (skillName.includes('action surge') || skillName.includes('动作如潮')) {
            this._turnResources.action++;
            extraDesc = ` (动作如潮: +1 动作)`;
        }

        // 扣除资源
        if (type === 'move') {
            // 移动消耗 (每格5尺)
            const cost = (distance || 0) * 5;
            if (this._turnResources.movement < cost) {
                NotificationSystem.warning(`移动距离不足！剩余: ${this._turnResources.movement}尺, 需要: ${cost}尺`);
                return; // 阻止执行
            }
            this._turnResources.movement -= cost;
            desc = `移动到了 ${coord} (消耗 ${cost}尺)`;
            // 更新虚拟位置
            this._virtualPos = { x, y };
        } else {
            // 动作/附赠/反应消耗
            let key = (costType || 'Action').toLowerCase();
            
            // 动作如潮本身不消耗动作 (Free)
            if (skillName.includes('action surge') || skillName.includes('动作如潮')) {
                key = 'free';
            }

            if (this._turnResources[key] !== undefined) {
                if (this._turnResources[key] <= 0) {
                    NotificationSystem.warning(`没有足够的 ${costType}！`);
                    return; // 阻止执行
                }
                this._turnResources[key]--;
            }
            
            const skill = this._targetingMode.skillName;
            if (target) {
                desc = `对 ${target} 施放了 【${skill}】${extraDesc}`;
            } else {
                desc = `在 ${coord} 施放了 【${skill}】${extraDesc}`;
            }
        }
        
        // 加入队列
        this._actionQueue.push({ type, data, desc, charName });
        
        // 刷新界面
        this.renderHUD();
    },

    // [新增] 提交行动队列
    commitActions() {
        if (this._actionQueue.length === 0) return;
        
        // 获取行动的主体名称
        const first = this._actionQueue[0];
        const charName = first.charName || '我';
        
        // 合并文本
        const steps = this._actionQueue.map(a => a.desc);
        let actionStr = '';
        
        if (steps.length === 1) {
            actionStr = steps[0];
        } else {
            actionStr = steps.join('，然后 ');
        }
        
        // 使用用户指定的特定前缀格式 (轮到[角色名]的回合时)
        const finalStr = `轮到${charName}的回合时，${actionStr}。`;
        
        this.fillChatInput(finalStr);
        this.clearActions();
    },

    // [新增] 清空行动队列
    clearActions() {
        this._actionQueue = [];
        this._virtualPos = null;
        this.resetActionEconomy(); // 重置动作经济
    },

    // 显示战斗单位详情
    showCombatUnitDetail(unit, event) {
        const { $ } = getCore();
        
        // 解析 HP
        const hpStr = unit['HP状态'] || '??/??';
        
        // 样式根据阵营
        const isEnemy = unit['阵营'] === '敌方';
        const color = isEnemy ? 'var(--dnd-accent-red)' : 'var(--dnd-text-highlight)';
        
        const html = `
            <div style="border-bottom:1px solid ${color};padding-bottom:5px;margin-bottom:10px;font-weight:bold;color:${color};font-size:16px;display:flex;justify-content:space-between;">
                <span>${unit['单位名称']}</span>
                <span style="font-size:12px;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;color:#fff;">${unit['阵营']}</span>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;font-size:13px;">
                <div style="background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;">
                    <div style="color:#888;font-size:11px;">HP 状态</div>
                    <div style="font-weight:bold;color:#fff;">${hpStr}</div>
                </div>
                <div style="background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;">
                    <div style="color:#888;font-size:11px;">先攻 / 位置</div>
                    <div style="font-weight:bold;color:#fff;">${unit['先攻/位置'] || '-'}</div>
                </div>
            </div>

            <div style="margin-bottom:10px;">
                <div style="color:#aaa;font-size:12px;margin-bottom:3px;">防御 / 抗性</div>
                <div style="color:#fff;font-size:13px;background:rgba(255,255,255,0.05);padding:5px;border-radius:3px;">${unit['防御/抗性'] || '无'}</div>
            </div>
            
            <div style="margin-bottom:10px;">
                <div style="color:#aaa;font-size:12px;margin-bottom:3px;">附着状态</div>
                <div style="color:#e6dcca;font-size:13px;background:rgba(255,255,255,0.05);padding:5px;border-radius:3px;">${unit['附着状态'] || '无'}</div>
            </div>

            <div>
                <div style="color:#aaa;font-size:12px;margin-bottom:3px;">回合资源</div>
                <div style="color:#ccc;font-size:12px;line-height:1.4;">${unit['回合资源'] || '-'}</div>
            </div>
        `;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [新增] 显示战斗技能列表 (当前操控角色技能)
    showCombatSkillList(event) {
        console.log('[DND Dashboard] showCombatSkillList called');
        
        // 获取当前操控的角色
        const current = this.getControlledCharacter();
        
        if (!current) {
            NotificationSystem.warning('未找到当前操控角色数据。');
            return;
        }
        
        const charId = current['PC_ID'] || current['CHAR_ID'] || current['姓名'];
        // 尝试获取技能 (同时尝试使用 ID 和 姓名 查找，以防匹配失败)
        let skills = DataManager.getCharacterSkills(charId);
        if ((!skills || skills.length === 0) && current['姓名'] && current['姓名'] !== charId) {
            skills = DataManager.getCharacterSkills(current['姓名']);
        }
        
        if (!skills || skills.length === 0) {
            // 尝试显示提示而不是直接退出
            const html = `<div style="padding:15px;text-align:center;">
                <div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:10px;">✨ ${current['姓名']}</div>
                <div style="color:#888;">该角色暂无已学习的技能或法术。</div>
            </div>`;
            this.showItemDetailPopup(html, event.clientX, event.clientY);
            return;
        }

        // 简单分类：动作、附赠动作、反应
        const grouped = {
            '动作': [],
            '附赠动作': [],
            '反应': [],
            '其他': []
        };
        
        // 处理所有能力 (技能 + 法术)
        const processAbility = (s) => {
            const isSpell = s['技能类型'] === '法术';
            const name = s['技能名称'];
            const time = (s['施法时间'] || '').toLowerCase();
            
            // 解析动作花费类型
            let costType = 'Action';
            if (time.includes('bonus') || time.includes('附赠')) costType = 'Bonus';
            else if (time.includes('reaction') || time.includes('反应')) costType = 'Reaction';
            else if (time.includes('free') || time.includes('自由')) costType = 'Free';
            
            const item = { ...s, _isSpell: isSpell, _displayName: name, _costType: costType };
            
            if (costType === 'Bonus') grouped['附赠动作'].push(item);
            else if (costType === 'Reaction') grouped['反应'].push(item);
            else grouped['动作'].push(item);
        };

        if (skills) skills.forEach(s => processAbility(s));
        
        let html = `<div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:10px;">✨ ${current['姓名']} 的技能</div>`;
        html += `<div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">`;
        
        let hasSkills = false;
        Object.keys(grouped).forEach(type => {
            if (grouped[type].length === 0) return;
            hasSkills = true;
            
            html += `<div style="font-size:12px;color:#888;border-bottom:1px dashed #444;margin-top:5px;">${type}</div>`;
            grouped[type].forEach(s => {
                const rawName = s._displayName || '未命名';
                const safeName = rawName.replace(/'/g, "\\'").replace(/"/g, '"');
                const safeRange = (s['射程'] || '接触').replace(/'/g, "\\'");
                const isSpell = s._isSpell;
                const icon = isSpell ? '📜' : '⚔️';
                const costType = s._costType;
                
                const actionType = isSpell ? 'spell' : 'skill';
                const lvlVal = s['环阶'];
                const isCantrip = lvlVal === '0' || lvlVal === 0 || lvlVal === '戏法' || !lvlVal;
                
                let onClick = '';
                if (isSpell && !isCantrip) {
                    onClick = `window.DND_Dashboard_UI.prepareCast('${safeName}', '${safeRange}', '${lvlVal}', '${costType}')`;
                } else {
                    onClick = `window.DND_Dashboard_UI.handleCastClick('${safeName}', '${safeRange}', '${lvlVal||''}', '${actionType}', '${costType}')`;
                }
                
                html += `
                    <div class="dnd-clickable" style="padding:6px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
                        onclick="${onClick}">
                        <span style="color:var(--dnd-text-main);">${icon} ${rawName}</span>
                        <span style="font-size:10px;color:#aaa;">${s['射程']||'-'}</span>
                    </div>
                `;
            });
        });
        
        if (!hasSkills) {
            html += `<div style="color:#888;text-align:center;padding:10px;">无技能显示</div>`;
        }

        html += `</div>`;
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    }
});

;// ./src/features/ExplorationMapManager.js
// src/features/ExplorationMapManager.js







const ExplorationMapManager = {
    // Prompts
    prompts: {
        structure: (theme) => `你是一个资深DND地牢架构师。请根据主题设计一个紧凑、真实的地牢平面图结构。

主题：${theme}

关键设计原则：
1. **紧凑连接**：房间之间不应该用长长的线连接，而应该物理上紧挨着。
2. **走廊即房间**：走廊(corridor)本身就是一个长条形的房间，角色可以站在里面。不要用抽象的线代表路径。
3. **无缝拼接**：房间和走廊的坐标(x,y,width,height)应该设计得让它们边缘贴合，形成一个连通的整体区域。
4. **门与通道**：房间之间的连接通过共享墙壁上的“门”或“开口”实现。
5. **不规则布局**：整个地图中地点的布局不用规则分布，即使是人造建筑，也可以有不对称和不规则的形状。

请生成JSON格式数据：
1. mapName: 地图名称
2. mapSize: { width: 800, height: 600 }
3. rooms: 房间列表，包含：
   - id: ID
   - name: 名称
   - type: 类型 (entrance/corridor/room/hall/secret_room)
   - shape: 形状 (rectangular / circular / irregular / cave_blob) - 注意：自然洞穴必须用 irregular 或 cave_blob，不要全是矩形
   - x, y, width, height: 所在区域的边界框 (Bounding Box)，对于不规则形状，这是它的最大范围
   - description: 描述
   - color: 建议的颜色代码 (hex)
4. doors: 门/通道列表（替代原来的paths），包含：
   - x, y: 门的位置
   - type: 类型 (open/door/secret_door/barred)
   - orientation: 方向 (horizontal/vertical)
   - connects: [room_id_1, room_id_2]
5. features: 室内物体列表 (column/statue/chest/trap/fountain/table...)
   - x, y: 位置
   - type: 类型

请生成一个至少包含8-12个区域（房间+走廊）的复杂结构，确保有一个入口和一个Boss区域。走廊应该连接多个房间。

只返回JSON，不要其他解释。`,

        svg: (structureJSON) => `你是一个顶级DND地图绘制大师。请根据以下结构数据，绘制一张极具艺术感的、**手绘风格**的地图。

${structureJSON}

核心绘制要求：

0.  **形态革命（关键需求）**：
    *   **拒绝矩形**：DND地图（尤其是洞穴）绝不是一个个方块拼起来的！
    *   **有机形状**：
        - 对于 \`shape="cave_blob"\` 或 \`irregular\` 的房间，必须使用 \`<path>\` 绘制不规则的、有机的曲线轮廓，模拟自然岩壁。
        - 即使是 \`rectangular\` 房间，也要画得稍微歪斜一点，不要用完美的 \`rect\`。
    *   **参考边界**：JSON中的 \`width/height\` 只是大致范围，请大胆地在这个范围内绘制多边形或不规则形状。

1.  **解决“简笔画”感（纹理与厚度）**：
    *   **墙壁**：不要只画单薄的线！请使用 **粗笔触 (stroke-width="4"~"6")** 来表示墙壁，或者使用双线描绘。墙壁颜色应深邃（如深炭色 #2c3e50）。
    *   **地面纹理**：拒绝纯色填充！请在 <defs> 中定义纹理图案 (<pattern>)，例如：
        - "floor-stone": 简单的石砖纹理。
        - "floor-hatch": 手绘排线阴影。
        - "grid-pattern": 50x50 的淡色网格线 (stroke="#000" opacity="0.2")，模拟战术地图。
    *   **应用纹理**：将这些纹理应用到房间 (fill="url(#floor-stone)")。
    *   **网格覆盖**：在所有房间之上（但在文字之下）覆盖一层 "grid-pattern"，这能瞬间提升地图的专业度和战术感！

2.  **手绘风格与滤镜控制（模拟铅笔/石笔）**：
    *   **定义滤镜**：请在 <defs> 中定义 "pencil-effect" 滤镜。
        - 必须使用 **高频噪声** (\`baseFrequency="0.7"\` 或更高) 来模拟铅笔的颗粒感。
        - 使用 \`feComposite\` (operator="in") 将噪声叠加到线条上，使线条产生不连续的石墨质感，而不是单纯的扭曲。
    *   **应用范围（关键）**：将 \`filter="url(#pencil-effect)"\` 应用到所有房间轮廓、墙壁和走廊。
    *   **文字保护（非常重要）**：**绝对禁止**将扭曲滤镜应用到 <text> 标签！文字必须保持清晰锐利，不能扭曲。

3.  **背景**：
    *   SVG 第一层必须是覆盖全图的 <rect>，填充 "parchment" (羊皮纸) 颜色或纹理，**绝不能透明**。

4.  **排版与逼格（提升质感的核心）**：
    *   **字体魔法**：
        - 标题使用 \`font-family="Cinzel", serif\`，字号巨大，居中显示在地图顶部。
        - 房间标签使用 \`font-family="MedievalSharp", cursive\`，颜色使用深红或深金，增加神秘感。
        - 说明文字使用 \`font-family="Crimson Text", serif\`。
        - 所有文字应为中文。
    *   **装饰边框**：不要让地图悬浮在真空中！请画一个**华丽的装饰边框**（双线、角落花纹或凯尔特结风格）包围整个地图区域。
    *   **图例与装饰**：
        - 在角落绘制一个极其精细的**指南针 (Compass Rose)**。
        - 添加“比例尺”条。
        - 添加墨水污渍、羊皮纸的破损边缘效果。
    *   **整体构图**：像一本精美的奇幻设定集插图一样排版。

5.  **视觉细节**：
    *   **房间连接**：走廊应有实体宽度，与房间自然融合。
    *   **家具**：添加简单的家具符号（圆圈代表柱子，长方块代表桌子，X代表陷阱）。

请输出完整的 SVG 代码。

**关键排版修正（防止重叠）**：
*   **ViewBox 扩展**：输入的房间坐标是在 0,0 到 800,600 之间。为了放下标题和边框，请务必将 SVG 的 \`viewBox\` 设置为 **\`-50 -150 900 850\`** (或者类似的扩展范围)。
*   **标题位置**：将大标题放置在 \`y = -80\` 左右的位置（即地图上方），**绝对不要覆盖房间**！
*   **边框位置**：边框应该包围整个视觉区域。

不要使用markdown代码块。直接返回 <svg ...> ... </svg>。`,

        battleStructure: (theme, width, height) => `你是一个专业的DND战斗地图环境设计师。请根据主题设计一个 ${width}x${height} 网格大小的战斗遭遇场景。

主题：${theme}

关键要求：
1. **战术丰富性**：不仅仅是空地。包括障碍物（阻挡视线/移动）、危险地形（伤害/状态）、困难地形（移动消耗加倍）和有利位置（高地/掩体）。
2. **环境叙事**：通过物体放置传达故事（例如翻倒的马车、祭坛、营火）。
3. **坐标系统**：使用 1-based 坐标系 (x: 1-${width}, y: 1-${height})。

请生成JSON格式数据：
1. mapName: 场景名称
2. dimensions: { width: ${width}, height: ${height} }
3. ground: 地面类型 (grass / dirt / stone / wood_plank / water / lava / snow)
4. terrain_objects: 地形物体列表，包含：
   - type: 类型 (tree / rock / wall / pillar / water_pool / furniture / rubble / bush / statue)
   - x, y: 左上角坐标
   - w, h: 占据的格数 (可以是非整数，但尽量贴合网格)
   - rotation: 旋转角度 (0, 90, 45...)
   - description: 简短描述 (e.g. "古老的橡树", "破碎的雕像")
   - tactical: 战术属性 (cover: 掩体, block: 阻挡, difficult: 困难地形)

只返回JSON，不要其他解释。`,

        battleSVG: (structureJSON) => `你是一个数字艺术地图绘制师。请根据以下结构数据，绘制一张**俯视视角 (Top-Down)** 的高精度战斗地图底图。

${structureJSON}

**绘图规范 (SVG)**：

1.  **尺寸与视图**：
    *   假设每个网格单位 (Unit) 为 50像素。
    *   SVG \`width\` = dimensions.width * 50, \`height\` = dimensions.height * 50。
    *   \`viewBox\` = "0 0 width height"。
    *   **不要画网格线！** (Grid lines) - 网格线由上层UI负责，你只负责画底图。

2.  **艺术风格 (Art Style)**：
    *   **写实材质 + 手绘轮廓**：地面使用高质量的纹理图案 (Patterns)，物体使用有厚度的轮廓线。
    *   **光影与立体感**：
        - **必须使用投影 (Drop Shadow)**：为所有直立物体（树、墙、柱子）添加 \`<filter>\` 投影效果，模拟光照，产生立体感。
        - **环境光遮蔽 (AO)**：在墙角或物体底部添加深色渐变。
    *   **色彩**：饱和度适中，不要太鲜艳，稍微偏向 "Grim Dark" 或 "High Fantasy" 风格。

3.  **图层处理**：
    *   **底层 (Background)**：铺满全图的基础地面纹理（草地、石板路等）。使用 <pattern> 定义纹理细节，避免单色填充。
    *   **装饰层 (Details)**：在地面上添加一些随机噪点、小石子、裂缝、污渍，打破单调。
    *   **物体层 (Objects)**：绘制 terrain_objects。
        - 树木：绘制树冠的俯视图（通常是不规则圆形），带有叶子纹理。
        - 墙壁/柱子：要有顶部平面和侧面投影。
        - 水面：使用半透明蓝色 + 波纹滤镜。

4.  **技术细节**：
    *   在 <defs> 中预定义好常用的滤镜 (Shadow, Glow) 和图案 (Grass, Stone, Water)。
    *   所有坐标需乘以 50 转换为像素坐标。

5.  **输出要求**：
    *   只输出 <svg> 代码。
    *   不需要文字标签。
    *   不需要边框。

直接返回 <svg ...> ... </svg>。`
    },

    // 1. Check if structure exists for location
    checkStructure: (locationName) => {
        const table = DataManager.getTable('EXPLORATION_Map_Data');
        if (!table) return null;
        const row = table.find(r => r['LocationName'] === locationName);
        return row ? row['MapStructureJSON'] : null;
    },

    // 2. Generate Structure (Step 1)
    generateStructure: async (locationName, description) => {
        const apiConfig = await SettingsManager.getAPIConfig();
        if (!apiConfig.url || !apiConfig.key) throw new Error("请先在设置中配置 API Key");

        const theme = `${locationName}。${description || ''}`;
        const prompt = ExplorationMapManager.prompts.structure(theme);
        
        Logger.info('[ExplorationMap] Generating structure for:', locationName);
        
        const response = await TavernAPI.generate([{ role: 'user', content: prompt }], {
            customConfig: apiConfig,
            maxTokens: 4000
        });

        // Parse JSON
        let jsonStr = response;
        const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
        jsonStr = jsonStr.trim();
        
        // Basic cleanup
        if (!jsonStr.startsWith('{')) jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
        if (!jsonStr.endsWith('}')) jsonStr = jsonStr.substring(0, jsonStr.lastIndexOf('}') + 1);

        // Validation
        JSON.parse(jsonStr); // Will throw if invalid

        // Save to Table
        await ExplorationMapManager.saveStructure(locationName, jsonStr);
        return jsonStr;
    },

    // Save structure to table
    saveStructure: async (locationName, jsonStr) => {
        const rawData = DataManager.getAllData();
        const tableKey = Object.keys(rawData).find(k => k.includes('EXPLORATION_Map_Data') || (rawData[k].name && rawData[k].name.includes('探索地图数据')));
        
        if (!tableKey) {
            Logger.error('Table EXPLORATION_Map_Data not found!');
            return;
        }

        const sheet = rawData[tableKey];
        if (!sheet.content) sheet.content = [];
        
        const headers = sheet.content[0];
        const locIdx = headers.indexOf('LocationName');
        const jsonIdx = headers.indexOf('MapStructureJSON');
        const timeIdx = headers.indexOf('LastUpdated');

        // Find or Insert
        let row = sheet.content.slice(1).find(r => r[locIdx] === locationName);
        if (row) {
            row[jsonIdx] = jsonStr;
            row[timeIdx] = new Date().toISOString();
        } else {
            const newRow = new Array(headers.length).fill(null);
            newRow[locIdx] = locationName;
            newRow[jsonIdx] = jsonStr;
            newRow[timeIdx] = new Date().toISOString();
            sheet.content.push(newRow);
        }

        await DiceManager.saveData(rawData);
    },

    // 3. Generate SVG (Step 2)
    generateSVG: async (locationName, structureJSON) => {
        const apiConfig = await SettingsManager.getAPIConfig();
        if (!apiConfig.url || !apiConfig.key) throw new Error("请先在设置中配置 API Key");

        const prompt = ExplorationMapManager.prompts.svg(structureJSON);
        
        Logger.info('[ExplorationMap] Generating SVG for:', locationName);
        
        const response = await TavernAPI.generate([{ role: 'user', content: prompt }], {
            customConfig: apiConfig,
            maxTokens: 8192 // High tokens for SVG
        });

        // Extract SVG
        let svgContent = response;
        const codeBlockMatch = svgContent.match(/```(?:xml|svg|html)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) svgContent = codeBlockMatch[1];

        const svgStartIndex = svgContent.indexOf('<svg');
        const svgEndIndex = svgContent.lastIndexOf('</svg>');
        
        if (svgStartIndex !== -1 && svgEndIndex !== -1) {
            svgContent = svgContent.substring(svgStartIndex, svgEndIndex + 6);
        } else {
            throw new Error("未能提取有效的 SVG 代码");
        }

        // Add namespace if missing
        if(!svgContent.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            svgContent = svgContent.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Save to Cache
        await DBAdapter.setSVG(locationName, svgContent);
        return svgContent;
    },

    // Main Flow: Get or Generate Map
    getMap: async (locationName, description, forceRegen = false) => {
        // 1. Check SVG Cache (if not forced)
        if (!forceRegen) {
            const cachedSVG = await DBAdapter.getSVG(locationName);
            if (cachedSVG) return { type: 'svg', content: cachedSVG };
        }

        // 2. Check Structure
        let structure = ExplorationMapManager.checkStructure(locationName);
        
        // If no structure, fail (User requested to remove structure generation)
        if (!structure) {
            // [Modified] If no structure found, try to generate it automatically for better UX
             try {
                Logger.info('Structure not found, generating new structure for:', locationName);
                structure = await ExplorationMapManager.generateStructure(locationName, description);
            } catch (e) {
                return { type: 'error', message: '结构生成失败: ' + e.message };
            }
        }

        // 3. Generate SVG from Structure (Step 2)
        try {
            const svg = await ExplorationMapManager.generateSVG(locationName, structure);
            return { type: 'svg', content: svg };
        } catch (e) {
            return { type: 'error', message: '绘图失败: ' + e.message };
        }
    },

    // [New] Check Battle Map Structure from Table
    checkBattleStructure: (sceneName) => {
        const table = DataManager.getTable('COMBAT_Map_Visuals');
        if (!table) return null;
        // Try exact match or fuzzy match if needed. Using exact match for now.
        const row = table.find(r => r['SceneName'] === sceneName);
        return row ? row['VisualJSON'] : null;
    },

    // [New] Save Battle Map Structure to Table
    saveBattleStructure: async (sceneName, jsonStr, width, height) => {
        const rawData = DataManager.getAllData();
        const tableKey = Object.keys(rawData).find(k => k.includes('COMBAT_Map_Visuals') || (rawData[k].name && rawData[k].name.includes('战斗地图绘制')));
        
        if (!tableKey) {
            Logger.warn('Table COMBAT_Map_Visuals not found, skipping save.');
            return;
        }

        const sheet = rawData[tableKey];
        if (!sheet.content) sheet.content = [];
        
        const headers = sheet.content[0];
        const nameIdx = headers.indexOf('SceneName');
        const jsonIdx = headers.indexOf('VisualJSON');
        const sizeIdx = headers.indexOf('GridSize');
        const timeIdx = headers.indexOf('LastUpdated');

        // Find or Insert
        let row = sheet.content.slice(1).find(r => r[nameIdx] === sceneName);
        const now = new Date().toISOString();
        const sizeStr = `${width}x${height}`;

        if (row) {
            row[jsonIdx] = jsonStr;
            row[sizeIdx] = sizeStr;
            row[timeIdx] = now;
        } else {
            const newRow = new Array(headers.length).fill(null);
            newRow[nameIdx] = sceneName;
            newRow[jsonIdx] = jsonStr;
            newRow[sizeIdx] = sizeStr;
            newRow[timeIdx] = now;
            sheet.content.push(newRow);
        }

        await DiceManager.saveData(rawData);
    },

    // [New] Generate Battle Map
    getBattleMap: async (locationName, description, width, height, forceRegen = false) => {
        const cacheKey = `BATTLE_MAP_${locationName}_${width}x${height}`;
        
        // 1. Check Cache (SVG)
        if (!forceRegen) {
            const cachedSVG = await DBAdapter.getSVG(cacheKey);
            if (cachedSVG) return { type: 'svg', content: cachedSVG };
        }

        const apiConfig = await SettingsManager.getAPIConfig();
        if (!apiConfig.url || !apiConfig.key) throw new Error("请先在设置中配置 API Key");

        try {
            // Step 1: Get Structure (From Table or Generate)
            let jsonStr = null;
            
            // Try to load from table first (if not forced)
            if (!forceRegen) {
                jsonStr = ExplorationMapManager.checkBattleStructure(locationName);
                if (jsonStr) Logger.info('[BattleMap] Loaded structure from table:', locationName);
            }

            // If not found or forced, generate new
            if (!jsonStr) {
                Logger.info('[BattleMap] Generating new structure for:', locationName);
                const structurePrompt = ExplorationMapManager.prompts.battleStructure(locationName + " " + description, width, height);
                const structureRes = await TavernAPI.generate([{ role: 'user', content: structurePrompt }], {
                    customConfig: apiConfig,
                    maxTokens: 2000
                });
                
                jsonStr = structureRes;
                const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
                if (jsonMatch) jsonStr = jsonMatch[1];
                
                // Cleanup
                jsonStr = jsonStr.trim();
                if (!jsonStr.startsWith('{')) jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
                if (!jsonStr.endsWith('}')) jsonStr = jsonStr.substring(0, jsonStr.lastIndexOf('}') + 1);

                // Save to Table
                await ExplorationMapManager.saveBattleStructure(locationName, jsonStr, width, height);
            }

            // Step 2: Generate SVG
            Logger.info('[BattleMap] Generating SVG...');
            const svgPrompt = ExplorationMapManager.prompts.battleSVG(jsonStr);
            const svgRes = await TavernAPI.generate([{ role: 'user', content: svgPrompt }], {
                customConfig: apiConfig,
                maxTokens: 8192
            });

            let svgContent = svgRes;
            const codeBlockMatch = svgContent.match(/```(?:xml|svg|html)?\s*([\s\S]*?)\s*```/i);
            if (codeBlockMatch) svgContent = codeBlockMatch[1];
            
            const svgStartIndex = svgContent.indexOf('<svg');
            const svgEndIndex = svgContent.lastIndexOf('</svg>');
            
            if (svgStartIndex !== -1 && svgEndIndex !== -1) {
                svgContent = svgContent.substring(svgStartIndex, svgEndIndex + 6);
            }

            // Namespace fix
            if(!svgContent.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
                svgContent = svgContent.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }

            // Cache it
            await DBAdapter.setSVG(cacheKey, svgContent);
            return { type: 'svg', content: svgContent };

        } catch (e) {
            Logger.error('[BattleMap] Generation failed', e);
            return { type: 'error', message: e.message };
        }
    }
};

;// ./src/ui/modules/UIMap.js







/* harmony default export */ const UIMap = ({
    // [新增] 地图缩放状态
    _mapZoom: {
        scale: 1.0,
        panX: 0,
        panY: 0,
        isPanning: false,
        lastTouchDist: 0
    },

    // [新增] 绑定地图缩放事件 (增强版：支持 Pointer Events 拖拽平移)
    bindMapZoom($container, $innerMap) {
        const { $ } = getCore();
        const self = this; // [修复] 在函数开头定义 self，确保所有内部函数可以访问
        const state = this._mapZoom;
        const containerEl = $container[0]; // 获取原生 DOM 元素
        
        // 设置禁止选择，防止拖拽时选中文字
        $container.css({
            'user-select': 'none',
            'touch-action': 'none' // 关键：禁用浏览器默认触摸行为
        });
        $innerMap.css('user-select', 'none');

        // 读取保存的缩放比例
        DBAdapter.getSetting(CONFIG.STORAGE_KEYS.MAP_ZOOM).then(saved => {
            if (saved) {
                state.scale = parseFloat(saved) || 1.0;
            } else {
                state.scale = 1.0;
            }
            applyTransform();
        });
        
        // 应用变换
        const applyTransform = () => {
            $innerMap.css({
                transform: `scale(${state.scale}) translate(${state.panX}px, ${state.panY}px)`,
                transformOrigin: 'center center',
                transition: state.isPanning ? 'none' : 'transform 0.2s ease-out'
            });
            updateIndicator();
        };
        
        // Expose transform function for external calls
        $container.data('applyTransform', applyTransform);
        
        // 缩放指示器
        if ($container.find('.dnd-map-zoom-indicator').length === 0) {
            $container.append(`<div class="dnd-map-zoom-indicator" style="position:absolute;top:2px;right:4px;font-size:8px;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.4);padding:1px 3px;border-radius:2px;pointer-events:none;z-index:31;">100%</div>`);
        }
        const updateIndicator = () => {
            $container.find('.dnd-map-zoom-indicator').text(`${Math.round(state.scale * 100)}%`);
        };

        // --- Pointer Events 交互 (支持鼠标和触摸) ---
        let startX = 0, startY = 0;
        let initialPanX = 0, initialPanY = 0;
        let initialDist = 0;
        let initialScale = 1;
        let pointers = new Map(); // 用于多点触控追踪
        let dragDisabled = false; // [修复] 用于禁用拖拽，让 click 事件正常触发

        const handlePointerDown = (e) => {
            // 忽略右键
            if (e.button === 2) return;
            
            // [修复] 检查是否应该禁用拖拽 (瞄准模式或点击 Token)
            const clickTarget = document.elementFromPoint(e.clientX, e.clientY);
            const $clickTarget = $(clickTarget);
            const isOnToken = $clickTarget.closest('.dnd-minimap-token').length > 0;
            const isTargeting = self._targetingMode && self._targetingMode.active;
            
            if (isOnToken || isTargeting) {
                // 禁用拖拽，让原生 click 事件正常触发
                dragDisabled = true;
                console.log('[MapZoom] Drag disabled - isOnToken:', isOnToken, 'isTargeting:', isTargeting);
                return; // 不调用 preventDefault，让 click 事件正常传播
            }
            
            dragDisabled = false;
            e.preventDefault();
            e.stopPropagation(); // 阻止冒泡，防止触发上层点击
            
            // 记录 Pointer
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            
            if (containerEl.setPointerCapture) {
                try { containerEl.setPointerCapture(e.pointerId); } catch(err){}
            }

            if (pointers.size === 1) {
                // 单指/鼠标：开始平移
                state.isPanning = true;
                startX = e.clientX;
                startY = e.clientY;
                initialPanX = state.panX;
                initialPanY = state.panY;
                $container.css('cursor', 'grabbing');
            } else if (pointers.size === 2) {
                // 双指：开始缩放
                state.isPanning = false; // 切换到缩放模式
                const pts = Array.from(pointers.values());
                const dx = pts[0].x - pts[1].x;
                const dy = pts[0].y - pts[1].y;
                initialDist = Math.hypot(dx, dy);
                initialScale = state.scale;
            }
        };

        const handlePointerMove = (e) => {
            // [修复] 如果拖拽被禁用，跳过处理
            if (dragDisabled || !pointers.has(e.pointerId)) return;
            
            e.preventDefault();
            // 更新 pointer 位置
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (pointers.size === 1 && state.isPanning) {
                // 平移处理
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                // 跟手移动：位移 / 当前缩放比例
                state.panX = initialPanX + dx / state.scale;
                state.panY = initialPanY + dy / state.scale;
                
                applyTransform();
            } else if (pointers.size === 2) {
                // 缩放处理
                const pts = Array.from(pointers.values());
                const dx = pts[0].x - pts[1].x;
                const dy = pts[0].y - pts[1].y;
                const dist = Math.hypot(dx, dy);
                
                if (initialDist > 0) {
                    const scaleFactor = dist / initialDist;
                    state.scale = Math.max(CONFIG.MAP_ZOOM.MIN, Math.min(CONFIG.MAP_ZOOM.MAX, initialScale * scaleFactor));
                    applyTransform();
                }
            }
        };

        const handlePointerUp = (e) => {
            // [修复] 如果拖拽被禁用，重置状态并跳过
            if (dragDisabled) {
                dragDisabled = false;
                return;
            }
            
            pointers.delete(e.pointerId);
            
            if (containerEl.releasePointerCapture) {
                try { containerEl.releasePointerCapture(e.pointerId); } catch(err){}
            }

            if (pointers.size === 0) {
                state.isPanning = false;
                $container.css('cursor', '');
                // 保存缩放比例
                safeSave(CONFIG.STORAGE_KEYS.MAP_ZOOM, state.scale);
            } else if (pointers.size === 1) {
                // 如果抬起一根手指，剩下的手指重置为平移起始点
                const pt = pointers.values().next().value;
                state.isPanning = true;
                startX = pt.x;
                startY = pt.y;
                initialPanX = state.panX;
                initialPanY = state.panY;
            }
        };

        // 移除旧的 jQuery 事件绑定，改用原生 Pointer Events
        $container.off('mousedown mousemove mouseup touchstart touchmove touchend');
        
        // 绑定原生事件
        containerEl.addEventListener('pointerdown', handlePointerDown);
        containerEl.addEventListener('pointermove', handlePointerMove);
        containerEl.addEventListener('pointerup', handlePointerUp);
        containerEl.addEventListener('pointercancel', handlePointerUp);
        containerEl.addEventListener('pointerleave', handlePointerUp);

        // --- 滚轮缩放 ---
        containerEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const delta = e.deltaY > 0 ? -CONFIG.MAP_ZOOM.STEP : CONFIG.MAP_ZOOM.STEP;
            state.scale = Math.max(CONFIG.MAP_ZOOM.MIN, Math.min(CONFIG.MAP_ZOOM.MAX, state.scale + delta));
            
            applyTransform();
            // Debounce save
            if (self._zoomSaveTimer) clearTimeout(self._zoomSaveTimer);
            self._zoomSaveTimer = setTimeout(() => safeSave(CONFIG.STORAGE_KEYS.MAP_ZOOM, state.scale), 500);
        }, { passive: false });
        
        // 双击重置
        let lastTap = 0;
        $container.on('click', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                state.scale = CONFIG.MAP_ZOOM.DEFAULT;
                state.panX = 0;
                state.panY = 0;
                applyTransform();
                safeSave(CONFIG.STORAGE_KEYS.MAP_ZOOM, state.scale);
            }
            lastTap = now;
        });
        
        // 初始化
        applyTransform();
    },

    async renderMiniMap($el) {
        const { $ } = getCore();
        const global = DataManager.getTable('SYS_GlobalState');
        const gInfo = (global && global[0]) ? global[0] : {};
        const isCombat = gInfo['战斗模式'] === '战斗中';
        let locationName = gInfo['当前场景'] || '未知区域';

        // Check for override in EXPLORATION_Map_Data
        const mapDataExploration = DataManager.getTable('EXPLORATION_Map_Data');
        if (mapDataExploration) {
            const forcedMap = mapDataExploration.find(m => {
                const val = m['当前显示地图'];
                return val === '是' || val === true || val === 'True' || val === 'true';
            });
            if (forcedMap && forcedMap['LocationName']) {
                locationName = forcedMap['LocationName'];
            }
        }

        // ==========================================
        // 模式 A: 探索地图 (SVG)
        // ==========================================
        if (!isCombat) {
            // 检查是否需要初始化容器
            let $innerMap = $el.find('.dnd-exploration-inner');
            if ($innerMap.length === 0) {
                $el.empty();
                $el.css({
                    position: 'relative',
                    background: '#0a0a0c',
                    overflow: 'hidden'
                });
                
                // 创建内部容器用于缩放/平移
                $innerMap = $('<div class="dnd-exploration-inner" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;transform-origin:center center;"></div>');
                $el.append($innerMap);
                
                // 绑定缩放
                this.bindMapZoom($el, $innerMap);
            }

            // 尝试获取地图
            const containerId = 'dnd-exploration-map-loader';
            // 如果内容为空，显示加载中
            if ($innerMap.is(':empty')) {
                    $innerMap.html(`<div id="${containerId}" style="display:flex;align-items:center;justify-content:center;color:#666;flex-direction:column;gap:5px;">
                    <div class="dnd-spinner" style="width:20px;height:20px;border:2px solid #333;border-top:2px solid var(--dnd-border-gold);border-radius:50%;animation:dnd-spin 1s infinite linear;"></div>
                    <div style="font-size:10px;">加载地图...</div>
                </div>`);
            }

            try {
                const mapResult = await ExplorationMapManager.getMap(locationName, gInfo['场景描述']);
                
                if (mapResult.type === 'svg') {
                    const svgContent = mapResult.content;
                    // 注入 SVG
                    $innerMap.html(svgContent);
                    const $svg = $innerMap.find('svg');
                    $svg.css({ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' });

                    // [新增] 自动计算填满容器的缩放比例 (Cover Mode)
                    setTimeout(() => {
                        try {
                            // 尝试从 viewBox 获取宽高比
                            const viewBox = $svg[0].getAttribute('viewBox');
                            if (viewBox) {
                                const [vx, vy, vw, vh] = viewBox.split(/[\s,]+/).map(parseFloat);
                                const svgRatio = vw / vh;
                                
                                const cw = $el.width();
                                const ch = $el.height();
                                const containerRatio = cw / ch;
                                
                                // 默认 fit 是 scale=1 (contain).
                                // 如果 Container 比 SVG 更宽 (cw/ch > vw/vh)，则 SVG 高度匹配，宽度有黑边。需放大 cw/renderW = cw / (ch * svgRatio) = containerRatio / svgRatio
                                // 如果 Container 比 SVG 更窄 (cw/ch < vw/vh)，则 SVG 宽度匹配，高度有黑边。需放大 ch/renderH = ch / (cw / svgRatio) = svgRatio / containerRatio
                                
                                let coverScale = 1.0;
                                if (containerRatio > svgRatio) {
                                    coverScale = containerRatio / svgRatio;
                                } else {
                                    coverScale = svgRatio / containerRatio;
                                }
                                
                                // 稍微放大一点点以消除边缘缝隙
                                coverScale = coverScale * 1.02;
                                
                                console.log('[MapZoom] Auto-Fit Scale:', coverScale, { containerRatio, svgRatio });
                                
                                // 应用缩放
                                if (coverScale > 1.0) {
                                    this._mapZoom.scale = coverScale;
                                    // Reset pan
                                    this._mapZoom.panX = 0;
                                    this._mapZoom.panY = 0;
                                    
                                    // 调用 applyTransform (通过 data 暴露)
                                    if ($el.data('applyTransform')) {
                                        $el.data('applyTransform')();
                                    }
                                }
                            }
                        } catch(e) { console.warn('Auto-zoom failed', e); }
                    }, 50);

                    // 添加控制层 (悬浮显示) - 添加到外层 $el
                    if ($el.find('.dnd-map-controls').length === 0) {
                        const overlayHtml = `
                            <div class="dnd-map-controls" style="position:absolute;top:5px;right:5px;display:flex;gap:5px;opacity:0;transition:opacity 0.2s;z-index:10;">
                                <button type="button" onclick="window.DND_Dashboard_UI.regenerateMap('${locationName}', 'svg')" title="保持结构重绘图片" style="background:rgba(0,0,0,0.6);border:1px solid #555;color:#fff;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:10px;">🎨 重绘</button>
                            </div>
                        `;
                        $el.append(overlayHtml);
                        
                        $el.hover(
                            () => $el.find('.dnd-map-controls').css('opacity', 1),
                            () => $el.find('.dnd-map-controls').css('opacity', 0)
                        );
                    }

                } else if (mapResult.type === 'error' && mapResult.message.includes('结构')) {
                    // 尚未生成
                        $innerMap.html(`
                        <div style="text-align:center;color:#888;">
                            <div style="font-size:24px;margin-bottom:5px;">🗺️</div>
                            <div style="font-size:10px;margin-bottom:10px;">${mapResult.message}</div>
                        </div>
                    `);
                } else {
                        // 其他错误
                        $innerMap.html(`<div style="color:#e74c3c;font-size:10px;padding:10px;text-align:center;">${mapResult.message}</div>`);
                }
            } catch (e) {
                $innerMap.html(`<div style="color:#e74c3c;font-size:10px;">加载错误: ${e.message}</div>`);
            }
            
            return;
        }

        // ==========================================
        // 模式 B: 战斗地图 (Tactical Grid)
        // ==========================================
        const mapData = DataManager.getTable('COMBAT_BattleMap');
        const encounters = DataManager.getTable('COMBAT_Encounter');
        
        if (!mapData) {
            $el.html('<div style="color:#666;display:flex;align-items:center;justify-content:center;height:100%;">无战斗数据</div>');
            return;
        }

        const round = gInfo['当前回合'] || 0;

        // 1. 获取并计算地图尺寸配置
        const config = mapData.find(m => m['类型'] === 'Config');
        let cols = 20, rows = 20;
        if (config && config['坐标']) {
            const size = DataManager.parseValue(config['坐标'], 'size');
            if (size) {
                cols = size.w || 20;
                rows = size.h || 20;
            }
        }

        const containerSize = 180;
        const cellSize = Math.min(12, Math.max(6, Math.floor(containerSize / Math.max(cols, rows))));
        const mapWidth = cols * cellSize;
        const mapHeight = rows * cellSize;
        const offsetX = (containerSize - mapWidth) / 2;
        const offsetY = (containerSize - mapHeight) / 2;

        // 2. 检查或初始化内部容器 (Static Layer)
        let $innerMap = $el.find('.dnd-minimap-inner');
        let needsFullRedraw = false;

        // 如果尺寸变了，或者容器不存在，则全量重绘
        if ($innerMap.length === 0 ||
            parseFloat($innerMap.data('cols')) !== cols ||
            parseFloat($innerMap.data('rows')) !== rows) {
            
            $el.empty(); // 彻底清空
            needsFullRedraw = true;
            
            $innerMap = $(`<div class="dnd-minimap-inner"
                style="position:absolute;left:${offsetX}px;top:${offsetY}px;width:${mapWidth}px;height:${mapHeight}px;background:#1a1a1c;"
                data-cell-size="${cellSize}" data-cols="${cols}" data-rows="${rows}"></div>`);
            $el.append($innerMap);

            // [新增] 战斗底图层 (Background Layer)
            const bgId = `dnd-battle-bg-${locationName.replace(/\s+/g,'_')}`;
            // 移除 opacity 限制，移除滤镜，确保亮度正常
            $innerMap.append(`<div id="${bgId}" class="dnd-battle-bg-container" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;"></div>`);
            
            // 异步加载战斗底图
            ExplorationMapManager.getBattleMap(locationName, gInfo['场景描述'], cols, rows, false).then(res => {
                if (res.type === 'svg') {
                    const $bg = $innerMap.find(`#${bgId}`);
                    $bg.html(res.content);
                    // 强制 SVG 拉伸适应 Grid
                    $bg.find('svg').css({
                        width: '100%',
                        height: '100%',
                        preserveAspectRatio: 'none'
                        // 移除滤镜，防止过暗
                    });
                }
            });

            // 绘制 Grid (SVG)
            const gridSvg = `
                <svg class="dnd-minimap-grid" width="${mapWidth}" height="${mapHeight}" style="position:absolute;top:0;left:0;pointer-events:none;opacity:0.3;z-index:5;">
                    <defs>
                        <pattern id="miniGrid" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse">
                            <path d="M ${cellSize} 0 L 0 0 0 ${cellSize}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#miniGrid)"/>
                </svg>
            `;
            $innerMap.append(gridSvg);

            // 绘制静态地形 (Walls, Terrain, Zones)
            mapData.forEach(item => {
                if (['Token', 'Config'].includes(item['类型'])) return;

                const pos = DataManager.parseValue(item['坐标'], 'coord');
                if (!pos) return;

                const px = (pos.x !== undefined ? pos.x : 1) - 1;
                const py = (pos.y !== undefined ? pos.y : 1) - 1;
                const size = DataManager.parseValue(item['大小'], 'size') || { w: 1, h: 1 };

                const left = px * cellSize;
                const top = py * cellSize;
                const width = size.w * cellSize;
                const height = size.h * cellSize;

                let el = '';
                if (item['类型'] === 'Wall') {
                    el = `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:#3a3a3a;border:1px solid #555;z-index:1;"></div>`;
                } else if (item['类型'] === 'Terrain') {
                    el = `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:rgba(46, 204, 113, 0.2);border:1px dashed rgba(46, 204, 113, 0.4);z-index:0;"></div>`;
                } else if (item['类型'] === 'Zone') {
                    el = `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:rgba(155, 89, 182, 0.25);border:2px solid rgba(155, 89, 182, 0.5);border-radius:50%;z-index:2;"></div>`;
                }
                if (el) $innerMap.append(el);
            });

            // 绑定事件 (仅在创建时绑定一次)
            const self = this;
            $innerMap.on('click', (e) => {
                e.stopPropagation();
                // 添加点击波纹反馈
                const rect = $innerMap[0].getBoundingClientRect();
                const rx = e.clientX - rect.left;
                const ry = e.clientY - rect.top;
                
                const $ripple = $('<div class="dnd-map-ripple"></div>');
                $ripple.css({
                    left: rx + 'px',
                    top: ry + 'px',
                    width: cellSize*2 + 'px',
                    height: cellSize*2 + 'px',
                    marginLeft: -cellSize + 'px',
                    marginTop: -cellSize + 'px'
                });
                $innerMap.append($ripple);
                setTimeout(() => $ripple.remove(), 600);

                const grid = self.getGridFromEvent(e, $el, $innerMap);
                self.handleMapInteraction(grid.x, grid.y);
            });

            // 绑定缩放 (仅在创建时绑定一次)
            this.bindMapZoom($el, $innerMap);
            
            // UI Overlay (Round Info + Controls)
            $el.append(`
                <div class="dnd-hud-overlay" style="pointer-events:none;z-index:30;">
                    <div style="position:absolute;top:2px;left:4px;font-size:9px;color:rgba(255,255,255,0.5);text-shadow:1px 1px 2px #000;">A1</div>
                    <div style="position:absolute;bottom:2px;right:4px;font-size:9px;color:rgba(255,255,255,0.5);text-shadow:1px 1px 2px #000;">${String.fromCharCode(64 + Math.min(cols, 26))}${rows}</div>
                    <div id="dnd-map-round-info" style="position:absolute;bottom:2px;left:4px;font-size:9px;color:var(--dnd-text-highlight);background:rgba(0,0,0,0.5);padding:0 4px;border-radius:2px;">第 ${round} 回合</div>
                    
                    <!-- Battle Map Controls -->
                    <div class="dnd-map-controls" style="position:absolute;top:2px;right:2px;display:flex;gap:2px;pointer-events:auto;opacity:0.8;">
                        <button type="button" onclick="window.DND_Dashboard_UI.regenerateMap('${locationName}', 'svg')" title="生成/刷新 战斗底图" style="background:rgba(0,0,0,0.6);border:1px solid #444;color:#fff;border-radius:3px;padding:1px 4px;cursor:pointer;font-size:9px;">🎨 AI底图</button>
                    </div>
                </div>
            `);
        } else {
            // 仅更新回合数
            $el.find('#dnd-map-round-info').text(`第 ${round} 回合`);
        }

        // 3. 增量更新 Token (Dynamic Layer)
        const currentTokens = mapData.filter(m => m['类型'] === 'Token');
        const activeTokenIds = new Set();
        
        // [新增] 获取队伍数据以匹配真实ID
        const partyData = DataManager.getPartyData();

        currentTokens.forEach(item => {
            const pos = DataManager.parseValue(item['坐标'], 'coord');
            if (!pos) return;

            const px = (pos.x !== undefined ? pos.x : 1) - 1;
            const py = (pos.y !== undefined ? pos.y : 1) - 1;
            const size = DataManager.parseValue(item['大小'], 'size') || { w: 1, h: 1 };

            const enc = encounters ? encounters.find(e => e['单位名称'] === item['单位名称']) : null;
            const isEnemy = enc ? enc['阵营'] === '敌方' : false;
            const isActive = enc ? enc['是否为当前行动者'] === '是' : false;

            const tokenSize = Math.max(cellSize * size.w - 2, 4);
            const bgColor = isEnemy ? '#c0392b' : '#27ae60';
            const borderColor = isActive ? '#ffdb85' : 'transparent';
            
            // 生成唯一且合法的 DOM ID
            const safeId = 'dnd-token-' + item['单位名称'].replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
            activeTokenIds.add(safeId);

            let $token = $innerMap.find(`#${safeId}`);
            
            // 计算目标 CSS
            const targetCss = {
                left: (px * cellSize + 1) + 'px',
                top: (py * cellSize + 1) + 'px',
                width: tokenSize + 'px',
                height: tokenSize + 'px',
                background: bgColor,
                borderColor: borderColor
            };

            if ($token.length > 0) {
                // 更新现有 Token (利用 CSS transition 实现平滑移动)
                $token.css(targetCss);
                
                // 更新 Active 状态
                if (isActive && !$token.hasClass('active')) $token.addClass('active');
                else if (!isActive && $token.hasClass('active')) $token.removeClass('active');
                
            } else {
                // 创建新 Token
                // [新增] 尝试解析正确的 Avatar Key (CHAR_ID)
                let avatarKey = item['单位名称'];
                if (partyData) {
                    const match = partyData.find(p => p['姓名'] === item['单位名称']);
                    if (match) {
                        avatarKey = match['CHAR_ID'] || match['PC_ID'] || match['姓名'];
                    }
                }
                
                const initialToken = this.getNameInitial(item['单位名称']);
                const uid = `token-content-${safeId}`;
                
                $token = $(`<div id="${safeId}" class="dnd-minimap-token ${isActive ? 'active' : ''}" title="${item['单位名称']}">
                    <div id="${uid}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;font-size:${Math.floor(tokenSize*0.6)}px;text-shadow:0 0 2px #000;pointer-events:none;">
                        ${initialToken}
                    </div>
                </div>`);
                $token.css(targetCss);
                
                // [新增] 异步加载头像
                setTimeout(() => this.loadAvatarAsync(avatarKey, uid), 0);
                
                // 绑定点击事件
                const self = this;
                $token.on('click', (e) => {
                    e.stopPropagation();
                    if (self._targetingMode.active) {
                        const p = DataManager.parseValue(item['坐标'], 'coord');
                        if (p) self.handleMapInteraction(p.x||1, p.y||1);
                    } else {
                        if (enc) self.showCombatUnitDetail(enc, e);
                    }
                });
                
                $innerMap.append($token);
            }
        });

        // 清理已移除的 Token
        $innerMap.find('.dnd-minimap-token').each(function() {
            const id = $(this).attr('id');
            if (id && !activeTokenIds.has(id)) {
                $(this).fadeOut(300, function() { $(this).remove(); });
            }
        });

        // 4. 更新辅助元素 (虚拟位置 & 范围圈)
        // 先清除旧的辅助元素
        $innerMap.find('.dnd-map-overlay').remove();
        
        const activeChar = this.getControlledCharacter();
        let sourcePos = { x: 0, y: 0 };
        let sourceFound = false;
        let realPos = null;

        if (encounters && activeChar) {
            let activeUnit = encounters.find(u => u['单位名称'] === activeChar['姓名']);
            if (!activeUnit && activeChar['姓名']) {
                activeUnit = encounters.find(u => activeChar['姓名'].includes(u['单位名称']) || u['单位名称'].includes(activeChar['姓名']));
            }
            if (activeUnit) {
                const token = mapData.find(m => m['类型'] === 'Token' && m['单位名称'] === activeUnit['单位名称']);
                if (token) {
                    const p = DataManager.parseValue(token['坐标'], 'coord');
                    if (p) realPos = { x: p.x || 1, y: p.y || 1 };
                }
            }
        }

        if (this._virtualPos) {
            sourcePos = { ...this._virtualPos };
            sourceFound = true;
            // 渲染虚拟位置 (Ghost)
            const vPxX = (sourcePos.x - 1) * cellSize;
            const vPxY = (sourcePos.y - 1) * cellSize;
            
            const ghostHtml = `<div class="dnd-map-overlay" style="position:absolute;left:${vPxX}px;top:${vPxY}px;width:${cellSize}px;height:${cellSize}px;border:2px dashed var(--dnd-text-highlight);border-radius:50%;background:rgba(255, 219, 133, 0.2);pointer-events:none;z-index:20;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">👻</div>`;
            $innerMap.append(ghostHtml);

            if (realPos) {
                const rPxX = (realPos.x - 1) * cellSize + cellSize / 2;
                const rPxY = (realPos.y - 1) * cellSize + cellSize / 2;
                const vCenterX = vPxX + cellSize / 2;
                const vCenterY = vPxY + cellSize / 2;
                
                const lineSvg = `
                    <svg class="dnd-map-overlay" width="${mapWidth}" height="${mapHeight}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:15;">
                        <line x1="${rPxX}" y1="${rPxY}" x2="${vCenterX}" y2="${vCenterY}" stroke="var(--dnd-text-highlight)" stroke-width="1" stroke-dasharray="4"/>
                    </svg>
                `;
                $innerMap.append(lineSvg);
            }
        } else if (realPos) {
            sourcePos = realPos;
            sourceFound = true;
        }

        if (this._targetingMode.active && sourceFound) {
            const range = this._targetingMode.range || 1;
            const rangePx = range * cellSize;
            const srcPxX = (sourcePos.x - 1) * cellSize + cellSize / 2;
            const srcPxY = (sourcePos.y - 1) * cellSize + cellSize / 2;
            
            const rangeHtml = `<div class="dnd-map-overlay" style="position:absolute;left:${srcPxX - rangePx}px;top:${srcPxY - rangePx}px;width:${rangePx * 2}px;height:${rangePx * 2}px;border:2px solid var(--dnd-accent-green);background:rgba(46, 204, 113, 0.1);border-radius:50%;pointer-events:none;z-index:25;box-shadow: 0 0 15px rgba(46, 204, 113, 0.3);"></div>`;
            $innerMap.append(rangeHtml);
        }
    },

    // [新增] 重新生成地图 (Wrapper for onclick)
    async regenerateMap(locationName, mode) {
        const { $ } = getCore();
        const global = DataManager.getTable('SYS_GlobalState');
        const isCombat = global && global[0] && global[0]['战斗模式'] === '战斗中';
        
        let confirmMsg = '确定要重新绘制地图图片吗？结构将保持不变。';
        if (isCombat) confirmMsg = '确定要重新生成战斗场景底图吗？这需要消耗 tokens。';

        const confirmed = await NotificationSystem.confirm(confirmMsg, {
            title: '重绘地图',
            confirmText: '重绘',
            type: 'warning'
        });
        if (!confirmed) return;

        // Show spinner
        let $container = $('#dnd-hud-minimap-content');
        // If in combat mode, we might want to keep the grid and just show a spinner overlay,
        // but for simplicity, full blocking spinner is fine or finding the inner container.
        
        if (isCombat) {
             // Find specific bg container or overlay
             const $bg = $('.dnd-minimap-inner');
             if ($bg.length) {
                 // Add loading overlay to map only
                 $bg.append(`<div id="dnd-map-loading-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;color:#fff;">
                    <div style="text-align:center;">
                        <div class="dnd-spinner" style="width:24px;height:24px;border:3px solid #333;border-top:3px solid var(--dnd-border-gold);border-radius:50%;animation:dnd-spin 1s infinite linear;margin:0 auto 5px;"></div>
                        <div style="font-size:10px;">AI 正在构筑战场...</div>
                    </div>
                 </div>`);
             }
        } else {
             $container.html(`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;flex-direction:column;gap:5px;">
                <div class="dnd-spinner" style="width:24px;height:24px;border:3px solid #333;border-top:3px solid var(--dnd-border-gold);border-radius:50%;animation:dnd-spin 1s infinite linear;"></div>
                <div style="font-size:11px;">AI 正在绘图...</div>
            </div>`);
        }

        try {
            const desc = (global && global[0]) ? global[0]['场景描述'] : '';

            if (isCombat) {
                // Battle Map Regen
                const mapData = DataManager.getTable('COMBAT_BattleMap');
                const config = mapData ? mapData.find(m => m['类型'] === 'Config') : null;
                let cols = 20, rows = 20;
                if (config && config['坐标']) {
                    const size = DataManager.parseValue(config['坐标'], 'size');
                    if (size) { cols = size.w || 20; rows = size.h || 20; }
                }
                
                await ExplorationMapManager.getBattleMap(locationName, desc, cols, rows, true); // true = force regen
                
                // Remove loading overlay
                $('#dnd-map-loading-overlay').remove();
                
            } else {
                // Exploration Map Regen
                // Force regen based on mode (Only support SVG regen now)
                const forceParam = true; // true means regen SVG only
                await ExplorationMapManager.getMap(locationName, desc, forceParam);
            }
            
            // Refresh HUD to render new map
            this.renderHUD();
        } catch(e) {
            NotificationSystem.error('生成失败: ' + e.message);
            this.renderHUD(); // Restore UI
        }
    },

    // [新增] 处理地图交互
    handleMapInteraction(gridX, gridY) {
        const state = this._targetingMode;
        const encounters = DataManager.getTable('COMBAT_Encounter');
        const mapData = DataManager.getTable('COMBAT_BattleMap');
        const activeChar = this.getControlledCharacter();
        
        // --- A. 瞄准模式 ---
        if (state.active) {
            // 1. 计算距离
            let dist = 999;
            let sourcePos = { x: 0, y: 0 };
            
            // 获取源头位置 (优先使用虚拟位置，即移动后的位置)
            if (this._virtualPos) {
                sourcePos = { ...this._virtualPos };
            } else if (encounters && activeChar) {
                // [修复] 尝试模糊匹配名称
                let activeUnit = encounters.find(u => u['单位名称'] === activeChar['姓名']);
                if (!activeUnit && activeChar['姓名']) {
                    activeUnit = encounters.find(u => activeChar['姓名'].includes(u['单位名称']) || u['单位名称'].includes(activeChar['姓名']));
                }

                const token = mapData ? mapData.find(m => m['类型'] === 'Token' && m['单位名称'] === (activeUnit ? activeUnit['单位名称'] : '')) : null;
                if (token) {
                    const p = DataManager.parseValue(token['坐标'], 'coord');
                    if (p) sourcePos = { x: p.x || 1, y: p.y || 1 };
                }
            }
            
            // 简单切比雪夫距离 (DND 5e 规则通常也是对角线算1格，或 1-2-1 规则)
            // 这里使用最简单的 max(|dx|, |dy|) 规则 (Default 5e grid rule)
            const dx = Math.abs(gridX - sourcePos.x);
            const dy = Math.abs(gridY - sourcePos.y);
            dist = Math.max(dx, dy);
            
            // 2. 检查距离
            if (dist > state.range) {
                NotificationSystem.warning(`目标超出范围！(距离: ${dist * 5}尺 / 射程: ${state.range * 5}尺)`);
                return;
            }
            
            // 3. 检查是否有目标单位
            let targetName = null;
            const targetToken = mapData.find(m => m['类型'] === 'Token' && m['坐标'] &&
                DataManager.parseValue(m['坐标'], 'coord').x === gridX &&
                DataManager.parseValue(m['坐标'], 'coord').y === gridY);
                
            if (targetToken) targetName = targetToken['单位名称'];
            
            // 4. 执行回调
            if (state.callback) {
                state.callback({
                    x: gridX,
                    y: gridY,
                    target: targetName,
                    distance: dist
                });
            }
            
            // 5. 退出模式
            this.endTargeting();
            return;
        }
        
        // --- B. 普通模式 (点击空地) ---
        // 显示简易菜单: "移动到这里"
        const menuHtml = `
            <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:5px;">
                📍 位置: ${String.fromCharCode(64 + gridX)}${gridY}
            </div>
            <div class="dnd-clickable" style="padding:8px;cursor:pointer;border-radius:4px;background:rgba(46, 204, 113, 0.2);border:1px solid var(--dnd-accent-green);text-align:center;font-weight:bold;"
                onclick="window.DND_Dashboard_UI.executeAction('move', { x: ${gridX}, y: ${gridY} }); window.DND_Dashboard_UI.hideDetailPopup();">
                👣 移动到此
            </div>
        `;
        // 计算屏幕坐标显示菜单
        const { $ } = getCore();
        const $hud = $('#dnd-mini-hud');
        const hudRect = $hud[0].getBoundingClientRect();
        this.showItemDetailPopup(menuHtml, hudRect.left + hudRect.width/2, hudRect.top + hudRect.height/2);
    }
});

;// ./src/ui/modules/UISpells.js



/* harmony default export */ const UISpells = ({
    handleSpellClick(spellName, event) {
        if (event) { event.stopPropagation(); }
        
        const spells = DataManager.getKnownSpells(); // 默认获取主角法术
        if (!spells) return;
        
        const spell = spells.find(s => s['法术名称'] === spellName);
        if (!spell) return;
        
        const html = `
            <div style="color:var(--dnd-text-highlight);font-weight:bold;border-bottom:1px solid #444;margin-bottom:5px;padding-bottom:3px;display:flex;justify-content:space-between;align-items:center;">
                <span>${spell['法术名称']} <span style="font-size:10px;color:#888;font-weight:normal">(${spell['环阶'] === '0' || spell['环阶'] === 0 ? '戏法' : spell['环阶']+'环'})</span></span>
                <button class="dnd-clickable" style="background:var(--dnd-accent-green);border:none;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;cursor:pointer;"
                    onclick="window.DND_Dashboard_UI.prepareCast(
                        '${spell['法术名称']}',
                        '${spell['射程']||'接触'}',
                        '${spell['环阶']}'
                    )">
                    ✨ 施放
                </button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:11px;color:#aaa;margin-bottom:8px;">
                <div>时间: ${spell['施法时间']||'-'}</div>
                <div>射程: ${spell['射程']||'-'}</div>
                <div>成分: ${spell['成分']||'-'}</div>
                <div>持续: ${spell['持续时间']||'-'}</div>
            </div>
            <div style="line-height:1.4;color:#ccc;">${spell['效果描述']||'无描述'}</div>
        `;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    formatSpellSlots(slotsVal, isMini = false) {
        try {
            // 注入 BG3 风格样式 (如果尚未存在)
            const { $ } = getCore();
            if ($('#dnd-spell-styles').length === 0) {
                const style = `
                    <style id="dnd-spell-styles">
                        .dnd-spell-group {
                            border: 1px solid var(--dnd-border-gold);
                            border-radius: 4px;
                            padding: 8px 4px 4px 4px;
                            position: relative;
                            display: inline-flex;
                            flex-direction: column;
                            align-items: center;
                            margin-right: 10px;
                            margin-top: 8px;
                            background: rgba(0,0,0,0.2);
                            min-width: 34px;
                            vertical-align: top;
                        }
                        .dnd-spell-group.mini {
                            min-width: 24px;
                            padding: 6px 3px 3px 3px;
                            margin-right: 5px;
                            margin-top: 6px;
                        }
                        .dnd-spell-level-label {
                            position: absolute;
                            top: -9px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: var(--dnd-bg-panel);
                            padding: 0 4px;
                            font-size: 10px;
                            color: var(--dnd-text-dim);
                            font-family: var(--dnd-font-serif);
                            line-height: 14px;
                        }
                        .dnd-spell-group.mini .dnd-spell-level-label {
                            top: -7px;
                            font-size: 8px;
                            line-height: 10px;
                            padding: 0 2px;
                        }
                        .dnd-spell-pips {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 3px;
                            justify-content: center;
                            max-width: 28px; /* Force wrapping for 4 items (2x2) */
                        }
                        .dnd-spell-group.mini .dnd-spell-pips {
                            gap: 2px;
                            max-width: 18px;
                        }
                        .dnd-spell-pip {
                            width: 10px;
                            height: 10px;
                            background: #222;
                            border: 1px solid #000;
                            box-shadow: inset 0 0 2px #000;
                            transition: all 0.2s;
                        }
                        .dnd-spell-group.mini .dnd-spell-pip {
                            width: 6px;
                            height: 6px;
                        }
                        .dnd-spell-pip.available {
                            background: linear-gradient(135deg, #3498db, #2980b9);
                            border-color: #5dade2;
                            box-shadow: 0 0 5px rgba(52, 152, 219, 0.6);
                        }
                    </style>
                `;
                $('head').append(style);
            }

            // 支持 JSON 和 "1级:3/4|2级:2/3" 格式
            const slots = DataManager.parseValue(slotsVal, 'resources');
            if (!slots) return '';

            // 罗马数字转换 helper
            const toRoman = (num) => {
                const map = {1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII', 8:'VIII', 9:'IX'};
                return map[num] || num;
            };

            let html = '<div style="display:flex;flex-wrap:wrap;">';
            
            // 按环阶排序 (1级, 2级...)
            Object.keys(slots).sort((a,b) => parseInt(a)-parseInt(b)).forEach(k => {
                const parts = slots[k].toString().split('/');
                const curr = parseInt(parts[0]) || 0;
                const max = parseInt(parts[1]) || 0;
                if (max === 0) return;

                const levelNum = parseInt(k) || k.replace('级','');
                const roman = toRoman(levelNum);
                
                let pipsHtml = '';
                for(let i=0; i<max; i++) {
                    const isAvail = i < curr;
                    pipsHtml += `<div class="dnd-spell-pip ${isAvail ? 'available' : ''}" title="${isAvail ? '可用' : '已消耗'}"></div>`;
                }
                
                html += `
                    <div class="dnd-spell-group ${isMini ? 'mini' : ''}" title="${k}法术位: ${curr}/${max}">
                        <div class="dnd-spell-level-label">${roman}</div>
                        <div class="dnd-spell-pips">${pipsHtml}</div>
                    </div>
                `;
            });
            
            html += '</div>';
            return html;
        } catch(e) {
            console.error('Spell slot format error:', e);
            return '<span style="color:#8a2c2c">资源解析错误</span>';
        }
    },

    // [新增] 显示法术书
    showSpellBook(event) {
        const spells = DataManager.getKnownSpells(); // 默认获取主角法术
        if (!spells) return;
        
        // 按环阶分组
        const byLevel = {};
        spells.forEach(s => {
            const level = s['环阶'] === '0' || s['环阶'] === 0 ? '戏法' : (s['环阶'] + '环');
            if (!byLevel[level]) byLevel[level] = [];
            byLevel[level].push(s);
        });
        
        let html = `<div style="font-weight:bold;color:#aab;border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:10px;">📖 法术书</div>`;
        
        // 搜索和筛选
        html += `
            <div style="display:flex;gap:5px;margin-bottom:10px;">
                <input type="text" id="dnd-spell-search" placeholder="搜索法术..." style="flex:1;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:4px 8px;border-radius:4px;font-size:12px;" oninput="window.DND_Dashboard_UI.filterSpells()">
                <select id="dnd-spell-filter" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:4px;border-radius:4px;font-size:12px;" onchange="window.DND_Dashboard_UI.filterSpells()">
                    <option value="">全部环阶</option>
                    ${Object.keys(byLevel).sort().map(l => `<option value="${l}">${l}</option>`).join('')}
                </select>
            </div>
        `;

        html += `<div style="max-height:300px;overflow-y:auto;" id="dnd-spell-list">`;
        
        Object.keys(byLevel).sort().forEach(lvl => {
            html += `<div class="dnd-spell-group-header" data-level="${lvl}" style="color:var(--dnd-text-highlight);font-size:12px;margin:8px 0 4px 0;border-bottom:1px dashed #444;">${lvl}</div>`;
            byLevel[lvl].forEach(s => {
                const isPrep = s['已准备'] === '是' || s['已准备'] === true || lvl === '戏法';
                const prepIcon = isPrep ? '✨' : '⚪';
                const safeName = (s['法术名称'] || '').replace(/'/g, "\\'");
                html += `
                    <div class="dnd-spell-item" data-name="${s['法术名称']}" data-level="${lvl}" style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;cursor:pointer;"
                        onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                        onmouseout="this.style.background='transparent'"
                        onclick="window.DND_Dashboard_UI.handleSpellClick('${safeName}', event)">
                        <span style="color:${isPrep ? '#e6dcca' : '#888'}">${prepIcon} ${s['法术名称']}</span>
                        <span style="color:#666;font-size:10px;">${s['施法时间']}</span>
                    </div>
                `;
            });
        });
        html += `</div>`;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [新增] 过滤法术列表
    filterSpells() {
        const { $ } = getCore();
        const searchText = $('#dnd-spell-search').val().toLowerCase();
        const filterLevel = $('#dnd-spell-filter').val();
        
        $('.dnd-spell-item').each(function() {
            const $el = $(this);
            const name = ($el.data('name') || '').toLowerCase();
            const level = $el.data('level') || '';
            
            const matchSearch = !searchText || name.includes(searchText);
            const matchFilter = !filterLevel || level === filterLevel;
            
            if (matchSearch && matchFilter) {
                $el.show();
            } else {
                $el.hide();
            }
        });
        
        // 隐藏空的分组标题
        $('.dnd-spell-group-header').each(function() {
            const lvl = $(this).data('level');
            // 检查该组下是否有可见的 spell item
            const hasVisible = $(`.dnd-spell-item[data-level="${lvl}"]:visible`).length > 0;
            if (hasVisible) $(this).show();
            else $(this).hide();
        });
    }
});

;// ./src/ui/modules/UIDice.js








/* harmony default export */ const UIDice = ({
    // [改进] 显示快速投掷面板 + 骰子池可视化
    showQuickDice(event) {
        // 获取骰子池数据
        const poolData = this.getDicePoolData();
        const poolCount = poolData ? poolData.length : 0;
        const poolStatus = poolCount >= 15 ? 'good' : (poolCount >= 6 ? 'warning' : 'low');
        const statusColor = poolStatus === 'good' ? 'var(--dnd-accent-green)' : (poolStatus === 'warning' ? '#e67e22' : 'var(--dnd-accent-red)');
        const statusText = poolStatus === 'good' ? '充足' : (poolStatus === 'warning' ? '适中' : '不足');
        
        let html = `
            <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <span>🎲 快速投掷</span>
                <span style="font-size:11px;color:${statusColor};background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:3px;">
                    池: ${poolCount} (${statusText})
                </span>
            </div>
            
            <!-- 骰子池可视化 -->
            <div style="background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;margin-bottom:12px;">
                <div style="font-size:11px;color:#888;margin-bottom:6px;display:flex;justify-content:space-between;">
                    <span>预投骰子池</span>
                    <span onclick="window.DND_Dashboard_UI.refreshDicePool()" style="cursor:pointer;color:var(--dnd-text-highlight);">🔄 补充</span>
                </div>
                <div style="display:flex;gap:3px;flex-wrap:wrap;max-height:60px;overflow-y:auto;">
                    ${poolData && poolData.length > 0 ? poolData.slice(0, 20).map((row, idx) => {
                        const d20 = row.D20 || row[7] || '?';
                        const isNat20 = d20 == 20;
                        const isNat1 = d20 == 1;
                        const bgColor = isNat20 ? 'var(--dnd-accent-green)' : (isNat1 ? 'var(--dnd-accent-red)' : 'rgba(255,255,255,0.1)');
                        const textColor = (isNat20 || isNat1) ? '#fff' : 'var(--dnd-text-main)';
                        return `<div title="D20:${d20} D12:${row.D12||row[6]||'?'} D10:${row.D10||row[5]||'?'}" 
                            style="width:22px;height:22px;background:${bgColor};border:1px solid #555;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:10px;color:${textColor};font-weight:bold;cursor:help;">
                            ${d20}
                        </div>`;
                    }).join('') : '<div style="color:#666;font-size:11px;">骰子池为空</div>'}
                </div>
                <div style="font-size:10px;color:#666;margin-top:4px;">显示 D20 值 (悬停查看其他骰子)</div>
            </div>
            
            <!-- 快速投掷按钮 -->
            <div class="dnd-dice-grid">
                ${[4,6,8,10,12,20].map(d => `
                    <button class="dnd-dice-btn" data-sides="${d}" onclick="window.DND_Dashboard_UI.rollDice(${d}, event)">
                        D${d}
                    </button>
                `).join('')}
            </div>
            
            <!-- D100 单独一行 -->
            <div style="margin-top:8px;">
                <button class="dnd-dice-btn" data-sides="100" style="
                    width:100%;
                    background:linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(155, 89, 182, 0.1));
                    border:1px solid #9b59b6;
                    color:#bb8fce;
                    padding:8px;
                    border-radius:4px;
                    cursor:pointer;
                    transition:all 0.2s;
                    font-size:12px;
                " onmouseover="this.style.background='rgba(155, 89, 182, 0.3)'" 
                onmouseout="this.style.background='linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(155, 89, 182, 0.1))'"
                onclick="window.DND_Dashboard_UI.rollDice(100, event)">
                    🎯 D100 (百分骰)
                </button>
            </div>
            
            <!-- 自定义投掷 -->
            <div class="dnd-dice-custom-area">
                <div style="font-size:11px;color:#888;margin-bottom:5px;">自定义投掷</div>
                <div class="dnd-dice-input-row">
                    <input type="text" id="dnd-custom-dice" placeholder="2d6+3" class="dnd-dice-input">
                    <button onclick="window.DND_Dashboard_UI.rollCustomDice()" class="dnd-dice-submit-btn">投掷</button>
                </div>
            </div>
        `;
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // 获取骰子池数据
    getDicePoolData() {
        const api = DataManager.getAPI();
        if (!api || !api.exportTableAsJson) return [];
        
        try {
            const rawData = api.exportTableAsJson();
            if (!rawData) return [];
            
            const dataObj = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
            
            // 寻找骰子池表
            const poolKey = Object.keys(dataObj).find(k => {
                const sheet = dataObj[k];
                return sheet.name && (sheet.name === '🎲 骰子池' || sheet.name.includes('骰子池'));
            });
            
            if (!poolKey) return [];
            
            const sheet = dataObj[poolKey];
            if (!sheet.content || sheet.content.length < 2) return [];
            
            // 解析为对象数组
            const headers = sheet.content[0];
            const rows = sheet.content.slice(1);
            
            return rows.map(row => {
                const obj = {};
                headers.forEach((h, i) => {
                    if (h) obj[h] = row[i];
                });
                // 同时保留数组索引访问
                row.forEach((v, i) => obj[i] = v);
                return obj;
            });
        } catch(e) {
            Logger.error('获取骰子池数据失败:', e);
            return [];
        }
    },

    // 手动刷新骰子池
    async refreshDicePool() {
        const { $, window: coreWin } = getCore();
        
        // 显示加载状态
        const $poolArea = $('#dnd-detail-popup-el').find('.dnd-dice-pool-visual');
        if ($poolArea.length) {
            $poolArea.html('<div style="text-align:center;color:#888;padding:10px;">🔄 补充中...</div>');
        }
        
        // 强制补充
        DiceManager.isRefilling = false; // 重置标志
        await DiceManager.checkAndRefill();
        
        // 关闭并重新打开面板以刷新显示
        setTimeout(() => {
            const pos = this._lastClickPos || { x: coreWin.innerWidth / 2, y: 100 };
            this.hideDetailPopup();
            this.showQuickDice({ clientX: pos.x, clientY: pos.y });
        }, 500);
    },

    // 投掷骰子并显示结果
    rollDice(sides, event) {
        const result = Math.floor(Math.random() * sides) + 1;
        const isNat20 = sides === 20 && result === 20;
        const isNat1 = sides === 20 && result === 1;
        
        let resultHtml = '';
        if (isNat20) {
            resultHtml = `<div style="text-align:center;padding:15px;">
                <div style="font-size:48px;color:var(--dnd-accent-green);text-shadow:0 0 20px rgba(46, 204, 113, 0.5);animation:dnd-pulse 0.5s ease-in-out;">✨ ${result} ✨</div>
                <div style="font-size:14px;color:var(--dnd-text-highlight);margin-top:5px;">大成功！NATURAL 20!</div>
            </div>`;
        } else if (isNat1) {
            resultHtml = `<div style="text-align:center;padding:15px;">
                <div style="font-size:48px;color:var(--dnd-accent-red);text-shadow:0 0 20px rgba(192, 57, 43, 0.5);">💀 ${result} 💀</div>
                <div style="font-size:14px;color:#e74c3c;margin-top:5px;">大失败... NATURAL 1</div>
            </div>`;
        } else {
            resultHtml = `<div style="text-align:center;padding:15px;">
                <div style="font-size:36px;color:var(--dnd-text-highlight);">🎲 ${result}</div>
                <div style="font-size:12px;color:#888;margin-top:5px;">D${sides} 投掷结果</div>
            </div>`;
        }
        
        // 更新弹窗内容而不是 alert
        const { $ } = getCore();
        const $popup = $('#dnd-detail-popup-el');
        if ($popup.length) {
            // 在现有内容前插入结果
            const $result = $(`<div class="dnd-roll-result" style="margin-bottom:10px;background:rgba(0,0,0,0.4);border-radius:6px;border:1px solid var(--dnd-border-gold);">${resultHtml}</div>`);
            
            // 移除之前的结果
            $popup.find('.dnd-roll-result').remove();
            
            // 在标题后插入
            $popup.find('> div').first().after($result);
            
            // 动画效果
            $result.css({ opacity: 0, transform: 'scale(0.8)' });
            setTimeout(() => {
                $result.css({ opacity: 1, transform: 'scale(1)', transition: 'all 0.3s ease-out' });
            }, 10);
        }
    },

    // 自定义骰子表达式投掷
    rollCustomDice() {
        const { $ } = getCore();
        const expr = $('#dnd-custom-dice').val().trim();
        if (!expr) return;
        
        try {
            // 解析表达式 (支持 2d6+3, 1d20-2, 3d8 等)
            const regex = /^(\d*)d(\d+)([+-]\d+)?$/i;
            const match = expr.match(regex);
            
            if (!match) {
                NotificationSystem.warning('格式错误，请使用如 2d6+3 的格式');
                return;
            }
            
            const count = parseInt(match[1]) || 1;
            const sides = parseInt(match[2]);
            const modifier = parseInt(match[3]) || 0;
            
            if (count > 20 || sides > 100) {
                NotificationSystem.warning('骰子数量不能超过20，面数不能超过100');
                return;
            }
            
            // 投掷
            const rolls = [];
            let total = 0;
            for (let i = 0; i < count; i++) {
                const r = Math.floor(Math.random() * sides) + 1;
                rolls.push(r);
                total += r;
            }
            total += modifier;
            
            const rollsStr = rolls.join(' + ');
            const modStr = modifier > 0 ? ` + ${modifier}` : (modifier < 0 ? ` - ${Math.abs(modifier)}` : '');
            
            const resultHtml = `<div style="text-align:center;padding:15px;">
                <div style="font-size:32px;color:var(--dnd-text-highlight);">🎲 ${total}</div>
                <div style="font-size:11px;color:#888;margin-top:5px;">${expr.toUpperCase()}: (${rollsStr})${modStr}</div>
            </div>`;
            
            const $popup = $('#dnd-detail-popup-el');
            if ($popup.length) {
                $popup.find('.dnd-roll-result').remove();
                const $result = $(`<div class="dnd-roll-result" style="margin-bottom:10px;background:rgba(0,0,0,0.4);border-radius:6px;border:1px solid var(--dnd-border-gold);">${resultHtml}</div>`);
                $popup.find('> div').first().after($result);
                $result.css({ opacity: 0, transform: 'scale(0.8)' });
                setTimeout(() => {
                    $result.css({ opacity: 1, transform: 'scale(1)', transition: 'all 0.3s ease-out' });
                }, 10);
            }
        } catch(e) {
            NotificationSystem.error('投掷失败: ' + e.message);
        }
    },

    // ==========================================
    // 快捷栏 (Quick Bar) 逻辑
    // ==========================================
    quickBarState: false, // hidden
    _quickBarCloseHandler: null,

    toggleQuickBar(forceState = null) {
        const { $ } = getCore();
        
        if (forceState !== null) {
            this.quickBarState = forceState;
        } else {
            this.quickBarState = !this.quickBarState;
        }
        
        const $bar = $('#dnd-quick-bar');
        const $trigger = $('#dnd-quick-trigger');
        
        if (this.quickBarState) {
            $bar.addClass('visible');
            $trigger.text('◀'); // Visible: Show Left Arrow to Collapse
        } else {
            $bar.removeClass('visible');
            $trigger.text('▶'); // Hidden: Show Right Arrow to Expand
        }
    },

    async renderQuickBar(providedSlots = null) {
        const { $ } = getCore();
        const $bar = $('#dnd-quick-bar');
        if (!$bar.length) return;
        
        // 渲染函数
        const render = (currentSlots) => {
            if (!currentSlots) currentSlots = [];
            Logger.debug('Rendering quick bar with items:', currentSlots.length);
            
            let html = '';
            currentSlots.forEach((slot, index) => {
                const name = slot.data.name || '???';
                // Change display to show first 4 chars of text name instead of icon
                const shortName = name.substring(0, 4);
                
                html += `
                    <div class="dnd-quick-slot dnd-hover-lift" title="${name}" onclick="window.DND_Dashboard_UI.executeQuickSlot(${index})">
                        ${shortName}
                        <div class="dnd-quick-slot-remove" onclick="event.stopPropagation(); window.DND_Dashboard_UI.removeQuickSlot(${index})">✕</div>
                    </div>
                `;
            });
            // 添加按钮 (强制显示)
            html += `
                <div class="dnd-quick-slot add-btn dnd-clickable" title="添加快捷方式" onclick="window.DND_Dashboard_UI.showQuickSlotSelector()">
                    +
                </div>
            `;
            $bar.html(html);
            
            // Trigger is separate
        };
        
        // 如果提供了数据，直接渲染并返回
        if (providedSlots) {
            render(providedSlots);
            return;
        }
        
        // 1. 立即渲染缓存（如果存在）或空状态
        render(this._cachedQuickSlots || []);
        
        // 2. 异步加载数据并更新
        try {
            const saved = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.QUICK_SLOTS);
            let slots = [];
            if (saved) slots = typeof saved === 'string' ? JSON.parse(saved) : saved;
            
            this._cachedQuickSlots = slots; // Cache it
            render(slots);
        } catch(e) {
            Logger.error('Quick slots load error', e);
        }
    },

    showQuickSlotSelector() {
        const { $ } = getCore();
        
        // 获取数据
        const items = DataManager.getTable('ITEM_Inventory') || [];
        // 获取当前操控角色 ID
        const char = this.getControlledCharacter();
        const charId = char ? (char['PC_ID'] || char['CHAR_ID'] || char['姓名']) : null;
        
        // [修复] 过滤掉法术，避免在技能栏重复显示
        const allSkills = charId ? DataManager.getCharacterSkills(charId) : [];
        const skills = allSkills.filter(s => s['技能类型'] !== '法术');
        
        const spells = charId ? DataManager.getKnownSpells(charId) : [];
        
        // 辅助转义函数 (解决 HTML 属性中的引号问题)
        const esc = (str) => {
            if (str === null || str === undefined) return '';
            return String(str).replace(/'/g, "\\'").replace(/"/g, '"');
        };
        
        // 构建 HTML
        const html = `
            <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:10px;margin-bottom:15px;text-align:center;">
                添加快捷方式
            </div>
            
            <div style="display:flex;gap:10px;margin-bottom:15px;border-bottom:1px solid rgba(255,255,255,0.1);">
                <div class="dnd-tab-btn active" data-tab="items" onclick="window.DND_Dashboard_UI.switchQuickTab('items')" style="padding:8px 15px;cursor:pointer;border-bottom:2px solid var(--dnd-border-gold);">🎒 物品</div>
                <div class="dnd-tab-btn" data-tab="skills" onclick="window.DND_Dashboard_UI.switchQuickTab('skills')" style="padding:8px 15px;cursor:pointer;border-bottom:2px solid transparent;color:#888;">✨ 技能</div>
                <div class="dnd-tab-btn" data-tab="spells" onclick="window.DND_Dashboard_UI.switchQuickTab('spells')" style="padding:8px 15px;cursor:pointer;border-bottom:2px solid transparent;color:#888;">📜 法书</div>
            </div>
            
            <div id="dnd-quick-tab-items" class="dnd-quick-tab-content" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;">
                ${items.map(i => {
                    const name = i['物品名称'];
                    const id = i['物品ID'] || name;
                    // 使用 data 属性传递数据，避免 HTML 生成错误
                    return `<div class="dnd-clickable" style="padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;"
                            data-type="item" data-name="${esc(name)}" data-id="${esc(id)}" data-icon="🎒" data-level=""
                            onclick="window.DND_Dashboard_UI.handleAddClick(this)">${name}</div>`;
                }).join('') || '<div style="text-align:center;color:#666">无物品</div>'}
            </div>
            
            <div id="dnd-quick-tab-skills" class="dnd-quick-tab-content" style="max-height:300px;overflow-y:auto;display:none;flex-direction:column;gap:5px;">
                ${skills.map(s => {
                    const name = s['技能名称'];
                    const level = s['环阶'] || s['等级'] || '';
                    const levelLabel = (level && level !== '0' && level !== '戏法') ? `(${level}环)` : '';
                    
                    return `<div class="dnd-clickable" style="padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;"
                            data-type="skill" data-name="${esc(name)}" data-id="" data-icon="✨" data-level="${esc(level)}"
                            onclick="window.DND_Dashboard_UI.handleAddClick(this)">
                            <span>${name}</span> <span style="font-size:11px;color:#888;">${levelLabel}</span>
                            </div>`;
                }).join('') || '<div style="text-align:center;color:#666">无技能</div>'}
            </div>
            
            <div id="dnd-quick-tab-spells" class="dnd-quick-tab-content" style="max-height:300px;overflow-y:auto;display:none;flex-direction:column;gap:5px;">
                ${spells.map(s => {
                    const name = s['法术名称'];
                    const level = s['环阶'] === '0' || s['环阶'] === 0 ? '戏法' : (s['环阶']+'环');
                    return `<div class="dnd-clickable" style="padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;"
                            data-type="skill" data-name="${esc(name)}" data-id="" data-icon="📜" data-level="${esc(s['环阶'])}"
                            onclick="window.DND_Dashboard_UI.handleAddClick(this)">
                            <span>${name}</span><span style="color:#888;font-size:11px;">${level}</span>
                            </div>`;
                }).join('') || '<div style="text-align:center;color:#666">无法术</div>'}
            </div>
        `;
        
        const { window: coreWin } = getCore();
        const winW = coreWin.innerWidth || $(coreWin).width();
        const winH = coreWin.innerHeight || $(coreWin).height();
        this.showItemDetailPopup(html, winW/2 - 150, winH/2 - 200);
    },

    switchQuickTab(tabName) {
        const { $ } = getCore();
        $('.dnd-tab-btn').css({borderBottomColor:'transparent', color:'#888'}).removeClass('active');
        $(`.dnd-tab-btn[data-tab="${tabName}"]`).css({borderBottomColor:'var(--dnd-border-gold)', color:'#fff'}).addClass('active');
        
        $('.dnd-quick-tab-content').hide();
        $(`#dnd-quick-tab-${tabName}`).css('display', 'flex');
    },

    // [新增] 处理添加点击 (从 data 属性读取)
    handleAddClick(el) {
        const { $ } = getCore();
        const $el = $(el);
        Logger.info('handleAddClick triggered for:', $el.data('name'));
        this.addQuickSlot(
            $el.data('type'),
            $el.data('name'),
            $el.data('id'),
            $el.data('icon'),
            $el.data('level')
        );
    },

    async addQuickSlot(type, name, id, icon, level) {
        name = name || '未命名';
        id = String(id || '');
        icon = icon || '❓';
        level = String(level || '');

        const data = { name, id, icon, level };
        Logger.info('[DND Dashboard] Adding quick slot:', type, data);
        
        let slots = [];
        // 优先使用缓存
        if (this._cachedQuickSlots) {
            slots = [...this._cachedQuickSlots];
        } else {
            try {
                const saved = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.QUICK_SLOTS);
                if (saved) slots = typeof saved === 'string' ? JSON.parse(saved) : saved;
            } catch(e) { Logger.error('Load Error:', e); }
        }
        
        slots.push({ type, data });
        
        // 1. 立即更新缓存和UI (乐观更新)
        this._cachedQuickSlots = slots;
        this.renderQuickBar(slots);
        this.hideDetailPopup();
        
        // 2. 后台保存
        safeSave(CONFIG.STORAGE_KEYS.QUICK_SLOTS, JSON.stringify(slots))
            .then(() => Logger.info('Quick slots saved async'))
            .catch(err => {
                Logger.error('Save failed:', err);
                NotificationSystem.error('保存失败，请检查数据库连接');
            });

        // 反馈提示
        const { $ } = getCore();
        const $hud = $('#dnd-mini-hud');
        const $toast = $('<div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(46, 204, 113, 0.9);color:white;padding:5px 10px;border-radius:4px;font-size:12px;z-index:9999;">已添加</div>');
        $hud.append($toast);
        setTimeout(() => $toast.fadeOut(500, () => $toast.remove()), 1000);
    },

    async removeQuickSlot(index) {
        const confirmed = await NotificationSystem.confirm('确定要移除此快捷方式吗？', {
            title: '移除快捷方式',
            confirmText: '移除',
            type: 'danger'
        });
        if (!confirmed) return;
        
        let slots = this._cachedQuickSlots || [];
        // 如果缓存为空，尝试读取
        if (slots.length === 0) {
            try {
                const saved = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.QUICK_SLOTS);
                if (saved) slots = typeof saved === 'string' ? JSON.parse(saved) : saved;
            } catch(e) {}
        }
        
        slots.splice(index, 1);
        
        // 乐观更新
        this._cachedQuickSlots = slots;
        this.renderQuickBar(slots);
        
        // 后台保存
        safeSave(CONFIG.STORAGE_KEYS.QUICK_SLOTS, JSON.stringify(slots));
    },

    executeQuickSlot(index) {
        // 需要重新获取 slot 数据
        DBAdapter.getSetting(CONFIG.STORAGE_KEYS.QUICK_SLOTS).then(saved => {
            if (!saved) return;
            const slots = typeof saved === 'string' ? JSON.parse(saved) : saved;
            const slot = slots[index];
            if (!slot) return;
            
            if (slot.type === 'item') {
                const text = `我使用了 ${slot.data.name}`;
                this.fillChatInput(text);
            } else if (slot.type === 'skill' || slot.type === 'spell') {
                const baseLevel = slot.data.level;
                // 检查是否有等级且大于0
                const lvlNum = parseInt(baseLevel);
                const hasLevel = !isNaN(lvlNum) && lvlNum > 0 && baseLevel !== '戏法' && baseLevel !== '0';
                
                if (!hasLevel) {
                    const action = slot.type === 'spell' ? '施放了戏法' : '使用了技能';
                    this.fillChatInput(`我${action}：${slot.data.name}`);
                } else {
                    // 升环/等级选择
                    const { $, window: coreWin } = getCore();
                    const winW = coreWin.innerWidth || $(coreWin).width();
                    const winH = coreWin.innerHeight || $(coreWin).height();
                    
                    const isSpell = slot.type === 'spell';
                    const title = isSpell ? `✨ 选择施法环阶 (${slot.data.name})` : `✨ 选择技能等级 (${slot.data.name})`;
                    
                    let html = `<div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:10px;text-align:center;">${title}</div>`;
                    html += `<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;">`;
                    
                    // Ensure spell/skill level selection starts from base level
                    const start = lvlNum || 1;
                    
                    // 获取最高法术位 (仅针对法术)
                    let limit = 9;
                    if (isSpell) {
                        const party = DataManager.getPartyData();
                        const pc = party.find(p => p.type === 'PC' || p.isPC) || party[0];
                        const maxSlot = DataManager.getMaxSpellSlotLevel(pc);
                        if (maxSlot > 0) limit = maxSlot;
                        limit = Math.max(start, limit);
                    }

                    for (let i = start; i <= limit; i++) {
                        const chatText = isSpell
                            ? `我使用 ${i} 环法术位施放了 ${slot.data.name}`
                            : `我以 ${i} 级使用了技能：${slot.data.name}`;
                            
                        html += `
                            <button class="dnd-clickable" style="background:rgba(255,255,255,0.05);border:1px solid #555;color:#ccc;padding:8px;border-radius:4px;cursor:pointer;font-weight:bold;"
                                onclick="window.DND_Dashboard_UI.fillChatInput('${chatText}'); window.DND_Dashboard_UI.hideDetailPopup();">
                                ${i} ${isSpell ? '环' : '级'}
                            </button>
                        `;
                    }
                    html += `</div>`;
                    
                    this.showItemDetailPopup(html, winW/2 - 100, winH/2 - 100);
                }
            }
        });
    }
});

;// ./src/ui/UIRenderer.js
// src/ui/UIRenderer.js













const UIRenderer = Object.assign({},
    UIUtils,
    UICore,
    UIHUD,
    UIPanels,
    UISettings,
    UICharacter,
    UIItems,
    UICombat,
    UIMap,
    UISpells,
    UIDice
);

// Make UIRenderer globally available as expected by onclick handlers in generated HTML
try {
    const { window: globalWin } = getCore();
    if (globalWin) {
        console.log('[DND Dashboard] Exposing UIRenderer to global window (Module Scope)');
        globalWin.DND_Dashboard_UI = UIRenderer;
    } else {
        console.warn('[DND Dashboard] globalWin not found, using local window');
        window.DND_Dashboard_UI = UIRenderer;
    }
} catch (e) {
    console.error('[DND Dashboard] Failed to expose UIRenderer:', e);
}

;// ./src/index.js
// src/index.js












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
                
                // [新增] 全局点击动效绑定
                $(document).on('mousedown', '.dnd-clickable, .dnd-btn, button, .dnd-nav-item, .dnd-char-card, .dnd-item-card, .dnd-mini-char', function() {
                    const $el = $(this);
                    $el.removeClass('dnd-clicking'); // 重置
                    void $el[0].offsetWidth; // 强制重绘
                    $el.addClass('dnd-clicking');
                }).on('animationend', '.dnd-clicking', function() {
                    $(this).removeClass('dnd-clicking');
                });

                UIRenderer.init();
                ThemeManager.init(); // [修复] 初始化主题
                
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

/******/ })()
;