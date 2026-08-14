import { prefersReducedMotion } from './viewport.js';

export function initShowMore() {
    const showMoreBtn = document.getElementById('projects-show-more');
    if (!showMoreBtn) return;

    const projectsRow = document.querySelector('.projects-row');
    const btnText = showMoreBtn.querySelector('.projects-show-more__text');
    const totalCount = projectsRow ? projectsRow.children.length : 0;
    const VISIBLE_COUNT = 5;

    if (totalCount <= VISIBLE_COUNT) {
        showMoreBtn.style.display = 'none';
        return;
    }

    showMoreBtn.addEventListener('click', () => {
        const isExpanding = !projectsRow.classList.contains('is-expanded');
        const hiddenItems = Array.from(projectsRow.children).slice(VISIBLE_COUNT);
        if (isExpanding) {
            projectsRow.classList.add('is-expanded');
            showMoreBtn.setAttribute('aria-expanded', 'true');
            btnText.textContent = 'Show less';

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

        } else {
            if (prefersReducedMotion()) {
                projectsRow.classList.remove('is-expanded');
                showMoreBtn.setAttribute('aria-expanded', 'false');
                btnText.textContent = `Show all projects (${totalCount})`;
                return;
            }

            const projectsSection = projectsRow.closest('.projects');
            if (projectsSection) {
                projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            setTimeout(() => {
                gsap.to(hiddenItems.reverse(), {
                    autoAlpha: 0,
                    y: -10,
                    duration: 0.2,
                    stagger: 0.02,
                    ease: 'power2.in',
                    onComplete: () => {
                        projectsRow.classList.remove('is-expanded');
                        showMoreBtn.setAttribute('aria-expanded', 'false');
                        btnText.textContent = `Show all projects (${totalCount})`;
                        gsap.set(hiddenItems, { clearProps: 'transform,opacity,visibility' });
                    }
                });
            }, 400);
        }
    });
    btnText.textContent = `Show all projects (${totalCount})`;
}
