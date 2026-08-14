import { initTheme, attachThemeToggle } from './modules/theme.js';
import { prioritizeScreenshotProjects } from './modules/projects-order.js';
import { initConnectCodeHover } from './modules/code-bg.js';
import { initMasonry } from './modules/masonry.js';
import { initPageAnimations } from './modules/intro.js';
import { initCursor } from './modules/cursor.js';
import { initPreviewModal } from './modules/preview-modal.js';
import { initSpotify } from './modules/spotify.js';
import { initShowMore } from './modules/show-more.js';
import { initGithubStats } from './modules/github-stats.js';
import { initPlaylists } from './modules/playlists.js';

// Apply saved theme before paint to avoid flash.
initTheme();

window.addEventListener('scroll', () => {
    document.body.style.setProperty('--scrollTop', `${window.scrollY}px`);
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
    prioritizeScreenshotProjects();
    initConnectCodeHover();
    attachThemeToggle();

    gsap.registerPlugin(SplitText, ScrollTrigger);
    ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });
    ScrollTrigger.config({ ignoreMobileResize: true });

    initMasonry();

    const entryScreen = document.getElementById('entry-screen');
    const shouldShowEntry = entryScreen && !entryScreen.classList.contains('hidden');
    if (!shouldShowEntry) {
        initPageAnimations();
    } else {
        window.addEventListener('entryCompleted', initPageAnimations, { once: true });
    }

    initCursor();
    initPreviewModal();
    initSpotify();
    initShowMore();
    initGithubStats();
    initPlaylists();
});
