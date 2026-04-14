import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { CONFIG } from '../../config/Config.js';
import { DBAdapter } from '../../core/DBAdapter.js';
import { DataManager } from '../../data/DataManager.js';
import { SettingsManager } from '../../core/SettingsManager.js';
import { PresetSwitcher } from '../../features/PresetSwitcher.js';
import { TavernAPI } from '../../core/TavernAPI.js';
import { TemplateSync } from '../../features/TemplateSync.js';
import { NotificationSystem } from './UIUtils.js';
import UICore from './UICore.js';
import { DynamicBackground } from '../DynamicBackground.js';
import { ThemeManager } from '../../features/ThemeManager.js';
import { StyleManager } from '../../features/StyleManager.js';
import { DiceRulesInjector } from '../../features/DiceRulesInjector.js';
import { ICONS } from '../SVGIcons.js';

export default {
    async renderSettingsPanel($c) {
        const { $ } = getCore();
        const config = CONFIG.PRESET_SWITCHING;
        const presets = PresetSwitcher.getAvailablePresets();
        const apiConfig = await SettingsManager.getAPIConfig();
        const aiProvider = apiConfig.provider || 'plugin';
        const dbAiStatus = TavernAPI.getDatabaseAIStatus();
        const syncStatus = await SettingsManager.getSyncStatus();
        const currentScale = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.UI_SCALE) || CONFIG.UI_SCALE.DEFAULT;
        
        // 获取表格管理配置
        const allData = DataManager.getAllData() || {};
        const tables = Object.keys(allData).filter(k => k.startsWith('sheet_') || (allData[k].name && allData[k].mate));
        const savedTmCols = await DBAdapter.getSetting('dnd_tm_cols') || 'auto';
        const savedHiddenTables = await DBAdapter.getSetting('dnd_tm_hidden_tables');
        const hiddenTables = savedHiddenTables ? JSON.parse(savedHiddenTables) : [];

        // 获取动态背景配置
        const savedBgConfig = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.DYNAMIC_BG);
        const bgConfig = savedBgConfig ? JSON.parse(savedBgConfig) : CONFIG.DYNAMIC_BG;
        const bgEffects = DynamicBackground.getAvailableEffects();
        
        // 获取选项换行设置
        const savedOptionWrap = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.OPTION_WRAP);
        const optionWrapEnabled = savedOptionWrap === true || savedOptionWrap === 'true';
        
        // 获取迷你地图显示设置
        const savedShowMiniMap = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.SHOW_MINI_MAP);
        const showMiniMapEnabled = savedShowMiniMap !== false && savedShowMiniMap !== 'false'; // 默认开启
        
        // 获取隐藏浮动球设置
        const savedHideFloatingBall = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.HIDE_FLOATING_BALL);
        const hideFloatingBallEnabled = savedHideFloatingBall === true || savedHideFloatingBall === 'true'; // 默认关闭
        
        // 获取骰子规则注入设置
        const savedInjectDiceRules = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.INJECT_DICE_RULES);
        const injectDiceRulesEnabled = savedInjectDiceRules === true || savedInjectDiceRules === 'true'; // 默认关闭
        
        // 构建预设选项 HTML
        const buildOptions = (selected) => {
            let html = `<option value="">-- 手动输入 --</option>`;
            presets.forEach(p => {
                const isSel = p === selected ? 'selected' : '';
                html += `<option value="${p}" ${isSel}>${p}</option>`;
            });
            return html;
        };

        const html = `
            <div style="padding:20px; max-width: 600px;">
                <h2 style="color:var(--dnd-text-highlight);border-bottom:1px solid var(--dnd-border-gold);padding-bottom:10px;margin-top:0;">
                    ${ICONS.COG} 仪表盘设置
                </h2>

                <!-- 同步状态 -->
                <div style="background:var(--dnd-bg-card);padding:15px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
                    <div>
                        <div style="color:var(--dnd-text-header);font-weight:bold;margin-bottom:5px;">${ICONS.CLOUD} 云同步状态</div>
                        <div style="color:var(--dnd-text-dim);font-size:12px;">配置将自动同步到酒馆服务器</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span id="dnd-sync-badge" class="dnd-badge dnd-badge-${syncStatus.statusClass}" style="padding:4px 8px;">${syncStatus.statusText}</span>
                        <button type="button" id="dnd-sync-force" style="background:transparent;border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;" title="强制同步">${ICONS.SYNC}</button>
                    </div>
                </div>

                <!-- 模板同步 -->
                <div style="background:var(--dnd-bg-card);padding:15px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:15px;">
                    <div>
                        <div style="color:var(--dnd-text-header);font-weight:bold;margin-bottom:5px;"><i class="fa-solid fa-table"></i> 表格模板</div>
                        <div style="color:var(--dnd-text-dim);font-size:12px;line-height:1.6;">当前内置模板版本：v${CONFIG.TEMPLATE_SYNC.CURRENT_VERSION}。可在这里手动重新导入模板。</div>
                    </div>
                    <button type="button" id="dnd-template-import" style="background:rgba(157,139,108,0.16);border:1px solid var(--dnd-border-gold);color:var(--dnd-text-highlight);padding:8px 14px;border-radius:4px;cursor:pointer;font-size:12px;white-space:nowrap;">
                        <i class="fa-solid fa-file-import"></i> 导入表格模板
                    </button>
                </div>

                <!-- 界面显示设置 -->
                <div style="background:var(--dnd-bg-card);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">💻 界面显示</h3>
                    <p style="color:var(--dnd-text-dim);font-size:13px;margin-bottom:15px;">
                        调整仪表盘和悬浮球的大小比例，适配不同分辨率的屏幕。
                    </p>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:flex;justify-content:space-between;margin-bottom:5px;color:var(--dnd-text-main);">
                            <span>缩放比例 (Scale)</span>
                            <span id="dnd-scale-value" style="color:var(--dnd-text-highlight);">${currentScale}</span>
                        </label>
                        <div style="display:flex;gap:10px;align-items:center;">
                            <input type="range" id="dnd-set-ui-scale"
                                min="${CONFIG.UI_SCALE.MIN}" max="${CONFIG.UI_SCALE.MAX}" step="${CONFIG.UI_SCALE.STEP}" value="${currentScale}"
                                style="flex:1;cursor:pointer;">
                            <button type="button" id="dnd-reset-scale" style="padding:4px 8px;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);border-radius:4px;cursor:pointer;font-size:12px;">重置</button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="dnd-option-wrap" ${optionWrapEnabled ? 'checked' : ''} style="margin-right:10px;transform:scale(1.2);">
                            <span style="color:var(--dnd-text-main);">行动选项自动换行</span>
                        </label>
                        <p style="color:#666;font-size:11px;margin:5px 0 0 26px;">
                            启用后，HUD 中的行动选项按钮文本将自动换行显示完整内容，而不是截断。
                        </p>
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="dnd-show-mini-map" ${showMiniMapEnabled ? 'checked' : ''} style="margin-right:10px;transform:scale(1.2);">
                            <span style="color:var(--dnd-text-main);">显示 MiniHUD 地图</span>
                        </label>
                        <p style="color:#666;font-size:11px;margin:5px 0 0 26px;">
                            控制探索模式和战斗模式中的迷你地图是否显示。关闭后可节省屏幕空间。
                        </p>
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="dnd-hide-floating-ball" ${hideFloatingBallEnabled ? 'checked' : ''} style="margin-right:10px;transform:scale(1.2);">
                            <span style="color:var(--dnd-text-main);">隐藏浮动球</span>
                        </label>
                        <p style="color:#666;font-size:11px;margin:5px 0 0 26px;">
                            启用后隐藏浮动球，Mini HUD 将独立显示并可拖拽。需配合酒馆助手按钮使用。
                        </p>
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="dnd-inject-dice-rules" ${injectDiceRulesEnabled ? 'checked' : ''} style="margin-right:10px;transform:scale(1.2);">
                            <span style="color:var(--dnd-text-main);">注入 DND 5E 骰子规则</span>
                        </label>
                        <p style="color:#666;font-size:11px;margin:5px 0 0 26px;">
                            启用后将自动把修正后的 DND 5E 骰子检定规则注入到当前聊天，确保 AI 遵循正确的规则（属性检定无自动成功/失败、攻击Nat20自动命中等）。
                        </p>
                    </div>
                </div>

                <!-- 配色模板设置 -->
                <div style="background:var(--dnd-bg-card);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">${ICONS.PALETTE} 配色模板</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        选择预设主题或自定义配色，让界面风格更符合你的喜好。
                    </p>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">预设主题</label>
                        <select id="dnd-theme-preset" style="width:100%;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;">
                            ${ThemeManager.getList().map(t => `<option value="${t.id}" ${t.id === ThemeManager.currentTheme ? 'selected' : ''}>${t.icon || ICONS.PALETTE} ${t.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="dnd-custom-color-enabled" ${ThemeManager.currentTheme === 'custom' ? 'checked' : ''} style="margin-right:10px;transform:scale(1.2);">
                            <span style="font-weight:bold;">启用自定义配色</span>
                        </label>
                    </div>
                    
                    <div id="dnd-custom-color-panel" style="opacity:${ThemeManager.currentTheme === 'custom' ? 1 : 0.5};pointer-events:${ThemeManager.currentTheme === 'custom' ? 'auto' : 'none'};transition:all 0.3s;">
                        <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;margin-bottom:15px;">
                            ${(() => {
                                const editableVars = ThemeManager.getEditableVars();
                                return Object.entries(editableVars).map(([key, info]) => `
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <input type="color" class="dnd-color-picker" data-var="${key}" value="${info.value.replace(/^#/, '#').substring(0, 7)}"
                                            style="width:32px;height:32px;border:1px solid var(--dnd-border-subtle);border-radius:4px;cursor:pointer;background:transparent;padding:0;">
                                        <span style="color:var(--dnd-text-main);font-size:12px;flex:1;">${info.label}</span>
                                    </div>
                                `).join('');
                            })()}
                        </div>
                        
                        <div style="display:flex;gap:10px;flex-wrap:wrap;">
                            <button type="button" id="dnd-color-reset" style="
                                background:rgba(231, 76, 60, 0.2);
                                border:1px solid #e74c3c;
                                color:#e74c3c;
                                padding:6px 12px;
                                border-radius:4px;
                                cursor:pointer;
                                font-size:12px;
                            ">${ICONS.SYNC} 重置为默认</button>
                            <button type="button" id="dnd-color-export" style="
                                background:rgba(52, 152, 219, 0.2);
                                border:1px solid #3498db;
                                color:#3498db;
                                padding:6px 12px;
                                border-radius:4px;
                                cursor:pointer;
                                font-size:12px;
                            ">📤 导出配色</button>
                            <button type="button" id="dnd-color-import" style="
                                background:rgba(46, 204, 113, 0.2);
                                border:1px solid #2ecc71;
                                color:#2ecc71;
                                padding:6px 12px;
                                border-radius:4px;
                                cursor:pointer;
                                font-size:12px;
                            ">📥 导入配色</button>
                        </div>
                        <input type="file" id="dnd-color-import-input" accept=".json" style="display:none;">
                        
                        <div id="dnd-color-preview" style="margin-top:15px;padding:15px;border-radius:6px;border:1px solid var(--dnd-border-inner);background:var(--dnd-bg-card);">
                            <div style="font-weight:bold;margin-bottom:8px;color:var(--dnd-text-header);">配色预览</div>
                            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                                <span class="dnd-badge dnd-badge-success" style="padding:4px 8px;">成功</span>
                                <span class="dnd-badge dnd-badge-warning" style="padding:4px 8px;">警告</span>
                                <span class="dnd-badge dnd-badge-error" style="padding:4px 8px;">错误</span>
                            </div>
                            <div style="margin-top:10px;padding:8px;background:var(--dnd-bg-input);border-radius:4px;">
                                <span style="color:var(--dnd-text-main);">主文本</span> ·
                                <span style="color:var(--dnd-text-highlight);">高亮文本</span> ·
                                <span style="color:var(--dnd-text-dim);">次要文本</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 风格管理 -->
                <div style="background:var(--dnd-bg-card);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">${ICONS.MASK} 风格管理</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        选择完整的视觉风格主题，包含颜色、尺寸、圆角、动画等全套配置。
                        风格是比配色更完整的视觉方案，能让界面看起来焕然一新。
                    </p>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:8px;color:var(--dnd-text-main);">当前风格</label>
                        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--dnd-bg-input);border-radius:6px;border:1px solid var(--dnd-border-inner);">
                            <span style="font-size:24px;">${StyleManager.getCurrentStyle().icon || ICONS.PALETTE}</span>
                            <div style="flex:1;">
                                <div style="font-weight:bold;color:var(--dnd-text-header);">${StyleManager.getCurrentStyle().name || '经典DND'}</div>
                                <div style="font-size:11px;color:#888;">${StyleManager.getCurrentStyle().description || ''}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:8px;color:var(--dnd-text-main);">可用风格</label>
                        <div id="dnd-style-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:10px;">
                            ${StyleManager.getAvailableStyles().map(style => `
                                <div class="dnd-style-card ${style.id === StyleManager.currentStyleId ? 'active' : ''}"
                                     data-style-id="${style.id}">
                                    <div style="font-size:28px;margin-bottom:6px;">${style.icon || ICONS.PALETTE}</div>
                                    <div style="font-size:12px;font-weight:bold;color:${style.id === StyleManager.currentStyleId ? 'var(--dnd-text-highlight)' : 'var(--dnd-text-main)'};">${style.name}</div>
                                    ${style.isCustom ? '<div style="font-size:9px;color:var(--dnd-text-dim);margin-top:2px;">自定义</div>' : ''}
                                    ${style.id === StyleManager.currentStyleId ? '<div style="font-size:9px;color:var(--dnd-text-highlight);margin-top:2px;">✓ 当前</div>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
                        <button type="button" id="dnd-style-import" style="
                            background:rgba(46, 204, 113, 0.2);
                            border:1px solid #2ecc71;
                            color:#2ecc71;
                            padding:8px 16px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:12px;
                        ">${ICONS.DOWNLOAD} 导入风格包</button>
                        <button type="button" id="dnd-style-export" style="
                            background:rgba(52, 152, 219, 0.2);
                            border:1px solid #3498db;
                            color:#3498db;
                            padding:8px 16px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:12px;
                        ">${ICONS.UPLOAD} 导出当前风格</button>
                        <button type="button" id="dnd-style-reset" style="
                            background:rgba(231, 76, 60, 0.2);
                            border:1px solid #e74c3c;
                            color:#e74c3c;
                            padding:8px 16px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:12px;
                        ">${ICONS.SYNC} 恢复默认</button>
                    </div>
                    <input type="file" id="dnd-style-import-input" accept=".json" style="display:none;">
                    
                    <div style="padding:10px;background:rgba(52, 152, 219, 0.1);border:1px solid rgba(52, 152, 219, 0.3);border-radius:4px;">
                        <div style="font-size:11px;color:#888;">
                            ${ICONS.LIGHTBULB} <strong>提示:</strong> 风格包是完整的视觉主题配置。如果您只想微调颜色，可以使用上方的"配色模板"功能。
                            风格和配色可以叠加使用 —— 先选择喜欢的风格，再通过配色进行个性化调整。
                        </div>
                    </div>
                </div>

                <!-- 动态背景设置 -->
                <div style="background:var(--dnd-bg-card);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">${ICONS.SPARKLES} 动态背景</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        为界面添加动态背景效果，类似游戏UI设计，让背景不再单调。
                    </p>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="dnd-bg-enabled" ${bgConfig.enabled ? 'checked' : ''} style="margin-right:10px;transform:scale(1.2);">
                            <span style="font-weight:bold;">启用动态背景</span>
                        </label>
                    </div>
                    
                    <div class="dnd-bg-group" style="opacity:${bgConfig.enabled ? 1 : 0.5};pointer-events:${bgConfig.enabled ? 'auto' : 'none'};transition:all 0.3s;">
                        <div style="margin-bottom:15px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">背景效果</label>
                            <select id="dnd-bg-type" style="width:100%;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;">
                                ${bgEffects.map(e => `<option value="${e.id}" ${e.id === bgConfig.type ? 'selected' : ''}>${e.icon || ICONS.SPARKLES} ${e.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="margin-bottom:10px;">
                            <label style="display:flex;justify-content:space-between;margin-bottom:5px;color:var(--dnd-text-main);">
                                <span>效果强度</span>
                                <span id="dnd-bg-intensity-value" style="color:var(--dnd-text-highlight);">${bgConfig.intensity || 1.0}</span>
                            </label>
                            <input type="range" id="dnd-bg-intensity" min="0.3" max="2.0" step="0.1" value="${bgConfig.intensity || 1.0}" style="width:100%;cursor:pointer;">
                        </div>
                        
                        <div id="dnd-bg-preview" style="margin-top:15px;height:80px;border-radius:6px;border:1px solid var(--dnd-border-inner);overflow:hidden;position:relative;">
                            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#666;font-size:12px;">效果预览</div>
                        </div>
                    </div>
                </div>

                <!-- API 配置 -->
                <div style="background:var(--dnd-bg-card);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;"><i class="fa-solid fa-plug"></i> API 连接配置</h3>
                    <p style="color:var(--dnd-text-dim);font-size:13px;margin-bottom:15px;">
                        可在插件自定义 API 与神数据库 AI 调用之间切换。角色创建与地图生成会使用这里选定的方案。
                    </p>

                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">AI 调用方案</label>
                        <select id="dnd-ai-provider" style="width:100%;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;">
                            <option value="plugin" ${aiProvider === 'plugin' ? 'selected' : ''}>插件自定义 API</option>
                            <option value="database" ${aiProvider === 'database' ? 'selected' : ''}>神数据库 AI 调用</option>
                        </select>
                        <div style="font-size:11px;color:var(--dnd-text-dim);margin-top:6px;">
                            选择"神数据库 AI 调用"后，将直接使用数据库插件的 <code>callAI()</code> 能力，而不是插件内单独配置的 URL / Key / Model。
                        </div>
                    </div>

                    <div id="dnd-db-ai-config-group" style="display:${aiProvider === 'database' ? 'block' : 'none'};margin-bottom:15px;padding:12px;border-radius:6px;border:1px solid var(--dnd-border-subtle);background:var(--dnd-bg-secondary);">
                        <div style="font-weight:bold;color:var(--dnd-text-header);margin-bottom:8px;">神数据库 AI 状态</div>
                        <div style="font-size:12px;color:var(--dnd-text-main);line-height:1.7;">
                            <div>AI 调用接口：<span style="color:${dbAiStatus.available ? 'var(--dnd-accent-green)' : 'var(--dnd-accent-red)'};font-weight:bold;">${dbAiStatus.available ? '已检测到' : '未检测到'}</span></div>
                            <div>已检测到 API 预设：${dbAiStatus.presetCount} 个</div>
                            <div>当前填表预设：${dbAiStatus.tablePreset || '使用数据库当前配置'}</div>
                            <div>当前剧情预设：${dbAiStatus.plotPreset || '使用数据库当前配置'}</div>
                        </div>
                        <div style="font-size:11px;color:var(--dnd-text-dim);margin-top:8px;line-height:1.6;">
                            这里显示的是数据库 AI 接口是否已暴露给前端；具体的 API URL、模型与预设切换，请在神数据库插件内部完成配置。
                        </div>
                    </div>
                    
                    <div id="dnd-plugin-api-config-group" style="opacity:${aiProvider === 'plugin' ? 1 : 0.45};pointer-events:${aiProvider === 'plugin' ? 'auto' : 'none'};transition:all 0.25s;">
                        <div style="margin-bottom:10px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">API 地址 (URL)</label>
                            <input type="text" id="dnd-set-api-url" value="${apiConfig.url || ''}" placeholder="https://api.openai.com/v1" style="width:100%;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;">
                        </div>
                        
                        <div style="margin-bottom:10px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">API 密钥 (Key)</label>
                            <input type="password" id="dnd-set-api-key" value="${apiConfig.key || ''}" placeholder="sk-..." style="width:100%;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;">
                        </div>
                        
                        <div style="margin-bottom:10px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">模型名称 (Model)</label>
                            <div style="display:flex;gap:10px;">
                                <input type="text" id="dnd-set-api-model" value="${apiConfig.model || ''}" placeholder="gpt-3.5-turbo" style="flex:1;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;">
                                <button type="button" id="dnd-set-fetch-models" style="padding:0 15px;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);border-radius:4px;cursor:pointer;">获取列表</button>
                            </div>
                            <!-- 模型下拉列表容器 -->
                            <div id="dnd-model-list-container" style="display:none;margin-top:5px;">
                                <select id="dnd-set-model-select" style="width:100%;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;">
                                    <option value="">-- 选择模型 --</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 表格管理设置 -->
                <div style="background:var(--dnd-bg-card);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;"><i class="fa-solid fa-clipboard-list"></i> 表格管理</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        自定义表格管理模块的布局和显示内容。
                    </p>
                    
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">每行按钮数</label>
                        <select id="dnd-tm-cols-setting" style="width:100%;background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;">
                            <option value="auto" ${savedTmCols === 'auto' ? 'selected' : ''}>自动 (Auto)</option>
                            <option value="2" ${savedTmCols == 2 ? 'selected' : ''}>2 列</option>
                            <option value="3" ${savedTmCols == 3 ? 'selected' : ''}>3 列</option>
                            <option value="4" ${savedTmCols == 4 ? 'selected' : ''}>4 列</option>
                            <option value="5" ${savedTmCols == 5 ? 'selected' : ''}>5 列</option>
                        </select>
                    </div>

                    <div style="margin-bottom:10px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">可见表格</label>
                        <div style="background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);border-radius:4px;padding:10px;max-height:150px;overflow-y:auto;">
                            ${tables.length > 0 ? tables.map(k => {
                                const name = allData[k].name || k;
                                const isChecked = !hiddenTables.includes(k);
                                return `
                                    <label style="display:flex;align-items:center;margin-bottom:5px;cursor:pointer;">
                                        <input type="checkbox" class="dnd-tm-visible-check" value="${k}" ${isChecked ? 'checked' : ''} style="margin-right:8px;">
                                        <span style="color:var(--dnd-text-main);font-size:12px;">${name}</span>
                                    </label>
                                `;
                            }).join('') : '<div style="color:var(--dnd-text-dim);font-size:12px;">暂无可用表格</div>'}
                        </div>
                    </div>
                </div>

                <div style="background:var(--dnd-bg-card);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">🔁 自动预设切换</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:20px;">
                        根据游戏内的战斗状态（全局状态表中的"战斗模式"字段），自动切换酒馆的 Plot/World Info 预设。
                    </p>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:flex;align-items:center;cursor:pointer;">
                            <input type="checkbox" id="dnd-cfg-enabled" ${config.ENABLED ? 'checked' : ''} style="margin-right:10px;transform:scale(1.2);">
                            <span style="font-weight:bold;">启用自动切换功能</span>
                        </label>
                    </div>
                    
                    <div class="dnd-cfg-group" style="opacity:${config.ENABLED ? 1 : 0.5};pointer-events:${config.ENABLED ? 'auto' : 'none'};transition:all 0.3s;">
                        <div style="margin-bottom:15px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">${ICONS.SWORD} 战斗状态预设</label>
                            <div style="display:flex;gap:10px;">
                                <select id="dnd-cfg-combat-sel" style="background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;flex:1;">
                                    ${buildOptions(config.COMBAT_PRESET)}
                                </select>
                                <input type="text" id="dnd-cfg-combat-input" value="${config.COMBAT_PRESET}" placeholder="预设名称" style="background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;flex:1;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">${ICONS.COMPASS} 探索状态预设</label>
                            <div style="display:flex;gap:10px;">
                                <select id="dnd-cfg-explore-sel" style="background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;flex:1;">
                                    ${buildOptions(config.EXPLORE_PRESET)}
                                </select>
                                <input type="text" id="dnd-cfg-explore-input" value="${config.EXPLORE_PRESET}" placeholder="预设名称" style="background:var(--dnd-bg-input);border:1px solid var(--dnd-border-subtle);color:var(--dnd-text-main);padding:8px;border-radius:4px;flex:1;">
                            </div>
                        </div>
                    </div>
                    
                    <div style="border-top:1px solid var(--dnd-border-inner);padding-top:20px;display:flex;justify-content:flex-end;gap:10px;">
                        <button type="button" id="dnd-cfg-refresh-presets" style="
                            background:rgba(52, 152, 219, 0.2);
                            border:1px solid #3498db;
                            color:#3498db;
                            padding:10px 15px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:13px;
                        ">${ICONS.SYNC} 刷新预设列表</button>
                        <button type="button" id="dnd-cfg-save" style="
                            background:linear-gradient(135deg, var(--dnd-accent-green), #27ae60);
                            border:none;
                            color:#fff;
                            padding:10px 25px;
                            border-radius:4px;
                            cursor:pointer;
                            font-weight:bold;
                            font-size:14px;
                            display:flex;align-items:center;gap:5px;
                        "><i class="fa-solid fa-save"></i> 保存设置</button>
                    </div>
                </div>

                <!-- 存储诊断工具 -->
                <div style="margin-top:20px;background:var(--dnd-bg-card);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;"><i class="fa-solid fa-database"></i> 存储空间管理</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        检查 LocalStorage 使用情况，或清理 IndexedDB 中的缓存数据（图片和地图）。
                    </p>
                    <div id="dnd-storage-stats" style="margin-bottom:15px;font-size:12px;color:#ccc;"></div>
                    
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                        <button type="button" id="dnd-check-storage" class="dnd-clickable" style="
                            background:rgba(52, 152, 219, 0.2);
                            border:1px solid #3498db;
                            color:#3498db;
                            padding:8px 15px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:13px;
                        ">${ICONS.SEARCH} 检查存储使用量</button>
                        
                        <button type="button" id="dnd-clear-avatars" class="dnd-clickable" style="
                            background:rgba(231, 76, 60, 0.2);
                            border:1px solid #e74c3c;
                            color:#e74c3c;
                            padding:8px 15px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:13px;
                        "><i class="fa-solid fa-trash"></i> 清理头像缓存</button>
                        
                        <button type="button" id="dnd-clear-maps" class="dnd-clickable" style="
                            background:rgba(231, 76, 60, 0.2);
                            border:1px solid #e74c3c;
                            color:#e74c3c;
                            padding:8px 15px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:13px;
                        ">${ICONS.MAP} 清理地图缓存</button>
                    </div>
                </div>
                
                <div style="margin-top:20px;padding:15px;background:rgba(197, 160, 89, 0.1);border-left:3px solid var(--dnd-border-gold);border-radius:4px;">
                    <div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:5px;">${ICONS.LIGHTBULB} 提示</div>
                    <div style="font-size:12px;color:#ccc;line-height:1.5;">
                        预设名称必须与酒馆 World Info 界面中的 Plot 预设名称完全一致。<br>
                        如未找到预设，将会在控制台输出警告且不执行切换。
                    </div>
                </div>
            </div>
        `;
        
        $c.html(html);

        // 绑定存储检查按钮
        $c.find('#dnd-check-storage').on('click', function() {
            const stats = DBAdapter.analyzeStorage();
            let breakdownHtml = '<ul style="padding-left:20px;margin:5px 0;">';
            
            // Sort usage by size
            const sortedUsage = Object.entries(stats.breakdown).sort((a,b) => b[1] - a[1]);
            
            sortedUsage.forEach(([key, bytes]) => {
                const mb = (bytes / 1024 / 1024).toFixed(2);
                const percent = Math.round((bytes / stats.totalBytes) * 100);
                breakdownHtml += `<li><strong>${key}</strong>: ${mb} MB (${percent}%)</li>`;
            });
            breakdownHtml += '</ul>';
            
            let topKeysHtml = '<div style="margin-top:10px;"><strong>占用最大的 Top 5:</strong><br>';
            stats.topKeys.forEach(item => {
                topKeysHtml += `<div style="font-family:monospace;font-size:11px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(item.size/1024).toFixed(1)} KB - ${item.key}</div>`;
            });
            topKeysHtml += '</div>';

            const totalColor = stats.totalBytes > 4.5 * 1024 * 1024 ? '#e74c3c' : (stats.totalBytes > 3 * 1024 * 1024 ? '#f1c40f' : '#2ecc71');
            
            $c.find('#dnd-storage-stats').html(`
                <div style="margin-bottom:10px;">总使用量: <span style="color:${totalColor};font-weight:bold;font-size:14px;">${stats.totalMB} MB</span> / ~5.00 MB</div>
                ${breakdownHtml}
                ${topKeysHtml}
            `);
        });

        // 绑定清理头像缓存按钮
        $c.find('#dnd-clear-avatars').on('click', async function() {
            if (confirm('确定要清理所有缓存的角色头像吗？这将释放存储空间，但下次查看角色时需要重新生成头像。')) {
                try {
                    await DBAdapter.clearAvatars();
                    NotificationSystem.success('头像缓存已清理');
                } catch (e) {
                    NotificationSystem.error('清理失败: ' + e.message);
                }
            }
        });

        // 绑定清理地图缓存按钮
        $c.find('#dnd-clear-maps').on('click', async function() {
            if (confirm('确定要清理所有缓存的地图吗？这将释放存储空间，但下次查看地图时需要重新生成。')) {
                try {
                    await DBAdapter.clearMaps();
                    NotificationSystem.success('地图缓存已清理');
                } catch (e) {
                    NotificationSystem.error('清理失败: ' + e.message);
                }
            }
        });

        // 绑定强制同步按钮
        $c.find('#dnd-sync-force').on('click', async function() {
            const $btn = $(this);
            $btn.prop('disabled', true).css('opacity', 0.5);
            $c.find('#dnd-sync-badge').html('<i class="fa-solid fa-sync fa-spin"></i> 同步中...');
            
            await SettingsManager.forceSync();
            
            // 刷新状态
            const newStatus = await SettingsManager.getSyncStatus();
            $c.find('#dnd-sync-badge')
                .removeClass('dnd-badge-success dnd-badge-warning dnd-badge-error')
                .addClass(`dnd-badge-${newStatus.statusClass}`)
                .text(newStatus.statusText);
                
            $btn.prop('disabled', false).css('opacity', 1);
        });

        // 手动导入模板
        $c.find('#dnd-template-import').on('click', async function(e) {
            if (e) e.preventDefault();
            const $btn = $(this);
            const originalHtml = $btn.html();
            $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> 处理中');
            try {
                await TemplateSync.manualImport();
            } finally {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });

        // 绑定刷新按钮 (API)
        $c.find('#dnd-set-fetch-models').on('click', async function(e) {
            if(e) e.preventDefault();
            const url = $c.find('#dnd-set-api-url').val().trim();
            const key = $c.find('#dnd-set-api-key').val().trim();
            const $btn = $(this);
            const $listContainer = $c.find('#dnd-model-list-container');
            const $select = $c.find('#dnd-set-model-select');
            
            if (!url) { NotificationSystem.warning('请输入 API URL'); return; }
            
            $btn.text('⌛').prop('disabled', true);
            try {
                const models = await TavernAPI.fetchModels(url, key);
                
                // 填充下拉列表
                let options = '<option value="">-- 选择模型 --</option>';
                models.forEach(m => {
                    options += `<option value="${m}">${m}</option>`;
                });
                $select.html(options);
                $listContainer.show();
                
                // 如果当前模型为空，自动填入第一个
                if (!$c.find('#dnd-set-api-model').val() && models.length > 0) {
                    $c.find('#dnd-set-api-model').val(models[0]);
                }
                
                NotificationSystem.success(`获取成功，共 ${models.length} 个模型。请从下拉列表选择。`);
            } catch(e) {
                NotificationSystem.error('获取失败: ' + e.message);
            } finally {
                $btn.text('获取列表').prop('disabled', false);
            }
        });

        // 绑定下拉列表选择事件
        $c.find('#dnd-set-model-select').on('change', function() {
            const val = $(this).val();
            if (val) {
                $c.find('#dnd-set-api-model').val(val);
            }
        });

        const updateAIProviderUI = () => {
            const provider = $c.find('#dnd-ai-provider').val();
            const isPlugin = provider === 'plugin';
            $c.find('#dnd-plugin-api-config-group').css({
                opacity: isPlugin ? 1 : 0.45,
                pointerEvents: isPlugin ? 'auto' : 'none'
            });
            $c.find('#dnd-db-ai-config-group').css('display', isPlugin ? 'none' : 'block');
        };

        $c.find('#dnd-ai-provider').on('change', function() {
            updateAIProviderUI();
            if ($(this).val() === 'database' && !TavernAPI.getDatabaseAIStatus().available) {
                NotificationSystem.warning('已切换到神数据库 AI 模式，但当前数据库插件还未检测到 callAI() 接口。保存前请确认数据库插件已更新。');
            }
        });

        // 绑定刷新按钮 (预设)
        $c.find('#dnd-cfg-refresh-presets').on('click', function(e) {
            if(e) e.preventDefault();
            const $btn = $(this);
            $btn.text('⌛ 刷新中...').prop('disabled', true);
            
            // 重新获取列表
            const newPresets = PresetSwitcher.getAvailablePresets();
            
            // 更新下拉框
            const updateSelect = ($sel, currentVal) => {
                let html = `<option value="">-- 手动输入 --</option>`;
                newPresets.forEach(p => {
                    const isSel = p === currentVal ? 'selected' : '';
                    html += `<option value="${p}" ${isSel}>${p}</option>`;
                });
                $sel.html(html);
            };
            
            updateSelect($c.find('#dnd-cfg-combat-sel'), $c.find('#dnd-cfg-combat-input').val());
            updateSelect($c.find('#dnd-cfg-explore-sel'), $c.find('#dnd-cfg-explore-input').val());
            
            setTimeout(() => {
                $btn.html('<i class="fa-solid fa-sync"></i> 刷新预设列表').prop('disabled', false);
            }, 500);
        });
        
        // 绑定事件
        const $enabled = $c.find('#dnd-cfg-enabled');
        const $group = $c.find('.dnd-cfg-group');
        
        $enabled.on('change', function() {
            const checked = $(this).prop('checked');
            $group.css({ opacity: checked ? 1 : 0.5, pointerEvents: checked ? 'auto' : 'none' });
        });
        
        // 下拉框与输入框联动
        $c.find('#dnd-cfg-combat-sel').on('change', function() {
            if(this.value) $c.find('#dnd-cfg-combat-input').val(this.value);
        });
        $c.find('#dnd-cfg-explore-sel').on('change', function() {
            if(this.value) $c.find('#dnd-cfg-explore-input').val(this.value);
        });
        
        // 缩放实时预览
        $c.find('#dnd-set-ui-scale').on('input', function() {
            const val = $(this).val();
            $c.find('#dnd-scale-value').text(val);
            // 实时应用 (预览) - 直接调用模块方法确保生效
            UICore.applyUIScale(val);
        });

        // 重置缩放
        $c.find('#dnd-reset-scale').on('click', function() {
            const def = CONFIG.UI_SCALE.DEFAULT;
            $c.find('#dnd-set-ui-scale').val(def).trigger('input');
        });

        // 选项换行设置
        $c.find('#dnd-option-wrap').on('change', async function() {
            const checked = $(this).prop('checked');
            await DBAdapter.setSetting(CONFIG.STORAGE_KEYS.OPTION_WRAP, checked);
            NotificationSystem.notify(checked ? '已启用行动选项换行' : '已禁用行动选项换行', { type: 'success', duration: 2000 });
        });

        // 迷你地图显示设置
        $c.find('#dnd-show-mini-map').on('change', async function() {
            const checked = $(this).prop('checked');
            await DBAdapter.setSetting(CONFIG.STORAGE_KEYS.SHOW_MINI_MAP, checked);
            NotificationSystem.notify(checked ? '已显示迷你地图' : '已隐藏迷你地图', { type: 'success', duration: 2000 });
            
            // 如果当前在 mini 状态，立即重新渲染 HUD
            const { window: coreWin } = getCore();
            if (coreWin.DND_Dashboard_UI && coreWin.DND_Dashboard_UI.state === 'mini') {
                coreWin.DND_Dashboard_UI.renderHUD();
            }
        });

        // 隐藏浮动球设置
        $c.find('#dnd-hide-floating-ball').on('change', async function() {
            const checked = $(this).prop('checked');
            await DBAdapter.setSetting(CONFIG.STORAGE_KEYS.HIDE_FLOATING_BALL, checked);
            NotificationSystem.notify(checked ? '已隐藏浮动球' : '已显示浮动球', { type: 'success', duration: 2000 });
            
            // 立即应用设置
            const { window: coreWin } = getCore();
            if (coreWin.DND_Dashboard_UI) {
                coreWin.DND_Dashboard_UI.applyFloatingBallVisibility();
            }
        });

        // 骰子规则注入设置
        $c.find('#dnd-inject-dice-rules').on('change', async function() {
            const checked = $(this).prop('checked');
            await DiceRulesInjector.setEnabled(checked);
            NotificationSystem.notify(checked ? '已启用骰子规则注入' : '已禁用骰子规则注入', { type: 'success', duration: 2000 });
        });

        // 配色模板设置
        const $themePreset = $c.find('#dnd-theme-preset');
        const $customColorEnabled = $c.find('#dnd-custom-color-enabled');
        const $customColorPanel = $c.find('#dnd-custom-color-panel');
        
        // 预设主题切换
        $themePreset.on('change', function() {
            const themeId = $(this).val();
            if (themeId && themeId !== 'custom') {
                ThemeManager.apply(themeId);
                $customColorEnabled.prop('checked', false);
                $customColorPanel.css({ opacity: 0.5, pointerEvents: 'none' });
                
                // 更新颜色选择器显示
                const editableVars = ThemeManager.getEditableVars();
                Object.entries(editableVars).forEach(([key, info]) => {
                    $c.find(`.dnd-color-picker[data-var="${key}"]`).val(info.value.substring(0, 7));
                });
            }
        });
        
        // 启用/禁用自定义配色
        $customColorEnabled.on('change', function() {
            const checked = $(this).prop('checked');
            $customColorPanel.css({ opacity: checked ? 1 : 0.5, pointerEvents: checked ? 'auto' : 'none' });
            
            if (checked) {
                // 收集当前颜色值并应用
                const customVars = {};
                $c.find('.dnd-color-picker').each(function() {
                    const varName = $(this).data('var');
                    const value = $(this).val();
                    customVars[varName] = value;
                });
                ThemeManager.applyCustom(customVars);
                $themePreset.val('custom');
            } else {
                // 恢复到预设主题
                const selectedPreset = $themePreset.val();
                if (selectedPreset && selectedPreset !== 'custom') {
                    ThemeManager.apply(selectedPreset);
                } else {
                    ThemeManager.apply('dark');
                    $themePreset.val('dark');
                }
            }
        });
        
        // 颜色选择器实时预览
        $c.find('.dnd-color-picker').on('input', function() {
            if (!$customColorEnabled.prop('checked')) return;
            
            const customVars = {};
            $c.find('.dnd-color-picker').each(function() {
                const varName = $(this).data('var');
                const value = $(this).val();
                customVars[varName] = value;
            });
            ThemeManager.applyCustom(customVars);
        });
        
        // 重置为默认配色
        $c.find('#dnd-color-reset').on('click', function() {
            const defaultVars = ThemeManager.COLOR_VARS;
            Object.entries(defaultVars).forEach(([key, info]) => {
                $c.find(`.dnd-color-picker[data-var="${key}"]`).val(info.default);
            });
            
            if ($customColorEnabled.prop('checked')) {
                const customVars = {};
                $c.find('.dnd-color-picker').each(function() {
                    customVars[$(this).data('var')] = $(this).val();
                });
                ThemeManager.applyCustom(customVars);
            }
        });
        
        // 导出配色
        $c.find('#dnd-color-export').on('click', function() {
            const customVars = {};
            $c.find('.dnd-color-picker').each(function() {
                customVars[$(this).data('var')] = $(this).val();
            });
            
            const dataStr = JSON.stringify(customVars, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dnd_custom_theme.json';
            a.click();
            URL.revokeObjectURL(url);
            
            NotificationSystem.success('配色方案已导出');
        });
        
        // 导入配色
        $c.find('#dnd-color-import').on('click', function() {
            $c.find('#dnd-color-import-input').click();
        });
        
        $c.find('#dnd-color-import-input').on('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const imported = JSON.parse(evt.target.result);
                    
                    // 应用导入的配色
                    Object.entries(imported).forEach(([key, value]) => {
                        const $picker = $c.find(`.dnd-color-picker[data-var="${key}"]`);
                        if ($picker.length) {
                            $picker.val(value);
                        }
                    });
                    
                    // 启用自定义配色
                    $customColorEnabled.prop('checked', true);
                    $customColorPanel.css({ opacity: 1, pointerEvents: 'auto' });
                    $themePreset.val('custom');
                    
                    // 应用配色
                    ThemeManager.applyCustom(imported);
                    
                    NotificationSystem.success('配色方案已导入');
                } catch(err) {
                    NotificationSystem.error('导入失败: 无效的配色文件');
                    Logger.error('Failed to import theme:', err);
                }
            };
            reader.readAsText(file);
            
            // 清空 input 以便再次选择同一文件
            $(this).val('');
        });

        // ========== 风格管理事件 ==========
        
        // 风格卡片点击
        $c.find('.dnd-style-card').on('click', async function() {
            const styleId = $(this).data('style-id');
            if (styleId === StyleManager.currentStyleId) return;
            
            const success = await StyleManager.apply(styleId);
            if (success) {
                // 更新卡片状态
                $c.find('.dnd-style-card').each(function() {
                    const id = $(this).data('style-id');
                    const isActive = id === styleId;
                    $(this)
                        .toggleClass('active', isActive)
                        .css({
                            background: isActive ? 'var(--dnd-selected-bg)' : 'var(--dnd-bg-card)',
                            borderColor: isActive ? 'var(--dnd-border-gold)' : 'var(--dnd-border-subtle)'
                        })
                        .find('div:first').nextAll('div:first').css({
                            color: isActive ? 'var(--dnd-text-highlight)' : 'var(--dnd-text-main)'
                        });
                });
                
                // 更新当前风格显示
                const currentStyle = StyleManager.getCurrentStyle();
                $c.find('.dnd-style-card.active').closest('div').prev().find('span:first').html(currentStyle.icon || ICONS.PALETTE);
                
                NotificationSystem.success(`已切换至 "${currentStyle.name}" 风格`);
                
                // 刷新设置面板以更新显示
                setTimeout(() => {
                    UICore.renderPanel('settings');
                }, 300);
            }
        });
        
        // 风格卡片悬停效果
        $c.find('.dnd-style-card').on('mouseenter', function() {
            if (!$(this).hasClass('active')) {
                $(this).css({
                    borderColor: 'var(--dnd-border-gold)',
                    transform: 'translateY(-2px)'
                });
            }
        }).on('mouseleave', function() {
            if (!$(this).hasClass('active')) {
                $(this).css({
                    borderColor: 'var(--dnd-border-subtle)',
                    transform: 'translateY(0)'
                });
            }
        });
        
        // 导入风格包
        $c.find('#dnd-style-import').on('click', function() {
            $c.find('#dnd-style-import-input').click();
        });
        
        $c.find('#dnd-style-import-input').on('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const result = await StyleManager.importFromFile(file);
                if (result.success) {
                    NotificationSystem.success(result.message);
                    if (result.warnings && result.warnings.length > 0) {
                        Logger.info('风格导入警告:', result.warnings);
                    }
                    // 刷新设置面板
                    setTimeout(() => {
                        UICore.renderPanel('settings');
                    }, 300);
                } else {
                    NotificationSystem.error(result.message);
                }
            } catch (err) {
                NotificationSystem.error('导入失败: ' + err.message);
                Logger.error('风格导入错误:', err);
            }
            
            // 清空 input
            $(this).val('');
        });
        
        // 导出当前风格
        $c.find('#dnd-style-export').on('click', function() {
            const success = StyleManager.downloadStyle();
            if (success) {
                NotificationSystem.success('风格包已导出');
            } else {
                NotificationSystem.error('导出失败');
            }
        });
        
        // 恢复默认风格
        $c.find('#dnd-style-reset').on('click', async function() {
            const result = await StyleManager.resetToDefault();
            if (result.success) {
                NotificationSystem.success('已恢复默认风格');
                // 刷新设置面板
                setTimeout(() => {
                    UICore.renderPanel('settings');
                }, 300);
            }
        });

        // 动态背景设置
        const $bgEnabled = $c.find('#dnd-bg-enabled');
        const $bgGroup = $c.find('.dnd-bg-group');
        const $bgPreview = $c.find('#dnd-bg-preview');
        let previewBgId = null;

        // 启用/禁用动态背景
        $bgEnabled.on('change', function() {
            const checked = $(this).prop('checked');
            $bgGroup.css({ opacity: checked ? 1 : 0.5, pointerEvents: checked ? 'auto' : 'none' });
            
            // 更新运行时配置
            CONFIG.DYNAMIC_BG.enabled = checked;
            
            // 实时应用: 销毁或重新初始化背景
            if (checked) {
                UICore._initDynamicBackground(UICore.state === 'full' ? 'full' : 'mini');
            } else {
                UICore._destroyDynamicBackgrounds();
            }
        });

        // 背景效果类型切换
        $c.find('#dnd-bg-type').on('change', function() {
            const effectType = $(this).val();
            CONFIG.DYNAMIC_BG.type = effectType;
            
            // 更新预览
            if (previewBgId) {
                DynamicBackground.destroy(previewBgId);
            }
            previewBgId = DynamicBackground.init($bgPreview[0], effectType, {
                intensity: parseFloat($c.find('#dnd-bg-intensity').val())
            });
            
            // 实时应用到主界面
            if ($bgEnabled.prop('checked')) {
                UICore.switchDynamicBgEffect(effectType);
            }
        });

        // 效果强度调整
        $c.find('#dnd-bg-intensity').on('input', function() {
            const val = parseFloat($(this).val());
            $c.find('#dnd-bg-intensity-value').text(val.toFixed(1));
            CONFIG.DYNAMIC_BG.intensity = val;
            
            // 更新预览 (重新初始化以应用强度)
            const effectType = $c.find('#dnd-bg-type').val();
            if (previewBgId) {
                DynamicBackground.destroy(previewBgId);
            }
            previewBgId = DynamicBackground.init($bgPreview[0], effectType, { intensity: val });
        });

        // 初始化预览
        if ($bgEnabled.prop('checked')) {
            previewBgId = DynamicBackground.init($bgPreview[0], $c.find('#dnd-bg-type').val(), {
                intensity: parseFloat($c.find('#dnd-bg-intensity').val())
            });
        }

        // 保存
        $c.find('#dnd-cfg-save').on('click', async function(e) {
            if(e) e.preventDefault();
            
            // 0. 保存缩放设置
            const scaleVal = $c.find('#dnd-set-ui-scale').val();
            await safeSave(CONFIG.STORAGE_KEYS.UI_SCALE, scaleVal);

            // 0.1 保存界面显示开关
            await safeSave(CONFIG.STORAGE_KEYS.OPTION_WRAP, $c.find('#dnd-option-wrap').prop('checked'));
            await safeSave(CONFIG.STORAGE_KEYS.SHOW_MINI_MAP, $c.find('#dnd-show-mini-map').prop('checked'));
            await safeSave(CONFIG.STORAGE_KEYS.HIDE_FLOATING_BALL, $c.find('#dnd-hide-floating-ball').prop('checked'));
            await safeSave(CONFIG.STORAGE_KEYS.INJECT_DICE_RULES, $c.find('#dnd-inject-dice-rules').prop('checked'));

            // 0.5 保存配色设置
            if ($customColorEnabled.prop('checked')) {
                const customVars = {};
                $c.find('.dnd-color-picker').each(function() {
                    customVars[$(this).data('var')] = $(this).val();
                });
                await ThemeManager.saveCustom(customVars);
            } else {
                const themeId = $themePreset.val();
                await safeSave(CONFIG.STORAGE_KEYS.THEME, themeId);
            }

            // 1. 保存动态背景配置
            const newBgConfig = {
                enabled: $bgEnabled.prop('checked'),
                type: $c.find('#dnd-bg-type').val(),
                intensity: parseFloat($c.find('#dnd-bg-intensity').val())
            };
            Object.assign(CONFIG.DYNAMIC_BG, newBgConfig);
            await safeSave(CONFIG.STORAGE_KEYS.DYNAMIC_BG, JSON.stringify(newBgConfig));

            // 2. 保存预设配置
            const newConfig = {
                ENABLED: $enabled.prop('checked'),
                COMBAT_PRESET: $c.find('#dnd-cfg-combat-input').val().trim(),
                EXPLORE_PRESET: $c.find('#dnd-cfg-explore-input').val().trim()
            };
            
            Object.assign(CONFIG.PRESET_SWITCHING, newConfig);
            await safeSave(CONFIG.STORAGE_KEYS.PRESET_CONFIG, newConfig);
            
            // 3. 保存 API 配置
            const selectedProvider = $c.find('#dnd-ai-provider').val();
            if (selectedProvider === 'database' && !TavernAPI.getDatabaseAIStatus().available) {
                NotificationSystem.error('当前数据库插件未提供 callAI() 接口，请先更新数据库插件后再切换到神数据库 AI。');
                return;
            }

            const newApiConfig = {
                provider: selectedProvider,
                url: $c.find('#dnd-set-api-url').val().trim(),
                key: $c.find('#dnd-set-api-key').val().trim(),
                model: $c.find('#dnd-set-api-model').val().trim()
            };
            await SettingsManager.setAPIConfig(newApiConfig);

            // 4. 保存表格管理配置
            const tmCols = $c.find('#dnd-tm-cols-setting').val();
            await DBAdapter.setSetting('dnd_tm_cols', tmCols);
            
            const hiddenTbls = [];
            $c.find('.dnd-tm-visible-check:not(:checked)').each(function() {
                hiddenTbls.push($(this).val());
            });
            await DBAdapter.setSetting('dnd_tm_hidden_tables', JSON.stringify(hiddenTbls));
            
            // 通知全局更新
            $(document).trigger('dnd:settings-changed');
            await UICore.applyFloatingBallVisibility();

            // 视觉反馈
            const $btn = $(this);
            const originalText = $btn.html();
            $btn.html('<i class="fa-solid fa-check"></i> 已保存').prop('disabled', true);
            setTimeout(() => {
                $btn.html(originalText).prop('disabled', false);
            }, 1500);
            
            Logger.info('设置已更新:', newConfig, newApiConfig, newBgConfig);
            
            // 立即触发一次状态检查以应用新设置
            PresetSwitcher._lastCombatState = null; // 重置状态以强制触发
            const global = DataManager.getTable('SYS_GlobalState');
            if (global && global[0]) {
                PresetSwitcher.checkCombatStateChange(global[0]['战斗模式'] === '战斗中');
            }
        });

        // 清理预览背景 (当设置面板关闭时)
        // 注意: 这里假设面板关闭时会调用某种清理，否则可能需要额外机制
    }
};
