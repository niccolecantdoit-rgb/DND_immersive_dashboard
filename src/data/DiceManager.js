import { DataManager } from './DataManager.js';
import { getCore } from '../core/Utils.js';
import { UpdateController } from '../features/UpdateController.js';

export const DiceManager = {
    isRefilling: false,
    
    // 生成一行随机骰子数据 [null, ID, D4, D6, D8, D10, D12, D20, D100]
    generateRow: (id) => {
        const roll = (sides) => Math.floor(Math.random() * sides) + 1;
        // [修复] ID 必须转为字符串，否则核心库调用 startsWith 时会报错
        return [null, String(id), roll(4), roll(6), roll(8), roll(10), roll(12), roll(20), roll(100)];
    },

    // [修复] 确保数据格式符合标准 (参考自兼容性可视化表格 v9.0)
    ensureProperFormat: (data) => {
        if (!data) return data;
        
        // 如果已有 mate 且类型正确，直接返回
        if (data.mate && data.mate.type === 'chatSheets') {
            return data;
        }

        // 深拷贝以避免修改原引用
        const result = JSON.parse(JSON.stringify(data));
        
        // 检查是否包含 sheet_ 开头的键
        const hasSheets = Object.keys(result).some(key => key.startsWith('sheet_'));

        // 如果有 sheet 但没有 mate，补充 mate
        if (hasSheets && !result.mate) {
            result.mate = { 
                type: 'chatSheets', 
                version: 2,
                schema: 'DND5E_TextRPG',
                created: Date.now()
            };
        }
        // 如果连 sheet 都没有，可能需要更复杂的转换（暂时不处理这种情况，避免误操作）

        return result;
    },

    // 强力保存逻辑 (参考自兼容性可视化表格 v9.0)
    saveData: async (tableData) => {
        const api = DataManager.getAPI();
        
        // [修复] 在保存前确保格式正确
        const formattedData = DiceManager.ensureProperFormat(tableData);
        
        // 使用控制器包裹保存过程，防止死循环
        await UpdateController.runSilently(async () => {
            try {
                // 1. 尝试直接注入到 SillyTavern 聊天记录 (最高兼容性)
                let injectedDirectly = false;
                try {
                    const w = window.parent || window;
                    let ST = w.SillyTavern || (w.top ? w.top.SillyTavern : null);
                    
                    if (ST && ST.chat && ST.chat.length > 0) {
                        // 查找最新 AI 消息
                        let targetMsg = null;
                        for (let i = ST.chat.length - 1; i >= 0; i--) {
                            if (!ST.chat[i].is_user) {
                                targetMsg = ST.chat[i];
                                break;
                            }
                        }

                        if (targetMsg) {
                            // 注入到旧版字段 (确保兼容 V5/V6 脚本)
                            if (!targetMsg.TavernDB_ACU_Data) targetMsg.TavernDB_ACU_Data = {};
                            
                            // 注入到新版隔离字段 (如果存在)
                            // 这里简化处理，主要为了确保数据能写入
                            
                            // 执行保存
                            if (ST.saveChat) {
                                await ST.saveChat();
                                injectedDirectly = true;
                                console.log('[DND Dashboard] 已通过 ST.saveChat() 注入数据');
                            }
                        }
                    }
                } catch (err) {
                    console.warn('[DND Dashboard] 直接注入失败:', err);
                }

                // 2. 调用 API 触发刷新 (即使直接注入成功也调用，以触发 UI 更新)
                if (api && api.importTableAsJson) {
                    // 使用修复后的数据
                    await api.importTableAsJson(JSON.stringify(formattedData));
                    console.log('[DND Dashboard] 已调用 api.importTableAsJson');
                } else if (!injectedDirectly) {
                    console.error('[DND Dashboard] 无法保存数据：API 不可用且注入失败');
                }
            } catch (e) {
                console.error('[DND Dashboard] 保存过程异常:', e);
            }
        });
    },

    checkAndRefill: async () => {
        if (DiceManager.isRefilling) return;

        const api = DataManager.getAPI();
        if (!api || !api.exportTableAsJson) return;

        try {
            const rawData = api.exportTableAsJson();
            if (!rawData) return;
            
            let dataObj = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
            
            // 寻找骰子池表 (根据名称或 uid)
            let poolKey = Object.keys(dataObj).find(k => {
                const sheet = dataObj[k];
                return sheet.name && (sheet.name === '🎲 骰子池' || sheet.name.includes('骰子池'));
            });

            if (!poolKey) return;

            const sheet = dataObj[poolKey];
            if (!sheet.content) sheet.content = [];

            // 检查行数 (第0行是表头)
            // 如果少于 6 行可用骰子 (总行数 < 7)
            // 这里的阈值设为 6，意味着至少保持 6 个预备骰子
            if (sheet.content.length < 7) {
                console.log('[DND Dashboard] Dice pool low, refilling...');
                DiceManager.isRefilling = true;

                // 获取当前最大ID
                let maxId = 0;
                if (sheet.content.length > 1) {
                    // 遍历现有行找到最大ID，防止乱序
                    for (let i = 1; i < sheet.content.length; i++) {
                        const rowId = parseInt(sheet.content[i][1]);
                        if (!isNaN(rowId) && rowId > maxId) maxId = rowId;
                    }
                }

                // 补充到 20 行 (20个可用骰子 + 1个表头 = 21行)
                const targetRows = 21;
                const currentRows = sheet.content.length;
                const addCount = targetRows - currentRows;

                if (addCount > 0) {
                    for (let i = 0; i < addCount; i++) {
                        maxId++;
                        sheet.content.push(DiceManager.generateRow(maxId));
                    }

                    // 使用增强的保存函数
                    await DiceManager.saveData(dataObj);
                    
                    console.log(`[DND Dashboard] Added ${addCount} dice rows.`);
                    
                    // 显示通知
                    const { $ } = getCore();
                    if ($('#dnd-hud-status-text').length) {
                        // 临时显示状态
                        const $status = $('#dnd-hud-status-text');
                        const originalHtml = $status.html();
                        $status.html('<span style="color:var(--dnd-text-highlight);animation:dnd-pulse 1s infinite;"><i class="fa-solid fa-dice-d20"></i> 骰子池已自动补充</span>');
                        setTimeout(() => {
                            // 只有当内容没变时才恢复，防止覆盖了新的状态更新
                            if ($status.text().includes('骰子池已自动补充')) {
                                $status.html(originalHtml);
                            }
                        }, 3000);
                    }
                }
            }
        } catch (e) {
            console.error('[DND Dashboard] Failed to refill dice pool:', e);
        } finally {
            // 无论成功失败，都在冷却后重置标志
            // 增加冷却时间以确保安全
            setTimeout(() => {
                DiceManager.isRefilling = false;
            }, 3000);
        }
    }
};