import { parseSvg } from '../../ui/dom';
import { MS_PER_SECOND, PAUSED_CLASS } from '../../shared/constants';
const REMOVE_GRACE_SECONDS = 0.5;

export type SpriteLook = {
  wrapperCss: string;
  svgCss: string;
  lifetimeSeconds: number;
};

export type SpriteSpawnerOptions = {
  className: string;
  svgMarkup: string;
  initialCount: number;
  initialStaggerMs: number;
  intervalMs: number;
  randomLook: () => SpriteLook;
};

// builds start/stop functions for a theme that drops decorative svg sprites onto the page on a timer
export function createSpriteSpawner(options: SpriteSpawnerOptions): { start: () => void; stop: () => void } {
  const template = parseSvg(options.svgMarkup);
  let timer: number | null = null;
  let active = false;

  function spawn(): void {
    if (!active) return;
    const look = options.randomLook();
    const wrapper = document.createElement('div');
    wrapper.classList.add(options.className);
    wrapper.style.cssText = look.wrapperCss;
    const svg = template.cloneNode(true) as SVGSVGElement;
    svg.style.cssText = look.svgCss;
    wrapper.appendChild(svg);
    document.body.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), (look.lifetimeSeconds + REMOVE_GRACE_SECONDS) * MS_PER_SECOND);
  }

  function stop(): void {
    active = false;

    if (timer !== null) { clearInterval(timer); timer = null; }
    document.querySelectorAll(`.${options.className}`).forEach(el => el.remove());
  }

  function start(): void {
    if (document.documentElement.classList.contains(PAUSED_CLASS)) return;
    stop();
    active = true;

    for (let i = 0; i < options.initialCount; i++) setTimeout(spawn, i * options.initialStaggerMs);
    timer = window.setInterval(spawn, options.intervalMs);
  }

  return { start, stop };
}
