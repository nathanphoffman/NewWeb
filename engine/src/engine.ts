import './theme';
import { startWASMEngineToPullMarkdown } from './startup/wasm';
import { startGearButtonListener } from './startup/engineLinks';
import { startOnClickListeners } from './startup/markdownLinks';
import { startBackAndForwardListener } from './startup/urlListeners';
import { initializeNavbar } from "./ui/navbar"

startGearButtonListener();
startOnClickListeners();
initializeNavbar();
startBackAndForwardListener();
startWASMEngineToPullMarkdown();