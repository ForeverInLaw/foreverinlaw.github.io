import { readProjectCard } from './project-card.js';
import { isCompact } from './viewport.js';

export function prioritizeScreenshotProjects() {
    const container = document.querySelector('.projects-row');
    if (!container) return;

    const items = Array.from(container.children);
    if (items.length < 2) return;

    const isMobile = isCompact();

    const mobilePinned = ['Redstone', 'Moss', 'Mlefia', 'Mosh', 'Naturalis by Anastasiia', 'Core LogicX', 'WhisperToCode', 'Eugen Hergert', 'CosyMC'];

    const sortedItems = items
        .map((item, index) => {
            const card = item.querySelector('.project-card');
            const { title, screenshot, href } = card
                ? readProjectCard(card)
                : { title: '', screenshot: '', href: '' };

            let priority;
            if (isMobile) {
                const pinnedIndex = mobilePinned.indexOf(title);
                priority = pinnedIndex !== -1 ? pinnedIndex : mobilePinned.length + index;
            } else {
                priority = screenshot ? 0 : href.trim() ? 1 : 2;
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
