// src/core/SettingsManager.js
import { DBAdapter } from './DBAdapter.js';
import { Logger } from './Logger.js';
import { safeSave } from './Utils.js';

export const SettingsManager = {
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
