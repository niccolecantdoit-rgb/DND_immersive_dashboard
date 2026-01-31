// src/core/Utils.js
import { DBAdapter } from './DBAdapter.js';

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
