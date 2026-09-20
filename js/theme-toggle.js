/* ==============================================================================
   WYRM.studios — Theme Toggle Logic (Light / Dark Mode)
   ============================================================================== */

(function() {
    'use strict';

    const STORAGE_KEY = 'wyrm-theme';
    const LEGACY_STORAGE_KEY = 'hrwl-theme';
    const htmlElement = document.documentElement;

    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    }

    function applyTheme(theme, save = false) {
        if (theme === 'dark') {
            htmlElement.classList.add('dark');
            htmlElement.classList.remove('light');
            if (document.body) document.body.style.colorScheme = 'dark';
        } else {
            htmlElement.classList.add('light');
            htmlElement.classList.remove('dark');
            if (document.body) document.body.style.colorScheme = 'light';
        }

        if (save) {
            try {
                localStorage.setItem(STORAGE_KEY, theme);
            } catch (e) {
                // Ignore storage errors (private mode)
            }
        }
    }

    // Apply saved theme immediately to prevent FOUC
    const initialTheme = getSavedTheme();
    if (initialTheme) {
        applyTheme(initialTheme, false);
    }

    document.addEventListener('DOMContentLoaded', function() {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle');

        function toggleTheme() {
            const isDark = htmlElement.classList.contains('dark');
            applyTheme(isDark ? 'light' : 'dark', true);
        }

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleTheme();
            });
        }

        if (mobileThemeToggleBtn) {
            mobileThemeToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleTheme();
            });
        }
    });
})();
