import { getCore } from '../../core/Utils.js';
import { DataManager } from '../../data/DataManager.js';

// ============================================
// 自定义通知/对话框系统
// 替代浏览器原生 alert/confirm/prompt
// ============================================

const NotificationSystem = {
    _container: null,
    _dialogContainer: null,

    // 初始化容器
    _ensureContainer() {
        const { $, window: coreWin } = getCore();
        const $root = coreWin?.jQuery || $;
        const $body = $root('body').first();
        const bodyEl = $body?.[0] || document.body;
        const doc = bodyEl?.ownerDocument || document;
        const $dialogHost = $root('#dnd-dashboard-root.visible');
        const $dialogMount = $dialogHost.length ? $dialogHost : $body;
        const dialogMountEl = $dialogMount?.[0] || bodyEl;

        if (!this._container || !this._container[0] || !bodyEl.contains(this._container[0])) {
            this._container = $root('<div id="dnd-notification-container"></div>');
            $body.append(this._container);
        } else if (this._container[0].parentNode !== bodyEl) {
            $body.append(this._container);
        }

        if (!this._dialogContainer || !this._dialogContainer[0] || !doc.body.contains(this._dialogContainer[0])) {
            this._dialogContainer = $root('<div id="dnd-dialog-container"></div>');
            $dialogMount.append(this._dialogContainer);
        } else if (this._dialogContainer[0].parentNode !== dialogMountEl) {
            $dialogMount.append(this._dialogContainer);
        }
    },

    /**
     * 检测是否应该使用 modal overlay 路径
     * 条件：full dashboard 可见 + modal overlay 存在
     * @returns {boolean}
     */
    _shouldUseModalOverlay() {
        const { $, window: coreWin } = getCore();
        const $root = coreWin?.jQuery || $;
        const $dashboard = $root('#dnd-dashboard-root.visible');
        const $overlay = $root('#dnd-modal-overlay');
        const $modal = $root('#dnd-modal-content');
        // full dashboard 可见 且 overlay/content 都存在
        return $dashboard.length > 0 && $overlay.length > 0 && $modal.length > 0;
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
            info: '<i class="fa-solid fa-info-circle"></i>',
            success: '<i class="fa-solid fa-check-circle"></i>',
            warning: '<i class="fa-solid fa-exclamation"></i>',
            error: '<i class="fa-solid fa-times-circle"></i>'
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
        // 检测是否应该使用 modal overlay 路径
        if (this._shouldUseModalOverlay()) {
            return this._confirmViaModalOverlay(message, options);
        }
        // Fallback: 使用自建 dialog
        return this._confirmViaDialog(message, options);
    },

    /**
     * 通过 modal overlay 显示确认对话框
     * @private
     */
    _confirmViaModalOverlay(message, options = {}) {
        const { $, window: coreWin } = getCore();
        const $root = coreWin?.jQuery || $;

        const {
            title = '确认',
            confirmText = '确定',
            cancelText = '取消',
            type = 'info'
        } = options;

        return new Promise((resolve) => {
            const $overlay = $root('#dnd-modal-overlay');
            const $modal = $root('#dnd-modal-content');
            const doc = $overlay[0]?.ownerDocument || coreWin?.document || document;
            
            // 构建对话框内容（复用现有 .dnd-dialog 视觉风格）
            const $content = $root(`
                <div class="dnd-dialog dnd-dialog-${type}" style="position:relative;max-width:min(90vw,450px);max-height:80vh;">
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

            let closed = false;
            const handlers = {
                confirm: null,
                cancel: null,
                close: null,
                overlayClick: null,
                esc: null
            };

            const cleanup = () => {
                if (closed) return;
                closed = true;
                // 解绑所有事件
                $content.find('.dnd-dialog-btn-confirm').off('click', handlers.confirm);
                $content.find('.dnd-dialog-btn-cancel').off('click', handlers.cancel);
                $content.find('.dnd-dialog-close').off('click', handlers.close);
                $overlay.off('click.dnd-confirm', handlers.overlayClick);
                doc.removeEventListener('keydown', handlers.esc);
                // 清空 modal 内容并关闭 overlay
                $modal.empty();
                $overlay.removeClass('active');
            };

            // 绑定事件
            handlers.confirm = () => { cleanup(); resolve(true); };
            handlers.cancel = () => { cleanup(); resolve(false); };
            handlers.close = () => { cleanup(); resolve(false); };
            handlers.overlayClick = (e) => {
                if (e.target === $overlay[0]) { cleanup(); resolve(false); }
            };
            handlers.esc = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    cleanup();
                    resolve(false);
                }
            };

            $content.find('.dnd-dialog-btn-confirm').on('click', handlers.confirm);
            $content.find('.dnd-dialog-btn-cancel').on('click', handlers.cancel);
            $content.find('.dnd-dialog-close').on('click', handlers.close);
            $overlay.on('click.dnd-confirm', handlers.overlayClick);
            doc.addEventListener('keydown', handlers.esc);

            // 渲染到 modal content
            $modal.empty().append($content);
            $overlay.addClass('active');
            requestAnimationFrame(() => {
                $content.addClass('dnd-dialog-visible');
            });
        });
    },

    /**
     * 通过自建 dialog 显示确认对话框 (fallback)
     * @private
     */
    _confirmViaDialog(message, options = {}) {
        const { $, window: coreWin } = getCore();
        const $root = coreWin?.jQuery || $;
        this._ensureContainer();
        const doc = this._dialogContainer?.[0]?.ownerDocument || coreWin?.document || document;

        const {
            title = '确认',
            confirmText = '确定',
            cancelText = '取消',
            type = 'info'
        } = options;

        return new Promise((resolve) => {
            const $backdrop = $root('<div class="dnd-dialog-backdrop"></div>');
            const $dialog = $root(`
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

            let closed = false;
            const closeDialog = (result) => {
                if (closed) return;
                closed = true;
                doc.removeEventListener('keydown', escHandler);
                $dialog.removeClass('dnd-dialog-visible');
                $backdrop.removeClass('dnd-dialog-backdrop-visible');
                setTimeout(() => {
                    $backdrop.remove();
                }, 200);
                resolve(result);
            };

            $dialog.find('.dnd-dialog-btn-confirm').on('click', () => closeDialog(true));
            $dialog.find('.dnd-dialog-btn-cancel').on('click', () => closeDialog(false));
            $dialog.find('.dnd-dialog-close').on('click', () => closeDialog(false));
            $backdrop.on('click', (e) => {
                // 只有点击 backdrop 本身（不是 dialog）才关闭
                if (e.target === $backdrop[0]) {
                    closeDialog(false);
                }
            });

            // ESC 键关闭
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeDialog(false);
                }
            };
            doc.addEventListener('keydown', escHandler);

            // dialog append 到 backdrop 内部
            $backdrop.append($dialog);
            this._dialogContainer.append($backdrop);

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
        // 检测是否应该使用 modal overlay 路径
        if (this._shouldUseModalOverlay()) {
            return this._promptViaModalOverlay(message, options);
        }
        // Fallback: 使用自建 dialog
        return this._promptViaDialog(message, options);
    },

    /**
     * 通过 modal overlay 显示输入对话框
     * @private
     */
    _promptViaModalOverlay(message, options = {}) {
        const { $, window: coreWin } = getCore();
        const $root = coreWin?.jQuery || $;

        const {
            title = '请输入',
            defaultValue = '',
            placeholder = '',
            confirmText = '确定',
            cancelText = '取消'
        } = options;

        return new Promise((resolve) => {
            const $overlay = $root('#dnd-modal-overlay');
            const $modal = $root('#dnd-modal-content');
            const doc = $overlay[0]?.ownerDocument || coreWin?.document || document;
            
            // 构建对话框内容
            const $content = $root(`
                <div class="dnd-dialog dnd-dialog-prompt" style="position:relative;max-width:min(90vw,450px);max-height:80vh;">
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

            const $input = $content.find('.dnd-dialog-input');

            let closed = false;
            const handlers = {
                confirm: null,
                cancel: null,
                close: null,
                overlayClick: null,
                esc: null,
                inputKeydown: null
            };

            const cleanup = (confirmed) => {
                if (closed) return;
                closed = true;
                const value = confirmed ? $input.val() : null;
                // 解绑所有事件
                $content.find('.dnd-dialog-btn-confirm').off('click', handlers.confirm);
                $content.find('.dnd-dialog-btn-cancel').off('click', handlers.cancel);
                $content.find('.dnd-dialog-close').off('click', handlers.close);
                $overlay.off('click.dnd-prompt', handlers.overlayClick);
                doc.removeEventListener('keydown', handlers.esc);
                $input.off('keydown', handlers.inputKeydown);
                // 清空 modal 内容并关闭 overlay
                $modal.empty();
                $overlay.removeClass('active');
                resolve(value);
            };

            // 绑定事件
            handlers.confirm = () => cleanup(true);
            handlers.cancel = () => cleanup(false);
            handlers.close = () => cleanup(false);
            handlers.overlayClick = (e) => {
                if (e.target === $overlay[0]) { cleanup(false); }
            };
            handlers.esc = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    cleanup(false);
                }
            };
            handlers.inputKeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    cleanup(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    cleanup(false);
                }
            };

            $content.find('.dnd-dialog-btn-confirm').on('click', handlers.confirm);
            $content.find('.dnd-dialog-btn-cancel').on('click', handlers.cancel);
            $content.find('.dnd-dialog-close').on('click', handlers.close);
            $overlay.on('click.dnd-prompt', handlers.overlayClick);
            doc.addEventListener('keydown', handlers.esc);
            $input.on('keydown', handlers.inputKeydown);

            // 渲染到 modal content
            $modal.empty().append($content);
            $overlay.addClass('active');

            // 聚焦输入框
            requestAnimationFrame(() => {
                $content.addClass('dnd-dialog-visible');
                $input.focus().select();
            });
        });
    },

    /**
     * 通过自建 dialog 显示输入对话框 (fallback)
     * @private
     */
    _promptViaDialog(message, options = {}) {
        const { $, window: coreWin } = getCore();
        const $root = coreWin?.jQuery || $;
        this._ensureContainer();
        const doc = this._dialogContainer?.[0]?.ownerDocument || coreWin?.document || document;

        const {
            title = '请输入',
            defaultValue = '',
            placeholder = '',
            confirmText = '确定',
            cancelText = '取消'
        } = options;

        return new Promise((resolve) => {
            const $backdrop = $root('<div class="dnd-dialog-backdrop"></div>');
            const $dialog = $root(`
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

            let closed = false;
            const closeDialog = (confirmed) => {
                if (closed) return;
                closed = true;
                const value = confirmed ? $input.val() : null;
                doc.removeEventListener('keydown', escHandler);
                $dialog.removeClass('dnd-dialog-visible');
                $backdrop.removeClass('dnd-dialog-backdrop-visible');
                setTimeout(() => {
                    $backdrop.remove();
                }, 200);
                resolve(value);
            };

            $dialog.find('.dnd-dialog-btn-confirm').on('click', () => closeDialog(true));
            $dialog.find('.dnd-dialog-btn-cancel').on('click', () => closeDialog(false));
            $dialog.find('.dnd-dialog-close').on('click', () => closeDialog(false));
            $backdrop.on('click', (e) => {
                // 只有点击 backdrop 本身（不是 dialog）才关闭
                if (e.target === $backdrop[0]) {
                    closeDialog(false);
                }
            });

            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeDialog(false);
                }
            };
            doc.addEventListener('keydown', escHandler);

            // Enter 确认, ESC 取消
            $input.on('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    closeDialog(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeDialog(false);
                }
            });

            // dialog append 到 backdrop 内部
            $backdrop.append($dialog);
            this._dialogContainer.append($backdrop);

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
export { NotificationSystem };

export default {
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
        // 获取当前的变换状态
        const state = this._mapZoom; // Uses this._mapZoom from the merged object
        const mapScale = state.scale || 1;
        
        // 【关键修复】获取 UI 整体缩放比例
        // UI 使用 CSS zoom 属性进行缩放
        //
        // 重要：不能使用 this.currentScale，因为 Object.assign() 是浅拷贝
        // 当 UICore.applyUIScale() 更新 currentScale 时，合并后的对象不会同步
        // 所以我们直接从 CSS 变量读取，这是实时更新的
        //
        // CSS zoom 的行为（在 Chrome 中）：
        // - getBoundingClientRect() 返回的是经过 zoom 调整后的坐标
        // - clientX/clientY 是真实的屏幕像素坐标（不受 zoom 影响）
        //
        // 所以当 zoom 存在时，我们需要将 innerRect 的坐标乘以 zoom
        // 来得到真正的屏幕坐标，或者将 clientX/Y 除以 zoom
        const cssScale = getComputedStyle(document.documentElement).getPropertyValue('--dnd-ui-scale');
        const uiZoom = parseFloat(cssScale) || 1;
        
        // 获取 innerMap 的边界框
        const innerRect = $innerMap[0].getBoundingClientRect();
        
        // 方法：直接计算点击相对于元素的位置
        // 在 CSS zoom 环境下：
        // - innerRect 的坐标已经被 zoom 调整（乘以了 zoom）
        // - clientX/clientY 是真实屏幕坐标
        // 所以 relX = clientX - innerRect.left 在 zoom 环境下是正确的
        //
        // 但是，innerRect 的尺寸也被 zoom 调整了
        // 所以 relX 是在 zoom 后的坐标系中
        // 要还原到原始坐标，需要除以 zoom
        const relX = e.clientX - innerRect.left;
        const relY = e.clientY - innerRect.top;
        
        // 考虑 UI zoom 和地图 transform scale 的组合效果
        // 原始坐标 = 相对位置 / (uiZoom * mapScale)
        //
        // 解释：
        // - uiZoom 使得整个 UI（包括地图）在视觉上放大
        // - mapScale 使得地图内容在 UI 内部进一步缩放
        // - 两者的效果是乘法关系
        const totalScale = uiZoom * mapScale;
        const originalX = relX / totalScale;
        const originalY = relY / totalScale;
        
        // 获取 cellSize (存储在 data 属性中)
        const cellSize = parseFloat($innerMap.data('cell-size')) || 20;
        
        // 获取网格尺寸
        const cols = parseFloat($innerMap.data('cols')) || 20;
        const rows = parseFloat($innerMap.data('rows')) || 20;
        
        // 转换为网格坐标
        // 使用 floor + 1：像素 [0, cellSize) 对应格子 1
        let gridX = Math.floor(originalX / cellSize) + 1;
        let gridY = Math.floor(originalY / cellSize) + 1;
        
        // 边界检查，确保在有效范围内 (1 到 cols/rows)
        gridX = Math.max(1, Math.min(cols, gridX));
        gridY = Math.max(1, Math.min(rows, gridY));
        
        // 调试日志 (可在确认修复后删除)
        console.log('[getGridFromEvent] Debug:', {
            click: { clientX: e.clientX, clientY: e.clientY },
            innerRect: { left: innerRect.left, top: innerRect.top, width: innerRect.width, height: innerRect.height },
            uiZoom,
            mapScale,
            totalScale,
            rel: { relX, relY },
            original: { originalX, originalY },
            cellSize,
            grid: { gridX, gridY }
        });
        
        return { x: gridX, y: gridY };
    }
};

// 辅助动画效果导出对象 - 直接引用默认导出的方法
export const UIEffects = {
    /**
     * 为按钮添加涟漪点击效果
     * @param {Event} e - 点击事件
     * @param {HTMLElement|jQuery} element - 目标元素
     */
    addRippleEffect(e, element) {
        const { $ } = getCore();
        const $el = $(element);
        
        // 确保元素有相对定位和overflow hidden
        if ($el.css('position') === 'static') {
            $el.css('position', 'relative');
        }
        $el.css('overflow', 'hidden');
        
        // 计算涟漪位置
        const rect = $el[0].getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;
        
        // 创建涟漪元素
        const $ripple = $(`<span class="dnd-ripple-effect" style="
            width: ${size}px;
            height: ${size}px;
            left: ${x - size / 2}px;
            top: ${y - size / 2}px;
        "></span>`);
        
        $el.append($ripple);
        
        // 动画结束后移除
        setTimeout(() => {
            $ripple.remove();
        }, 600);
    },

    /**
     * 初始化全局涟漪效果监听器
     */
    initRippleListeners() {
        const { $ } = getCore();
        
        // 为所有带有 dnd-btn-ripple 类的元素添加涟漪效果
        $(document).on('click', '.dnd-btn-ripple', function(e) {
            UIEffects.addRippleEffect(e, this);
        });
    },

    /**
     * 为元素添加低血量警告效果
     * @param {jQuery} $element - HP 条容器元素
     * @param {number} hpPercent - 当前 HP 百分比 (0-100)
     */
    updateHPCriticalEffect($element, hpPercent) {
        if (hpPercent <= 25) {
            $element.addClass('dnd-critical');
        } else {
            $element.removeClass('dnd-critical');
        }
    },

    /**
     * 为角色卡片添加高亮效果
     * @param {jQuery} $card - 卡片元素
     * @param {boolean} highlight - 是否高亮
     */
    setCardHighlight($card, highlight) {
        if (highlight) {
            $card.addClass('dnd-highlight-card');
        } else {
            $card.removeClass('dnd-highlight-card');
        }
    },

    /**
     * 触发交错入场动画
     * @param {jQuery} $container - 容器元素
     */
    triggerStaggerAnimation($container) {
        $container.addClass('dnd-stagger-enter');
    },

    /**
     * 为元素添加文字渐显效果
     * @param {jQuery} $element - 目标元素
     * @param {number} delayIndex - 延迟索引 (1-3)
     */
    addTextReveal($element, delayIndex = 0) {
        $element.addClass('dnd-text-reveal');
        if (delayIndex > 0 && delayIndex <= 3) {
            $element.addClass(`dnd-text-reveal-delay-${delayIndex}`);
        }
    }
};
