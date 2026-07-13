
import { addCats, removeCats } from './cats';
import { startMatrixRain, stopMatrixRain } from './terminal';
import { startPetals, stopPetals } from './sakura';
import { startCRTFlicker, stopCRTFlicker } from './crt';
import { startStormRain, stopStormRain } from './storm';
import { startCyberGleam, stopCyberGleam } from './cyber';
import { startBubbles, stopBubbles } from './bubblegum';
import { startJellyfish, stopJellyfish } from './abyss';


type ThemeAnimator = ()=>void

type ThemeObject = {
    name: string,
    displayName: string,
    startAnimation?: ThemeAnimator,
    stopAnimation?: ThemeAnimator
}

type ThemeDefinitions = ThemeObject[]

const ThemeObject = (name: string, displayName: string, startAnimation?: ThemeAnimator, stopAnimation?: ThemeAnimator): ThemeObject =>{
    return {
        name,
        displayName,
        startAnimation,
        stopAnimation
    }
}

const THEME_DEFINITIONS: ThemeDefinitions = [
        ThemeObject("glacier", "Glacier"),
        ThemeObject("carbon", "Carbon"),
        ThemeObject("terminal", "Terminal", startMatrixRain, stopMatrixRain),
        ThemeObject("beach", "Beach"),
        ThemeObject("space", "Space"),
        ThemeObject("aurora", "Aurora"),
        ThemeObject("cyber", "Cyber", startCyberGleam, stopCyberGleam),
        ThemeObject("cats", "Cats", addCats, removeCats),
        ThemeObject("dusk", "Dusk"),
        ThemeObject("slate", "Slate"),
        ThemeObject("sakura", "Sakura", startPetals, stopPetals),
        ThemeObject("crt", "CRT", startCRTFlicker, stopCRTFlicker),
        ThemeObject("blueprint", "Blueprint"),
        ThemeObject("moss", "Moss"),
        ThemeObject("scribe", "Scribe"),
        ThemeObject("storm", "Storm", startStormRain, stopStormRain),
        ThemeObject("alchemical", "Alchemical"),
        ThemeObject("blackboard", "Blackboard"),
        ThemeObject("chromatic", "Chromatic"),
        ThemeObject("daguerreotype", "Daguerreotype"),
        ThemeObject("ember", "Ember"),
        ThemeObject("quill", "Quill"),
        ThemeObject("obsidian", "Obsidian"),
        ThemeObject("scriptorium", "Scriptorium"),
        ThemeObject("voidcore", "Voidcore"),
        ThemeObject("porcelain", "Porcelain"),
        ThemeObject("bubblegum", "Bubblegum", startBubbles, stopBubbles),
        ThemeObject("abyss", "Abyss", startJellyfish, stopJellyfish)
]


export function getThemeDefinition(name: string): ThemeObject | undefined {
    return THEME_DEFINITIONS.find(x=>x.name === name) 
}

export function getAnimatedThemes(): ThemeObject[] {
    return THEME_DEFINITIONS.filter(x=>x.startAnimation && x.stopAnimation)
}  