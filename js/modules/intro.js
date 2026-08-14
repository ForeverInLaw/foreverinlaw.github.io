import { initScrollAnimations } from './scroll-reveal.js';

export function initPageAnimations() {
    const heroTitle = document.querySelector('.hero__inner h1');

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

    const runHeroAnimation = () => {
        if (!heroTitle) return;

        if (heroTitle._rbsplitInstance) {
            try { heroTitle._rbsplitInstance.revert(); } catch (e) { }
            heroTitle._rbsplitInstance = null;
        }

        try {
            const splitInstance = new SplitText(heroTitle, {
                type: 'chars',
                smartWrap: true,
                charsClass: 'split-char',
                reduceWhiteSpace: false,
                tag: 'span'
            });

            heroTitle._rbsplitInstance = splitInstance;

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

            const totalChars = splitInstance.chars.length;
            splitInstance.chars.forEach((char, index) => {
                const position = index / (totalChars - 1);
                let color;
                if (position <= 0.2) {
                    color = fgColor;
                } else {
                    const gradientFactor = (position - 0.2) / 0.8;
                    color = interpolateColor(fgColor, mutedColor, gradientFactor);
                }
                char.style.color = color;
            });

            gsap.set(splitInstance.chars, { opacity: 0, y: 40 });

            gsap.to(splitInstance.chars, {
                duration: 0.6,
                ease: 'power3.out',
                opacity: 1,
                y: 0,
                stagger: 0.1,
                willChange: 'transform, opacity',
                force3D: true
            });
        } catch (error) {
            console.warn('SplitText animation failed:', error);
            gsap.set(heroTitle, { opacity: 1, clearProps: 'all' });
        }
    };

    const runIntroSequence = () => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            forceShowPrimarySections();
            if (heroTitle) gsap.set(heroTitle, { opacity: 1, clearProps: 'all' });
            initScrollAnimations();
            return;
        }

        runHeroAnimation();
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
