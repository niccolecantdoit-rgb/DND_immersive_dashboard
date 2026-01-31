// src/ui/UIRenderer.js
import { getCore } from '../core/Utils.js';
import UIUtils from './modules/UIUtils.js';
import UICore from './modules/UICore.js';
import UIHUD from './modules/UIHUD.js';
import UIPanels from './modules/UIPanels.js';
import UISettings from './modules/UISettings.js';
import UICharacter from './modules/UICharacter.js';
import UIItems from './modules/UIItems.js';
import UICombat from './modules/UICombat.js';
import UIMap from './modules/UIMap.js';
import UISpells from './modules/UISpells.js';
import UIDice from './modules/UIDice.js';

export const UIRenderer = Object.assign({},
    UIUtils,
    UICore,
    UIHUD,
    UIPanels,
    UISettings,
    UICharacter,
    UIItems,
    UICombat,
    UIMap,
    UISpells,
    UIDice
);

// Make UIRenderer globally available as expected by onclick handlers in generated HTML
try {
    const { window: globalWin } = getCore();
    if (globalWin) {
        console.log('[DND Dashboard] Exposing UIRenderer to global window (Module Scope)');
        globalWin.DND_Dashboard_UI = UIRenderer;
    } else {
        console.warn('[DND Dashboard] globalWin not found, using local window');
        window.DND_Dashboard_UI = UIRenderer;
    }
} catch (e) {
    console.error('[DND Dashboard] Failed to expose UIRenderer:', e);
}
