export function prioritizeScreenshotProjects() {
    const container = document.querySelector('.projects-row');
    if (!container) return;

    const items = Array.from(container.children);
    if (items.length < 2) return;

    const isMobile = window.innerWidth <= 768;

    const mobilePinned = ['Redstone', 'Moss', 'Mlefia', 'Mosh', 'Naturalis by Anastasiia', 'Core LogicX', 'WhisperToCode', 'Eugen Hergert', 'CosyMC'];

    const getTitle = (li) => {
        const h3 = li.querySelector('.project-card h3');
        return h3 ? h3.textContent.trim() : '';
    };

    const sortedItems = items
        .map((item, index) => {
            const card = item.querySelector('.project-card');
            const title = getTitle(item);

            let priority;
            if (isMobile) {
                const pinnedIndex = mobilePinned.indexOf(title);
                priority = pinnedIndex !== -1 ? pinnedIndex : mobilePinned.length + index;
            } else {
                const hasScreenshot = Boolean(card && card.hasAttribute('data-screenshot'));
                const hasHref = Boolean(
                    card &&
                    card.tagName === 'A' &&
                    (card.getAttribute('href') || '').trim().length > 0
                );
                priority = hasScreenshot ? 0 : hasHref ? 1 : 2;
            }

            return { item, index, priority };
        })
        .sort((a, b) => {
            if (a.priority === b.priority) return a.index - b.index;
            return a.priority - b.priority;
        });

    const orderChanged = sortedItems.some((entry, index) => entry.item !== items[index]);
    if (!orderChanged) return;

    const fragment = document.createDocumentFragment();
    sortedItems.forEach(({ item }) => fragment.appendChild(item));
    container.appendChild(fragment);
}
