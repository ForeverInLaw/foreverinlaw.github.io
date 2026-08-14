export function masonryLayout() {
    const container = document.querySelector('.projects-row');
    if (!container) return;

    const items = Array.from(container.children);
    if (items.length === 0) return;

    if (window.innerWidth <= 768) {
        container.style.height = 'auto';
        items.forEach(item => {
            item.style.position = 'relative';
            item.style.top = 'auto';
            item.style.left = 'auto';
            item.style.width = '100%';
        });
        return;
    }

    try {
        const gap = 16;
        const containerWidth = container.offsetWidth;
        const itemMinWidth = 280;
        const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemMinWidth + gap)));
        const itemWidth = (containerWidth - (gap * (columns - 1))) / columns;

        const columnHeights = new Array(columns).fill(0);

        items.forEach((item) => {
            item.style.width = `${itemWidth}px`;
            item.style.position = 'absolute';

            let minHeight = columnHeights[0];
            let column = 0;
            for (let i = 1; i < columns; i++) {
                if (columnHeights[i] < minHeight) {
                    minHeight = columnHeights[i];
                    column = i;
                }
            }

            item.style.left = `${column * (itemWidth + gap)}px`;
            item.style.top = `${columnHeights[column]}px`;

            columnHeights[column] += item.offsetHeight + gap;
        });

        container.style.height = `${Math.max(...columnHeights)}px`;

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    } catch (err) {
        // Never leave cards absolutely positioned and overlapping: fall back to flow
        console.warn('masonry layout failed; falling back to single-column flow:', err);
        container.style.height = 'auto';
        items.forEach(item => {
            item.style.position = 'relative';
            item.style.top = 'auto';
            item.style.left = 'auto';
            item.style.width = '100%';
        });
    }
}

export function initMasonry() {
    window.masonryLayout = masonryLayout;
    window.addEventListener('load', masonryLayout);
    setTimeout(masonryLayout, 500);
    masonryLayout();

    let resizeTimeout;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            masonryLayout();
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        }, 150);
    });

    const observer = new MutationObserver(() => masonryLayout());
    const projectsContainer = document.querySelector('.projects-row');
    if (projectsContainer) {
        observer.observe(projectsContainer, {
            childList: true,
            subtree: true,
            attributes: true,
        });
    }
}
