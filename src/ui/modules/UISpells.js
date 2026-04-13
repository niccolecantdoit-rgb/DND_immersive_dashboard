import { getCore, safeSave } from '../../core/Utils.js';
import { DataManager } from '../../data/DataManager.js';

export default {
    handleSpellClick(spellName, event) {
        if (event) { event.stopPropagation(); }
        
        const spells = DataManager.getKnownSpells(); // 默认获取主角法术
        if (!spells) return;
        
        const spell = spells.find(s => s['法术名称'] === spellName);
        if (!spell) return;
        
        const html = `
            <div style="color:var(--dnd-text-highlight);font-weight:bold;border-bottom:1px solid var(--dnd-border-subtle);margin-bottom:5px;padding-bottom:3px;display:flex;justify-content:space-between;align-items:center;">
                <span>${spell['法术名称']} <span style="font-size:10px;color:var(--dnd-text-dim);font-weight:normal">(${spell['环阶'] === '0' || spell['环阶'] === 0 ? '戏法' : spell['环阶']+'环'})</span></span>
                <button class="dnd-clickable" style="background:var(--dnd-btn-primary);border:none;color:var(--dnd-btn-text);padding:2px 8px;border-radius:3px;font-size:11px;cursor:pointer;"
                    onclick="window.DND_Dashboard_UI.prepareCast(
                        '${spell['法术名称']}',
                        '${spell['射程']||'接触'}',
                        '${spell['环阶']}'
                    )">
                    <i class="fa-solid fa-bolt"></i> 施放
                </button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:11px;color:var(--dnd-text-dim);margin-bottom:8px;">
                <div>时间: ${spell['施法时间']||'-'}</div>
                <div>射程: ${spell['射程']||'-'}</div>
                <div>成分: ${spell['成分']||'-'}</div>
                <div>持续: ${spell['持续时间']||'-'}</div>
            </div>
            <div style="line-height:1.4;color:var(--dnd-text-main);">${spell['效果描述']||'无描述'}</div>
        `;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    formatSpellSlots(slotsVal, isMini = false) {
        try {
            // 注入 BG3 风格样式 (如果尚未存在)
            const { $ } = getCore();
            if ($('#dnd-spell-styles').length === 0) {
                const style = `
                    <style id="dnd-spell-styles">
                        .dnd-spell-group {
                            border: 1px solid var(--dnd-border-gold);
                            border-radius: 4px;
                            padding: 8px 4px 4px 4px;
                            position: relative;
                            display: inline-flex;
                            flex-direction: column;
                            align-items: center;
                            margin-right: 10px;
                            margin-top: 8px;
                            background: var(--dnd-bg-tertiary);
                            min-width: 34px;
                            vertical-align: top;
                        }
                        .dnd-spell-group.mini {
                            min-width: 24px;
                            padding: 6px 3px 3px 3px;
                            margin-right: 5px;
                            margin-top: 6px;
                        }
                        .dnd-spell-level-label {
                            position: absolute;
                            top: -9px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: var(--dnd-bg-panel);
                            padding: 0 4px;
                            font-size: 10px;
                            color: var(--dnd-text-dim);
                            font-family: var(--dnd-font-serif);
                            line-height: 14px;
                        }
                        .dnd-spell-group.mini .dnd-spell-level-label {
                            top: -7px;
                            font-size: 8px;
                            line-height: 10px;
                            padding: 0 2px;
                        }
                        .dnd-spell-pips {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 3px;
                            justify-content: center;
                            max-width: 28px; /* Force wrapping for 4 items (2x2) */
                        }
                        .dnd-spell-group.mini .dnd-spell-pips {
                            gap: 2px;
                            max-width: 18px;
                        }
                        .dnd-spell-pip {
                            width: 10px;
                            height: 10px;
                            background: var(--dnd-bg-secondary);
                            border: 1px solid var(--dnd-border-subtle);
                            box-shadow: inset 0 0 2px var(--dnd-border-subtle);
                            transition: all 0.2s;
                        }
                        .dnd-spell-group.mini .dnd-spell-pip {
                            width: 6px;
                            height: 6px;
                        }
                        .dnd-spell-pip.available {
                            background: linear-gradient(135deg, var(--dnd-accent), var(--dnd-text-highlight));
                            border-color: var(--dnd-border-gold);
                            box-shadow: 0 0 5px var(--dnd-selected-bg);
                        }
                    </style>
                `;
                $('head').append(style);
            }

            // 支持 JSON 和 "1级:3/4|2级:2/3" 格式
            const slots = DataManager.parseValue(slotsVal, 'resources');
            if (!slots) return '';

            // 罗马数字转换 helper
            const toRoman = (num) => {
                const map = {1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII', 8:'VIII', 9:'IX'};
                return map[num] || num;
            };

            let html = '<div style="display:flex;flex-wrap:wrap;">';
            
            // 按环阶排序 (1级, 2级...)
            Object.keys(slots).sort((a,b) => parseInt(a)-parseInt(b)).forEach(k => {
                const parts = slots[k].toString().split('/');
                const curr = parseInt(parts[0]) || 0;
                const max = parseInt(parts[1]) || 0;
                if (max === 0) return;

                const levelNum = parseInt(k) || k.replace('级','');
                const roman = toRoman(levelNum);
                
                let pipsHtml = '';
                for(let i=0; i<max; i++) {
                    const isAvail = i < curr;
                    pipsHtml += `<div class="dnd-spell-pip ${isAvail ? 'available' : ''}" title="${isAvail ? '可用' : '已消耗'}"></div>`;
                }
                
                html += `
                    <div class="dnd-spell-group ${isMini ? 'mini' : ''}" title="${k}法术位: ${curr}/${max}">
                        <div class="dnd-spell-level-label">${roman}</div>
                        <div class="dnd-spell-pips">${pipsHtml}</div>
                    </div>
                `;
            });
            
            html += '</div>';
            return html;
        } catch(e) {
            console.error('Spell slot format error:', e);
            return '<span style="color:var(--dnd-accent-red)">资源解析错误</span>';
        }
    },

    // [新增] 显示法术书
    showSpellBook(event) {
        const spells = DataManager.getKnownSpells(); // 默认获取主角法术
        if (!spells) return;
        
        // 按环阶分组
        const byLevel = {};
        spells.forEach(s => {
            const level = s['环阶'] === '0' || s['环阶'] === 0 ? '戏法' : (s['环阶'] + '环');
            if (!byLevel[level]) byLevel[level] = [];
            byLevel[level].push(s);
        });
        
        let html = `<div style="font-weight:bold;color:var(--dnd-text-header);border-bottom:1px solid var(--dnd-border-subtle);padding-bottom:5px;margin-bottom:10px;"><i class="fa-solid fa-book"></i> 法术书</div>`;
        
        // 搜索和筛选
        html += `
            <div style="display:flex;gap:5px;margin-bottom:10px;">
                <input type="text" id="dnd-spell-search" placeholder="搜索法术..." style="flex:1;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:4px 8px;border-radius:4px;font-size:12px;" oninput="window.DND_Dashboard_UI.filterSpells()">
                <select id="dnd-spell-filter" style="background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:4px;border-radius:4px;font-size:12px;" onchange="window.DND_Dashboard_UI.filterSpells()">
                    <option value="">全部环阶</option>
                    ${Object.keys(byLevel).sort().map(l => `<option value="${l}">${l}</option>`).join('')}
                </select>
            </div>
        `;

        html += `<div style="max-height:300px;overflow-y:auto;" id="dnd-spell-list">`;
        
        Object.keys(byLevel).sort().forEach(lvl => {
            html += `<div class="dnd-spell-group-header" data-level="${lvl}" style="color:var(--dnd-text-highlight);font-size:12px;margin:8px 0 4px 0;border-bottom:1px dashed var(--dnd-border-subtle);">${lvl}</div>`;
            byLevel[lvl].forEach(s => {
                const isPrep = s['已准备'] === '是' || s['已准备'] === true || lvl === '戏法';
                const prepIcon = isPrep ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-regular fa-circle"></i>';
                const safeName = (s['法术名称'] || '').replace(/'/g, "\\'");
                html += `
                    <div class="dnd-spell-item" data-name="${s['法术名称']}" data-level="${lvl}" style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;cursor:pointer;"
                        onmouseover="this.style.background='var(--dnd-bg-tertiary)'"
                        onmouseout="this.style.background='transparent'"
                        onclick="window.DND_Dashboard_UI.handleSpellClick('${safeName}', event)">
                        <span style="color:${isPrep ? 'var(--dnd-text-main)' : 'var(--dnd-text-dim)'}">${prepIcon} ${s['法术名称']}</span>
                        <span style="color:var(--dnd-text-dim);font-size:10px;">${s['施法时间']}</span>
                    </div>
                `;
            });
        });
        html += `</div>`;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [新增] 过滤法术列表
    filterSpells() {
        const { $ } = getCore();
        const searchText = $('#dnd-spell-search').val().toLowerCase();
        const filterLevel = $('#dnd-spell-filter').val();
        
        $('.dnd-spell-item').each(function() {
            const $el = $(this);
            const name = ($el.data('name') || '').toLowerCase();
            const level = $el.data('level') || '';
            
            const matchSearch = !searchText || name.includes(searchText);
            const matchFilter = !filterLevel || level === filterLevel;
            
            if (matchSearch && matchFilter) {
                $el.show();
            } else {
                $el.hide();
            }
        });
        
        // 隐藏空的分组标题
        $('.dnd-spell-group-header').each(function() {
            const lvl = $(this).data('level');
            // 检查该组下是否有可见的 spell item
            const hasVisible = $(`.dnd-spell-item[data-level="${lvl}"]:visible`).length > 0;
            if (hasVisible) $(this).show();
            else $(this).hide();
        });
    }
};
