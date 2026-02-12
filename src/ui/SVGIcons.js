// src/ui/SVGIcons.js
// 统一的 SVG 图标常量映射
// 将所有 emoji 替换为 FontAwesome SVG 图标 (inline <i> 标签)
// 使用方式: import { ICONS } from './SVGIcons.js';
//          然后在 HTML 模板中使用 ${ICONS.DICE} 替代 '🎲'

/**
 * FontAwesome SVG 图标映射表
 * 所有图标通过 icons.js 中注册的 FontAwesome library 渲染
 * dom.watch() 会自动将 <i class="fa-solid fa-xxx"> 转换为内联 SVG
 */
export const ICONS = {
    // ============================================
    // 🎮 游戏核心
    // ============================================
    DICE:           '<i class="fa-solid fa-dice-d20"></i>',          // 🎲 骰子
    SWORD:          '<i class="fa-solid fa-gavel"></i>',             // ⚔️ 战斗/攻击 (用 gavel 代替)
    SHIELD:         '<i class="fa-solid fa-shield-halved"></i>',     // 🛡️ 防御/护盾
    SKULL:          '<i class="fa-solid fa-skull"></i>',             // 💀 死亡/大失败
    TARGET:         '<i class="fa-solid fa-bullseye"></i>',          // 🎯 目标/瞄准
    TROPHY:         '<i class="fa-solid fa-trophy"></i>',            // 🏆 奖励/成就
    SPARKLES:       '<i class="fa-solid fa-bolt"></i>',              // ✨ 技能/魔法效果
    SCROLL:         '<i class="fa-solid fa-scroll"></i>',            // 📜 法术/任务卷轴
    BACKPACK:       '<i class="fa-solid fa-suitcase"></i>',          // 🎒 背包/物品
    COMPASS:        '<i class="fa-solid fa-compass"></i>',           // 🧭 探索/导航
    CASTLE:         '<i class="fa-solid fa-landmark"></i>',          // 🏰 城堡/据点
    FIRE:           '<i class="fa-solid fa-fire"></i>',              // 🔥 火焰
    CRYSTAL:        '<i class="fa-solid fa-gem"></i>',               // 🔮 魔法/水晶球
    HAT_WIZARD:     '<i class="fa-solid fa-hat-wizard"></i>',        // 🧙 法师
    LEVEL_UP:       '<i class="fa-solid fa-arrow-up"></i>',          // 🆙 升级
    GAMEPAD:        '<i class="fa-solid fa-gamepad"></i>',           // 🎮 游戏

    // ============================================
    // 👤 角色相关
    // ============================================
    USER:           '<i class="fa-solid fa-user"></i>',              // 👤 角色/用户
    USERS:          '<i class="fa-solid fa-users"></i>',             // 👥 队伍/多人
    MASK:           '<i class="fa-solid fa-masks-theater"></i>',     // 🎭 主角/角色扮演

    // ============================================
    // 🎨 界面/设置
    // ============================================
    PALETTE:        '<i class="fa-solid fa-palette"></i>',           // 🎨 主题/配色
    COG:            '<i class="fa-solid fa-cog"></i>',               // ⚙️ 设置/齿轮
    LIGHTBULB:      '<i class="fa-solid fa-lightbulb"></i>',         // 💡 提示/灯泡
    SEARCH:         '<i class="fa-solid fa-search"></i>',            // 🔍 搜索/检查
    SYNC:           '<i class="fa-solid fa-sync"></i>',              // 🔄 刷新/同步
    CHECK:          '<i class="fa-solid fa-check"></i>',             // ✅ 完成/确认
    TIMES:          '<i class="fa-solid fa-times"></i>',             // ❌ 关闭/失败
    WARNING:        '<i class="fa-solid fa-exclamation-triangle"></i>', // ⚠️ 警告
    QUESTION:       '<i class="fa-solid fa-question"></i>',          // ❓ 未知/问号
    CLOUD:          '<i class="fa-solid fa-cloud"></i>',             // ☁️ 云/云同步
    CLOUD_OFF:      '<i class="fa-solid fa-cloud-slash"></i>',       // 📴 离线
    MAP:            '<i class="fa-solid fa-map"></i>',               // 🗺️ 地图
    LOCATION:       '<i class="fa-solid fa-map-marker-alt"></i>',    // 📍 位置标记
    ROCKET:         '<i class="fa-solid fa-rocket"></i>',            // 🚀 火箭/科幻
    EYE:            '<i class="fa-solid fa-eye"></i>',               // 👁️ 查看
    DOWNLOAD:       '<i class="fa-solid fa-download"></i>',          // 📥 下载
    UPLOAD:         '<i class="fa-solid fa-upload"></i>',            // 📤 上传

    // ============================================
    // 🌤️ 天气图标
    // ============================================
    WEATHER_SUNNY:      '<i class="fa-solid fa-sun"></i>',           // ☀️
    WEATHER_CLOUDY:     '<i class="fa-solid fa-cloud"></i>',         // ☁️
    WEATHER_PARTLY:     '<i class="fa-solid fa-cloud-sun"></i>',     // 🌤️
    WEATHER_RAIN:       '<i class="fa-solid fa-cloud-rain"></i>',    // 🌧️
    WEATHER_STORM:      '<i class="fa-solid fa-cloud-bolt"></i>',    // ⛈️
    WEATHER_SNOW:       '<i class="fa-solid fa-snowflake"></i>',     // 🌨️❄️
    WEATHER_FOG:        '<i class="fa-solid fa-smog"></i>',          // 🌫️
    WEATHER_WIND:       '<i class="fa-solid fa-wind"></i>',          // 🌪️
    WEATHER_DEFAULT:    '<i class="fa-solid fa-cloud-sun"></i>',     // 默认天气
};

/**
 * 将天气描述文本匹配到对应的 FontAwesome 图标
 * @param {string} weatherText - 天气描述文本
 * @returns {string} FontAwesome 图标 HTML
 */
export function getWeatherIcon(weatherText) {
    if (!weatherText) return '';
    const text = weatherText.toLowerCase();
    if (text.includes('晴') || text.includes('sunny') || text.includes('clear')) return ICONS.WEATHER_SUNNY;
    if (text.includes('雷') || text.includes('storm') || text.includes('thunder')) return ICONS.WEATHER_STORM;
    if (text.includes('雨') || text.includes('rain')) return ICONS.WEATHER_RAIN;
    if (text.includes('雪') || text.includes('snow')) return ICONS.WEATHER_SNOW;
    if (text.includes('雾') || text.includes('fog') || text.includes('mist')) return ICONS.WEATHER_FOG;
    if (text.includes('风') || text.includes('wind') || text.includes('tornado')) return ICONS.WEATHER_WIND;
    if (text.includes('多云') || text.includes('cloudy') || text.includes('overcast')) return ICONS.WEATHER_CLOUDY;
    if (text.includes('阴') || text.includes('cloud')) return ICONS.WEATHER_PARTLY;
    return ICONS.WEATHER_DEFAULT;
}
