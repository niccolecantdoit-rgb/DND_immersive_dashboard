
import { getCore } from '../../core/Utils.js';
import { DataManager } from '../../data/DataManager.js';
import { DiceManager } from '../../data/DiceManager.js';
import { Logger } from '../../core/Logger.js';
import { DBAdapter } from '../../core/DBAdapter.js';

// 表格管理器样式
const TABLE_MANAGER_STYLES = `
<style id="dnd-table-manager-styles">
    /* 表格按钮样式 */
    .dnd-tm-table-btn {
        padding: 6px 12px;
        border: 1px solid #444;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        background: linear-gradient(135deg, #2a2a2c 0%, #1f1f21 100%);
        color: #ccc;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
        position: relative;
        overflow: hidden;
    }
    
    .dnd-tm-table-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        transition: left 0.4s ease;
    }
    
    .dnd-tm-table-btn:hover {
        background: linear-gradient(135deg, #3a3a3c 0%, #2a2a2c 100%);
        border-color: var(--dnd-border-gold);
        color: #fff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(var(--dnd-gold-rgb, 212,175,55), 0.15);
    }
    
    .dnd-tm-table-btn:hover::before {
        left: 100%;
    }
    
    .dnd-tm-table-btn:active {
        transform: translateY(0) scale(0.98);
        transition-duration: 0.1s;
    }
    
    .dnd-tm-table-btn.active {
        background: linear-gradient(135deg, var(--dnd-border-gold) 0%, #a08030 100%);
        color: #000;
        border-color: var(--dnd-border-gold);
        box-shadow: 0 0 15px rgba(var(--dnd-gold-rgb, 212,175,55), 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
        font-weight: 600;
    }
    
    .dnd-tm-table-btn.active:hover {
        background: linear-gradient(135deg, #e0c060 0%, var(--dnd-border-gold) 100%);
    }
    
    /* 卡片容器动画 */
    .dnd-tm-cards-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-content: flex-start;
        justify-content: center;
        min-height: 100px;
        padding: 5px;
    }
    
    /* 卡片样式 */
    .dnd-tm-card {
        width: 100%;
        max-width: 320px;
        flex: 1 1 280px;
        background: linear-gradient(145deg, #2a2a2c 0%, #1a1a1c 50%, #151517 100%);
        border: 1px solid rgba(100,100,100,0.3);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        margin: 2px;
        position: relative;
        overflow: hidden;
        animation: cardSlideIn 0.3s ease-out forwards;
        opacity: 0;
        transform: translateY(10px);
    }
    
    @keyframes cardSlideIn {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .dnd-tm-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--dnd-border-gold), transparent);
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .dnd-tm-card:hover {
        border-color: var(--dnd-border-gold);
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 25px rgba(var(--dnd-gold-rgb, 212,175,55), 0.1);
    }
    
    .dnd-tm-card:hover::before {
        opacity: 1;
    }
    
    /* 卡片标题 */
    .dnd-tm-card-header {
        font-weight: bold;
        color: var(--dnd-text-highlight);
        border-bottom: 1px solid rgba(100,100,100,0.3);
        padding-bottom: 8px;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .dnd-tm-card-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 70%;
        font-size: 14px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }
    
    /* 保存按钮 */
    .dnd-tm-save-btn {
        background: linear-gradient(135deg, var(--dnd-accent-green, #4CAF50) 0%, #388E3C 100%);
        color: #fff;
        border: none;
        border-radius: 5px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .dnd-tm-save-btn:hover {
        background: linear-gradient(135deg, #5CBF60 0%, #4CAF50 100%);
        transform: scale(1.05);
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    }
    
    .dnd-tm-save-btn:active {
        transform: scale(0.95);
    }
    
    .dnd-tm-save-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }
    
    /* 字段容器 */
    .dnd-tm-fields {
        max-height: 220px;
        overflow-y: auto;
        padding-right: 5px;
    }
    
    .dnd-tm-fields::-webkit-scrollbar {
        width: 4px;
    }
    
    .dnd-tm-fields::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.2);
        border-radius: 2px;
    }
    
    .dnd-tm-fields::-webkit-scrollbar-thumb {
        background: rgba(var(--dnd-gold-rgb, 212,175,55), 0.3);
        border-radius: 2px;
    }
    
    /* 字段项 */
    .dnd-tm-field-item {
        margin-bottom: 10px;
        animation: fieldFadeIn 0.2s ease-out forwards;
        opacity: 0;
    }
    
    @keyframes fieldFadeIn {
        to { opacity: 1; }
    }
    
    .dnd-tm-field-label {
        font-size: 11px;
        color: #888;
        margin-bottom: 3px;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .dnd-tm-field-label::before {
        content: '';
        width: 3px;
        height: 10px;
        background: var(--dnd-border-gold);
        border-radius: 1px;
        opacity: 0.6;
    }
    
    /* 输入框 */
    .dnd-tm-input {
        width: 100%;
        background: rgba(0,0,0,0.3);
        border: 1px solid #444;
        border-bottom: 2px solid #555;
        color: var(--dnd-text-main);
        font-size: 13px;
        padding: 6px 8px;
        border-radius: 5px;
        transition: all 0.25s;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
    }
    
    .dnd-tm-input:hover {
        border-color: #666;
        background: rgba(0,0,0,0.35);
    }
    
    .dnd-tm-input:focus {
        outline: none;
        border-color: var(--dnd-text-highlight);
        border-bottom-color: var(--dnd-text-highlight);
        background: rgba(0,0,0,0.4);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 10px rgba(var(--dnd-gold-rgb, 212,175,55), 0.1);
    }
    
    /* 空状态提示 */
    .dnd-tm-empty-state {
        color: #666;
        width: 100%;
        text-align: center;
        margin-top: 30px;
        font-size: 14px;
    }
    
    .dnd-tm-empty-state i {
        display: block;
        font-size: 32px;
        margin-bottom: 10px;
        opacity: 0.5;
    }
    
    /* ========== 搜索栏样式 ========== */
    .dnd-tm-toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.25) 100%);
        border-radius: 8px;
        margin-bottom: 12px;
        border: 1px solid rgba(100,100,100,0.2);
    }
    
    .dnd-tm-search-wrapper {
        flex: 1;
        min-width: 150px;
        max-width: 280px;
        display: flex;
        align-items: center;
        background: rgba(0,0,0,0.4);
        border: 1px solid #3a3a3c;
        border-radius: 6px;
        padding: 7px 12px;
        transition: all 0.25s;
    }
    
    .dnd-tm-search-wrapper:focus-within {
        border-color: var(--dnd-border-gold);
        background: rgba(0,0,0,0.5);
        box-shadow: 0 0 10px rgba(var(--dnd-gold-rgb, 212,175,55), 0.2);
    }
    
    .dnd-tm-search-wrapper i {
        color: #777;
        margin-right: 8px;
        font-size: 13px;
    }
    
    .dnd-tm-search-input {
        flex: 1;
        background: transparent !important;
        border: none !important;
        color: var(--dnd-text-main, #ccc) !important;
        outline: none !important;
        font-size: 13px;
        box-shadow: none !important;
    }
    
    .dnd-tm-search-input::placeholder {
        color: #666;
    }
    
    .dnd-tm-search-clear {
        background: transparent;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 16px;
        padding: 2px 6px;
        transition: all 0.2s;
        display: none;
        border-radius: 3px;
    }
    
    .dnd-tm-search-clear:hover {
        color: #e74c3c;
        background: rgba(231, 76, 60, 0.15);
    }
    
    .dnd-tm-search-clear.visible {
        display: block;
    }
    
    .dnd-tm-search-count {
        color: #888;
        font-size: 11px;
        white-space: nowrap;
        padding: 4px 8px;
        background: rgba(0,0,0,0.2);
        border-radius: 4px;
    }
    
    .dnd-tm-toolbar-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
    }
    
    /* ========== 布局切换按钮 ========== */
    .dnd-tm-layout-btn {
        background: linear-gradient(135deg, #2a2a2c 0%, #1f1f21 100%);
        border: 1px solid #3a3a3c;
        color: #999;
        padding: 7px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.25s;
        font-size: 13px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .dnd-tm-layout-btn:hover {
        border-color: var(--dnd-border-gold);
        color: var(--dnd-text-highlight);
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
    }
    
    .dnd-tm-layout-btn.active {
        background: linear-gradient(135deg, rgba(var(--dnd-gold-rgb, 212,175,55), 0.25) 0%, rgba(var(--dnd-gold-rgb, 212,175,55), 0.15) 100%);
        border-color: var(--dnd-border-gold);
        color: var(--dnd-text-highlight);
    }
    
    /* ========== 新增按钮 ========== */
    .dnd-tm-add-btn {
        background: linear-gradient(135deg, var(--dnd-accent-green, #4CAF50) 0%, #388E3C 100%);
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 7px 14px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.25s;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
    }
    
    .dnd-tm-add-btn:hover {
        background: linear-gradient(135deg, #5CBF60 0%, var(--dnd-accent-green, #4CAF50) 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    
    .dnd-tm-add-btn:active {
        transform: translateY(0) scale(0.98);
    }
    
    .dnd-tm-add-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        background: #444;
    }
    
    /* ========== 删除按钮 ========== */
    .dnd-tm-delete-btn {
        background: transparent;
        color: #888;
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
        border-radius: 4px;
    }
    
    .dnd-tm-delete-btn:hover {
        background: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
    }
    
    .dnd-tm-card-actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    /* ========== 确认对话框 ========== */
    .dnd-tm-dialog-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0,0,0,0.7) !important;
        z-index: 2147483650 !important;
        animation: dialogFadeIn 0.2s ease-out;
    }
    
    @keyframes dialogFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .dnd-tm-dialog {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background: linear-gradient(145deg, #2a2a2c 0%, #1a1a1c 100%);
        border: 1px solid #444;
        border-radius: 10px;
        padding: 20px;
        min-width: 280px;
        max-width: 90vw;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        z-index: 2147483651 !important;
        animation: dialogSlideIn 0.2s ease-out;
    }
    
    @keyframes dialogSlideIn {
        from { transform: translate(-50%, -50%) translateY(-20px); opacity: 0; }
        to { transform: translate(-50%, -50%) translateY(0); opacity: 1; }
    }
    
    .dnd-tm-dialog-title {
        font-size: 16px;
        font-weight: bold;
        color: var(--dnd-text-highlight);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .dnd-tm-dialog-message {
        color: #ccc;
        font-size: 14px;
        margin-bottom: 20px;
        line-height: 1.5;
    }
    
    .dnd-tm-dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    
    .dnd-tm-dialog-btn {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
    }
    
    .dnd-tm-dialog-btn.cancel {
        background: #333;
        border: 1px solid #555;
        color: #ccc;
    }
    
    .dnd-tm-dialog-btn.cancel:hover {
        background: #444;
        border-color: #666;
    }
    
    .dnd-tm-dialog-btn.confirm {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        border: none;
        color: #fff;
    }
    
    .dnd-tm-dialog-btn.confirm:hover {
        background: linear-gradient(135deg, #ec7063 0%, #e74c3c 100%);
    }
    
    /* ========== 字段布局模式 ========== */
    .dnd-tm-fields.layout-single .dnd-tm-field-item {
        width: 100%;
    }
    
    .dnd-tm-fields.layout-double {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .dnd-tm-fields.layout-double .dnd-tm-field-item {
        flex: 1 1 calc(50% - 4px);
        min-width: 100px;
        margin-bottom: 0;
    }
    
    /* ========== 搜索高亮 ========== */
    .dnd-tm-highlight {
        background: rgba(var(--dnd-gold-rgb, 212,175,55), 0.3);
        border-radius: 2px;
        padding: 0 2px;
    }
</style>
`;

export const UITableManager = {
    // 状态管理
    state: {
        currentTableKey: null,
        isExpanded: false,
        btnCols: 'auto', // 'auto' | number
        isConfigLoaded: false,
        stylesInjected: false,
        // 新增: 搜索相关状态
        searchKeyword: '',
        filteredRowIndices: null, // null 表示不过滤，数组表示过滤后的索引
        searchDebounceTimer: null,
        // 新增: 布局切换状态
        fieldLayout: 'single' // 'single' | 'double'
    },

    // 注入样式
    injectStyles() {
        const { $ } = getCore();
        if (this.state.stylesInjected) return;
        if ($('#dnd-table-manager-styles').length === 0) {
            $('head').append(TABLE_MANAGER_STYLES);
        }
        this.state.stylesInjected = true;
    },

    // [新增] 初始化监听器
    init() {
        const { $ } = getCore();
        if (this._initialized) return;
        this._initialized = true;
        
        // 注入样式
        this.injectStyles();
        
        // 监听全局设置变更，重置配置加载状态
        $(document).on('dnd:settings-changed', async () => {
            this.state.isConfigLoaded = false;
            // 如果当前可见，立即刷新
            if (this.state.isExpanded && $('#dnd-tm-table-buttons').length) {
                await this.render($('#dnd-table-manager-container'));
            }
        });
    },

    async loadConfig() {
        if (this.state.isConfigLoaded) return;
        const savedCols = await DBAdapter.getSetting('dnd_tm_cols');
        const savedHidden = await DBAdapter.getSetting('dnd_tm_hidden_tables');
        const savedLayout = await DBAdapter.getSetting('dnd_tm_field_layout');
        
        if (savedCols) this.state.btnCols = savedCols === 'auto' ? 'auto' : parseInt(savedCols);
        if (savedHidden) {
            try { this.state.hiddenTables = JSON.parse(savedHidden); } catch(e) { this.state.hiddenTables = []; }
        } else {
            this.state.hiddenTables = [];
        }
        // 加载字段布局偏好
        if (savedLayout && (savedLayout === 'single' || savedLayout === 'double')) {
            this.state.fieldLayout = savedLayout;
        }
        
        this.state.isConfigLoaded = true;
        // 如果已经渲染了按钮，更新布局
        this.updateButtonLayout();
    },

    updateButtonLayout() {
        const { $ } = getCore();
        const $container = $('#dnd-tm-table-buttons');
        if (!$container.length) return;

        const cols = this.state.btnCols;
        if (cols === 'auto') {
            $container.css({
                display: 'flex',
                flexWrap: 'wrap',
                gridTemplateColumns: 'none'
            });
            $container.find('.dnd-tm-table-btn').css({
                flex: '1 1 auto',
                width: 'auto',
                maxWidth: '150px'
            });
        } else {
            const count = parseInt(cols) || 3;
            $container.css({
                display: 'grid',
                gridTemplateColumns: `repeat(${count}, 1fr)`,
                flexWrap: 'nowrap'
            });
            $container.find('.dnd-tm-table-btn').css({
                flex: 'none',
                width: 'auto',
                maxWidth: 'none'
            });
        }
    },

    // 渲染入口
    async render($container) {
        const { $ } = getCore();
        $container.empty();
        
        // 确保初始化
        this.init();
        
        // 等待配置加载完成（包括 hiddenTables）
        await this.loadConfig();

        // 1. 获取所有表格数据
        const allData = DataManager.getAllData();
        if (!allData) {
            $container.html('<div style="color:#aaa;padding:10px;">无法加载数据</div>');
            return;
        }

        // 过滤出有效的表格，并排除被隐藏的
        const tables = Object.keys(allData).filter(k => {
            if (this.state.hiddenTables && this.state.hiddenTables.includes(k)) return false;
            return k.startsWith('sheet_') || (allData[k].name && allData[k].mate);
        });
        
        if (tables.length === 0) {
            $container.html('<div style="color:#aaa;padding:10px;">没有可见的表格 (请在设置中检查隐藏列表)</div>');
            return;
        }

        // 2. 构建主布局
        const layoutBtnIcon = this.state.fieldLayout === 'double' ? 'fa-table-list' : 'fa-table-columns';
        const layoutBtnActive = this.state.fieldLayout === 'double' ? 'active' : '';
        
        const $layout = $(`
            <div class="dnd-table-manager" style="padding:12px;background:linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%);max-height:450px;display:flex;flex-direction:column;border-radius:8px;">
                <!-- 顶部选择栏 (按钮组) -->
                <div style="margin-bottom:12px;display:flex;gap:6px;align-items:flex-start;">
                    <div id="dnd-tm-table-buttons" style="flex:1;display:flex;flex-wrap:wrap;gap:6px;max-height:100px;overflow-y:auto;padding:2px;">
                        ${tables.map(k => {
                            const name = allData[k].name || k;
                            const isSelected = this.state.currentTableKey === k;
                            const activeClass = isSelected ? 'active' : '';
                            return `<button class="dnd-tm-table-btn ${activeClass}" data-key="${k}" title="${name}">${name}</button>`;
                        }).join('')}
                    </div>
                </div>
                
                <!-- 工具栏：搜索 + 操作按钮 -->
                <div class="dnd-tm-toolbar" id="dnd-tm-toolbar">
                    <div class="dnd-tm-search-wrapper">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" class="dnd-tm-search-input" id="dnd-tm-search" placeholder="搜索记录...">
                        <button class="dnd-tm-search-clear" id="dnd-tm-search-clear">×</button>
                    </div>
                    <span class="dnd-tm-search-count" id="dnd-tm-search-count"></span>
                    <div class="dnd-tm-toolbar-actions">
                        <button class="dnd-tm-layout-btn ${layoutBtnActive}" id="dnd-tm-layout-toggle" title="切换字段布局 (单列/双列)">
                            <i class="fa-solid ${layoutBtnIcon}"></i>
                        </button>
                        <button class="dnd-tm-add-btn" id="dnd-tm-add-record" title="新增记录" disabled>
                            <i class="fa-solid fa-plus"></i> 新增
                        </button>
                    </div>
                </div>
                
                <!-- 卡片容器 -->
                <div id="dnd-tm-cards-container" class="dnd-tm-cards-container">
                    <div class="dnd-tm-empty-state">
                        <i class="fa-solid fa-table"></i>
                        请选择一个表格查看记录
                    </div>
                </div>
            </div>
        `);

        $container.append($layout);

        // 绑定事件
        const self = this;
        
        // 绑定表格按钮点击 - 使用 CSS 类切换
        $layout.find('.dnd-tm-table-btn').on('click', function() {
            const key = $(this).data('key');
            const $this = $(this);
            
            // 添加点击波纹效果
            $this.addClass('clicking');
            setTimeout(() => $this.removeClass('clicking'), 200);
            
            // [修改] 如果点击已选中的表格，则关闭
            if (self.state.currentTableKey === key) {
                self.state.currentTableKey = null;
                $this.removeClass('active');
                // 清空搜索状态
                self.clearSearch();
                // 禁用新增按钮
                $('#dnd-tm-add-record').prop('disabled', true);
                $('#dnd-tm-cards-container').empty().html(`
                    <div class="dnd-tm-empty-state">
                        <i class="fa-solid fa-table"></i>
                        请选择一个表格查看记录
                    </div>
                `);
                return;
            }
            
            // 切换选中
            self.state.currentTableKey = key;
            
            // 清空搜索状态
            self.clearSearch();
            
            // 更新按钮状态 - 使用 CSS 类
            $layout.find('.dnd-tm-table-btn').removeClass('active');
            $this.addClass('active');
            
            // 启用新增按钮
            $('#dnd-tm-add-record').prop('disabled', false);
            
            self.renderCards($('#dnd-tm-cards-container'), key);
        });
        
        // 绑定搜索输入事件 (防抖)
        $layout.find('#dnd-tm-search').on('input', function() {
            const keyword = $(this).val();
            self.state.searchKeyword = keyword;
            
            // 显示/隐藏清除按钮
            $('#dnd-tm-search-clear').toggleClass('visible', keyword.length > 0);
            
            // 防抖搜索
            if (self.state.searchDebounceTimer) {
                clearTimeout(self.state.searchDebounceTimer);
            }
            self.state.searchDebounceTimer = setTimeout(() => {
                self.performSearch(keyword);
            }, 200);
        });
        
        // 绑定清除搜索按钮
        $layout.find('#dnd-tm-search-clear').on('click', function() {
            self.clearSearch();
            if (self.state.currentTableKey) {
                self.renderCards($('#dnd-tm-cards-container'), self.state.currentTableKey);
            }
        });
        
        // 绑定布局切换按钮
        $layout.find('#dnd-tm-layout-toggle').on('click', function() {
            self.toggleFieldLayout();
        });
        
        // 绑定新增记录按钮
        $layout.find('#dnd-tm-add-record').on('click', function() {
            if (self.state.currentTableKey) {
                self.addRecord(self.state.currentTableKey);
            }
        });
        
        // 初始化布局 (如果有缓存)
        this.updateButtonLayout();

        // 如果已有选中表格，自动渲染
        if (this.state.currentTableKey) {
            $('#dnd-tm-add-record').prop('disabled', false);
            this.renderCards($('#dnd-tm-cards-container'), this.state.currentTableKey);
        }
    },

    // 渲染卡片
    renderCards($container, tableKey) {
        const { $ } = getCore();
        $container.empty();

        if (!tableKey) return;

        const allData = DataManager.getAllData();
        const sheet = allData[tableKey];
        if (!sheet || !sheet.content || sheet.content.length < 2) {
            $container.html(`
                <div class="dnd-tm-empty-state">
                    <i class="fa-solid fa-file-excel"></i>
                    表格为空或格式无效
                </div>
            `);
            this.updateSearchCount(0, 0);
            return;
        }

        const headers = sheet.content[0];
        const rows = sheet.content.slice(1);

        if (rows.length === 0) {
            $container.html(`
                <div class="dnd-tm-empty-state">
                    <i class="fa-solid fa-inbox"></i>
                    没有记录
                </div>
            `);
            this.updateSearchCount(0, 0);
            return;
        }

        // 获取过滤后的行索引
        const filteredIndices = this.state.filteredRowIndices;
        const layoutClass = this.state.fieldLayout === 'double' ? 'layout-double' : 'layout-single';
        
        let visibleCount = 0;
        // [修复] 计算总数时包含空行，与渲染逻辑保持一致
        const totalCount = rows.length;

        // 渲染每一行记录为卡片
        rows.forEach((row, rowIndex) => {
            // [修复] 不再跳过空行，让用户能看到新增的空记录并填写内容
            // if (row.every(cell => cell === null || cell === '')) return;
            
            // 如果有搜索过滤，检查是否在过滤结果中
            if (filteredIndices !== null && !filteredIndices.includes(rowIndex)) {
                return;
            }
            
            visibleCount++;

            const cardId = `tm-card-${tableKey}-${rowIndex}`;
            
            // [智能标题] 尝试寻找有意义的标题列
            let title = '未命名记录';
            const titleKeys = ['姓名', '名称', 'name', 'title', 'CHAR_ID', 'ID', 'PC_ID', '物品名称', '技能名称', '任务名称'];
            
            // 1. 优先匹配特定列名
            for (const key of titleKeys) {
                const idx = headers.findIndex(h => h && h.includes && h.includes(key));
                if (idx !== -1 && row[idx]) {
                    title = row[idx];
                    break;
                }
            }
            
            // 2. 如果没找到，使用第一个非空且Header有效的值
            if (title === '未命名记录') {
                for (let i = 0; i < headers.length; i++) {
                    if (headers[i] && headers[i] !== 'null' && row[i]) {
                        title = row[i];
                        break;
                    }
                }
            }

            // 使用 CSS 类构建卡片，添加动画延迟
            const animationDelay = visibleCount * 0.05; // 错开动画
            let cardHtml = `
                <div class="dnd-tm-card" data-row-index="${rowIndex + 1}" style="animation-delay: ${animationDelay}s;">
            `;

            // 标题栏 - 添加删除按钮
            cardHtml += `
                <div class="dnd-tm-card-header">
                    <span class="dnd-tm-card-title" title="${title}">${title}</span>
                    <div class="dnd-tm-card-actions">
                        <button class="dnd-tm-delete-btn" data-row="${rowIndex + 1}" title="删除记录">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        <button class="dnd-tm-save-btn" data-row="${rowIndex + 1}">
                            <i class="fa-solid fa-save"></i> 保存
                        </button>
                    </div>
                </div>
            `;

            // 字段列表 - 应用布局类
            cardHtml += `<div class="dnd-tm-fields ${layoutClass}">`;
            
            let fieldIndex = 0;
            
            headers.forEach((h, colIndex) => {
                // [优化] 跳过无效表头 (null 或 'null' 或 空字符串)
                if (!h || h === 'null' || h.trim() === '') return;

                const val = row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                const fieldDelay = fieldIndex * 0.03; // 字段错开动画
                fieldIndex++;
                
                cardHtml += `
                    <div class="dnd-tm-field-item" style="animation-delay: ${animationDelay + fieldDelay}s;">
                        <div class="dnd-tm-field-label">${h}</div>
                        <input type="text" class="dnd-tm-input" data-col="${colIndex}" value="${String(val).replace(/"/g, '&quot;')}" />
                    </div>
                `;
            });

            cardHtml += `</div></div>`; // End fields & card
            
            $container.append(cardHtml);
        });

        // 更新搜索计数
        this.updateSearchCount(visibleCount, totalCount);
        
        // 如果搜索无结果，显示提示
        if (visibleCount === 0 && filteredIndices !== null) {
            $container.html(`
                <div class="dnd-tm-empty-state">
                    <i class="fa-solid fa-search"></i>
                    没有找到匹配的记录
                </div>
            `);
        }

        // 绑定卡片内事件
        const self = this;
        
        // 保存按钮
        $container.find('.dnd-tm-save-btn').on('click', function() {
            const $btn = $(this);
            const rowIndex = parseInt($btn.data('row'));
            const $card = $btn.closest('.dnd-tm-card');
            
            // 点击动画
            $card.css('transform', 'scale(0.98)');
            setTimeout(() => $card.css('transform', ''), 150);
            
            // 收集数据
            const newData = {};
            $card.find('.dnd-tm-input').each(function() {
                const colIdx = parseInt($(this).data('col'));
                const val = $(this).val();
                newData[colIdx] = val; // 这里我们直接用列索引存储，方便更新
            });

            self.saveRecord(tableKey, rowIndex, newData, $btn);
        });
        
        // 删除按钮
        $container.find('.dnd-tm-delete-btn').on('click', function() {
            const $btn = $(this);
            const rowIndex = parseInt($btn.data('row'));
            const $card = $btn.closest('.dnd-tm-card');
            
            self.deleteRecord(tableKey, rowIndex, $card);
        });
    },

    // 保存单条记录
    async saveRecord(tableKey, rowIndex, newDataMap, $btn) {
        if ($btn) $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i>');

        try {
            const allData = DataManager.getAllData();
            const sheet = allData[tableKey];
            
            if (!sheet || !sheet.content) throw new Error('表格数据丢失');

            // 确保行存在
            if (!sheet.content[rowIndex]) {
                throw new Error('记录不存在');
            }

            // 更新数据
            Object.keys(newDataMap).forEach(colIdx => {
                sheet.content[rowIndex][colIdx] = newDataMap[colIdx];
            });

            // 保存到后端
            await DiceManager.saveData(allData);

            if ($btn) {
                $btn.html('<i class="fa-solid fa-check"></i> 已保存');
                setTimeout(() => $btn.html('<i class="fa-solid fa-save"></i> 保存').prop('disabled', false), 1500);
            }
            Logger.info(`[TableManager] Updated record in ${tableKey} at row ${rowIndex}`);

        } catch (err) {
            console.error('[TableManager] Save failed:', err);
            if ($btn) {
                $btn.html('<i class="fa-solid fa-triangle-exclamation"></i> 失败');
                setTimeout(() => $btn.html('<i class="fa-solid fa-save"></i> 保存').prop('disabled', false), 2000);
            }
        }
    },

    // ========== 搜索功能 ==========
    
    // 执行搜索
    performSearch(keyword) {
        const { $ } = getCore();
        
        if (!this.state.currentTableKey) return;
        
        const allData = DataManager.getAllData();
        const sheet = allData[this.state.currentTableKey];
        if (!sheet || !sheet.content || sheet.content.length < 2) return;
        
        const rows = sheet.content.slice(1);
        
        if (!keyword || keyword.trim() === '') {
            // 无搜索词时显示全部
            this.state.filteredRowIndices = null;
        } else {
            const lowerKeyword = keyword.toLowerCase();
            this.state.filteredRowIndices = [];
            
            rows.forEach((row, index) => {
                // 检查每个单元格是否包含关键词
                const matches = row.some(cell =>
                    cell && String(cell).toLowerCase().includes(lowerKeyword)
                );
                if (matches) {
                    this.state.filteredRowIndices.push(index);
                }
            });
        }
        
        // 重新渲染卡片
        this.renderCards($('#dnd-tm-cards-container'), this.state.currentTableKey);
    },
    
    // 清除搜索
    clearSearch() {
        const { $ } = getCore();
        this.state.searchKeyword = '';
        this.state.filteredRowIndices = null;
        $('#dnd-tm-search').val('');
        $('#dnd-tm-search-clear').removeClass('visible');
    },
    
    // 更新搜索计数
    updateSearchCount(visible, total) {
        const { $ } = getCore();
        const $count = $('#dnd-tm-search-count');
        
        if (total === 0) {
            $count.text('');
        } else if (this.state.filteredRowIndices !== null) {
            $count.text(`显示 ${visible}/${total} 条`);
        } else {
            $count.text(`共 ${total} 条`);
        }
    },

    // ========== 新增/删除记录 ==========
    
    // 新增记录
    async addRecord(tableKey) {
        const { $ } = getCore();
        const $btn = $('#dnd-tm-add-record');
        
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i>');
        
        try {
            const allData = DataManager.getAllData();
            const sheet = allData[tableKey];
            
            if (!sheet || !sheet.content) {
                throw new Error('表格数据丢失');
            }
            
            const headers = sheet.content[0];
            // 创建空白行，保持与表头相同的列数
            const newRow = headers.map(() => '');
            
            // 添加到数据末尾
            sheet.content.push(newRow);
            
            // 保存到后端
            await DiceManager.saveData(allData);
            
            Logger.info(`[TableManager] Added new record to ${tableKey}`);
            
            // 清除搜索过滤（以便看到新记录）
            this.clearSearch();
            
            // 刷新卡片视图
            this.renderCards($('#dnd-tm-cards-container'), tableKey);
            
            // 自动滚动到底部
            setTimeout(() => {
                const $container = $('#dnd-tm-cards-container');
                $container.scrollTop($container[0].scrollHeight);
            }, 100);
            
            $btn.html('<i class="fa-solid fa-check"></i> 已添加');
            setTimeout(() => $btn.html('<i class="fa-solid fa-plus"></i> 新增').prop('disabled', false), 1500);
            
        } catch (err) {
            console.error('[TableManager] Add record failed:', err);
            $btn.html('<i class="fa-solid fa-triangle-exclamation"></i> 失败');
            setTimeout(() => $btn.html('<i class="fa-solid fa-plus"></i> 新增').prop('disabled', false), 2000);
        }
    },
    
    // 删除记录
    async deleteRecord(tableKey, rowIndex, $card) {
        const { $ } = getCore();
        
        // 显示确认对话框
        const confirmed = await this.showConfirmDialog(
            '确认删除',
            '确定要删除这条记录吗？此操作不可撤销。'
        );
        
        if (!confirmed) return;
        
        try {
            const allData = DataManager.getAllData();
            const sheet = allData[tableKey];
            
            if (!sheet || !sheet.content || !sheet.content[rowIndex]) {
                throw new Error('记录不存在');
            }
            
            // 删除行（rowIndex 是从 1 开始的，因为 0 是表头）
            sheet.content.splice(rowIndex, 1);
            
            // 保存到后端
            await DiceManager.saveData(allData);
            
            Logger.info(`[TableManager] Deleted record from ${tableKey} at row ${rowIndex}`);
            
            // 从 DOM 移除卡片（带动画）
            $card.css({
                'transform': 'scale(0.9)',
                'opacity': '0',
                'transition': 'all 0.3s'
            });
            
            setTimeout(() => {
                $card.remove();
                // 更新搜索计数
                const remaining = $('#dnd-tm-cards-container .dnd-tm-card').length;
                const allData2 = DataManager.getAllData();
                const sheet2 = allData2[tableKey];
                const total = sheet2 && sheet2.content ? sheet2.content.length - 1 : 0;
                this.updateSearchCount(remaining, total);
                
                // 如果没有卡片了，显示空状态
                if (remaining === 0) {
                    $('#dnd-tm-cards-container').html(`
                        <div class="dnd-tm-empty-state">
                            <i class="fa-solid fa-inbox"></i>
                            没有记录
                        </div>
                    `);
                }
            }, 300);
            
        } catch (err) {
            console.error('[TableManager] Delete failed:', err);
            // 可以添加错误提示
        }
    },
    
    // 显示确认对话框
    showConfirmDialog(title, message) {
        const { $ } = getCore();
        
        return new Promise(resolve => {
            // 尝试从多个来源获取视口尺寸
            const w = window.parent || window;
            let viewportWidth = w.innerWidth || w.document?.documentElement?.clientWidth || document.documentElement.clientWidth || screen.width;
            let viewportHeight = w.innerHeight || w.document?.documentElement?.clientHeight || document.documentElement.clientHeight || screen.height;
            
            // 如果还是 0，尝试从 top window 获取
            if (!viewportWidth || !viewportHeight) {
                try {
                    const topWin = window.top;
                    viewportWidth = topWin.innerWidth || 800;
                    viewportHeight = topWin.innerHeight || 600;
                } catch (e) {
                    viewportWidth = 800;
                    viewportHeight = 600;
                }
            }
            
            // 计算屏幕中心的绝对像素位置
            const centerY = Math.round(viewportHeight / 2);
            const centerX = Math.round(viewportWidth / 2);
            
            // 使用绝对像素定位
            const dialogHtml = `
                <div id="dnd-tm-confirm-dialog" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:2147483650;"></div>
                <div id="dnd-tm-confirm-dialog-box" style="position:fixed;top:${centerY}px;left:${centerX}px;transform:translate(-50%,-50%);background:linear-gradient(145deg,#2a2a2c 0%,#1a1a1c 100%);border:1px solid #444;border-radius:10px;padding:20px;min-width:280px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.5);z-index:2147483651;">
                    <div class="dnd-tm-dialog-title">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#e74c3c;"></i>
                        ${title}
                    </div>
                    <div class="dnd-tm-dialog-message">${message}</div>
                    <div class="dnd-tm-dialog-actions">
                        <button class="dnd-tm-dialog-btn cancel">取消</button>
                        <button class="dnd-tm-dialog-btn confirm">确认删除</button>
                    </div>
                </div>
            `;
            
            $('body').append(dialogHtml);
            
            const cleanup = () => {
                $('#dnd-tm-confirm-dialog').remove();
                $('#dnd-tm-confirm-dialog-box').remove();
            };
            
            $('#dnd-tm-confirm-dialog-box .cancel').on('click', () => {
                cleanup();
                resolve(false);
            });
            
            $('#dnd-tm-confirm-dialog-box .confirm').on('click', () => {
                cleanup();
                resolve(true);
            });
            
            // 点击遮罩关闭
            $('#dnd-tm-confirm-dialog').on('click', function() {
                cleanup();
                resolve(false);
            });
        });
    },

    // ========== 布局切换 ==========
    
    // 切换字段布局
    toggleFieldLayout() {
        const { $ } = getCore();
        
        // 切换状态
        this.state.fieldLayout = this.state.fieldLayout === 'single' ? 'double' : 'single';
        
        // 更新所有字段容器的类
        const layoutClass = this.state.fieldLayout === 'double' ? 'layout-double' : 'layout-single';
        $('.dnd-tm-fields').removeClass('layout-single layout-double').addClass(layoutClass);
        
        // 更新按钮图标和状态
        const $btn = $('#dnd-tm-layout-toggle');
        const icon = this.state.fieldLayout === 'double' ? 'fa-table-list' : 'fa-table-columns';
        $btn.find('i').removeClass().addClass(`fa-solid ${icon}`);
        $btn.toggleClass('active', this.state.fieldLayout === 'double');
        
        // 保存用户偏好
        DBAdapter.setSetting('dnd_tm_field_layout', this.state.fieldLayout);
    }
};
