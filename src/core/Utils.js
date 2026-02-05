// src/core/Utils.js
import { DBAdapter } from './DBAdapter.js';
import { TavernSettingsSync } from './TavernSettingsSync.js';

export const getCore = () => {
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

export const safeSave = async (key, val) => {
    // 优先使用同步模块
    await TavernSettingsSync.setSetting(key, val);
};
