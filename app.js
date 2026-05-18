(function () {
  'use strict';

  var THEMES = ['system', 'light', 'dark'];
  var KEY = 'pulse.theme';

  var ICONS = {
    system: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/></svg>',
    light:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    dark:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  };

  var LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

  function applyTheme(theme) {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  function updateButtons(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.innerHTML = ICONS[theme] + ' ' + LABELS[theme];
      btn.setAttribute('aria-label', 'Toggle color theme, currently ' + LABELS[theme]);
    });
  }

  function initTheme() {
    var current = localStorage.getItem(KEY) || 'system';
    applyTheme(current);
    updateButtons(current);

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cur = localStorage.getItem(KEY) || 'system';
        var next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
        localStorage.setItem(KEY, next);
        applyTheme(next);
        updateButtons(next);
      });
    });
  }

  function revealEmails() {
    document.querySelectorAll('.support-email').forEach(function (el) {
      var user = el.dataset.user;
      var domain = el.dataset.domain;
      if (!user || !domain) return;
      var address = user + '@' + domain;
      el.href = 'mailto:' + address + '?subject=Pulse%20support';
      el.replaceChildren(document.createTextNode(address));
      el.removeAttribute('data-user');
      el.removeAttribute('data-domain');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    revealEmails();
  });
}());
