(() => {
  const tabs = [...document.querySelectorAll('.direction-tab')];
  const views = [...document.querySelectorAll('.direction-view')];

  if (!tabs.length || !views.length) return;

  function showView(viewId, focusPanel = false) {
    tabs.forEach((tab) => {
      const selected = tab.dataset.directionView === viewId;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    views.forEach((view) => {
      const selected = view.id === viewId;
      view.hidden = !selected;
      view.classList.toggle('active', selected);
      if (selected && focusPanel) view.focus({ preventScroll: true });
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showView(tab.dataset.directionView));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(index + step + tabs.length) % tabs.length];
      next.focus();
      showView(next.dataset.directionView);
    });
  });

  views.forEach((view) => view.setAttribute('tabindex', '-1'));
  showView('journey-view');
})();
