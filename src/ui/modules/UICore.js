import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { CONFIG } from '../../config/Config.js';
import { DBAdapter } from '../../core/DBAdapter.js';
import { DataManager } from '../../data/DataManager.js';
import { ThemeManager } from '../../features/ThemeManager.js';
import { PresetSwitcher } from '../../features/PresetSwitcher.js';
import { NotificationSystem } from './UIUtils.js';
import { DynamicBackground } from '../DynamicBackground.js';
import { UITableManager } from './UITableManager.js';

export default {
    state: 'collapsed', // 'collapsed', 'mini', 'full'
    _lastToggleTime: 0, // 用于防止重复触发
    _controlledCharId: null, // [新增] 当前操控的角色ID，null表示默认PC
    _dynamicBgIds: {}, // [新增] 动态背景效果实例ID存储

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

    // [新增] 应用 UI 缩放
    applyUIScale(scale) {
        const { $ } = getCore();
        const s = parseFloat(scale) || 1.0;
        
        // 设置 CSS 变量 (供 CSS 引用)
        document.documentElement.style.setProperty('--dnd-ui-scale', s);

        // 使用样式注入确保覆盖所有相关元素 (包括动态生成的)
        if ($('#dnd-scale-style').length === 0) {
            $('head').append(`<style id="dnd-scale-style"></style>`);
        }
        
        // A. 悬浮元素：直接缩放
        const floatingSelectors = [
            '#dnd-mini-hud',
            '#dnd-toggle-btn',
            '#dnd-tooltip',
            '#dnd-position-dialog',
            '.dnd-generic-popup'
        ];

        // B. 全屏容器：缩放并补偿尺寸，确保始终填满屏幕
        const fullscreenSelectors = [
            '#dnd-dashboard-root'
        ];

        // 计算反向比例 (例如放大1.2倍，宽度需要设为 100/1.2 = 83.333% 才能在放大后刚好填满)
        const reverseScale = (100 / s).toFixed(4);

        $('#dnd-scale-style').html(`
            ${floatingSelectors.join(', ')} {
                zoom: ${s};
            }
            ${fullscreenSelectors.join(', ')} {
                zoom: ${s};
                width: ${reverseScale}vw !important;
                height: ${reverseScale}vh !important;
                top: 0 !important;
                left: 0 !important;
            }
        `);
        
        // 记录当前缩放比例供其他模块使用
        this.currentScale = s;
        Logger.info('[UICore] Applied UI scale:', s, 'Compensated size:', reverseScale + '%');
        
        // 强制更新 HUD 位置，因为尺寸可能变了
        if (window.DND_Dashboard_UI && window.DND_Dashboard_UI.updateHUDPosition) {
            setTimeout(() => window.DND_Dashboard_UI.updateHUDPosition(), 100);
        }
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
                // 销毁动态背景以节省性能
                this._destroyDynamicBackgrounds();
                // [修复] 隐藏表格管理器容器，防止隐藏后仍然可以点击
                this._hideTableManager();
                break;
            case 'mini':
                $btn.removeClass('dnd-hidden');
                // 稍微延迟添加 visible 类以触发 transition (如果刚从 display:none 切换)
                requestAnimationFrame(() => $mini.addClass('visible'));
                this.renderHUD();
                // [新增] 初始化 Mini HUD 动态背景
                this._initDynamicBackground('mini');
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
                // [新增] 初始化全屏界面动态背景
                this._initDynamicBackground('full');
                break;
        }
    },

    // [新增] 初始化动态背景
    _initDynamicBackground(mode) {
        const { $ } = getCore();
        
        // 从设置中获取背景效果类型 (默认 particles)
        const effectType = CONFIG.DYNAMIC_BG?.type || 'particles';
        const enabled = CONFIG.DYNAMIC_BG?.enabled !== false; // 默认启用
        
        if (!enabled) {
            Logger.debug('[DynamicBackground] Disabled by config');
            return;
        }
        
        try {
            if (mode === 'mini') {
                const $mini = $('#dnd-mini-hud');
                if ($mini.length && !this._dynamicBgIds.mini) {
                    this._dynamicBgIds.mini = DynamicBackground.init($mini[0], effectType, {
                        particleCount: 20, // Mini HUD 使用较少的粒子
                        gearCount: 3
                    });
                    Logger.debug('[DynamicBackground] Initialized for Mini HUD');
                }
            } else if (mode === 'full') {
                const $full = $('#dnd-dashboard-root');
                if ($full.length && !this._dynamicBgIds.full) {
                    this._dynamicBgIds.full = DynamicBackground.init($full[0], effectType, {
                        particleCount: 40, // 全屏使用更多粒子
                        gearCount: 6
                    });
                    Logger.debug('[DynamicBackground] Initialized for Full Dashboard');
                }
            }
        } catch (e) {
            Logger.warn('[DynamicBackground] Init error:', e);
        }
    },

    // [新增] 销毁动态背景
    _destroyDynamicBackgrounds() {
        try {
            if (this._dynamicBgIds.mini) {
                DynamicBackground.destroy(this._dynamicBgIds.mini);
                this._dynamicBgIds.mini = null;
            }
            if (this._dynamicBgIds.full) {
                DynamicBackground.destroy(this._dynamicBgIds.full);
                this._dynamicBgIds.full = null;
            }
        } catch (e) {
            Logger.warn('[DynamicBackground] Destroy error:', e);
        }
    },

    // [新增] 隐藏表格管理器面板，在 HUD 隐藏时调用
    _hideTableManager() {
        const { $ } = getCore();
        
        // 隐藏表格管理器容器
        const $tmContainer = $('#dnd-table-manager-container');
        if ($tmContainer.length && $tmContainer.is(':visible')) {
            $tmContainer.hide();
            
            // 重置展开/收起按钮状态
            const $toggleBar = $('#dnd-hud-toggle-bar');
            if ($toggleBar.length) {
                $toggleBar.text('▼').attr('title', '展开表格管理');
            }
            
            // 重置 UITableManager 状态
            if (UITableManager && UITableManager.state) {
                UITableManager.state.isExpanded = false;
            }
            
            Logger.debug('[UICore] 表格管理器已隐藏');
        }
    },

    // [新增] 切换动态背景效果
    switchDynamicBgEffect(effectType) {
        try {
            if (this._dynamicBgIds.mini) {
                DynamicBackground.switchEffect(this._dynamicBgIds.mini, effectType);
            }
            if (this._dynamicBgIds.full) {
                DynamicBackground.switchEffect(this._dynamicBgIds.full, effectType);
            }
            // 保存设置
            if (!CONFIG.DYNAMIC_BG) CONFIG.DYNAMIC_BG = {};
            CONFIG.DYNAMIC_BG.type = effectType;
            Logger.info('[DynamicBackground] Switched to:', effectType);
        } catch (e) {
            Logger.warn('[DynamicBackground] Switch error:', e);
        }
    },

    // [新增] 获取可用的背景效果列表
    getAvailableBgEffects() {
        return DynamicBackground.getAvailableEffects();
    },

    init() {
        Logger.info('[UIRenderer] init() called');
        const { $ } = getCore();
        
        // [修复] 热更新支持：如果有旧的实例，先清除
        // 始终尝试清除，不仅仅是检测到 ID 时，以防万一有残留的监听器或变量
        Logger.info('[UIRenderer] Performing cleanup...');
            
        // 1. 清除定时器 (检查 window 对象上的引用)
        if (window.DND_HUD_Interval) {
            clearInterval(window.DND_HUD_Interval);
            window.DND_HUD_Interval = null;
        }

        // 2. 清除全局事件 (使用命名空间)
        try {
            $(window).off('resize.dnd');
            $(document).off('keydown.dndHotkeys');
            $(document).off('dblclick.dndAvatar');
            $(document).off('click.dndPos'); // 清除位置设置弹窗的监听器
        } catch (e) { console.warn('Event cleanup error:', e); }

        // 3. 清除 DOM 元素 (更彻底的清除)
        const selectorsToRemove = [
            '#dnd-dashboard-root',
            '#dnd-mini-hud',
            '#dnd-tooltip',
            '#dnd-toggle-btn',
            '#dnd-notification-container',
            '#dnd-dialog-container',
            '.dnd-generic-popup',
            '#dnd-position-dialog',
            '#dnd-scale-style',
            '#dnd-shake-style',
            '#dnd-quick-bar',
            '#dnd-quick-trigger'
        ];
        
        selectorsToRemove.forEach(sel => {
            const $el = $(sel);
            if ($el.length) {
                // 尝试移除原生监听器 (如果是 toggle btn)
                if (sel === '#dnd-toggle-btn' && $el[0]) {
                    $el[0].onclick = null;
                    // 指针事件通常绑定在 DOM 元素上，移除 DOM 元素即可自动清理，
                    // 但如果绑定在 window 上的 pending 事件 (drag 中) 需要注意
                }
                $el.remove();
            }
        });

        // 额外清除可能存在的重复 ID (防止 zombie 元素)
        if ($('#dnd-toggle-btn').length > 0) {
            console.warn('[UIRenderer] Duplicate toggle button detected, removing all...');
            $('[id="dnd-toggle-btn"]').remove();
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
                <svg viewBox="0 0 542.969 626.967" width="24" height="24" style="fill:currentColor;">
                    <path d="M271.485,0L0,156.742v313.483l271.485,156.742l271.484-156.742V156.742L271.485,0z M278.328,22.626  l221.618,127.952l-221.618-25.032V22.626z M524.976,167.178l-95.739,224.031L284.191,139.981L524.976,167.178z M418.301,399.638  H124.669l146.816-254.293L418.301,399.638z M264.642,22.626v102.92L43.023,150.578L264.642,22.626z M258.779,139.981L113.732,391.21  L17.993,167.178L258.779,139.981z M16.174,197.747l87.942,205.785l-87.942,49.606V197.747z M23.151,464.915l87.801-49.526  l133.02,177.018L23.151,464.915z M126.518,413.323h289.934L271.485,606.238L126.518,413.323z M298.997,592.407l133.021-177.019  l87.8,49.526L298.997,592.407z M526.795,453.138l-87.941-49.605l87.941-205.784V453.138z M200.249,297.943l0.166-1.121  c1.207-8.13,4.862-15.182,10.867-20.963c6.041-5.818,14.042-8.767,23.779-8.767c10.078,0,18.262,2.926,24.325,8.697  c6.08,5.788,9.164,13.233,9.164,22.127c0,7.859-2.729,14.97-8.108,21.134c-4.985,5.711-16.421,13.673-34.899,24.288h42.746v16.342  h-67.887v-17.453l27.728-18.44c8.271-5.514,13.883-10.438,16.682-14.636c2.751-4.126,4.145-7.929,4.145-11.3  c0-4.076-1.309-7.406-4.003-10.18c-2.682-2.763-6.089-4.106-10.413-4.106c-9.492,0-14.805,5.701-16.246,17.429l-0.172,1.4  L200.249,297.943z M312.995,361.044c8.107,0,14.958-2.273,20.362-6.755c5.35-4.437,9.305-10.174,11.755-17.053  c2.42-6.801,3.647-15.591,3.647-26.126c0-6.352-1.303-13.24-3.875-20.471c-2.604-7.323-6.636-13.135-11.983-17.275  c-5.378-4.162-12.033-6.273-19.776-6.273c-10.774,0-19.481,4.482-25.876,13.322c-6.303,8.716-9.499,20.356-9.499,34.596  c0,13.201,3.051,24.257,9.066,32.858C292.929,356.611,301.737,361.044,312.995,361.044z M313.255,281.484  c6.416,0,10.635,2.945,12.903,9.004c2.384,6.373,3.593,13.202,3.593,20.298c0,8.672-0.495,15.544-1.47,20.426  c-0.944,4.714-2.731,8.414-5.313,10.996c-2.553,2.553-5.836,3.794-10.037,3.794c-6.221,0-10.393-2.767-12.757-8.46  c-2.482-5.969-3.741-14.01-3.741-23.896C296.433,292.305,302.093,281.484,313.255,281.484z"/>
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
        $(window).off('resize.dnd').on('resize.dnd', () => this.updateHUDPosition());

        // [新增] 定时器强制更新位置 (防止样式被覆盖或初始化失败)
        if (window.DND_HUD_Interval) clearInterval(window.DND_HUD_Interval);
        window.DND_HUD_Interval = setInterval(() => this.updateHUDPosition(), 1000);

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
        
        // [新增] 读取并应用 UI 缩放设置
        DBAdapter.getSetting(CONFIG.STORAGE_KEYS.UI_SCALE).then(savedScale => {
            // 如果没有保存过，默认为 1.0
            const scale = savedScale || CONFIG.UI_SCALE.DEFAULT;
            this.applyUIScale(scale);
        });

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
        $(document).off('dblclick.dndAvatar').on('dblclick.dndAvatar', '.dnd-avatar-container', (e) => {
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
};
