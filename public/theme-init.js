// Runs before the page paints so the right theme is on screen from the first frame (no dark flash in light mode).
// Kept as a separate file because the site's security policy does not allow inline scripts.
(function () {
  try {
    var pref = (JSON.parse(localStorage.getItem('artist_bible_ui_v1') || '{}').theme) || 'system';
    var dark = pref === 'dark' || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#17100c' : '#fdeadb');
  } catch (e) {
    /* storage blocked: the stylesheet falls back to the device setting */
  }
})();
