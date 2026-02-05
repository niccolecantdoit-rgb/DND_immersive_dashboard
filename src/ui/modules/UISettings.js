import { getCore, safeSave } from '../../core/Utils.js';
import { Logger } from '../../core/Logger.js';
import { CONFIG } from '../../config/Config.js';
import { DBAdapter } from '../../core/DBAdapter.js';
import { DataManager } from '../../data/DataManager.js';
import { SettingsManager } from '../../core/SettingsManager.js';
import { PresetSwitcher } from '../../features/PresetSwitcher.js';
import { TavernAPI } from '../../core/TavernAPI.js';
import { NotificationSystem } from './UIUtils.js';
import UICore from './UICore.js';
import { DynamicBackground } from '../DynamicBackground.js';

export default {
    async renderSettingsPanel($c) {
        const { $ } = getCore();
        const config = CONFIG.PRESET_SWITCHING;
        const presets = PresetSwitcher.getAvailablePresets();
        const apiConfig = await SettingsManager.getAPIConfig();
        const syncStatus = await SettingsManager.getSyncStatus();
        const currentScale = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.UI_SCALE) || CONFIG.UI_SCALE.DEFAULT;
        
        // 获取动态背景配置
        const savedBgConfig = await DBAdapter.getSetting(CONFIG.STORAGE_KEYS.DYNAMIC_BG);
        const bgConfig = savedBgConfig ? JSON.parse(savedBgConfig) : CONFIG.DYNAMIC_BG;
        const bgEffects = DynamicBackground.getAvailableEffects();
        
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
                    ⚙️ 仪表盘设置
                </h2>

                <!-- 同步状态 -->
                <div style="background:rgba(0,0,0,0.3);padding:15px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
                    <div>
                        <div style="color:var(--dnd-text-header);font-weight:bold;margin-bottom:5px;">☁️ 云同步状态</div>
                        <div style="color:#888;font-size:12px;">配置将自动同步到酒馆服务器</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span id="dnd-sync-badge" class="dnd-badge dnd-badge-${syncStatus.statusClass}" style="padding:4px 8px;">${syncStatus.statusText}</span>
                        <button type="button" id="dnd-sync-force" style="background:transparent;border:1px solid #555;color:#ccc;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;" title="强制同步">🔄</button>
                    </div>
                </div>

                <!-- 界面显示设置 -->
                <div style="background:rgba(0,0,0,0.3);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">💻 界面显示</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        调整仪表盘和悬浮球的大小比例，适配不同分辨率的屏幕。
                    </p>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:flex;justify-content:space-between;margin-bottom:5px;color:var(--dnd-text-main);">
                            <span>缩放比例 (Scale)</span>
                            <span id="dnd-scale-value" style="color:var(--dnd-text-highlight);">${currentScale}</span>
                        </label>
                        <div style="display:flex;gap:10px;align-items:center;">
                            <input type="range" id="dnd-set-ui-scale"
                                min="${CONFIG.UI_SCALE.MIN}" max="${CONFIG.UI_SCALE.MAX}" step="${CONFIG.UI_SCALE.STEP}" value="${currentScale}"
                                style="flex:1;cursor:pointer;">
                            <button type="button" id="dnd-reset-scale" style="padding:4px 8px;background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer;font-size:12px;">重置</button>
                        </div>
                    </div>
                </div>

                <!-- 动态背景设置 -->
                <div style="background:rgba(0,0,0,0.3);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">✨ 动态背景</h3>
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
                            <select id="dnd-bg-type" style="width:100%;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                                ${bgEffects.map(e => `<option value="${e.id}" ${e.id === bgConfig.type ? 'selected' : ''}>${e.icon || '✨'} ${e.name}</option>`).join('')}
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
                <div style="background:rgba(0,0,0,0.3);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);margin-bottom:20px;">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">🔌 API 连接配置</h3>
                    <p style="color:#888;font-size:13px;margin-bottom:15px;">
                        配置 OpenAI 兼容 API，用于角色生成和地图绘制。
                    </p>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">API 地址 (URL)</label>
                        <input type="text" id="dnd-set-api-url" value="${apiConfig.url || ''}" placeholder="https://api.openai.com/v1" style="width:100%;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">API 密钥 (Key)</label>
                        <input type="password" id="dnd-set-api-key" value="${apiConfig.key || ''}" placeholder="sk-..." style="width:100%;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">模型名称 (Model)</label>
                        <div style="display:flex;gap:10px;">
                            <input type="text" id="dnd-set-api-model" value="${apiConfig.model || ''}" placeholder="gpt-3.5-turbo" style="flex:1;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                            <button type="button" id="dnd-set-fetch-models" style="padding:0 15px;background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer;">获取列表</button>
                        </div>
                        <!-- 模型下拉列表容器 -->
                        <div id="dnd-model-list-container" style="display:none;margin-top:5px;">
                            <select id="dnd-set-model-select" style="width:100%;background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;">
                                <option value="">-- 选择模型 --</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div style="background:rgba(0,0,0,0.3);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);">
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
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">⚔️ 战斗状态预设</label>
                            <div style="display:flex;gap:10px;">
                                <select id="dnd-cfg-combat-sel" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;flex:1;">
                                    ${buildOptions(config.COMBAT_PRESET)}
                                </select>
                                <input type="text" id="dnd-cfg-combat-input" value="${config.COMBAT_PRESET}" placeholder="预设名称" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;flex:1;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block;margin-bottom:5px;color:var(--dnd-text-main);">🧭 探索状态预设</label>
                            <div style="display:flex;gap:10px;">
                                <select id="dnd-cfg-explore-sel" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;flex:1;">
                                    ${buildOptions(config.EXPLORE_PRESET)}
                                </select>
                                <input type="text" id="dnd-cfg-explore-input" value="${config.EXPLORE_PRESET}" placeholder="预设名称" style="background:#1a1a1c;border:1px solid #444;color:#ccc;padding:8px;border-radius:4px;flex:1;">
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
                        ">🔄 刷新预设列表</button>
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
                        ">💾 保存设置</button>
                    </div>
                </div>

                <!-- 存储诊断工具 -->
                <div style="margin-top:20px;background:rgba(0,0,0,0.3);padding:20px;border-radius:6px;border:1px solid var(--dnd-border-inner);">
                    <h3 style="color:var(--dnd-text-header);margin-top:0;">💾 存储空间管理</h3>
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
                        ">🔍 检查存储使用量</button>
                        
                        <button type="button" id="dnd-clear-avatars" class="dnd-clickable" style="
                            background:rgba(231, 76, 60, 0.2);
                            border:1px solid #e74c3c;
                            color:#e74c3c;
                            padding:8px 15px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:13px;
                        ">🗑️ 清理头像缓存</button>
                        
                        <button type="button" id="dnd-clear-maps" class="dnd-clickable" style="
                            background:rgba(231, 76, 60, 0.2);
                            border:1px solid #e74c3c;
                            color:#e74c3c;
                            padding:8px 15px;
                            border-radius:4px;
                            cursor:pointer;
                            font-size:13px;
                        ">🗺️ 清理地图缓存</button>
                    </div>
                </div>
                
                <div style="margin-top:20px;padding:15px;background:rgba(197, 160, 89, 0.1);border-left:3px solid var(--dnd-border-gold);border-radius:4px;">
                    <div style="font-weight:bold;color:var(--dnd-text-highlight);margin-bottom:5px;">💡 提示</div>
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
            $c.find('#dnd-sync-badge').text('🔄 同步中...');
            
            await SettingsManager.forceSync();
            
            // 刷新状态
            const newStatus = await SettingsManager.getSyncStatus();
            $c.find('#dnd-sync-badge')
                .removeClass('dnd-badge-success dnd-badge-warning dnd-badge-error')
                .addClass(`dnd-badge-${newStatus.statusClass}`)
                .text(newStatus.statusText);
                
            $btn.prop('disabled', false).css('opacity', 1);
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
                $btn.text('🔄 刷新预设列表').prop('disabled', false);
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
            safeSave(CONFIG.STORAGE_KEYS.UI_SCALE, scaleVal);

            // 1. 保存动态背景配置
            const newBgConfig = {
                enabled: $bgEnabled.prop('checked'),
                type: $c.find('#dnd-bg-type').val(),
                intensity: parseFloat($c.find('#dnd-bg-intensity').val())
            };
            Object.assign(CONFIG.DYNAMIC_BG, newBgConfig);
            safeSave(CONFIG.STORAGE_KEYS.DYNAMIC_BG, JSON.stringify(newBgConfig));

            // 2. 保存预设配置
            const newConfig = {
                ENABLED: $enabled.prop('checked'),
                COMBAT_PRESET: $c.find('#dnd-cfg-combat-input').val().trim(),
                EXPLORE_PRESET: $c.find('#dnd-cfg-explore-input').val().trim()
            };
            
            Object.assign(CONFIG.PRESET_SWITCHING, newConfig);
            safeSave(CONFIG.STORAGE_KEYS.PRESET_CONFIG, newConfig);
            
            // 3. 保存 API 配置
            const newApiConfig = {
                url: $c.find('#dnd-set-api-url').val().trim(),
                key: $c.find('#dnd-set-api-key').val().trim(),
                model: $c.find('#dnd-set-api-model').val().trim()
            };
            await SettingsManager.setAPIConfig(newApiConfig);

            // 视觉反馈
            const $btn = $(this);
            const originalText = $btn.html();
            $btn.html('✅ 已保存').prop('disabled', true);
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
