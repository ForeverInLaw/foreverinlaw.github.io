/* global ScrollTrigger -- loaded as a global by libs/gsap/gsap-bundle.min.js */

import { isCompact } from './viewport.js';

// Absolute-positions the project cards into balanced columns. Callers ask for
// invalidateMasonry(); passes are coalesced into the next frame.

const GAP = 16;
const MIN_ITEM_WIDTH = 280;

const container = () => document.querySelector('.projects-row');

/** Puts the cards back in normal flow — used on compact screens and on failure. */
function resetToFlow(el, items) {
    el.style.height = 'auto';
    items.forEach(item => {
        item.style.position = 'relative';
        item.style.top = 'auto';
        item.style.left = 'auto';
        item.style.width = '100%';
    });
}

/**
 * Column assignment for a run of card heights. Pure, so the balancing rule can
 * be checked without a browser: each card goes to the shortest column so far.
 */
export function packColumns(heights, columns) {
    const columnHeights = Array.from({ length: columns }, () => 0);

    const placements = heights.map((height) => {
        let column = 0;
        for (let i = 1; i < columns; i++) {
            if (columnHeights[i] < columnHeights[column]) column = i;
        }
        const top = columnHeights[column];
        columnHeights[column] += height + GAP;
        return { column, top };
    });

    return { placements, height: Math.max(0, ...columnHeights) };
}

export function masonryLayout() {
    const el = container();
    if (!el) return;

    const items = Array.from(el.children);
    if (items.length === 0) return;

    if (isCompact()) {
        resetToFlow(el, items);
        return;
    }

    try {
        const columns = Math.max(1, Math.floor((el.offsetWidth + GAP) / (MIN_ITEM_WIDTH + GAP)));
        const itemWidth = (el.offsetWidth - (GAP * (columns - 1))) / columns;

        // Widths first: they change how tall each card is, so every height has
        // to be measured after the whole row has been resized.
        items.forEach(item => {
            item.style.width = `${itemWidth}px`;
            item.style.position = 'absolute';
        });

        const { placements, height } = packColumns(items.map(item => item.offsetHeight), columns);

        items.forEach((item, index) => {
            const { column, top } = placements[index];
            item.style.left = `${column * (itemWidth + GAP)}px`;
            item.style.top = `${top}px`;
        });

        el.style.height = `${height}px`;

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    } catch (err) {
        // Never leave cards absolutely positioned and overlapping: fall back to flow
        console.warn('masonry layout failed; falling back to single-column flow:', err);
        resetToFlow(el, items);
    }
}

let pendingFrame = 0;

/**
 * Requests a layout pass on the next frame. Safe to call from a resize handler
 * or an animation callback — repeated calls before the frame lands collapse
 * into a single pass.
 */
export function invalidateMasonry() {
    if (pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
        pendingFrame = 0;
        masonryLayout();
    });
}

export function initMasonry() {
    const el = container();
    if (!el) return;

    masonryLayout();
    window.addEventListener('load', invalidateMasonry);

    // Card heights change with their own content (images decoding, the reveal
    // clearing its transform), which is what actually invalidates the columns —
    // so observe the cards themselves rather than the style attributes this
    // module writes.
    const resizeObserver = new ResizeObserver(invalidateMasonry);
    Array.from(el.children).forEach(item => resizeObserver.observe(item));

    // Cards are only ever reordered or revealed, never added, so childList is
    // the one mutation still worth watching.
    new MutationObserver(invalidateMasonry).observe(el, { childList: true });

    // Width is the only dimension that changes the columns; ignoring height-only
    // resizes keeps mobile address-bar scroll from thrashing the layout.
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        invalidateMasonry();
    });
}
