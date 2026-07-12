// shows the loading spinner, resetting its animation
export function showSpinner(): void {
  const s = document.getElementById('nw-spinner')!;
  s.style.animation = 'none';
  s.style.display = 'flex';
  void s.offsetHeight; // force reflow so animation resets before we remove the override
  s.style.animation = '';
}

// hides the loading spinner
export function hideSpinner(): void {
  const s = document.getElementById('nw-spinner');
  if (s) s.style.display = 'none';
}
