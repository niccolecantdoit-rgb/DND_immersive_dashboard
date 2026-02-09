// src/data/DataManager.js
import { getCore } from '../core/Utils.js';
import { DiceManager } from './DiceManager.js';

export const DataManager = {
    // [新增] 查找表键名 (模糊匹配)
    findTableKey: (rawData, nameFragment) => {
        if (!rawData) return null;
        return Object.keys(rawData).find(k =>
            k === nameFragment ||
            k.includes(nameFragment) ||
            (rawData[k].name && rawData[k].name.includes(nameFragment))
        );
    },

    // [新增] 在数据对象中应用系统通知 (不立即保存)
    applySystemNotification: (rawData, text) => {
        if (!rawData) return;
        let sheetKey = Object.keys(rawData).find(k => k.includes('SYS_GlobalState') || (rawData[k].name && rawData[k].name.includes('全局状态')));
        if (!sheetKey) return;
        
        const sheet = rawData[sheetKey];
        if (!sheet.content || sheet.content.length < 2) return;
        
        // 查找或创建 '系统通知' 列
        let colIndex = sheet.content[0].indexOf('系统通知');
        if (colIndex === -1) {
            sheet.content[0].push('系统通知');
            colIndex = sheet.content[0].length - 1;
            // 确保数据行有足够的列
            if (sheet.content[1].length <= colIndex) {
                sheet.content[1][colIndex] = null;
            }
        }
        
        // 写入文本
        sheet.content[1][colIndex] = text;
    },

    // [新增] 独立的设置通知函数 (立即保存)
    setSystemNotification: async (text) => {
        const rawData = DataManager.getAllData();
        DataManager.applySystemNotification(rawData, text);
        await DiceManager.saveData(rawData);
    },

    getAPI: () => getCore().getDB(),
    
    // 增加一个辅助获取 Core 的方法，供其他模块使用（如 DiceManager）
    getCore: getCore,

    // 通用解析器：支持 JSON 和自定义字符串格式
    parseValue: (val, type = 'json') => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        
        // 字符串格式解析 (优先尝试字符串解析)
        if (typeof val === 'string') {
            // 如果看起来像 JSON，尝试 JSON 解析 (为了兼容旧数据)
            if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(val);
                    if (parsed && typeof parsed === 'object') return parsed;
                } catch (e) {}
            }

            if (type === 'stats') {
                // 格式: STR:16|DEX:14 或 json
                const stats = {};
                // 处理 JSON 字符串格式: {"STR":16,...}
                if (val.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed) return parsed;
                    } catch(e) {}
                }
                
                // 处理自定义字符串格式
                val.split('|').forEach(part => {
                    const [k, v] = part.split(':');
                    if (k && v) stats[k.trim()] = isNaN(v) ? v : parseInt(v);
                });
                return Object.keys(stats).length > 0 ? stats : null;
            }
            if (type === 'coord') {
                // 格式: 7,13 -> {x:7, y:13}
                // 或者: x:7,y:13
                // 或者: {"x":7, "y":13}
                if (val.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed) return parsed;
                    } catch(e) {}
                }

                if (val.includes(':') && !val.includes('{')) {
                    const pos = {};
                    val.split(',').forEach(p => {
                        const [k, v] = p.split(':');
                        if (k && v) pos[k.trim()] = parseFloat(v);
                    });
                    return pos;
                }
                const parts = val.split(',');
                if (parts.length >= 2) return { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
            }
            if (type === 'size') {
                // 格式: 2,2 -> {w:2, h:2}
                // 或者: {"w":2, "h":2}
                if (val.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed) return parsed;
                    } catch(e) {}
                }

                const parts = val.split(',');
                if (parts.length >= 2) return { w: parseFloat(parts[0]), h: parseFloat(parts[1]) };
            }
            if (type === 'resources') {
                // 格式: 1级:3/4|2级:2/3
                // 或者: {"1级":"3/4",...}
                if (val.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed) return parsed;
                    } catch(e) {}
                }

                const res = {};
                val.split('|').forEach(part => {
                    const [k, v] = part.split(':');
                    if (k && v) res[k.trim()] = v.trim();
                });
                return Object.keys(res).length > 0 ? res : null;
            }
        }
        return null;
    },
    
    getAllData: () => {
        const api = DataManager.getAPI();
        if (!api || !api.exportTableAsJson) return null;
        const raw = api.exportTableAsJson();
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    },

    parseSheet: (sheet) => {
        if (!sheet || !sheet.content || sheet.content.length < 2) return [];
        const headers = sheet.content[0];
        const rows = sheet.content.slice(1);
        
        return rows.map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                if (h) obj[h] = row[i];
            });
            return obj;
        });
    },

    getTable: (tableNameFragment) => {
        const data = DataManager.getAllData();
        if (!data) return null;
        
        const key = Object.keys(data).find(k => k.includes(tableNameFragment) || (data[k].name && data[k].name.includes(tableNameFragment)));
        if (!key) return null;
        
        return DataManager.parseSheet(data[key]);
    },

    getPartyData: () => {
        const charReg = DataManager.getTable('CHARACTER_Registry');
        const charAttr = DataManager.getTable('CHARACTER_Attributes');
        const charRes = DataManager.getTable('CHARACTER_Resources');
        
        if (!charReg) return [];

        const party = [];

        charReg.forEach(char => {
            const charId = char['CHAR_ID'];
            const attr = charAttr ? charAttr.find(a => a['CHAR_ID'] === charId) : {};
            const res = charRes ? charRes.find(r => r['CHAR_ID'] === charId) : {};
            
            const type = char['成员类型'] === '主角' ? 'PC' : 'NPC';
            const isPC = type === 'PC';
            
            // 合并数据
            const merged = { ...char, ...attr, ...res, type, isPC };
            party.push(merged);
        });

        return party;
    },

    getCharacterSkills: (charId) => {
        const links = DataManager.getTable('CHARACTER_Skills');
        const library = DataManager.getTable('SKILL_Library');
        
        if (!links || !library) return [];

        // 兼容：尝试通过 ID 查找，或者通过名称查找
        let charLinks = links.filter(l => l['CHAR_ID'] === charId);
        
        // 如果按 ID 没找到，尝试按姓名
        if (charLinks.length === 0) {
             const party = DataManager.getPartyData();
             const char = party.find(p => p['姓名'] === charId);
             if (char) {
                 const realId = char['CHAR_ID'];
                 charLinks = links.filter(l => l['CHAR_ID'] === realId);
             }
        }
        
        return charLinks.map(link => {
            const skill = library.find(s => s['SKILL_ID'] === link['SKILL_ID']);
            return { ...link, ...skill };
        });
    },

    getCharacterFeats: (charId) => {
        const links = DataManager.getTable('CHARACTER_Feats');
        const library = DataManager.getTable('FEAT_Library');
        
        if (!links || !library) return [];

        let charLinks = links.filter(l => l['CHAR_ID'] === charId);
        
        if (charLinks.length === 0) {
             const party = DataManager.getPartyData();
             const char = party.find(p => p['姓名'] === charId);
             if (char) {
                 const realId = char['CHAR_ID'];
                 charLinks = links.filter(l => l['CHAR_ID'] === realId);
             }
        }
        
        return charLinks.map(link => {
            const feat = library.find(f => f['FEAT_ID'] === link['FEAT_ID']);
            return { ...link, ...feat };
        });
    },

    // [新增] 获取已知法术 (从技能库合成)
    getKnownSpells: (charId) => {
        // 如果未提供 ID，尝试查找主角
        if (!charId) {
            const party = DataManager.getPartyData();
            const pc = party.find(p => p.isPC);
            if (pc) charId = pc['CHAR_ID'];
        }
        
        if (!charId) return [];

        const links = DataManager.getTable('CHARACTER_Skills');
        const library = DataManager.getTable('SKILL_Library');
        
        if (!links || !library) return [];

        // 筛选该角色的技能关联
        let charLinks = links.filter(l => l['CHAR_ID'] === charId);
        
        if (charLinks.length === 0) {
             const party = DataManager.getPartyData();
             const char = party.find(p => p['姓名'] === charId);
             if (char) {
                 const realId = char['CHAR_ID'];
                 charLinks = links.filter(l => l['CHAR_ID'] === realId);
             }
        }
        
        const spells = [];
        charLinks.forEach(link => {
            const skill = library.find(s => s['SKILL_ID'] === link['SKILL_ID']);
            // 判断是否为法术 (仅当技能类型明确为'法术'时)
            // [修复] 移除对环阶的宽松判断，防止 '武技' 被误判为法术
            if (skill && skill['技能类型'] === '法术') {
                spells.push({
                    ...skill,
                    ...link,
                    '法术名称': skill['技能名称'], // 兼容旧字段名
                    '已准备': link['已准备']
                });
            }
        });
        
        return spells;
    },

    getMaxSpellSlotLevel: (char) => {
        if (!char || !char['法术位']) return 9; // 默认9以防万一
        const slots = DataManager.parseValue(char['法术位'], 'resources');
        if (!slots) return 0;
        
        let maxLevel = 0;
        Object.keys(slots).forEach(k => {
            // k 通常是 "1级", "2级" 等
            let lvl = parseInt(k);
            if (isNaN(lvl)) {
                const m = k.match(/(\d+)/);
                if (m) lvl = parseInt(m[1]);
            }
            
            if (!isNaN(lvl) && lvl > maxLevel) {
                // 检查是否有该环阶的槽位上限 (max > 0)
                const valStr = slots[k].toString();
                const parts = valStr.split('/');
                // 格式: 当前/最大
                if (parts.length >= 2) {
                    const maxSlots = parseInt(parts[1]);
                    if (!isNaN(maxSlots) && maxSlots > 0) {
                        maxLevel = lvl;
                    }
                } else {
                    // 如果只有数字，假设是数量? 或者是 "3" (当前3)?
                    // 保守起见，如果存在key且解析正常，就认为拥有
                    maxLevel = lvl;
                }
            }
        });
        return maxLevel;
    },

    // [新增] 导出队伍数据为 JSON (支持选择性导出)
    // @param selectedCharIds - 可选，要导出的角色ID数组。如果为空则导出全部
    exportPartyData: (selectedCharIds = null) => {
        const party = DataManager.getPartyData();
        if (!party || party.length === 0) {
            console.warn('[DND DataManager] 无队伍数据可导出');
            return null;
        }

        // 如果指定了角色ID列表，则过滤
        let exportParty = party;
        if (selectedCharIds && Array.isArray(selectedCharIds) && selectedCharIds.length > 0) {
            exportParty = party.filter(char => {
                const charId = char['CHAR_ID'] || char['PC_ID'] || char['姓名'];
                return selectedCharIds.includes(charId);
            });
        }

        if (exportParty.length === 0) {
            console.warn('[DND DataManager] 没有选中任何角色');
            return null;
        }

        const exportData = {
            version: '1.1',
            exportDate: new Date().toISOString(),
            exportSource: 'DND_Dashboard_Immersive',
            party: [],
            skills: {},
            feats: {},
            spells: {}
        };

        exportParty.forEach(char => {
            const charId = char['CHAR_ID'] || char['PC_ID'] || char['姓名'];
            
            // 添加角色基础数据
            exportData.party.push({ ...char });
            
            // 获取技能数据
            const skills = DataManager.getCharacterSkills(charId);
            if (skills && skills.length > 0) {
                exportData.skills[charId] = skills;
            }
            
            // 获取专长数据
            const feats = DataManager.getCharacterFeats(charId);
            if (feats && feats.length > 0) {
                exportData.feats[charId] = feats;
            }
            
            // 获取法术数据
            const spells = DataManager.getKnownSpells(charId);
            if (spells && spells.length > 0) {
                exportData.spells[charId] = spells;
            }
        });

        return exportData;
    },

    // [新增] 导入队伍数据
    // @param jsonData - 导入的数据
    // @param options - 导入选项
    //   - mode: 'append' (追加，默认) 或 'replace' (替换当前队伍)
    //   - selectedCharIds: 可选，要导入的角色ID数组。如果为空则导入全部
    importPartyData: async (jsonData, options = {}) => {
        try {
            const { mode = 'append', selectedCharIds = null } = options;

            // 验证数据格式
            if (!jsonData || !jsonData.party || !Array.isArray(jsonData.party)) {
                return { success: false, message: '无效的数据格式' };
            }

            // 过滤要导入的角色
            let partyToImport = jsonData.party;
            if (selectedCharIds && Array.isArray(selectedCharIds) && selectedCharIds.length > 0) {
                partyToImport = jsonData.party.filter(char => {
                    const charId = char['CHAR_ID'] || char['PC_ID'] || char['姓名'];
                    return selectedCharIds.includes(charId);
                });
            }

            if (partyToImport.length === 0) {
                return { success: false, message: '没有选中任何角色' };
            }

            // 同样过滤关联数据
            const filteredSkills = {};
            const filteredFeats = {};
            const filteredSpells = {};
            
            if (selectedCharIds && selectedCharIds.length > 0) {
                selectedCharIds.forEach(charId => {
                    if (jsonData.skills && jsonData.skills[charId]) {
                        filteredSkills[charId] = jsonData.skills[charId];
                    }
                    if (jsonData.feats && jsonData.feats[charId]) {
                        filteredFeats[charId] = jsonData.feats[charId];
                    }
                    if (jsonData.spells && jsonData.spells[charId]) {
                        filteredSpells[charId] = jsonData.spells[charId];
                    }
                });
            } else {
                Object.assign(filteredSkills, jsonData.skills || {});
                Object.assign(filteredFeats, jsonData.feats || {});
                Object.assign(filteredSpells, jsonData.spells || {});
            }

            const rawData = DataManager.getAllData();
            if (!rawData) return { success: false, message: '无法读取数据库' };

            // 如果是替换模式，先清空现有队伍数据
            if (mode === 'replace') {
                const clearTable = (tableNameFragment) => {
                    const tableKey = DataManager.findTableKey(rawData, tableNameFragment);
                    if (!tableKey) return;
                    const sheet = rawData[tableKey];
                    if (!sheet || !sheet.content || sheet.content.length < 1) return;
                    // 保留表头，清空数据行
                    sheet.content = [sheet.content[0]];
                };
                
                // 清空角色相关表
                clearTable('CHARACTER_Registry');
                clearTable('CHARACTER_Attributes');
                clearTable('CHARACTER_Resources');
                clearTable('CHARACTER_Skills');
                clearTable('CHARACTER_Feats');
            }

            // 辅助函数：处理单个表的更新/插入
            const processTable = (tableNameFragment, dataList) => {
                const tableKey = DataManager.findTableKey(rawData, tableNameFragment);
                if (!tableKey) return;
                
                const sheet = rawData[tableKey];
                if (!sheet || !sheet.content || sheet.content.length < 1) return;
                
                const headers = sheet.content[0];
                // 尝试找到 ID 列 (CHAR_ID 或 PC_ID 或 姓名)
                let idColName = 'CHAR_ID';
                if (headers.includes('PC_ID')) idColName = 'PC_ID';
                else if (headers.includes('姓名') && !headers.includes('CHAR_ID')) idColName = '姓名';
                
                const idIdx = headers.indexOf(idColName);
                if (idIdx === -1) return;

                dataList.forEach(item => {
                    // 确定该条目的 ID
                    const itemId = item[idColName] || item['CHAR_ID'] || item['姓名'];
                    if (!itemId) return;

                    // 在表中查找对应行
                    let rowIdx = -1;
                    // 跳过表头
                    for (let i = 1; i < sheet.content.length; i++) {
                        const rowVal = sheet.content[i][idIdx];
                        if (rowVal === itemId) {
                            rowIdx = i;
                            break;
                        }
                    }

                    if (rowIdx !== -1) {
                        // 更新: 遍历 header，如果 item 中有对应字段则更新
                        headers.forEach((h, colIdx) => {
                            if (item[h] !== undefined) {
                                sheet.content[rowIdx][colIdx] = item[h];
                            }
                        });
                    } else {
                        // 插入: 构建新行
                        const newRow = headers.map(h => item[h] !== undefined ? item[h] : null);
                        // 确保 ID 存在
                        if (item[idColName] !== undefined) {
                            newRow[idIdx] = item[idColName];
                        }
                        sheet.content.push(newRow);
                    }
                });
            };

            // 分别处理三个主表 (使用过滤后的列表)
            processTable('CHARACTER_Registry', partyToImport);
            processTable('CHARACTER_Attributes', partyToImport);
            processTable('CHARACTER_Resources', partyToImport);

            // 辅助函数：处理关联数据 (技能/专长/法术)
            const processAuxData = (dataMap, libTableName, linkTableName, idField, nameField, typeField = null, fixedType = null) => {
                if (!dataMap) return;
                
                const libKey = DataManager.findTableKey(rawData, libTableName);
                const linkKey = DataManager.findTableKey(rawData, linkTableName);
                if (!libKey || !linkKey) return;
                
                const libSheet = rawData[libKey];
                const linkSheet = rawData[linkKey];
                const libHeaders = libSheet.content[0];
                const linkHeaders = linkSheet.content[0];
                
                Object.keys(dataMap).forEach(charId => {
                    const items = dataMap[charId];
                    if (!Array.isArray(items)) return;
                    
                    items.forEach(item => {
                        // 1. 处理库 (Library)
                        let itemId = item[idField];
                        const itemName = item[nameField];
                        
                        // 尝试通过 ID 查找
                        let libRowIdx = -1;
                        const libIdColIdx = libHeaders.indexOf(idField);
                        const libNameColIdx = libHeaders.indexOf(nameField);
                        
                        if (itemId && libIdColIdx !== -1) {
                            libRowIdx = libSheet.content.findIndex((r, i) => i > 0 && r[libIdColIdx] === itemId);
                        }
                        
                        // 如果没找到 ID，尝试通过名称查找
                        if (libRowIdx === -1 && itemName && libNameColIdx !== -1) {
                            libRowIdx = libSheet.content.findIndex((r, i) => i > 0 && r[libNameColIdx] === itemName);
                            if (libRowIdx !== -1) {
                                itemId = libSheet.content[libRowIdx][libIdColIdx]; // 使用现有的 ID
                            }
                        }
                        
                        // 如果还是没找到，创建新的
                        if (libRowIdx === -1) {
                            if (!itemId) itemId = (idField.startsWith('SKILL') ? 'SKL_' : 'FEAT_') + Math.random().toString(36).substr(2, 8);
                            
                            const newRow = libHeaders.map(h => {
                                if (h === idField) return itemId;
                                if (fixedType && h === typeField) return fixedType;
                                return item[h] !== undefined ? item[h] : null;
                            });
                            libSheet.content.push(newRow);
                        }
                        
                        // 2. 处理关联 (Link)
                        const linkCharColIdx = linkHeaders.indexOf('CHAR_ID');
                        const linkItemColIdx = linkHeaders.indexOf(idField);
                        
                        if (linkCharColIdx !== -1 && linkItemColIdx !== -1) {
                            // 检查是否已存在关联
                            const linkExists = linkSheet.content.some((r, i) =>
                                i > 0 && r[linkCharColIdx] === charId && r[linkItemColIdx] === itemId
                            );
                            
                            if (!linkExists) {
                                const newLinkRow = linkHeaders.map(h => {
                                    if (h === 'LINK_ID') return 'LNK_' + Math.random().toString(36).substr(2, 8);
                                    if (h === 'CHAR_ID') return charId;
                                    if (h === idField) return itemId;
                                    return item[h] !== undefined ? item[h] : null;
                                });
                                linkSheet.content.push(newLinkRow);
                            }
                        }
                    });
                });
            };

            // 处理技能 (使用过滤后的数据)
            processAuxData(filteredSkills, 'SKILL_Library', 'CHARACTER_Skills', 'SKILL_ID', '技能名称');
            // 处理法术 (也是技能库，但可能有特殊字段)
            processAuxData(filteredSpells, 'SKILL_Library', 'CHARACTER_Skills', 'SKILL_ID', '技能名称', '技能类型', '法术');
            // 处理专长
            processAuxData(filteredFeats, 'FEAT_Library', 'CHARACTER_Feats', 'FEAT_ID', '专长名称');

            // 保存
            await DiceManager.saveData(rawData);

            const modeText = mode === 'replace' ? '替换' : '追加';
            return {
                success: true,
                message: `成功${modeText}导入 ${partyToImport.length} 个角色`,
                count: partyToImport.length
            };
        } catch (err) {
            console.error('[DND DataManager] 导入队伍数据失败:', err);
            return { success: false, message: '导入失败: ' + err.message };
        }
    },
    

    // [新增] 导入 FVTT 角色数据
    importFVTTData: async (json) => {
        try {
            const api = DataManager.getAPI();
            if (!api) return { success: false, message: 'API 不可用' };

            // 简单验证
            if (!json.name || !json.system) {
                return { success: false, message: '无效的 FVTT 角色文件' };
            }

            // 1. 解析基础信息
            const name = json.name;
            const sys = json.system;
            const details = sys.details || {};
            const abilities = sys.abilities || {};
            const attributes = sys.attributes || {};
            
            // 职业
            const classItems = (json.items || []).filter(i => i.type === 'class');
            const classStr = classItems.map(c => `${c.name} ${(c.system?.levels || 1)}`).join(' / ') || '平民 1';
            const level = details.level || classItems.reduce((acc, c) => acc + (c.system?.levels || 0), 0) || 1;

            // 种族
            const raceItem = (json.items || []).find(i => i.type === 'race');
            const raceStr = raceItem ? raceItem.name : (details.race || '未知种族');

            // 属性
            const stats = {};
            const abbrMap = { str:'STR', dex:'DEX', con:'CON', int:'INT', wis:'WIS', cha:'CHA' };
            Object.keys(abilities).forEach(k => {
                if (abbrMap[k]) stats[abbrMap[k]] = abilities[k].value || 10;
            });

            // 技能
            const skillMap = {
                'acr': '杂技', 'ani': '驯兽', 'arc': '奥秘', 'ath': '运动',
                'dec': '欺瞒', 'his': '历史', 'ins': '洞悉', 'itm': '威吓',
                'inv': '调查', 'med': '医药', 'nat': '自然', 'prc': '察觉',
                'prf': '表演', 'per': '说服', 'rel': '宗教', 'slt': '手法',
                'ste': '隐匿', 'sur': '生存'
            };
            const profSkills = [];
            if (sys.skills) {
                Object.keys(sys.skills).forEach(k => {
                    if (sys.skills[k].value >= 1) { // 1=熟练, 2=专精
                        profSkills.push(skillMap[k] || k);
                    }
                });
            }

            // 豁免
            const saves = [];
            Object.keys(abilities).forEach(k => {
                if (abilities[k].proficient >= 1) saves.push(skillMap[k] || k.toUpperCase()); // 简单映射
            });

            // 构建导入对象
            const charData = {
                'CHAR_ID': 'FVTT_' + Date.now(),
                '成员类型': '同伴',
                '姓名': name,
                '种族/性别/年龄': `${raceStr} / - / -`,
                '职业': classStr,
                '外貌描述': details.appearance || '',
                '性格特点': (details.trait || '') + ' ' + (details.ideal || '') + ' ' + (details.bond || '') + ' ' + (details.flaw || ''),
                '背景故事': details.biography?.value?.replace(/<[^>]+>/g, '') || '', // 去除 HTML
                '加入时间': new Date().toISOString().slice(0,10),
                
                // Attributes
                '等级': level,
                'HP': `${attributes.hp?.value || 0}/${attributes.hp?.max || 1}`,
                'AC': attributes.ac?.value || 10,
                '先攻加值': attributes.init?.total || 0,
                '速度': attributes.movement?.walk ? `${attributes.movement.walk}尺` : '30尺',
                '属性值': JSON.stringify(stats),
                '豁免熟练': JSON.stringify(saves),
                '技能熟练': JSON.stringify(profSkills),
                '被动感知': sys.skills?.prc?.passive || 10,
                
                // Resources
                '法术位': '', // 暂不解析法术位详情
                '金币': sys.currency ? (sys.currency.gp || 0) : 0,
                '生命骰': `${attributes.hd || 0}/${attributes.hd || 0}`
            };

            // 解析物品 (Inventory)
            const inventory = [];
            (json.items || []).forEach(item => {
                if (['weapon', 'equipment', 'consumable', 'loot', 'backpack'].includes(item.type)) {
                    inventory.push({
                        '物品ID': item.name, // 简单使用名称
                        '物品名称': item.name,
                        '类别': item.type === 'weapon' ? '武器' : (item.type === 'equipment' ? '护甲' : '杂物'),
                        '数量': item.system?.quantity || 1,
                        '已装备': item.system?.equipped ? '是' : '否',
                        '所属人': name,
                        '稀有度': item.system?.rarity || '普通',
                        '描述': item.system?.description?.value?.replace(/<[^>]+>/g, '') || '',
                        '重量': item.system?.weight || 0,
                        '价值': item.system?.price?.value ? `${item.system.price.value}gp` : '-'
                    });
                }
            });

            // 解析法术 (Spells) -> 存入技能库并关联
            const spells = [];
            (json.items || []).forEach(item => {
                if (item.type === 'spell') {
                    spells.push({
                        'SKILL_ID': item.name, // 临时ID
                        '技能名称': item.name,
                        '技能类型': '法术',
                        '环阶': item.system?.level || 0,
                        '学派': item.system?.school || '-',
                        '施法时间': item.system?.activation?.type || '-',
                        '射程': item.system?.range?.value ? `${item.system.range.value} ${item.system.range.units}` : '-',
                        '成分': item.system?.components ? Object.keys(item.system.components).filter(k=>item.system.components[k]).join(',').toUpperCase() : '-',
                        '持续时间': item.system?.duration?.value ? `${item.system.duration.value} ${item.system.duration.units}` : '-',
                        '效果描述': item.system?.description?.value?.replace(/<[^>]+>/g, '') || ''
                    });
                }
            });

            // 开始写入数据库
            // 1. 获取现有数据
            const rawData = api.exportTableAsJson();
            const tableData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

            // 2. 写入角色注册表
            const regKey = DataManager.findTableKey(tableData, 'CHARACTER_Registry');
            const regSheet = regKey ? tableData[regKey] : null;
            if (regSheet && regSheet.content) {
                // 映射字段并添加行
                const headers = regSheet.content[0];
                const newRow = headers.map(h => charData[h] !== undefined ? charData[h] : null);
                regSheet.content.push(newRow);
            }

            // 3. 写入角色属性表
            const attrKey = DataManager.findTableKey(tableData, 'CHARACTER_Attributes');
            const attrSheet = attrKey ? tableData[attrKey] : null;
            if (attrSheet && attrSheet.content) {
                const headers = attrSheet.content[0];
                const newRow = headers.map(h => charData[h] !== undefined ? charData[h] : null);
                attrSheet.content.push(newRow);
            }

            // 4. 写入角色资源表
            const resKey = DataManager.findTableKey(tableData, 'CHARACTER_Resources');
            const resSheet = resKey ? tableData[resKey] : null;
            if (resSheet && resSheet.content) {
                const headers = resSheet.content[0];
                const newRow = headers.map(h => charData[h] !== undefined ? charData[h] : null);
                resSheet.content.push(newRow);
            }

            // 5. 写入物品表 (批量)
            const invKey = DataManager.findTableKey(tableData, 'ITEM_Inventory');
            const invSheet = invKey ? tableData[invKey] : null;
            if (invSheet && invSheet.content) {
                const headers = invSheet.content[0];
                inventory.forEach(item => {
                    const newRow = headers.map(h => item[h] !== undefined ? item[h] : null);
                    invSheet.content.push(newRow);
                });
            }

            // 6. 写入技能库和关联 (简化处理：只写入库，不查重可能导致冗余，暂不优化)
            const libKey = DataManager.findTableKey(tableData, 'SKILL_Library');
            const libSheet = libKey ? tableData[libKey] : null;
            
            const linkKey = DataManager.findTableKey(tableData, 'CHARACTER_Skills');
            const linkSheet = linkKey ? tableData[linkKey] : null;
            
            if (libSheet && libSheet.content && linkSheet && linkSheet.content) {
                const libHeaders = libSheet.content[0];
                const linkHeaders = linkSheet.content[0];
                
                spells.forEach(spell => {
                    // 添加到库 (如果不存在)
                    const exists = libSheet.content.some(r => r[1] === spell['技能名称']); // 假设列1是名称
                    let skillId = 'SKL_' + Math.random().toString(36).substr(2, 6);
                    
                    if (!exists) {
                        const libRow = libHeaders.map(h => {
                            if (h === 'SKILL_ID') return skillId;
                            return spell[h] !== undefined ? spell[h] : null;
                        });
                        libSheet.content.push(libRow);
                    } else {
                        // 查找现有ID
                        const row = libSheet.content.find(r => r[1] === spell['技能名称']);
                        if (row) skillId = row[libHeaders.indexOf('SKILL_ID')];
                    }
                    
                    // 添加关联
                    const linkRow = linkHeaders.map(h => {
                        if (h === 'LINK_ID') return 'LNK_' + Math.random().toString(36).substr(2, 6);
                        if (h === 'CHAR_ID') return charData['CHAR_ID'];
                        if (h === 'SKILL_ID') return skillId;
                        if (h === '已准备') return '是'; // 默认已准备
                        return null;
                    });
                    linkSheet.content.push(linkRow);
                });
            }

            // 保存
            await api.importTableAsJson(JSON.stringify(tableData));

            return { success: true, message: `成功导入 FVTT 角色: ${name}` };

        } catch (err) {
            console.error('[DND DataManager] FVTT 导入失败:', err);
            return { success: false, message: '解析或保存失败: ' + err.message };
        }
    }
};
