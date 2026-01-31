import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { CONFIG } from '../../config/Config.js';
import { DataManager } from '../../data/DataManager.js';
import { ItemManager } from '../../data/ItemManager.js';
import UICharacter from './UICharacter.js';

export default {
    renderPanel(panelName) {
        const { $ } = getCore();
        const $content = $('#dnd-content');
        if (!$content.length) return;
        
        $content.empty();
        
        // 添加面板切换过渡
        $content.removeClass('dnd-panel-transition');
        // 强制重绘以重置动画
        void $content[0].offsetWidth;
        $content.addClass('dnd-panel-transition');

        switch (panelName) {
            case 'create':
                // Use the enhanced version from UICharacter (mix-in style)
                UICharacter.renderCharacterCreationPanel.call(this, $content);
                break;
            case 'party':
                this.renderPartyPanel($content);
                break;
            case 'quests':
                this.renderQuestsPanel($content);
                break;
            case 'inventory':
                this.renderInventoryPanel($content);
                break;
            case 'combat':
                this.renderCombatPanel($content);
                break;
            case 'world':
                this.renderWorldPanel($content);
                break;
            case 'logs':
                this.renderLogsPanel($content);
                break;
            case 'npcs':
                this.renderNPCPanel($content);
                break;
            case 'archives':
                this.renderArchivesPanel($content);
                break;
            case 'settings':
                this.renderSettingsPanel($content);
                break;
            default:
                $content.html('<div style="padding:20px">开发中...</div>');
        }
    },

    renderPartyPanel($container) {
        const { $ } = getCore();
        const party = DataManager.getPartyData() || [];
        
        // [新增] 队伍工具栏 - 导入/导出按钮
        const $toolbar = $(`
            <div class="dnd-party-toolbar" style="display:flex;gap:10px;margin-bottom:15px;padding:10px;background:rgba(0,0,0,0.3);border-radius:6px;border:1px solid var(--dnd-border-inner);">
                <div style="flex:1;display:flex;align-items:center;gap:10px;">
                    <span style="font-weight:bold;color:var(--dnd-text-highlight);">👥 冒险队伍</span>
                    <span style="font-size:12px;color:#888;">(${party.length} 名成员)</span>
                </div>
                <button class="dnd-btn dnd-clickable dnd-export-party-btn" style="background:#1a1a1c;border:1px solid var(--dnd-border-gold);color:var(--dnd-text-main);padding:6px 12px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-download"></i> 导出队伍
                </button>
                <button class="dnd-btn dnd-clickable dnd-import-party-btn" style="background:#1a1a1c;border:1px solid var(--dnd-border-inner);color:var(--dnd-text-main);padding:6px 12px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-upload"></i> 导入队伍
                </button>
                <button class="dnd-btn dnd-clickable dnd-import-fvtt-btn" style="background:#1a1a1c;border:1px solid var(--dnd-border-inner);color:#e67e22;padding:6px 12px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-file-import"></i> 导入 FVTT
                </button>
            </div>
        `);

        const self = this;
        // 绑定导出按钮事件
        $toolbar.find('.dnd-export-party-btn').on('click', function() {
            self.exportPartyToFile();
        });

        // 绑定导入按钮事件
        $toolbar.find('.dnd-import-party-btn').on('click', function() {
            self.importPartyFromFile();
        });

        // 绑定 FVTT 导入按钮事件
        $toolbar.find('.dnd-import-fvtt-btn').on('click', function() {
            self.importFVTTFromFile();
        });

        $container.empty();
        $container.append($toolbar);

        if (party.length === 0) {
            $container.append('<div style="padding:20px; text-align:center;">暂无队伍数据，请确保已连接数据库并加载 DND 模板。</div>');
            return;
        }

        const $grid = $('<div class="dnd-grid"></div>');

        party.forEach((char, index) => {
            // 解析 HP
            let hpCurrent = 0, hpMax = 0, hpPercent = 0;
            if (char['HP']) {
                const parts = char['HP'].toString().split('/');
                if (parts.length === 2) {
                    hpCurrent = parseInt(parts[0]) || 0;
                    hpMax = parseInt(parts[1]) || 1;
                    hpPercent = Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100));
                }
            }

            // 解析属性
            let statsHtml = '';
            // 优先尝试通用解析 (支持 JSON 和 STR:10|DEX:12 格式)
            const statsObj = DataManager.parseValue(char['属性值'], 'stats') || {};

            if (Object.keys(statsObj).length > 0) {
                statsHtml = '<div style="display:flex; justify-content:space-between; margin-bottom:10px; background:rgba(0,0,0,0.2); padding:5px; border-radius:4px;">';
                Object.keys(statsObj).forEach(k => {
                    statsHtml += `<div style="text-align:center;"><div style="font-size:10px;color:#888">${k}</div><div style="font-weight:bold">${statsObj[k]}</div></div>`;
                });
                statsHtml += '</div>';
            }

            const charId = char['PC_ID'] || char['CHAR_ID'] || char['姓名'];
            const avatarHtml = this.renderAvatar(char['姓名'], charId, 40);
            
            // 解析熟练技能 (用于悬浮提示)
            let skillTooltip = '点击查看详情';
            try {
                if (char['技能熟练']) {
                    let skills = [];
                    // 处理 JSON 字符串或数组字符串
                    if (typeof char['技能熟练'] === 'string') {
                        if (char['技能熟练'].startsWith('[')) {
                            skills = JSON.parse(char['技能熟练']);
                        } else {
                            skills = char['技能熟练'].split(/[,;，；]/);
                        }
                    } else if (Array.isArray(char['技能熟练'])) {
                        skills = char['技能熟练'];
                    }
                    
                    if (skills && skills.length > 0) {
                        skillTooltip = '熟练技能: ' + skills.map(s => s.trim()).join(', ');
                    }
                }
            } catch(e) {}

            const cardHtml = `
                <div class="dnd-char-card dnd-anim-entry dnd-clickable" style="cursor:pointer; animation-delay: ${index * 0.05}s" title="${skillTooltip}">
                    <div class="dnd-card-header" style="justify-content:flex-start;gap:10px;">
                        ${avatarHtml}
                        <div style="flex:1;overflow:hidden;">
                            <div class="dnd-char-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${char['姓名'] || '未知'}</div>
                            <div class="dnd-char-lvl" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${char['种族/性别/年龄'] || ''} | ${char['职业'] || ''}</div>
                        </div>
                    </div>
                    <div class="dnd-card-body">
                        ${statsHtml}
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">AC (护甲)</span>
                            <span class="dnd-stat-val">${char['AC'] || '-'}</span>
                        </div>
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">先攻加值</span>
                            <span class="dnd-stat-val">${char['先攻加值'] || '+0'}</span>
                        </div>
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">被动感知</span>
                            <span class="dnd-stat-val">${char['被动感知'] || '10'}</span>
                        </div>
                        
                        <div>
                            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
                                <span>HP</span>
                                <span>${hpCurrent} / ${hpMax}</span>
                            </div>
                            <div class="dnd-bar-container dnd-bar-hp">
                                <div class="dnd-bar-fill" style="width: ${hpPercent}%"></div>
                            </div>
                        </div>

                        ${char['经验值'] ? `
                        <div>
                            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
                                <span>XP</span>
                                <span>${char['经验值']}</span>
                            </div>
                            <div class="dnd-bar-container dnd-bar-exp">
                                <div class="dnd-bar-fill" style="width: 50%"></div>
                            </div>
                        </div>` : ''}
                        
                        <div style="margin-top:5px;font-size:12px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                            ${char['外貌描述'] || '无描述'}
                        </div>
                    </div>
                </div>
            `;
            
            const $card = $(cardHtml);
            $card.on('click', (e) => {
                Logger.debug('[PartyPanel] Clicked card for', char['姓名']);
                // 使用统一的角色详情卡片，而不是简陋的 Modal
                // 传递点击事件以便在鼠标位置显示卡片
                self.showCharacterCard(char, e);
            });
            
            $grid.append($card);
        });
        $container.append($grid);
    },

    renderQuestsPanel($container) {
        const { $ } = getCore();
        const quests = DataManager.getTable('QUEST_Active');
        if (!quests) {
            $container.html('暂无任务数据。');
            return;
        }

        const $list = $('<div style="display:flex;flex-direction:column;gap:15px;"></div>');

        quests.forEach((q, index) => {
            const statusColor = q['状态'] === '已完成' ? '#3a6b4a' : (q['状态'] === '已失败' ? '#8a2c2c' : '#c5a059');
            
            const itemHtml = `
                <div class="dnd-anim-entry" style="animation-delay:${index * 0.05}s; background:var(--dnd-bg-panel);border:1px solid var(--dnd-border-inner);padding:15px;border-radius:4px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                        <span style="font-weight:bold;color:var(--dnd-text-header);font-size:18px;">${q['任务名称']}</span>
                        <span style="background:${statusColor};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">${q['状态']}</span>
                    </div>
                    <div style="font-size:14px;color:var(--dnd-text-main);margin-bottom:8px;">${q['目标描述'] || ''}</div>
                    <div style="font-size:12px;color:var(--dnd-text-dim);">
                        发布者: ${q['发布者'] || '-'} | 奖励: ${q['奖励'] || '-'}
                    </div>
                </div>
            `;
            $list.append(itemHtml);
        });
        $container.append($list);
    },

    renderCombatPanel($container) {
        const { $ } = getCore();
        const encounters = DataManager.getTable('COMBAT_Encounter');
        const mapData = DataManager.getTable('COMBAT_BattleMap');

        // 布局
        const $layout = $('<div style="display:flex;gap:20px;height:100%;"></div>');
        const $sidebar = $('<div style="width:250px;background:rgba(0,0,0,0.3);padding:10px;overflow-y:auto;"></div>');
        const $mapArea = $('<div class="dnd-map-container"></div>');

        $sidebar.html('<h3 style="color:var(--dnd-text-header);border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;">先攻列表</h3>');
        
        if (encounters) {
            const sorted = [...encounters].sort((a, b) => {
                const valA = parseInt(a['先攻/位置']) || 0;
                const valB = parseInt(b['先攻/位置']) || 0;
                return valB - valA;
            });

            sorted.forEach(unit => {
                const isActive = unit['是否为当前行动者'] === '是';
                const hp = unit['HP状态'] || '??/??';
                const activeStyle = isActive ? 'background:rgba(197, 160, 89, 0.2);border-left:3px solid var(--dnd-border-gold);' : '';
                
                const rowHtml = `
                    <div style="padding:8px;border-bottom:1px solid #333;display:flex;justify-content:space-between;${activeStyle}">
                        <div>
                            <div style="font-weight:bold;color:${unit['阵营'] === '敌方' ? 'var(--dnd-accent-red)' : 'var(--dnd-text-main)'}">${unit['单位名称']}</div>
                            <div style="font-size:12px;color:#888;">HP: ${hp}</div>
                        </div>
                        <div style="font-size:16px;font-weight:bold;color:var(--dnd-text-header)">${parseInt(unit['先攻/位置'])||0}</div>
                    </div>
                `;
                $sidebar.append(rowHtml);
            });
        } else {
            $sidebar.append('<div style="color:#666">非战斗状态</div>');
        }

        if (mapData && mapData.length > 0) {
            const config = mapData.find(m => m['类型'] === 'Config');
            let cols = 20, rows = 20;
            if (config && config['坐标']) {
                // Config 行的坐标字段存的是尺寸: {w:20,h:20} 或 "20,20"
                const size = DataManager.parseValue(config['坐标'], 'size'); // 使用 size 解析器
                if (size) {
                    if (size.w) cols = size.w;
                    if (size.h) rows = size.h;
                }
            }

            // 移除全屏版战斗地图显示，仅保留文字提示或预留空间
            $mapArea.html('<div style="color:#888;padding:20px;text-align:center;">（战斗地图已隐藏，请使用 HUD 查看）</div>');
        } else {
            $mapArea.html('<div style="color:#666">无地图数据</div>');
        }

        $layout.append($sidebar).append($mapArea);
        $container.append($layout);
    },

    renderInventoryPanel($c) {
        const items = DataManager.getTable('ITEM_Inventory');
        if(!items || items.length === 0) {
            $c.html('<div style="padding:20px;text-align:center;color:#888">🎒 背包空空如也</div>');
            return;
        }

        // 按类别分组
        const categories = {};
        const equippedItems = [];
        const allCats = new Set();
        
        items.forEach(i => {
            const isEquipped = i['已装备'] === '是' || i['已装备'] === true || String(i['已装备']).toLowerCase() === 'true';
            if (isEquipped) {
                equippedItems.push(i);
            }
            
            const cat = i['类别'] || '杂物';
            allCats.add(cat);
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(i);
        });

        const sortedCats = [...allCats].sort();

        const { $ } = getCore();
        const $container = $('<div style="display:flex;flex-direction:column;gap:20px;"></div>');

        // 获取所有持有者 (Owner)
        const allOwners = new Set();
        items.forEach(i => {
            if (i['所属人']) allOwners.add(i['所属人']);
        });
        const sortedOwners = [...allOwners].sort();

        // 搜索和筛选区域 (Panel)
        const searchHtml = `
            <div style="background:rgba(0,0,0,0.3);padding:10px;border-radius:6px;border:1px solid var(--dnd-border-inner);display:flex;gap:10px;align-items:center;">
                <div style="font-weight:bold;color:var(--dnd-text-highlight);white-space:nowrap;">🔍 查找物品</div>
                <input type="text" id="dnd-panel-inv-search" placeholder="物品名称..." style="flex:1;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:6px 10px;border-radius:4px;" oninput="window.DND_Dashboard_UI.filterPanelInventory()">
                <select id="dnd-panel-inv-filter" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:6px;border-radius:4px;" onchange="window.DND_Dashboard_UI.filterPanelInventory()">
                    <option value="">全部分类</option>
                    ${sortedCats.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="dnd-panel-inv-owner" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:6px;border-radius:4px;" onchange="window.DND_Dashboard_UI.filterPanelInventory()">
                    <option value="">全部持有者</option>
                    ${sortedOwners.map(o => `<option value="${o}">${o}</option>`).join('')}
                    <option value="无">无持有者</option>
                </select>
            </div>
        `;
        $container.append(searchHtml);

        // 1. 已装备区域 (仪表盘样式)
        if (equippedItems.length > 0) {
            const $equipSection = $(`
                <div class="dnd-inv-section-equipped" style="background:rgba(0,0,0,0.3);padding:15px;border-radius:6px;border:1px solid var(--dnd-border-gold);">
                    <div style="font-size:16px;font-weight:bold;color:var(--dnd-text-header);margin-bottom:10px;display:flex;align-items:center;gap:10px;">
                        <span>⚔️ 已装备</span>
                        <span style="font-size:12px;background:var(--dnd-accent-green);color:#fff;padding:2px 6px;border-radius:4px;">${equippedItems.length}</span>
                    </div>
                    <div class="dnd-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;"></div>
                </div>
            `);
            
            const $grid = $equipSection.find('.dnd-grid');
            equippedItems.forEach((i, idx) => {
                const card = this.renderItemCard(i, true, idx * 0.05);
                // 为卡片添加 data 属性以便筛选
                const $card = $(card);
                $card.attr('data-name', i['物品名称']);
                $card.attr('data-category', i['类别'] || '杂物');
                $card.attr('data-owner', i['所属人'] || '');
                $grid.append($card);
            });
            $container.append($equipSection);
        }

        // 2. 分类列表 (可折叠)
        Object.keys(categories).forEach(cat => {
            const catItems = categories[cat];
            const $catSection = $(`
                <div class="dnd-inv-category" data-category="${cat}" style="background:var(--dnd-bg-panel);border:1px solid var(--dnd-border-inner);border-radius:4px;overflow:hidden;">
                    <div class="dnd-inv-header" style="padding:10px 15px;background:rgba(255,255,255,0.05);cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:bold;color:var(--dnd-text-main);">${cat} (${catItems.length})</span>
                        <span class="dnd-collapse-icon" style="color:var(--dnd-text-dim)">▼</span>
                    </div>
                    <div class="dnd-inv-body" style="padding:15px;display:none;">
                        <div class="dnd-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;"></div>
                    </div>
                </div>
            `);

            const $grid = $catSection.find('.dnd-grid');
            catItems.forEach((i, idx) => {
                const card = this.renderItemCard(i, false, idx * 0.05);
                const $card = $(card);
                $card.attr('data-name', i['物品名称']);
                $card.attr('data-category', cat);
                $card.attr('data-owner', i['所属人'] || '');
                $grid.append($card);
            });

            // 折叠逻辑
            $catSection.find('.dnd-inv-header').on('click', function() {
                const $body = $(this).next();
                const $icon = $(this).find('.dnd-collapse-icon');
                if ($body.is(':visible')) {
                    $body.slideUp(200);
                    $icon.text('▼');
                } else {
                    $body.slideDown(200);
                    $icon.text('▲');
                }
            });

            $container.append($catSection);
        });

        $c.html($container);
    },

    // [新增] 主面板物品过滤逻辑
    filterPanelInventory() {
        const { $ } = getCore();
        const searchText = $('#dnd-panel-inv-search').val().toLowerCase();
        const filterCat = $('#dnd-panel-inv-filter').val();
        const filterOwner = $('#dnd-panel-inv-owner').val();
        
        // 筛选所有卡片
        $('.dnd-item-card').each(function() {
            const $el = $(this);
            const name = ($el.attr('data-name') || '').toLowerCase();
            const category = ($el.attr('data-category') || '');
            const owner = ($el.attr('data-owner') || '');
            
            const matchSearch = !searchText || name.includes(searchText);
            const matchFilter = !filterCat || category === filterCat;
            // 如果选择了 owner，则必须匹配；如果没有选择，则显示所有
            // 如果 owner 是 '无'，则显示没有 owner 的物品
            const matchOwner = !filterOwner || (filterOwner === '无' ? !owner : owner === filterOwner);
            
            if (matchSearch && matchFilter && matchOwner) {
                $el.show();
            } else {
                $el.hide();
            }
        });
        
        // 处理分类容器的显示/隐藏和自动展开
        $('.dnd-inv-category').each(function() {
            const $cat = $(this);
            const catName = $cat.data('category');
            
            // 如果选择了特定分类，直接隐藏不匹配的分类块
            if (filterCat && catName !== filterCat) {
                $cat.hide();
                return;
            }
            
            // 检查该分类下是否有可见物品
            const hasVisibleItems = $cat.find('.dnd-item-card:visible').length > 0;
            
            if (hasVisibleItems) {
                $cat.show();
                // 如果有搜索词，自动展开以便查看结果
                if (searchText) {
                    $cat.find('.dnd-inv-body').slideDown(200);
                    $cat.find('.dnd-collapse-icon').text('▲');
                }
            } else {
                $cat.hide();
            }
        });
    },

    renderWorldPanel($c) {
        const global = DataManager.getTable('SYS_GlobalState');
        if(!global || !global[0]) { $c.html('无世界数据'); return; }
        const g = global[0];
        $c.html(`
            <div style="background:var(--dnd-bg-panel);padding:20px;border:1px solid var(--dnd-border-gold);">
                <h2 style="color:var(--dnd-text-header);margin-top:0;">${g['当前场景']}</h2>
                <p style="color:var(--dnd-text-main);">${g['场景描述']}</p>
                <hr style="border:0;border-bottom:1px solid #333;margin:15px 0;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div><span style="color:#888">时间:</span> ${g['游戏时间']}</div>
                    <div><span style="color:#888">天气:</span> ${g['天气状况']}</div>
                    <div><span style="color:#888">战斗模式:</span> ${g['战斗模式']}</div>
                </div>
            </div>
        `);
    },

    renderLogsPanel($c) {
        const logs = DataManager.getTable('LOG_Summary');
        if(!logs) { $c.html('无日志数据'); return; }
        let html = '<div style="display:flex;flex-direction:column;gap:15px;">';
        [...logs].reverse().forEach(l => {
            html += `
            <div style="background:rgba(255,255,255,0.05);padding:15px;border-left:3px solid var(--dnd-border-gold);">
                <div style="display:flex;justify-content:space-between;color:var(--dnd-text-dim);font-size:12px;margin-bottom:5px;">
                    <span>${l['时间跨度']} @ ${l['地点']}</span>
                    <span>${l['编码索引']}</span>
                </div>
                <div style="color:var(--dnd-text-main);line-height:1.5;">${l['纪要']}</div>
            </div>`;
        });
        html += '</div>';
        $c.html(html);
    },

    renderNPCPanel($c) {
        const { $ } = getCore();
        const npcs = DataManager.getTable('NPC_Registry');
        if (!npcs) { $c.html('无 NPC 数据'); return; }
        
        const $grid = $('<div class="dnd-grid"></div>');
        
        npcs.forEach((npc, index) => {
            const statusColor = npc['当前状态'] === '死亡' ? '#8a2c2c' : (npc['当前状态'] === '在场' ? '#3a6b4a' : '#888');
            
            const cardHtml = `
                <div class="dnd-char-card dnd-anim-entry dnd-clickable" style="cursor:pointer; animation-delay:${index * 0.05}s">
                    <div class="dnd-card-header">
                        <span class="dnd-char-name">${npc['姓名'] || '未知'}</span>
                        <span style="font-size:12px;color:${statusColor}">${npc['当前状态']}</span>
                    </div>
                    <div class="dnd-card-body">
                        <div style="font-size:12px;color:#aaa">${npc['种族/性别/年龄'] || '-'} | ${npc['职业/身份'] || '-'}</div>
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">位置</span>
                            <span class="dnd-stat-val">${npc['所在位置'] || '-'}</span>
                        </div>
                        <div class="dnd-stat-row">
                            <span class="dnd-stat-label">关系</span>
                            <span class="dnd-stat-val">${npc['与主角关系'] || '-'}</span>
                        </div>
                        <div style="margin-top:10px;font-size:13px;line-height:1.4;color:#ccc;max-height:80px;overflow:hidden;">
                            ${npc['外貌描述'] || ''}
                        </div>
                    </div>
                </div>
            `;
            
            const $card = $(cardHtml);
            $card.on('click', () => {
                let detail = '';
                detail += `<div style="margin-bottom:10px"><strong>关键经历:</strong><br>${npc['关键经历'] || '无'}</div>`;
                detail += `<div style="margin-bottom:10px"><strong>外貌:</strong><br>${npc['外貌描述'] || '无'}</div>`;
                detail += `<div style="margin-top:20px;font-size:10px;color:#666">ID: ${npc['NPC_ID']}</div>`;
                this.showModal(npc['姓名'], detail); // Assuming showModal exists? Wait, showModal is not in list.
                // Original UIRenderer has showModal? No, it used UIRenderer.showItemDetailPopup in most places.
                // Checking original code for showModal...
                // renderNPCPanel calls UIRenderer.showModal(npc['姓名'], detail);
                // But showModal is NOT defined in UIRenderer object in the file provided!
                // Ah, check the very end of file or if I missed it.
                // init() has:
                // <div class="dnd-modal-overlay" id="dnd-modal-overlay">
                //    <div class="dnd-modal" id="dnd-modal-content"></div>
                // </div>
                // But no showModal function in the large object.
                // Wait, maybe I missed it in reading?
                // Let's check lines around 2482.
                // Line 2482: UIRenderer.showModal(npc['姓名'], detail);
                // I need to implement showModal or use showItemDetailPopup.
                // Given the HTML structure for modal exists in init(), I should implement it.
            });
            
            $grid.append($card);
        });
        $c.append($grid);
    },

    // Missing showModal implementation based on init HTML
    showModal(title, content) {
        const { $ } = getCore();
        const $overlay = $('#dnd-modal-overlay');
        const $modal = $('#dnd-modal-content');
        
        $modal.html(`
            <div style="display:flex;justify-content:space-between;margin-bottom:15px;border-bottom:1px solid #444;padding-bottom:10px;">
                <h3 style="margin:0;color:var(--dnd-text-highlight)">${title}</h3>
                <span style="cursor:pointer" onclick="$('#dnd-modal-overlay').removeClass('active')">✕</span>
            </div>
            <div>${content}</div>
        `);
        
        $overlay.addClass('active');
    },

    renderArchivesPanel($c) {
        const { $ } = getCore();
        const data = DataManager.getAllData();
        if (!data) { $c.html('无数据'); return; }
        
        const $selector = $('<div style="margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;"></div>');
        const $viewArea = $('<div style="overflow-x:auto;"></div>');
        
        Object.keys(data).forEach(key => {
            if (key === 'mate') return;
            const sheet = data[key];
            const $btn = $(`<button style="padding:5px 10px;background:#333;border:1px solid #555;color:#ccc;cursor:pointer;">${sheet.name || key}</button>`);
            
            $btn.on('click', () => {
                let html = `<h3 style="color:var(--dnd-text-highlight)">${sheet.name}</h3>`;
                html += `<table class="dnd-table"><thead><tr>`;
                if (sheet.content && sheet.content.length > 0) {
                    sheet.content[0].forEach(h => html += `<th>${h || ''}</th>`);
                    html += `</tr></thead><tbody>`;
                    sheet.content.slice(1).forEach(row => {
                        html += `<tr>`;
                        row.forEach(cell => html += `<td>${cell || ''}</td>`);
                        html += `</tr>`;
                    });
                    html += `</tbody></table>`;
                } else {
                    html += `<p>空表</p>`;
                }
                $viewArea.html(html);
                
                $selector.children().css('border-color', '#555');
                $btn.css('border-color', 'var(--dnd-border-gold)');
            });
            $selector.append($btn);
        });
        
        $c.append($selector).append($viewArea);
    },

    // [优化] 渲染快捷物品栏 (只显示装备和消耗品)
    renderQuickInventory($container) {
        const { $ } = getCore();
        const items = DataManager.getTable('ITEM_Inventory');
        if (!items) return;
        
        const equipped = [];
        const consumables = [];
        
        items.forEach(i => {
            const isEq = i['已装备'] === '是' || i['已装备'] === true || String(i['已装备']).toLowerCase() === 'true';
            const type = i['类别'] || '';
            
            if (isEq) equipped.push(i);
            else if (type.includes('消耗') || type.includes('药水') || type.includes('卷轴') || type.includes('食物')) {
                consumables.push(i);
            }
        });
        
        if (equipped.length === 0 && consumables.length === 0) return;
        
        let html = `<div style="padding:5px 10px;border-top:1px solid rgba(255,255,255,0.05);">`;
        
        // [已删除] 装备图标流 - 已移至底部装备按钮
        
        // 消耗品快捷栏
        if (consumables.length > 0) {
            html += `<div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:2px;">`;
            consumables.forEach((item, idx) => {
                const itemId = item['物品ID'] || item['物品名称'];
                html += `
                    <div class="dnd-quick-item dnd-clickable dnd-hud-entry dnd-hover-lift" data-id="${itemId}" title="[${item['数量']}] ${item['物品名称']}" style="animation-delay:${idx * 0.03}s; padding:2px 6px;background:rgba(255,255,255,0.05);border:1px solid #444;border-radius:10px;font-size:10px;white-space:nowrap;cursor:pointer;flex-shrink:0;">
                        ${item['物品名称']} x${item['数量']}
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        html += `</div>`;
        const $el = $(html);
        
        // 绑定点击事件
        const self = this;
        $el.find('.dnd-quick-item').on('click', function(e) {
            e.stopPropagation();
            const itemId = $(this).data('id');
            const item = items.find(i => (i['物品ID'] === itemId) || (i['物品名称'] === itemId));
            if (item) self.showMiniItemActions(item, e);
        });
        
        $container.append($el);
    }
};
