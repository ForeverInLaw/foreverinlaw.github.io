/* global gsap -- loaded as a global by libs/gsap/gsap-bundle.min.js */

import { prefersReducedMotion } from './viewport.js';
import { swapText } from './text-swap.js';

const VISIBLE_COUNT = 5;

// Ceiling for the smooth scroll before collapsing. The browser decides how long
// its own smooth scroll takes, so scrollend is the real signal; this only keeps
// the promise from hanging where scrollend never fires (Safari, or a scroll that
// had nowhere to go).
const SCROLL_TIMEOUT_MS = 700;

function scrollToStart(element) {
    return new Promise(resolve => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });

        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            document.removeEventListener('scrollend', finish);
            resolve();
        };

        document.addEventListener('scrollend', finish, { once: true });
        setTimeout(finish, SCROLL_TIMEOUT_MS);
    });
}

export function initShowMore() {
    const showMoreBtn = document.getElementById('projects-show-more');
    if (!showMoreBtn) return;

    const projectsRow = document.querySelector('.projects-row');
    const btnText = showMoreBtn.querySelector('.projects-show-more__text');
    const totalCount = projectsRow ? projectsRow.children.length : 0;

    if (totalCount <= VISIBLE_COUNT) {
        showMoreBtn.style.display = 'none';
        return;
    }

    const collapsedLabel = `Show all projects (${totalCount})`;

    const setState = (expanded) => {
        projectsRow.classList.toggle('is-expanded', expanded);
        showMoreBtn.setAttribute('aria-expanded', String(expanded));
        swapText(btnText, expanded ? 'Show less' : collapsedLabel);
    };

    const expand = (hiddenItems) => {
        setState(true);
        if (prefersReducedMotion()) return;

        gsap.fromTo(hiddenItems, {
            autoAlpha: 0,
            y: 20,
        }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.06,
            ease: 'power3.out',
            onComplete: () => {
                gsap.set(hiddenItems, { clearProps: 'transform,opacity,visibility' });
            }
        });
    };

    const collapse = async (hiddenItems) => {
        if (prefersReducedMotion()) {
            setState(false);
            return;
        }

        // Ride the page back up first, so the cards aren't animating out above
        // the fold where nobody can see them.
        const projectsSection = projectsRow.closest('.projects');
        if (projectsSection) await scrollToStart(projectsSection);

        gsap.to(hiddenItems.reverse(), {
            autoAlpha: 0,
            y: -10,
            duration: 0.2,
            stagger: 0.02,
            ease: 'power2.in',
            onComplete: () => {
                setState(false);
                gsap.set(hiddenItems, { clearProps: 'transform,opacity,visibility' });
            }
        });
    };

    showMoreBtn.addEventListener('click', () => {
        const hiddenItems = Array.from(projectsRow.children).slice(VISIBLE_COUNT);
        if (projectsRow.classList.contains('is-expanded')) collapse(hiddenItems);
        else expand(hiddenItems);
    });

    btnText.textContent = collapsedLabel;
}
