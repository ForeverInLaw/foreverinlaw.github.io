import { readProjectCard, screenshotCards } from './project-card.js';
import { isTouchReel } from './viewport.js';

// The desktop hover preview (preview-modal.js) is inert on touch, so the project
// screenshots never reached mobile at all. Here every card that has one carries
// it inline in a browser frame that opens as the card scrolls into view. Scroll
// is the only input, so the card can stay a plain <a> and tapping still just
// opens the project.
//
// The reveal is one-way on purpose. Collapsing a card again would change the
// page height above the viewport and yank the view out from under the reader,
// and compensating for that means scrolling the page programmatically - worse
// than simply leaving a shot open once it has been seen.

// Reveal once the card reaches the lower third of the viewport. Anchored to the
// bottom edge only, so even the last card in the list still triggers.
const REVEAL_MARGIN = '0px 0px -30% 0px';

// Start downloading two screens ahead of the reveal. loading="lazy" cannot do
// this job here: the image sits inside a 0fr grid row, so as far as the browser
// is concerned it has no height and no position worth pre-fetching for.
const FETCH_MARGIN = '200% 0px 200% 0px';

// The inner frame is the single grid item the 0fr -> 1fr reveal collapses.
const FRAME_TEMPLATE = `
    <div class="project-shot__frame">
        <div class="project-shot__bar">
            <span></span><span></span><span></span>
            <em class="project-shot__domain"></em>
        </div>
        <img alt="" decoding="async">
    </div>`;

// Returns false when the card has no usable screenshot, so the caller can skip
// observing a card that would never have anything to reveal.
function mountShot(card) {
    const { screenshot, title, domain } = readProjectCard(card);
    if (!screenshot) return false;

    const shot = document.createElement('div');
    shot.className = 'project-shot';
    shot.innerHTML = FRAME_TEMPLATE;
    shot.querySelector('.project-shot__domain').textContent = domain;
    shot.dataset.src = screenshot;

    const image = shot.querySelector('img');
    image.alt = `${title} screenshot`;

    card.appendChild(shot);
    return true;
}

/**
 * Starts the download and marks the shot ready once the pixels are decoded, so
 * the CSS fade has something to fade in. A shot that fails to load keeps its
 * frame closed rather than opening onto a broken image.
 */
function loadShot(shot) {
    const image = shot.querySelector('img');
    if (image.src) return;

    image.src = shot.dataset.src;
    image.decode()
        .then(() => shot.classList.add('is-shot-ready'))
        .catch(() => { /* broken screenshot: leave the frame empty */ });
}

export function initWorksReel() {
    // Bound to the same breakpoint that turns masonry off (masonry.js), so the
    // reel never fights absolutely-positioned cards on a wide touch screen.
    if (!isTouchReel()) return;

    const cards = screenshotCards();
    if (!cards.length) return;

    // Two passes over the same cards at different distances: fetch early so the
    // file is decoded by the time the frame opens, reveal late so the opening
    // lands where the reader is looking.
    const fetcher = new IntersectionObserver((entries, self) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            loadShot(entry.target.querySelector('.project-shot'));
            self.unobserve(entry.target);
        });
    }, { rootMargin: FETCH_MARGIN });

    const revealer = new IntersectionObserver((entries, self) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            // A card revealed before its fetch margin fired still needs the shot.
            loadShot(entry.target.querySelector('.project-shot'));
            entry.target.classList.add('is-revealed');
            self.unobserve(entry.target);
        });
    }, { rootMargin: REVEAL_MARGIN });

    cards.forEach((card) => {
        if (!mountShot(card)) return;
        fetcher.observe(card);
        revealer.observe(card);
    });
}
