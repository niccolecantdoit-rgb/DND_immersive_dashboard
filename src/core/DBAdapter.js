// src/core/DBAdapter.js
export const DBAdapter = {
    dbName: 'DND_Immersive_DB',
    storeName: 'avatars',
    settingsStore: 'settings',
    svgStore: 'svg_maps', // New store for map SVGs
    version: 7, // Bump to 7 to force store creation if missing
    db: null,
    _openPromise: null, // Track opening state
    
    init: () => {
        if (DBAdapter.db) return Promise.resolve(DBAdapter.db);
        if (DBAdapter._openPromise) return DBAdapter._openPromise;

        DBAdapter._openPromise = new Promise((resolve, reject) => {
            // 处理兼容性
            const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            if (!indexedDB) {
                console.error('[DND DB] Browser does not support IndexedDB');
                DBAdapter._openPromise = null;
                return reject('IndexedDB not supported');
            }

            // [Fix] Add timeout to prevent hanging (which blocks LocalStorage fallback)
            const timeoutId = setTimeout(() => {
                if (DBAdapter._openPromise) {
                    console.warn('[DND DB] Connection timed out. Using fallback.');
                    DBAdapter._openPromise = null;
                    reject('Connection timeout');
                }
            }, 2000);

            const request = indexedDB.open(DBAdapter.dbName, DBAdapter.version);
            
            request.onblocked = (e) => {
                console.warn('[DND DB] Database blocked. Please close other tabs.');
                // Don't reject immediately, wait for timeout or unblock
            };

            request.onerror = (e) => {
                clearTimeout(timeoutId);
                console.error('[DND DB] Open Error:', e.target.error);
                DBAdapter._openPromise = null;
                reject(e.target.error);
            };
            
            request.onsuccess = (e) => {
                clearTimeout(timeoutId);
                const db = e.target.result;
                DBAdapter.db = db;
                // Keep promise to return same resolved DB for subsequent calls
                // But we MUST clear it if DB closes

                db.onclose = () => {
                    console.warn('[DND DB] Database connection closed unexpectedly.');
                    DBAdapter.db = null;
                    DBAdapter._openPromise = null; // Clear promise to allow re-opening
                };

                db.onversionchange = () => {
                    console.warn('[DND DB] Database version changed. Closing connection.');
                    db.close();
                    DBAdapter.db = null;
                    DBAdapter._openPromise = null; // Clear promise
                };

                resolve(db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // Ensure all stores exist
                if (!db.objectStoreNames.contains(DBAdapter.storeName)) {
                    db.createObjectStore(DBAdapter.storeName);
                }
                if (!db.objectStoreNames.contains(DBAdapter.settingsStore)) {
                    db.createObjectStore(DBAdapter.settingsStore);
                }
                if (!db.objectStoreNames.contains(DBAdapter.svgStore)) {
                    db.createObjectStore(DBAdapter.svgStore);
                }
            };
        });
        
        return DBAdapter._openPromise;
    },

    // 通用操作 helper
    _op: async (storeName, mode, callback) => {
        try {
            let db = await DBAdapter.init();
            return new Promise((resolve, reject) => {
                let transaction;
                try {
                    transaction = db.transaction([storeName], mode);
                } catch (err) {
                    // Retry init if transaction creation fails (e.g. closed connection)
                    console.warn('[DND DB] Transaction creation failed, retrying connection...', err);
                    
                    // Force reset state
                    DBAdapter.db = null;
                    DBAdapter._openPromise = null;
                    
                    // Retry once
                    DBAdapter.init().then(newDb => {
                        try {
                            transaction = newDb.transaction([storeName], mode);
                            const store = transaction.objectStore(storeName);
                            const request = callback(store);
                            request.onsuccess = (e) => resolve(e.target.result);
                            request.onerror = (e) => reject(e.target.error);
                        } catch (retryErr) {
                            console.error('[DND DB] Retry failed:', retryErr);
                            reject(retryErr);
                        }
                    }).catch(err => {
                        console.error('[DND DB] Re-init failed:', err);
                        reject(err);
                    });
                    return;
                }

                const store = transaction.objectStore(storeName);
                const request = callback(store);
                
                request.onsuccess = (e) => resolve(e.target.result);
                request.onerror = (e) => {
                    console.error(`[DND DB] Op Error (${storeName}):`, e.target.error);
                    reject(e.target.error);
                };
            });
        } catch(e) {
            console.error(`[DND DB] Operation Failed (${storeName}):`, e);
            return undefined; // Return undefined on failure so fallbacks work
        }
    },

    put: async (key, value) => {
        return DBAdapter._op(DBAdapter.storeName, 'readwrite', store => store.put(value, key));
    },

    get: async (key) => {
        return DBAdapter._op(DBAdapter.storeName, 'readonly', store => store.get(key));
    },
    
    setSetting: async (key, value) => {
        return DBAdapter._op(DBAdapter.settingsStore, 'readwrite', store => store.put(value, key));
    },

    setSVG: async (key, value) => {
        return DBAdapter._op(DBAdapter.svgStore, 'readwrite', store => store.put(value, key));
    },

    getSVG: async (key) => {
        return DBAdapter._op(DBAdapter.svgStore, 'readonly', store => store.get(key));
    },

    getSetting: async (key) => {
        // Try DB first
        try {
            let val = await DBAdapter._op(DBAdapter.settingsStore, 'readonly', store => store.get(key));
            if (val !== undefined && val !== null) return val;
        } catch(e) { console.warn('DB Get failed', e); }
        
        // [Fallback] Try LocalStorage if DB failed or missing
        try {
            const lsVal = localStorage.getItem(key);
            if (lsVal) return lsVal;
        } catch(e) {}

        return null;
    },

    delete: async (key) => {
        return DBAdapter._op(DBAdapter.storeName, 'readwrite', store => store.delete(key));
    },

    migrateFromLocalStorage: async () => {
        const keys = Object.keys(localStorage);
        let count = 0;
        for (const k of keys) {
            if (k.startsWith('dnd_')) {
                const val = localStorage.getItem(k);
                if (val) {
                    try {
                        if (k.startsWith('dnd_avatar_')) {
                            // Avatars are large, move to DB and delete from LS
                            await DBAdapter.put(k.replace('dnd_avatar_', ''), val);
                            localStorage.removeItem(k);
                            count++;
                        } else {
                            await DBAdapter.setSetting(k, val);
                            // Settings stay in LS as backup
                        }
                    } catch(e) { console.warn('Migration failed for', k); }
                }
            }
        }
        if (count > 0) console.log(`[DND Storage] Migrated ${count} items to DB.`);
    },

    // [新增] 存储空间分析
    analyzeStorage: () => {
        let total = 0;
        const usage = {};
        const details = [];
        
        for (let k in localStorage) {
            if (!localStorage.hasOwnProperty(k)) continue;
            const len = ((localStorage[k].length + k.length) * 2);
            total += len;
            
            let prefix = 'Other';
            if (k.startsWith('dnd_')) prefix = 'DND Script';
            else if (k.startsWith('SillyTavern') || k.startsWith('settings')) prefix = 'SillyTavern System';
            else if (k.includes('chat')) prefix = 'Chats/Logs';
            else if (k.includes('character')) prefix = 'Characters';
            
            usage[prefix] = (usage[prefix] || 0) + len;
            details.push({ key: k, size: len });
        }
        
        // Sort by size desc
        details.sort((a, b) => b.size - a.size);
        
        return {
            totalBytes: total,
            totalMB: (total / 1024 / 1024).toFixed(2),
            breakdown: usage,
            topKeys: details.slice(0, 5)
        };
    }
};
