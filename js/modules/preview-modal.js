import { readProjectCard, screenshotCards, SCREENSHOT_CARD_SELECTOR } from './project-card.js';
import { canHoverPreview, prefersReducedMotion } from './viewport.js';
import { createFollower, placeNearPointer } from './pointer-follower.js';
import { createImageSlot } from './image-slot.js';

function initProjectPreview() {
    const modal = document.getElementById('project-preview-modal');
    if (!modal) return;

    const previewImage = document.getElementById('preview-image');
    const previewTitle = document.getElementById('preview-title');
    const previewDesc = document.getElementById('preview-desc');
    const previewDomain = document.getElementById('preview-domain');
    const previewTags = document.getElementById('preview-tags');
    const previewBrowser = modal.querySelector('.preview-browser');
    const previewInfo = modal.querySelector('.preview-info');
    const previewImageWrapper = modal.querySelector('.preview-image-wrapper');
    const cardSelector = SCREENSHOT_CARD_SELECTOR;
    const projectCards = screenshotCards();

    if (!previewImage || !previewTitle || !previewDesc || !previewDomain || !previewTags || !previewBrowser || !previewInfo || projectCards.length === 0) {
        return;
    }

    const pointerOffset = 20;
    let hideTimer = null;
    let activeCard = null;
    let contentTransitionToken = 0;
    const lastPointer = { x: 0, y: 0 };
    const contentTargets = [previewBrowser, previewInfo];
    const tiltState = { x: 0, y: 0 };

    const follower = createFollower({
        ease: 0.3,
        onUpdate: (x, y) => gsap.set(modal, { x, y })
    });

    const imageSlot = createImageSlot(previewImage, (state, aspect) => {
        modal.classList.toggle('is-loading', state === 'loading');
        modal.classList.toggle('is-error', state === 'error');
        if (aspect) previewImageWrapper.style.setProperty('--preview-aspect', aspect);
    });

    const applyTiltState = () => {
        modal.style.setProperty('--preview-tilt-x', `${tiltState.x.toFixed(2)}deg`);
        modal.style.setProperty('--preview-tilt-y', `${tiltState.y.toFixed(2)}deg`);
    };

    const tiltXTo = gsap.quickTo(tiltState, 'x', {
        duration: 0.2,
        ease: 'power3.out',
        onUpdate: applyTiltState
    });
    const tiltYTo = gsap.quickTo(tiltState, 'y', {
        duration: 0.2,
        ease: 'power3.out',
        onUpdate: applyTiltState
    });

    const resetTilt = () => {
        tiltXTo(0);
        tiltYTo(0);
    };

    const setModalPosition = (pointerX, pointerY, immediate = false) => {
        const { x, y } = placeNearPointer(
            { x: pointerX, y: pointerY },
            modal.getBoundingClientRect(),
            { width: window.innerWidth, height: window.innerHeight },
            pointerOffset
        );

        if (immediate) follower.jumpTo(x, y);
        else follower.moveTo(x, y);
    };

    const setTiltFromPointer = (event, card = activeCard) => {
        if (!card) return;

        const bounds = card.getBoundingClientRect();
        const width = Math.max(bounds.width, 1);
        const height = Math.max(bounds.height, 1);

        const localX = (event.clientX - bounds.left) / width;
        const localY = (event.clientY - bounds.top) / height;

        const normalizedX = gsap.utils.clamp(-1, 1, (localX - 0.5) * 2);
        const normalizedY = gsap.utils.clamp(-1, 1, (localY - 0.5) * 2);

        const maxTiltY = 14;
        const maxTiltX = 11;
        const rotateY = normalizedX * maxTiltY;
        const rotateX = -normalizedY * maxTiltX;

        tiltXTo(rotateX);
        tiltYTo(rotateY);
    };

    const fillPreviewTags = (tags) => {
        const fragment = document.createDocumentFragment();
        tags.forEach((tag) => {
            const chip = document.createElement('span');
            chip.className = 'preview-tag-chip';
            chip.textContent = tag;
            fragment.appendChild(chip);
        });
        previewTags.replaceChildren(fragment);
    };

    const updatePreviewContent = (card) => {
        const { title, description, screenshot, domain, tags } = readProjectCard(card);

        previewTitle.textContent = title;
        previewDesc.textContent = description;
        previewDomain.textContent = domain;
        fillPreviewTags(tags);

        imageSlot.show(screenshot, `${title} screenshot`);
    };

    const transitionPreviewContent = (card) => {
        const token = ++contentTransitionToken;
        gsap.killTweensOf(contentTargets);

        gsap.to(contentTargets, {
            autoAlpha: 0.44,
            filter: 'blur(6px)',
            scale: 0.988,
            duration: 0.08,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => {
                if (token !== contentTransitionToken) return;
                updatePreviewContent(card);

                gsap.fromTo(contentTargets, {
                    autoAlpha: 0.44,
                    filter: 'blur(6px)',
                    scale: 0.988
                }, {
                    autoAlpha: 1,
                    filter: 'blur(0px)',
                    scale: 1,
                    duration: 0.12,
                    ease: 'power2.out',
                    overwrite: true
                });
            }
        });
    };

    const showPreview = (event, card) => {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        const wasVisible = modal.classList.contains('is-visible');
        const switchedCard = wasVisible && activeCard && activeCard !== card;
        activeCard = card;

        modal.classList.add('is-visible');
        modal.setAttribute('aria-hidden', 'false');

        if (switchedCard) {
            transitionPreviewContent(card);
        } else {
            gsap.set(contentTargets, { autoAlpha: 1, filter: 'blur(0px)', scale: 1 });
            updatePreviewContent(card);
        }

        setModalPosition(event.clientX, event.clientY, !wasVisible);
        setTiltFromPointer(event, card);

        if (!wasVisible) {
            gsap.killTweensOf(modal, 'autoAlpha,scale');
            gsap.to(modal, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.34,
                ease: 'power3.out'
            });
            return;
        }

        gsap.killTweensOf(modal, 'autoAlpha');
        gsap.to(modal, {
            autoAlpha: 1,
            duration: 0.12,
            overwrite: true
        });
    };

    const movePreview = (event) => {
        lastPointer.x = event.clientX;
        lastPointer.y = event.clientY;

        const elementUnderPointer = document.elementFromPoint(event.clientX, event.clientY);
        const cardUnderPointer = elementUnderPointer && elementUnderPointer.closest ? elementUnderPointer.closest(cardSelector) : null;

        if (cardUnderPointer) {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }

            if (activeCard !== cardUnderPointer) {
                showPreview(event, cardUnderPointer);
                return;
            }
        } else {
            if (activeCard && !hideTimer) {
                hidePreview(false);
            }
            return;
        }

        if (!modal.classList.contains('is-visible')) return;
        setModalPosition(event.clientX, event.clientY);
        setTiltFromPointer(event, cardUnderPointer || activeCard);
    };

    const hidePreview = (force = false) => {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        const performHide = () => {
            if (!force) {
                const elementUnderPointer = document.elementFromPoint(lastPointer.x, lastPointer.y);
                const cardUnderPointer = elementUnderPointer && elementUnderPointer.closest ? elementUnderPointer.closest(cardSelector) : null;
                if (cardUnderPointer) {
                    showPreview({ clientX: lastPointer.x, clientY: lastPointer.y }, cardUnderPointer);
                    return;
                }
            }

            hideTimer = null;
            activeCard = null;
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('is-loading');
            imageSlot.cancel();
            resetTilt();
            follower.stop();
            contentTransitionToken += 1;
            gsap.killTweensOf(contentTargets);
            gsap.set(contentTargets, { autoAlpha: 1, filter: 'blur(0px)', scale: 1 });

            gsap.killTweensOf(modal, 'autoAlpha,scale');
            gsap.to(modal, {
                autoAlpha: 0,
                scale: 0.95,
                duration: 0.22,
                ease: 'power2.in',
                onComplete: () => {
                    modal.classList.remove('is-visible');
                }
            });
        };

        // Force (scroll, blur, tab-hidden): hide immediately. The 40ms
        // debounce only serves the non-force case (mouse jumped to a sibling
        // card). For forced hides it stalls hiding during inertial scroll,
        // where scroll events fire every frame and keep resetting the timer.
        if (force) {
            performHide();
            return;
        }

        hideTimer = setTimeout(performHide, 40);
    };

    projectCards.forEach(card => {
        card.addEventListener('mouseenter', (event) => showPreview(event, card));
        card.addEventListener('mouseleave', (event) => {
            const nextCard = event.relatedTarget && event.relatedTarget.closest
                ? event.relatedTarget.closest(cardSelector)
                : null;
            hidePreview(!nextCard);
        });
    });

    document.addEventListener('mousemove', movePreview);
    document.addEventListener('mouseleave', () => hidePreview(true));

    // Fire hide once per scroll gesture. performHide sets activeCard=null, so
    // the guard skips the 60fps follow-up scroll events that would otherwise
    // call gsap.killTweensOf + a fresh gsap.to every frame — restarting the
    // fade from the current opacity and stalling it until scrolling stops.
    window.addEventListener('scroll', () => {
        if (activeCard) hidePreview(true);
    }, { passive: true });
    window.addEventListener('blur', () => hidePreview(true));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') {
            hidePreview(true);
        }
    });
}

export function initPreviewModal() {
    if (!canHoverPreview()) return;
    if (prefersReducedMotion()) return;
    initProjectPreview();

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            screenshotCards().forEach(card => {
                const { screenshot } = readProjectCard(card);
                if (!screenshot) return;
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = screenshot;
                document.head.appendChild(link);
            });
        }, { timeout: 2000 });
    }
}
