// src/core/Logger.js
export const Logger = {
    // 日志等级: 0=关闭, 1=错误, 2=警告, 3=信息, 4=调试
    level: 4, // 默认全开，方便调试
    prefix: '[DND Dashboard]',
    
    error: (...args) => {
        if (Logger.level >= 1) console.error(Logger.prefix, '❌ ERROR:', ...args);
    },
    warn: (...args) => {
        if (Logger.level >= 2) console.warn(Logger.prefix, '⚠️ WARN:', ...args);
    },
    info: (...args) => {
        if (Logger.level >= 3) console.info(Logger.prefix, '📋 INFO:', ...args);
    },
    debug: (...args) => {
        if (Logger.level >= 4) console.log(Logger.prefix, '🔍 DEBUG:', ...args);
    },
    
    // 诊断函数：输出当前环境状态
    diagnose: () => {
        console.group(Logger.prefix + ' 🔬 环境诊断');
        
        // 检查 jQuery
        console.log('window.jQuery:', typeof window.jQuery, window.jQuery ? window.jQuery.fn.jquery : 'N/A');
        try {
            const parentJQ = window.parent?.jQuery;
            console.log('window.parent.jQuery:', typeof parentJQ, parentJQ ? parentJQ.fn.jquery : 'N/A');
        } catch(e) {
            console.log('window.parent.jQuery: 访问被阻止 (跨域)', e.message);
        }
        
        // 检查 DOM
        console.log('document.body:', !!document.body);
        console.log('#dnd-toggle-btn 存在:', !!document.getElementById('dnd-toggle-btn'));
        console.log('#dnd-dashboard-root 存在:', !!document.getElementById('dnd-dashboard-root'));
        console.log('#dnd-mini-hud 存在:', !!document.getElementById('dnd-mini-hud'));
        
        // 检查 API
        console.log('window.AutoCardUpdaterAPI:', typeof window.AutoCardUpdaterAPI);
        try {
            console.log('parent.AutoCardUpdaterAPI:', typeof window.parent?.AutoCardUpdaterAPI);
        } catch(e) {
            console.log('parent.AutoCardUpdaterAPI: 访问被阻止');
        }
        
        // 检查是否在 iframe 中
        console.log('在 iframe 中:', window !== window.top);
        console.log('window.location:', window.location.href.substring(0, 100));
        
        console.groupEnd();
    }
};

// 全局暴露 Logger 以便在控制台调用
window.DND_Dashboard_Logger = Logger;
