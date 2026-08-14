import { hasFinePointer } from './viewport.js';
import { createFollower } from './pointer-follower.js';
import { INTERACTIVE_ELEMENTS } from './interactive.js';

export function initCursor() {
    if (!hasFinePointer()) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    // Only now hide the native cursor - no-JS / failed-init users keep a real pointer
    document.body.classList.add('has-custom-cursor');

    const follower = createFollower({
        onUpdate: (x, y) => {
            cursor.style.setProperty('--cursor-x', `${x}px`);
            cursor.style.setProperty('--cursor-y', `${y}px`);
        }
    });

    let hasMovedMouse = false;

    window.addEventListener('mousemove', (e) => {
        // The first move places the dot under the pointer instead of easing it
        // in from the top-left corner.
        if (!hasMovedMouse) {
            hasMovedMouse = true;
            cursor.classList.add('has-moved');
            follower.jumpTo(e.clientX, e.clientY);
            return;
        }

        follower.moveTo(e.clientX, e.clientY);
    });

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(INTERACTIVE_ELEMENTS)) {
            cursor.classList.add('cursor-hover');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (document.body.classList.contains('slider-dragging')) return;
        if (e.target.closest(INTERACTIVE_ELEMENTS)) {
            cursor.classList.remove('cursor-hover');
        }
    });
}
