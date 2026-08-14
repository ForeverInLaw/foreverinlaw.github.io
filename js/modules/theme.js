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

export function updateHeroTitleColors() {
    const heroTitle = document.querySelector('.hero__inner h1');
    if (!heroTitle || !heroTitle._rbsplitInstance) return;

    const computedStyle = getComputedStyle(document.documentElement);
    const fgColor = computedStyle.getPropertyValue('--fg').trim();
    const mutedColor = computedStyle.getPropertyValue('--muted').trim();

    const interpolateColor = (color1, color2, factor) => {
        const c1 = Number.parseInt(color1.replace('#', ''), 16);
        const c2 = Number.parseInt(color2.replace('#', ''), 16);

        const r1 = (c1 >> 16) & 0xff;
        const g1 = (c1 >> 8) & 0xff;
        const b1 = c1 & 0xff;

        const r2 = (c2 >> 16) & 0xff;
        const g2 = (c2 >> 8) & 0xff;
        const b2 = c2 & 0xff;

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    const totalChars = heroTitle._rbsplitInstance.chars.length;

    heroTitle._rbsplitInstance.chars.forEach((char, index) => {
        const position = index / (totalChars - 1);
        let targetColor;
        if (position <= 0.2) {
            targetColor = fgColor;
        } else {
            const gradientFactor = (position - 0.2) / 0.8;
            targetColor = interpolateColor(fgColor, mutedColor, gradientFactor);
        }

        gsap.to(char, {
            color: targetColor,
            duration: 0.5,
            ease: 'power2.out'
        });
    });
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

        updateHeroTitleColors();
    });
}
