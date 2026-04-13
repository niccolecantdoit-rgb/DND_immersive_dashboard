// src/features/ExplorationMapManager.js
import { TavernAPI } from '../core/TavernAPI.js';
import { SettingsManager } from '../core/SettingsManager.js';
import { Logger } from '../core/Logger.js';
import { DataManager } from '../data/DataManager.js';
import { DiceManager } from '../data/DiceManager.js';
import { DBAdapter } from '../core/DBAdapter.js';
import { TavernSettingsSync } from '../core/TavernSettingsSync.js';

export const ExplorationMapManager = {
    getAIRequestOptions: async (maxTokens = 4096) => {
        const aiSettings = await SettingsManager.getAISettings();

        if (aiSettings.provider === 'database') {
            if (!TavernAPI.getDatabaseAIStatus().available) {
                throw new Error('当前数据库 API 未提供 AI 调用能力，请先更新数据库插件或切回自定义 API');
            }
            return { maxTokens, useDatabaseAPI: true };
        }

        if (!aiSettings.apiConfig.url || !aiSettings.apiConfig.model) {
            throw new Error('请先在设置中配置 API 地址和模型');
        }

        return {
            maxTokens,
            customConfig: aiSettings.apiConfig
        };
    },

    // Prompts
    prompts: {
        structure: (theme) => `你是一个资深DND地牢架构师。请根据主题设计一个紧凑、真实的地牢平面图结构。

主题：${theme}

关键设计原则：
1. **紧凑连接**：房间之间不应该用长长的线连接，而应该物理上紧挨着。
2. **走廊即房间**：走廊(corridor)本身就是一个长条形的房间，角色可以站在里面。不要用抽象的线代表路径。
3. **无缝拼接**：房间和走廊的坐标(x,y,width,height)应该设计得让它们边缘贴合，形成一个连通的整体区域。
4. **门与通道**：房间之间的连接通过共享墙壁上的“门”或“开口”实现。
5. **不规则布局**：整个地图中地点的布局不用规则分布，即使是人造建筑，也可以有不对称和不规则的形状。

请生成JSON格式数据：
1. mapName: 地图名称
2. mapSize: { width: 800, height: 600 }
3. rooms: 房间列表，包含：
   - id: ID
   - name: 名称
   - type: 类型 (entrance/corridor/room/hall/secret_room)
   - shape: 形状 (rectangular / circular / irregular / cave_blob) - 注意：自然洞穴必须用 irregular 或 cave_blob，不要全是矩形
   - x, y, width, height: 所在区域的边界框 (Bounding Box)，对于不规则形状，这是它的最大范围
   - description: 描述
   - color: 建议的颜色代码 (hex)
4. doors: 门/通道列表（替代原来的paths），包含：
   - x, y: 门的位置
   - type: 类型 (open/door/secret_door/barred)
   - orientation: 方向 (horizontal/vertical)
   - connects: [room_id_1, room_id_2]
5. features: 室内物体列表 (column/statue/chest/trap/fountain/table...)
   - x, y: 位置
   - type: 类型

请生成一个至少包含8-12个区域（房间+走廊）的复杂结构，确保有一个入口和一个Boss区域。走廊应该连接多个房间。

只返回JSON，不要其他解释。`,

        svg: (structureJSON) => `你是一个顶级DND地图绘制大师。请根据以下结构数据，绘制一张极具艺术感的、**手绘风格**的地图。

${structureJSON}

核心绘制要求：

0.  **形态革命（关键需求）**：
    *   **拒绝矩形**：DND地图（尤其是洞穴）绝不是一个个方块拼起来的！
    *   **有机形状**：
        - 对于 \`shape="cave_blob"\` 或 \`irregular\` 的房间，必须使用 \`<path>\` 绘制不规则的、有机的曲线轮廓，模拟自然岩壁。
        - 即使是 \`rectangular\` 房间，也要画得稍微歪斜一点，不要用完美的 \`rect\`。
    *   **参考边界**：JSON中的 \`width/height\` 只是大致范围，请大胆地在这个范围内绘制多边形或不规则形状。

1.  **解决“简笔画”感（纹理与厚度）**：
    *   **墙壁**：不要只画单薄的线！请使用 **粗笔触 (stroke-width="4"~"6")** 来表示墙壁，或者使用双线描绘。墙壁颜色应深邃（如深炭色 #2c3e50）。
    *   **地面纹理**：拒绝纯色填充！请在 <defs> 中定义纹理图案 (<pattern>)，例如：
        - "floor-stone": 简单的石砖纹理。
        - "floor-hatch": 手绘排线阴影。
        - "grid-pattern": 50x50 的淡色网格线 (stroke="#000" opacity="0.2")，模拟战术地图。
    *   **应用纹理**：将这些纹理应用到房间 (fill="url(#floor-stone)")。
    *   **网格覆盖**：在所有房间之上（但在文字之下）覆盖一层 "grid-pattern"，这能瞬间提升地图的专业度和战术感！

2.  **手绘风格与滤镜控制（模拟铅笔/石笔）**：
    *   **定义滤镜**：请在 <defs> 中定义 "pencil-effect" 滤镜。
        - 必须使用 **高频噪声** (\`baseFrequency="0.7"\` 或更高) 来模拟铅笔的颗粒感。
        - 使用 \`feComposite\` (operator="in") 将噪声叠加到线条上，使线条产生不连续的石墨质感，而不是单纯的扭曲。
    *   **应用范围（关键）**：将 \`filter="url(#pencil-effect)"\` 应用到所有房间轮廓、墙壁和走廊。
    *   **文字保护（非常重要）**：**绝对禁止**将扭曲滤镜应用到 <text> 标签！文字必须保持清晰锐利，不能扭曲。

3.  **背景**：
    *   SVG 第一层必须是覆盖全图的 <rect>，填充 "parchment" (羊皮纸) 颜色或纹理，**绝不能透明**。

4.  **排版与逼格（提升质感的核心）**：
    *   **字体魔法**：
        - 标题使用 \`font-family="Cinzel", serif\`，字号巨大，居中显示在地图顶部。
        - 房间标签使用 \`font-family="MedievalSharp", cursive\`，颜色使用深红或深金，增加神秘感。
        - 说明文字使用 \`font-family="Crimson Text", serif\`。
        - 所有文字应为中文。
    *   **装饰边框**：不要让地图悬浮在真空中！请画一个**华丽的装饰边框**（双线、角落花纹或凯尔特结风格）包围整个地图区域。
    *   **图例与装饰**：
        - 在角落绘制一个极其精细的**指南针 (Compass Rose)**。
        - 添加“比例尺”条。
        - 添加墨水污渍、羊皮纸的破损边缘效果。
    *   **整体构图**：像一本精美的奇幻设定集插图一样排版。

5.  **视觉细节**：
    *   **房间连接**：走廊应有实体宽度，与房间自然融合。
    *   **家具**：添加简单的家具符号（圆圈代表柱子，长方块代表桌子，X代表陷阱）。

请输出完整的 SVG 代码。

**关键排版修正（防止重叠）**：
*   **ViewBox 扩展**：输入的房间坐标是在 0,0 到 800,600 之间。为了放下标题和边框，请务必将 SVG 的 \`viewBox\` 设置为 **\`-50 -150 900 850\`** (或者类似的扩展范围)。
*   **标题位置**：将大标题放置在 \`y = -80\` 左右的位置（即地图上方），**绝对不要覆盖房间**！
*   **边框位置**：边框应该包围整个视觉区域。

不要使用markdown代码块。直接返回 <svg ...> ... </svg>。`,

        battleStructure: (theme, width, height) => `你是一个专业的DND战斗地图环境设计师。请根据主题设计一个 ${width}x${height} 网格大小的战斗遭遇场景。

主题：${theme}

关键要求：
1. **战术丰富性**：不仅仅是空地。包括障碍物（阻挡视线/移动）、危险地形（伤害/状态）、困难地形（移动消耗加倍）和有利位置（高地/掩体）。
2. **环境叙事**：通过物体放置传达故事（例如翻倒的马车、祭坛、营火）。
3. **坐标系统**：使用 1-based 坐标系 (x: 1-${width}, y: 1-${height})。

请生成JSON格式数据：
1. mapName: 场景名称
2. dimensions: { width: ${width}, height: ${height} }
3. ground: 地面类型 (grass / dirt / stone / wood_plank / water / lava / snow)
4. terrain_objects: 地形物体列表，包含：
   - type: 类型 (tree / rock / wall / pillar / water_pool / furniture / rubble / bush / statue)
   - x, y: 左上角坐标
   - w, h: 占据的格数 (可以是非整数，但尽量贴合网格)
   - rotation: 旋转角度 (0, 90, 45...)
   - description: 简短描述 (e.g. "古老的橡树", "破碎的雕像")
   - tactical: 战术属性 (cover: 掩体, block: 阻挡, difficult: 困难地形)

只返回JSON，不要其他解释。`,

        battleSVG: (structureJSON) => `你是一个数字艺术地图绘制师。请根据以下结构数据，绘制一张**俯视视角 (Top-Down)** 的高精度战斗地图底图。

${structureJSON}

**绘图规范 (SVG)**：

1.  **尺寸与视图**：
    *   假设每个网格单位 (Unit) 为 50像素。
    *   SVG \`width\` = dimensions.width * 50, \`height\` = dimensions.height * 50。
    *   \`viewBox\` = "0 0 width height"。
    *   **不要画网格线！** (Grid lines) - 网格线由上层UI负责，你只负责画底图。

2.  **艺术风格 (Art Style)**：
    *   **写实材质 + 手绘轮廓**：地面使用高质量的纹理图案 (Patterns)，物体使用有厚度的轮廓线。
    *   **光影与立体感**：
        - **必须使用投影 (Drop Shadow)**：为所有直立物体（树、墙、柱子）添加 \`<filter>\` 投影效果，模拟光照，产生立体感。
        - **环境光遮蔽 (AO)**：在墙角或物体底部添加深色渐变。
    *   **色彩**：饱和度适中，不要太鲜艳，稍微偏向 "Grim Dark" 或 "High Fantasy" 风格。

3.  **图层处理**：
    *   **底层 (Background)**：铺满全图的基础地面纹理（草地、石板路等）。使用 <pattern> 定义纹理细节，避免单色填充。
    *   **装饰层 (Details)**：在地面上添加一些随机噪点、小石子、裂缝、污渍，打破单调。
    *   **物体层 (Objects)**：绘制 terrain_objects。
        - 树木：绘制树冠的俯视图（通常是不规则圆形），带有叶子纹理。
        - 墙壁/柱子：要有顶部平面和侧面投影。
        - 水面：使用半透明蓝色 + 波纹滤镜。

4.  **技术细节**：
    *   在 <defs> 中预定义好常用的滤镜 (Shadow, Glow) 和图案 (Grass, Stone, Water)。
    *   所有坐标需乘以 50 转换为像素坐标。

5.  **输出要求**：
    *   只输出 <svg> 代码。
    *   不需要文字标签。
    *   不需要边框。

直接返回 <svg ...> ... </svg>。`
    },

    // 1. Check if structure exists for location
    checkStructure: (locationName) => {
        const table = DataManager.getTable('EXPLORATION_Map_Data');
        if (!table) return null;
        const row = table.find(r => r['LocationName'] === locationName);
        return row ? row['MapStructureJSON'] : null;
    },

    // 2. Generate Structure (Step 1)
    generateStructure: async (locationName, description) => {
        const theme = `${locationName}。${description || ''}`;
        const prompt = ExplorationMapManager.prompts.structure(theme);
        const requestOptions = await ExplorationMapManager.getAIRequestOptions(4000);
        
        Logger.info('[ExplorationMap] Generating structure for:', locationName);
        
        const response = await TavernAPI.generate([{ role: 'user', content: prompt }], requestOptions);

        // Parse JSON
        let jsonStr = response;
        const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
        jsonStr = jsonStr.trim();
        
        // Basic cleanup
        if (!jsonStr.startsWith('{')) jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
        if (!jsonStr.endsWith('}')) jsonStr = jsonStr.substring(0, jsonStr.lastIndexOf('}') + 1);

        // Validation
        JSON.parse(jsonStr); // Will throw if invalid

        // Save to Table
        await ExplorationMapManager.saveStructure(locationName, jsonStr);
        return jsonStr;
    },

    // Save structure to table
    saveStructure: async (locationName, jsonStr) => {
        const rawData = DataManager.getAllData();
        const tableKey = Object.keys(rawData).find(k => k.includes('EXPLORATION_Map_Data') || (rawData[k].name && rawData[k].name.includes('探索地图数据')));
        
        if (!tableKey) {
            Logger.error('Table EXPLORATION_Map_Data not found!');
            return;
        }

        const sheet = rawData[tableKey];
        if (!sheet.content) sheet.content = [];
        
        const headers = sheet.content[0];
        const locIdx = headers.indexOf('LocationName');
        const jsonIdx = headers.indexOf('MapStructureJSON');
        const timeIdx = headers.indexOf('LastUpdated');

        // Find or Insert
        let row = sheet.content.slice(1).find(r => r[locIdx] === locationName);
        if (row) {
            row[jsonIdx] = jsonStr;
            row[timeIdx] = new Date().toISOString();
        } else {
            const newRow = new Array(headers.length).fill(null);
            newRow[locIdx] = locationName;
            newRow[jsonIdx] = jsonStr;
            newRow[timeIdx] = new Date().toISOString();
            sheet.content.push(newRow);
        }

        await DiceManager.saveData(rawData);
    },

    // 3. Generate SVG (Step 2)
    generateSVG: async (locationName, structureJSON) => {
        const prompt = ExplorationMapManager.prompts.svg(structureJSON);
        const requestOptions = await ExplorationMapManager.getAIRequestOptions(8192);
        
        Logger.info('[ExplorationMap] Generating SVG for:', locationName);
        
        const response = await TavernAPI.generate([{ role: 'user', content: prompt }], requestOptions);

        // Extract SVG
        let svgContent = response;
        const codeBlockMatch = svgContent.match(/```(?:xml|svg|html)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) svgContent = codeBlockMatch[1];

        const svgStartIndex = svgContent.indexOf('<svg');
        const svgEndIndex = svgContent.lastIndexOf('</svg>');
        
        if (svgStartIndex !== -1 && svgEndIndex !== -1) {
            svgContent = svgContent.substring(svgStartIndex, svgEndIndex + 6);
        } else {
            throw new Error("未能提取有效的 SVG 代码");
        }

        // Add namespace if missing
        if(!svgContent.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            svgContent = svgContent.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Save to Cache
        await DBAdapter.setSVG(locationName, svgContent);
        // Save to Chat Metadata (Priority)
        await TavernSettingsSync.saveToChat(`map_${locationName}`, svgContent);
        
        return svgContent;
    },

    // Main Flow: Get or Generate Map
    getMap: async (locationName, description, forceRegen = false) => {
        const mapKey = `map_${locationName}`;

        // 1. Check Chat Metadata (Priority 1)
        if (!forceRegen) {
            const chatSVG = TavernSettingsSync.getFromChat(mapKey);
            if (chatSVG) return { type: 'svg', content: chatSVG };
        }

        // 2. Check SVG Cache (Priority 2)
        if (!forceRegen) {
            const cachedSVG = await DBAdapter.getSVG(locationName);
            if (cachedSVG) return { type: 'svg', content: cachedSVG };
        }

        // 3. Check Structure
        let structure = ExplorationMapManager.checkStructure(locationName);
        
        // If no structure, fail (User requested to remove structure generation)
        if (!structure) {
            // [Modified] If no structure found, try to generate it automatically for better UX
             try {
                Logger.info('Structure not found, generating new structure for:', locationName);
                structure = await ExplorationMapManager.generateStructure(locationName, description);
            } catch (e) {
                return { type: 'error', message: '结构生成失败: ' + e.message };
            }
        }

        // 3. Generate SVG from Structure (Step 2)
        try {
            const svg = await ExplorationMapManager.generateSVG(locationName, structure);
            return { type: 'svg', content: svg };
        } catch (e) {
            return { type: 'error', message: '绘图失败: ' + e.message };
        }
    },

    // [New] Check Battle Map Structure from Table
    checkBattleStructure: (sceneName) => {
        const table = DataManager.getTable('COMBAT_Map_Visuals');
        if (!table) return null;
        // Try exact match or fuzzy match if needed. Using exact match for now.
        const row = table.find(r => r['SceneName'] === sceneName);
        return row ? row['VisualJSON'] : null;
    },

    // [New] Save Battle Map Structure to Table
    saveBattleStructure: async (sceneName, jsonStr, width, height) => {
        const rawData = DataManager.getAllData();
        const tableKey = Object.keys(rawData).find(k => k.includes('COMBAT_Map_Visuals') || (rawData[k].name && rawData[k].name.includes('战斗地图绘制')));
        
        if (!tableKey) {
            Logger.warn('Table COMBAT_Map_Visuals not found, skipping save.');
            return;
        }

        const sheet = rawData[tableKey];
        if (!sheet.content) sheet.content = [];
        
        const headers = sheet.content[0];
        const nameIdx = headers.indexOf('SceneName');
        const jsonIdx = headers.indexOf('VisualJSON');
        const sizeIdx = headers.indexOf('GridSize');
        const timeIdx = headers.indexOf('LastUpdated');

        // Find or Insert
        let row = sheet.content.slice(1).find(r => r[nameIdx] === sceneName);
        const now = new Date().toISOString();
        const sizeStr = `${width}x${height}`;

        if (row) {
            row[jsonIdx] = jsonStr;
            row[sizeIdx] = sizeStr;
            row[timeIdx] = now;
        } else {
            const newRow = new Array(headers.length).fill(null);
            newRow[nameIdx] = sceneName;
            newRow[jsonIdx] = jsonStr;
            newRow[sizeIdx] = sizeStr;
            newRow[timeIdx] = now;
            sheet.content.push(newRow);
        }

        await DiceManager.saveData(rawData);
    },

    // [New] Generate Battle Map
    getBattleMap: async (locationName, description, width, height, forceRegen = false) => {
        const cacheKey = `BATTLE_MAP_${locationName}_${width}x${height}`;
        const mapKey = `map_${cacheKey}`;
        
        // 1. Check Chat Metadata (Priority 1)
        if (!forceRegen) {
            const chatSVG = TavernSettingsSync.getFromChat(mapKey);
            if (chatSVG) return { type: 'svg', content: chatSVG };
        }

        // 2. Check Cache (SVG) (Priority 2)
        if (!forceRegen) {
            const cachedSVG = await DBAdapter.getSVG(cacheKey);
            if (cachedSVG) return { type: 'svg', content: cachedSVG };
        }

        try {
            const structureRequestOptions = await ExplorationMapManager.getAIRequestOptions(2000);
            const svgRequestOptions = await ExplorationMapManager.getAIRequestOptions(8192);

            // Step 1: Get Structure (From Table or Generate)
            let jsonStr = null;
            
            // Try to load from table first (if not forced)
            if (!forceRegen) {
                jsonStr = ExplorationMapManager.checkBattleStructure(locationName);
                if (jsonStr) Logger.info('[BattleMap] Loaded structure from table:', locationName);
            }

            // If not found or forced, generate new
            if (!jsonStr) {
                Logger.info('[BattleMap] Generating new structure for:', locationName);
                const structurePrompt = ExplorationMapManager.prompts.battleStructure(locationName + " " + description, width, height);
                const structureRes = await TavernAPI.generate([{ role: 'user', content: structurePrompt }], structureRequestOptions);
                
                jsonStr = structureRes;
                const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
                if (jsonMatch) jsonStr = jsonMatch[1];
                
                // Cleanup
                jsonStr = jsonStr.trim();
                if (!jsonStr.startsWith('{')) jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
                if (!jsonStr.endsWith('}')) jsonStr = jsonStr.substring(0, jsonStr.lastIndexOf('}') + 1);

                // Save to Table
                await ExplorationMapManager.saveBattleStructure(locationName, jsonStr, width, height);
            }

            // Step 2: Generate SVG
            Logger.info('[BattleMap] Generating SVG...');
            const svgPrompt = ExplorationMapManager.prompts.battleSVG(jsonStr);
            const svgRes = await TavernAPI.generate([{ role: 'user', content: svgPrompt }], svgRequestOptions);

            let svgContent = svgRes;
            const codeBlockMatch = svgContent.match(/```(?:xml|svg|html)?\s*([\s\S]*?)\s*```/i);
            if (codeBlockMatch) svgContent = codeBlockMatch[1];
            
            const svgStartIndex = svgContent.indexOf('<svg');
            const svgEndIndex = svgContent.lastIndexOf('</svg>');
            
            if (svgStartIndex !== -1 && svgEndIndex !== -1) {
                svgContent = svgContent.substring(svgStartIndex, svgEndIndex + 6);
            }

            // Namespace fix
            if(!svgContent.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
                svgContent = svgContent.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }

            // Cache it
            await DBAdapter.setSVG(cacheKey, svgContent);
            // Save to Chat Metadata (Priority)
            await TavernSettingsSync.saveToChat(`map_${cacheKey}`, svgContent);
            
            return { type: 'svg', content: svgContent };

        } catch (e) {
            Logger.error('[BattleMap] Generation failed', e);
            return { type: 'error', message: e.message };
        }
    }
};
