// src/core/Utils.js
import { DBAdapter } from './DBAdapter.js';
import { TavernSettingsSync } from './TavernSettingsSync.js';

export const getCore = () => {
    try {
        let topWin = null;
        try {
            topWin = window.top && window.top !== window ? window.top : null;
        } catch (e) {
            topWin = null;
        }

        const w = topWin || window.parent || window;
        const localJQuery = window.jQuery;
        const parentJQuery = window.parent?.jQuery;
        const topJQuery = topWin?.jQuery;
        const coreJQuery = w.jQuery;
        const $ = coreJQuery || topJQuery || parentJQuery || localJQuery;
        const getDB = () => {
            try {
                return window.AutoCardUpdaterAPI
                    || w.AutoCardUpdaterAPI
                    || (window.top && window.top.AutoCardUpdaterAPI)
                    || null;
            } catch (e) {
                return window.AutoCardUpdaterAPI || w.AutoCardUpdaterAPI || null;
            }
        };
        
        return {
            window: w,
            $: $,
            getDB
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
