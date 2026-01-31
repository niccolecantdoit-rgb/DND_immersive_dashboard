import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { CONFIG } from '../../config/Config.js';
import { DBAdapter } from '../../core/DBAdapter.js';
import { DataManager } from '../../data/DataManager.js';
import { DiceManager } from '../../data/DiceManager.js';
import { NotificationSystem } from './UIUtils.js';

export default {
    // [改进] 显示快速投掷面板 + 骰子池可视化
    showQuickDice(event) {
        // 获取骰子池数据
        const poolData = this.getDicePoolData();
        const poolCount = poolData ? poolData.length : 0;
        const poolStatus = poolCount >= 15 ? 'good' : (poolCount >= 6 ? 'warning' : 'low');
        const statusColor = poolStatus === 'good' ? 'var(--dnd-accent-green)' : (poolStatus === 'warning' ? '#e67e22' : 'var(--dnd-accent-red)');
        const statusText = poolStatus === 'good' ? '充足' : (poolStatus === 'warning' ? '适中' : '不足');
        
        let html = `
            <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <span>🎲 快速投掷</span>
                <span style="font-size:11px;color:${statusColor};background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:3px;">
                    池: ${poolCount} (${statusText})
                </span>
            </div>
            
            <!-- 骰子池可视化 -->
            <div style="background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;margin-bottom:12px;">
                <div style="font-size:11px;color:#888;margin-bottom:6px;display:flex;justify-content:space-between;">
                    <span>预投骰子池</span>
                    <span onclick="window.DND_Dashboard_UI.refreshDicePool()" style="cursor:pointer;color:var(--dnd-text-highlight);">🔄 补充</span>
                </div>
                <div style="display:flex;gap:3px;flex-wrap:wrap;max-height:60px;overflow-y:auto;">
                    ${poolData && poolData.length > 0 ? poolData.slice(0, 20).map((row, idx) => {
                        const d20 = row.D20 || row[7] || '?';
                        const isNat20 = d20 == 20;
                        const isNat1 = d20 == 1;
                        const bgColor = isNat20 ? 'var(--dnd-accent-green)' : (isNat1 ? 'var(--dnd-accent-red)' : 'rgba(255,255,255,0.1)');
                        const textColor = (isNat20 || isNat1) ? '#fff' : 'var(--dnd-text-main)';
                        return `<div title="D20:${d20} D12:${row.D12||row[6]||'?'} D10:${row.D10||row[5]||'?'}" 
                            style="width:22px;height:22px;background:${bgColor};border:1px solid #555;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:10px;color:${textColor};font-weight:bold;cursor:help;">
                            ${d20}
                        </div>`;
                    }).join('') : '<div style="color:#666;font-size:11px;">骰子池为空</div>'}
                </div>
                <div style="font-size:10px;color:#666;margin-top:4px;">显示 D20 值 (悬停查看其他骰子)</div>
            </div>
            
            <!-- 快速投掷按钮 -->
            <div class="dnd-dice-grid">
                ${[4,6,8,10,12,20].map(d => `
                    <button class="dnd-dice-btn" data-sides="${d}" onclick="window.DND_Dashboard_UI.rollDice(${d}, event)">
                        D${d}
                    </button>
                `).join('')}
            </div>
            
            <!-- D100 单独一行 -->
            <div style="margin-top:8px;">
                <button class="dnd-dice-btn" data-sides="100" style="
                    width:100%;
                    background:linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(155, 89, 182, 0.1));
                    border:1px solid #9b59b6;
                    color:#bb8fce;
                    padding:8px;
                    border-radius:4px;
                    cursor:pointer;
                    transition:all 0.2s;
                    font-size:12px;
                " onmouseover="this.style.background='rgba(155, 89, 182, 0.3)'" 
                onmouseout="this.style.background='linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(155, 89, 182, 0.1))'"
                onclick="window.DND_Dashboard_UI.rollDice(100, event)">
                    🎯 D100 (百分骰)
                </button>
            </div>
            
            <!-- 自定义投掷 -->
            <div class="dnd-dice-custom-area">
                <div style="font-size:11px;color:#888;margin-bottom:5px;">自定义投掷</div>
                <div class="dnd-dice-input-row">
                    <input type="text" id="dnd-custom-dice" placeholder="2d6+3" class="dnd-dice-input">
                    <button onclick="window.DND_Dashboard_UI.rollCustomDice()" class="dnd-dice-submit-btn">投掷</button>
                </div>
            </div>
        `;
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // 获取骰子池数据
    getDicePoolData() {
        const api = DataManager.getAPI();
        if (!api || !api.exportTableAsJson) return [];
        
        try {
            const rawData = api.exportTableAsJson();
            if (!rawData) return [];
            
            const dataObj = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
            
            // 寻找骰子池表
            const poolKey = Object.keys(dataObj).find(k => {
                const sheet = dataObj[k];
                return sheet.name && (sheet.name === '🎲 骰子池' || sheet.name.includes('骰子池'));
            });
            
            if (!poolKey) return [];
            
            const sheet = dataObj[poolKey];
            if (!sheet.content || sheet.content.length < 2) return [];
            
            // 解析为对象数组
            const headers = sheet.content[0];
            const rows = sheet.content.slice(1);
            
            return rows.map(row => {
                const obj = {};
                headers.forEach((h, i) => {
                    if (h) obj[h] = row[i];
                });
                // 同时保留数组索引访问
                row.forEach((v, i) => obj[i] = v);
                return obj;
            });
        } catch(e) {
            Logger.error('获取骰子池数据失败:', e);
            return [];
        }
    },

    // 手动刷新骰子池
    async refreshDicePool() {
        const { $, window: coreWin } = getCore();
        
        // 显示加载状态
        const $poolArea = $('#dnd-detail-popup-el').find('.dnd-dice-pool-visual');
        if ($poolArea.length) {
            $poolArea.html('<div style="text-align:center;color:#888;padding:10px;">🔄 补充中...</div>');
        }
        
        // 强制补充
        DiceManager.isRefilling = false; // 重置标志
        await DiceManager.checkAndRefill();
        
        // 关闭并重新打开面板以刷新显示
        setTimeout(() => {
            const pos = this._lastClickPos || { x: coreWin.innerWidth / 2, y: 100 };
            this.hideDetailPopup();
            this.showQuickDice({ clientX: pos.x, clientY: pos.y });
        }, 500);
    },

    // 投掷骰子并显示结果
    rollDice(sides, event) {
        const result = Math.floor(Math.random() * sides) + 1;
        const isNat20 = sides === 20 && result === 20;
        const isNat1 = sides === 20 && result === 1;
        
        let resultHtml = '';
        if (isNat20) {
            resultHtml = `<div style="text-align:center;padding:15px;">
                <div style="font-size:48px;color:var(--dnd-accent-green);text-shadow:0 0 20px rgba(46, 204, 113, 0.5);animation:dnd-pulse 0.5s ease-in-out;">✨ ${result} ✨</div>
                <div style="font-size:14px;color:var(--dnd-text-highlight);margin-top:5px;">大成功！NATURAL 20!</div>
            </div>`;
        } else if (isNat1) {
            resultHtml = `<div style="text-align:center;padding:15px;">
                <div style="font-size:48px;color:var(--dnd-accent-red);text-shadow:0 0 20px rgba(192, 57, 43, 0.5);">💀 ${result} 💀</div>
                <div style="font-size:14px;color:#e74c3c;margin-top:5px;">大失败... NATURAL 1</div>
            </div>`;
        } else {
            resultHtml = `<div style="text-align:center;padding:15px;">
                <div style="font-size:36px;color:var(--dnd-text-highlight);">🎲 ${result}</div>
                <div style="font-size:12px;color:#888;margin-top:5px;">D${sides} 投掷结果</div>
            </div>`;
        }
        
        // 更新弹窗内容而不是 alert
        const { $ } = getCore();
        const $popup = $('#dnd-detail-popup-el');
        if ($popup.length) {
            // 在现有内容前插入结果
            const $result = $(`<div class="dnd-roll-result" style="margin-bottom:10px;background:rgba(0,0,0,0.4);border-radius:6px;border:1px solid var(--dnd-border-gold);">${resultHtml}</div>`);
            
            // 移除之前的结果
            $popup.find('.dnd-roll-result').remove();
            
            // 在标题后插入
            $popup.find('> div').first().after($result);
            
            // 动画效果
            $result.css({ opacity: 0, transform: 'scale(0.8)' });
            setTimeout(() => {
                $result.css({ opacity: 1, transform: 'scale(1)', transition: 'all 0.3s ease-out' });
            }, 10);
        }
    },

    // 自定义骰子表达式投掷
    rollCustomDice() {
        const { $ } = getCore();
        const expr = $('#dnd-custom-dice').val().trim();
        if (!expr) return;
        
        try {
            // 解析表达式 (支持 2d6+3, 1d20-2, 3d8 等)
            const regex = /^(\d*)d(\d+)([+-]\d+)?$/i;
            const match = expr.match(regex);
            
            if (!match) {
                NotificationSystem.warning('格式错误，请使用如 2d6+3 的格式');
                return;
            }
            
            const count = parseInt(match[1]) || 1;
            const sides = parseInt(match[2]);
            const modifier = parseInt(match[3]) || 0;
            
            if (count > 20 || sides > 100) {
                NotificationSystem.warning('骰子数量不能超过20，面数不能超过100');
                return;
            }
            
            // 投掷
            const rolls = [];
            let total = 0;
            for (let i = 0; i < count; i++) {
                const r = Math.floor(Math.random() * sides) + 1;
                rolls.push(r);
                total += r;
            }
            total += modifier;
            
            const rollsStr = rolls.join(' + ');
            const modStr = modifier > 0 ? ` + ${modifier}` : (modifier < 0 ? ` - ${Math.abs(modifier)}` : '');
            
            const resultHtml = `<div style="text-align:center;padding:15px;">
                <div style="font-size:32px;color:var(--dnd-text-highlight);">🎲 ${total}</div>
                <div style="font-size:11px;color:#888;margin-top:5px;">${expr.toUpperCase()}: (${rollsStr})${modStr}</div>
            </div>`;
            
            const $popup = $('#dnd-detail-popup-el');
            if ($popup.length) {
                $popup.find('.dnd-roll-result').remove();
                const $result = $(`<div class="dnd-roll-result" style="margin-bottom:10px;background:rgba(0,0,0,0.4);border-radius:6px;border:1px solid var(--dnd-border-gold);">${resultHtml}</div>`);
                $popup.find('> div').first().after($result);
                $result.css({ opacity: 0, transform: 'scale(0.8)' });
                setTimeout(() => {
                    $result.css({ opacity: 1, transform: 'scale(1)', transition: 'all 0.3s ease-out' });
                }, 10);
            }
        } catch(e) {
            NotificationSystem.error('投掷失败: ' + e.message);
        }
    },

    // ==========================================
    // 快捷栏 (Quick Bar) 逻辑
    // ==========================================
    quickBarState: false, // hidden
    _quickBarCloseHandler: null,

    toggleQuickBar(forceState = null) {
        const { $ } = getCore();
        
        if (forceState !== null) {
            this.quickBarState = forceState;
        } else {
            this.quickBarState = !this.quickBarState;
        }
        
        const $bar = $('#dnd-quick-bar');
        const $trigger = $('#dnd-quick-trigger');
        
        if (this.quickBarState) {
            $bar.addClass('visible');
            $trigger.text('◀'); // Visible: Show Left Arrow to Collapse
        } else {
            $bar.removeClass('visible');
            $trigger.text('▶'); // Hidden: Show Right Arrow to Expand
        }
    },

    async renderQuickBar(providedSlots = null) {
        const { $ } = getCore();
        const $bar = $('#dnd-quick-bar');
        if (!$bar.length) return;
        
        // 渲染函数
        const render = (currentSlots) => {
            if (!currentSlots) currentSlots = [];
            Logger.debug('Rendering quick bar with items:', currentSlots.length);
            
            let html = '';
            currentSlots.forEach((slot, index) => {
                const name = slot.data.name || '???';
                // Change display to show first 4 chars of text name instead of icon
                const shortName = name.substring(0, 4);
                
                html += `
                    <div class="dnd-quick-slot dnd-hover-lift" title="${name}" onclick="window.DND_Dashboard_UI.executeQuickSlot(${index})">
                        ${shortName}
                        <div class="dnd-quick-slot-remove" onclick="event.stopPropagation(); window.DND_Dashboard_UI.removeQuickSlot(${index})">✕</div>
                    </div>
                `;
            });
            // 添加按钮 (强制显示)
            html += `
                <div class="dnd-quick-slot add-btn dnd-clickable" title="添加快捷方式" onclick="window.DND_Dashboard_UI.showQuickSlotSelector()">
                    +
                </div>
            `;
            $bar.html(html);
            
            // Trigger is separate
        };
        
        // 如果提供了数据，直接渲染并返回
        if (providedSlots) {
            render(providedSlots);
            return;
        }
        
        // 1. 立即渲染缓存（如果存在）或空状态
        render(this._cachedQuickSlots || []);
        
        // 2. 异步加载数据并更新
        try {
            const saved = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.QUICK_SLOTS);
            let slots = [];
            if (saved) slots = typeof saved === 'string' ? JSON.parse(saved) : saved;
            
            this._cachedQuickSlots = slots; // Cache it
            render(slots);
        } catch(e) {
            Logger.error('Quick slots load error', e);
        }
    },

    showQuickSlotSelector() {
        const { $ } = getCore();
        
        // 获取数据
        const items = DataManager.getTable('ITEM_Inventory') || [];
        // 获取当前操控角色 ID
        const char = this.getControlledCharacter();
        const charId = char ? (char['PC_ID'] || char['CHAR_ID'] || char['姓名']) : null;
        
        // [修复] 过滤掉法术，避免在技能栏重复显示
        const allSkills = charId ? DataManager.getCharacterSkills(charId) : [];
        const skills = allSkills.filter(s => s['技能类型'] !== '法术');
        
        const spells = charId ? DataManager.getKnownSpells(charId) : [];
        
        // 辅助转义函数 (解决 HTML 属性中的引号问题)
        const esc = (str) => {
            if (str === null || str === undefined) return '';
            return String(str).replace(/'/g, "\\'").replace(/"/g, '"');
        };
        
        // 构建 HTML
        const html = `
            <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:10px;margin-bottom:15px;text-align:center;">
                添加快捷方式
            </div>
            
            <div style="display:flex;gap:10px;margin-bottom:15px;border-bottom:1px solid rgba(255,255,255,0.1);">
                <div class="dnd-tab-btn active" data-tab="items" onclick="window.DND_Dashboard_UI.switchQuickTab('items')" style="padding:8px 15px;cursor:pointer;border-bottom:2px solid var(--dnd-border-gold);">🎒 物品</div>
                <div class="dnd-tab-btn" data-tab="skills" onclick="window.DND_Dashboard_UI.switchQuickTab('skills')" style="padding:8px 15px;cursor:pointer;border-bottom:2px solid transparent;color:#888;">✨ 技能</div>
                <div class="dnd-tab-btn" data-tab="spells" onclick="window.DND_Dashboard_UI.switchQuickTab('spells')" style="padding:8px 15px;cursor:pointer;border-bottom:2px solid transparent;color:#888;">📜 法书</div>
            </div>
            
            <div id="dnd-quick-tab-items" class="dnd-quick-tab-content" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;">
                ${items.map(i => {
                    const name = i['物品名称'];
                    const id = i['物品ID'] || name;
                    // 使用 data 属性传递数据，避免 HTML 生成错误
                    return `<div class="dnd-clickable" style="padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;"
                            data-type="item" data-name="${esc(name)}" data-id="${esc(id)}" data-icon="🎒" data-level=""
                            onclick="window.DND_Dashboard_UI.handleAddClick(this)">${name}</div>`;
                }).join('') || '<div style="text-align:center;color:#666">无物品</div>'}
            </div>
            
            <div id="dnd-quick-tab-skills" class="dnd-quick-tab-content" style="max-height:300px;overflow-y:auto;display:none;flex-direction:column;gap:5px;">
                ${skills.map(s => {
                    const name = s['技能名称'];
                    const level = s['环阶'] || s['等级'] || '';
                    const levelLabel = (level && level !== '0' && level !== '戏法') ? `(${level}环)` : '';
                    
                    return `<div class="dnd-clickable" style="padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;"
                            data-type="skill" data-name="${esc(name)}" data-id="" data-icon="✨" data-level="${esc(level)}"
                            onclick="window.DND_Dashboard_UI.handleAddClick(this)">
                            <span>${name}</span> <span style="font-size:11px;color:#888;">${levelLabel}</span>
                            </div>`;
                }).join('') || '<div style="text-align:center;color:#666">无技能</div>'}
            </div>
            
            <div id="dnd-quick-tab-spells" class="dnd-quick-tab-content" style="max-height:300px;overflow-y:auto;display:none;flex-direction:column;gap:5px;">
                ${spells.map(s => {
                    const name = s['法术名称'];
                    const level = s['环阶'] === '0' || s['环阶'] === 0 ? '戏法' : (s['环阶']+'环');
                    return `<div class="dnd-clickable" style="padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;"
                            data-type="skill" data-name="${esc(name)}" data-id="" data-icon="📜" data-level="${esc(s['环阶'])}"
                            onclick="window.DND_Dashboard_UI.handleAddClick(this)">
                            <span>${name}</span><span style="color:#888;font-size:11px;">${level}</span>
                            </div>`;
                }).join('') || '<div style="text-align:center;color:#666">无法术</div>'}
            </div>
        `;
        
        const { window: coreWin } = getCore();
        const winW = coreWin.innerWidth || $(coreWin).width();
        const winH = coreWin.innerHeight || $(coreWin).height();
        this.showItemDetailPopup(html, winW/2 - 150, winH/2 - 200);
    },

    switchQuickTab(tabName) {
        const { $ } = getCore();
        $('.dnd-tab-btn').css({borderBottomColor:'transparent', color:'#888'}).removeClass('active');
        $(`.dnd-tab-btn[data-tab="${tabName}"]`).css({borderBottomColor:'var(--dnd-border-gold)', color:'#fff'}).addClass('active');
        
        $('.dnd-quick-tab-content').hide();
        $(`#dnd-quick-tab-${tabName}`).css('display', 'flex');
    },

    // [新增] 处理添加点击 (从 data 属性读取)
    handleAddClick(el) {
        const { $ } = getCore();
        const $el = $(el);
        Logger.info('handleAddClick triggered for:', $el.data('name'));
        this.addQuickSlot(
            $el.data('type'),
            $el.data('name'),
            $el.data('id'),
            $el.data('icon'),
            $el.data('level')
        );
    },

    async addQuickSlot(type, name, id, icon, level) {
        name = name || '未命名';
        id = String(id || '');
        icon = icon || '❓';
        level = String(level || '');

        const data = { name, id, icon, level };
        Logger.info('[DND Dashboard] Adding quick slot:', type, data);
        
        let slots = [];
        // 优先使用缓存
        if (this._cachedQuickSlots) {
            slots = [...this._cachedQuickSlots];
        } else {
            try {
                const saved = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.QUICK_SLOTS);
                if (saved) slots = typeof saved === 'string' ? JSON.parse(saved) : saved;
            } catch(e) { Logger.error('Load Error:', e); }
        }
        
        slots.push({ type, data });
        
        // 1. 立即更新缓存和UI (乐观更新)
        this._cachedQuickSlots = slots;
        this.renderQuickBar(slots);
        this.hideDetailPopup();
        
        // 2. 后台保存
        safeSave(CONFIG.STORAGE_KEYS.QUICK_SLOTS, JSON.stringify(slots))
            .then(() => Logger.info('Quick slots saved async'))
            .catch(err => {
                Logger.error('Save failed:', err);
                NotificationSystem.error('保存失败，请检查数据库连接');
            });

        // 反馈提示
        const { $ } = getCore();
        const $hud = $('#dnd-mini-hud');
        const $toast = $('<div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(46, 204, 113, 0.9);color:white;padding:5px 10px;border-radius:4px;font-size:12px;z-index:9999;">已添加</div>');
        $hud.append($toast);
        setTimeout(() => $toast.fadeOut(500, () => $toast.remove()), 1000);
    },

    async removeQuickSlot(index) {
        const confirmed = await NotificationSystem.confirm('确定要移除此快捷方式吗？', {
            title: '移除快捷方式',
            confirmText: '移除',
            type: 'danger'
        });
        if (!confirmed) return;
        
        let slots = this._cachedQuickSlots || [];
        // 如果缓存为空，尝试读取
        if (slots.length === 0) {
            try {
                const saved = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.QUICK_SLOTS);
                if (saved) slots = typeof saved === 'string' ? JSON.parse(saved) : saved;
            } catch(e) {}
        }
        
        slots.splice(index, 1);
        
        // 乐观更新
        this._cachedQuickSlots = slots;
        this.renderQuickBar(slots);
        
        // 后台保存
        safeSave(CONFIG.STORAGE_KEYS.QUICK_SLOTS, JSON.stringify(slots));
    },

    executeQuickSlot(index) {
        // 需要重新获取 slot 数据
        DBAdapter.getSetting(CONFIG.STORAGE_KEYS.QUICK_SLOTS).then(saved => {
            if (!saved) return;
            const slots = typeof saved === 'string' ? JSON.parse(saved) : saved;
            const slot = slots[index];
            if (!slot) return;
            
            if (slot.type === 'item') {
                const text = `我使用了 ${slot.data.name}`;
                this.fillChatInput(text);
            } else if (slot.type === 'skill' || slot.type === 'spell') {
                const baseLevel = slot.data.level;
                // 检查是否有等级且大于0
                const lvlNum = parseInt(baseLevel);
                const hasLevel = !isNaN(lvlNum) && lvlNum > 0 && baseLevel !== '戏法' && baseLevel !== '0';
                
                if (!hasLevel) {
                    const action = slot.type === 'spell' ? '施放了戏法' : '使用了技能';
                    this.fillChatInput(`我${action}：${slot.data.name}`);
                } else {
                    // 升环/等级选择
                    const { $, window: coreWin } = getCore();
                    const winW = coreWin.innerWidth || $(coreWin).width();
                    const winH = coreWin.innerHeight || $(coreWin).height();
                    
                    const isSpell = slot.type === 'spell';
                    const title = isSpell ? `✨ 选择施法环阶 (${slot.data.name})` : `✨ 选择技能等级 (${slot.data.name})`;
                    
                    let html = `<div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:10px;text-align:center;">${title}</div>`;
                    html += `<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;">`;
                    
                    // Ensure spell/skill level selection starts from base level
                    const start = lvlNum || 1;
                    
                    // 获取最高法术位 (仅针对法术)
                    let limit = 9;
                    if (isSpell) {
                        const party = DataManager.getPartyData();
                        const pc = party.find(p => p.type === 'PC' || p.isPC) || party[0];
                        const maxSlot = DataManager.getMaxSpellSlotLevel(pc);
                        if (maxSlot > 0) limit = maxSlot;
                        limit = Math.max(start, limit);
                    }

                    for (let i = start; i <= limit; i++) {
                        const chatText = isSpell
                            ? `我使用 ${i} 环法术位施放了 ${slot.data.name}`
                            : `我以 ${i} 级使用了技能：${slot.data.name}`;
                            
                        html += `
                            <button class="dnd-clickable" style="background:rgba(255,255,255,0.05);border:1px solid #555;color:#ccc;padding:8px;border-radius:4px;cursor:pointer;font-weight:bold;"
                                onclick="window.DND_Dashboard_UI.fillChatInput('${chatText}'); window.DND_Dashboard_UI.hideDetailPopup();">
                                ${i} ${isSpell ? '环' : '级'}
                            </button>
                        `;
                    }
                    html += `</div>`;
                    
                    this.showItemDetailPopup(html, winW/2 - 100, winH/2 - 100);
                }
            }
        });
    }
};
