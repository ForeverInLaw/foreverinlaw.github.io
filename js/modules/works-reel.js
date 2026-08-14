import { getProjectDomain } from './project-card.js';

// The desktop hover preview (preview-modal.js) is inert on touch, so the project
// screenshots never reached mobile at all. Here every card that has one carries
// it inline in a browser frame that opens as the card scrolls into view. Scroll
// is the only input, so the card can stay a plain <a> and tapping still just
// opens the project.
//
// The reveal is one-way on purpose. Collapsing a card again would change the
// page height above the viewport and yank the view out from under the reader,
// and compensating for that means scrolling the page programmatically — worse
// than simply leaving a shot open once it has been seen.

const REEL_QUERY = '(max-width: 768px) and (hover: none)';

// Reveal once the card reaches the lower third of the viewport. Anchored to the
// bottom edge only, so even the last card in the list still triggers.
const REVEAL_MARGIN = '0px 0px -30% 0px';

// The inner frame is the single grid item the 0fr -> 1fr reveal collapses.
const FRAME_TEMPLATE = `
    <div class="project-shot__frame">
        <div class="project-shot__bar">
            <span></span><span></span><span></span>
            <em class="project-shot__domain"></em>
        </div>
        <img alt="" loading="lazy" decoding="async">
    </div>`;

// Returns false when the card has no usable screenshot, so the caller can skip
// observing a card that would never have anything to reveal.
function mountShot(card) {
    const src = card.getAttribute('data-screenshot');
    if (!src) return false;

    const title = card.querySelector('h3')?.textContent?.trim() || 'Project';
    const shot = document.createElement('div');
    shot.className = 'project-shot';
    shot.innerHTML = FRAME_TEMPLATE;
    shot.querySelector('.project-shot__domain').textContent = getProjectDomain(card);

    const image = shot.querySelector('img');
    image.src = src;
    image.alt = `${title} screenshot`;

    card.appendChild(shot);
    return true;
}

export function initWorksReel() {
    // Bound to the same breakpoint that turns masonry off (masonry.js), so the
    // reel never fights absolutely-positioned cards on a wide touch screen.
    if (!window.matchMedia(REEL_QUERY).matches) return;

    const cards = document.querySelectorAll('.projects .project-card[data-screenshot]');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries, self) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            self.unobserve(entry.target);
        });
    }, { rootMargin: REVEAL_MARGIN });

    cards.forEach((card) => {
        if (mountShot(card)) observer.observe(card);
    });
}
