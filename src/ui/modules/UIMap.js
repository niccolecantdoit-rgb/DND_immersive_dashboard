import { getCore, safeSave } from '../../core/Utils.js';
import { CONFIG } from '../../config/Config.js';
import { DBAdapter } from '../../core/DBAdapter.js';
import { DataManager } from '../../data/DataManager.js';
import { ExplorationMapManager } from '../../features/ExplorationMapManager.js';
import { NotificationSystem } from './UIUtils.js';
import { ICONS } from '../SVGIcons.js';

export default {
    // [新增] 地图缩放状态
    _mapZoom: {
        scale: 1.0,
        panX: 0,
        panY: 0,
        isPanning: false,
        lastTouchDist: 0
    },

    // [新增] 绑定地图缩放事件 (增强版：支持 Pointer Events 拖拽平移)
    bindMapZoom($container, $innerMap) {
        const { $ } = getCore();
        const self = this; // [修复] 在函数开头定义 self，确保所有内部函数可以访问
        const state = this._mapZoom;
        const containerEl = $container[0]; // 获取原生 DOM 元素
        
        // 设置禁止选择，防止拖拽时选中文字
        $container.css({
            'user-select': 'none',
            'touch-action': 'none' // 关键：禁用浏览器默认触摸行为
        });
        $innerMap.css('user-select', 'none');

        // 读取保存的缩放比例
        DBAdapter.getSetting(CONFIG.STORAGE_KEYS.MAP_ZOOM).then(saved => {
            if (saved) {
                state.scale = parseFloat(saved) || 1.0;
            } else {
                state.scale = 1.0;
            }
            applyTransform();
        });
        
        // 应用变换
        const applyTransform = () => {
            $innerMap.css({
                transform: `scale(${state.scale}) translate(${state.panX}px, ${state.panY}px)`,
                transformOrigin: 'center center',
                transition: state.isPanning ? 'none' : 'transform 0.2s ease-out'
            });
            updateIndicator();
        };
        
        // Expose transform function for external calls
        $container.data('applyTransform', applyTransform);
        
        // 缩放指示器
        if ($container.find('.dnd-map-zoom-indicator').length === 0) {
            $container.append(`<div class="dnd-map-zoom-indicator" style="position:absolute;top:2px;right:4px;font-size:8px;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.4);padding:1px 3px;border-radius:2px;pointer-events:none;z-index:31;">100%</div>`);
        }
        const updateIndicator = () => {
            $container.find('.dnd-map-zoom-indicator').text(`${Math.round(state.scale * 100)}%`);
        };

        // --- Pointer Events 交互 (支持鼠标和触摸) ---
        let startX = 0, startY = 0;
        let initialPanX = 0, initialPanY = 0;
        let initialDist = 0;
        let initialScale = 1;
        let pointers = new Map(); // 用于多点触控追踪
        let dragDisabled = false; // [修复] 用于禁用拖拽，让 click 事件正常触发

        const handlePointerDown = (e) => {
            // 忽略右键
            if (e.button === 2) return;
            
            // [修复] 检查是否应该禁用拖拽 (瞄准模式或点击 Token)
            const clickTarget = document.elementFromPoint(e.clientX, e.clientY);
            const $clickTarget = $(clickTarget);
            const isOnToken = $clickTarget.closest('.dnd-minimap-token').length > 0;
            const isTargeting = self._targetingMode && self._targetingMode.active;
            
            if (isOnToken || isTargeting) {
                // 禁用拖拽，让原生 click 事件正常触发
                dragDisabled = true;
                console.log('[MapZoom] Drag disabled - isOnToken:', isOnToken, 'isTargeting:', isTargeting);
                return; // 不调用 preventDefault，让 click 事件正常传播
            }
            
            dragDisabled = false;
            e.preventDefault();
            e.stopPropagation(); // 阻止冒泡，防止触发上层点击
            
            // 记录 Pointer
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            
            if (containerEl.setPointerCapture) {
                try { containerEl.setPointerCapture(e.pointerId); } catch(err){}
            }

            if (pointers.size === 1) {
                // 单指/鼠标：开始平移
                state.isPanning = true;
                startX = e.clientX;
                startY = e.clientY;
                initialPanX = state.panX;
                initialPanY = state.panY;
                $container.css('cursor', 'grabbing');
            } else if (pointers.size === 2) {
                // 双指：开始缩放
                state.isPanning = false; // 切换到缩放模式
                const pts = Array.from(pointers.values());
                const dx = pts[0].x - pts[1].x;
                const dy = pts[0].y - pts[1].y;
                initialDist = Math.hypot(dx, dy);
                initialScale = state.scale;
            }
        };

        const handlePointerMove = (e) => {
            // [修复] 如果拖拽被禁用，跳过处理
            if (dragDisabled || !pointers.has(e.pointerId)) return;
            
            e.preventDefault();
            // 更新 pointer 位置
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (pointers.size === 1 && state.isPanning) {
                // 平移处理
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                // 跟手移动：位移 / 当前缩放比例
                state.panX = initialPanX + dx / state.scale;
                state.panY = initialPanY + dy / state.scale;
                
                applyTransform();
            } else if (pointers.size === 2) {
                // 缩放处理
                const pts = Array.from(pointers.values());
                const dx = pts[0].x - pts[1].x;
                const dy = pts[0].y - pts[1].y;
                const dist = Math.hypot(dx, dy);
                
                if (initialDist > 0) {
                    const scaleFactor = dist / initialDist;
                    state.scale = Math.max(CONFIG.MAP_ZOOM.MIN, Math.min(CONFIG.MAP_ZOOM.MAX, initialScale * scaleFactor));
                    applyTransform();
                }
            }
        };

        const handlePointerUp = (e) => {
            // [修复] 如果拖拽被禁用，重置状态并跳过
            if (dragDisabled) {
                dragDisabled = false;
                return;
            }
            
            pointers.delete(e.pointerId);
            
            if (containerEl.releasePointerCapture) {
                try { containerEl.releasePointerCapture(e.pointerId); } catch(err){}
            }

            if (pointers.size === 0) {
                state.isPanning = false;
                $container.css('cursor', '');
                // 保存缩放比例
                safeSave(CONFIG.STORAGE_KEYS.MAP_ZOOM, state.scale);
            } else if (pointers.size === 1) {
                // 如果抬起一根手指，剩下的手指重置为平移起始点
                const pt = pointers.values().next().value;
                state.isPanning = true;
                startX = pt.x;
                startY = pt.y;
                initialPanX = state.panX;
                initialPanY = state.panY;
            }
        };

        // 移除旧的 jQuery 事件绑定，改用原生 Pointer Events
        $container.off('mousedown mousemove mouseup touchstart touchmove touchend');
        
        // 绑定原生事件
        containerEl.addEventListener('pointerdown', handlePointerDown);
        containerEl.addEventListener('pointermove', handlePointerMove);
        containerEl.addEventListener('pointerup', handlePointerUp);
        containerEl.addEventListener('pointercancel', handlePointerUp);
        containerEl.addEventListener('pointerleave', handlePointerUp);

        // --- 滚轮缩放 ---
        containerEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const delta = e.deltaY > 0 ? -CONFIG.MAP_ZOOM.STEP : CONFIG.MAP_ZOOM.STEP;
            state.scale = Math.max(CONFIG.MAP_ZOOM.MIN, Math.min(CONFIG.MAP_ZOOM.MAX, state.scale + delta));
            
            applyTransform();
            // Debounce save
            if (self._zoomSaveTimer) clearTimeout(self._zoomSaveTimer);
            self._zoomSaveTimer = setTimeout(() => safeSave(CONFIG.STORAGE_KEYS.MAP_ZOOM, state.scale), 500);
        }, { passive: false });
        
        // 双击重置
        let lastTap = 0;
        $container.on('click', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                state.scale = CONFIG.MAP_ZOOM.DEFAULT;
                state.panX = 0;
                state.panY = 0;
                applyTransform();
                safeSave(CONFIG.STORAGE_KEYS.MAP_ZOOM, state.scale);
            }
            lastTap = now;
        });
        
        // 初始化
        applyTransform();
    },

    async renderMiniMap($el) {
        const { $ } = getCore();
        const global = DataManager.getTable('SYS_GlobalState');
        const gInfo = (global && global[0]) ? global[0] : {};
        const isCombat = gInfo['战斗模式'] === '战斗中';
        let locationName = gInfo['当前场景'] || '未知区域';

        // Check for override in EXPLORATION_Map_Data
        const mapDataExploration = DataManager.getTable('EXPLORATION_Map_Data');
        if (mapDataExploration) {
            const forcedMap = mapDataExploration.find(m => {
                const val = m['当前显示地图'];
                return val === '是' || val === true || val === 'True' || val === 'true' || val === 1 || val === '1';
            });
            if (forcedMap && forcedMap['LocationName']) {
                locationName = forcedMap['LocationName'];
            }
        }

        // ==========================================
        // 模式 A: 探索地图 (SVG)
        // ==========================================
        if (!isCombat) {
            // 检查是否需要初始化容器
            let $innerMap = $el.find('.dnd-exploration-inner');
            
            // [修复] 检测 locationName 是否改变，如果改变则强制重新加载
            const cachedLocationName = $el.data('current-location-name');
            const locationChanged = cachedLocationName && cachedLocationName !== locationName;
            
            if ($innerMap.length === 0) {
                $el.empty();
                $el.css({
                    position: 'relative',
                    background: '#0a0a0c',
                    overflow: 'hidden'
                });
                
                // 创建内部容器用于缩放/平移
                $innerMap = $('<div class="dnd-exploration-inner" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;transform-origin:center center;"></div>');
                $el.append($innerMap);
                
                // 绑定缩放
                this.bindMapZoom($el, $innerMap);
            }
            
            // [修复] 如果 locationName 改变，清空容器以强制重新加载
            if (locationChanged) {
                $innerMap.empty();
                // 同时更新控制按钮
                $el.find('.dnd-map-controls').remove();
            }
            
            // 保存当前 locationName
            $el.data('current-location-name', locationName);

            // 尝试获取地图
            const containerId = 'dnd-exploration-map-loader';
            // 如果内容为空，显示加载中
            if ($innerMap.is(':empty')) {
                    $innerMap.html(`<div id="${containerId}" style="display:flex;align-items:center;justify-content:center;color:#666;flex-direction:column;gap:5px;">
                    <div class="dnd-spinner" style="width:20px;height:20px;border:2px solid #333;border-top:2px solid var(--dnd-border-gold);border-radius:50%;animation:dnd-spin 1s infinite linear;"></div>
                    <div style="font-size:10px;">加载地图...</div>
                </div>`);
            }

            try {
                const mapResult = await ExplorationMapManager.getMap(locationName, gInfo['场景描述']);
                
                if (mapResult.type === 'svg') {
                    const svgContent = mapResult.content;
                    // 注入 SVG
                    $innerMap.html(svgContent);
                    const $svg = $innerMap.find('svg');
                    $svg.css({ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' });

                    // [新增] 自动计算填满容器的缩放比例 (Cover Mode)
                    setTimeout(() => {
                        try {
                            // 尝试从 viewBox 获取宽高比
                            const viewBox = $svg[0].getAttribute('viewBox');
                            if (viewBox) {
                                const [vx, vy, vw, vh] = viewBox.split(/[\s,]+/).map(parseFloat);
                                const svgRatio = vw / vh;
                                
                                const cw = $el.width();
                                const ch = $el.height();
                                const containerRatio = cw / ch;
                                
                                // 默认 fit 是 scale=1 (contain).
                                // 如果 Container 比 SVG 更宽 (cw/ch > vw/vh)，则 SVG 高度匹配，宽度有黑边。需放大 cw/renderW = cw / (ch * svgRatio) = containerRatio / svgRatio
                                // 如果 Container 比 SVG 更窄 (cw/ch < vw/vh)，则 SVG 宽度匹配，高度有黑边。需放大 ch/renderH = ch / (cw / svgRatio) = svgRatio / containerRatio
                                
                                let coverScale = 1.0;
                                if (containerRatio > svgRatio) {
                                    coverScale = containerRatio / svgRatio;
                                } else {
                                    coverScale = svgRatio / containerRatio;
                                }
                                
                                // 稍微放大一点点以消除边缘缝隙
                                coverScale = coverScale * 1.02;
                                
                                console.log('[MapZoom] Auto-Fit Scale:', coverScale, { containerRatio, svgRatio });
                                
                                // 应用缩放
                                if (coverScale > 1.0) {
                                    this._mapZoom.scale = coverScale;
                                    // Reset pan
                                    this._mapZoom.panX = 0;
                                    this._mapZoom.panY = 0;
                                    
                                    // 调用 applyTransform (通过 data 暴露)
                                    if ($el.data('applyTransform')) {
                                        $el.data('applyTransform')();
                                    }
                                }
                            }
                        } catch(e) { console.warn('Auto-zoom failed', e); }
                    }, 50);

                    // 添加控制层 (悬浮显示) - 添加到外层 $el
                    if ($el.find('.dnd-map-controls').length === 0) {
                        const overlayHtml = `
                            <div class="dnd-map-controls" style="position:absolute;top:5px;right:5px;display:flex;gap:5px;opacity:0;transition:opacity 0.2s;z-index:10;">
                                <button type="button" onclick="window.DND_Dashboard_UI.regenerateMap('${locationName}', 'svg')" title="保持结构重绘图片" style="background:rgba(0,0,0,0.6);border:1px solid #555;color:#fff;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:10px;"><i class="fa-solid fa-palette"></i> 重绘</button>
                            </div>
                        `;
                        $el.append(overlayHtml);
                        
                        $el.hover(
                            () => $el.find('.dnd-map-controls').css('opacity', 1),
                            () => $el.find('.dnd-map-controls').css('opacity', 0)
                        );
                    }

                } else if (mapResult.type === 'error' && mapResult.message.includes('结构')) {
                    // 尚未生成
                        $innerMap.html(`
                        <div style="text-align:center;color:#888;">
                            <div style="font-size:24px;margin-bottom:5px;">${ICONS.MAP}</div>
                            <div style="font-size:10px;margin-bottom:10px;">${mapResult.message}</div>
                        </div>
                    `);
                } else {
                        // 其他错误
                        $innerMap.html(`<div style="color:#e74c3c;font-size:10px;padding:10px;text-align:center;">${mapResult.message}</div>`);
                }
            } catch (e) {
                $innerMap.html(`<div style="color:#e74c3c;font-size:10px;">加载错误: ${e.message}</div>`);
            }
            
            return;
        }

        // ==========================================
        // 模式 B: 战斗地图 (Tactical Grid)
        // ==========================================
        const mapData = DataManager.getTable('COMBAT_BattleMap');
        const encounters = DataManager.getTable('COMBAT_Encounter');
        
        if (!mapData) {
            $el.html('<div style="color:#666;display:flex;align-items:center;justify-content:center;height:100%;">无战斗数据</div>');
            return;
        }

        const round = gInfo['当前回合'] || 0;

        // 1. 获取并计算地图尺寸配置
        const config = mapData.find(m => m['类型'] === 'Config');
        let cols = 20, rows = 20;
        if (config && config['坐标']) {
            const size = DataManager.parseValue(config['坐标'], 'size');
            if (size) {
                cols = size.w || 20;
                rows = size.h || 20;
            }
        }

        const containerSize = 180;
        const cellSize = Math.min(12, Math.max(6, Math.floor(containerSize / Math.max(cols, rows))));
        const mapWidth = cols * cellSize;
        const mapHeight = rows * cellSize;
        const offsetX = (containerSize - mapWidth) / 2;
        const offsetY = (containerSize - mapHeight) / 2;

        // 2. 检查或初始化内部容器 (Static Layer)
        let $innerMap = $el.find('.dnd-minimap-inner');
        let needsFullRedraw = false;

        // 如果尺寸变了，或者容器不存在，则全量重绘
        if ($innerMap.length === 0 ||
            parseFloat($innerMap.data('cols')) !== cols ||
            parseFloat($innerMap.data('rows')) !== rows) {
            
            $el.empty(); // 彻底清空
            needsFullRedraw = true;
            
            $innerMap = $(`<div class="dnd-minimap-inner"
                style="position:absolute;left:${offsetX}px;top:${offsetY}px;width:${mapWidth}px;height:${mapHeight}px;background:#1a1a1c;"
                data-cell-size="${cellSize}" data-cols="${cols}" data-rows="${rows}"></div>`);
            $el.append($innerMap);

            // [新增] 战斗底图层 (Background Layer)
            const bgId = `dnd-battle-bg-${locationName.replace(/\s+/g,'_')}`;
            // 移除 opacity 限制，移除滤镜，确保亮度正常
            $innerMap.append(`<div id="${bgId}" class="dnd-battle-bg-container" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;"></div>`);
            
            // 异步加载战斗底图
            ExplorationMapManager.getBattleMap(locationName, gInfo['场景描述'], cols, rows, false).then(res => {
                if (res.type === 'svg') {
                    const $bg = $innerMap.find(`#${bgId}`);
                    $bg.html(res.content);
                    // 强制 SVG 拉伸适应 Grid
                    $bg.find('svg').css({
                        width: '100%',
                        height: '100%',
                        preserveAspectRatio: 'none'
                        // 移除滤镜，防止过暗
                    });
                }
            });

            // 绘制 Grid (SVG)
            const gridSvg = `
                <svg class="dnd-minimap-grid" width="${mapWidth}" height="${mapHeight}" style="position:absolute;top:0;left:0;pointer-events:none;opacity:0.3;z-index:5;">
                    <defs>
                        <pattern id="miniGrid" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse">
                            <path d="M ${cellSize} 0 L 0 0 0 ${cellSize}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#miniGrid)"/>
                </svg>
            `;
            $innerMap.append(gridSvg);

            // 绘制静态地形 (Walls, Terrain, Zones)
            mapData.forEach(item => {
                if (['Token', 'Config'].includes(item['类型'])) return;

                const pos = DataManager.parseValue(item['坐标'], 'coord');
                if (!pos) return;

                const px = (pos.x !== undefined ? pos.x : 1) - 1;
                const py = (pos.y !== undefined ? pos.y : 1) - 1;
                const size = DataManager.parseValue(item['大小'], 'size') || { w: 1, h: 1 };

                const left = px * cellSize;
                const top = py * cellSize;
                const width = size.w * cellSize;
                const height = size.h * cellSize;

                let el = '';
                if (item['类型'] === 'Wall') {
                    el = `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:#3a3a3a;border:1px solid #555;z-index:1;"></div>`;
                } else if (item['类型'] === 'Terrain') {
                    el = `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:rgba(46, 204, 113, 0.2);border:1px dashed rgba(46, 204, 113, 0.4);z-index:0;"></div>`;
                } else if (item['类型'] === 'Zone') {
                    el = `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:rgba(155, 89, 182, 0.25);border:2px solid rgba(155, 89, 182, 0.5);border-radius:50%;z-index:2;"></div>`;
                }
                if (el) $innerMap.append(el);
            });

            // 绑定事件 (仅在创建时绑定一次)
            const self = this;
            $innerMap.on('click', (e) => {
                e.stopPropagation();
                // 添加点击波纹反馈
                const rect = $innerMap[0].getBoundingClientRect();
                const rx = e.clientX - rect.left;
                const ry = e.clientY - rect.top;
                
                const $ripple = $('<div class="dnd-map-ripple"></div>');
                $ripple.css({
                    left: rx + 'px',
                    top: ry + 'px',
                    width: cellSize*2 + 'px',
                    height: cellSize*2 + 'px',
                    marginLeft: -cellSize + 'px',
                    marginTop: -cellSize + 'px'
                });
                $innerMap.append($ripple);
                setTimeout(() => $ripple.remove(), 600);

                const grid = self.getGridFromEvent(e, $el, $innerMap);
                self.handleMapInteraction(grid.x, grid.y);
            });

            // 绑定缩放 (仅在创建时绑定一次)
            this.bindMapZoom($el, $innerMap);
            
            // UI Overlay (Round Info + Controls)
            $el.append(`
                <div class="dnd-hud-overlay" style="pointer-events:none;z-index:30;">
                    <div style="position:absolute;top:2px;left:4px;font-size:9px;color:rgba(255,255,255,0.5);text-shadow:1px 1px 2px #000;">A1</div>
                    <div style="position:absolute;bottom:2px;right:4px;font-size:9px;color:rgba(255,255,255,0.5);text-shadow:1px 1px 2px #000;">${String.fromCharCode(64 + Math.min(cols, 26))}${rows}</div>
                    <div id="dnd-map-round-info" style="position:absolute;bottom:2px;left:4px;font-size:9px;color:var(--dnd-text-highlight);background:rgba(0,0,0,0.5);padding:0 4px;border-radius:2px;">第 ${round} 回合</div>
                    
                    <!-- Battle Map Controls -->
                    <div class="dnd-map-controls" style="position:absolute;top:2px;right:2px;display:flex;gap:2px;pointer-events:auto;opacity:0.8;">
                        <button type="button" onclick="window.DND_Dashboard_UI.regenerateMap('${locationName}', 'svg')" title="生成/刷新 战斗底图" style="background:rgba(0,0,0,0.6);border:1px solid #444;color:#fff;border-radius:3px;padding:1px 4px;cursor:pointer;font-size:9px;"><i class="fa-solid fa-palette"></i> AI底图</button>
                    </div>
                </div>
            `);
        } else {
            // 仅更新回合数
            $el.find('#dnd-map-round-info').text(`第 ${round} 回合`);
        }

        // 3. 增量更新 Token (Dynamic Layer)
        const currentTokens = mapData.filter(m => m['类型'] === 'Token');
        const activeTokenIds = new Set();
        
        // [新增] 获取队伍数据以匹配真实ID
        const partyData = DataManager.getPartyData();

        currentTokens.forEach(item => {
            const pos = DataManager.parseValue(item['坐标'], 'coord');
            if (!pos) return;

            const px = (pos.x !== undefined ? pos.x : 1) - 1;
            const py = (pos.y !== undefined ? pos.y : 1) - 1;
            const size = DataManager.parseValue(item['大小'], 'size') || { w: 1, h: 1 };

            const enc = encounters ? encounters.find(e => e['单位名称'] === item['单位名称']) : null;
            const isEnemy = enc ? enc['阵营'] === '敌方' : false;
            const isActive = enc ? enc['是否为当前行动者'] === '是' : false;

            const tokenSize = Math.max(cellSize * size.w - 2, 4);
            const bgColor = isEnemy ? '#c0392b' : '#27ae60';
            const borderColor = isActive ? '#ffdb85' : 'transparent';
            
            // 生成唯一且合法的 DOM ID
            const safeId = 'dnd-token-' + item['单位名称'].replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
            activeTokenIds.add(safeId);

            let $token = $innerMap.find(`#${safeId}`);
            
            // 计算目标 CSS
            const targetCss = {
                left: (px * cellSize + 1) + 'px',
                top: (py * cellSize + 1) + 'px',
                width: tokenSize + 'px',
                height: tokenSize + 'px',
                background: bgColor,
                borderColor: borderColor
            };

            if ($token.length > 0) {
                // 更新现有 Token (利用 CSS transition 实现平滑移动)
                $token.css(targetCss);
                
                // 更新 Active 状态
                if (isActive && !$token.hasClass('active')) $token.addClass('active');
                else if (!isActive && $token.hasClass('active')) $token.removeClass('active');
                
            } else {
                // 创建新 Token
                // [新增] 尝试解析正确的 Avatar Key (CHAR_ID)
                let avatarKey = item['单位名称'];
                if (partyData) {
                    const match = partyData.find(p => p['姓名'] === item['单位名称']);
                    if (match) {
                        avatarKey = match['CHAR_ID'] || match['PC_ID'] || match['姓名'];
                    }
                }
                
                const initialToken = this.getNameInitial(item['单位名称']);
                const uid = `token-content-${safeId}`;
                
                $token = $(`<div id="${safeId}" class="dnd-minimap-token ${isActive ? 'active' : ''}" title="${item['单位名称']}">
                    <div id="${uid}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;font-size:${Math.floor(tokenSize*0.6)}px;text-shadow:0 0 2px #000;pointer-events:none;">
                        ${initialToken}
                    </div>
                </div>`);
                $token.css(targetCss);
                
                // [新增] 异步加载头像
                setTimeout(() => this.loadAvatarAsync(avatarKey, uid), 0);
                
                // 绑定点击事件
                const self = this;
                $token.on('click', (e) => {
                    e.stopPropagation();
                    if (self._targetingMode.active) {
                        const p = DataManager.parseValue(item['坐标'], 'coord');
                        if (p) self.handleMapInteraction(p.x||1, p.y||1);
                    } else {
                        if (enc) self.showCombatUnitDetail(enc, e);
                    }
                });
                
                $innerMap.append($token);
            }
        });

        // 清理已移除的 Token
        $innerMap.find('.dnd-minimap-token').each(function() {
            const id = $(this).attr('id');
            if (id && !activeTokenIds.has(id)) {
                $(this).fadeOut(300, function() { $(this).remove(); });
            }
        });

        // 4. 更新辅助元素 (虚拟位置 & 范围圈)
        // 先清除旧的辅助元素
        $innerMap.find('.dnd-map-overlay').remove();
        
        const activeChar = this.getControlledCharacter();
        let sourcePos = { x: 0, y: 0 };
        let sourceFound = false;
        let realPos = null;

        if (encounters && activeChar) {
            let activeUnit = encounters.find(u => u['单位名称'] === activeChar['姓名']);
            if (!activeUnit && activeChar['姓名']) {
                activeUnit = encounters.find(u => activeChar['姓名'].includes(u['单位名称']) || u['单位名称'].includes(activeChar['姓名']));
            }
            if (activeUnit) {
                const token = mapData.find(m => m['类型'] === 'Token' && m['单位名称'] === activeUnit['单位名称']);
                if (token) {
                    const p = DataManager.parseValue(token['坐标'], 'coord');
                    if (p) realPos = { x: p.x || 1, y: p.y || 1 };
                }
            }
        }

        if (this._virtualPos) {
            sourcePos = { ...this._virtualPos };
            sourceFound = true;
            // 渲染虚拟位置 (Ghost)
            const vPxX = (sourcePos.x - 1) * cellSize;
            const vPxY = (sourcePos.y - 1) * cellSize;
            
            const ghostHtml = `<div class="dnd-map-overlay" style="position:absolute;left:${vPxX}px;top:${vPxY}px;width:${cellSize}px;height:${cellSize}px;border:2px dashed var(--dnd-text-highlight);border-radius:50%;background:rgba(255, 219, 133, 0.2);pointer-events:none;z-index:20;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">👻</div>`;
            $innerMap.append(ghostHtml);

            if (realPos) {
                const rPxX = (realPos.x - 1) * cellSize + cellSize / 2;
                const rPxY = (realPos.y - 1) * cellSize + cellSize / 2;
                const vCenterX = vPxX + cellSize / 2;
                const vCenterY = vPxY + cellSize / 2;
                
                const lineSvg = `
                    <svg class="dnd-map-overlay" width="${mapWidth}" height="${mapHeight}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:15;">
                        <line x1="${rPxX}" y1="${rPxY}" x2="${vCenterX}" y2="${vCenterY}" stroke="var(--dnd-text-highlight)" stroke-width="1" stroke-dasharray="4"/>
                    </svg>
                `;
                $innerMap.append(lineSvg);
            }
        } else if (realPos) {
            sourcePos = realPos;
            sourceFound = true;
        }

        if (this._targetingMode.active && sourceFound) {
            const range = this._targetingMode.range || 1;
            const rangePx = range * cellSize;
            const srcPxX = (sourcePos.x - 1) * cellSize + cellSize / 2;
            const srcPxY = (sourcePos.y - 1) * cellSize + cellSize / 2;
            
            const rangeHtml = `<div class="dnd-map-overlay" style="position:absolute;left:${srcPxX - rangePx}px;top:${srcPxY - rangePx}px;width:${rangePx * 2}px;height:${rangePx * 2}px;border:2px solid var(--dnd-accent-green);background:rgba(46, 204, 113, 0.1);border-radius:50%;pointer-events:none;z-index:25;box-shadow: 0 0 15px rgba(46, 204, 113, 0.3);"></div>`;
            $innerMap.append(rangeHtml);
        }
    },

    // [新增] 重新生成地图 (Wrapper for onclick)
    async regenerateMap(locationName, mode) {
        const { $ } = getCore();
        const global = DataManager.getTable('SYS_GlobalState');
        const isCombat = global && global[0] && global[0]['战斗模式'] === '战斗中';
        
        let confirmMsg = '确定要重新绘制地图图片吗？结构将保持不变。';
        if (isCombat) confirmMsg = '确定要重新生成战斗场景底图吗？这需要消耗 tokens。';

        const confirmed = await NotificationSystem.confirm(confirmMsg, {
            title: '重绘地图',
            confirmText: '重绘',
            type: 'warning'
        });
        if (!confirmed) return;

        // Show spinner
        let $container = $('#dnd-hud-minimap-content');
        // If in combat mode, we might want to keep the grid and just show a spinner overlay,
        // but for simplicity, full blocking spinner is fine or finding the inner container.
        
        if (isCombat) {
             // Find specific bg container or overlay
             const $bg = $('.dnd-minimap-inner');
             if ($bg.length) {
                 // Add loading overlay to map only
                 $bg.append(`<div id="dnd-map-loading-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;color:#fff;">
                    <div style="text-align:center;">
                        <div class="dnd-spinner" style="width:24px;height:24px;border:3px solid #333;border-top:3px solid var(--dnd-border-gold);border-radius:50%;animation:dnd-spin 1s infinite linear;margin:0 auto 5px;"></div>
                        <div style="font-size:10px;">AI 正在构筑战场...</div>
                    </div>
                 </div>`);
             }
        } else {
             $container.html(`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;flex-direction:column;gap:5px;">
                <div class="dnd-spinner" style="width:24px;height:24px;border:3px solid #333;border-top:3px solid var(--dnd-border-gold);border-radius:50%;animation:dnd-spin 1s infinite linear;"></div>
                <div style="font-size:11px;">AI 正在绘图...</div>
            </div>`);
        }

        try {
            const desc = (global && global[0]) ? global[0]['场景描述'] : '';

            if (isCombat) {
                // Battle Map Regen
                const mapData = DataManager.getTable('COMBAT_BattleMap');
                const config = mapData ? mapData.find(m => m['类型'] === 'Config') : null;
                let cols = 20, rows = 20;
                if (config && config['坐标']) {
                    const size = DataManager.parseValue(config['坐标'], 'size');
                    if (size) { cols = size.w || 20; rows = size.h || 20; }
                }
                
                await ExplorationMapManager.getBattleMap(locationName, desc, cols, rows, true); // true = force regen
                
                // Remove loading overlay
                $('#dnd-map-loading-overlay').remove();
                
            } else {
                // Exploration Map Regen
                // Force regen based on mode (Only support SVG regen now)
                const forceParam = true; // true means regen SVG only
                await ExplorationMapManager.getMap(locationName, desc, forceParam);
            }
            
            // Refresh HUD to render new map
            this.renderHUD();
        } catch(e) {
            NotificationSystem.error('生成失败: ' + e.message);
            this.renderHUD(); // Restore UI
        }
    },

    // [新增] 处理地图交互
    handleMapInteraction(gridX, gridY) {
        const state = this._targetingMode;
        const encounters = DataManager.getTable('COMBAT_Encounter');
        const mapData = DataManager.getTable('COMBAT_BattleMap');
        const activeChar = this.getControlledCharacter();
        
        // --- A. 瞄准模式 ---
        if (state.active) {
            // 1. 计算距离
            let dist = 999;
            let sourcePos = { x: 0, y: 0 };
            
            // 获取源头位置 (优先使用虚拟位置，即移动后的位置)
            if (this._virtualPos) {
                sourcePos = { ...this._virtualPos };
            } else if (encounters && activeChar) {
                // [修复] 尝试模糊匹配名称
                let activeUnit = encounters.find(u => u['单位名称'] === activeChar['姓名']);
                if (!activeUnit && activeChar['姓名']) {
                    activeUnit = encounters.find(u => activeChar['姓名'].includes(u['单位名称']) || u['单位名称'].includes(activeChar['姓名']));
                }

                const token = mapData ? mapData.find(m => m['类型'] === 'Token' && m['单位名称'] === (activeUnit ? activeUnit['单位名称'] : '')) : null;
                if (token) {
                    const p = DataManager.parseValue(token['坐标'], 'coord');
                    if (p) sourcePos = { x: p.x || 1, y: p.y || 1 };
                }
            }
            
            // 简单切比雪夫距离 (DND 5e 规则通常也是对角线算1格，或 1-2-1 规则)
            // 这里使用最简单的 max(|dx|, |dy|) 规则 (Default 5e grid rule)
            const dx = Math.abs(gridX - sourcePos.x);
            const dy = Math.abs(gridY - sourcePos.y);
            dist = Math.max(dx, dy);
            
            // 2. 检查距离
            if (dist > state.range) {
                NotificationSystem.warning(`目标超出范围！(距离: ${dist * 5}尺 / 射程: ${state.range * 5}尺)`);
                return;
            }
            
            // 3. 检查是否有目标单位
            let targetName = null;
            const targetToken = mapData.find(m => m['类型'] === 'Token' && m['坐标'] &&
                DataManager.parseValue(m['坐标'], 'coord').x === gridX &&
                DataManager.parseValue(m['坐标'], 'coord').y === gridY);
                
            if (targetToken) targetName = targetToken['单位名称'];
            
            // 4. 执行回调
            if (state.callback) {
                state.callback({
                    x: gridX,
                    y: gridY,
                    target: targetName,
                    distance: dist
                });
            }
            
            // 5. 退出模式
            this.endTargeting();
            return;
        }
        
        // --- B. 普通模式 (点击空地) ---
        // 显示简易菜单: "移动到这里"
        const menuHtml = `
            <div style="font-weight:bold;color:var(--dnd-text-highlight);border-bottom:1px solid #555;padding-bottom:5px;margin-bottom:5px;">
                <i class="fa-solid fa-location-dot"></i> 位置: ${String.fromCharCode(64 + gridX)}${gridY}
            </div>
            <div class="dnd-clickable" style="padding:8px;cursor:pointer;border-radius:4px;background:rgba(46, 204, 113, 0.2);border:1px solid var(--dnd-accent-green);text-align:center;font-weight:bold;"
                onclick="window.DND_Dashboard_UI.executeAction('move', { x: ${gridX}, y: ${gridY} }); window.DND_Dashboard_UI.hideDetailPopup();">
                👣 移动到此
            </div>
        `;
        // 计算屏幕坐标显示菜单
        const { $ } = getCore();
        const $hud = $('#dnd-mini-hud');
        const hudRect = $hud[0].getBoundingClientRect();
        this.showItemDetailPopup(menuHtml, hudRect.left + hudRect.width/2, hudRect.top + hudRect.height/2);
    }
};
