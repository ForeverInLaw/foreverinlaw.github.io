/* global gsap, SplitText -- loaded as globals by libs/gsap/gsap-bundle.min.js */

// The hero <h1> is split into per-character spans and painted with a gradient
// that runs from --fg into --muted. Both the intro animation and the theme
// toggle need that gradient, so the split instance lives here in a closure
// instead of being parked on the element as heroTitle._rbsplitInstance.

// Characters before this point along the line stay at full --fg; the rest fade
// toward --muted.
const RAMP_START = 0.2;

const SPLIT_OPTIONS = {
    type: 'chars',
    smartWrap: true,
    charsClass: 'split-char',
    reduceWhiteSpace: false,
    tag: 'span'
};

let splitInstance = null;

const heroTitleEl = () => document.querySelector('.hero__inner h1');

/**
 * Blends two #rrggbb colours. factor 0 returns `from`, 1 returns `to`.
 */
export function interpolateColor(from, to, factor) {
    const a = Number.parseInt(from.replace('#', ''), 16);
    const b = Number.parseInt(to.replace('#', ''), 16);

    const channel = (shift) => {
        const start = (a >> shift) & 0xff;
        const end = (b >> shift) & 0xff;
        return Math.round(start + (end - start) * factor);
    };

    const r = channel(16);
    const g = channel(8);
    const bl = channel(0);

    return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/**
 * The gradient colour for character `index` of `total`, read from the live
 * theme custom properties.
 */
function rampColors(total) {
    const styles = getComputedStyle(document.documentElement);
    const fg = styles.getPropertyValue('--fg').trim();
    const muted = styles.getPropertyValue('--muted').trim();

    return Array.from({ length: total }, (_, index) => {
        const position = total > 1 ? index / (total - 1) : 0;
        if (position <= RAMP_START) return fg;
        return interpolateColor(fg, muted, (position - RAMP_START) / (1 - RAMP_START));
    });
}

function paint(apply) {
    if (!splitInstance) return;
    const { chars } = splitInstance;
    const colors = rampColors(chars.length);
    chars.forEach((char, index) => apply(char, colors[index]));
}

function revertSplit() {
    if (!splitInstance) return;
    try { splitInstance.revert(); } catch { /* already detached */ }
    splitInstance = null;
}

/**
 * Drops any animation state and leaves the title plainly visible. Used as the
 * fallback whenever SplitText is unavailable or throws.
 */
export function showHeroTitle() {
    const heroTitle = heroTitleEl();
    if (heroTitle) gsap.set(heroTitle, { opacity: 1, clearProps: 'all' });
}

/**
 * Splits the title, paints the gradient and plays the character stagger.
 * Safe to call twice - the previous split is reverted first.
 */
export function revealHeroTitle() {
    const heroTitle = heroTitleEl();
    if (!heroTitle) return;

    revertSplit();

    try {
        splitInstance = new SplitText(heroTitle, SPLIT_OPTIONS);
        paint((char, color) => { char.style.color = color; });

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
        splitInstance = null;
        showHeroTitle();
    }
}

/**
 * Re-runs the gradient against the current theme, tweening each character.
 * No-op until revealHeroTitle() has run.
 */
export function recolorHeroTitle() {
    paint((char, color) => {
        gsap.to(char, { color, duration: 0.5, ease: 'power2.out' });
    });
}
