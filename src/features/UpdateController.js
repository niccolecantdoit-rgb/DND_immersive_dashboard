// src/features/UpdateController.js
import { UIRenderer } from '../ui/UIRenderer.js';
import { DiceManager } from '../data/DiceManager.js';
import { getCore } from '../core/Utils.js';

// [新增] 防回弹控制器 (参考自兼容性可视化表格 v9.0)
export const UpdateController = {
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
