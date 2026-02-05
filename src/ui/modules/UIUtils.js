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
        const { $ } = getCore();
        if (!this._container) {
            this._container = $('<div id="dnd-notification-container"></div>');
            $('body').append(this._container);
        }
        if (!this._dialogContainer) {
            this._dialogContainer = $('<div id="dnd-dialog-container"></div>');
            $('body').append(this._dialogContainer);
        }
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
        const { $ } = getCore();
        this._ensureContainer();

        const {
            title = '确认',
            confirmText = '确定',
            cancelText = '取消',
            type = 'info'
        } = options;

        return new Promise((resolve) => {
            const $backdrop = $('<div class="dnd-dialog-backdrop"></div>');
            const $dialog = $(`
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

            const closeDialog = (result) => {
                $dialog.removeClass('dnd-dialog-visible');
                $backdrop.removeClass('dnd-dialog-backdrop-visible');
                setTimeout(() => {
                    $backdrop.remove();
                    $dialog.remove();
                }, 200);
                resolve(result);
            };

            $dialog.find('.dnd-dialog-btn-confirm').on('click', () => closeDialog(true));
            $dialog.find('.dnd-dialog-btn-cancel').on('click', () => closeDialog(false));
            $dialog.find('.dnd-dialog-close').on('click', () => closeDialog(false));
            $backdrop.on('click', () => closeDialog(false));

            // ESC 键关闭
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeDialog(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            this._dialogContainer.append($backdrop).append($dialog);

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
        const { $ } = getCore();
        this._ensureContainer();

        const {
            title = '请输入',
            defaultValue = '',
            placeholder = '',
            confirmText = '确定',
            cancelText = '取消'
        } = options;

        return new Promise((resolve) => {
            const $backdrop = $('<div class="dnd-dialog-backdrop"></div>');
            const $dialog = $(`
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

            const closeDialog = (confirmed) => {
                const value = confirmed ? $input.val() : null;
                $dialog.removeClass('dnd-dialog-visible');
                $backdrop.removeClass('dnd-dialog-backdrop-visible');
                setTimeout(() => {
                    $backdrop.remove();
                    $dialog.remove();
                }, 200);
                resolve(value);
            };

            $dialog.find('.dnd-dialog-btn-confirm').on('click', () => closeDialog(true));
            $dialog.find('.dnd-dialog-btn-cancel').on('click', () => closeDialog(false));
            $dialog.find('.dnd-dialog-close').on('click', () => closeDialog(false));
            $backdrop.on('click', () => closeDialog(false));

            // Enter 确认, ESC 取消
            $input.on('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    closeDialog(true);
                } else if (e.key === 'Escape') {
                    closeDialog(false);
                }
            });

            this._dialogContainer.append($backdrop).append($dialog);

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
        const rect = $container[0].getBoundingClientRect();
        
        // 获取当前的变换状态
        const state = this._mapZoom; // Uses this._mapZoom from the merged object
        const scale = state.scale || 1;
        
        // 更稳健的方法：利用 innerMap 的 getBoundingClientRect
        const innerRect = $innerMap[0].getBoundingClientRect();
        
        // 计算点击点相对于 innerMap 左上角的像素位置
        const relX = e.clientX - innerRect.left;
        const relY = e.clientY - innerRect.top;
        
        // 此时 relX, relY 是受 scale 影响后的屏幕像素值
        // 需要除以 scale 还原回原始像素值
        const originalX = relX / scale;
        const originalY = relY / scale;
        
        // 获取 cellSize (存储在 data 属性中)
        const cellSize = parseFloat($innerMap.data('cell-size')) || 20;
        
        // 转换为网格坐标 (向上取整，因为 0-20px 是第一格)
        const gridX = Math.ceil(originalX / cellSize);
        const gridY = Math.ceil(originalY / cellSize);
        
        return { x: gridX, y: gridY };
    }
};
