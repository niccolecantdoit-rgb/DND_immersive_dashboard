// src/core/SettingsManager.js
import { TavernSettingsSync } from './TavernSettingsSync.js';
import { Logger } from './Logger.js';

export const SettingsManager = {
    // 初始化（在插件启动时调用）
    init: async () => {
        await TavernSettingsSync.init();
    },
    
    getAPIConfig: async () => {
        // 使用新的混合存储
        // 注意：TavernSettingsSync 不再自动添加前缀，需传入完整 Key
        let saved = await TavernSettingsSync.getSetting('dnd_global_api_config', null);

        // [兼容性] 如果新存储为空，尝试读取旧 Key (Legacy)
        if (!saved) {
            try {
                const legacy = localStorage.getItem('dnd_creator_api_config');
                if (legacy) saved = legacy;
            } catch(e) {}
        }

        let parsed = saved;
        
        // 解析字符串
        if (typeof saved === 'string') {
            try {
                parsed = JSON.parse(saved);
            } catch (e) {
                Logger.warn('[SettingsManager] JSON parse failed, using raw value');
            }
        }

        // 防御性检查：防止双重序列化
        if (typeof parsed === 'string') {
            try {
                const doubleParsed = JSON.parse(parsed);
                if (doubleParsed && typeof doubleParsed === 'object') {
                    parsed = doubleParsed;
                }
            } catch(e) {}
        }

        if (!parsed || typeof parsed !== 'object') {
            parsed = {};
        }

        return {
            url: parsed.url || '',
            key: parsed.key || '',
            model: parsed.model || '',
            provider: parsed.provider || 'plugin'
        };
    },

    setAPIConfig: async (config) => {
        Logger.info('[SettingsManager] Saving API Config:', config);
        await TavernSettingsSync.setSetting('dnd_global_api_config', config);
    },

    getAISettings: async () => {
        const apiConfig = await SettingsManager.getAPIConfig();
        return {
            provider: apiConfig.provider || 'plugin',
            apiConfig
        };
    },
    
    // 获取同步状态（用于设置面板显示）
    getSyncStatus: async () => {
        return await TavernSettingsSync.getStatus();
    },
    
    // 手动触发同步
    forceSync: async () => {
        return await TavernSettingsSync.forceSync();
    }
};
