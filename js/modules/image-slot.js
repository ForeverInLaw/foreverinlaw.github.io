// A single <img> that swaps sources while the pointer moves between cards.
// Loads race: the shot for card B can resolve after the pointer has already
// moved on to card C, so every request carries a token and only the newest one
// is allowed to report a result.

/**
 * Reads the state an <img> is already in, for the case where the browser served
 * it from cache and neither onload nor onerror will fire.
 */
function settledState(image) {
    if (!image.complete) return null;
    return image.naturalWidth > 0 ? 'ready' : 'error';
}

/**
 * Wraps `image` in a slot with one method, show(src), reporting 'loading',
 * 'ready' or 'error' through `onState`. Ready also carries the natural aspect
 * ratio, which the caller needs to size the frame.
 */
export function createImageSlot(image, onState) {
    let activeToken = 0;

    const report = (token, state) => {
        if (token !== activeToken) return;
        onState(state, state === 'ready' ? naturalAspect() : null);
    };

    const naturalAspect = () =>
        (image.naturalWidth > 0 && image.naturalHeight > 0)
            ? `${image.naturalWidth} / ${image.naturalHeight}`
            : null;

    return {
        show(src, alt = '') {
            const token = ++activeToken;
            image.alt = alt;

            if (!src) {
                image.removeAttribute('src');
                report(token, 'error');
                return;
            }

            onState('loading', null);

            image.onload = () => report(token, 'ready');
            image.onerror = () => report(token, 'error');
            image.src = src;

            // A cached image is already done by the time src is assigned, and
            // fires neither handler.
            const settled = settledState(image);
            if (settled) report(token, settled);
        },

        /** Invalidates any in-flight load, e.g. when the preview is dismissed. */
        cancel() {
            activeToken += 1;
        }
    };
}
