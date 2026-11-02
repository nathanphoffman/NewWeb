import './themes/theme';
import { startGearButtonListener } from './startup/engineLinks';
import { startOnClickListeners } from './startup/markdownLinks';
import { startBackAndForwardListener } from './startup/urlListeners';
import { startWASMEngineToPullMarkdown } from './startup/wasm';
import { initializeNavbar } from "./ui/navbar"

startGearButtonListener();
startOnClickListeners();
initializeNavbar();
startBackAndForwardListener();
startWASMEngineToPullMarkdown();
