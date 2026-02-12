// src/ui/DynamicBackground.js
// 动态背景效果模块 - 为DND仪表盘提供沉浸式背景动画
import { getCore } from '../core/Utils.js';
import { Logger } from '../core/Logger.js';

/**
 * DynamicBackground - 动态背景效果管理器
 * 支持多种效果：齿轮、波纹、粒子、魔法符文、星空等
 */
export const DynamicBackground = {
    // 当前活动的背景效果
    _activeEffects: new Map(),
    // Canvas 上下文缓存
    _canvasContexts: new Map(),
    // 动画帧ID
    _animationFrames: new Map(),
    // 效果配置
    _effectConfigs: {},

    /**
     * 效果预设配置
     */
    PRESETS: {
        // 机械齿轮效果 - 蒸汽朋克风格
        gears: {
            name: '机械齿轮',
            icon: '<i class="fa-solid fa-cog"></i>',
            description: '缓慢转动的齿轮，蒸汽朋克风格',
            gearCount: 5,
            colors: ['rgba(157, 139, 108, 0.3)', 'rgba(92, 75, 53, 0.25)', 'rgba(139, 119, 89, 0.2)'],
            speedMultiplier: 0.3,
            minSize: 40,
            maxSize: 120,
            teethCount: [8, 12, 16, 20, 24]
        },
        
        // 波纹效果 - 水波扩散
        ripples: {
            name: '水波纹',
            icon: '💧',
            description: '柔和的波纹扩散效果',
            rippleCount: 3,
            colors: ['rgba(157, 139, 108, 0.2)', 'rgba(255, 219, 133, 0.15)'],
            maxRadius: 200,
            speed: 0.5,
            interval: 3000
        },
        
        // 粒子效果 - 浮动光点
        particles: {
            name: '魔法粒子',
            icon: '<i class="fa-solid fa-bolt"></i>',
            description: '漂浮的魔法光点',
            particleCount: 30,
            colors: ['rgba(255, 219, 133, 0.8)', 'rgba(157, 139, 108, 0.6)', 'rgba(255, 255, 255, 0.5)'],
            minSize: 2,
            maxSize: 5,
            speed: 0.3,
            connectionDistance: 100,
            showConnections: true
        },
        
        // 魔法符文效果 - 神秘符号
        runes: {
            name: '魔法符文',
            icon: '🔯',
            description: '若隐若现的神秘符文',
            runeCount: 8,
            symbols: ['⚔', '🛡', '✧', '◈', '◇', '⬡', '⬢', '△', '▽', '☆', '★', '⚝', '✦', '❖'],
            colors: ['rgba(255, 219, 133, 0.3)', 'rgba(157, 139, 108, 0.25)'],
            rotateSpeed: 0.2,
            pulseSpeed: 0.02,
            fontSize: 28
        },
        
        // 星空效果 - 闪烁星星
        starfield: {
            name: '星空',
            icon: '🌌',
            description: '闪烁的星空背景',
            starCount: 50,
            colors: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 219, 133, 0.8)', 'rgba(200, 200, 255, 0.7)'],
            twinkleSpeed: 0.03,
            shootingStarChance: 0.001
        },
        
        // 流光效果 - 渐变色块移动
        gradient: {
            name: '流光溢彩',
            icon: '🌈',
            description: '柔和的渐变色块流动',
            blobCount: 4,
            colors: [
                'rgba(157, 139, 108, 0.2)',
                'rgba(92, 75, 53, 0.18)',
                'rgba(139, 69, 19, 0.15)',
                'rgba(255, 219, 133, 0.12)'
            ],
            speed: 0.2,
            blur: 60
        },
        
        // 网格效果 - 科技感网格
        grid: {
            name: '科技网格',
            icon: '🕸️',
            description: '带有脉冲效果的科技网格',
            gridSize: 30,
            lineColor: 'rgba(157, 139, 108, 0.2)',
            pulseColor: 'rgba(255, 219, 133, 0.5)',
            pulseSpeed: 0.5,
            pulseFrequency: 2000
        },
        
        // DNA双螺旋效果
        dna: {
            name: 'DNA螺旋',
            icon: '🧬',
            description: '旋转的双螺旋结构',
            helixCount: 2,
            pointsPerHelix: 20,
            colors: ['rgba(255, 219, 133, 0.6)', 'rgba(157, 139, 108, 0.5)'],
            rotationSpeed: 0.01,
            amplitude: 50,
            frequency: 0.1
        },

        // --- New Effects ---

        // 动感条纹 (Nier/Arknights)
        stripes: {
            name: '动感条纹',
            icon: '💈',
            description: '倾斜滚动的条纹背景',
            color: 'rgba(157, 139, 108, 0.15)',
            lineWidth: 20,
            gapWidth: 20,
            angle: -45, // degrees
            speed: 0.5
        },

        // 点阵矩阵 (MGS)
        dots: {
            name: '点阵矩阵',
            icon: '⠸',
            description: '规律排列的点阵背景',
            color: 'rgba(157, 139, 108, 0.3)',
            radius: 2.0,
            spacing: 20,
            speedX: 0.1, // Auto scroll speed
            speedY: 0.05
        },

        // 六边形网格 (Deus Ex)
        hex: {
            name: '六边形蜂巢',
            icon: '💠',
            description: '科技感六边形蜂巢网格',
            color: 'rgba(157, 139, 108, 0.15)',
            size: 15, // Hexagon radius
            strokeWidth: 1.5,
            speedY: 0.2
        },

        // 等高线 (Death Stranding)
        topo: {
            name: '地理等高线',
            icon: '<i class="fa-solid fa-map"></i>',
            description: '动态流动的地理等高线',
            color: 'rgba(157, 139, 108, 0.5)',
            lineCount: 10,
            speed: 0.2,
            amplitude: 20,
            frequency: 0.01
        },

        // 等轴网格 (Strategy UI)
        iso: {
            name: '等轴网格',
            icon: '🧊',
            description: '战术策略游戏的等轴视角网格',
            color: 'rgba(44, 76, 138, 0.25)',
            gridSize: 30, // vertical spacing
            speed: 0.5
        },

        // 雷达扫描 (Sonar)
        radar: {
            name: '雷达扫描',
            icon: '📡',
            description: '旋转扫描的雷达界面',
            gridColor: 'rgba(58, 107, 74, 0.2)',
            sweepColor: 'rgba(58, 107, 74, 0.5)',
            speed: 0.02, // radians per frame
            gridSize: 40
        },

        // 蓝图网格
        blueprint: {
            name: '工程蓝图',
            icon: '📐',
            description: '精细的工程设计蓝图网格',
            majorColor: 'rgba(44, 76, 138, 0.25)',
            minorColor: 'rgba(44, 76, 138, 0.15)',
            majorSize: 100,
            minorSize: 20,
            speed: 0.3
        },

        // 几何浮动 (Control)
        geo: {
            name: '几何浮动',
            icon: '🔷',
            description: '神秘漂浮的几何图形',
            count: 8,
            colors: ['rgba(157, 139, 108, 0.4)', 'rgba(255, 255, 255, 0.3)'],
            minSize: 30,
            maxSize: 80,
            speed: 0.1
        },

        // CRT 干扰
        crt: {
            name: 'CRT 信号',
            icon: '📺',
            description: '复古显示器的扫描线与噪点',
            scanlineColor: 'rgba(0, 0, 0, 0.3)',
            scanlineHeight: 4,
            noiseColor: 'rgba(255, 255, 255, 0.1)',
            flickerSpeed: 0.1
        }
    },

    /**
     * 初始化动态背景
     * @param {HTMLElement|string} container - 容器元素或选择器
     * @param {string} effectType - 效果类型
     * @param {Object} customConfig - 自定义配置（可选）
     * @returns {string} 效果实例ID
     */
    init(container, effectType = 'particles', customConfig = {}) {
        const { $ } = getCore();
        const $container = typeof container === 'string' ? $(container) : $(container);
        
        if (!$container.length) {
            Logger.warn('[DynamicBackground] Container not found:', container);
            return null;
        }

        // 生成唯一ID
        const effectId = `dnd-bg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 获取预设配置
        const preset = this.PRESETS[effectType] || this.PRESETS.particles;
        const config = { ...preset, ...customConfig, type: effectType };
        
        // 创建Canvas元素
        const canvas = document.createElement('canvas');
        canvas.id = effectId;
        canvas.className = 'dnd-dynamic-bg-canvas';
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;
        
        // 确保容器有定位上下文
        const position = $container.css('position');
        if (position === 'static') {
            $container.css('position', 'relative');
        }
        
        // 插入Canvas到容器开头
        $container.prepend(canvas);
        
        // 获取上下文
        const ctx = canvas.getContext('2d');
        
        // 调整Canvas尺寸
        this._resizeCanvas(canvas, $container[0]);
        
        // 存储配置
        this._effectConfigs[effectId] = config;
        this._canvasContexts.set(effectId, { canvas, ctx, container: $container[0] });
        
        // 初始化效果数据
        this._initEffectData(effectId, config);
        
        // 开始动画
        this._startAnimation(effectId);
        
        // 淡入显示
        setTimeout(() => {
            canvas.style.opacity = '1';
        }, 50);
        
        // 添加窗口resize监听
        const resizeHandler = () => this._resizeCanvas(canvas, $container[0]);
        window.addEventListener('resize', resizeHandler);
        this._activeEffects.set(effectId, { resizeHandler, config });
        
        Logger.debug('[DynamicBackground] Initialized effect:', effectType, 'with ID:', effectId);
        
        return effectId;
    },

    /**
     * 初始化效果数据
     */
    _initEffectData(effectId, config) {
        const { canvas } = this._canvasContexts.get(effectId);
        const width = canvas.width;
        const height = canvas.height;

        // 兼容 count 参数 (StylePresets 可能使用 count 而不是特定的 xxxCount)
        if (config.count !== undefined) {
            if (config.type === 'particles') config.particleCount = config.count;
            if (config.type === 'gears') config.gearCount = config.count;
            if (config.type === 'ripples') config.rippleCount = config.count;
            if (config.type === 'runes') config.runeCount = config.count;
            if (config.type === 'starfield') config.starCount = config.count;
            if (config.type === 'gradient') config.blobCount = config.count;
        }
        
        switch (config.type) {
            case 'gears':
                this._initGears(effectId, config, width, height);
                break;
            case 'ripples':
                this._initRipples(effectId, config, width, height);
                break;
            case 'particles':
                this._initParticles(effectId, config, width, height);
                break;
            case 'runes':
                this._initRunes(effectId, config, width, height);
                break;
            case 'starfield':
                this._initStarfield(effectId, config, width, height);
                break;
            case 'gradient':
                this._initGradient(effectId, config, width, height);
                break;
            case 'grid':
                this._initGrid(effectId, config, width, height);
                break;
            case 'dna':
                this._initDNA(effectId, config, width, height);
                break;
            
            // New Effects
            case 'stripes':
                this._effectConfigs[effectId].data = { offset: 0 };
                break;
            case 'dots':
                this._effectConfigs[effectId].data = { offsetX: 0, offsetY: 0 };
                break;
            case 'hex':
                this._effectConfigs[effectId].data = { scrollY: 0 };
                break;
            case 'topo':
                this._effectConfigs[effectId].data = { offset: 0 };
                break;
            case 'iso':
                this._effectConfigs[effectId].data = { scrollX: 0 };
                break;
            case 'radar':
                this._effectConfigs[effectId].data = { angle: 0 };
                break;
            case 'blueprint':
                this._effectConfigs[effectId].data = { offsetX: 0, offsetY: 0 };
                break;
            case 'geo':
                this._initGeo(effectId, config, width, height);
                break;
            case 'crt':
                this._effectConfigs[effectId].data = { time: 0 };
                break;
        }
    },

    _initGears(effectId, config, width, height) {
        const gears = [];
        for (let i = 0; i < config.gearCount; i++) {
            gears.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: config.minSize + Math.random() * (config.maxSize - config.minSize),
                teeth: config.teethCount[Math.floor(Math.random() * config.teethCount.length)],
                rotation: Math.random() * Math.PI * 2,
                speed: (Math.random() - 0.5) * 0.02 * config.speedMultiplier,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                direction: Math.random() > 0.5 ? 1 : -1
            });
        }
        this._effectConfigs[effectId].data = { gears };
    },

    _initRipples(effectId, config, width, height) {
        const ripples = [];
        const createRipple = () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 0,
            maxRadius: config.maxRadius * (0.5 + Math.random() * 0.5),
            opacity: 0.5,
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            speed: config.speed * (0.8 + Math.random() * 0.4)
        });
        
        for (let i = 0; i < config.rippleCount; i++) {
            const ripple = createRipple();
            ripple.radius = Math.random() * config.maxRadius;
            ripples.push(ripple);
        }
        
        this._effectConfigs[effectId].data = { ripples, createRipple };
        
        const intervalId = setInterval(() => {
            if (ripples.length < config.rippleCount * 2) {
                ripples.push(createRipple());
            }
        }, config.interval);
        
        this._effectConfigs[effectId].intervalId = intervalId;
    },

    _initParticles(effectId, config, width, height) {
        const particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * config.speed,
                vy: (Math.random() - 0.5) * config.speed,
                size: config.minSize + Math.random() * (config.maxSize - config.minSize),
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                alpha: 0.3 + Math.random() * 0.7
            });
        }
        this._effectConfigs[effectId].data = { particles };
    },

    _initRunes(effectId, config, width, height) {
        const runes = [];
        for (let i = 0; i < config.runeCount; i++) {
            runes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                symbol: config.symbols[Math.floor(Math.random() * config.symbols.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * config.rotateSpeed,
                scale: 0.5 + Math.random() * 1,
                alpha: 0,
                alphaDirection: 1,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                fontSize: config.fontSize * (0.5 + Math.random())
            });
        }
        this._effectConfigs[effectId].data = { runes };
    },

    _initStarfield(effectId, config, width, height) {
        const stars = [];
        for (let i = 0; i < config.starCount; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 0.5 + Math.random() * 2,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                alpha: Math.random(),
                alphaSpeed: (Math.random() - 0.5) * config.twinkleSpeed,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
        this._effectConfigs[effectId].data = { stars, shootingStars: [] };
    },

    _initGradient(effectId, config, width, height) {
        const blobs = [];
        for (let i = 0; i < config.blobCount; i++) {
            blobs.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 50 + Math.random() * 100,
                vx: (Math.random() - 0.5) * config.speed,
                vy: (Math.random() - 0.5) * config.speed,
                color: config.colors[i % config.colors.length]
            });
        }
        this._effectConfigs[effectId].data = { blobs };
    },

    _initGrid(effectId, config, width, height) {
        const pulses = [];
        this._effectConfigs[effectId].data = { pulses, lastPulseTime: 0 };
    },

    _initDNA(effectId, config, width, height) {
        this._effectConfigs[effectId].data = {
            rotation: 0,
            time: 0
        };
    },

    _initGeo(effectId, config, width, height) {
        const shapes = [];
        for (let i = 0; i < config.count; i++) {
            shapes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: config.minSize + Math.random() * (config.maxSize - config.minSize),
                vx: (Math.random() - 0.5) * config.speed,
                vy: (Math.random() - 0.5) * config.speed,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                rotation: Math.random() * 360,
                rotateSpeed: (Math.random() - 0.5) * 0.5,
                type: Math.random() > 0.5 ? 'square' : 'circle'
            });
        }
        this._effectConfigs[effectId].data = { shapes };
    },

    /**
     * 开始动画循环
     */
    _startAnimation(effectId) {
        const config = this._effectConfigs[effectId];
        const context = this._canvasContexts.get(effectId);
        
        if (!config || !context) return;
        
        const animate = () => {
            this._renderFrame(effectId);
            this._animationFrames.set(effectId, requestAnimationFrame(animate));
        };
        
        animate();
    },

    /**
     * 渲染单帧
     */
    _renderFrame(effectId) {
        const config = this._effectConfigs[effectId];
        const context = this._canvasContexts.get(effectId);
        
        if (!config || !context) return;
        
        const { canvas, ctx } = context;
        const width = canvas.width;
        const height = canvas.height;
        
        try {
            ctx.clearRect(0, 0, width, height);
            
            // 根据效果类型渲染
            switch (config.type) {
                case 'gears':
                    this._renderGears(ctx, config, width, height);
                    break;
                case 'ripples':
                    this._renderRipples(ctx, config, width, height);
                    break;
                case 'particles':
                    this._renderParticles(ctx, config, width, height);
                    break;
                case 'runes':
                    this._renderRunes(ctx, config, width, height);
                    break;
                case 'starfield':
                    this._renderStarfield(ctx, config, width, height);
                    break;
                case 'gradient':
                    this._renderGradient(ctx, config, width, height);
                    break;
                case 'grid':
                    this._renderGrid(ctx, config, width, height);
                    break;
                case 'dna':
                    this._renderDNA(ctx, config, width, height);
                    break;
                
                // New Effects
                case 'stripes':
                    this._renderStripes(ctx, config, width, height);
                    break;
                case 'dots':
                    this._renderDots(ctx, config, width, height);
                    break;
                case 'hex':
                    this._renderHex(ctx, config, width, height);
                    break;
                case 'topo':
                    this._renderTopo(ctx, config, width, height);
                    break;
                case 'iso':
                    this._renderIso(ctx, config, width, height);
                    break;
                case 'radar':
                    this._renderRadar(ctx, config, width, height);
                    break;
                case 'blueprint':
                    this._renderBlueprint(ctx, config, width, height);
                    break;
                case 'geo':
                    this._renderGeo(ctx, config, width, height);
                    break;
                case 'crt':
                    this._renderCRT(ctx, config, width, height);
                    break;
            }
        } catch (e) {
            console.error('[DynamicBackground] Render error:', e);
            // Don't crash the loop, just log
        }
    },
    
    /**
     * 辅助方法：安全设置颜色透明度
     */
    _setAlpha(color, alpha) {
        if (!color) return `rgba(255, 255, 255, ${alpha})`;
        
        // Hex (e.g. #FFF or #FFFFFF)
        if (color.startsWith('#')) {
            let r = 0, g = 0, b = 0;
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
            } else if (color.length === 7) {
                r = parseInt(color.slice(1, 3), 16);
                g = parseInt(color.slice(3, 5), 16);
                b = parseInt(color.slice(5, 7), 16);
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // RGBA
        if (color.startsWith('rgba')) {
            return color.replace(/[\d.]+\)$/, `${alpha})`);
        }
        
        // RGB
        if (color.startsWith('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        
        return color;
    },

    // --- Existing Render Methods ---
    _renderGears(ctx, config, width, height) {
        const { gears } = config.data;
        gears.forEach(gear => {
            gear.rotation += gear.speed * gear.direction;
            ctx.save();
            ctx.translate(gear.x, gear.y);
            ctx.rotate(gear.rotation);
            ctx.beginPath();
            ctx.strokeStyle = gear.color;
            ctx.lineWidth = 2;
            const innerRadius = gear.radius * 0.6;
            const outerRadius = gear.radius;
            const toothHeight = gear.radius * 0.15;
            for (let i = 0; i < gear.teeth; i++) {
                const angle = (i / gear.teeth) * Math.PI * 2;
                const nextAngle = ((i + 0.5) / gear.teeth) * Math.PI * 2;
                const x1 = Math.cos(angle) * innerRadius;
                const y1 = Math.sin(angle) * innerRadius;
                const x2 = Math.cos(angle) * (outerRadius + toothHeight);
                const y2 = Math.sin(angle) * (outerRadius + toothHeight);
                const x3 = Math.cos(nextAngle) * (outerRadius + toothHeight);
                const y3 = Math.sin(nextAngle) * (outerRadius + toothHeight);
                const x4 = Math.cos(nextAngle) * innerRadius;
                const y4 = Math.sin(nextAngle) * innerRadius;
                if (i === 0) ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.lineTo(x4, y4);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, innerRadius * 0.3, 0, Math.PI * 2);
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * innerRadius * 0.3, Math.sin(angle) * innerRadius * 0.3);
                ctx.lineTo(Math.cos(angle) * innerRadius * 0.9, Math.sin(angle) * innerRadius * 0.9);
                ctx.stroke();
            }
            ctx.restore();
        });
    },

    _renderRipples(ctx, config, width, height) {
        const { ripples } = config.data;
        if (!ripples) return;
        
        for (let i = ripples.length - 1; i >= 0; i--) {
            const ripple = ripples[i];
            ripple.radius += ripple.speed;
            ripple.opacity = 1 - (ripple.radius / ripple.maxRadius);
            if (ripple.radius >= ripple.maxRadius) {
                ripples.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this._setAlpha(ripple.color, ripple.opacity * 0.8);
            ctx.lineWidth = 2;
            ctx.stroke();
            if (ripple.radius > 20) {
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
                ctx.strokeStyle = this._setAlpha(ripple.color, ripple.opacity * 0.5);
                ctx.stroke();
            }
        }
    },

    _renderParticles(ctx, config, width, height) {
        const { particles } = config.data;
        if (!particles) return;
        
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            // Glow effect
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            gradient.addColorStop(0, this._setAlpha(p.color, 0.6));
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
        
        if (config.showConnections) {
            // Default connection color
            const baseColor = config.colors && config.colors.length > 0 ? config.colors[0] : 'rgba(157, 139, 108, 1)';
            
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < config.connectionDistance) {
                        const opacity = 1 - (dist / config.connectionDistance);
                        ctx.strokeStyle = this._setAlpha(baseColor, opacity * 0.3);
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }
    },

    _renderRunes(ctx, config, width, height) {
        const { runes } = config.data;
        if (!runes) return;
        
        runes.forEach(rune => {
            rune.alpha += rune.alphaDirection * config.pulseSpeed;
            if (rune.alpha >= 1) {
                rune.alpha = 1;
                rune.alphaDirection = -1;
            } else if (rune.alpha <= 0) {
                rune.alpha = 0;
                rune.alphaDirection = 1;
                rune.x = Math.random() * width;
                rune.y = Math.random() * height;
                rune.symbol = config.symbols[Math.floor(Math.random() * config.symbols.length)];
            }
            rune.rotation += rune.rotationSpeed;
            ctx.save();
            ctx.translate(rune.x, rune.y);
            ctx.rotate(rune.rotation);
            ctx.scale(rune.scale, rune.scale);
            ctx.font = `${rune.fontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this._setAlpha(rune.color, rune.alpha * 0.8);
            ctx.fillText(rune.symbol, 0, 0);
            ctx.shadowColor = 'rgba(255, 219, 133, 0.7)';
            ctx.shadowBlur = 10 * rune.alpha;
            ctx.fillText(rune.symbol, 0, 0);
            ctx.restore();
        });
    },

    _renderStarfield(ctx, config, width, height) {
        const { stars, shootingStars } = config.data;
        if (!stars) return;
        
        stars.forEach(star => {
            star.twinklePhase += config.twinkleSpeed;
            star.alpha = 0.5 + Math.sin(star.twinklePhase) * 0.3 + 0.2;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = this._setAlpha(star.color, star.alpha);
            ctx.fill();
        });
        if (Math.random() < config.shootingStarChance) {
            shootingStars.push({
                x: Math.random() * width,
                y: 0,
                length: 50 + Math.random() * 100,
                speed: 5 + Math.random() * 10,
                angle: Math.PI / 4 + Math.random() * Math.PI / 4,
                alpha: 1
            });
        }
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const ss = shootingStars[i];
            ss.x += Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.alpha -= 0.02;
            if (ss.alpha <= 0 || ss.x > width || ss.y > height) {
                shootingStars.splice(i, 1);
                continue;
            }
            const gradient = ctx.createLinearGradient(
                ss.x, ss.y,
                ss.x - Math.cos(ss.angle) * ss.length,
                ss.y - Math.sin(ss.angle) * ss.length
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${ss.alpha})`);
            gradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(
                ss.x - Math.cos(ss.angle) * ss.length,
                ss.y - Math.sin(ss.angle) * ss.length
            );
            ctx.stroke();
        }
    },

    _renderGradient(ctx, config, width, height) {
        const { blobs } = config.data;
        ctx.filter = `blur(${config.blur}px)`;
        blobs.forEach(blob => {
            blob.x += blob.vx;
            blob.y += blob.vy;
            if (blob.x < -blob.radius || blob.x > width + blob.radius) blob.vx *= -1;
            if (blob.y < -blob.radius || blob.y > height + blob.radius) blob.vy *= -1;
            const gradient = ctx.createRadialGradient(
                blob.x, blob.y, 0,
                blob.x, blob.y, blob.radius
            );
            gradient.addColorStop(0, blob.color);
            gradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
        ctx.filter = 'none';
    },

    _renderGrid(ctx, config, width, height) {
        const { pulses } = config.data;
        if (!pulses) return;

        const now = Date.now();
        ctx.strokeStyle = config.lineColor;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= width; x += config.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += config.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        if (now - (config.data.lastPulseTime || 0) > config.pulseFrequency) {
            pulses.push({
                x: Math.floor(Math.random() * (width / config.gridSize)) * config.gridSize,
                y: Math.floor(Math.random() * (height / config.gridSize)) * config.gridSize,
                radius: 0,
                maxRadius: Math.min(width, height) * 0.3,
                alpha: 1
            });
            config.data.lastPulseTime = now;
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
            const pulse = pulses[i];
            pulse.radius += config.pulseSpeed * 2;
            pulse.alpha = 1 - (pulse.radius / pulse.maxRadius);
            if (pulse.radius >= pulse.maxRadius) {
                pulses.splice(i, 1);
                continue;
            }
            const affectedRadius = pulse.radius;
            ctx.strokeStyle = this._setAlpha(config.pulseColor, pulse.alpha * 0.8);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pulse.x, pulse.y, affectedRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    },

    _renderDNA(ctx, config, width, height) {
        const { data } = config;
        data.time += config.rotationSpeed;
        const centerX = width / 2;
        ctx.strokeStyle = config.colors[0];
        ctx.lineWidth = 2;
        for (let helix = 0; helix < config.helixCount; helix++) {
            const phaseOffset = helix * Math.PI;
            ctx.beginPath();
            for (let i = 0; i <= config.pointsPerHelix; i++) {
                const t = i / config.pointsPerHelix;
                const y = height * 0.1 + t * height * 0.8;
                const x = centerX + Math.sin(t * config.frequency * Math.PI * 2 + data.time + phaseOffset) * config.amplitude;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.strokeStyle = config.colors[helix % config.colors.length];
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(157, 139, 108, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < config.pointsPerHelix; i += 2) {
            const t = i / config.pointsPerHelix;
            const y = height * 0.1 + t * height * 0.8;
            const x1 = centerX + Math.sin(t * config.frequency * Math.PI * 2 + data.time) * config.amplitude;
            const x2 = centerX + Math.sin(t * config.frequency * Math.PI * 2 + data.time + Math.PI) * config.amplitude;
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
        }
    },

    // --- New Render Methods ---

    _renderStripes(ctx, config, width, height) {
        const { data } = config;
        data.offset = (data.offset + config.speed) % (config.lineWidth + config.gapWidth);

        ctx.save();
        // Create rotation pattern
        // It's easier to rotate the context and draw horizontal lines covering the screen
        const diag = Math.sqrt(width*width + height*height);
        
        ctx.translate(width/2, height/2);
        ctx.rotate(config.angle * Math.PI / 180);
        ctx.translate(-diag, -diag); // Move to cover full rotation

        ctx.fillStyle = config.color;
        
        const totalWidth = config.lineWidth + config.gapWidth;
        const count = Math.ceil((diag * 2) / totalWidth);

        for (let i = 0; i < count; i++) {
            const x = i * totalWidth + data.offset;
            ctx.fillRect(x, 0, config.lineWidth, diag * 2);
        }
        ctx.restore();
    },

    _renderDots(ctx, config, width, height) {
        const { data } = config;
        data.offsetX = (data.offsetX + config.speedX) % config.spacing;
        data.offsetY = (data.offsetY + config.speedY) % config.spacing;

        ctx.fillStyle = config.color;
        
        for (let x = -config.spacing; x < width + config.spacing; x += config.spacing) {
            for (let y = -config.spacing; y < height + config.spacing; y += config.spacing) {
                ctx.beginPath();
                ctx.arc(
                    x + data.offsetX,
                    y + data.offsetY,
                    config.radius,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    },

    _renderHex(ctx, config, width, height) {
        const { data } = config;
        data.scrollY = (data.scrollY + config.speedY) % (config.size * Math.sqrt(3));
        
        const r = config.size;
        const h = r * Math.sqrt(3);
        const w = r * 2;
        const xDist = w * 0.75;
        
        ctx.strokeStyle = config.color;
        ctx.lineWidth = config.strokeWidth;
        
        const cols = Math.ceil(width / xDist) + 1;
        const rows = Math.ceil(height / h) + 2;

        const drawHex = (x, y) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i;
                const hx = x + r * Math.cos(angle);
                const hy = y + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.stroke();
        };

        for (let col = -1; col < cols; col++) {
            for (let row = -1; row < rows; row++) {
                let x = col * xDist;
                let y = row * h + data.scrollY;
                if (col % 2 !== 0) {
                    y += h / 2;
                }
                drawHex(x, y);
            }
        }
    },

    _renderTopo(ctx, config, width, height) {
        const { data } = config;
        data.offset += config.frequency;

        ctx.strokeStyle = config.color;
        ctx.lineWidth = 1;

        for (let i = 0; i < config.lineCount; i++) {
            ctx.beginPath();
            const yBase = height / 2 + (i - config.lineCount / 2) * 30; // Spread vertically
            
            for (let x = 0; x <= width; x += 10) {
                // Complex wave function for topographic look
                const y = yBase + 
                    Math.sin((x + data.offset * 1000) * 0.01 + i) * config.amplitude +
                    Math.cos((x - data.offset * 500) * 0.02) * (config.amplitude / 2);
                
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    },

    _renderIso(ctx, config, width, height) {
        const { data } = config;
        data.scrollX = (data.scrollX + config.speed) % (config.gridSize * 2); // Approximation

        ctx.strokeStyle = config.color;
        ctx.lineWidth = 1;
        
        // Isometric is 30 degrees
        // Drawing lines at 30 deg and 150 deg (-30 deg)
        const gridSize = config.gridSize;
        const diag = Math.sqrt(width*width + height*height);
        
        ctx.save();
        
        // Grid 1
        ctx.beginPath();
        const steps = Math.ceil(diag / gridSize) * 2;
        
        // Shift context to handle scroll
        // This is a simplified "scrolling grid" effect
        
        // Draw lines angled 30 deg
        for(let i = -steps; i < steps; i++) {
            const offset = i * gridSize + data.scrollX;
            // y = tan(30) * x + c => y = 0.577x + c
            // We draw lines across the screen
            // Start point (0, offset), End point (width, width * 0.577 + offset)
            ctx.moveTo(0, offset);
            ctx.lineTo(width, width * Math.tan(30 * Math.PI / 180) + offset);
        }
        
        // Draw lines angled -30 deg
        for(let i = -steps; i < steps; i++) {
            const offset = i * gridSize; // Fixed vertical relative to scroll? Or move opposite?
            // Let's scroll horizontal only for simple effect
             ctx.moveTo(0, offset);
            ctx.lineTo(width, -width * Math.tan(30 * Math.PI / 180) + offset);
        }
        ctx.stroke();
        ctx.restore();
    },

    _renderRadar(ctx, config, width, height) {
        const { data } = config;
        data.angle = (data.angle + config.speed) % (Math.PI * 2);
        
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.max(width, height) * 0.8;
        
        // Draw Rings
        ctx.strokeStyle = config.gridColor;
        ctx.lineWidth = 1;
        for (let r = config.gridSize; r < maxRadius; r += config.gridSize) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw Crosshair
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
        ctx.moveTo(0, cy); ctx.lineTo(width, cy);
        ctx.stroke();
        
        // Draw Sweep
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(data.angle);
        
        // Conic gradient sweep
        try {
            const gradient = ctx.createConicGradient(0, 0, 0); // Start angle 0
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.8, 'transparent');
            gradient.addColorStop(1, config.sweepColor);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
            ctx.fill();
        } catch (e) {
            // Fallback for browsers not supporting createConicGradient
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.arc(0, 0, maxRadius, -0.5, 0); // Wedge
            ctx.fillStyle = config.sweepColor;
            ctx.globalAlpha = 0.3;
            ctx.fill();
        }
        
        ctx.restore();
    },

    _renderBlueprint(ctx, config, width, height) {
        const { data } = config;
        data.offsetX = (data.offsetX + config.speed) % config.majorSize;
        data.offsetY = (data.offsetY + config.speed) % config.majorSize;
        
        const drawGrid = (size, color, lw) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            
            // Calculate shift for sub-grids
            // If main grid moves by speed, subgrid should move too. 
            // We use same offset for both to keep them aligned.
            const shiftX = data.offsetX % size;
            const shiftY = data.offsetY % size;

            ctx.beginPath();
            for (let x = -size; x <= width + size; x += size) {
                ctx.moveTo(x + shiftX, 0);
                ctx.lineTo(x + shiftX, height);
            }
            for (let y = -size; y <= height + size; y += size) {
                ctx.moveTo(0, y + shiftY);
                ctx.lineTo(width, y + shiftY);
            }
            ctx.stroke();
        };

        // Minor grid
        drawGrid(config.minorSize, config.minorColor, 0.5);
        // Major grid
        drawGrid(config.majorSize, config.majorColor, 1);
    },

    _renderGeo(ctx, config, width, height) {
        const { shapes } = config.data;
        
        shapes.forEach(shape => {
            shape.x += shape.vx;
            shape.y += shape.vy;
            shape.rotation += shape.rotateSpeed;
            
            if (shape.x < -shape.size) shape.x = width + shape.size;
            if (shape.x > width + shape.size) shape.x = -shape.size;
            if (shape.y < -shape.size) shape.y = height + shape.size;
            if (shape.y > height + shape.size) shape.y = -shape.size;
            
            ctx.save();
            ctx.translate(shape.x, shape.y);
            ctx.rotate(shape.rotation * Math.PI / 180);
            
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            if (shape.type === 'square') {
                ctx.rect(-shape.size/2, -shape.size/2, shape.size, shape.size);
            } else {
                ctx.arc(0, 0, shape.size/2, 0, Math.PI * 2);
            }
            
            ctx.stroke();
            ctx.restore();
        });
    },

    _renderCRT(ctx, config, width, height) {
        const { data } = config;
        data.time += config.flickerSpeed;
        
        // Scanlines
        ctx.fillStyle = config.scanlineColor;
        for (let y = 0; y < height; y += config.scanlineHeight * 2) {
            ctx.fillRect(0, y, width, config.scanlineHeight);
        }
        
        // Noise (simplified)
        // Drawing noise pixel by pixel is too slow.
        // We draw random thin lines or rectangles.
        ctx.fillStyle = config.noiseColor;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const w = Math.random() * 100;
            const h = 2;
            ctx.fillRect(x, y, w, h);
        }
        
        // Flicker overlay
        const opacity = 0.05 + Math.sin(data.time * 10) * 0.02;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(0, 0, width, height);
    },

    /**
     * 调整Canvas尺寸
     */
    _resizeCanvas(canvas, container) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    },

    /**
     * 停止并移除效果
     * @param {string} effectId - 效果实例ID
     */
    destroy(effectId) {
        const effect = this._activeEffects.get(effectId);
        const context = this._canvasContexts.get(effectId);
        const config = this._effectConfigs[effectId];
        
        if (effect) {
            window.removeEventListener('resize', effect.resizeHandler);
            this._activeEffects.delete(effectId);
        }
        
        if (config && config.intervalId) {
            clearInterval(config.intervalId);
        }
        
        const frameId = this._animationFrames.get(effectId);
        if (frameId) {
            cancelAnimationFrame(frameId);
            this._animationFrames.delete(effectId);
        }
        
        if (context) {
            context.canvas.style.opacity = '0';
            setTimeout(() => {
                context.canvas.remove();
            }, 500);
            this._canvasContexts.delete(effectId);
        }
        
        delete this._effectConfigs[effectId];
        
        Logger.debug('[DynamicBackground] Destroyed effect:', effectId);
    },

    /**
     * 销毁所有效果
     */
    destroyAll() {
        const effectIds = [...this._activeEffects.keys()];
        effectIds.forEach(id => this.destroy(id));
    },

    /**
     * 切换效果类型和配置
     * @param {string} effectId - 效果实例ID
     * @param {string} newType - 新的效果类型
     * @param {Object} customConfig - 自定义配置（可选，包含颜色等）
     */
    switchEffect(effectId, newType, customConfig = {}) {
        const context = this._canvasContexts.get(effectId);
        if (!context) return;
        
        const config = this._effectConfigs[effectId];
        
        // 清除旧的interval
        if (config && config.intervalId) {
            clearInterval(config.intervalId);
        }
        
        // 获取预设并合并自定义配置
        // 注意：customConfig 中的 colors 等属性会覆盖预设
        const preset = this.PRESETS[newType] || this.PRESETS.particles;
        const newConfig = { ...preset, ...customConfig, type: newType };
        
        this._effectConfigs[effectId] = newConfig;
        
        // 重新初始化数据
        this._initEffectData(effectId, newConfig);
        
        Logger.debug('[DynamicBackground] Switched effect to:', newType, 'with config:', customConfig);
    },

    /**
     * 获取所有可用的效果类型
     */
    getAvailableEffects() {
        return Object.entries(this.PRESETS).map(([key, value]) => ({
            id: key,
            name: value.name,
            icon: value.icon,
            description: value.description
        }));
    }
};

export default DynamicBackground;
