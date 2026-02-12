// src/core/TavernSettingsSync.js
import { DBAdapter } from './DBAdapter.js';
import { Logger } from './Logger.js';

export const TavernSettingsSync = {
    EXTENSION_NAME: 'dnd_dashboard',
    SYNC_QUEUE_KEY: 'dnd_sync_queue',
    
    _tavernAvailable: null,
    _previousState: null, // Used to detect state changes
    _syncInterval: null,
    _notifyCallback: null, // Notification callback
    
    /**
     * Set notification callback function
     * @param {Function} callback - (type, message, title) => void
     */
    setNotifyCallback: function(callback) {
        this._notifyCallback = callback;
    },
    
    /**
     * Internal notification method
     */
    _notify: function(type, message, title = '') {
        // 抑制频繁的连接通知，仅错误和重要状态变更时通知
        if (type === 'info' && (title.includes('云同步') || title.includes('同步中'))) {
            Logger.info(`[TavernSettingsSync] (Silent) ${type}: ${title} - ${message}`);
            return;
        }

        if (this._notifyCallback) {
            this._notifyCallback(type, message, title);
        }
        Logger.info(`[TavernSettingsSync] ${type}: ${title} - ${message}`);
    },
    
    /**
     * Initialize - Check Tavern environment, start sync
     */
    init: async function() {
        // Prevent re-initialization
        if (this._syncInterval) clearInterval(this._syncInterval);

        this._tavernAvailable = this._checkTavernAvailable();
        this._previousState = this._tavernAvailable;
        
        // Initial notification
        if (this._tavernAvailable) {
            // Silently sync on init to avoid popup spam
            Logger.info('[TavernSettingsSync] ☁️ 云同步已启用');
            
            // Process pending sync queue
            try {
                const queue = await this._getSyncQueue();
                const pendingCount = Object.keys(queue).length;
                if (pendingCount > 0) {
                    // Only notify if there is actual work to do
                    this._notify('info', `正在同步 ${pendingCount} 项本地更改...`, '<i class="fa-solid fa-sync fa-spin"></i> 同步中');
                    await this._processSyncQueue();
                }
            } catch (e) {
                Logger.error('[TavernSettingsSync] Initial sync failed:', e);
            }
        } else {
            this._notify('warning', '数据仅保存在本地，连接酒馆后将自动同步', '<i class="fa-solid fa-ban"></i> 离线模式');
        }
        
        // Start background check
        this._syncInterval = setInterval(() => this._backgroundCheck(), 30000);
        
        return this._tavernAvailable;
    },
    
    /**
     * Background check - Detect connection state changes
     */
    _backgroundCheck: async function() {
        const currentState = this._checkTavernAvailable();
        
        // State change detection
        if (currentState !== this._previousState) {
            if (currentState && !this._previousState) {
                // Recovered from offline to online
                this._notify('success', '正在同步本地更改...', '🔗 已重新连接酒馆');
                await this._processSyncQueue();
            } else if (!currentState && this._previousState) {
                // Changed from online to offline
                this._notify('warning', '数据将暂存本地，恢复连接后自动同步', '<i class="fa-solid fa-ban"></i> 酒馆连接已断开');
            }
            this._previousState = currentState;
        }
        
        this._tavernAvailable = currentState;
        
        // If online, try to process queue (in case previous attempts failed)
        if (currentState) {
            await this._processSyncQueue();
        }
    },
    
    /**
     * Check if Tavern extension_settings is available
     */
    _checkTavernAvailable: function() {
        try {
            const win = window.parent || window;
            // Check for SillyTavern object and getContext method
            if (win.SillyTavern && typeof win.SillyTavern.getContext === 'function') {
                const ctx = win.SillyTavern.getContext();
                return !!(ctx && ctx.extensionSettings);
            }
            // Fallback check for global extension_settings (older versions might expose it differently)
            // But relying on getContext is safer for modern ST
            return false;
        } catch(e) {
            return false;
        }
    },
    
    /**
     * Get reference to Tavern's extension_settings
     */
    _getExtensionSettings: function() {
        try {
            const win = window.parent || window;
            if (!win.SillyTavern?.getContext) return null;
            
            const ctx = win.SillyTavern.getContext();
            if (!ctx?.extensionSettings) return null;
            
            // Ensure our namespace exists
            if (!ctx.extensionSettings[this.EXTENSION_NAME]) {
                ctx.extensionSettings[this.EXTENSION_NAME] = {};
            }
            return ctx.extensionSettings[this.EXTENSION_NAME];
        } catch (e) {
            Logger.warn('[TavernSettingsSync] Failed to get extension settings:', e);
            return null;
        }
    },

    // ========== Chat Metadata Support ==========

    /**
     * Get chat metadata
     */
    _getChatMetadata: function() {
        try {
            const win = window.parent || window;
            // Try global variable first (common in ST)
            if (win.chat_metadata) return win.chat_metadata;
            
            // Try context
            if (win.SillyTavern?.getContext) {
                const ctx = win.SillyTavern.getContext();
                if (ctx.chatMetadata) return ctx.chatMetadata;
            }
            return null;
        } catch (e) { return null; }
    },

    /**
     * Save chat metadata
     */
    _saveChatMetadata: async function() {
        try {
            const win = window.parent || window;
            if (typeof win.saveChatDebounced === 'function') {
                win.saveChatDebounced();
                return true;
            }
            // Try context
            if (win.SillyTavern?.getContext) {
                const ctx = win.SillyTavern.getContext();
                if (typeof ctx.saveChatDebounced === 'function') {
                    ctx.saveChatDebounced();
                    return true;
                }
            }
            return false;
        } catch (e) { return false; }
    },

    /**
     * Save to chat metadata (Public)
     */
    saveToChat: async function(key, value) {
        try {
            const meta = this._getChatMetadata();
            if (meta) {
                if (!meta.extensions) meta.extensions = {};
                if (!meta.extensions[this.EXTENSION_NAME]) meta.extensions[this.EXTENSION_NAME] = {};
                
                meta.extensions[this.EXTENSION_NAME][key] = value;
                return await this._saveChatMetadata();
            }
        } catch (e) {
            Logger.warn('[TavernSettingsSync] Save to chat failed:', e);
        }
        return false;
    },

    /**
     * Get from chat metadata (Public)
     */
    getFromChat: function(key) {
        try {
            const meta = this._getChatMetadata();
            if (meta?.extensions?.[this.EXTENSION_NAME]) {
                return meta.extensions[this.EXTENSION_NAME][key];
            }
        } catch (e) {}
        return undefined;
    },

    /**
     * Delete from chat metadata (Public)
     */
    deleteFromChat: async function(key) {
        try {
            const meta = this._getChatMetadata();
            if (meta?.extensions?.[this.EXTENSION_NAME]) {
                delete meta.extensions[this.EXTENSION_NAME][key];
                return await this._saveChatMetadata();
            }
        } catch (e) {}
        return false;
    },
    
    /**
     * Public API to sync arbitrary data to Tavern extension_settings
     * (Used for avatars and maps from DBAdapter)
     */
    syncToTavern: async function(key, value) {
        // If offline, queue it
        if (!this._tavernAvailable) {
            await this._addToSyncQueue(key, value);
            return false;
        }

        try {
            const settings = this._getExtensionSettings();
            if (settings) {
                settings[key] = value;
                const saved = await this._saveTavernSettings();
                if (saved) {
                    await this._removeFromSyncQueue(key);
                    return true;
                }
            }
        } catch(e) {
            Logger.warn('[TavernSettingsSync] Sync to tavern failed:', e);
        }
        
        // If failed, queue it
        await this._addToSyncQueue(key, value);
        return false;
    },

    /**
     * Trigger Tavern save
     */
    _saveTavernSettings: async function() {
        try {
            const win = window.parent || window;
            if (!win.SillyTavern?.getContext) return false;
            
            const ctx = win.SillyTavern.getContext();
            const saveDebounced = ctx.saveSettingsDebounced;
            
            if (typeof saveDebounced === 'function') {
                saveDebounced();
                return true;
            }
            return false;
        } catch (e) {
            Logger.warn('[TavernSettingsSync] Failed to save Tavern settings:', e);
            return false;
        }
    },
    
    // ========== Core API ==========
    
    /**
     * Read setting - Prefer Tavern, fallback to IndexedDB
     */
    getSetting: async function(key, defaultValue = null) {
        // 1. Try reading from Tavern
        if (this._tavernAvailable) {
            const settings = this._getExtensionSettings();
            if (settings && settings[key] !== undefined) {
                // Sync to IndexedDB as backup
                try {
                    const localVal = await DBAdapter.getSetting(key);
                    if (JSON.stringify(localVal) !== JSON.stringify(settings[key])) {
                        await DBAdapter.setSetting(key, settings[key]);
                    }
                } catch (e) {
                    // Ignore compare errors, just write
                    await DBAdapter.setSetting(key, settings[key]);
                }
                return settings[key];
            }
        }
        
        // 2. Read from IndexedDB
        const localValue = await DBAdapter.getSetting(key);
        if (localValue !== null && localValue !== undefined) {
            return localValue;
        }
        
        return defaultValue;
    },
    
    /**
     * Save setting - Write to both Tavern and IndexedDB
     */
    setSetting: async function(key, value) {
        // 1. Immediately save to IndexedDB (Ensure no data loss)
        await DBAdapter.setSetting(key, value);
        
        // 2. Try saving to Tavern
        if (this._tavernAvailable) {
            try {
                const settings = this._getExtensionSettings();
                if (settings) {
                    settings[key] = value;
                    const saved = await this._saveTavernSettings();
                    if (saved) {
                        // Success, remove from sync queue if it was there
                        await this._removeFromSyncQueue(key);
                        return true;
                    }
                }
            } catch(e) {
                Logger.warn('[TavernSettingsSync] Tavern save failed:', e);
            }
            
            // Tavern save failed or threw error, add to sync queue
            await this._addToSyncQueue(key, value);
        } else {
             // Offline, add to sync queue
             await this._addToSyncQueue(key, value);
        }
        
        return false; // Return false means only saved locally or queued
    },
    
    // ========== Sync Queue Management ==========
    
    _addToSyncQueue: async function(key, value) {
        try {
            let queue = await this._getSyncQueue();
            queue[key] = { value, timestamp: Date.now() };
            await DBAdapter.setSetting(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
        } catch (e) {
            Logger.error('[TavernSettingsSync] Failed to add to sync queue:', e);
        }
    },
    
    _removeFromSyncQueue: async function(key) {
        try {
            let queue = await this._getSyncQueue();
            if (queue[key]) {
                delete queue[key];
                await DBAdapter.setSetting(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
            }
        } catch (e) {
            Logger.error('[TavernSettingsSync] Failed to remove from sync queue:', e);
        }
    },
    
    _getSyncQueue: async function() {
        try {
            const raw = await DBAdapter.getSetting(this.SYNC_QUEUE_KEY);
            if (!raw) return {};
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch(e) { 
            return {}; 
        }
    },
    
    _processSyncQueue: async function() {
        if (!this._tavernAvailable) return;
        
        const queue = await this._getSyncQueue();
        const keys = Object.keys(queue);
        if (keys.length === 0) return;
        
        Logger.info(`[TavernSettingsSync] Processing ${keys.length} pending items...`);
        
        let successCount = 0;
        
        try {
            const settings = this._getExtensionSettings();
            if (!settings) throw new Error('Extension settings not accessible');

            for (const key of keys) {
                const { value } = queue[key];
                settings[key] = value;
                successCount++;
            }
            
            const saved = await this._saveTavernSettings();
            if (saved) {
                await DBAdapter.setSetting(this.SYNC_QUEUE_KEY, '{}');
                this._notify('success', `${successCount} 项设置已同步到酒馆`, '<i class="fa-solid fa-check-circle"></i> 同步完成');
            } else {
                 Logger.warn('[TavernSettingsSync] Save triggered but returned false');
            }
        } catch(e) {
            Logger.error('[TavernSettingsSync] Sync processing failed:', e);
            this._notify('error', '请检查网络连接', '<i class="fa-solid fa-times-circle"></i> 同步失败');
        }
    },
    
    /**
     * Manual sync trigger
     */
    forceSync: async function() {
        this._tavernAvailable = this._checkTavernAvailable();
        if (this._tavernAvailable) {
            await this._processSyncQueue();
            return true;
        }
        return false;
    },
    
    /**
     * Get current status (for UI)
     */
    getStatus: async function() {
        const queue = await this._getSyncQueue();
        const pendingCount = Object.keys(queue).length;
        
        return {
            connected: this._tavernAvailable,
            pendingSync: pendingCount,
            statusText: this._tavernAvailable
                ? (pendingCount > 0 ? `<i class="fa-solid fa-cloud"></i> 在线 (${pendingCount} 待同步)` : '<i class="fa-solid fa-cloud"></i> 在线同步')
                : '<i class="fa-solid fa-ban"></i> 离线模式',
            statusClass: this._tavernAvailable 
                ? (pendingCount > 0 ? 'warning' : 'success')
                : 'warning'
        };
    }
};
