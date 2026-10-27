// The phone menu on the static community pages (owner direction, 27 October 2026); app/navigation.tsx does the same
// in the React pages. The menu button opens and closes the list; Escape closes it.
const menu = document.querySelector('.site-menu');
const button = menu?.querySelector('.menu-toggle');
if (menu && button) {
  const set = open => {
    menu.dataset.open = String(open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    button.querySelector('path')?.setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16');
  };
  button.addEventListener('click', () => set(menu.dataset.open !== 'true'));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') set(false); });
}
