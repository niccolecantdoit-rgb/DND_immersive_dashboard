// src/features/PresetSwitcher.js
import { Logger } from '../core/Logger.js';
import { getCore } from '../core/Utils.js';
import { CONFIG } from '../config/Config.js';
import { UIRenderer } from '../ui/UIRenderer.js';

export const PresetSwitcher = {
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
        
        const icon = isCombat ? '<i class="fa-solid fa-gavel"></i>' : '<i class="fa-solid fa-compass"></i>';
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
