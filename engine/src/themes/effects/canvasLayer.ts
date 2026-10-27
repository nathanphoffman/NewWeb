import { PAUSED_CLASS } from '../../shared/constants';

export type CanvasLayer = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  remove: () => void;
};

// true while the user has paused page animations
export function isAnimationPaused(): boolean {
  return document.documentElement.classList.contains(PAUSED_CLASS);
}

// adds a full-window canvas that follows window resizes; onResize lets a theme rebuild state tied to the size
export function createCanvasLayer(css: string, onResize: (canvas: HTMLCanvasElement) => void = () => {}): CanvasLayer {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;${css}`;
  document.body.appendChild(canvas);

  const resize = (): void => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    onResize(canvas);
  };

  resize();
  window.addEventListener('resize', resize);

  const remove = (): void => {
    window.removeEventListener('resize', resize);
    canvas.remove();
  };

  return { canvas, ctx: canvas.getContext('2d')!, remove };
}
