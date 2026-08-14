import { recolorHeroTitle } from './hero-title.js';

function syncImageAriaHidden(theme) {
    const darkImgs = document.querySelectorAll('.stats-img--dark, .graph-img--dark');
    const lightImgs = document.querySelectorAll('.stats-img--light, .graph-img--light');
    darkImgs.forEach(img => img.setAttribute('aria-hidden', theme === 'dark' ? 'false' : 'true'));
    lightImgs.forEach(img => img.setAttribute('aria-hidden', theme === 'light' ? 'false' : 'true'));
}

export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    }

    syncImageAriaHidden(theme);
}

export function attachThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        themeToggle.setAttribute('aria-pressed', String(newTheme === 'dark'));

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1B1628' : '#D7C9F0');
        }

        syncImageAriaHidden(newTheme);

        recolorHeroTitle();
    });
}
