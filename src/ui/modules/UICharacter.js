import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { DBAdapter } from '../../core/DBAdapter.js';
import { DataManager } from '../../data/DataManager.js';
import { TavernAPI } from '../../core/TavernAPI.js';
import { SettingsManager } from '../../core/SettingsManager.js';
import { CONFIG } from '../../config/Config.js';
import { DiceManager } from '../../data/DiceManager.js';
import { NotificationSystem } from './UIUtils.js';
import { TavernSettingsSync } from '../../core/TavernSettingsSync.js';

export default {
    // 头像存储管理 (使用 IndexedDB + Chat Metadata)
    avatarStorage: {
        get: async (charId) => {
            // 1. 优先尝试 Chat Metadata (跟随聊天文件)
            const chatVal = TavernSettingsSync.getFromChat(`avatar_${charId}`);
            if (chatVal) return chatVal;

            // 2. 尝试 IndexedDB (本地缓存)
            let val = await DBAdapter.get(charId);
            // 兼容旧版 localStorage (迁移数据)
            if (!val) {
                const old = localStorage.getItem(`dnd_avatar_${charId}`);
                if (old) {
                    await DBAdapter.put(charId, old);
                    localStorage.removeItem(`dnd_avatar_${charId}`); // 迁移后删除
                    val = old;
                }
            }
            return val;
        },
        set: async (charId, base64Data) => {
            // 保存到 Chat Metadata
            await TavernSettingsSync.saveToChat(`avatar_${charId}`, base64Data);
            // 保存到 IndexedDB
            return await DBAdapter.put(charId, base64Data);
        },
        remove: async (charId) => {
            // 从 Chat Metadata 移除
            await TavernSettingsSync.deleteFromChat(`avatar_${charId}`);
            // 从 IndexedDB 移除
            return await DBAdapter.delete(charId);
        }
    },

    // 异步加载头像
    async loadAvatarAsync(charId, elemId) {
        const { $ } = getCore();
        const base64 = await this.avatarStorage.get(charId);
        if (base64) {
            const $el = $(`#${elemId}`);
            if ($el.length) {
                $el.html(`<img src="${base64}" style="width:100%;height:100%;object-fit:cover;">`);
                // 如果加载失败，显示回退的字母 (虽然 img onerror 应该处理了，但这里是直接替换 HTML)
                const self = this;
                $el.find('img').on('error', function() {
                    $(this).hide();
                    // 重新插入字母
                    const initial = self.getNameInitial($el.attr('title'));
                    const fontSize = Math.floor($el.width() * 0.5);
                    $el.html(`<div class="dnd-avatar-initial" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--dnd-text-highlight);font-weight:bold;font-size:${fontSize}px;">${initial}</div>`);
                });
            }
        }
    },

    // 生成头像HTML (异步模式)
    renderAvatar(name, charId, size = 40) {
        const initial = this.getNameInitial(name);
        const fontSize = Math.floor(size * 0.5);
        // 生成唯一ID以便异步填充
        const uid = `avatar-${charId}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 触发异步加载
        setTimeout(() => this.loadAvatarAsync(charId, uid), 0);

        // 返回占位符 (显示首字母)
        return `
            <div id="${uid}" class="dnd-avatar-container" data-char-id="${charId}" style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:1px solid var(--dnd-border-gold);flex-shrink:0;background:linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;" title="${name}">
                <span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:${fontSize}px;">${initial}</span>
            </div>
        `;
    },

    // 显示头像上传对话框
    showAvatarUploadDialog(charId, charName) {
        const { $, window: coreWin } = getCore();
        
        // 移除已存在的对话框
        $('#dnd-avatar-upload-dialog').remove();
        
        // Note: avatarStorage.get is async, but here we need synchronous display for dialog init?
        // Actually we can await or just load it. The original code used synchronous localstorage get?
        // Original code: const storedAvatar = UIRenderer.avatarStorage.get(charId); -> Returns Promise!
        // The original code treated it as sync?
        // "let val = await DBAdapter.get(charId);" inside get.
        // So avatarStorage.get returns a Promise.
        // Original code:
        /*
        const storedAvatar = UIRenderer.avatarStorage.get(charId);
        // ...
        ${storedAvatar ? ... }
        */
        // If storedAvatar is a Promise, it is truthy. This might have been a bug in original code or I misread.
        // UIRenderer.avatarStorage.get is async.
        // Let's fix this properly by using .then or await.
        // But showAvatarUploadDialog is called from onclick attribute string in some places?
        // "onclick="window.DND_Dashboard_UI.showAvatarUploadDialog..."
        // So it can be async.
        
        this.avatarStorage.get(charId).then(storedAvatar => {
            const initial = this.getNameInitial(charName);
            
            // 检测是否为移动端
            const isMobileDialog = (coreWin.innerWidth || $(coreWin).width()) < 768;
            
            const dialogHtml = `
                <div id="dnd-avatar-upload-dialog" style="
                    position: fixed;
                    ${isMobileDialog ? `
                        top: 20px;
                        left: 10px;
                        right: 10px;
                        transform: none;
                        width: auto;
                    ` : `
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        min-width: 300px;
                        max-width: 90vw;
                    `}
                    background: var(--dnd-bg-panel, #161618);
                    border: 1px solid var(--dnd-border-gold, #9d8b6c);
                    border-radius: 8px;
                    padding: 20px;
                    z-index: 2147483650;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                ">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid var(--dnd-border-inner);padding-bottom:10px;">
                        <span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:16px;">设置头像 - ${charName}</span>
                        <span id="dnd-avatar-dialog-close" style="cursor:pointer;color:#888;font-size:18px;" title="关闭">✕</span>
                    </div>
                    
                    <div style="display:flex;flex-direction:column;align-items:center;gap:15px;">
                        <div id="dnd-avatar-preview" style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:2px solid var(--dnd-border-gold);background:linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%);display:flex;align-items:center;justify-content:center;">
                            ${storedAvatar 
                                ? `<img src="${storedAvatar}" style="width:100%;height:100%;object-fit:cover;">` 
                                : `<span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:36px;">${initial}</span>`
                            }
                        </div>
                        
                        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
                            <label style="
                                background: rgba(157, 139, 108, 0.2);
                                border: 1px solid var(--dnd-border-gold);
                                color: var(--dnd-text-highlight);
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='rgba(157, 139, 108, 0.4)'" onmouseout="this.style.background='rgba(157, 139, 108, 0.2)'">
                                <i class="fa-solid fa-camera"></i> 选择图片
                                <input type="file" id="dnd-avatar-file-input" accept="image/*" style="display:none;">
                            </label>
                            
                            ${storedAvatar ? `
                                <button id="dnd-avatar-remove-btn" style="
                                    background: rgba(138, 44, 44, 0.3);
                                    border: 1px solid #8a2c2c;
                                    color: #ff6b6b;
                                    padding: 8px 16px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 13px;
                                    transition: all 0.2s;
                                " onmouseover="this.style.background='rgba(138, 44, 44, 0.5)'" onmouseout="this.style.background='rgba(138, 44, 44, 0.3)'">
                                    <i class="fa-solid fa-trash"></i> 移除头像
                                </button>
                            ` : ''}
                        </div>
                        
                        <div style="font-size:11px;color:#888;text-align:center;">
                            支持 JPG、PNG、GIF 格式<br>
                            图片将存储在浏览器本地
                        </div>
                    </div>
                </div>
                <div id="dnd-avatar-dialog-backdrop" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.6);
                    z-index: 2147483646;
                "></div>
            `;
            
            $('body').append(dialogHtml);
            
            // 绑定事件
            $('#dnd-avatar-dialog-close, #dnd-avatar-dialog-backdrop').on('click', () => {
                $('#dnd-avatar-upload-dialog, #dnd-avatar-dialog-backdrop').remove();
            });
            
            const self = this;
            $('#dnd-avatar-file-input').on('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                // 检查文件大小 (限制 5MB - IndexedDB 可存储大量数据)
                if (file.size > 5 * 1024 * 1024) {
                    NotificationSystem.warning('图片文件过大，请选择小于 5MB 的图片');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const base64 = evt.target.result;
                    
                    // 压缩图片
                    self.compressImage(base64, 150, (compressedBase64) => {
                        // 保存到 localStorage
                        self.avatarStorage.set(charId, compressedBase64).then(success => {
                            if (success) {
                                // 更新预览
                                $('#dnd-avatar-preview').html(`<img src="${compressedBase64}" style="width:100%;height:100%;object-fit:cover;">`);
                                
                                // 更新页面上所有该角色的头像
                                self.refreshAvatars(charId);
                                
                                // 关闭对话框
                                setTimeout(() => {
                                    $('#dnd-avatar-upload-dialog, #dnd-avatar-dialog-backdrop').remove();
                                }, 500);
                            } else {
                                NotificationSystem.error('保存失败，可能是浏览器存储空间不足');
                            }
                        });
                    });
                };
                reader.readAsDataURL(file);
            });
            
            $('#dnd-avatar-remove-btn').on('click', async () => {
                const confirmed = await NotificationSystem.confirm('确定要移除头像吗？', {
                    title: '移除头像',
                    confirmText: '移除',
                    type: 'danger'
                });
                if (confirmed) {
                    this.avatarStorage.remove(charId);
                    this.refreshAvatars(charId);
                    $('#dnd-avatar-upload-dialog, #dnd-avatar-dialog-backdrop').remove();
                }
            });
        });
    },

    // 刷新页面上指定角色的所有头像
    refreshAvatars(charId) {
        const { $ } = getCore();
        this.avatarStorage.get(charId).then(storedAvatar => {
            $(`.dnd-avatar-container[data-char-id="${charId}"]`).each(function() {
                const $container = $(this);
                const size = $container.width();
                const fontSize = Math.floor(size * 0.5);
                
                // 获取角色名（从 title 属性或子元素）
                const initial = $container.find('.dnd-avatar-initial').text() || $container.find('span').text() || '?';
                
                if (storedAvatar) {
                    $container.html(`
                        <img src="${storedAvatar}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                        <div class="dnd-avatar-initial" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:var(--dnd-text-highlight);font-weight:bold;font-size:${fontSize}px;background:linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%);">${initial}</div>
                    `);
                } else {
                    $container.html(`<span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:${fontSize}px;">${initial}</span>`);
                    $container.css({
                        'display': 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'background': 'linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%)'
                    });
                }
            });
            
            // 同时刷新 HUD
            if (this.state === 'mini') {
                this.renderHUD();
            }
        });
    },

    // 保存最后一次点击位置，用于定位卡片
    _lastClickPos: { x: 0, y: 0 },
    
    showCharacterCard(char, clickEvent) {
        Logger.info('[UIRenderer] showCharacterCard called for:', char ? char['姓名'] : 'Unknown');
        const { $ } = getCore();
        let $card = $('#dnd-char-detail-card-el');
        
        // 记录点击位置（如果有事件对象）
        if (clickEvent && clickEvent.clientX !== undefined) {
            this._lastClickPos = { x: clickEvent.clientX, y: clickEvent.clientY };
        }
        
        // 如果卡片不存在则创建
        if (!$card.length) {
            $card = $('<div id="dnd-char-detail-card-el" class="dnd-char-detail-card"></div>');
            $('body').append($card);
        }
        
        // 每次显示卡片时重新绑定关闭事件（使用命名空间避免重复）
        $(document).off('click.dndCharCard');
        
        const self = this;
        // 使用 setTimeout 避免当前点击立即触发关闭
        setTimeout(() => {
            $(document).on('click.dndCharCard', (e) => {
                const $target = $(e.target);
                
                // 如果点击的是卡片内部，不关闭
                if ($target.closest('#dnd-char-detail-card-el').length) return;
                
                // 如果点击的是悬浮窗内部，不关闭
                if ($target.closest('#dnd-detail-popup-el').length) return;
                
                // 如果点击的是技能/专长标签（会打开悬浮窗），不关闭卡片
                if ($target.closest('.dnd-skill-trigger, .dnd-feat-trigger').length) return;
                
                // 如果点击的是触发打开卡片的元素（头像等），让那边的 toggle 逻辑处理
                if ($target.closest('.dnd-mini-char-avatar, .dnd-mini-char, .party-list-avatar, .party-quick-avatar, .dnd-char-card, .party-bar-item, #dnd-logo-container').length) return;
                
                // 其他情况关闭卡片和悬浮窗
                if ($card.hasClass('visible')) {
                    self.hideCharacterCard();
                    self.hideDetailPopup();
                    $(document).off('click.dndCharCard');
                }
            });
        }, 150);

        // 如果已经显示且是同一个角色，则关闭
        if ($card.hasClass('visible') && $card.data('charId') === (char['PC_ID'] || char['CHAR_ID'])) {
            this.hideCharacterCard();
            this.hideDetailPopup();
            return;
        }

        const charId = char['PC_ID'] || char['CHAR_ID'];
        $card.data('charId', charId);

        // 解析属性
        const stats = DataManager.parseValue(char['属性值'], 'stats') || {};

        // 计算属性调整值 (Value - 10) / 2 向下取整
        const getMod = (val) => {
            const mod = Math.floor((val - 10) / 2);
            return mod >= 0 ? `+${mod}` : mod;
        };

        // 解析 HP
        let hpCurrent = 0, hpMax = 0, hpPercent = 0;
        if (char['HP']) {
            const parts = char['HP'].split('/');
            if (parts.length === 2) {
                hpCurrent = parseInt(parts[0]) || 0;
                hpMax = parseInt(parts[1]) || 1;
                hpPercent = Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100));
            }
        }

        // 获取技能和专长
        const skills = charId ? DataManager.getCharacterSkills(charId) : [];
        const feats = charId ? DataManager.getCharacterFeats(charId) : [];
        
        // 获取资源
        const pcRes = DataManager.getTable('PC_Resources');
        const memRes = DataManager.getTable('PARTY_Resources');
        let res = {};
        if (char['type'] === 'PC' && pcRes) res = pcRes[0] || {};
        else if (memRes) res = memRes.find(r => r['CHAR_ID'] === charId) || {};
        
        // 构建 HTML
        const detailAvatarHtml = this.renderAvatar(char['姓名'], charId, 48);
        
        // [新增] 只有当是主角或队友时，才显示上传按钮
        const party = DataManager.getPartyData();
        const isPartyMember = party && party.some(p => (p['PC_ID'] == charId) || (p['CHAR_ID'] == charId) || (p['姓名'] == charId) || (p['姓名'] == char['姓名']));
        
        let html = `
            <div class="dnd-detail-header">
                <div style="display:flex;align-items:center;gap:15px;flex:1;overflow:hidden;">
                    <div style="position:relative;cursor:pointer;" class="dnd-avatar-wrapper" onclick="${isPartyMember ? `window.DND_Dashboard_UI.showAvatarUploadDialog('${charId}', '${char['姓名']}')` : ''}" title="${isPartyMember ? '点击修改头像' : ''}">
                        ${detailAvatarHtml}
                        ${isPartyMember ? `<div style="position:absolute;bottom:-2px;right:-2px;background:#333;border:1px solid var(--dnd-border-gold);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--dnd-text-highlight);">📷</div>` : ''}
                    </div>
                    <div class="dnd-detail-info">
                        <div class="dnd-detail-name">${char['姓名']}</div>
                        <div class="dnd-detail-sub">${char['种族/性别/年龄'] || '未知'} | ${char['职业'] || '无职业'}</div>
                    </div>
                </div>
                <div class="dnd-detail-close" id="dnd-card-close">✕</div>
            </div>
            
            <div class="dnd-detail-body">
                <div style="margin-bottom:15px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;color:#ccc;">
                        <span>HP (生命值)</span>
                        <span style="color:${hpPercent < 30 ? '#e74c3c' : 'inherit'}">${hpCurrent} / ${hpMax}</span>
                    </div>
                    <div class="dnd-bar-container dnd-bar-hp">
                        <div class="dnd-bar-fill" style="width: ${hpPercent}%"></div>
                    </div>
                </div>
                
                <div class="dnd-detail-stats-row">
                    <div class="dnd-detail-stat-item"><span style="color:#888">AC</span> <strong style="color:var(--dnd-text-highlight);font-size:15px;">${char['AC']||'-'}</strong></div>
                    <div class="dnd-detail-stat-item"><span style="color:#888">先攻</span> <strong>${char['先攻加值']||'+0'}</strong></div>
                    <div class="dnd-detail-stat-item"><span style="color:#888">感知</span> <strong>${char['被动感知']||'10'}</strong></div>
                    <div class="dnd-detail-stat-item"><span style="color:#888">速度</span> <strong>${char['速度']||'-'}</strong></div>
                </div>

                <div class="dnd-attr-grid">
                    ${['STR','DEX','CON','INT','WIS','CHA'].map(attr => `
                        <div class="dnd-attr-box">
                            <div class="dnd-attr-val">${stats[attr]||10}</div>
                            <div class="dnd-attr-mod">${getMod(stats[attr]||10)}</div>
                            <div class="dnd-attr-lbl">${attr}</div>
                        </div>
                    `).join('')}
                </div>

                ${(res['法术位'] || res['职业资源']) ? `
                <div class="dnd-detail-section">
                    <div class="dnd-detail-title">资源</div>
                    <div style="font-size:12px;color:var(--dnd-text-main)">
                        ${res['法术位'] ? `<div style="margin-bottom:4px;">${this.formatSpellSlots(res['法术位'])}</div>` : ''}
                        ${res['职业资源'] ? `<div>${this.formatClassRes(res['职业资源'])}</div>` : ''}
                        <div style="margin-top:4px;color:#aaa">
                            ${res['生命骰'] ? `HD: ${res['生命骰']} ` : ''}
                            ${res['金币'] ? `GP: ${res['金币']}` : ''}
                        </div>
                    </div>
                </div>` : ''}

                ${skills.length > 0 ? `
                <div class="dnd-detail-section">
                    <div class="dnd-detail-title">技能 & 法术 (${skills.length})</div>
                    <div class="dnd-tag-list">
                        ${skills.map((s, i) => {
                            return `<div class="dnd-tag dnd-skill-trigger" onclick="window.DND_Dashboard_UI.handleSkillClick(${i}, event)">${s['技能名称']}</div>`;
                        }).join('')}
                    </div>
                </div>` : ''}

                ${feats.length > 0 ? `
                <div class="dnd-detail-section">
                    <div class="dnd-detail-title">专长 (${feats.length})</div>
                    <div class="dnd-tag-list">
                        ${feats.map((f, i) => {
                            return `<div class="dnd-tag dnd-feat-trigger" onclick="window.DND_Dashboard_UI.handleFeatClick(${i}, event)">${f['专长名称']}</div>`;
                        }).join('')}
                    </div>
                </div>` : ''}

                <div class="dnd-detail-section">
                    <div class="dnd-detail-title" id="dnd-bio-toggle">背景故事 <span style="float:right">▼</span></div>
                    <div id="dnd-bio-content" style="display:none;font-size:12px;color:#ccc;line-height:1.5;margin-top:5px;">
                        ${char['背景故事'] || '暂无背景故事'}
                    </div>
                </div>
            </div>
        `;
        
        $card.html(html);

        // 绑定事件
        $card.find('#dnd-card-close').on('click', () => {
            this.hideCharacterCard();
            this.hideDetailPopup();
        });
        
        $card.find('#dnd-bio-toggle').on('click', function() {
            const $content = $('#dnd-bio-content');
            if ($content.is(':visible')) {
                $content.hide();
                $(this).find('span').text('▼');
            } else {
                $content.show();
                $(this).find('span').text('▲');
            }
        });

        // ========== 智能定位逻辑 ==========
        const { window: coreWin } = getCore();
        const $w = $(coreWin);
        const winW = $w.width();
        const winH = $w.height();
        const isMobile = winW < 768;
        
        if (isMobile) {
            $card.css({
                top: '10px',
                left: '50%',
                right: 'auto',
                bottom: 'auto'
            }).addClass('visible');
        } else {
            $card.removeClass('visible').css({
                display: 'flex',
                visibility: 'hidden',
                top: '-9999px',
                left: '-9999px'
            });
            
            requestAnimationFrame(() => {
                const cardW = $card.outerWidth() || 380;
                const cardH = $card.outerHeight() || 500;
                const padding = 15;
                
                const clickX = this._lastClickPos.x || winW / 2;
                const clickY = this._lastClickPos.y || 100;
                
                let left, top;
                
                if (clickX + cardW + padding < winW) {
                    left = clickX + padding;
                } else if (clickX - cardW - padding > 0) {
                    left = clickX - cardW - padding;
                } else {
                    left = Math.max(padding, (winW - cardW) / 2);
                }
                
                top = clickY - 50; 
                
                if (top < padding) {
                    top = padding;
                }
                
                if (top + cardH > winH - padding) {
                    top = Math.max(padding, winH - cardH - padding);
                }
                
                left = Math.max(padding, Math.min(left, winW - cardW - padding));
                top = Math.max(padding, Math.min(top, winH - cardH - padding));
                
                $card.css({
                    top: top + 'px',
                    left: left + 'px',
                    right: 'auto',
                    bottom: 'auto',
                    display: '', 
                    visibility: '' 
                }).addClass('visible');
            });
        }
    },

    hideCharacterCard() {
        $('#dnd-char-detail-card-el').removeClass('visible');
    },

    handleSkillClick(idx, event) {
        console.log('[DND Dashboard] handleSkillClick', idx);
        if (event) { event.stopPropagation(); event.preventDefault(); }
        
        const { $ } = getCore();
        const $card = $('#dnd-char-detail-card-el');
        const charId = $card.data('charId');
        
        if (!charId) { console.error('No charId found'); return; }
        
        const skills = DataManager.getCharacterSkills(charId);
        const skill = skills[idx];
        
        if (!skill) { console.error('Skill not found', idx); return; }
        
        const safeName = (skill['技能名称']||'').replace(/'/g, "\\'");
        const safeRange = (skill['射程']||'接触').replace(/'/g, "\\'");
        const html = `
            <div style="color:var(--dnd-text-highlight);font-weight:bold;border-bottom:1px solid #444;margin-bottom:5px;padding-bottom:3px;display:flex;justify-content:space-between;align-items:center;">
                <span>${skill['技能名称']} <span style="font-size:10px;color:#888;font-weight:normal">(${skill['环阶']||'-'} · ${skill['学派']||'-'})</span></span>
                <button class="dnd-clickable" style="background:var(--dnd-accent-green);border:none;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;cursor:pointer;"
                    onclick="window.DND_Dashboard_UI.handleCastClick('${safeName}', '${safeRange}', '${skill['环阶']||''}', 'skill')">
                    ✨ 施放
                </button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:11px;color:#aaa;margin-bottom:8px;">
                <div>时间: ${skill['施法时间']||'-'}</div>
                <div>射程: ${skill['射程']||'-'}</div>
                <div>成分: ${skill['成分']||'-'}</div>
                <div>持续: ${skill['持续时间']||'-'}</div>
            </div>
            <div style="line-height:1.4;color:#ccc;">${skill['效果描述']||'无描述'}</div>
        `;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },
    
    handleFeatClick(idx, event) {
        console.log('[DND Dashboard] handleFeatClick', idx);
        if (event) { event.stopPropagation(); event.preventDefault(); }
        
        const { $ } = getCore();
        const $card = $('#dnd-char-detail-card-el');
        const charId = $card.data('charId');
        
        if (!charId) { console.error('No charId found'); return; }
        
        const feats = DataManager.getCharacterFeats(charId);
        const feat = feats[idx];
        
        if (!feat) { console.error('Feat not found', idx); return; }
        
        const html = `
            <div style="color:var(--dnd-text-highlight);font-weight:bold;border-bottom:1px solid #444;margin-bottom:5px;padding-bottom:3px;">
                ${feat['专长名称']} <span style="font-size:10px;color:#888;font-weight:normal">(${feat['类别']||'-'})</span>
            </div>
            <div style="font-size:11px;color:#aaa;margin-bottom:5px;">前置: ${feat['前置条件']||'无'}</div>
            <div style="line-height:1.4;color:#ccc;">${feat['效果描述']||'无描述'}</div>
        `;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // ==========================================
    // 角色创建面板 (AI 多轮对话引导)
    // ==========================================
    
    // [新增] 保存角色创建状态
    _charCreatorState: null,
    _charCreatorLoading: false,

    // [新增] 启动升级流程
    async startLevelUp(charId) {
        const { $ } = getCore();
        
        // 1. 获取角色数据
        const party = DataManager.getPartyData();
        const char = party.find(p => p.PC_ID === charId || p.CHAR_ID === charId || p.姓名 === charId);
        
        if (!char) {
            NotificationSystem.error('未找到角色数据');
            return;
        }

        // 2. 构建结构化数据供 AI 参考
        const skills = DataManager.getCharacterSkills(charId);
        const feats = DataManager.getCharacterFeats(charId);
        const stats = DataManager.parseValue(char['属性值'], 'stats') || {};
        
        // 简化的数据重构
        const currentData = {
            name: char['姓名'],
            race_gender_age: char['种族/性别/年龄'],
            class: char['职业'],
            level: parseInt(char['等级']) || 1,
            stats: stats,
            hp: char['HP'],
            xp: char['经验值'],
            spells: skills.filter(s => s['技能类型'] === '法术').map(s => ({
                name: s['技能名称'],
                level: s['环阶'] || 0,
                desc: s['效果描述']
            })),
            features: feats.map(f => ({
                name: f['专长名称'],
                desc: f['效果描述']
            })),
            background: char['背景故事']
        };
        
        // 3. 初始化状态
        // [新增] 获取启用的世界书内容，用于自定义世界观支持
        const worldInfo = await TavernAPI.getEnabledWorldInfo();

        this._charCreatorState = {
            mode: 'levelup', // 标记为升级模式
            targetCharId: charId,
            apiConfig: await SettingsManager.getAPIConfig(),
            modelList: [],
            conversationHistory: [],
            characterData: currentData, // 初始数据为当前状态
            isGenerating: false,
            currentStep: 'chatting', // 直接进入对话
            characterType: 'pc', // 默认为 PC，实际上会更新现有角色
            worldInfo: worldInfo, // 保存世界书内容
            useWorldInfo: true // 默认开启世界书参考
        };
        
        // 4. 切换面板并确保显示
        const mainUI = (typeof this.renderPanel === 'function') ? this : window.DND_Dashboard_UI;
        if (mainUI) {
            // [Fix] 先更新侧边栏选中状态，防止 setState('full') 自动渲染回 party tab
            const { $ } = getCore();
            $('.dnd-nav-item').removeClass('active');
            $('.dnd-nav-item[data-target="create"]').addClass('active');

            // 确保切换到完整面板模式
            if (typeof mainUI.setState === 'function') {
                mainUI.setState('full');
            }
            // 再次强制渲染 create 面板 (双重保险)
            if (typeof mainUI.renderPanel === 'function') {
                mainUI.renderPanel('create');
            }
        }
        
        // 5. 发送初始系统消息
        this.sendCreatorMessage(null, true);
    },

    saveCreatorState() {
        if (this._charCreatorState) {
            safeSave('dnd_creator_state', JSON.stringify(this._charCreatorState));
        }
    },

    // [新增] 格式化聊天消息 (Markdown + 清理数据块)
    formatChatMessage(content) {
        if (!content) return '';
        
        // 1. 移除 CHARACTER_OPTIONS 和 CHARACTER_DATA 块
        let text = content
            .replace(/```CHARACTER_OPTIONS\s*[\s\S]*?```/g, '')
            .replace(/```CHARACTER_DATA\s*[\s\S]*?```/g, '')
            .trim();
        
        // 2. HTML 转义 (基本)
        text = text
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">");

        // 3. Markdown 渲染
        // Code blocks
        text = text.replace(/```([\s\S]*?)```/g, '<pre class="dnd-md-pre"><code>$1</code></pre>');
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code class="dnd-md-code">$1</code>');
        // Headers
        text = text.replace(/^### (.*$)/gm, '<h3 class="dnd-md-h3">$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2 class="dnd-md-h2">$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1 class="dnd-md-h1">$1</h1>');
        // Bold & Italic
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Lists
        text = text.replace(/^\s*-\s+(.*$)/gm, '<li class="dnd-md-li">$1</li>');
        
        return text;
    },

    renderCharacterCreationPanel($container) {
        const { $ } = getCore();
        
        // 获取 API 预设列表
        const presets = TavernAPI.getPresets();
        
        // 初始化角色创建状态 (支持持久化恢复)
        if (!this._charCreatorState) {
            // 防止重复加载
            if (this._charCreatorLoading) {
                $container.html('<div style="padding:50px;text-align:center;color:#888;">⏳ 正在恢复会话...</div>');
                return;
            }

            this._charCreatorLoading = true;
            $container.html('<div style="padding:50px;text-align:center;color:#888;">⏳ 正在初始化...</div>');

            // 尝试从存储加载状态
            DBAdapter.getSetting('dnd_creator_state').then(async savedState => {
                this._charCreatorLoading = false;
                
                if (savedState) {
                    try {
                        this._charCreatorState = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
                        console.log('[DND Creator] 已恢复上次未完成的创建会话');
                    } catch(e) { console.error('[DND Creator] 状态解析失败', e); }
                }

                // 如果仍未初始化 (无存档或解析失败)，则使用默认值
                if (!this._charCreatorState) {
                    let apiConfig = { url: '', key: '', model: '' };
                    
                    // [新增] 获取世界书内容
                    const worldInfo = await TavernAPI.getEnabledWorldInfo();

                    this._charCreatorState = {
                        selectedPresetId: null,
                        apiConfig: apiConfig,
                        modelList: [],
                        conversationHistory: [],
                        characterData: {},
                        isGenerating: false,
                        currentStep: 'init',
                        characterType: 'pc',
                        worldInfo: worldInfo,
                        useWorldInfo: true
                    };
                    
                    // 异步加载全局 API 配置 (仅在全新开始时加载)
                    SettingsManager.getAPIConfig().then(config => {
                        if (config && config.url) {
                            if (this._charCreatorState) {
                                this._charCreatorState.apiConfig = config;
                            }
                        }
                        // 加载配置后刷新显示
                        this.renderCharacterCreationPanel($container);
                    });
                    return; // 等待回调刷新
                }
                
                // 状态已就绪，刷新显示
                this.renderCharacterCreationPanel($container);
            });
            return; // 等待异步加载
        }
        
        const state = this._charCreatorState;
        
        // 构建模型选择器 HTML
        let modelOptionsHtml = '<option value="">-- 请先获取模型 --</option>';
        if (state.modelList && state.modelList.length > 0) {
            modelOptionsHtml = '<option value="">-- 选择模型 --</option>';
            state.modelList.forEach(m => {
                const selected = state.apiConfig.model === m ? 'selected' : '';
                modelOptionsHtml += `<option value="${m}" ${selected}>${m}</option>`;
            });
        } else if (state.apiConfig.model) {
            // 如果有保存的模型但没列表，先显示当前保存的
            modelOptionsHtml = `<option value="${state.apiConfig.model}" selected>${state.apiConfig.model}</option>`;
        }
        
        // 对话历史 HTML
        let chatHistoryHtml = '';
        if (state.conversationHistory.length > 0) {
            state.conversationHistory.forEach((msg, idx) => {
                const isUser = msg.role === 'user';
                const bgColor = isUser ? 'rgba(52, 152, 219, 0.1)' : 'rgba(155, 89, 182, 0.1)';
                const borderColor = isUser ? '#3498db' : '#9b59b6';
                const icon = isUser ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
                chatHistoryHtml += `
                    <div class="dnd-chat-msg dnd-anim-entry" style="animation-delay:${idx * 0.05}s; background:${bgColor}; border-left:3px solid ${borderColor}; padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;">${icon} ${isUser ? '你' : 'AI 向导'}</div>
                        <div style="color:var(--dnd-text-main);line-height:1.5;white-space:pre-wrap;">${this.formatChatMessage(msg.content)}</div>
                    </div>
                `;
            });
        }
        
        // 当前步骤提示
        let stepHint = '';
        switch(state.currentStep) {
            case 'init':
                stepHint = '选择 API 预设后，点击"开始创建"与 AI 向导对话，逐步构建你的角色。';
                break;
            case 'chatting':
                stepHint = '与 AI 向导对话中...回答问题或提出你的想法，AI 会帮助你完善角色设定。';
                break;
            case 'reviewing':
                stepHint = '角色信息已生成！请检查下方预览，确认无误后点击"确认创建"。';
                break;
            case 'complete':
                stepHint = '🎉 角色创建完成！数据已保存到角色卡。';
                break;
        }
        
        const isLevelUp = state.mode === 'levelup';
        const title = isLevelUp ? '🆙 角色升级向导' : '⚔️ AI 角色创建向导';
        
        const html = `
            <div class="dnd-char-creator-panel" style="max-width:800px;margin:0 auto;">
                <!-- 标题区 -->
                <div style="text-align:center;margin-bottom:20px;">
                    <h2 style="color:var(--dnd-text-highlight);font-family:var(--dnd-font-serif);margin:0 0 10px 0;">
                        ${title}
                    </h2>
                    <p style="color:#888;font-size:13px;margin:0;">${stepHint}</p>
                </div>
                
                <!-- 设置区域 -->
                <div style="background:rgba(0,0,0,0.3);padding:15px;border-radius:6px;margin-bottom:15px;border:1px solid var(--dnd-border-inner);">
                    <div style="display:flex;align-items:center;gap:15px;flex-wrap:wrap;">
                        <!-- 角色类型选择 (升级模式下隐藏) -->
                        <div style="min-width:150px; ${isLevelUp ? 'display:none;' : ''}">
                            <label style="font-size:12px;color:#888;display:block;margin-bottom:5px;">角色类型</label>
                            <div style="display:flex;gap:5px;">
                                <button id="dnd-creator-type-pc" class="dnd-clickable" style="
                                    flex:1;
                                    padding:8px 12px;
                                    background:${state.characterType === 'pc' ? 'var(--dnd-border-gold)' : '#1a1a1c'};
                                    border:1px solid ${state.characterType === 'pc' ? 'var(--dnd-border-gold)' : 'var(--dnd-border-inner)'};
                                    color:${state.characterType === 'pc' ? '#000' : 'var(--dnd-text-main)'};
                                    border-radius:4px;
                                    font-size:12px;
                                    cursor:pointer;
                                " ${state.currentStep !== 'init' ? 'disabled' : ''}><i class="fa-solid fa-user"></i> 主角</button>
                                <button id="dnd-creator-type-party" class="dnd-clickable" style="
                                    flex:1;
                                    padding:8px 12px;
                                    background:${state.characterType === 'party' ? 'var(--dnd-border-gold)' : '#1a1a1c'};
                                    border:1px solid ${state.characterType === 'party' ? 'var(--dnd-border-gold)' : 'var(--dnd-border-inner)'};
                                    color:${state.characterType === 'party' ? '#000' : 'var(--dnd-text-main)'};
                                    border-radius:4px;
                                    font-size:12px;
                                    cursor:pointer;
                                " ${state.currentStep !== 'init' ? 'disabled' : ''}><i class="fa-solid fa-users"></i> 队友</button>
                            </div>
                        </div>
                        
                        <!-- API 状态显示 -->
                        <div style="flex:1;min-width:300px;background:rgba(0,0,0,0.2);padding:10px;border-radius:4px;border:1px solid var(--dnd-border-inner);">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                <label style="font-size:12px;color:#888;">API 状态</label>
                                <div style="font-size:11px;color:${state.apiConfig.key ? '#2ecc71' : '#e74c3c'}">
                                    ${state.apiConfig.key ? '<i class="fa-solid fa-check-circle"></i> 已配置' : '<i class="fa-solid fa-times-circle"></i> 未配置'}
                                </div>
                            </div>
                            <div style="font-size:11px;color:#aaa;margin-bottom:8px;">
                                URL: ${state.apiConfig.url || '未设置'}<br>
                                Model: ${state.apiConfig.model || '未设置'}
                            </div>
                            
                            <!-- 世界书开关 -->
                            <div style="margin-bottom:8px; display:flex; align-items:center; gap:5px;">
                                <input type="checkbox" id="dnd-creator-use-worldinfo" ${state.useWorldInfo !== false ? 'checked' : ''} style="cursor:pointer;">
                                <label for="dnd-creator-use-worldinfo" style="font-size:12px; color:#ccc; cursor:pointer;" title="开启后，升级/创建时将参考当前启用的世界书内容">📚 参考启用世界书</label>
                            </div>

                            <button type="button" onclick="window.DND_Dashboard_UI.renderPanel('settings')" class="dnd-clickable" style="width:100%;padding:6px;background:#2a2a2c;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer;font-size:12px;">
                                <i class="fa-solid fa-cog"></i> 前往设置配置 API
                            </button>
                        </div>
                        <div style="display:flex;gap:10px;">
                            ${state.currentStep === 'init' ? `
                                <button id="dnd-creator-start-btn" class="dnd-clickable" style="
                                    background:linear-gradient(135deg, var(--dnd-accent-green), #27ae60);
                                    border:none;
                                    color:#fff;
                                    padding:10px 20px;
                                    border-radius:4px;
                                    cursor:pointer;
                                    font-weight:bold;
                                    font-size:13px;
                                "><i class="fa-solid fa-bolt"></i> 开始创建</button>
                            ` : ''}
                            ${state.currentStep !== 'init' ? `
                                <button id="dnd-creator-reset-btn" class="dnd-clickable" style="
                                    background:rgba(192, 57, 43, 0.2);
                                    border:1px solid #c0392b;
                                    color:#e74c3c;
                                    padding:8px 15px;
                                    border-radius:4px;
                                    cursor:pointer;
                                    font-size:12px;
                                "><i class="fa-solid fa-sync"></i> 重新开始</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- 对话区域 -->
                <div style="display:flex;gap:15px;flex-wrap:wrap;">
                    <!-- 左侧：对话历史 -->
                    <div style="flex:2;min-width:300px;">
                        <div style="background:rgba(0,0,0,0.2);border:1px solid var(--dnd-border-inner);border-radius:6px;overflow:hidden;">
                            <div style="background:rgba(255,255,255,0.05);padding:10px 15px;border-bottom:1px solid var(--dnd-border-inner);">
                                <span style="color:var(--dnd-text-header);font-weight:bold;"><i class="fa-solid fa-comments"></i> 对话记录</span>
                                <span style="float:right;font-size:11px;color:#666;">${state.conversationHistory.length} 条消息</span>
                            </div>
                            <div id="dnd-creator-chat-history" style="height:350px;overflow-y:auto;padding:15px;">
                                ${chatHistoryHtml || '<div style="color:#666;text-align:center;padding:50px 20px;">对话将在这里显示...<br><br>点击"开始创建"与 AI 向导对话</div>'}
                            </div>
                        </div>
                        
                        <!-- 输入区 -->
                        <div style="margin-top:10px;display:flex;gap:10px;">
                            <button id="dnd-creator-stats-btn" class="dnd-clickable" style="
                                background:rgba(255,255,255,0.1);
                                border:1px solid #555;
                                color:#ccc;
                                padding:0 12px;
                                border-radius:4px;
                                cursor:pointer;
                                font-size:16px;
                            " title="属性生成器"><i class="fa-solid fa-sort-numeric-down"></i></button>
                            <input type="text" id="dnd-creator-user-input" placeholder="输入你的回答或想法..." style="
                                flex:1;
                                padding:10px 15px;
                                background:#1a1a1c;
                                border:1px solid var(--dnd-border-inner);
                                color:var(--dnd-text-main);
                                border-radius:4px;
                                font-size:13px;
                            " ${state.currentStep === 'init' || state.isGenerating ? 'disabled' : ''}>
                            <button id="dnd-creator-send-btn" class="dnd-clickable" style="
                                background:var(--dnd-border-gold);
                                border:none;
                                color:#000;
                                padding:10px 20px;
                                border-radius:4px;
                                cursor:pointer;
                                font-weight:bold;
                            " ${state.currentStep === 'init' || state.isGenerating ? 'disabled' : ''}>
                                ${state.isGenerating ? '<i class="fa-solid fa-hourglass-half"></i> 生成中...' : '<i class="fa-solid fa-paper-plane"></i> 发送'}
                            </button>
                        </div>
                        
                        <!-- 快捷回复按钮 -->
                        <div id="dnd-creator-quick-replies" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                            <!-- 动态生成 -->
                        </div>
                    </div>
                    
                    <!-- 右侧：角色预览 -->
                    <div style="flex:1;min-width:250px;">
                        <div style="background:rgba(0,0,0,0.2);border:1px solid var(--dnd-border-gold);border-radius:6px;overflow:hidden;">
                            <div style="background:linear-gradient(135deg, rgba(157, 139, 108, 0.2), rgba(157, 139, 108, 0.1));padding:10px 15px;border-bottom:1px solid var(--dnd-border-gold);">
                                <span style="color:var(--dnd-text-highlight);font-weight:bold;"><i class="fa-solid fa-clipboard-list"></i> 角色预览</span>
                            </div>
                            <div id="dnd-creator-preview" style="padding:15px;min-height:300px;">
                                ${this.renderCharacterPreview(state.characterData)}
                            </div>
                        </div>
                        
                        ${state.currentStep === 'reviewing' ? `
                            <div style="margin-top:15px;display:flex;gap:10px;">
                                <button id="dnd-creator-confirm-btn" class="dnd-clickable" style="
                                    flex:1;
                                    background:linear-gradient(135deg, var(--dnd-accent-green), #27ae60);
                                    border:none;
                                    color:#fff;
                                    padding:12px;
                                    border-radius:4px;
                                    cursor:pointer;
                                    font-weight:bold;
                                "><i class="fa-solid fa-check-circle"></i> 确认创建</button>
                                <button id="dnd-creator-modify-btn" class="dnd-clickable" style="
                                    background:rgba(241, 196, 15, 0.2);
                                    border:1px solid #f1c40f;
                                    color:#f1c40f;
                                    padding:12px 20px;
                                    border-radius:4px;
                                    cursor:pointer;
                                "><i class="fa-solid fa-pen"></i> 继续修改</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        $container.html(html);
        
        // 绑定事件
        this.bindCharacterCreatorEvents($container);
    },

    // [新增] 显示属性生成器
    showStatsGenerator(e) {
        const html = `
            <div style="padding-bottom:10px; border-bottom:1px solid #444; margin-bottom:10px; font-weight:bold; color:var(--dnd-text-highlight);">
                🎲 属性分配生成器
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <!-- 标准数列 -->
                <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px;">
                    <div style="font-size:13px; font-weight:bold; margin-bottom:5px;">1. 标准数列 (Standard Array)</div>
                    <div style="font-family:monospace; color:#ccc; margin-bottom:5px;">[15, 14, 13, 12, 10, 8]</div>
                    <button onclick="window.DND_Dashboard_UI.applyStatsOption('standard')" style="width:100%; padding:5px; background:#333; border:1px solid #555; color:#fff; border-radius:3px; cursor:pointer;">使用此数列</button>
                </div>

                <!-- 购点法 -->
                <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px;">
                    <div style="font-size:13px; font-weight:bold; margin-bottom:5px;">2. 购点法 (Point Buy)</div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="window.DND_Dashboard_UI.applyStatsOption('pointbuy_27')" style="flex:1; padding:5px; background:#333; border:1px solid #555; color:#fff; border-radius:3px; cursor:pointer;">标准 (27点)</button>
                        <button onclick="window.DND_Dashboard_UI.applyStatsOption('pointbuy_32')" style="flex:1; padding:5px; background:#333; border:1px solid #555; color:#fff; border-radius:3px; cursor:pointer;">宽裕 (32点)</button>
                    </div>
                </div>

                <!-- 骰子决定 -->
                <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px;">
                    <div style="font-size:13px; font-weight:bold; margin-bottom:5px;">3. 骰子决定 (4d6 drop lowest)</div>
                    <div id="dnd-stats-roll-result" style="font-family:monospace; color:var(--dnd-text-highlight); margin-bottom:5px; min-height:20px; font-size:14px; text-align:center;">???</div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="window.DND_Dashboard_UI.performStatsRoll()" style="flex:1; padding:5px; background:var(--dnd-border-gold); color:#000; border:none; border-radius:3px; cursor:pointer; font-weight:bold;">🎲 投掷 (x6)</button>
                        <button id="dnd-btn-use-roll" onclick="window.DND_Dashboard_UI.confirmStatsRoll()" style="flex:1; padding:5px; background:#333; border:1px solid #555; color:#fff; border-radius:3px; cursor:pointer;" disabled>使用结果</button>
                    </div>
                </div>
            </div>
        `;
        
        this.showItemDetailPopup(html, e.clientX, e.clientY);
    },

    applyStatsOption(type) {
        let text = '';
        if (type === 'standard') text = "我选择使用【标准数列】进行属性分配：15, 14, 13, 12, 10, 8。请帮我分配到合适的属性上。";
        if (type === 'pointbuy_27') text = "我选择使用【标准购点法 (27点)】。请帮我规划属性分配。";
        if (type === 'pointbuy_32') text = "我选择使用【宽裕购点法 (32点)】。请帮我规划属性分配。";
        
        if (text) {
            this.fillCreatorInput(text);
            this.hideDetailPopup();
        }
    },

    performStatsRoll() {
        const roll4d6k3 = () => {
            const rolls = [
                Math.floor(Math.random()*6)+1,
                Math.floor(Math.random()*6)+1,
                Math.floor(Math.random()*6)+1,
                Math.floor(Math.random()*6)+1
            ];
            rolls.sort((a,b) => b-a);
            return rolls[0] + rolls[1] + rolls[2];
        };
        
        const results = [];
        for(let i=0; i<6; i++) results.push(roll4d6k3());
        
        const resultStr = results.join(', ');
        const { $ } = getCore();
        $('#dnd-stats-roll-result').text(`[${resultStr}]`);
        $('#dnd-btn-use-roll').prop('disabled', false).attr('data-results', resultStr);
    },

    confirmStatsRoll() {
        const { $ } = getCore();
        const res = $('#dnd-btn-use-roll').attr('data-results');
        if (res) {
            this.fillCreatorInput(`我选择使用【骰子投掷结果】：[${res}]。请帮我分配到合适的属性上。`);
            this.hideDetailPopup();
        }
    },

    fillCreatorInput(text) {
        const { $ } = getCore();
        const $input = $('#dnd-creator-user-input');
        const current = $input.val();
        $input.val(current ? current + ' ' + text : text).focus();
    },

    // 渲染角色预览
    renderCharacterPreview(data) {
        if (!data || Object.keys(data).length === 0) {
            return `
                <div style="color:#666;text-align:center;padding:30px 15px;">
                    <div style="font-size:48px;margin-bottom:15px;opacity:0.3;"><i class="fa-solid fa-hat-wizard"></i></div>
                    <div>角色信息将随对话逐步生成...</div>
                </div>
            `;
        }
        
        // 解析属性值
        const stats = data.stats || {};
        const getMod = (val) => {
            const v = parseInt(val) || 10;
            const mod = Math.floor((v - 10) / 2);
            return mod >= 0 ? `+${mod}` : mod;
        };

        // 辅助函数: 渲染列表
        const renderList = (title, list, renderer) => {
            if (!list || list.length === 0) return '';
            return `
                <div style="margin-top:10px;">
                    <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:5px;font-size:12px;">${title}</div>
                    <div>${list.map(renderer).join('')}</div>
                </div>
            `;
        };

        // 资源显示
        let resHtml = '';
        if (data.resources) {
            const r = data.resources;
            let items = [];
            if (r.spell_slots) Object.keys(r.spell_slots).forEach(k => items.push(`${k}: ${r.spell_slots[k]}`));
            if (r.class_resources) Object.keys(r.class_resources).forEach(k => items.push(`${k}: ${r.class_resources[k]}`));
            if (r.hit_dice) items.push(`生命骰: ${r.hit_dice}`);
            
            if (items.length > 0) {
                resHtml = `
                    <div style="margin-bottom:10px;font-size:11px;background:rgba(255,255,255,0.05);padding:6px;border-radius:4px;">
                        <div style="color:#888;margin-bottom:2px;">资源</div>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;color:#ccc;">
                            ${items.map(i => `<span>${i}</span>`).join('<span style="color:#444">|</span>')}
                        </div>
                    </div>
                `;
            }
        }

        // 熟练项
        let profHtml = '';
        const skills = data.skill_proficiencies || [];
        const saves = data.saving_throws || [];
        if (skills.length > 0 || saves.length > 0) {
            profHtml = `
                <div style="font-size:11px;margin-bottom:10px;color:#aaa;">
                    ${saves.length ? `<div><span style="color:#888">豁免:</span> ${saves.join(', ')}</div>` : ''}
                    ${skills.length ? `<div><span style="color:#888">技能:</span> ${skills.join(', ')}</div>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="dnd-preview-content">
                <!-- 基本信息 -->
                <div style="text-align:center;margin-bottom:15px;">
                    <div style="font-size:20px;font-weight:bold;color:var(--dnd-text-highlight);">${data.name || '未命名'}</div>
                    <div style="font-size:12px;color:#888;margin-top:3px;">${data.race_gender_age || (data.race || '?')} · ${data.class || '?'} · Lv.${data.level || 1}</div>
                </div>
                
                <!-- 属性值 -->
                ${Object.keys(stats).length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:5px;margin-bottom:15px;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;">
                    ${['STR','DEX','CON','INT','WIS','CHA'].map(attr => `
                        <div style="text-align:center;">
                            <div style="font-size:12px;font-weight:bold;color:var(--dnd-text-header);">${stats[attr] || 10}</div>
                            <div style="font-size:9px;color:#666;">${getMod(stats[attr])} ${attr}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resHtml}
                ${profHtml}

                <!-- 特性 & 专长 -->
                ${renderList('<i class="fa-solid fa-bolt"></i> 特性 & 专长', data.features, f => `
                    <div style="margin-bottom:4px;font-size:12px;">
                        <span style="color:#ccc;font-weight:bold;">${f.name}</span>
                        <div style="color:#888;font-size:10px;line-height:1.3;">${f.desc || ''}</div>
                    </div>
                `)}

                <!-- 法术 -->
                ${renderList('<i class="fa-solid fa-bolt"></i> 法术', data.spells, s => `
                    <div style="margin-bottom:4px;font-size:12px;">
                        <span style="color:#b585ff;font-weight:bold;">${s.name}</span>
                        <span style="color:#666;font-size:10px;">(${s.level===0?'戏法':s.level+'环'})</span>
                        <div style="color:#888;font-size:10px;line-height:1.3;">${s.desc || ''}</div>
                    </div>
                `)}
                
                <!-- 其他信息 -->
                ${data.background ? `<div style="font-size:12px;margin-top:10px;"><span style="color:#888;">背景:</span> ${data.background}</div>` : ''}
                ${data.alignment ? `<div style="font-size:12px;"><span style="color:#888;">阵营:</span> ${data.alignment}</div>` : ''}
                ${data.personality ? `<div style="font-size:12px;"><span style="color:#888;">性格:</span> ${data.personality}</div>` : ''}
                ${data.backstory ? `<div style="font-size:11px;color:#aaa;margin-top:10px;padding-top:10px;border-top:1px dashed #444;line-height:1.5;">${data.backstory.substring(0, 200)}${data.backstory.length > 200 ? '...' : ''}</div>` : ''}
            </div>
        `;
    },

    // 绑定角色创建器事件
    bindCharacterCreatorEvents($container) {
        const { $ } = getCore();
        const state = this._charCreatorState;
        
        // 世界书开关
        $container.find('#dnd-creator-use-worldinfo').on('change', async function() {
            state.useWorldInfo = $(this).is(':checked');
            // 如果开启，且之前没有获取过 worldInfo，尝试获取
            if (state.useWorldInfo && !state.worldInfo) {
                const info = await TavernAPI.getEnabledWorldInfo();
                state.worldInfo = info;
            }
            if (typeof window.DND_Dashboard_UI.saveCreatorState === 'function') {
                window.DND_Dashboard_UI.saveCreatorState();
            }
        });

        // 角色类型切换按钮
        $container.find('#dnd-creator-type-pc').on('click', () => {
            if (state.currentStep !== 'init') return;
            state.characterType = 'pc';
            this.saveCreatorState();
            this.renderCharacterCreationPanel($container); // re-render panel
        });
        $container.find('#dnd-creator-type-party').on('click', () => {
            if (state.currentStep !== 'init') return;
            state.characterType = 'party';
            this.saveCreatorState();
            this.renderCharacterCreationPanel($container);
        });

        // 属性生成器按钮
        $container.find('#dnd-creator-stats-btn').on('click', (e) => {
            if ($(e.target).prop('disabled')) return;
            this.showStatsGenerator(e);
        });

        // 开始创建按钮
        $container.find('#dnd-creator-start-btn').on('click', async () => {
            // 检查配置 (从 SettingsManager 获取最新)
            const currentConfig = await SettingsManager.getAPIConfig();
            // 更新本地状态以确保同步
            state.apiConfig = currentConfig;

            if (!state.apiConfig.url || !state.apiConfig.model) {
                NotificationSystem.warning('请先在设置中配置 API 地址和模型', '配置缺失');
                // Use global reference for cross-module call if needed, but this is mixin
                // UIRenderer is 'this' when called
                this.renderPanel('settings');
                return;
            }

            state.currentStep = 'chatting';
            state.conversationHistory = [];
            state.characterData = {};
            this.saveCreatorState(); // 保存状态变更
            
            // 发送初始系统消息给 AI
            await this.sendCreatorMessage(null, true);
        });
        
        // 重置按钮
        $container.find('#dnd-creator-reset-btn').on('click', async () => {
            const confirmed = await NotificationSystem.confirm('确定要重新开始吗？当前对话和角色数据将被清除。', {
                title: '重新开始',
                confirmText: '确定',
                type: 'warning'
            });
            if (confirmed) {
                // [新增] 获取世界书内容
                const worldInfo = await TavernAPI.getEnabledWorldInfo();

                // 重置为初始状态，但保留配置
                this._charCreatorState = {
                    selectedPresetId: state.selectedPresetId,
                    apiConfig: state.apiConfig,
                    modelList: state.modelList,
                    characterType: state.characterType,
                    conversationHistory: [],
                    characterData: {},
                    isGenerating: false,
                    currentStep: 'init',
                    worldInfo: worldInfo,
                    useWorldInfo: true
                };
                this.saveCreatorState(); // 保存（覆盖）旧状态
                this.renderCharacterCreationPanel($container);
            }
        });
        
        // 发送按钮
        $container.find('#dnd-creator-send-btn').on('click', () => {
            const $input = $container.find('#dnd-creator-user-input');
            const text = $input.val().trim();
            if (text) {
                this.sendCreatorMessage(text);
                $input.val('');
            }
        });
        
        // 回车发送
        $container.find('#dnd-creator-user-input').on('keypress', (e) => {
            if (e.which === 13 && !e.shiftKey) {
                e.preventDefault();
                $container.find('#dnd-creator-send-btn').click();
            }
        });
        
        // 确认创建/升级
        $container.find('#dnd-creator-confirm-btn').html(state.mode === 'levelup' ? '<i class="fa-solid fa-check-circle"></i> 确认升级' : '<i class="fa-solid fa-check-circle"></i> 确认创建');
        $container.find('#dnd-creator-confirm-btn').on('click', async () => {
            await this.finalizeCharacterCreation();
        });
        
        // 继续修改
        $container.find('#dnd-creator-modify-btn').on('click', () => {
            state.currentStep = 'chatting';
            this.saveCreatorState();
            this.renderCharacterCreationPanel($container);
        });
        
        // 滚动到底部
        const $chatHistory = $container.find('#dnd-creator-chat-history');
        if ($chatHistory.length) {
            $chatHistory.scrollTop($chatHistory[0].scrollHeight);
        }
    },

    // [新增] 渲染聊天选项
    renderChatOptions(config) {
        const { $ } = getCore();
        const $chatHistory = $('#dnd-creator-chat-history');
        const { question, options, type } = config;
        const isMulti = type === 'multiple';
        
        const buttonsHtml = options.map(opt => {
            const isString = typeof opt === 'string';
            const optName = isString ? opt : (opt.text || opt.label || opt.name || '选项');
            const optDesc = isString ? '' : (opt.desc || opt.description || '');
            // 优先使用 ID 作为返回值，其次是 value，最后是显示名称
            // 如果是对象且没有 id/value，则尝试将其 stringify 作为值 (虽然不推荐，但作为 fallback)
            let optValue = isString ? opt : (opt.id || opt.value || opt.name || optName);
            
            // 如果 value 是对象，转化为字符串，避免 [object Object]
            if (typeof optValue === 'object') {
                optValue = JSON.stringify(optValue);
            }

            return `
            <button class="dnd-creator-option-btn" style="
                background:rgba(255,255,255,0.05);
                border:1px solid var(--dnd-border-gold);
                color:var(--dnd-text-main);
                padding:8px 12px;
                border-radius:4px;
                cursor:pointer;
                text-align:left;
                transition:all 0.2s;
                font-size:13px;
            " onclick="window.DND_Dashboard_UI.handleCreatorOption('${String(optValue).replace(/'/g, "\\'")}', '${isMulti}')">
                <div style="font-weight:bold;">${optName}</div>
                ${optDesc ? `<div style="font-size:11px;color:#aaa;margin-top:2px;">${optDesc}</div>` : ''}
            </button>
        `}).join('');

        const html = `
            <div class="dnd-chat-msg dnd-anim-entry" style="background:rgba(157, 139, 108, 0.1); border-left:3px solid var(--dnd-border-gold); padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                ${question ? `<div style="font-size:12px;color:var(--dnd-text-highlight);margin-bottom:8px;font-weight:bold;"><i class="fa-solid fa-question-circle"></i> ${question}</div>` : ''}
                <div style="display:flex;flex-direction:column;gap:5px;">
                    ${buttonsHtml}
                </div>
            </div>
        `;
        
        $chatHistory.append(html);
        $chatHistory.scrollTop($chatHistory[0].scrollHeight);
    },

    // [新增] 处理选项点击
    handleCreatorOption(value, isMulti) {
        // 暂时只支持单选，多选后续扩展
        // 模拟用户输入
        this.sendCreatorMessage(value);
    },

    // 发送消息给 AI
    async sendCreatorMessage(userMessage, isInitial = false) {
        const { $ } = getCore();
        const state = this._charCreatorState;
        const $chatHistory = $('#dnd-creator-chat-history');
        const $input = $('#dnd-creator-user-input');
        const $sendBtn = $('#dnd-creator-send-btn');
        
        if (state.isGenerating) return;
        state.isGenerating = true;
        
        // 优化：不直接重绘整个面板，而是通过 DOM 操作更新
        $input.prop('disabled', true);
        $sendBtn.text('⏳ 生成中...').prop('disabled', true);
        
        try {
            // 如果有用户消息，立即追加到聊天记录 DOM
            if (userMessage) {
                const idx = state.conversationHistory.length;
                const userMsgHtml = `
                    <div class="dnd-chat-msg dnd-anim-entry" style="background:rgba(52, 152, 219, 0.1); border-left:3px solid #3498db; padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;"><i class="fa-solid fa-user"></i> 你</div>
                        <div style="color:var(--dnd-text-main);line-height:1.5;white-space:pre-wrap;">${this.formatChatMessage(userMessage)}</div>
                    </div>`;
                $chatHistory.append(userMsgHtml);
                $chatHistory.scrollTop($chatHistory[0].scrollHeight);
                
                state.conversationHistory.push({ role: 'user', content: userMessage });
                this.saveCreatorState(); // 保存
            } else if (isInitial) {
                const isLevelUp = state.mode === 'levelup';
                const nextLvl = (state.characterData.level || 1) + 1;
                const initMsg = isLevelUp
                    ? `你好，我是 ${state.characterData.name}，我想从 Lv.${state.characterData.level} 升级到 Lv.${nextLvl}。请引导我完成升级。`
                    : '你好，我想创建一个 DND 5E 角色。请引导我开始。';
                
                state.conversationHistory.push({ role: 'user', content: initMsg });
                this.saveCreatorState(); // 保存
            }

            // 构建发送给 API 的消息数组
            const messages = [];
            const isLevelUp = state.mode === 'levelup';
            
            let systemPrompt = '';
            
            if (isLevelUp) {
                // [新增] 注入世界书内容
                const useWI = state.useWorldInfo !== false;
                const worldInfoStr = (useWI && state.worldInfo) ? `\n\n${state.worldInfo}\n\n注意：上述【当前世界观/规则参考】不仅是背景故事，更是**扩展的游戏规则**。如果世界书中描述了特殊的魔法体系、武术流派或生理特征，请将其转化为具体的**自定义职业、专长、技能或特性**。不要局限于 DND 5E 的标准选项。如果世界书内容与 DND 规则冲突，或提供了全新的机制，**请优先使用世界书内容创造新的游戏规则**。你可以设计全新的职业特性来反映世界书的设定，而不仅仅是重命名现有的 DND 特性。` : '';

                // 升级模式 Prompt
                systemPrompt = `你是一个 DND 5E (及自定义世界观) 角色升级向导。当前用户正在将角色 "${state.characterData.name}" 从等级 ${state.characterData.level} 提升到 ${(state.characterData.level || 1) + 1}。${worldInfoStr}

**当前角色数据:**
\`\`\`json
${JSON.stringify(state.characterData, null, 2)}
\`\`\`

请遵循以下流程引导用户升级：
1. **生命值提升**: 根据职业生命骰（取平均或投掷），计算新的最大HP。
2. **职业特性**: 告知用户新等级获得的职业特性。如果角色是自定义职业或处于自定义世界观下，请**根据世界书推断、设计或询问用户其特性**。不要害怕创造 DND 规则书中没有的能力。
3. **法术/已知法术**: 如果是施法者，引导选择新法术或替换旧法术。
4. **属性提升/专长**: 如果是 4/8/12/16/19 级，引导用户选择属性值提升 (ASI) 或专长。
5. **熟练项加值**: 检查熟练加值是否因等级提升而增加（如 1-4级+2, 5-8级+3）。

在对话中：
- 每次专注于一个升级步骤。
- 当有多个选择时（如选择新法术、专长），**必须**使用 \`CHARACTER_OPTIONS\` 块输出选项，格式如下：
\`\`\`CHARACTER_OPTIONS
{
"question": "请选择...",
"type": "single",
"options": ["选项A", "选项B"]
}
\`\`\`
- 解释规则依据 (DND 5E 规则或世界书自定义规则)。如果使用了自定义规则，请明确指出这是根据世界书设定的。

最后，当升级的所有选择都确定后，输出更新后的 \`CHARACTER_DATA\` 块。**必须包含角色的所有数据（旧数据+新变化），而不仅仅是变化部分。** 格式与创建角色时相同。

\`\`\`CHARACTER_DATA
{
  ... (完整的角色JSON数据，更新了等级、HP、特性、法术等)
}
\`\`\`
`;
            } else {
                // 创建模式 Prompt
                const charTypeLabel = state.characterType === 'pc' ? '主角' : '队友';
                
                // [新增] 注入世界书内容
                const useWI = state.useWorldInfo !== false;
                const worldInfoStr = (useWI && state.worldInfo) ? `\n\n${state.worldInfo}\n\n注意：上述【当前世界观/规则参考】不仅是背景故事，更是**扩展的游戏规则**。请积极从世界书中提取并**创造**新的种族、职业、背景和专长。不要局限于 DND 5E 的标准选项。例如，如果世界书提到了一种特殊的“星能使用者”，你可以为此创建一个全新的职业，并设计其特有的核心能力，而不是强行让用户使用“术士”卡。如果世界书内容提供了全新的机制，**请优先使用世界书内容创造新的游戏规则**。` : '';

                systemPrompt = `你是一个 DND 5E (及自定义世界观) 角色创建向导。你的任务是通过对话引导用户创建一个完整的${charTypeLabel}角色。${worldInfoStr}

请遵循以下流程：
1. 首先询问用户想要创建什么类型的角色（战士、法师、盗贼等），或者让他们描述一个角色概念
2. 根据用户的回答，建议合适的种族和职业组合 (优先参考世界书设定，其次参考 DND 规则)
3. 帮助用户确定属性值分配（使用标准点数购买或让用户自选）
4. 询问角色的背景、性格特点（理想、牵绊、缺陷）
5. 询问角色的外貌特征（发色、眼睛、身高、特征）
6. 帮助用户构思一个简短的背景故事（不超过300字）

在对话过程中，请：
- 每次只问1-2个问题，不要一次问太多
- 提供具体的选项供用户选择（**必须**通过 CHARACTER_OPTIONS 输出）
- 解释你的建议理由
- 保持友好和鼓励的语气

当需要用户做选择时（如选择种族、职业、属性分配方式），请务必输出一个选项块：
\`\`\`CHARACTER_OPTIONS
{
"question": "请选择你的种族...",
"type": "single",
"options": ["人类", "精灵", "矮人", "其他"]
}
\`\`\`

当收集到足够信息后，输出一个特殊格式的角色数据块（严格遵守此JSON格式）：
\`\`\`CHARACTER_DATA
{
"name": "角色全名",
"race_gender_age": "种族/性别/年龄（如：半精灵/男/32岁）",
"class": "职业及子职（如：圣武士(复仇誓言) Lv1）",
"level": 1,
"appearance": "外貌描述（详细的外貌特征）",
"personality": "性格特点（核心性格、理想、牵绊、缺陷）",
"backstory": "背景故事（不超过300字）",
"stats": {"STR": 10, "DEX": 10, "CON": 10, "INT": 10, "WIS": 10, "CHA": 10},
"hp": "当前HP/最大HP（如：12/12）",
"ac": 10,
"initiative": 0,
"speed": "30尺(6格)",
"saving_throws": ["力量", "体质"],
"skill_proficiencies": ["运动", "威吓"],
"passive_perception": 10,
"resources": {
    "spell_slots": {"1级": "3/4"},
    "class_resources": {"动作如潮": "1/1"},
    "hit_dice": "3/3"
},
"features": [
    {"name": "战斗风格(防御)", "type": "职业特性", "desc": "着装护甲时AC+1"},
    {"name": "复苏之风", "type": "职业特性", "desc": "用附赠动作恢复1d10+等级点HP"}
],
"spells": [
    {"name": "魔能爆", "level": 0, "school": "塑能", "time": "1动作", "range": "120尺", "comp": "V,S", "duration": "立即", "desc": "1d10力场伤害..."},
    {"name": "护盾术", "level": 1, "school": "防护", "time": "1反应", "range": "自身", "comp": "V,S", "duration": "1轮", "desc": "AC+5直到回合结束..."}
]${state.characterType === 'party' ? `,
"member_type": "同伴",
"control_method": "AI控制"` : ''}
}
\`\`\`

现在开始与用户对话。`;
            }

            messages.push({ role: 'system', content: systemPrompt });
            state.conversationHistory.forEach(msg => {
                messages.push({ role: msg.role, content: msg.content });
            });
            
            // 调用 API
            const response = await TavernAPI.generate(messages, {
                customConfig: state.apiConfig,
                maxTokens: 4096 // 增加最大 Token 数以防止截断
            });
            
            // 处理响应
            if (response) {
                state.conversationHistory.push({ role: 'assistant', content: response });
                
                // 追加到 DOM
                const aiMsgHtml = `
                    <div class="dnd-chat-msg dnd-anim-entry" style="background:rgba(155, 89, 182, 0.1); border-left:3px solid #9b59b6; padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;"><i class="fa-solid fa-robot"></i> AI 向导</div>
                        <div style="color:var(--dnd-text-main);line-height:1.5;white-space:pre-wrap;">${this.formatChatMessage(response)}</div>
                    </div>`;
                $chatHistory.append(aiMsgHtml);
                
                // [新增] 解析选项
                const optMatch = response.match(/```CHARACTER_OPTIONS\s*([\s\S]*?)```/);
                if (optMatch) {
                    try {
                        const optData = JSON.parse(optMatch[1]);
                        this.renderChatOptions(optData);
                    } catch(e) { console.error('Options parse error', e); }
                }

                $chatHistory.scrollTop($chatHistory[0].scrollHeight);
                
                // 尝试解析角色数据
                const dataMatch = response.match(/```CHARACTER_DATA\s*([\s\S]*?)```/);
                if (dataMatch) {
                    try {
                        const charData = JSON.parse(dataMatch[1]);
                        state.characterData = charData;
                        state.currentStep = 'reviewing';
                        // 更新预览区域
                        $('#dnd-creator-preview').html(this.renderCharacterPreview(state.characterData));
                        console.log('[CharCreator] 角色数据已解析:', charData);
                    } catch(e) {
                        console.error('[CharCreator] 解析角色数据失败:', e);
                    }
                }
                
                // 保存更新后的状态
                this.saveCreatorState();
            }
        } catch (error) {
            console.error('[CharCreator] API 调用失败:', error);
            const errMsgHtml = `
                <div class="dnd-chat-msg dnd-anim-entry" style="background:rgba(192, 57, 43, 0.1); border-left:3px solid #e74c3c; padding:10px 12px; margin-bottom:8px; border-radius:4px;">
                    <div style="font-size:11px;color:#888;margin-bottom:4px;"><i class="fa-solid fa-robot"></i> 系统消息</div>
                    <div style="color:var(--dnd-text-main);line-height:1.5;"><i class="fa-solid fa-times-circle"></i> 抱歉，生成失败：${error.message}</div>
                </div>`;
            $chatHistory.append(errMsgHtml);
            $chatHistory.scrollTop($chatHistory[0].scrollHeight);
            
            state.conversationHistory.push({
                role: 'assistant',
                content: `❌ 抱歉，生成失败：${error.message}\n\n请检查 API 连接或重试。`
            });
        } finally {
            state.isGenerating = false;
            
            // 恢复 UI 状态
            $input.prop('disabled', false).val('').focus();
            $sendBtn.text('📤 发送').prop('disabled', false);
            
            // 如果状态变为 reviewing 且确认按钮未显示（即刚完成解析），则需要完整重绘以显示确认按钮
            // 或者我们可以只追加按钮到 DOM
            if (state.currentStep === 'reviewing' && $('#dnd-creator-confirm-btn').length === 0) {
                // Re-render to show buttons
                this.renderCharacterCreationPanel($('#dnd-creator-chat-history').closest('#dnd-content'));
            }
        }
    },

    // 完成角色创建，保存数据
    async finalizeCharacterCreation() {
        const { $ } = getCore();
        const state = this._charCreatorState;
        const data = state.characterData;
        
        if (!data || !data.name) {
            NotificationSystem.warning('角色数据不完整，无法保存');
            return;
        }
        
        try {
            // 获取原始数据
            const rawData = DataManager.getAllData();
            if (!rawData) {
                throw new Error('无法获取数据库');
            }
            
            // 确定是主角(PC) 还是 队友(Party)
            const isPC = state.characterType === 'pc';
            
            // [新增] 兼容升级模式下的 ID 获取
            const targetId = state.mode === 'levelup' ? state.targetCharId : null;

            // 统一使用 CHARACTER_* 表
            // 查找表对象 (增强查找逻辑，兼容不同前缀)
            const findTable = (frag) => Object.values(rawData).find(s =>
                s.uid === frag ||
                s.uid === `sheet_${frag}` ||
                s.uid === `sheet_CHARACTER_${frag}` ||
                (s.name && s.name.includes(frag))
            );
            
            const mainTable = findTable('CHARACTER_Registry') || findTable('Registry');
            const attrTable = findTable('CHARACTER_Attributes') || findTable('Attributes');
            const resTable = findTable('CHARACTER_Resources') || findTable('Resources');
            const skillLibTable = findTable('SKILL_Library');
            const skillLinkTable = findTable('CHARACTER_Skills');
            const featLibTable = findTable('FEAT_Library');
            const featLinkTable = findTable('CHARACTER_Feats');
            
            if (!mainTable) throw new Error('找不到角色注册表 (CHARACTER_Registry)');
            
            let charId;
            
            if (targetId) {
                charId = targetId; // 升级模式使用现有ID
            } else if (isPC) {
                charId = 'PC_MAIN';
            } else {
                charId = 'ALLY_' + Date.now();
            }
            
            // 辅助函数：更新或插入行
            const updateOrInsert = (table, idVal) => {
                if (!table.content) table.content = [];
                if (table.content.length === 0) return; // 无表头，无法操作
                
                const headers = table.content[0];
                const idIdx = headers.indexOf('CHAR_ID');
                if (idIdx === -1) return;
                
                // 查找现有行
                let rowIndex = -1;
                // 从索引1开始遍历
                for (let i = 1; i < table.content.length; i++) {
                    if (table.content[i][idIdx] === idVal) {
                        rowIndex = i;
                        break;
                    }
                }
                
                // 构建新数据行 (基于 headers)
                const newRow = headers.map((h, i) => {
                    if (h === 'CHAR_ID') return idVal;
                    
                    const oldVal = (rowIndex !== -1 && table.content[rowIndex] && table.content[rowIndex][i] !== undefined)
                        ? table.content[rowIndex][i]
                        : undefined;

                    // 辅助函数：优先使用新数据，如果没有则使用旧数据
                    const val = (v) => (v !== undefined && v !== null && v !== '') ? v : oldVal;

                    // Registry
                    if (h === '成员类型') return isPC ? '主角' : (data.member_type || oldVal || '同伴');
                    if (h === '姓名') return val(data.name);
                    if (h === '种族/性别/年龄') return val(data.race_gender_age) || `${data.race}/-/1`;
                    if (h === '职业') return val(data.class);
                    if (h === '外貌描述') return val(data.appearance);
                    if (h === '性格特点') return val(data.personality);
                    if (h === '背景故事') return val(data.backstory);
                    if (h === '加入时间') return !isPC ? '第1天' : (oldVal || null);
                    
                    // Attributes
                    if (h === '等级') return val(data.level) || 1;
                    if (h === 'HP') return val(data.hp) || '10/10';
                    if (h === 'AC') return val(data.ac) || 10;
                    if (h === '先攻加值') return (data.initiative !== undefined ? data.initiative : oldVal) || 0;
                    if (h === '速度') return val(data.speed) || '30尺';
                    if (h === '属性值') return data.stats ? JSON.stringify(data.stats) : (oldVal || '{}');
                    if (h === '豁免熟练') return data.saving_throws ? JSON.stringify(data.saving_throws) : (oldVal || '[]');
                    if (h === '技能熟练') return data.skill_proficiencies ? JSON.stringify(data.skill_proficiencies) : (oldVal || '[]');
                    if (h === '被动感知') return (data.passive_perception !== undefined ? data.passive_perception : oldVal) || 10;
                    if (h === '经验值' && isPC) {
                        // 如果是升级模式，尝试保留当前经验值并更新上限
                        if (state.mode === 'levelup' && rowIndex !== -1) {
                            const oldVal = table.content[rowIndex][i] || '0/300';
                            const currExp = parseInt(oldVal.split('/')[0]) || 0;
                            
                            // DND 5E 经验值表 (下标对应等级，值为下一级所需经验)
                            // Lv1->Lv2: 300, Lv2->Lv3: 900 ...
                            const xpTable = [
                                0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
                                85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
                            ];
                            
                            const nextLevel = parseInt(data.level) || 1;
                            // 获取下一级所需经验值 (作为分母)
                            // 如果当前是Lv1(nextLevel=1), 目标是300 (xpTable[1])
                            // 如果当前是Lv2(nextLevel=2), 目标是900 (xpTable[2])
                            const nextExp = xpTable[nextLevel] || 355000;
                            
                            return `${currExp}/${nextExp}`;
                        }
                        return '0/300';
                    }
                    
                    // Resources
                    if (h === '法术位') return data.resources?.spell_slots ? JSON.stringify(data.resources.spell_slots) : null;
                    if (h === '职业资源') return data.resources?.class_resources ? JSON.stringify(data.resources.class_resources) : null;
                    if (h === '生命骰') return data.resources?.hit_dice || null;
                    if (h === '金币' && isPC) return 0;
                    
                    // 如果是更新，且没有提供新值，保留旧值
                    if (rowIndex !== -1 && table.content[rowIndex][i] !== undefined) {
                        return table.content[rowIndex][i];
                    }
                    return null;
                });
                
                if (rowIndex !== -1) {
                    table.content[rowIndex] = newRow;
                } else {
                    table.content.push(newRow);
                }
            };
            
            updateOrInsert(mainTable, charId);
            if (attrTable) updateOrInsert(attrTable, charId);
            if (resTable) updateOrInsert(resTable, charId);

            // 处理技能和法术
            const spells = data.spells || [];
            if (spells.length > 0 && skillLibTable && skillLinkTable) {
                const linkHeaders = skillLinkTable.content[0];
                const charIdIdx = linkHeaders.indexOf('CHAR_ID');
                const skillIdIdx = linkHeaders.indexOf('SKILL_ID');

                // [Fix] 清理现有的重复技能 (保留一个，删除多余的)
                if (charIdIdx !== -1 && skillIdIdx !== -1) {
                    const charLinks = skillLinkTable.content.filter(row => row[charIdIdx] === charId);
                    const nameMap = new Map(); // name -> [linkRow...]
                    const rowsToDelete = new Set();

                    charLinks.forEach(linkRow => {
                        const skillId = linkRow[skillIdIdx];
                        const libRow = skillLibTable.content.find(r => r[0] === skillId);
                        if (libRow) {
                            const name = (libRow[1] || '').trim();
                            if (name) {
                                if (!nameMap.has(name)) nameMap.set(name, []);
                                nameMap.get(name).push(linkRow);
                            }
                        }
                    });

                    nameMap.forEach((rows, name) => {
                        if (rows.length > 1) {
                            console.log(`[CharCreator] 清理重复技能: ${name} (删除 ${rows.length - 1} 个)`);
                            // 保留第一个，标记其余为删除
                            for (let i = 1; i < rows.length; i++) {
                                rowsToDelete.add(rows[i]);
                            }
                        }
                    });

                    if (rowsToDelete.size > 0) {
                        skillLinkTable.content = skillLinkTable.content.filter(row => !rowsToDelete.has(row));
                    }
                }

                spells.forEach(spell => {
                    const spellName = (spell.name || '').trim();
                    if (!spellName) return;

                    // [Fix] 预先检查是否已存在同名技能的关联 (防止重复)
                    const matchingSkillIds = skillLibTable.content
                        .filter(row => (row[1] || '').trim() === spellName)
                        .map(row => row[0]);

                    if (charIdIdx !== -1 && skillIdIdx !== -1 && matchingSkillIds.length > 0) {
                        const isAlreadyLinked = skillLinkTable.content.some(row =>
                            row[charIdIdx] === charId && matchingSkillIds.includes(row[skillIdIdx])
                        );
                        if (isAlreadyLinked) return;
                    }

                    // 1. 添加到技能库 (SKILL_Library)
                    let skillId = 'SKILL_' + Math.random().toString(36).substr(2, 8);
                    // 检查是否存在
                    const existingSkill = skillLibTable.content.find(row => (row[1] || '').trim() === spellName);
                    
                    if (existingSkill) {
                        skillId = existingSkill[0]; // 假设第一列是ID
                        // [Fix] 更新描述 (如果 AI 提供了新描述)
                        if (spell.desc) {
                            const descIdx = skillLibTable.content[0].indexOf('效果描述');
                            if (descIdx !== -1) existingSkill[descIdx] = spell.desc;
                        }
                    } else {
                        const libHeaders = skillLibTable.content[0];
                        const newLibRow = libHeaders.map(h => {
                            if (h === 'SKILL_ID') return skillId;
                            if (h === '技能名称') return spellName;
                            if (h === '技能类型') return '法术';
                            if (h === '环阶') return spell.level !== undefined ? spell.level : '0';
                            if (h === '学派') return spell.school || '-';
                            if (h === '施法时间') return spell.time || '-';
                            if (h === '射程') return spell.range || '-';
                            if (h === '成分') return spell.comp || '-';
                            if (h === '持续时间') return spell.duration || '-';
                            if (h === '效果描述') return spell.desc;
                            return null;
                        });
                        skillLibTable.content.push(newLibRow);
                    }

                    // 2. 添加到关联表 (CHARACTER_Skills) - 避免重复
                    if (charIdIdx !== -1 && skillIdIdx !== -1) {
                        const linkExists = skillLinkTable.content.some(row =>
                            row[charIdIdx] === charId && row[skillIdIdx] === skillId
                        );
                        if (linkExists) return;
                    }

                    const newLinkRow = linkHeaders.map(h => {
                        if (h === 'LINK_ID') return 'LNK_' + Math.random().toString(36).substr(2, 8);
                        if (h === 'CHAR_ID') return charId;
                        if (h === 'SKILL_ID') return skillId;
                        if (h === '已准备') return '是';
                        return null;
                    });
                    skillLinkTable.content.push(newLinkRow);
                });
            }

            // 处理专长和特性
            const features = data.features || [];
            if (features.length > 0 && featLibTable && featLinkTable) {
                const linkHeaders = featLinkTable.content[0];
                const charIdIdx = linkHeaders.indexOf('CHAR_ID');
                const featIdIdx = linkHeaders.indexOf('FEAT_ID');

                // [Fix] 清理现有的重复专长/特性
                if (charIdIdx !== -1 && featIdIdx !== -1) {
                    const charLinks = featLinkTable.content.filter(row => row[charIdIdx] === charId);
                    const nameMap = new Map(); // name -> [linkRow...]
                    const rowsToDelete = new Set();

                    charLinks.forEach(linkRow => {
                        const featId = linkRow[featIdIdx];
                        const libRow = featLibTable.content.find(r => r[0] === featId);
                        if (libRow) {
                            const name = (libRow[1] || '').trim();
                            if (name) {
                                if (!nameMap.has(name)) nameMap.set(name, []);
                                nameMap.get(name).push(linkRow);
                            }
                        }
                    });

                    nameMap.forEach((rows, name) => {
                        if (rows.length > 1) {
                            console.log(`[CharCreator] 清理重复特性: ${name} (删除 ${rows.length - 1} 个)`);
                            for (let i = 1; i < rows.length; i++) {
                                rowsToDelete.add(rows[i]);
                            }
                        }
                    });

                    if (rowsToDelete.size > 0) {
                        featLinkTable.content = featLinkTable.content.filter(row => !rowsToDelete.has(row));
                    }
                }

                features.forEach(feat => {
                    const featName = (feat.name || '').trim();
                    if (!featName) return;

                    // 1. 查找所有名称匹配的 featId (包括可能重复的库条目)
                    const matchingFeatIds = featLibTable.content
                        .filter(row => (row[1] || '').trim() === featName)
                        .map(row => row[0]);

                    // 2. 检查该角色是否已经链接了其中任何一个 featId
                    if (charIdIdx !== -1 && featIdIdx !== -1 && matchingFeatIds.length > 0) {
                        const isAlreadyLinked = featLinkTable.content.some(row =>
                            row[charIdIdx] === charId && matchingFeatIds.includes(row[featIdIdx])
                        );
                        if (isAlreadyLinked) {
                            console.log(`[CharCreator] 跳过重复专长/特性: ${featName}`);
                            return;
                        }
                    }

                    let featId = 'FEAT_' + Math.random().toString(36).substr(2, 8);
                    const existingFeat = featLibTable.content.find(row => (row[1] || '').trim() === featName);
                    
                    if (existingFeat) {
                        featId = existingFeat[0];
                        // [Fix] 更新描述 (如果 AI 提供了新描述)
                        if (feat.desc) {
                            const descIdx = featLibTable.content[0].indexOf('效果描述');
                            if (descIdx !== -1) existingFeat[descIdx] = feat.desc;
                        }
                    } else {
                        const libHeaders = featLibTable.content[0];
                        const newLibRow = libHeaders.map(h => {
                            if (h === 'FEAT_ID') return featId;
                            if (h === '专长名称') return featName;
                            if (h === '类别') return feat.type || '职业特性';
                            if (h === '效果描述') return feat.desc;
                            return null;
                        });
                        featLibTable.content.push(newLibRow);
                    }

                    // 检查重复
                    if (charIdIdx !== -1 && featIdIdx !== -1) {
                        const linkExists = featLinkTable.content.some(row =>
                            row[charIdIdx] === charId && row[featIdIdx] === featId
                        );
                        if (linkExists) return;
                    }

                    const newLinkRow = linkHeaders.map(h => {
                        if (h === 'LINK_ID') return 'LNK_' + Math.random().toString(36).substr(2, 8);
                        if (h === 'CHAR_ID') return charId;
                        if (h === 'FEAT_ID') return featId;
                        return null;
                    });
                    featLinkTable.content.push(newLinkRow);
                });
            }
            
            // 保存
            await DiceManager.saveData(rawData);
            
            // 更新状态
            state.currentStep = 'complete';
            this.saveCreatorState(); // 保存状态
            this.renderCharacterCreationPanel($('#dnd-creator-chat-history').closest('#dnd-content'));
            
            // 显示成功通知
            const successMsg = state.mode === 'levelup'
                ? `🎉 角色 "${data.name}" 升级成功 (Lv.${data.level})！`
                : `🎉 ${isPC ? '主角' : '队友'} "${data.name}" 创建成功！`;
                
            NotificationSystem.success(successMsg, state.mode === 'levelup' ? '角色升级' : '角色创建');
            
        } catch (error) {
            console.error('[CharCreator] 保存失败:', error);
            NotificationSystem.error('保存失败：' + error.message);
        }
    }
};
