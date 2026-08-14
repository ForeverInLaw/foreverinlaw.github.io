import { initScrollAnimations } from './scroll-reveal.js';
import { revealHeroTitle, showHeroTitle } from './hero-title.js';
import { prefersReducedMotion } from './viewport.js';

export function initPageAnimations() {
    function forceShowPrimarySections() {
        const connectTitle = document.querySelector('.hero__links .section-title');
        const projectsTitle = document.querySelector('.projects .section-title');
        const linkCards = document.querySelectorAll('.hero__links .link-card');
        const projectCards = Array.from(document.querySelectorAll('.projects .project-card')).slice(0, 6);

        [connectTitle, projectsTitle].forEach(el => {
            if (!el) return;
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.transform = 'none';
            el.style.filter = 'none';
        });

        [...linkCards, ...projectCards].forEach(el => {
            if (!el) return;
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.transform = 'none';
            el.style.filter = 'none';
        });
    }

    function runSectionsIntro() {
        try {
            const connectTitle = document.querySelector('.hero__links .section-title');
            const linkCards = gsap.utils.toArray('.hero__links .link-card');
            const projectsTitle = document.querySelector('.projects .section-title');
            const projectCards = gsap.utils.toArray('.projects .project-card');
            const entryProjectCards = projectCards.slice(0, Math.min(projectCards.length, 6));
            const titleTargets = [connectTitle, projectsTitle].filter(Boolean);

            entryProjectCards.forEach(card => {
                card.dataset.entryRevealed = 'true';
            });

            if (titleTargets.length > 0) {
                gsap.set(titleTargets, { autoAlpha: 0, y: 20 });
            }
            if (linkCards.length > 0) {
                gsap.set(linkCards, { autoAlpha: 0, y: 24, filter: 'blur(6px)' });
            }
            if (entryProjectCards.length > 0) {
                gsap.set(entryProjectCards, { autoAlpha: 0, y: 30, filter: 'blur(8px)' });
            }

            const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            if (connectTitle) {
                introTl.to(connectTitle, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.45
                }, 0.18);
            }

            if (linkCards.length > 0) {
                introTl.to(linkCards, {
                    autoAlpha: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    duration: 0.58,
                    stagger: 0.07
                }, 0.24);
            }

            if (projectsTitle) {
                introTl.to(projectsTitle, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.45
                }, 0.42);
            }

            if (entryProjectCards.length > 0) {
                introTl.to(entryProjectCards, {
                    autoAlpha: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    duration: 0.62,
                    stagger: 0.06
                }, 0.48);
            }
        } catch (error) {
            console.warn('Sections intro animation failed:', error);
            forceShowPrimarySections();
        }
    }

    const runIntroSequence = () => {
        if (prefersReducedMotion()) {
            forceShowPrimarySections();
            showHeroTitle();
            initScrollAnimations();
            return;
        }

        revealHeroTitle();
        runSectionsIntro();
        initScrollAnimations();

        setTimeout(() => {
            const connectTitle = document.querySelector('.hero__links .section-title');
            const projectsTitle = document.querySelector('.projects .section-title');
            const connectHidden = connectTitle && getComputedStyle(connectTitle).visibility === 'hidden';
            const projectsHidden = projectsTitle && getComputedStyle(projectsTitle).visibility === 'hidden';
            if (connectHidden || projectsHidden) {
                forceShowPrimarySections();
            }
        }, 1400);
    };

    const fontsReadyPromise = (document.fonts && document.fonts.ready)
        ? document.fonts.ready
        : Promise.resolve();

    Promise.race([
        fontsReadyPromise,
        new Promise(resolve => setTimeout(resolve, 1000))
    ]).then(runIntroSequence).catch(() => {
        runIntroSequence();
    });
}
