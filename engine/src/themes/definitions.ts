
import { addCats, removeCats } from './effects/cats';
import { startMatrixRain, stopMatrixRain } from './effects/terminal';
import { startPetals, stopPetals } from './effects/sakura';
import { startCRTFlicker, stopCRTFlicker } from './effects/crt';
import { startStormRain, stopStormRain } from './effects/storm';
import { startCyberGleam, stopCyberGleam } from './effects/cyber';
import { startJellyfish, stopJellyfish } from './effects/abyss';

// an animator starts or stops a theme's visual effect
type ThemeAnimator = () => void

export type ThemeObject = {
    name: string,
    displayName: string,
    startAnimation?: ThemeAnimator,
    stopAnimation?: ThemeAnimator
}

type ThemeDefinitions = ThemeObject[]

const THEME_DEFINITIONS: ThemeDefinitions = [
        { name: "glacier", displayName: "Glacier" },
        { name: "carbon", displayName: "Carbon" },
        { name: "terminal", displayName: "Terminal", startAnimation: startMatrixRain, stopAnimation: stopMatrixRain },
        { name: "beach", displayName: "Beach" },
        { name: "space", displayName: "Space" },
        { name: "aurora", displayName: "Aurora" },
        { name: "cyber", displayName: "Cyber", startAnimation: startCyberGleam, stopAnimation: stopCyberGleam },
        { name: "cats", displayName: "Cats", startAnimation: addCats, stopAnimation: removeCats },
        { name: "dusk", displayName: "Dusk" },
        { name: "slate", displayName: "Slate" },
        { name: "sakura", displayName: "Sakura", startAnimation: startPetals, stopAnimation: stopPetals },
        { name: "crt", displayName: "CRT", startAnimation: startCRTFlicker, stopAnimation: stopCRTFlicker },
        { name: "blueprint", displayName: "Blueprint" },
        { name: "moss", displayName: "Moss" },
        { name: "scribe", displayName: "Scribe" },
        { name: "storm", displayName: "Storm", startAnimation: startStormRain, stopAnimation: stopStormRain },
        { name: "alchemical", displayName: "Alchemical" },
        { name: "blackboard", displayName: "Blackboard" },
        { name: "chromatic", displayName: "Chromatic" },
        { name: "daguerreotype", displayName: "Daguerreotype" },
        { name: "ember", displayName: "Ember" },
        { name: "quill", displayName: "Quill" },
        { name: "obsidian", displayName: "Obsidian" },
        { name: "scriptorium", displayName: "Scriptorium" },
        { name: "voidcore", displayName: "Voidcore" },
        { name: "abyss", displayName: "Abyss", startAnimation: startJellyfish, stopAnimation: stopJellyfish }
]

export function getThemeDefinition(name: string): ThemeObject | undefined {
    return THEME_DEFINITIONS.find(x=>x.name === name) 
}

export function getAnimatedThemes(): ThemeObject[] {
    return THEME_DEFINITIONS.filter(x=>x.startAnimation && x.stopAnimation)
}  
