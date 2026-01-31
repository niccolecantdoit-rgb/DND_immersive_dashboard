// src/data/ItemManager.js
import { DataManager } from './DataManager.js';
import { DiceManager } from './DiceManager.js';

export const ItemManager = {
    update: async (itemId, changes, notificationText = null) => {
        const api = DataManager.getAPI();
        const items = DataManager.getTable('ITEM_Inventory');
        if (!items) return;
        
        // 查找索引
        let itemIndex = -1;
        const targetItem = items.find((item, index) => {
            if ((item['物品ID'] === itemId) || (item['物品名称'] === itemId)) {
                itemIndex = index;
                return true;
            }
            return false;
        });
        
        if (itemIndex === -1) {
            console.error('[DND ItemManager] Item not found:', itemId);
            return;
        }
        
        // 获取原始数据结构
        const rawData = DataManager.getAllData();
        let sheetKey = Object.keys(rawData).find(k => k.includes('ITEM_Inventory') || (rawData[k].name && rawData[k].name.includes('背包')));
        
        if (!sheetKey) return;
        
        const sheet = rawData[sheetKey];
        const headers = sheet.content[0];
        
        // itemIndex 对应的是 items 数组的索引，对应 sheet.content 的索引需要 +1 (因为有表头)
        const rowIndex = itemIndex + 1;
        
        // 应用变更
        Object.keys(changes).forEach(key => {
            const colIndex = headers.indexOf(key);
            if (colIndex !== -1) {
                sheet.content[rowIndex][colIndex] = changes[key];
            }
        });
        
        // 如果数量 <= 0，删除该行
        if (changes['数量'] !== undefined && changes['数量'] <= 0) {
            sheet.content.splice(rowIndex, 1);
        }

        // [新增] 如果有通知文本，写入全局状态表
        if (notificationText) {
            DataManager.applySystemNotification(rawData, notificationText);
        }
        
        // 保存
        await DiceManager.saveData(rawData);
    }
};
