// Eased pointer following, shared by the custom cursor and the project preview
// modal. Both used to run their own near-identical lerp loop against their own
// rAF handle, differing only in the easing factor.

const DEFAULT_EASE = 0.15;

// Below this distance the follower snaps to the target and parks the loop, so
// an idle pointer costs nothing.
const SETTLE_EPSILON = 0.15;

/**
 * Places a box of `size` next to `pointer`, flipping to the other side when it
 * would overrun the viewport and clamping so it always stays fully visible.
 * Pure - the geometry can be checked without a DOM.
 */
export function placeNearPointer(pointer, size, viewport, offset) {
    const limit = { x: viewport.width - offset, y: viewport.height - offset };

    const axis = (position, extent, max) => {
        const after = position + offset;
        const candidate = after + extent > max ? position - extent - offset : after;
        return Math.max(offset, Math.min(candidate, max - extent));
    };

    return {
        x: axis(pointer.x, size.width, limit.x),
        y: axis(pointer.y, size.height, limit.y)
    };
}

/**
 * Creates a follower that eases toward whatever target it was last given.
 * `onUpdate(x, y)` runs once per frame while it is catching up.
 */
export function createFollower({ ease = DEFAULT_EASE, onUpdate }) {
    const current = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let rafId = 0;

    const stop = () => {
        if (!rafId) return;
        cancelAnimationFrame(rafId);
        rafId = 0;
    };

    const tick = () => {
        const dx = target.x - current.x;
        const dy = target.y - current.y;

        if (Math.abs(dx) < SETTLE_EPSILON && Math.abs(dy) < SETTLE_EPSILON) {
            current.x = target.x;
            current.y = target.y;
            onUpdate(current.x, current.y);
            rafId = 0;
            return;
        }

        current.x += dx * ease;
        current.y += dy * ease;
        onUpdate(current.x, current.y);
        rafId = requestAnimationFrame(tick);
    };

    return {
        /** Eases toward (x, y), starting the loop if it had settled. */
        moveTo(x, y) {
            target.x = x;
            target.y = y;
            if (!rafId) rafId = requestAnimationFrame(tick);
        },

        /** Jumps to (x, y) without easing - for the first appearance. */
        jumpTo(x, y) {
            stop();
            current.x = target.x = x;
            current.y = target.y = y;
            onUpdate(x, y);
        },

        stop
    };
}
