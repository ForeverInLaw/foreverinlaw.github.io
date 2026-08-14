export function initCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    // Only now hide the native cursor — no-JS / failed-init users keep a real pointer
    document.body.classList.add('has-custom-cursor');

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let hasMovedMouse = false;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!hasMovedMouse) {
            cursorX = mouseX;
            cursorY = mouseY;
            cursor.classList.add('has-moved');
            hasMovedMouse = true;
        }
    });

    function animate() {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;

        cursor.style.setProperty('--cursor-x', cursorX + 'px');
        cursor.style.setProperty('--cursor-y', cursorY + 'px');

        requestAnimationFrame(animate);
    }

    animate();

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(window.INTERACTIVE_ELEMENTS)) {
            cursor.classList.add('cursor-hover');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (document.body.classList.contains('slider-dragging')) return;
        if (e.target.closest(window.INTERACTIVE_ELEMENTS)) {
            cursor.classList.remove('cursor-hover');
        }
    });
}
