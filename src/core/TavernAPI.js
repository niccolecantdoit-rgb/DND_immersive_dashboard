// src/core/TavernAPI.js
// src/core/TavernAPI.js

export const TavernAPI = {
    // 获取全局核心对象（兼容 iframe 和 父窗口）
    getCore: function() {
        let st = null;
        let helper = null;
        
        // 尝试从不同层级获取 SillyTavern 对象
        try {
            if (window.SillyTavern) st = window.SillyTavern;
            else if (window.parent && window.parent.SillyTavern) st = window.parent.SillyTavern;
            else if (window.top && window.top.SillyTavern) st = window.top.SillyTavern;
            
            if (window.TavernHelper) helper = window.TavernHelper;
            else if (window.parent && window.parent.TavernHelper) helper = window.parent.TavernHelper;
            else if (window.top && window.top.TavernHelper) helper = window.top.TavernHelper;
        } catch(e) {
            console.error('[TavernAPI] 获取核心对象失败:', e);
        }

        return {
            SillyTavern: st,
            TavernHelper: helper
        };
    },

    /**
     * 规范化 API URL (去除尾部斜杠，去除 /chat/completions)
     */
    _normalizeUrl: function(url) {
        if (!url) return '';
        let cleanUrl = url.trim();
        // 去除尾部斜杠
        while (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        // 如果用户不小心加了 /chat/completions，尝试去除
        if (cleanUrl.endsWith('/chat/completions')) {
            cleanUrl = cleanUrl.replace(/\/chat\/completions$/, '');
        }
        return cleanUrl;
    },

    /**
     * 获取所有可用的 API 连接预设
     * @returns {Array} 预设列表 [{id, name}, ...]
     */
    getPresets: function() {
        const { SillyTavern } = this.getCore();
        
        console.log('[TavernAPI] 正在尝试获取 API 预设...');
        if (!SillyTavern) {
            console.error('[TavernAPI] 未找到 SillyTavern 对象');
            return [];
        }

        // 路径 A: 标准路径
        if (SillyTavern.extensionSettings?.connectionManager?.profiles) {
            return SillyTavern.extensionSettings.connectionManager.profiles;
        }
        
        // 路径 B: 可能是 connection 而不是 connectionManager
        if (SillyTavern.extensionSettings?.connection?.profiles) {
            return SillyTavern.extensionSettings.connection.profiles;
        }

        // 路径 C: 尝试从 contexts 中查找 (某些新版架构)
        if (SillyTavern.contexts?.connection?.profiles) {
            return SillyTavern.contexts.connection.profiles;
        }

        console.warn('[TavernAPI] 未能找到 connectionManager.profiles，请检查酒馆版本');
        return [];
    },

    /**
     * 获取自定义 API 的模型列表 (通过酒馆后端检查连接)
     * @param {string} apiUrl - API 基础 URL
     * @param {string} apiKey - API 密钥
     * @returns {Promise<Array>} 模型列表 ['model1', 'model2']
     */
    fetchModels: async function(rawApiUrl, apiKey) {
        if (!rawApiUrl) throw new Error('API URL 不能为空');
        
        const apiUrl = this._normalizeUrl(rawApiUrl);

        // 确保 URL 格式正确 (指向 status 接口或 models 接口)
        const statusUrl = '/api/backends/chat-completions/status';
        const { SillyTavern } = this.getCore();
        
        const body = {
            "reverse_proxy": apiUrl,
            "proxy_password": "",
            "chat_completion_source": "custom",
            "custom_url": apiUrl,
            "custom_include_headers": apiKey ? `Authorization: Bearer ${apiKey}` : ""
        };

        const response = await fetch(statusUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(SillyTavern?.getRequestHeaders ? SillyTavern.getRequestHeaders() : {})
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`连接失败: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        // Tavern 返回格式兼容: { models: [...] } 或直接数组 或 { data: [...] }
        let models = [];
        if (data.models && Array.isArray(data.models)) models = data.models;
        else if (Array.isArray(data)) models = data;
        else if (data.data && Array.isArray(data.data)) models = data.data;

        return models.map(m => (typeof m === 'string' ? m : m.id));
    },

    /**
     * 发送请求给 AI
     * @param {Array} messages - 消息数组 [{role: 'user', content: '...'}, ...]
     * @param {Object} options - 配置项
     * @param {string} [options.presetId] - (可选) API预设ID，留空则使用主API
     * @param {Object} [options.customConfig] - (可选) 自定义配置 { url, key, model }，优先级高于 presetId
     * @param {number} [options.maxTokens=4096] - 最大生成长度
     * @returns {Promise<string>} AI回复的内容
     */
    generate: async function(messages, options = {}) {
        const { SillyTavern, TavernHelper } = this.getCore();
        const { presetId, customConfig, maxTokens = 4096 } = options;

        if (!SillyTavern && !TavernHelper) {
            throw new Error("SillyTavern 核心 API 未就绪");
        }

        // --- 方式 C: 使用自定义配置 (通过酒馆后端代理调用) ---
        if (customConfig && customConfig.url && customConfig.model) {
            console.log(`[TavernAPI] 使用自定义配置发送请求: ${customConfig.url}`);
            
            const { url: rawApiUrl, key: apiKey, model } = customConfig;
            const apiUrl = this._normalizeUrl(rawApiUrl);

            try {
                const requestBody = {
                    messages: messages,
                    model: model,
                    max_tokens: maxTokens,
                    temperature: 0.7,
                    top_p: 0.9,
                    stream: false,
                    chat_completion_source: 'custom',
                    reverse_proxy: apiUrl,
                    proxy_password: '',
                    custom_url: apiUrl,
                    custom_include_headers: apiKey ? `Authorization: Bearer ${apiKey}` : '',
                    enable_web_search: false,
                    request_images: false
                };

                const response = await fetch('/api/backends/chat-completions/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(SillyTavern?.getRequestHeaders ? SillyTavern.getRequestHeaders() : {})
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API 请求失败: ${response.status} - ${errText}`);
                }

                const data = await response.json();
                
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content.trim();
                } else if (data && data.content) {
                    return data.content.trim();
                } else {
                    throw new Error('API 返回了意外的数据结构');
                }
            } catch (err) {
                console.error('[TavernAPI] Proxy Fetch Error:', err);
                throw err;
            }
        }

        // --- 方式 A: 使用指定的 API 预设 (通过酒馆后端代理调用) ---
        else if (presetId) {
            console.log(`[TavernAPI] 使用预设 ID: ${presetId} 发送请求`);
            
            // 1. 检查预设是否存在
            const profile = this.getPresets().find(p => p.id === presetId);
            if (!profile) throw new Error(`找不到 ID 为 "${presetId}" 的 API 预设`);

            // 2. 提取配置
            let apiKey = profile.api_key || profile.key || '';
            let apiUrl = profile.api_url || profile.url || '';
            let model = profile.openai_model || profile.model || 'gpt-3.5-turbo';
            
            // 特殊处理：如果是 settings 嵌套对象
            if (profile.settings) {
                apiKey = apiKey || profile.settings.api_key || profile.settings.key;
                apiUrl = apiUrl || profile.settings.api_url || profile.settings.url;
                model = model || profile.settings.openai_model || profile.settings.model;
            }

            if (!apiUrl) {
                throw new Error(`无法从预设 "${presetId}" 中解析出 API URL。`);
            }

            // 规范化 URL
            apiUrl = this._normalizeUrl(apiUrl);

            console.log(`[TavernAPI] Proxy via Backend: ${apiUrl}, Model: ${model}`);

            try {
                // 构造 Tavern 后端代理请求体
                const requestBody = {
                    messages: messages,
                    model: model,
                    max_tokens: maxTokens,
                    temperature: 0.7,
                    top_p: 0.9,
                    stream: false,
                    chat_completion_source: 'custom',
                    reverse_proxy: apiUrl,
                    proxy_password: '',
                    custom_url: apiUrl,
                    custom_include_headers: apiKey ? `Authorization: Bearer ${apiKey}` : '',
                    enable_web_search: false,
                    request_images: false
                };

                const response = await fetch('/api/backends/chat-completions/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(SillyTavern?.getRequestHeaders ? SillyTavern.getRequestHeaders() : {})
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API 请求失败: ${response.status} - ${errText}`);
                }

                const data = await response.json();
                
                // 解析结果 (兼容不同的返回结构)
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content.trim();
                } else if (data && data.content) {
                    return data.content.trim();
                } else {
                    throw new Error('API 返回了意外的数据结构');
                }
            } catch (err) {
                console.error('[TavernAPI] Proxy Fetch Error:', err);
                throw err;
            }
        }
        
        // --- 方式 B: 直接使用当前主 API ---
        else {
            console.log(`[TavernAPI] 使用主 API 发送请求`);
            
            const response = await TavernHelper.generateRaw({
                ordered_prompts: messages,
                should_stream: false,
            });
            
            return response.trim();
        }
    }
};
