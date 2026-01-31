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
                '--dnd-bg-main': '#0f0b0a',
                '--dnd-bg-panel': 'linear-gradient(to bottom, #2b1b17, #1a100e)',
                '--dnd-bg-card': 'linear-gradient(135deg, #242424 0%, #1a1a1c 100%)',
                '--dnd-bg-hud': 'linear-gradient(to bottom, #2b1b17, #1a100e)',
                '--dnd-bg-popup': 'linear-gradient(to bottom, rgba(28, 28, 30, 0.99), rgba(18, 18, 20, 0.99))',
                '--dnd-bg-item': 'rgba(255,255,255,0.03)',
                '--dnd-border-gold': '#9d8b6c',
                '--dnd-border-inner': '#5c4b35',
                '--dnd-text-main': '#dcd0c0',
                '--dnd-text-header': '#e6dcca',
                '--dnd-text-highlight': '#ffdb85',
                '--dnd-text-dim': '#888',
                '--dnd-accent-red': '#8a2c2c',
                '--dnd-accent-green': '#3a6b4a',
                '--dnd-accent-blue': '#2c4c8a',
                '--dnd-shadow': '0 5px 20px rgba(0,0,0,0.8)'
            }
        },
        forest: {
            name: '精灵森林',
            icon: '🌲',
            vars: {
                '--dnd-bg-main': '#0c1210',
                '--dnd-bg-panel': 'linear-gradient(to bottom, #1a2b22, #0e1a14)',
                '--dnd-bg-card': 'linear-gradient(135deg, #1c2e24 0%, #0f1c16 100%)',
                '--dnd-bg-hud': 'linear-gradient(to bottom, #1a2b22, #0e1a14)',
                '--dnd-bg-popup': 'linear-gradient(to bottom, rgba(20, 32, 26, 0.99), rgba(10, 20, 16, 0.99))',
                '--dnd-bg-item': 'rgba(255,255,255,0.05)',
                '--dnd-border-gold': '#5a8a6a',
                '--dnd-border-inner': '#2c4a3a',
                '--dnd-text-main': '#c0dcd0',
                '--dnd-text-header': '#cae6da',
                '--dnd-text-highlight': '#85ffb5',
                '--dnd-text-dim': '#6a8a7a',
                '--dnd-accent-red': '#8a4a4a',
                '--dnd-accent-green': '#3a8b5a',
                '--dnd-accent-blue': '#2c6c8a',
                '--dnd-shadow': '0 5px 20px rgba(0,20,10,0.8)'
            }
        },
        crimson: {
            name: '血色深渊',
            icon: '🔥',
            vars: {
                '--dnd-bg-main': '#120808',
                '--dnd-bg-panel': 'linear-gradient(to bottom, #2b1717, #1a0e0e)',
                '--dnd-bg-card': 'linear-gradient(135deg, #2e1c1c 0%, #1c0f0f 100%)',
                '--dnd-bg-hud': 'linear-gradient(to bottom, #2b1717, #1a0e0e)',
                '--dnd-bg-popup': 'linear-gradient(to bottom, rgba(32, 20, 20, 0.99), rgba(20, 10, 10, 0.99))',
                '--dnd-bg-item': 'rgba(255,200,200,0.03)',
                '--dnd-border-gold': '#8a5a5a',
                '--dnd-border-inner': '#4a2c2c',
                '--dnd-text-main': '#dcc0c0',
                '--dnd-text-header': '#e6cada',
                '--dnd-text-highlight': '#ff8585',
                '--dnd-text-dim': '#8a6a6a',
                '--dnd-accent-red': '#a82c2c',
                '--dnd-accent-green': '#4a6b4a',
                '--dnd-accent-blue': '#4a2c8a',
                '--dnd-shadow': '0 5px 20px rgba(20,0,0,0.8)'
            }
        },
        arcane: {
            name: '奥术塔楼',
            icon: '🔮',
            vars: {
                '--dnd-bg-main': '#0a0a14',
                '--dnd-bg-panel': 'linear-gradient(to bottom, #1a1a2e, #0e0e1a)',
                '--dnd-bg-card': 'linear-gradient(135deg, #1c1c2e 0%, #0f0f1c 100%)',
                '--dnd-bg-hud': 'linear-gradient(to bottom, #1a1a2e, #0e0e1a)',
                '--dnd-bg-popup': 'linear-gradient(to bottom, rgba(20, 20, 36, 0.99), rgba(10, 10, 20, 0.99))',
                '--dnd-bg-item': 'rgba(200,200,255,0.03)',
                '--dnd-border-gold': '#6a6a9d',
                '--dnd-border-inner': '#3a3a5a',
                '--dnd-text-main': '#c0c0dc',
                '--dnd-text-header': '#cacaE6',
                '--dnd-text-highlight': '#b585ff',
                '--dnd-text-dim': '#6a6a8a',
                '--dnd-accent-red': '#8a2c6c',
                '--dnd-accent-green': '#2c6b8a',
                '--dnd-accent-blue': '#3a5a8b',
                '--dnd-shadow': '0 5px 20px rgba(10,10,30,0.8)'
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
