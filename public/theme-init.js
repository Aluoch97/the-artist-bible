// Runs before the page paints so the right theme is on screen from the first frame (no dark flash in light mode).
// Kept as a separate file because the site's security policy does not allow inline scripts.
(function () {
  // Start downloading the home screen's big picture right away (the Home page is where most visits land).
  if (location.pathname === '/') {
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = '/hero-art.webp'; l.setAttribute('fetchpriority', 'high');
    document.head.appendChild(l);
  }
  try {
    var ui = JSON.parse(localStorage.getItem('artist_bible_ui_v1') || '{}');
    var root = document.documentElement;
    // Display settings (Settings dialog): set now so text size, contrast and so on are right from the first frame.
    if (ui.text === 'small' || ui.text === 'large' || ui.text === 'xlarge') root.setAttribute('data-text', ui.text);
    if (ui.motion === 'reduce') root.setAttribute('data-motion', 'reduce');
    if (ui.contrast === 'high') root.setAttribute('data-contrast', 'high');
    if (ui.links === 'underline') root.setAttribute('data-links', 'underline');
    if (ui.plain === true) root.setAttribute('data-plain', 'on');
    var pref = ui.theme || 'system';
    var dark = pref === 'dark' || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#17100c' : '#fdeadb');
  } catch (e) {
    /* storage blocked: the stylesheet falls back to the device setting */
  }
})();
