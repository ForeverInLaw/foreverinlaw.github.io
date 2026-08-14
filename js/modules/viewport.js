// One home for the responsive contract the JS shares with the stylesheets.
//
// Everything here goes through matchMedia rather than window.innerWidth. The
// two disagree by the width of the scrollbar, and modules that mixed them could
// land on opposite sides of the same breakpoint — the compact layout drops
// masonry's absolute positioning, so a module that thinks it is on desktop
// while another thinks it is on mobile produces overlapping cards.

const COMPACT_QUERY = '(max-width: 768px)';

// The mobile screenshot reel only makes sense where there is no hover to drive
// the desktop preview instead.
const TOUCH_REEL_QUERY = `${COMPACT_QUERY} and (hover: none)`;

const HOVER_PREVIEW_QUERY = '(hover: hover) and (pointer: fine)';
const FINE_POINTER_QUERY = '(pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const matches = (query) => window.matchMedia(query).matches;

/** Single-column layout: masonry off, stacked cards. */
export const isCompact = () => matches(COMPACT_QUERY);

/** Small screen with no hover — the inline screenshot reel applies. */
export const isTouchReel = () => matches(TOUCH_REEL_QUERY);

/** A real pointer that can hover, i.e. the floating project preview applies. */
export const canHoverPreview = () => matches(HOVER_PREVIEW_QUERY);

/** A precise pointer, hover or not — enough for the custom cursor. */
export const hasFinePointer = () => matches(FINE_POINTER_QUERY);

export const prefersReducedMotion = () => matches(REDUCED_MOTION_QUERY);

/** Runs `handler` whenever the compact breakpoint is actually crossed. */
export function onCompactChange(handler) {
    window.matchMedia(COMPACT_QUERY).addEventListener('change', (event) => handler(event.matches));
}
