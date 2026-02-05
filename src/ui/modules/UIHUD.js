import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { CONFIG } from '../../config/Config.js';
import { DBAdapter } from '../../core/DBAdapter.js';
import { DataManager } from '../../data/DataManager.js';
import { PresetSwitcher } from '../../features/PresetSwitcher.js';
import { ThemeManager } from '../../features/ThemeManager.js';

export default {
    renderHUD() {
        const { $ } = getCore();
        const $hud = $('#dnd-mini-hud');
        const $body = $('#dnd-hud-body');
        const $status = $('#dnd-hud-status-text');
        
        if (!$hud.length) return;
        
        // 仅在 mini 状态下渲染
        if (this.state !== 'mini') return;

        // 获取全局状态
        const global = DataManager.getTable('SYS_GlobalState');
        const gInfo = (global && global[0]) ? global[0] : { '当前场景': '未知', '游戏时间': '', '天气状况': '', '战斗模式': '' };
        const weather = gInfo['天气状况'] || '';
        
        // 检查战斗状态 - 通过全局状态的"战斗模式"字段判断，只有为"战斗中"才触发战斗HUD
        const isCombat = gInfo['战斗模式'] === '战斗中';
        
        // [新增] 检测战斗状态变化并切换预设
        PresetSwitcher.checkCombatStateChange(isCombat);

        // 提取时间 (仅显示 HH:MM 或原始内容)
        const timeStr = gInfo['游戏时间'] && gInfo['游戏时间'].includes(' ') ? gInfo['游戏时间'].split(' ')[1] : gInfo['游戏时间'];
        // 提取天气图标 (简单匹配)
        const weatherIcon = weather ? (weather.match(/[🌤️☀️☁️🌧️⛈️🌩️🌨️❄️🌫️🌪️]/)?.[0] || '🌤️') : '';

        // [修复] 恢复头部完整显示逻辑 - 优化布局和图标显示
        const statusIcon = isCombat ? '<i class="fa-solid fa-skull"></i>' : '<i class="fa-solid fa-compass"></i>';
        const statusText = isCombat ? '战斗中' : '探索中';
        const statusColor = isCombat ? 'var(--dnd-accent-red)' : 'var(--dnd-accent-green)';
        
        // 构建信息行 (时间 | 天气 | 状态)
        const infoParts = [];
        if (timeStr) infoParts.push(`<span title="游戏时间"><i class="fa-solid fa-clock"></i> ${timeStr}</span>`);
        if (weather || weatherIcon) infoParts.push(`<span title="${weather}"><i class="fa-solid fa-cloud-moon"></i> ${weather}</span>`);
        infoParts.push(`<span style="color:${statusColor}">${statusIcon} ${statusText}</span>`);
        
        $status.html(`
            <div id="dnd-hud-location" class="dnd-location-text dnd-hud-entry" title="${gInfo['当前场景']}">
                ${gInfo['当前场景']}
            </div>
            <div class="dnd-hud-info-row dnd-hud-entry" style="animation-delay: 0.1s;">
                ${infoParts.join('<span style="color:#444;margin:0 6px;">|</span>')}
            </div>
        `);
        
        // 添加展开按钮 (如果尚未存在)
        if ($('#dnd-hud-toggle-bar').length === 0) {
            const $toggleBar = $(`<div id="dnd-hud-toggle-bar" style="height:12px;background:linear-gradient(to bottom, #1a1a1a, #0a0a0a);border-bottom:1px solid var(--dnd-border-inner);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#666;font-size:8px;transition:all 0.2s;" title="展开/收起头部">▼</div>`);
            
            $toggleBar.hover(
                function() { $(this).css({color: 'var(--dnd-text-highlight)', background: 'rgba(255,255,255,0.05)'}); },
                function() { $(this).css({color: '#666', background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)'}); }
            );
            
            $toggleBar.on('click', function() {
                const $loc = $('#dnd-hud-location');
                const isExpanded = $loc.hasClass('dnd-expanded');
                
                if (isExpanded) {
                    $loc.removeClass('dnd-expanded');
                    $(this).text('▼').attr('title', '展开头部');
                } else {
                    $loc.addClass('dnd-expanded');
                    $(this).text('▲').attr('title', '收起头部');
                }
            });
            
            // 插入到 Header 和 Body 之间
            $('#dnd-mini-hud .dnd-hud-header').after($toggleBar);
        }

        // 清空主体
        $body.empty();

        if (isCombat) {
            this.renderCombatHUD($body);
        } else {
            this.renderExploreHUD($body);
        }

        // [优化] 渲染常驻横向队伍栏 (替代原有的折叠列表)
        this.renderPartyBar($body);

        // [新增] 渲染主角法术位 (迷你版)
        this.renderMiniSpellSlots($body);

        // [优化] 渲染快捷物品栏 (替代原有的下拉列表)
        this.renderQuickInventory($body);

        // 渲染常驻资源栏
        this.renderFooter($body);

        // [新增] 渲染行动队列面板 (如果有待执行行动)
        if (this._actionQueue && this._actionQueue.length > 0) {
            const $queuePanel = $(`
                <div style="margin-top:10px;background:rgba(0,0,0,0.3);border:1px solid var(--dnd-border-gold);border-radius:4px;overflow:hidden;">
                    <div style="background:rgba(197, 160, 89, 0.1);padding:5px 10px;font-weight:bold;color:var(--dnd-text-highlight);display:flex;justify-content:space-between;align-items:center;">
                        <span><i class="fa-solid fa-hourglass-half"></i> 待执行行动 (${this._actionQueue.length})</span>
                        <div style="display:flex;gap:5px;">
                            <button class="dnd-clickable" onclick="window.DND_Dashboard_UI.commitActions()" style="background:var(--dnd-accent-green);border:none;color:#fff;padding:2px 8px;border-radius:3px;cursor:pointer;"><i class="fa-solid fa-check"></i> 执行</button>
                            <button class="dnd-clickable" onclick="window.DND_Dashboard_UI.clearActions()" style="background:var(--dnd-accent-red);border:none;color:#fff;padding:2px 8px;border-radius:3px;cursor:pointer;"><i class="fa-solid fa-times"></i> 清空</button>
                        </div>
                    </div>
                    <div style="padding:5px 10px;font-size:12px;color:#ccc;">
                        ${this._actionQueue.map((a, i) => `<div style="margin-bottom:2px;">${i+1}. ${a.desc}</div>`).join('')}
                    </div>
                </div>
            `);
            $body.append($queuePanel);
        }

        // [新增] 渲染快捷栏 (Quick Bar) - 附着在 HUD 右侧
        if ($('#dnd-quick-bar').length === 0) {
            const $bar = $(`<div id="dnd-quick-bar" class="dnd-quick-bar"></div>`);
            const $trigger = $(`<div id="dnd-quick-trigger" class="dnd-quick-trigger" onclick="window.DND_Dashboard_UI.toggleQuickBar()"><i class="fa-solid fa-chevron-right"></i></div>`);
            
            const $hud = $('#dnd-mini-hud');
            $hud.append($bar).append($trigger);
        }
        this.renderQuickBar();
        
        // 每次渲染后更新位置
        this.updateHUDPosition();
    },

    // [新增] 更新 HUD 位置使其跟随悬浮球
    updateHUDPosition() {
        const { $, window: coreWin } = getCore(); // 获取正确的 window 对象
        // [修复] 使用 coreWin 获取尺寸，确保与 DOM 元素所在的文档一致 (兼容 iframe)
        const winW = coreWin.innerWidth || $(coreWin).width();
        
        // 移动端：完全交给 CSS 处理 (居中靠上)，JS 不干预
        if (winW <= 768) {
            const $hud = $('#dnd-mini-hud');
            if ($hud.length) {
                $hud[0].style.removeProperty('top');
                $hud[0].style.removeProperty('left');
            }
            return;
        }

        const $btn = $('#dnd-toggle-btn');
        const $hud = $('#dnd-mini-hud');
        
        if (!$btn.length || !$hud.length) return;
        
        const btnRect = $btn[0].getBoundingClientRect();
        const hudRect = $hud[0].getBoundingClientRect();
        // [修复] 使用 coreWin 获取尺寸
        const winH = coreWin.innerHeight || $(coreWin).height();
        const margin = 10;
        
        // Log for debugging
        Logger.debug('[HUD Pos] Btn:', btnRect.left, btnRect.top, 'HUD:', hudRect.width, hudRect.height, 'Win:', winW, winH);

        // 即使尺寸看起来是0 (可能刚初始化)，也尝试根据默认宽度计算
        const hudW = hudRect.width || 360;
        const hudH = hudRect.height || 400;

        let top, left;
        
        // 垂直定位策略
        if (btnRect.bottom + margin + hudH <= winH - margin) {
            top = btnRect.bottom + margin;
        } else if (btnRect.top - margin - hudH >= margin) {
            top = btnRect.top - margin - hudH;
        } else {
            top = (winH - btnRect.bottom > btnRect.top) ? (btnRect.bottom + margin) : (btnRect.top - margin - hudH);
        }
        
        // 水平定位策略: 默认左对齐按钮
        left = btnRect.left;
        
        // 边界约束
        top = Math.max(margin, Math.min(top, winH - hudH - margin));
        
        // 如果左对齐导致右侧溢出 (left + width > winW)
        if (left + hudW > winW - margin) {
            // 尝试右对齐按钮右侧 (left = btnRight - hudW)
            left = btnRect.right - hudW;
        }
        // 再次检查左边界
        left = Math.max(margin, Math.min(left, winW - hudW - margin));
        
        Logger.debug('[HUD Pos] Calculated:', left, top);

        $hud[0].style.setProperty('top', top + 'px', 'important');
        $hud[0].style.setProperty('left', left + 'px', 'important');
    },

    // [新增] 显示位置设置对话框
    showPositionDialog() {
        const { $, window: coreWin } = getCore();
        $('#dnd-position-dialog').remove();
        
        const $btn = $('#dnd-toggle-btn');
        // [修复] 使用 coreWin
        const winW = coreWin.innerWidth || $(coreWin).width();
        const winH = coreWin.innerHeight || $(coreWin).height();
        const btnSize = 40;
        const margin = 10;
        
        const positions = [
            { pos: 'tl', label: '↖ 左上', left: margin, top: margin },
            { pos: 'tc', label: '↑ 顶部', left: (winW - btnSize) / 2, top: margin },
            { pos: 'tr', label: '↗ 右上', left: winW - btnSize - margin, top: margin },
            { pos: 'ml', label: '← 左侧', left: margin, top: (winH - btnSize) / 2 },
            { pos: 'mc', label: '● 中央', left: (winW - btnSize) / 2, top: (winH - btnSize) / 2 },
            { pos: 'mr', label: '→ 右侧', left: winW - btnSize - margin, top: (winH - btnSize) / 2 },
            { pos: 'bl', label: '↙ 左下', left: margin, top: winH - btnSize - margin },
            { pos: 'bc', label: '↓ 底部', left: (winW - btnSize) / 2, top: winH - btnSize - margin },
            { pos: 'br', label: '↘ 右下', left: winW - btnSize - margin, top: winH - btnSize - margin }
        ];
        
        let btnsHtml = positions.map(p => 
            `<button class="dnd-pos-btn" data-left="${p.left}" data-top="${p.top}" style="padding:8px;background:#2a2a2c;border:1px solid #444;color:#ccc;border-radius:4px;cursor:pointer;">${p.label}</button>`
        ).join('');
        
        const html = `
            <div id="dnd-position-dialog" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#161618;border:1px solid #9d8b6c;border-radius:8px;padding:15px;z-index:2147483650;box-shadow:0 10px 40px rgba(0,0,0,0.8);min-width:280px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:15px;border-bottom:1px solid #444;padding-bottom:8px;">
                    <span style="color:#ffdb85;font-weight:bold;">📍 悬浮球位置</span>
                    <span id="dnd-pos-close" style="cursor:pointer;color:#888;">✕</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin-bottom:10px;">${btnsHtml}</div>
                <div style="font-size:11px;color:#666;text-align:center;">单击=切换HUD | 双击/长按=此设置</div>
            </div>
            <div id="dnd-pos-backdrop" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:2147483646;"></div>
        `;
        
        $('body').append(html);
        
        $('#dnd-pos-close, #dnd-pos-backdrop').on('click', () => $('#dnd-position-dialog, #dnd-pos-backdrop').remove());
        
        // [修复] 使用事件委托和更稳健的数据获取
        $(document).off('click.dndPos').on('click.dndPos', '.dnd-pos-btn', function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // 重新获取按钮元素以防丢失引用
            const $targetBtn = $('#dnd-toggle-btn');
            
            // 使用 attr 确保获取到原始字符串
            const left = $(this).attr('data-left');
            const top = $(this).attr('data-top');
            
            console.log('[DND Dashboard] Setting position to:', left, top);
            
            if ($targetBtn.length && left && top) {
                $targetBtn.css({
                    left: left + 'px',
                    top: top + 'px',
                    right: 'auto',
                    bottom: 'auto',
                    transform: 'none' // 清除可能影响位置的 transform
                });
                
                safeSave(CONFIG.STORAGE_KEYS.TOGGLE_POS, JSON.stringify({ left: left + 'px', top: top + 'px' }));
            } else {
                console.error('[DND Dashboard] Position update failed:', { btnLen: $targetBtn.length, left, top });
            }
            
            $('#dnd-position-dialog, #dnd-pos-backdrop').remove();
        });
        
        // 辅助样式效果
        $(document).on('mouseover', '.dnd-pos-btn', function() {
            $(this).css({ 'border-color': '#9d8b6c', 'color': '#ffdb85' });
        }).on('mouseout', '.dnd-pos-btn', function() {
            $(this).css({ 'border-color': '#444', 'color': '#ccc' });
        });
    },

    renderCombatHUD($container) {
        const { $ } = getCore();
        const encounters = DataManager.getTable('COMBAT_Encounter');
        const global = DataManager.getTable('SYS_GlobalState');
        const round = (global && global[0]) ? global[0]['当前回合'] : 0;
        
        // 布局
        let html = `<div class="dnd-hud-combat-layout">`;
        
        // 左侧：迷你地图
        const turnRes = this._turnResources || { action: 1, bonus: 1, reaction: 1, movement: 30 };
        html += `
            <div style="display:flex;flex-direction:column;gap:5px;">
                <div class="dnd-hud-minimap" id="dnd-hud-minimap-content" style="width:180px;height:180px;"></div>
                
                <!-- 动作经济展示 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;font-size:10px;background:rgba(0,0,0,0.3);padding:4px;border-radius:4px;">
                    <div class="dnd-clickable" onclick="window.DND_Dashboard_UI.adjustTurnResource('action')" title="点击增加动作" style="cursor:pointer;color:${turnRes.action>0?'#2ecc71':'#555'}"><i class="fa-solid fa-bolt"></i> 动作: ${turnRes.action}</div>
                    <div class="dnd-clickable" onclick="window.DND_Dashboard_UI.adjustTurnResource('bonus')" title="点击增加附赠动作" style="cursor:pointer;color:${turnRes.bonus>0?'#e67e22':'#555'}"><i class="fa-solid fa-plus-circle"></i> 附赠: ${turnRes.bonus}</div>
                    <div class="dnd-clickable" onclick="window.DND_Dashboard_UI.adjustTurnResource('reaction')" title="点击增加反应" style="cursor:pointer;color:${turnRes.reaction>0?'#f1c40f':'#555'}"><i class="fa-solid fa-rotate"></i> 反应: ${turnRes.reaction}</div>
                    <div class="dnd-clickable" onclick="window.DND_Dashboard_UI.adjustTurnResource('movement')" title="点击增加30尺移动力" style="cursor:pointer;color:${turnRes.movement>0?'#3498db':'#555'}"><i class="fa-solid fa-shoe-prints"></i> 移动: ${turnRes.movement}</div>
                </div>

                <div style="display:flex;gap:5px;">
                    <button class="dnd-clickable" style="
                        flex: 1;
                        background: linear-gradient(135deg, #2c3e50, #2980b9);
                        border: 1px solid #3498db;
                        color: #fff;
                        padding: 5px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 12px;
                    " onclick="window.DND_Dashboard_UI.startTargeting({
                        type: 'move',
                        rangeText: '30尺',
                        skillName: '移动',
                        callback: (res) => window.DND_Dashboard_UI.executeAction('move', res)
                    })"><i class="fa-solid fa-person-walking"></i> 移动</button>
                    <button class="dnd-clickable" style="
                        flex: 1;
                        background: linear-gradient(135deg, #8e44ad, #9b59b6);
                        border: 1px solid #9b59b6;
                        color: #fff;
                        padding: 5px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 12px;
                    " onclick="window.DND_Dashboard_UI.showCombatSkillList(event)"><i class="fa-solid fa-gavel"></i> 技能</button>
                </div>
            </div>
        `;
        
        // 右侧：战斗列表
        html += `<div class="dnd-hud-party-stats">`;
        html += `<div id="dnd-combat-resource-panel"></div>`;
        
        if (encounters && encounters.length > 0) {
            // 按先攻排序
            const sorted = [...encounters].sort((a, b) => {
                const valA = parseInt(a['先攻/位置']) || 0;
                const valB = parseInt(b['先攻/位置']) || 0;
                return valB - valA;
            });

            sorted.forEach(unit => {
                const isActive = unit['是否为当前行动者'] === '是';
                const buffs = unit['附着状态'] || '';
                const isEnemy = unit['阵营'] === '敌方';
                
                // 解析 HP
                let hpCurrent = 0, hpMax = 1, hpPercent = 100;
                const hpStr = unit['HP状态'] || '0/0';
                const hpParts = hpStr.split('/');
                if (hpParts.length >= 2) {
                    hpCurrent = parseInt(hpParts[0]) || 0;
                    hpMax = parseInt(hpParts[1]) || 1;
                    hpPercent = Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100));
                }
                
                const defInfo = unit['防御/抗性'] || '-';
                const acMatch = defInfo.match(/AC(\d+)/);
                const acVal = acMatch ? acMatch[1] : (defInfo.length < 5 ? defInfo : '??');
                
                const charIdCombat = unit['单位名称'];
                const initialCombat = this.getNameInitial(unit['单位名称']);
                const uid = `combat-avatar-${charIdCombat.replace(/[^a-zA-Z0-9]/g, '_')}-${Math.random().toString(36).substr(2,5)}`;
                
                // Trigger async load
                setTimeout(() => this.loadAvatarAsync(charIdCombat, uid), 0);
                
                let nameColor = 'var(--dnd-text-main)';
                if (isEnemy) nameColor = 'var(--dnd-accent-red)';
                if (isActive) nameColor = 'var(--dnd-text-highlight)';
                
                html += `
                    <div class="dnd-mini-char dnd-hud-entry ${isActive ? 'active' : ''}" style="${isEnemy ? 'border-left-color:var(--dnd-accent-red) !important;' : ''}">
                        <div id="${uid}" class="dnd-mini-char-avatar dnd-avatar-container ${isActive ? 'dnd-active-turn' : ''}" data-char-id="${charIdCombat}" style="overflow:hidden;background:linear-gradient(135deg, #2a2a2e 0%, #1a1a1c 100%);position:relative;cursor:pointer;border-color:${isEnemy?'var(--dnd-accent-red)':'var(--dnd-border-gold)'};" title="${unit['单位名称']}">
                            <div class="dnd-avatar-initial" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${isEnemy?'#ff6b6b':'var(--dnd-text-highlight)'};font-weight:bold;font-size:16px;">${initialCombat}</div>
                        </div>
                        <div class="dnd-mini-char-info">
                            <div style="display:flex;justify-content:space-between">
                                <div class="dnd-mini-name" style="color:${nameColor}">${unit['单位名称']} ${isActive ? '<i class="fa-solid fa-bolt"></i>' : ''}</div>
                                <div style="font-size:11px;color:#888">AC: ${acVal}</div>
                            </div>
                            <div class="dnd-mini-bars">
                                <div class="dnd-micro-bar hp dnd-bar-shimmer" title="${hpStr}"><div class="dnd-micro-bar-fill" style="width:${hpPercent}%;background:${isEnemy?'#c0392b':'var(--dnd-accent-green)'} !important;"></div></div>
                            </div>
                            ${buffs ? `<div style="font-size:10px;color:#aaa;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${buffs}</div>` : ''}
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<div style="color:#666;text-align:center;padding:10px;">等待战斗数据...</div>`;
        }
        
        html += `</div></div>`;
        $container.append(html);
        
        // Bind events
        const self = this;
        $container.find('.dnd-mini-char-avatar').on('click', function(e) {
            e.stopPropagation();
            const name = $(this).attr('title');
            const unit = encounters.find(u => u['单位名称'] === name);
            if (unit) {
                self.showCombatUnitDetail(unit, e);
            }
        });

        if (this.renderResourceConsumption) {
            this.renderResourceConsumption($('#dnd-combat-resource-panel'));
        }

        this.renderMiniMap($('#dnd-hud-minimap-content'));
    },

    renderExploreHUD($container) {
        const { $ } = getCore();

        // 0. 渲染探索地图 (新增)
        // 使用 100% 宽度，高度设为 240px 以便更好地展示艺术地图
        const $mapContainer = $('<div class="dnd-hud-minimap" id="dnd-hud-minimap-content" style="width:100% !important; height:240px !important; margin-bottom:10px; border:1px solid var(--dnd-border-gold);"></div>');
        $container.append($mapContainer);
        
        // 异步渲染地图
        this.renderMiniMap($mapContainer);
        
        // 1. 渲染行动选项 (优先)
        this.renderActionOptions($container);

        // 2. 渲染任务 (精简版)
        const quests = DataManager.getTable('QUEST_Active');
        if (quests && quests.length > 0) {
            // 只显示第一个进行中的任务
            const activeQ = quests.find(q => q['状态'] === '进行中') || quests[0];
            
            // 提取任务类型和时限
            const type = activeQ['类型'] || '';
            const timeLimit = activeQ['时限'] || '';
            
            const qHtml = `
                <div class="dnd-hud-quests dnd-hud-entry" style="animation-delay:0.2s; margin-top:5px;background:rgba(0,0,0,0.2);padding:6px;border-radius:4px;border-left:2px solid var(--dnd-border-gold);cursor:pointer;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                        <div style="font-weight:bold;color:var(--dnd-text-header);font-size:12px;display:flex;align-items:center;gap:5px;">
                            <span><i class="fa-solid fa-thumbtack dnd-icon-notify"></i> ${activeQ['任务名称']}</span>
                            ${type ? `<span style="font-size:10px;background:rgba(255,255,255,0.1);padding:0 4px;border-radius:2px;color:var(--dnd-text-dim);">${type}</span>` : ''}
                        </div>
                        ${timeLimit && timeLimit !== '无限制' ? `<div style="font-size:10px;color:#e67e22;"><i class="fa-solid fa-clock"></i> ${timeLimit}</div>` : ''}
                    </div>
                    <div style="font-size:11px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${activeQ['当前进度'] || activeQ['目标描述'] || '...'}
                    </div>
                </div>
            `;
            const $el = $(qHtml);
            $el.on('click', (e) => this.showQuestTooltip(activeQ, e.clientX, e.clientY));
            $container.append($el);
        }
    },

    // [新增] 渲染行动选项
    renderActionOptions($container) {
        const { $ } = getCore();
        const optionsTable = DataManager.getTable('UI_ActionOptions');
        if (!optionsTable || optionsTable.length === 0) return;
        
        const opts = optionsTable[0]; // 取第一行
        const validOpts = [];
        
        // 检查 A-D 选项
        ['选项A', '选项B', '选项C', '选项D'].forEach(key => {
            if (opts[key] && opts[key].trim()) {
                validOpts.push({ key: key.replace('选项',''), text: opts[key] });
            }
        });
        
        if (validOpts.length === 0) return;
        
        let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">`;
        
        validOpts.forEach((opt, idx) => {
            html += `
                <button class="dnd-action-btn dnd-clickable dnd-hud-entry dnd-hover-lift" data-text="${opt.text}" style="animation-delay:${idx * 0.05}s;
                    background: linear-gradient(to bottom, #2a2a2c, #1a1a1c);
                    border: 1px solid var(--dnd-border-inner);
                    color: var(--dnd-text-main);
                    padding: 8px 5px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: left;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    transition: all 0.2s;
                " onmouseover="this.style.borderColor='var(--dnd-text-highlight)';this.style.color='var(--dnd-text-highlight)'" 
                onmouseout="this.style.borderColor='var(--dnd-border-inner)';this.style.color='var(--dnd-text-main)'">
                    <span style="color:var(--dnd-border-gold);font-weight:bold;margin-right:4px;">${opt.key}.</span> ${opt.text}
                </button>
            `;
        });
        
        html += `</div>`;
        const $el = $(html);
        
        // 绑定点击事件 (填入聊天框)
        const self = this;
        $el.find('.dnd-action-btn').on('click', function() {
            const text = $(this).data('text');
            self.fillChatInput(text);
        });
        
        $container.append($el);
    },

    // [新增] 渲染横向队伍栏 (Refactored to use CSS classes)
    renderPartyBar($container) {
        const { $ } = getCore();
        const party = DataManager.getPartyData();
        if (!party || party.length === 0) return;

        let html = `<div class="dnd-hud-party-bar">`;
        
        party.forEach((char, idx) => {
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
            
            // 解析经验值
            let xpPercent = 0;
            let xpText = '';
            if (char['经验值']) {
                const parts = char['经验值'].toString().split('/');
                if (parts.length === 2) {
                    const curr = parseInt(parts[0]) || 0;
                    const max = parseInt(parts[1]) || 1;
                    xpPercent = Math.min(100, Math.max(0, (curr / max) * 100));
                    xpText = `${curr}/${max}`;
                }
            }

            // 获取等级
            const level = char['等级'] || 1;
            
            const charId = char['PC_ID'] || char['CHAR_ID'] || char['姓名'];
            const initial = this.getNameInitial(char['姓名']);
            const avatarUid = `party-avatar-${charId}-${idx}`;
            
            // 触发异步头像加载
            setTimeout(() => this.loadAvatarAsync(charId, avatarUid), 0);
            
            // [新增] 检查是否为当前操控角色
            const isControlled = (this._controlledCharId === charId);

            // [新增] 检查是否可以升级
            let canLevelUp = false;
            if (char['经验值']) {
                const parts = char['经验值'].toString().split('/');
                if (parts.length === 2) {
                    const curr = parseInt(parts[0]) || 0;
                    const max = parseInt(parts[1]) || 1;
                    if (curr >= max && max > 0) canLevelUp = true;
                }
            }
                
            html += `
                <div class="party-bar-item dnd-clickable dnd-hud-entry dnd-hover-lift" data-idx="${idx}" style="animation-delay:${idx * 0.05}s;">
                    <div style="position:relative;">
                        <div id="${avatarUid}" class="dnd-avatar-container party-avatar-container" data-char-id="${charId}" title="${char['姓名']}">
                            <span style="color:var(--dnd-text-highlight);font-weight:bold;font-size:16px;">${initial}</span>
                        </div>
                        <div class="party-lvl-badge">Lv.${level}</div>
                        <!-- [新增] 操控切换按钮 -->
                        <div class="party-control-btn ${isControlled ? 'active' : ''}"
                                onclick="event.stopPropagation(); window.DND_Dashboard_UI.setControlledCharacter('${charId}')"
                                title="切换操控此角色">
                            <i class="fa-solid fa-gamepad"></i>
                        </div>
                        <!-- [新增] 升级按钮 -->
                        ${canLevelUp ? `
                        <div class="party-levelup-btn"
                                onclick="event.stopPropagation(); window.DND_Dashboard_UI.startLevelUp('${charId}')"
                                title="经验值已满，点击升级！">
                            <i class="fa-solid fa-arrow-up dnd-icon-bounce"></i>
                        </div>` : ''}
                    </div>
                    
                    <!-- HP条 -->
                    <div class="dnd-bar-shimmer" style="width:100%;height:4px;background:#333;border-radius:2px;overflow:hidden;margin-top:2px;">
                        <div class="dnd-bar-fill" style="width:${hpPercent}%;height:100%;background:${hpPercent < 30 ? '#c0392b' : 'var(--dnd-accent-green)'};transition:width 0.3s;"></div>
                    </div>
                    
                    <!-- XP条 -->
                    ${xpText ? `
                    <div class="dnd-bar-shimmer" style="width:100%;height:2px;background:#222;border-radius:1px;overflow:hidden;margin-top:1px;" title="XP: ${xpText}">
                        <div class="dnd-bar-fill" style="width:${xpPercent}%;height:100%;background:#8e44ad;transition:width 0.3s;"></div>
                    </div>` : ''}
                </div>
            `;
        });
        
        html += `</div>`;
        const $el = $(html);
        
        // 绑定点击事件
        const self = this;
        $el.find('.party-bar-item').on('click', function(e) {
            Logger.debug('[PartyBar] Clicked item', $(this).data('idx'));
            e.stopPropagation();
            const idx = $(this).data('idx');
            const char = party[idx];
            if (char) {
                self.showCharacterCard(char, e);
            } else {
                Logger.error('[PartyBar] Character data not found for index', idx);
            }
        });

        $container.append($el);
    },

    renderFooter($container) {
        const { $ } = getCore();
        
        // 获取当前操控角色资源
        const char = this.getControlledCharacter();
        const res = char || {};
        
        // 获取势力数据
        const factions = DataManager.getTable('FACTION_Standing') || [];
        
        // 获取法术书
        const charId = char ? (char['CHAR_ID'] || char['PC_ID'] || char['姓名']) : null;
        const spells = DataManager.getKnownSpells(charId);
        const hasSpells = spells && spells.length > 0;
        
        let html = `<div class="dnd-hud-footer">`;
        
        if (char) {
            html += `<div class="dnd-res-item" title="金币"><span class="dnd-res-icon"><i class="fa-solid fa-coins"></i></span> ${res['金币']||0} gp</div>`;
            
            if (res['生命骰']) {
                html += `<div class="dnd-res-item" title="生命骰"><span class="dnd-res-icon"><i class="fa-solid fa-heart"></i></span> ${res['生命骰']}</div>`;
            }
            
            // 职业资源简报
            if (res['职业资源']) {
                try {
                    const classRes = DataManager.parseValue(res['职业资源'], 'resources');
                    if (classRes) {
                        const firstKey = Object.keys(classRes)[0];
                        if (firstKey) {
                            html += `<div class="dnd-res-item" title="${firstKey}"><span class="dnd-res-icon"><i class="fa-solid fa-bolt"></i></span> ${classRes[firstKey]}</div>`;
                        }
                    }
                } catch(e) {}
            }
        }
        
        // 势力声望快览 (只显示前2个非中立势力)
        if (factions.length > 0) {
            let factionHtml = '';
            let count = 0;
            
            factions.forEach(f => {
                if (count >= 2) return;
                const relation = parseInt(f['关系等级']) || 0;
                if (relation !== 0) {
                    const icon = relation > 0 ? '<i class="fa-solid fa-landmark"></i>' : '<i class="fa-solid fa-skull"></i>';
                    const color = relation > 0 ? 'var(--dnd-accent-green)' : 'var(--dnd-accent-red)';
                    factionHtml += `<span style="color:${color};margin-left:5px;cursor:help;" title="${f['势力名称']}: ${f['关系等级']} (声望:${f['声望值']||0})">${icon}</span>`;
                    count++;
                }
            });
            
            if (factionHtml) {
                html += `<div class="dnd-res-item" style="border-left:1px solid rgba(255,255,255,0.1);padding-left:8px;margin-left:5px;">${factionHtml}</div>`;
            }
        }
        
        // 右侧按钮组
        html += `<div style="margin-left:auto;display:flex;gap:10px;">`;
        
        // [修复] 使用 data-action 属性，后续用事件委托绑定
        html += `
            <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="inventory" style="cursor:pointer;" title="背包物品">
                <span class="dnd-res-icon" style="font-size:16px;color:var(--dnd-text-main)"><i class="fa-solid fa-suitcase"></i></span>
            </div>
        `;
        
        html += `
            <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="equipment" style="cursor:pointer;" title="已装备物品">
                <span class="dnd-res-icon" style="font-size:16px;color:var(--dnd-text-highlight)"><i class="fa-solid fa-shield-halved"></i></span>
            </div>
        `;
        
        if (factions.length > 0) {
            html += `
                <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="faction" style="cursor:pointer;" title="势力与声望">
                    <span class="dnd-res-icon" style="font-size:16px;color:var(--dnd-text-highlight)"><i class="fa-solid fa-landmark"></i></span>
                </div>
            `;
        }

        if (hasSpells) {
            html += `
                <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="spellbook" style="cursor:pointer;" title="法术书">
                    <span class="dnd-res-icon" style="font-size:16px;color:#aab"><i class="fa-solid fa-book"></i></span>
                </div>
            `;
        }
        
        html += `
            <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="dice" style="cursor:pointer;" title="快速投掷">
                <span class="dnd-res-icon" style="font-size:16px;color:var(--dnd-text-highlight)"><i class="fa-solid fa-dice-d20"></i></span>
            </div>
        `;
        
        // [新增] 手动更新数据按钮
        html += `
            <div class="dnd-res-item dnd-footer-btn dnd-clickable" data-action="manual-update" style="cursor:pointer;" title="手动刷新数据">
                <span class="dnd-res-icon dnd-refresh-icon" style="font-size:16px;color:var(--dnd-text-main)"><i class="fa-solid fa-sync"></i></span>
            </div>
        `;
        
        html += `</div></div>`; // End buttons & footer
        
        const $footerEl = $(html);
        
        // [修复] 使用事件委托绑定按钮点击
        const self = this;
        $footerEl.find('.dnd-footer-btn').on('click', function(e) {
            e.stopPropagation();
            const action = $(this).data('action');
            Logger.debug('Footer button clicked:', action);
            
            switch(action) {
                case 'inventory': self.showInventoryPanel(e); break;
                case 'equipment': self.showEquipmentPanel(e); break;
                case 'faction': self.showFactionPanel(e); break;
                case 'spellbook': self.showSpellBook(e); break;
                case 'dice': self.showQuickDice(e); break;
                case 'manual-update': self.triggerManualUpdate(e); break;
            }
        });
        
        $container.append($footerEl);
    },

    // [新增] 渲染迷你法术位
    renderMiniSpellSlots($container) {
        const { $ } = getCore();
        // 获取当前操控角色
        const char = this.getControlledCharacter();
        
        if (!char) return;
        
        // char 对象已包含合并的资源数据
        const res = char;
        
        if (res && res['法术位']) {
            const slotsHtml = this.formatSpellSlots(res['法术位'], true); // 启用 mini 模式
            if (slotsHtml) {
                const $el = $(`
                    <div style="padding:0 10px 5px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:10px;color:#888;margin-bottom:2px;">法术位 (${char['姓名']})</div>
                        ${slotsHtml}
                    </div>
                `);
                $container.append($el);
            }
        }
    }
};
