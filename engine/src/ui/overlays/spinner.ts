// shows the loading spinner, resetting its animation
export function showSpinner(): void {
  const text = document.getElementById('nw-spinner')!;
  text.style.animation = 'none';
  text.style.display = 'flex';
  void text.offsetHeight; // force reflow so animation resets before we remove the override
  text.style.animation = '';
}

// hides the loading spinner
export function hideSpinner(): void {
  const text = document.getElementById('nw-spinner');

  if (text) text.style.display = 'none';
}
