import './theme.js';
import { startWASMEngineToPullMarkdown } from './startup/wasm.js';
import { startGearButtonListener } from './startup/engineLinks.js';
import { startOnClickListeners } from './startup/markdownLinks.js';
import { startBackAndForwardListener } from './startup/urlListeners.js';

startGearButtonListener();
startOnClickListeners();
startBackAndForwardListener();
startWASMEngineToPullMarkdown();
