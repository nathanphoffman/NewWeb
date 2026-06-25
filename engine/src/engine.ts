
import { handleWasm } from './wasm.js';
import { handleMore, handleNav, handleRedirect, navigateTo, replacePage, navigateWithData, renderNoData, looksLikeBareUrl, warnBareUrl } from './nav.js';
import { showToast, showModal, showFormModal, scrollToAnchor } from './ui.js';
import type { FieldDef } from './types.js';
import './theme.js';
import { showSettingsModal } from './settings.js';
import { handleWASMClick, startWASMEngineToPullMarkdown } from './startup/wasm.js';
import { startGearButtonListener } from './startup/engineLinks.js';
import { startOnClickListeners } from './startup/markdownLinks.js';
import { startBackAndForwardListener, startHashChangeListener } from './startup/urlListeners.js';

startGearButtonListener();
startOnClickListeners();
startBackAndForwardListener();
startHashChangeListener();
startWASMEngineToPullMarkdown();

