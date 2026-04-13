import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { DataManager } from '../../data/DataManager.js';
import { PresetSwitcher } from '../../features/PresetSwitcher.js';
import { NotificationSystem } from './UIUtils.js';
import { ICONS } from '../SVGIcons.js';

export default {
    _resourceTracker: {
        // Keyed by charId: { spellSlots: {}, classResources: {} }
        snapshots: {}
    },

    // [新增] 动作经济追踪
    _turnResources: {
        action: 1,
        bonus: 1,
        reaction: 1,
        movement: 30 // 默认 30尺
    },

    // [新增] 瞄准模式状态
    _targetingMode: {
        active: false,
        type: null, // 'move' or 'skill'
        source: null, // character object
        range: 0, // in grid units
        skillName: null,
        callback: null
    },

    // [新增] 行动队列状态
    _actionQueue: [],
    _virtualPos: null, // {x, y} 记录移动后的虚拟位置

    // [新增] 手动调整动作资源
    adjustTurnResource(type) {
        // type: 'action', 'bonus', 'reaction', 'movement'
        if (type === 'movement') {
            // 移动力增加 30尺
            this._turnResources.movement += 30;
        } else {
            // 其他资源 +1
            if (this._turnResources[type] !== undefined) {
                this._turnResources[type]++;
            }
        }
        this.renderHUD();
        PresetSwitcher.showNotification(true, `已添加资源: ${type}`);
    },

    resetActionEconomy() {
        const char = this.getControlledCharacter();
        // 尝试从属性读取速度
        let speed = 30;
        if (char && char['速度']) {
            const parsed = parseInt(char['速度']);
            if (!isNaN(parsed)) speed = parsed;
        }

        // 尝试从职业资源中读取自定义覆盖 (如 "每轮动作: 2")
        const res = DataManager.parseValue(char['职业资源'], 'resources') || {};
        const findMax = (keywords, defaultVal) => {
            const key = Object.keys(res).find(k => keywords.some(w => k.toLowerCase().includes(w.toLowerCase())));
            if (key) {
                const parts = res[key].toString().split('/');
                return parseInt(parts[1]) || parseInt(parts[0]) || defaultVal;
            }
            return defaultVal;
        };

        this._turnResources = {
            action: findMax(['每轮动作', 'Actions Per Turn'], 1),
            bonus: findMax(['每轮附赠', 'Bonus Per Turn'], 1),
            reaction: findMax(['每轮反应', 'Reactions Per Turn'], 1),
            movement: speed
        };
        this.renderHUD();
    },

    initResourceTracker() {
        const char = this.getControlledCharacter();
        if (!char) return;
        
        const charId = char['CHAR_ID'] || char['PC_ID'] || char['姓名'];
        
        this._resourceTracker.snapshots[charId] = {
            spellSlots: JSON.parse(JSON.stringify(DataManager.parseValue(char['法术位'], 'resources') || {})),
            classResources: JSON.parse(JSON.stringify(DataManager.parseValue(char['职业资源'], 'resources') || {}))
        };
        Logger.info('Resource tracker initialized for', char['姓名']);
    },

    calculateResourceConsumption() {
        const char = this.getControlledCharacter();
        if (!char) return null;
        
        const charId = char['CHAR_ID'] || char['PC_ID'] || char['姓名'];
        const snapshot = this._resourceTracker.snapshots[charId];
        
        if (!snapshot) return null;
        
        const currentSlots = DataManager.parseValue(char['法术位'], 'resources') || {};
        const currentRes = DataManager.parseValue(char['职业资源'], 'resources') || {};
        
        const consumption = {
            spellSlots: {},
            classResources: {}
        };
        
        // 计算法术位消耗
        if (snapshot.spellSlots) {
            for (const [level, val] of Object.entries(snapshot.spellSlots)) {
                const startParts = val.toString().split('/');
                const startCurr = parseInt(startParts[0]) || 0;
                
                const currVal = currentSlots[level] || "0/0";
                const currParts = currVal.toString().split('/');
                const currCurr = parseInt(currParts[0]) || 0;
                
                if (startCurr > currCurr) {
                    consumption.spellSlots[level] = startCurr - currCurr;
                }
            }
        }
        
        // 计算职业资源消耗
        if (snapshot.classResources) {
            for (const [name, val] of Object.entries(snapshot.classResources)) {
                let startVal = parseInt(val);
                if (val.toString().includes('/')) {
                    startVal = parseInt(val.toString().split('/')[0]) || 0;
                }
                
                let currRaw = currentRes[name] || 0;
                let currVal = parseInt(currRaw);
                if (currRaw.toString().includes('/')) {
                    currVal = parseInt(currRaw.toString().split('/')[0]) || 0;
                }
                
                if (!isNaN(startVal) && !isNaN(currVal) && startVal > currVal) {
                    consumption.classResources[name] = startVal - currVal;
                }
            }
        }
        
        return consumption;
    },

    renderResourceConsumption($container) {
        const consumption = this.calculateResourceConsumption();
        if (!consumption) {
            $container.html('');
            return;
        }
        
        const hasSlots = Object.keys(consumption.spellSlots).length > 0;
        const hasRes = Object.keys(consumption.classResources).length > 0;
        
        if (!hasSlots && !hasRes) {
            $container.html('');
            return;
        }
        
        let html = `<div class="dnd-resource-consumption" style="margin-top:10px;padding:8px;background:var(--dnd-bg-secondary);border-radius:4px;border:1px dashed var(--dnd-border-subtle);">
            <div style="font-size:11px;color:var(--dnd-text-dim);margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;">
                <span><i class="fa-solid fa-bolt"></i> 本场战斗消耗</span>
                <span class="dnd-clickable" style="cursor:pointer;color:var(--dnd-text-dim);font-size:14px;line-height:1;" title="重置统计" onclick="window.DND_Dashboard_UI.initResourceTracker(); window.DND_Dashboard_UI.renderHUD();"><i class="fa-solid fa-sync"></i></span>
            </div>`;
        
        if (hasSlots) {
            html += `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px;">`;
            for (const [level, used] of Object.entries(consumption.spellSlots)) {
                html += `<span style="font-size:10px;color:var(--dnd-accent-red);background:var(--dnd-bg-tertiary);padding:1px 4px;border-radius:2px;">${level}: -${used}</span>`;
            }
            html += `</div>`;
        }
        
        if (hasRes) {
            html += `<div style="display:flex;flex-wrap:wrap;gap:5px;">`;
            for (const [name, used] of Object.entries(consumption.classResources)) {
                html += `<span style="font-size:10px;color:var(--dnd-text-highlight);background:var(--dnd-bg-tertiary);padding:1px 4px;border-radius:2px;">${name}: -${used}</span>`;
            }
            html += `</div>`;
        }
        
        html += `</div>`;
        $container.html(html);
    },

    // [新增] 解析距离文本为格子数 (默认 1格=5尺)
    parseDistance(text) {
        if (!text) return 1; // 默认接触
        const str = String(text).toLowerCase();
        
        // 接触/自身
        if (str.includes('接触') || str.includes('touch') || str.includes('self') || str.includes('自身')) return 1;
        
        // 提取数字
        const match = str.match(/(\d+)/);
        if (match) {
            const val = parseInt(match[1]);
            // 假设单位是尺/ft，转换为格子 (5ft = 1格)
            return Math.max(1, Math.ceil(val / 5));
        }
        return 6; // 默认 30尺
    },

    // [新增] 智能施法处理 (根据战斗状态决定逻辑)
    handleCastClick(name, range, level, type, costType) {
        const global = DataManager.getTable('SYS_GlobalState');
        const isCombat = global && global[0] && global[0]['战斗模式'] === '战斗中';
        
        this.hideDetailPopup();
        
        if (isCombat) {
            // 战斗状态：进入瞄准模式
            this.startTargeting({
                type: type || 'skill',
                rangeText: range,
                skillName: name,
                costType: costType || 'Action', // 默认标准动作
                callback: (res) => this.executeAction(type || 'skill', res, costType || 'Action')
            });
        } else {
            // 非战斗状态：直接输出文本
            let text = '';
            if (type === 'spell') {
                if (level === '0' || level === '戏法' || !level) {
                    text = `我施放了戏法：${name}`;
                } else {
                    text = `我使用 ${level} 环法术位施放了 ${name}`;
                }
            } else {
                text = `我使用了技能：${name}`;
            }
            this.fillChatInput(text);
        }
    },

    // [新增] 准备施法 (选择环阶)
    prepareCast(spellName, rangeText, baseLevelStr) {
        // 解析环阶
        let baseLevel = 0;
        if (baseLevelStr && baseLevelStr !== '戏法' && baseLevelStr !== '0') {
            baseLevel = parseInt(baseLevelStr) || 1;
        }
        
        // 如果是戏法，直接调用处理
        if (baseLevel === 0) {
            this.handleCastClick(spellName, rangeText, '0', 'spell');
            return;
        }
        
        // 获取当前角色及其法术位
        const pc = this.getControlledCharacter();
        const maxSlot = DataManager.getMaxSpellSlotLevel(pc) || 9;
        const slots = DataManager.parseValue(pc['法术位'], 'resources') || {};
        
        // 如果基础环阶高于最大环阶（例如卷轴施法），则以上限为准，或者至少允许施放基础
        const limit = Math.max(baseLevel, maxSlot);

        // 否则显示环阶选择
        const { $ } = getCore();
        const $popup = $('#dnd-detail-popup-el');
        if ($popup.length) {
            let html = `<div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:10px;text-align:center;">${ICONS.SPARKLES} 选择施法环阶 (${spellName})</div>`;
            html += `<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;">`;
            
            for (let i = baseLevel; i <= limit; i++) {
                // 检查是否有可用法术位
                const slotKey = Object.keys(slots).find(k => parseInt(k) === i);
                let available = 0;
                if (slotKey) {
                    const parts = slots[slotKey].toString().split('/');
                    available = parseInt(parts[0]) || 0;
                }
                const isDisabled = available <= 0;
                
                // 使用转义字符处理 spellName 中的潜在特殊字符
                const safeName = spellName.replace(/'/g, "\\'");
                
                // 样式处理
                const style = isDisabled
                    ? "background:var(--dnd-bg-secondary);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-dim);padding:8px;border-radius:4px;cursor:not-allowed;"
                    : "background:var(--dnd-bg-input);border:1px solid var(--dnd-border-inner);color:var(--dnd-text-main);padding:8px;border-radius:4px;cursor:pointer;font-weight:bold;";
                
                const action = isDisabled
                    ? ""
                    : `onclick="window.DND_Dashboard_UI.handleCastClick('${safeName}', '${rangeText}', '${i}', 'spell')"`;
                    
                const mouseOver = isDisabled
                    ? ""
                    : `onmouseover="this.style.borderColor='var(--dnd-border-gold)';this.style.color='var(--dnd-text-highlight)';this.style.background='var(--dnd-bg-tertiary)'"`;
                    
                const mouseOut = isDisabled
                    ? ""
                    : `onmouseout="this.style.borderColor='var(--dnd-border-inner)';this.style.color='var(--dnd-text-main)';this.style.background='var(--dnd-bg-input)'"`;

                html += `
                    <button class="dnd-clickable" style="${style}" ${mouseOver} ${mouseOut} ${action}>
                        ${i} 环 ${isDisabled ? '(0)' : `(${available})`}
                    </button>
                `;
            }
            html += `</div>`;
            
            // 替换当前弹窗内容
            const $content = $popup.find('> div:not(:first-child)');
            if ($content.length) {
                $content.html(html);
            } else {
                // Fallback
                $popup.append('<div style="padding-right:20px;">' + html + '</div>');
            }
        }
    },

    // [新增] 开启瞄准模式
    startTargeting(config) {
        Logger.debug('[Targeting] Start config:', config);
        const { type, source, rangeText, skillName, costType } = config;
        const range = this.parseDistance(rangeText);
        
        // 检查资源是否足够 (提前检查)
        if (type !== 'move' && costType) {
            const key = costType.toLowerCase();
            if (this._turnResources[key] <= 0) {
                NotificationSystem.warning(`<i class="fa-solid fa-times-circle"></i> 无法执行：${costType} 资源已耗尽！`);
                return;
            }
        }
        
        this._targetingMode = {
            active: true,
            type: type || 'skill',
            source: source || null, // 需要包含坐标信息
            range: range,
            skillName: skillName || '行动',
            costType: costType,
            callback: config.callback
        };
        
        // 刷新地图以显示范围
        this.renderHUD();
        
        // 显示提示
        const { window: coreWin } = getCore();
        const msg = type === 'move' ? '请选择移动目标点' : `请选择 ${skillName} 的目标`;
        this.showItemDetailPopup(`<div style="text-align:center;color:var(--dnd-accent-green);font-weight:bold;">${ICONS.TARGET} ${msg}</div>`, coreWin.innerWidth/2, 100);
    },

    // [新增] 结束瞄准模式
    endTargeting() {
        this._targetingMode = { active: false, type: null, source: null, range: 0 };
        // 清除虚拟位置，以确保下次瞄准从真实位置开始 (或者在 executeAction 中更新)
        
        this.renderHUD();
        this.hideDetailPopup();
    },

    // [新增] 执行最终动作 (加入队列)
    executeAction(type, data, costType) {
        const { x, y, target, distance } = data;
        const activeChar = this.getControlledCharacter();
        const charName = activeChar ? activeChar['姓名'] : '我';
        
        const coord = `${String.fromCharCode(64 + x)}${y}`;
        let desc = '';
        
        // 特殊技能自动化逻辑
        const skillName = (this._targetingMode.skillName || '').toLowerCase();
        let extraDesc = '';
        
        // 疾走 (Dash): 消耗动作(由costType处理)，增加移动力
        if (skillName.includes('dash') || skillName.includes('疾走') || skillName.includes('冲刺')) {
            const speed = parseInt(activeChar['速度']) || 30;
            this._turnResources.movement += speed;
            extraDesc = ` (疾走: +${speed}尺移动)`;
        }
        
        // 动作如潮 (Action Surge): 增加动作
        if (skillName.includes('action surge') || skillName.includes('动作如潮')) {
            this._turnResources.action++;
            extraDesc = ` (动作如潮: +1 动作)`;
        }

        // 扣除资源
        if (type === 'move') {
            // 移动消耗 (每格5尺)
            const cost = (distance || 0) * 5;
            if (this._turnResources.movement < cost) {
                NotificationSystem.warning(`移动距离不足！剩余: ${this._turnResources.movement}尺, 需要: ${cost}尺`);
                return; // 阻止执行
            }
            this._turnResources.movement -= cost;
            desc = `移动到了 ${coord} (消耗 ${cost}尺)`;
            // 更新虚拟位置
            this._virtualPos = { x, y };
        } else {
            // 动作/附赠/反应消耗
            let key = (costType || 'Action').toLowerCase();
            
            // 动作如潮本身不消耗动作 (Free)
            if (skillName.includes('action surge') || skillName.includes('动作如潮')) {
                key = 'free';
            }

            if (this._turnResources[key] !== undefined) {
                if (this._turnResources[key] <= 0) {
                    NotificationSystem.warning(`没有足够的 ${costType}！`);
                    return; // 阻止执行
                }
                this._turnResources[key]--;
            }
            
            const skill = this._targetingMode.skillName;
            if (target) {
                desc = `对 ${target} 施放了 【${skill}】${extraDesc}`;
            } else {
                desc = `在 ${coord} 施放了 【${skill}】${extraDesc}`;
            }
        }
        
        // 加入队列
        this._actionQueue.push({ type, data, desc, charName });
        
        // 刷新界面
        this.renderHUD();
    },

    // [新增] 提交行动队列
    commitActions() {
        if (this._actionQueue.length === 0) return;
        
        // 获取行动的主体名称
        const first = this._actionQueue[0];
        const charName = first.charName || '我';
        
        // 合并文本
        const steps = this._actionQueue.map(a => a.desc);
        let actionStr = '';
        
        if (steps.length === 1) {
            actionStr = steps[0];
        } else {
            actionStr = steps.join('，然后 ');
        }
        
        // 使用用户指定的特定前缀格式 (轮到[角色名]的回合时)
        const finalStr = `轮到${charName}的回合时，${actionStr}。`;
        
        this.fillChatInput(finalStr);
        this.clearActions();
    },

    // [新增] 清空行动队列
    clearActions() {
        this._actionQueue = [];
        this._virtualPos = null;
        this.resetActionEconomy(); // 重置动作经济
    },

    // 显示战斗单位详情
    showCombatUnitDetail(unit, event) {
        const { $ } = getCore();
        
        // 解析 HP
        const hpStr = unit['HP状态'] || '??/??';
        
        // 样式根据阵营
        const isEnemy = unit['阵营'] === '敌方';
        const color = isEnemy ? 'var(--dnd-accent-red)' : 'var(--dnd-text-highlight)';
        
        const html = `
            <div style="border-bottom:1px solid ${color};padding-bottom:5px;margin-bottom:10px;font-weight:bold;color:${color};font-size:16px;display:flex;justify-content:space-between;">
                <span>${unit['单位名称']}</span>
                <span style="font-size:12px;background:var(--dnd-bg-tertiary);padding:2px 6px;border-radius:4px;color:var(--dnd-text-main);">${unit['阵营']}</span>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;font-size:13px;">
                <div style="background:var(--dnd-bg-secondary);padding:8px;border-radius:4px;">
                    <div style="color:var(--dnd-text-dim);font-size:11px;">HP 状态</div>
                    <div style="font-weight:bold;color:var(--dnd-text-main);">${hpStr}</div>
                </div>
                <div style="background:var(--dnd-bg-secondary);padding:8px;border-radius:4px;">
                    <div style="color:var(--dnd-text-dim);font-size:11px;">先攻 / 位置</div>
                    <div style="font-weight:bold;color:var(--dnd-text-main);">${unit['先攻/位置'] || '-'}</div>
                </div>
            </div>

            <div style="margin-bottom:10px;">
                <div style="color:var(--dnd-text-dim);font-size:12px;margin-bottom:3px;">防御 / 抗性</div>
                <div style="color:var(--dnd-text-main);font-size:13px;background:var(--dnd-bg-input);padding:5px;border-radius:3px;">${unit['防御/抗性'] || '无'}</div>
            </div>
            
            <div style="margin-bottom:10px;">
                <div style="color:var(--dnd-text-dim);font-size:12px;margin-bottom:3px;">附着状态</div>
                <div style="color:var(--dnd-text-header);font-size:13px;background:var(--dnd-bg-input);padding:5px;border-radius:3px;">${unit['附着状态'] || '无'}</div>
            </div>

            <div>
                <div style="color:var(--dnd-text-dim);font-size:12px;margin-bottom:3px;">回合资源</div>
                <div style="color:var(--dnd-text-main);font-size:12px;line-height:1.4;">${unit['回合资源'] || '-'}</div>
            </div>
        `;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [新增] 显示战斗技能列表 (当前操控角色技能)
    showCombatSkillList(event) {
        console.log('[DND Dashboard] showCombatSkillList called');
        
        // 获取当前操控的角色
        const current = this.getControlledCharacter();
        
        if (!current) {
            NotificationSystem.warning('未找到当前操控角色数据。');
            return;
        }
        
        const charId = current['PC_ID'] || current['CHAR_ID'] || current['姓名'];
        // 尝试获取技能 (同时尝试使用 ID 和 姓名 查找，以防匹配失败)
        let skills = DataManager.getCharacterSkills(charId);
        if ((!skills || skills.length === 0) && current['姓名'] && current['姓名'] !== charId) {
            skills = DataManager.getCharacterSkills(current['姓名']);
        }
        
        if (!skills || skills.length === 0) {
            // 尝试显示提示而不是直接退出
            const html = `<div style="padding:15px;text-align:center;">
                <div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:10px;"><i class="fa-solid fa-bolt"></i> ${current['姓名']}</div>
                <div style="color:var(--dnd-text-dim);">该角色暂无已学习的技能或法术。</div>
            </div>`;
            this.showItemDetailPopup(html, event.clientX, event.clientY);
            return;
        }

        // 简单分类：动作、附赠动作、反应
        const grouped = {
            '动作': [],
            '附赠动作': [],
            '反应': [],
            '其他': []
        };
        
        // 处理所有能力 (技能 + 法术)
        const processAbility = (s) => {
            const isSpell = s['技能类型'] === '法术';
            const name = s['技能名称'];
            const time = (s['施法时间'] || '').toLowerCase();
            
            // 解析动作花费类型
            let costType = 'Action';
            if (time.includes('bonus') || time.includes('附赠')) costType = 'Bonus';
            else if (time.includes('reaction') || time.includes('反应')) costType = 'Reaction';
            else if (time.includes('free') || time.includes('自由')) costType = 'Free';
            
            const item = { ...s, _isSpell: isSpell, _displayName: name, _costType: costType };
            
            if (costType === 'Bonus') grouped['附赠动作'].push(item);
            else if (costType === 'Reaction') grouped['反应'].push(item);
            else grouped['动作'].push(item);
        };

        if (skills) skills.forEach(s => processAbility(s));
        
        let html = `<div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid var(--dnd-border-subtle);padding-bottom:5px;margin-bottom:10px;"><i class="fa-solid fa-bolt"></i> ${current['姓名']} 的技能</div>`;
        html += `<div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">`;
        
        let hasSkills = false;
        Object.keys(grouped).forEach(type => {
            if (grouped[type].length === 0) return;
            hasSkills = true;
            
            html += `<div style="font-size:12px;color:var(--dnd-text-dim);border-bottom:1px dashed var(--dnd-border-subtle);margin-top:5px;">${type}</div>`;
            grouped[type].forEach(s => {
                const rawName = s._displayName || '未命名';
                const safeName = rawName.replace(/'/g, "\\'").replace(/"/g, '"');
                const safeRange = (s['射程'] || '接触').replace(/'/g, "\\'");
                const isSpell = s._isSpell;
                const icon = isSpell ? '<i class="fa-solid fa-scroll"></i>' : '<i class="fa-solid fa-gavel"></i>';
                const costType = s._costType;
                
                const actionType = isSpell ? 'spell' : 'skill';
                const lvlVal = s['环阶'];
                const isCantrip = lvlVal === '0' || lvlVal === 0 || lvlVal === '戏法' || !lvlVal;
                
                let onClick = '';
                if (isSpell && !isCantrip) {
                    onClick = `window.DND_Dashboard_UI.prepareCast('${safeName}', '${safeRange}', '${lvlVal}', '${costType}')`;
                } else {
                    onClick = `window.DND_Dashboard_UI.handleCastClick('${safeName}', '${safeRange}', '${lvlVal||''}', '${actionType}', '${costType}')`;
                }
                
                html += `
                    <div class="dnd-clickable" style="padding:6px;background:var(--dnd-bg-input);border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
                        onclick="${onClick}">
                        <span style="color:var(--dnd-text-main);">${icon} ${rawName}</span>
                        <span style="font-size:10px;color:var(--dnd-text-dim);">${s['射程']||'-'}</span>
                    </div>
                `;
            });
        });
        
        if (!hasSkills) {
            html += `<div style="color:var(--dnd-text-dim);text-align:center;padding:10px;">无技能显示</div>`;
        }

        html += `</div>`;
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    }
};
