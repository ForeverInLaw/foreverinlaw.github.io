import { invalidateMasonry } from './masonry.js';
import { isCompact, prefersReducedMotion } from './viewport.js';

export function initScrollAnimations() {
    const projectCards = document.querySelectorAll('.project-card');
    const scrollRevealSelector = '.project-card:not([data-entry-revealed="true"])';
    const scrollRevealCards = document.querySelectorAll(scrollRevealSelector);
    const projectsRow = document.querySelector('.projects-row');

    if (prefersReducedMotion()) {
        gsap.set(scrollRevealCards, { autoAlpha: 1, y: 0, filter: 'none' });
        scrollRevealCards.forEach(el => { el.dataset.revealed = 'true'; });
        if (projectsRow) projectsRow.classList.add('is-interactive');
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        return;
    }

    gsap.set(scrollRevealCards, {
        autoAlpha: 0,
        y: 26,
        filter: 'blur(8px)'
    });

    const isMobile = isCompact();
    const startPosition = isMobile ? 'top 105%' : 'top 90%';

    let revealedCount = projectCards.length - scrollRevealCards.length;

    function markInteractiveIfDone() {
        if (!projectsRow || projectCards.length === 0) return;
        if (revealedCount >= projectCards.length) {
            projectsRow.classList.add('is-interactive');
        }
    }

    if (scrollRevealCards.length > 0) {
        ScrollTrigger.batch(scrollRevealSelector, {
            start: startPosition,
            once: true,
            onEnter: (batch) => gsap.to(batch, {
                duration: 0.6,
                autoAlpha: 1,
                y: 0,
                filter: 'blur(0px)',
                stagger: 0.08,
                ease: 'power3.out',
                overwrite: 'auto'
            }).then(() => {
                batch.forEach(el => {
                    gsap.set(el, { clearProps: 'transform,filter' });
                    if (!el.dataset.revealed) {
                        el.dataset.revealed = 'true';
                        revealedCount += 1;
                    }
                });
                markInteractiveIfDone();
                invalidateMasonry();
            })
        });
    }

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => markInteractiveIfDone());
    } else {
        setTimeout(markInteractiveIfDone, 500);
    }

    window.addEventListener('pagehide', (event) => {
        if (event.persisted) return;
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    });
}
