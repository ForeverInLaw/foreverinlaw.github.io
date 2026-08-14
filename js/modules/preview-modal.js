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
    const cardSelector = '.projects .project-card[data-screenshot]';
    const projectCards = document.querySelectorAll(cardSelector);

    if (!previewImage || !previewTitle || !previewDesc || !previewDomain || !previewTags || !previewBrowser || !previewInfo || projectCards.length === 0) {
        return;
    }

    const pointerOffset = 20;
    let hideTimer = null;
    let activeCard = null;
    let activeImageToken = 0;
    let contentTransitionToken = 0;
    const lastPointer = { x: 0, y: 0 };
    const contentTargets = [previewBrowser, previewInfo];
    const followState = { x: 0, y: 0, targetX: 0, targetY: 0, rafId: 0 };
    const tiltState = { x: 0, y: 0 };

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

    const stopFollowLoop = () => {
        if (!followState.rafId) return;
        cancelAnimationFrame(followState.rafId);
        followState.rafId = 0;
    };

    const runFollowLoop = () => {
        if (followState.rafId) return;

        const tick = () => {
            if (!activeCard || !modal.classList.contains('is-visible')) {
                followState.rafId = 0;
                return;
            }

            const dx = followState.targetX - followState.x;
            const dy = followState.targetY - followState.y;

            if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) {
                followState.x = followState.targetX;
                followState.y = followState.targetY;
                gsap.set(modal, { x: followState.x, y: followState.y });
                followState.rafId = 0;
                return;
            }

            followState.x += dx * 0.3;
            followState.y += dy * 0.3;
            gsap.set(modal, { x: followState.x, y: followState.y });
            followState.rafId = requestAnimationFrame(tick);
        };

        followState.rafId = requestAnimationFrame(tick);
    };

    const setModalPosition = (pointerX, pointerY, immediate = false) => {
        const { width, height } = modal.getBoundingClientRect();
        const maxX = window.innerWidth - pointerOffset;
        const maxY = window.innerHeight - pointerOffset;

        let targetX = pointerX + pointerOffset;
        let targetY = pointerY + pointerOffset;

        if (targetX + width > maxX) {
            targetX = pointerX - width - pointerOffset;
        }
        if (targetY + height > maxY) {
            targetY = pointerY - height - pointerOffset;
        }

        targetX = Math.max(pointerOffset, Math.min(targetX, maxX - width));
        targetY = Math.max(pointerOffset, Math.min(targetY, maxY - height));

        followState.targetX = targetX;
        followState.targetY = targetY;

        if (immediate) {
            stopFollowLoop();
            followState.x = targetX;
            followState.y = targetY;
            gsap.set(modal, { x: targetX, y: targetY });
            return;
        }

        runFollowLoop();
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

    const fillPreviewTags = (card) => {
        previewTags.innerHTML = '';
        const tags = card.querySelectorAll('.project-tag');
        if (!tags.length) return;

        const fragment = document.createDocumentFragment();
        tags.forEach((tag, index) => {
            if (index > 3) return;
            const chip = document.createElement('span');
            chip.className = 'preview-tag-chip';
            chip.textContent = tag.textContent?.trim() || '';
            fragment.appendChild(chip);
        });
        previewTags.appendChild(fragment);
    };

    const updatePreviewContent = (card) => {
        const screenshot = card.getAttribute('data-screenshot') || '';
        const title = card.querySelector('h3')?.textContent?.trim() || 'Project';
        const desc = card.querySelector('p')?.textContent?.trim() || 'No short description provided.';
        const href = card.tagName.toLowerCase() === 'a' ? card.getAttribute('href') || '' : '';

        let domainLabel = 'Private project';

        if (href && /^https?:\/\//i.test(href)) {
            try {
                const url = new URL(href);
                domainLabel = url.hostname.replace(/^www\./, '');
            } catch (error) {
                domainLabel = href;
            }
        } else if (href) {
            domainLabel = href;
        }

        previewTitle.textContent = title;
        previewDesc.textContent = desc;
        previewDomain.textContent = domainLabel;
        fillPreviewTags(card);

        modal.classList.remove('is-error');
        modal.classList.add('is-loading');

        const token = ++activeImageToken;
        previewImage.alt = `${title} screenshot`;

        if (!screenshot) {
            previewImage.removeAttribute('src');
            modal.classList.remove('is-loading');
            modal.classList.add('is-error');
            return;
        }

        const applyNaturalAspect = () => {
            if (previewImage.naturalWidth > 0 && previewImage.naturalHeight > 0) {
                previewImageWrapper.style.setProperty(
                    '--preview-aspect',
                    `${previewImage.naturalWidth} / ${previewImage.naturalHeight}`
                );
            }
        };

        previewImage.onload = () => {
            if (token !== activeImageToken) return;
            applyNaturalAspect();
            modal.classList.remove('is-loading', 'is-error');
        };

        previewImage.onerror = () => {
            if (token !== activeImageToken) return;
            modal.classList.remove('is-loading');
            modal.classList.add('is-error');
        };

        previewImage.src = screenshot;

        if (previewImage.complete) {
            if (previewImage.naturalWidth > 0) {
                applyNaturalAspect();
                modal.classList.remove('is-loading', 'is-error');
            } else {
                modal.classList.remove('is-loading');
                modal.classList.add('is-error');
            }
        }
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
            resetTilt();
            stopFollowLoop();
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
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    initProjectPreview();

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            document.querySelectorAll('.project-card[data-screenshot]').forEach(card => {
                const src = card.getAttribute('data-screenshot');
                if (src) {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'image';
                    link.href = src;
                    document.head.appendChild(link);
                }
            });
        }, { timeout: 2000 });
    }
}
