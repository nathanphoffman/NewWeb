
import { addCats, removeCats } from './cats';


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
        ThemeObject("glacier","Glacier"),
        ThemeObject("cats", "Cats", addCats, removeCats)
]


export function getThemeDefinition(name: string): ThemeObject | undefined {
    return THEME_DEFINITIONS.find(x=>x.name === name) 
}

export function getAnimatedThemes(): ThemeObject[] {
    return THEME_DEFINITIONS.filter(x=>x.startAnimation && x.stopAnimation)
}  