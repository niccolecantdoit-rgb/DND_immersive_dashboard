// src/config/Config.js
export const CONFIG = {
    // Z-Index 层级管理
    Z_INDEX: {
        TOGGLE_BTN: 2147483641,
        MINI_HUD: 2147483640,
        DASHBOARD: 2147483642,
        CHAR_DETAIL: 2147483643,
        POPUP_BACKDROP: 2147483644,
        POPUP: 2147483645,
        AVATAR_DIALOG: 2147483650
    },
    // 尺寸配置
    SIZE: {
        TOGGLE_BTN: 40,
        MINI_HUD_WIDTH: 350,
        CHAR_CARD_WIDTH: 380,
        MINIMAP_SIZE: 180,
        AVATAR_DEFAULT: 40,
        AVATAR_LARGE: 48
    },
    // 动画时长 (ms)
    ANIMATION: {
        FADE_DURATION: 200,
        SLIDE_DURATION: 300,
        DEBOUNCE_DELAY: 150
    },
    // 骰子池配置
    DICE_POOL: {
        MIN_ROWS: 6,
        TARGET_ROWS: 20,
        REFILL_COOLDOWN: 3000
    },
    // 存储键名
    STORAGE_KEYS: {
        TOGGLE_POS: 'dnd_toggle_pos',
        PARTY_EXPANDED: 'dnd_party_expanded',
        THEME: 'dnd_theme',
        MAP_ZOOM: 'dnd_map_zoom',
        PRESET_CONFIG: 'dnd_preset_config',
        QUICK_SLOTS: 'dnd_quick_slots'
    },
    // 地图缩放配置
    MAP_ZOOM: {
        MIN: 0.5,
        MAX: 3.0,
        DEFAULT: 1.0,
        STEP: 0.15
    },
    // 主题配置
    THEMES: {
        dark: {
            name: '暗黑城堡',
            icon: '🏰',
            vars: {
                '--dnd-bg-main': '#0a0a0c',
                '--dnd-bg-panel': 'rgba(22, 22, 24, 0.95)',
                '--dnd-border-gold': '#9d8b6c',
                '--dnd-text-highlight': '#ffdb85',
                '--dnd-accent-green': '#3a6b4a'
            }
        },
        forest: {
            name: '精灵森林',
            icon: '🌲',
            vars: {
                '--dnd-bg-main': '#0c1210',
                '--dnd-bg-panel': 'rgba(18, 32, 26, 0.95)',
                '--dnd-border-gold': '#5a8a6a',
                '--dnd-text-highlight': '#85ffb5',
                '--dnd-accent-green': '#3a8b5a'
            }
        },
        crimson: {
            name: '血色深渊',
            icon: '🔥',
            vars: {
                '--dnd-bg-main': '#0c0808',
                '--dnd-bg-panel': 'rgba(32, 18, 18, 0.95)',
                '--dnd-border-gold': '#8a5a5a',
                '--dnd-text-highlight': '#ff8585',
                '--dnd-accent-green': '#4a6b4a'
            }
        },
        arcane: {
            name: '奥术塔楼',
            icon: '🔮',
            vars: {
                '--dnd-bg-main': '#0a0a10',
                '--dnd-bg-panel': 'rgba(20, 20, 36, 0.95)',
                '--dnd-border-gold': '#6a6a9d',
                '--dnd-text-highlight': '#b585ff',
                '--dnd-accent-green': '#3a5a8b'
            }
        }
    },
    // 预设切换配置 (Default values, will be overwritten by DB)
    PRESET_SWITCHING: {
        COMBAT_PRESET: '战斗推进',
        EXPLORE_PRESET: '奶龙推进',
        ENABLED: true
    }
};
