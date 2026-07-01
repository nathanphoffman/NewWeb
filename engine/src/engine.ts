import './theme.js';
import { startWASMEngineToPullMarkdown } from './startup/wasm.js';
import { startGearButtonListener } from './startup/engineLinks.js';
import { startOnClickListeners } from './startup/markdownLinks.js';
import { startBackAndForwardListener, startHashChangeListener } from './startup/urlListeners.js';

startGearButtonListener();
startOnClickListeners();
startBackAndForwardListener();
startHashChangeListener();
startWASMEngineToPullMarkdown();
