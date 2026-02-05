import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { DataManager } from '../../data/DataManager.js';
import { ItemManager } from '../../data/ItemManager.js';
import { NotificationSystem } from './UIUtils.js';

export default {
    renderItemCard(item, isEquippedHighlight, delay = 0) {
        // 注意：因为 item 对象可能包含特殊字符，传递整个对象给 onclick 会有问题
        // 所以我们只传递 ID，然后在 showItemDetail 中重新查找
        // 或者将对象存储在 DOM data 属性中
        const isEquipped = item['已装备'] === '是' || item['已装备'] === true || String(item['已装备']).toLowerCase() === 'true';
        const bg = isEquippedHighlight ? 'background:rgba(197, 160, 89, 0.1);border-color:var(--dnd-border-gold);' : '';
        
        // 使用 data-item-id 存储 ID，避免 onclick 传递复杂对象
        const itemId = item['物品ID'] || item['物品名称'];
        const safeId = (itemId || '').replace(/'/g, "\\'");
        
        // [Feature 4] 更多属性
        const damage = item['伤害'] || item['damage'] || '';
        const properties = item['特性'] || item['properties'] || '';
        const rarity = item['稀有度'] || item['rarity'] || '普通';
        const owner = item['所属人'] || '';
        
        // 生成 HTML
        return `
            <div style="background:rgba(255,255,255,0.03);padding:10px;border:1px solid var(--dnd-border-inner);border-radius:4px;position:relative;cursor:pointer;animation-delay:${delay}s;${bg}"
                class="dnd-item-card dnd-anim-entry dnd-clickable"
                onclick="window.DND_Dashboard_UI.showItemDetail('${safeId}', event)">
                <div style="font-weight:bold;color:${isEquipped ? 'var(--dnd-text-highlight)' : 'var(--dnd-text-main)'};margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${item['物品名称']}
                    ${isEquipped ? '<i class="fa-solid fa-shield-halved" style="float:right;font-size:12px;color:var(--dnd-text-highlight)"></i>' : ''}
                </div>
                
                ${damage ? `<div class="dnd-item-damage"><i class="fa-solid fa-gavel"></i> ${damage}</div>` : ''}

                <div style="font-size:12px;color:#888;display:flex;justify-content:space-between;margin-top:4px;">
                    <span>x${item['数量']}</span>
                    <span>${item['价值'] || '-'}</span>
                </div>
                
                ${properties ? `<div class="dnd-item-props">${properties}</div>` : ''}
                
                <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px;">
                    <div class="dnd-item-rarity rarity-${rarity.toLowerCase()}">${rarity}</div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;">
                        ${owner ? `<div style="font-size:10px;color:var(--dnd-accent-blue);background:rgba(44, 76, 138, 0.2);padding:1px 4px;border-radius:2px;margin-bottom:2px;"><i class="fa-solid fa-user"></i> ${owner}</div>` : ''}
                        ${item['重量'] ? `<div style="font-size:11px;color:#666;">${item['重量']} lb</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    showItemDetail(itemId, event) {
        if (event) { event.stopPropagation(); }
        
        const items = DataManager.getTable('ITEM_Inventory');
        if (!items) return;
        
        const item = items.find(i => (i['物品ID'] === itemId) || (i['物品名称'] === itemId));
        if (!item) return;
        
        const isEquipped = item['已装备'] === '是' || item['已装备'] === true || String(item['已装备']).toLowerCase() === 'true';
        
        // [Feature 4] 详细属性
        const detailFields = [
            { key: '所属人', icon: '<i class="fa-solid fa-user"></i>', label: '持有者' },
            { key: '伤害', icon: '<i class="fa-solid fa-gavel"></i>', label: '伤害' },
            { key: '护甲等级', icon: '<i class="fa-solid fa-shield-halved"></i>', label: 'AC' },
            { key: '特性', icon: '<i class="fa-solid fa-bolt"></i>', label: '特性' },
            { key: '稀有度', icon: '<i class="fa-solid fa-gem"></i>', label: '稀有度' },
            { key: '重量', icon: '<i class="fa-solid fa-weight-hanging"></i>', label: '重量' },
            { key: '价值', icon: '<i class="fa-solid fa-coins"></i>', label: '价值' },
            { key: '需求', icon: '<i class="fa-solid fa-list"></i>', label: '需求' },
            { key: '类别', icon: '<i class="fa-solid fa-tag"></i>', label: '类别' },
            { key: '数量', icon: '<i class="fa-solid fa-sort-numeric-down"></i>', label: '数量' }
        ];

        let detailHtml = '';
        detailFields.forEach(field => {
            // 尝试中文key，如果不行尝试英文key (简单映射)
            let val = item[field.key];
            if (!val && field.key === '护甲等级') val = item['AC'];
            
            if (val) {
                detailHtml += `
                    <div class="dnd-item-detail-row">
                        <span class="dnd-item-detail-icon">${field.icon}</span>
                        <span class="dnd-item-detail-label">${field.label}:</span>
                        <span class="dnd-item-detail-value">${val}</span>
                    </div>
                `;
            }
        });

        const html = `
            <div style="color:var(--dnd-text-highlight);font-weight:bold;font-size:16px;border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <span>${item['物品名称']}</span>
                ${isEquipped ? '<span style="font-size:12px;background:var(--dnd-accent-green);color:#fff;padding:2px 6px;border-radius:4px;">已装备</span>' : ''}
            </div>
            
            <div style="margin-bottom:15px;background:rgba(255,255,255,0.05);padding:10px;border-radius:4px;font-size:12px;">
                ${detailHtml}
            </div>
            
            <div style="line-height:1.6;color:#ccc;font-size:13px;">
                ${item['描述'] || '暂无描述'}
            </div>
            <div style="margin-top:15px;font-size:10px;color:#666;text-align:right;">ID: ${item['物品ID'] || '-'}</div>
        `;
        
        const { window: coreWin } = getCore();
        this.showItemDetailPopup(html, event ? event.clientX : coreWin.innerWidth/2, event ? event.clientY : coreWin.innerHeight/2);
    },

    showItemDetailPopup(contentHtml, x, y) {
        console.log(`[DND Dashboard] showItemDetailPopup called at ${x},${y}`);
        const { $, window: coreWin } = getCore();
        let $popup = $('#dnd-detail-popup-el');
        let $backdrop = $('#dnd-popup-backdrop-el');
        
        // 创建遮罩层（如果不存在）
        if (!$backdrop.length) {
            $backdrop = $('<div id="dnd-popup-backdrop-el" class="dnd-popup-backdrop"></div>');
            $('body').append($backdrop);
            
            // 点击遮罩层关闭悬浮窗 - 最简单可靠的方式
            const self = this;
            $backdrop.on('click', () => {
                self.hideDetailPopup();
            });
        }
        
        if (!$popup.length) {
            $popup = $('<div id="dnd-detail-popup-el" class="dnd-detail-popup" style="max-height:80vh;overflow-y:auto;"></div>');
            $('body').append($popup);
        }

        // 添加关闭按钮到内容顶部
        const closeBtn = `<div style="position:absolute;top:8px;right:8px;cursor:pointer;color:#888;font-size:16px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all 0.2s;" onmouseover="this.style.color='var(--dnd-text-highlight)';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='#888';this.style.background='transparent'" onclick="window.DND_Dashboard_UI.hideDetailPopup()">✕</div>`;
        $popup.html(closeBtn + '<div style="padding-right:20px;">' + contentHtml + '</div>');
        
        // 使用 coreWin 获取正确的窗口尺寸（兼容 iframe）
        const winW = coreWin.innerWidth || $(coreWin).width() || window.innerWidth || 800;
        const winH = coreWin.innerHeight || $(coreWin).height() || window.innerHeight || 600;
        const isMobile = winW < 768;
        const padding = 10;
        
        if (isMobile) {
            // 移动端：水平方向由 CSS 控制 (left:10px, right:10px)
            // 只需计算垂直位置
            
            // 先显示以便测量高度
            $popup.css({
                display: 'block',
                visibility: 'hidden',
                opacity: 0,
                top: '-9999px',
                left: '', // 清除，让 CSS 生效
                right: ''
            }).addClass('visible');
            
            const popH = $popup.outerHeight() || 200;
            
            // 垂直方向：优先显示在点击位置下方
            let top = y + 15;
            
            // 如果下方放不下，显示在上方
            if (top + popH > winH - padding) {
                top = y - popH - 10;
            }
            
            // 边界约束
            if (top < padding) top = padding;
            if (top + popH > winH - padding) {
                top = Math.max(padding, winH - popH - padding);
            }
            
            // 应用位置 (水平方向不设置，让 CSS @media 规则生效)
            $popup.css({
                top: top + 'px',
                left: '', // 保持空让 CSS 生效
                right: '', // 保持空让 CSS 生效
                bottom: 'auto',
                visibility: 'visible',
                opacity: 1,
                display: 'block'
            });
        } else {
            // 桌面端：基于鼠标位置智能定位
            // 1. 先设置 display:block 但 opacity:0，以便测量
            $popup.css({
                display: 'block',
                visibility: 'hidden',
                opacity: 0,
                left: '-9999px',
                top: '-9999px'
            }).addClass('visible');
            
            const popW = $popup.outerWidth() || 280;
            const popH = $popup.outerHeight() || 200;
            
            console.log(`[DND Dashboard] Popup measuring: win=${winW}x${winH}, pop=${popW}x${popH}, mouse=${x},${y}`);

            // 2. 计算位置 - 优先显示在鼠标右下
            let left = x + 15;
            let top = y + 15;
            
            // 水平方向检查：如果右侧放不下，尝试放左侧
            if (left + popW > winW - padding) {
                left = x - popW - 15;
            }
            
            // 垂直方向检查：如果下方放不下，尝试放上方
            if (top + popH > winH - padding) {
                top = y - popH - 10;
            }
            
            // 3. 最终边界强制约束
            if (left < padding) left = padding;
            if (top < padding) top = padding;
            if (left + popW > winW - padding) {
                left = Math.max(padding, winW - popW - padding);
            }
            if (top + popH > winH - padding) {
                top = Math.max(padding, winH - popH - padding);
            }
            
            // 4. 应用位置并显示
            $popup.css({
                top: top + 'px',
                left: left + 'px',
                bottom: 'auto',
                right: 'auto',
                visibility: 'visible',
                opacity: 1,
                display: 'block'
            });
        }
        
        // 显示遮罩层
        $backdrop.addClass('visible');
    },

    hideDetailPopup() {
        const { $ } = getCore();
        // 隐藏悬浮窗
        $('#dnd-detail-popup-el').removeClass('visible').css('display', 'none');
        // 隐藏遮罩层
        $('#dnd-popup-backdrop-el').removeClass('visible');
    },

    showMiniItemActions(itemOrId, e) {
        // [修复] 支持传递 ID 字符串或对象
        let item = itemOrId;
        const items = DataManager.getTable('ITEM_Inventory');

        if (typeof itemOrId === 'string') {
            item = items ? items.find(i => (i['物品ID'] === itemOrId) || (i['物品名称'] === itemOrId)) : null;
        }
        if (!item) return;

        const itemId = item['物品ID'] || item['物品名称'];
        const isEquipped = item['已装备'] === '是' || item['已装备'] === true || String(item['已装备']).toLowerCase() === 'true';
        
        // 确保获取完整信息 (如果是从对象传递的可能不完整)
        const fullItem = items ? items.find(i => (i['物品ID'] === itemId) || (i['物品名称'] === itemId)) : item;
        
        const actions = [
            { label: isEquipped ? '卸下' : '装备', icon: '<i class="fa-solid fa-shield-halved"></i>', action: 'equip' },
            { label: '使用/消耗', icon: '<i class="fa-solid fa-flask"></i>', action: 'use' },
            { label: '丢弃', icon: '<i class="fa-solid fa-trash"></i>', action: 'drop' }
        ];
        
        let html = `<div style="display:flex;flex-direction:column;gap:5px;">`;
        html += `<div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:5px;">
            ${fullItem['物品名称']}
            ${isEquipped ? '<span style="font-size:10px;background:var(--dnd-accent-green);color:#fff;padding:1px 4px;border-radius:3px;margin-left:5px;">已装备</span>' : ''}
        </div>`;
        
        // 显示简要信息
        html += `<div style="font-size:11px;color:#888;margin-bottom:5px;padding:4px 6px;background:rgba(0,0,0,0.2);border-radius:3px;">
            <div>类别: ${fullItem['类别'] || '-'} | 数量: ${fullItem['数量'] || 1}</div>
            ${fullItem['价值'] ? `<div>价值: ${fullItem['价值']}</div>` : ''}
        </div>`;

        // Description with collapse/expand
        const desc = fullItem['描述'] || '暂无描述';
        html += `
            <div style="font-size:12px;color:#ccc;line-height:1.5;margin-bottom:8px;padding:5px;background:rgba(0,0,0,0.2);border-radius:4px;border-left:2px solid #555;cursor:pointer;max-height:60px;overflow:hidden;transition:max-height 0.3s ease-out;text-overflow:ellipsis;"
                onclick="this.style.maxHeight = this.style.maxHeight==='60px' ? '500px' : '60px'"
                title="点击展开/收起">
                ${desc}
            </div>
        `;
        
        actions.forEach(act => {
            html += `
                <div style="cursor:pointer;padding:6px 10px;border-radius:4px;display:flex;align-items:center;gap:8px;font-size:13px;" 
                    onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                    onmouseout="this.style.background='transparent'"
                    onclick="window.DND_Dashboard_UI.handleItemAction('${itemId}', '${act.action}', ${fullItem['数量'] || 1})">
                    <span>${act.icon}</span> <span>${act.label}</span>
                </div>
            `;
        });
        html += `</div>`;
        
        // 计算合适的位置，避免弹出屏幕
        const x = e.clientX;
        const y = e.clientY;
        
        this.showItemDetailPopup(html, x, y);
    },

    async handleItemAction(itemId, action, currentQty) {
        this.hideDetailPopup();
        
        if (typeof ItemManager === 'undefined') {
            console.error('ItemManager not loaded');
            return;
        }

        if (action === 'equip') {
            // 获取最新状态
            const items = DataManager.getTable('ITEM_Inventory');
            const item = items.find(i => (i['物品ID'] === itemId) || (i['物品名称'] === itemId));
            if (item) {
                const isEquipped = item['已装备'] === '是' || item['已装备'] === true || String(item['已装备']).toLowerCase() === 'true';
                // 装备/卸下操作暂不记录 Log，或可根据需求添加
                ItemManager.update(itemId, { '已装备': isEquipped ? '否' : '是' });
            }
        }
        else if (action === 'use' || action === 'drop') {
            const actionName = action === 'use' ? '使用' : '丢弃';
            const confirmed = await NotificationSystem.confirm(`确定要${actionName} 1 个 ${itemId} 吗？`, {
                title: `${actionName}物品`,
                confirmText: actionName,
                type: action === 'drop' ? 'danger' : 'info'
            });
            if (confirmed) {
                // [更新] 生成通知文本并传递给 Update
                const note = `[系统] 玩家${actionName}了 1x ${itemId}`;
                ItemManager.update(itemId, { '数量': parseInt(currentQty) - 1 }, note);
            }
        }
    },

    // [修复] 显示背包面板 - 统一使用 showItemDetailPopup (与装备实现保持一致)
    showInventoryPanel(event) {
        Logger.info('showInventoryPanel 被调用', event);
        const items = DataManager.getTable('ITEM_Inventory');
        
        if (!items || items.length === 0) {
            this.showItemDetailPopup('<div style="text-align:center;color:#888;">🎒 背包空空如也</div>', event.clientX, event.clientY);
            return;
        }
        
        // 过滤未装备物品
        const backpackItems = items.filter(i => {
            const isEq = i['已装备'] === '是' || i['已装备'] === true || String(i['已装备']).toLowerCase() === 'true';
            return !isEq;
        });

        // 获取所有类别
        const categories = [...new Set(backpackItems.map(i => i['类别'] || '杂物'))].sort();
        
        let html = `<div style="font-weight:bold;color:var(--dnd-text-main);border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
            <span>🎒 背包物品</span>
            <span style="font-size:11px;color:#888;">${backpackItems.length} 件</span>
        </div>`;

        // 搜索和筛选
        html += `
            <div style="display:flex;gap:5px;margin-bottom:10px;">
                <input type="text" id="dnd-inv-search" placeholder="搜索物品..." style="flex:1;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:4px 8px;border-radius:4px;font-size:12px;" oninput="window.DND_Dashboard_UI.filterInventory()">
                <select id="dnd-inv-filter" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:4px;border-radius:4px;font-size:12px;" onchange="window.DND_Dashboard_UI.filterInventory()">
                    <option value="">全部分类</option>
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
        `;

        html += `<div style="max-height:350px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;" id="dnd-inv-list">`;
        
        if (backpackItems.length === 0) {
            html += `<div style="color:#666;text-align:center;padding:10px;">背包中没有未装备的物品</div>`;
        } else {
            backpackItems.forEach(item => {
                const itemId = item['物品ID'] || item['物品名称'];
                const safeId = (itemId || '').replace(/'/g, "\\'");
                const category = item['类别'] || '杂物';
                html += `
                    <div class="dnd-inv-list-item" data-name="${item['物品名称']}" data-category="${category}" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(255,255,255,0.03);border:1px solid var(--dnd-border-inner);border-radius:4px;cursor:pointer;font-size:12px;"
                        onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.03)'"
                        onclick="window.DND_Dashboard_UI.showMiniItemActions('${safeId}', event)">
                        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;display:flex;flex-direction:column;">
                            <span>${item['物品名称']}</span>
                            <span style="font-size:10px;color:#666;">${category} ${item['所属人'] ? ` · 👤${item['所属人']}` : ''}</span>
                        </div>
                        <span style="color:#888;flex-shrink:0;">x${item['数量']}</span>
                    </div>
                `;
            });
        }
        html += `</div>`;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [新增] 过滤物品列表
    filterInventory() {
        const { $ } = getCore();
        const searchText = $('#dnd-inv-search').val().toLowerCase();
        const filterCat = $('#dnd-inv-filter').val();
        
        $('.dnd-inv-list-item').each(function() {
            const $el = $(this);
            const name = ($el.data('name') || '').toLowerCase();
            const category = ($el.data('category') || '');
            
            const matchSearch = !searchText || name.includes(searchText);
            const matchFilter = !filterCat || category === filterCat;
            
            if (matchSearch && matchFilter) {
                $el.show();
            } else {
                $el.hide();
            }
        });
    },

    // [新增] 显示装备面板
    showEquipmentPanel(event) {
        const items = DataManager.getTable('ITEM_Inventory');
        if (!items) {
            this.showItemDetailPopup('<div style="text-align:center;color:#888;">⚔️ 无装备数据</div>', event.clientX, event.clientY);
            return;
        }
        
        // 过滤已装备物品
        const equippedItems = items.filter(i => {
            const isEq = i['已装备'] === '是' || i['已装备'] === true || String(i['已装备']).toLowerCase() === 'true';
            return isEq;
        });
        
        let html = `<div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
            <span>⚔️ 已装备</span>
            <span style="font-size:11px;color:#888;">${equippedItems.length} 件</span>
        </div>`;
        html += `<div style="max-height:350px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">`;
        
        if (equippedItems.length === 0) {
            html += `<div style="color:#666;text-align:center;padding:10px;">尚未装备任何物品</div>`;
        } else {
            equippedItems.forEach(item => {
                const itemId = item['物品ID'] || item['物品名称'];
                const safeId = (itemId || '').replace(/'/g, "\\'");
                html += `
                    <div class="dnd-inv-list-item" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(197, 160, 89, 0.1);border:1px solid var(--dnd-border-gold);border-radius:4px;cursor:pointer;font-size:12px;"
                        onmouseover="this.style.background='rgba(197, 160, 89, 0.2)'"
                        onmouseout="this.style.background='rgba(197, 160, 89, 0.1)'"
                        onclick="window.DND_Dashboard_UI.showMiniItemActions('${safeId}', event)">
                        <div style="display:flex;flex-direction:column;overflow:hidden;max-width:180px;">
                            <span style="color:var(--dnd-text-highlight);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><i class="fa-solid fa-shield-halved"></i> ${item['物品名称']}</span>
                            ${item['所属人'] ? `<span style="font-size:10px;color:var(--dnd-accent-blue);"><i class="fa-solid fa-user"></i> ${item['所属人']}</span>` : ''}
                        </div>
                        <span style="color:#888;flex-shrink:0;">${item['类别'] || '-'}</span>
                    </div>
                `;
            });
        }
        html += `</div>`;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [新增] 显示势力声望面板
    showFactionPanel(event) {
        const factions = DataManager.getTable('FACTION_Standing');
        if (!factions || factions.length === 0) return;
        
        let html = `
            <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <span>🏛️ 势力与声望</span>
                <span style="font-size:11px;color:#888;">${factions.length} 个势力</span>
            </div>
            <div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
        `;
        
        factions.forEach(f => {
            const relation = parseInt(f['关系等级']) || 0;
            let icon = '<i class="fa-solid fa-scale-balanced"></i>';
            let color = '#ccc';
            let statusText = '中立';
            let percent = 50; // 中立默认 50%
            
            if (relation > 0) {
                icon = '<i class="fa-solid fa-handshake"></i>';
                color = 'var(--dnd-accent-green)';
                statusText = '友好';
                percent = Math.min(100, 50 + (relation * 5));
            } else if (relation < 0) {
                icon = '<i class="fa-solid fa-skull"></i>';
                color = 'var(--dnd-accent-red)';
                statusText = '敌对';
                percent = Math.max(0, 50 + (relation * 5));
            }
            
            const repVal = f['声望值'] || 0;
            
            html += `
                <div class="dnd-faction-item">
                    <div class="dnd-faction-header">
                        <span style="color:${color}">${icon} ${f['势力名称']}</span>
                        <span style="font-size:11px;background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:3px;">${statusText} (${relation})</span>
                    </div>
                    <div style="font-size:11px;color:#aaa;margin-top:2px;">
                        ${f['势力描述'] || '无描述'}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;font-size:10px;color:#888;margin-top:4px;">
                        <span>声望: ${repVal}</span>
                        <div class="dnd-faction-rep-bar" style="flex:1;">
                            <div class="dnd-faction-rep-fill" style="width:${percent}%;background:${color};"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        this.showItemDetailPopup(html, event.clientX, event.clientY);
    },

    // [修复] 显示任务详情 - 统一使用 showItemDetailPopup (与装备实现保持一致)
    showQuestTooltip(quest, x, y) {
        Logger.info('showQuestTooltip 被调用', quest['任务名称']);
        
        const statusColor = quest['状态'] === '已完成' ? '#3a6b4a' : (quest['状态'] === '已失败' ? '#8a2c2c' : '#c5a059');
        
        const html = `
            <div style="border-bottom:1px solid var(--dnd-border-gold);padding-bottom:5px;margin-bottom:10px;font-weight:bold;color:var(--dnd-text-highlight);font-size:16px;display:flex;justify-content:space-between;align-items:center;">
                <span>📜 ${quest['任务名称']}</span>
                <span style="font-size:11px;background:${statusColor};color:#fff;padding:2px 6px;border-radius:4px;">${quest['状态'] || '进行中'}</span>
            </div>
            
            <div style="font-size:13px;line-height:1.5;margin-bottom:15px;color:#ccc;">
                ${quest['目标描述'] || '暂无描述'}
            </div>
            
            ${quest['当前进度'] ? `
            <div style="margin-bottom:10px;padding:6px 8px;background:rgba(197, 160, 89, 0.1);border-left:2px solid var(--dnd-border-gold);border-radius:2px;">
                <div style="font-size:11px;color:#888;margin-bottom:2px;">当前进度</div>
                <div style="font-size:12px;color:var(--dnd-text-main);">${quest['当前进度']}</div>
            </div>` : ''}
            
            <div style="font-size:12px;color:#aaa;background:rgba(255,255,255,0.05);padding:8px;border-radius:4px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
                    <div><strong>发布者:</strong> ${quest['发布者']||'-'}</div>
                    <div><strong>类型:</strong> ${quest['类型']||'-'}</div>
                    <div><strong>时限:</strong> ${quest['时限']||'无限制'}</div>
                    <div><strong>难度:</strong> ${quest['难度']||'-'}</div>
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #444;color:var(--dnd-text-highlight);">
                    <strong>🏆 奖励:</strong> ${quest['奖励']||'-'}
                </div>
            </div>
        `;
        
        this.showItemDetailPopup(html, x, y);
    }
};
