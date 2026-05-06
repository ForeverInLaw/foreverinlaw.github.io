(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
})();

window.addEventListener('scroll', () => {
    document.body.style.setProperty('--scrollTop', `${window.scrollY}px`);
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');

    function prioritizeScreenshotProjects() {
        const container = document.querySelector('.projects-row');
        if (!container) return;

        const items = Array.from(container.children);
        if (items.length < 2) return;

        const isMobile = window.innerWidth <= 768;

        // Mobile: pin specific projects to top in exact order
        const mobilePinned = ['Core LogicX', 'Naturalis by Anastasiia', 'Mlefia', 'Axiome Chat', 'Eugen Hergert'];

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
                if (a.priority === b.priority) {
                    return a.index - b.index;
                }
                return a.priority - b.priority;
            });

        const orderChanged = sortedItems.some((entry, index) => entry.item !== items[index]);
        if (!orderChanged) return;

        const fragment = document.createDocumentFragment();
        sortedItems.forEach(({ item }) => fragment.appendChild(item));
        container.appendChild(fragment);
    }

    function initConnectCodeHover() {
        const cards = document.querySelectorAll('.hero__links .link-card');
        if (!cards.length) return;

        const characterSet = '!"№;%:?*()_+|/.,<>~`-=.,@#$^&[]{}';

        const generateRandomString = (length) => {
            return Array.from({ length }, () => {
                return characterSet[Math.floor(Math.random() * characterSet.length)];
            }).join('');
        };

        cards.forEach((card) => {
            if (card.querySelector('.link-card__code-bg')) return;

            const codeBg = document.createElement('div');
            codeBg.className = 'link-card__code-bg';
            codeBg.setAttribute('aria-hidden', 'true');
            card.appendChild(codeBg);

            const updatePointer = (clientX, clientY) => {
                const rect = card.getBoundingClientRect();
                const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
                card.style.setProperty('--code-x', `${x}px`);
                card.style.setProperty('--code-y', `${y}px`);
            };

            const refreshText = () => {
                const rect = card.getBoundingClientRect();
                const estimatedLength = Math.max(650, Math.min(2200, Math.round((rect.width * rect.height) / 14)));
                codeBg.textContent = generateRandomString(estimatedLength);
            };

            const start = () => {
                card.classList.add('is-code-hover');
                if (!codeBg.textContent) {
                    refreshText();
                }
            };

            const stop = () => {
                card.classList.remove('is-code-hover');
            };

            card.addEventListener('mouseenter', (event) => {
                updatePointer(event.clientX, event.clientY);
                start();
            });

            card.addEventListener('mousemove', (event) => {
                updatePointer(event.clientX, event.clientY);
                refreshText();
            });

            card.addEventListener('mouseleave', stop);
            card.addEventListener('focusin', start);
            card.addEventListener('focusout', stop);

            card.addEventListener('touchstart', (event) => {
                const touch = event.touches[0];
                if (!touch) return;
                updatePointer(touch.clientX, touch.clientY);
                start();
            }, { passive: true });

            card.addEventListener('touchmove', (event) => {
                const touch = event.touches[0];
                if (!touch) return;
                updatePointer(touch.clientX, touch.clientY);
                refreshText();
            }, { passive: true });

            card.addEventListener('touchend', stop, { passive: true });
            card.addEventListener('touchcancel', stop, { passive: true });
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#050505' : '#fafafa');
            }

            // Update aria-hidden attributes for GitHub stats images
            const updateStatsImages = () => {
                const darkImgs = document.querySelectorAll('.stats-img--dark, .graph-img--dark');
                const lightImgs = document.querySelectorAll('.stats-img--light, .graph-img--light');

                darkImgs.forEach(img => {
                    img.setAttribute('aria-hidden', newTheme === 'dark' ? 'false' : 'true');
                });

                lightImgs.forEach(img => {
                    img.setAttribute('aria-hidden', newTheme === 'light' ? 'false' : 'true');
                });
            };
            updateStatsImages();

            // Update hero title gradient colors with smooth transition
            updateHeroTitleColors();
        });
    }

    prioritizeScreenshotProjects();
    initConnectCodeHover();

    gsap.registerPlugin(SplitText, ScrollTrigger);
    // Disable auto-refresh to prevent iOS address bar resize jumps
    ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" });
    ScrollTrigger.config({ ignoreMobileResize: true });

    function updateHeroTitleColors() {
        const heroTitle = document.querySelector('.hero__inner h1');
        if (!heroTitle || !heroTitle._rbsplitInstance) return;

        const computedStyle = getComputedStyle(document.documentElement);
        const fgColor = computedStyle.getPropertyValue('--fg').trim();
        const mutedColor = computedStyle.getPropertyValue('--muted').trim();

        const interpolateColor = (color1, color2, factor) => {
            const c1 = Number.parseInt(color1.replace('#', ''), 16);
            const c2 = Number.parseInt(color2.replace('#', ''), 16);

            const r1 = (c1 >> 16) & 0xff;
            const g1 = (c1 >> 8) & 0xff;
            const b1 = c1 & 0xff;

            const r2 = (c2 >> 16) & 0xff;
            const g2 = (c2 >> 8) & 0xff;
            const b2 = c2 & 0xff;

            const r = Math.round(r1 + (r2 - r1) * factor);
            const g = Math.round(g1 + (g2 - g1) * factor);
            const b = Math.round(b1 + (b2 - b1) * factor);

            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        };

        const totalChars = heroTitle._rbsplitInstance.chars.length;

        // Animate color transition smoothly with GSAP
        heroTitle._rbsplitInstance.chars.forEach((char, index) => {
            const position = index / (totalChars - 1);
            let targetColor;
            if (position <= 0.2) {
                targetColor = fgColor;
            } else {
                const gradientFactor = (position - 0.2) / 0.8;
                targetColor = interpolateColor(fgColor, mutedColor, gradientFactor);
            }

            gsap.to(char, {
                color: targetColor,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
    }

    function initPageAnimations() {
        const heroTitle = document.querySelector('.hero__inner h1');

        function forceShowPrimarySections() {
            const connectTitle = document.querySelector('.hero__links .section-title');
            const projectsTitle = document.querySelector('.projects .section-title');
            const linkCards = document.querySelectorAll('.hero__links .link-card');
            const projectCards = Array.from(document.querySelectorAll('.projects .project-card')).slice(0, 6);

            [connectTitle, projectsTitle].forEach(el => {
                if (!el) return;
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.style.transform = 'none';
                el.style.filter = 'none';
            });

            [...linkCards, ...projectCards].forEach(el => {
                if (!el) return;
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.style.transform = 'none';
                el.style.filter = 'none';
            });
        }

        function runSectionsIntro() {
            try {
                const connectTitle = document.querySelector('.hero__links .section-title');
                const linkCards = gsap.utils.toArray('.hero__links .link-card');
                const projectsTitle = document.querySelector('.projects .section-title');
                const projectCards = gsap.utils.toArray('.projects .project-card');
                const entryProjectCards = projectCards.slice(0, Math.min(projectCards.length, 6));
                const titleTargets = [connectTitle, projectsTitle].filter(Boolean);

                entryProjectCards.forEach(card => {
                    card.dataset.entryRevealed = 'true';
                });

                if (titleTargets.length > 0) {
                    gsap.set(titleTargets, { autoAlpha: 0, y: 20 });
                }
                if (linkCards.length > 0) {
                    gsap.set(linkCards, { autoAlpha: 0, y: 24, filter: 'blur(6px)' });
                }
                if (entryProjectCards.length > 0) {
                    gsap.set(entryProjectCards, { autoAlpha: 0, y: 30, filter: 'blur(8px)' });
                }

                const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

                if (connectTitle) {
                    introTl.to(connectTitle, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.45
                    }, 0.18);
                }

                if (linkCards.length > 0) {
                    introTl.to(linkCards, {
                        autoAlpha: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.58,
                        stagger: 0.07
                    }, 0.24);
                }

                if (projectsTitle) {
                    introTl.to(projectsTitle, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.45
                    }, 0.42);
                }

                if (entryProjectCards.length > 0) {
                    introTl.to(entryProjectCards, {
                        autoAlpha: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.62,
                        stagger: 0.06
                    }, 0.48);
                }
            } catch (error) {
                console.warn('Sections intro animation failed:', error);
                forceShowPrimarySections();
            }
        }

        const runHeroAnimation = () => {
            if (!heroTitle) return;

            // Cleanup if exists
            if (heroTitle._rbsplitInstance) {
                try { heroTitle._rbsplitInstance.revert(); } catch (e) { }
                heroTitle._rbsplitInstance = null;
            }

            try {
                const splitInstance = new SplitText(heroTitle, {
                    type: 'chars',
                    smartWrap: true,
                    charsClass: 'split-char',
                    reduceWhiteSpace: false,
                    tag: 'span'
                });

                heroTitle._rbsplitInstance = splitInstance;

                // Get CSS variable colors
                const computedStyle = getComputedStyle(document.documentElement);
                const fgColor = computedStyle.getPropertyValue('--fg').trim();
                const mutedColor = computedStyle.getPropertyValue('--muted').trim();

                // Helper to interpolate between two hex colors
                const interpolateColor = (color1, color2, factor) => {
                    const c1 = Number.parseInt(color1.replace('#', ''), 16);
                    const c2 = Number.parseInt(color2.replace('#', ''), 16);

                    const r1 = (c1 >> 16) & 0xff;
                    const g1 = (c1 >> 8) & 0xff;
                    const b1 = c1 & 0xff;

                    const r2 = (c2 >> 16) & 0xff;
                    const g2 = (c2 >> 8) & 0xff;
                    const b2 = c2 & 0xff;

                    const r = Math.round(r1 + (r2 - r1) * factor);
                    const g = Math.round(g1 + (g2 - g1) * factor);
                    const b = Math.round(b1 + (b2 - b1) * factor);

                    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                };

                // Assign color to each character based on position
                const totalChars = splitInstance.chars.length;
                splitInstance.chars.forEach((char, index) => {
                    const position = index / (totalChars - 1); // 0 to 1
                    let color;
                    if (position <= 0.2) {
                        color = fgColor;
                    } else {
                        const gradientFactor = (position - 0.2) / 0.8;
                        color = interpolateColor(fgColor, mutedColor, gradientFactor);
                    }
                    char.style.color = color;
                });

                // Set initial state
                gsap.set(splitInstance.chars, {
                    opacity: 0,
                    y: 40
                });

                // Animate in
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
                // Fallback to visible if animation fails
                gsap.set(heroTitle, { opacity: 1, clearProps: 'all' });
            }
        };

        const runIntroSequence = () => {
            runHeroAnimation();
            runSectionsIntro();
            initScrollAnimations();

            // Safety net: never leave primary sections hidden if any animation step fails.
            setTimeout(() => {
                const connectTitle = document.querySelector('.hero__links .section-title');
                const projectsTitle = document.querySelector('.projects .section-title');
                const connectHidden = connectTitle && getComputedStyle(connectTitle).visibility === 'hidden';
                const projectsHidden = projectsTitle && getComputedStyle(projectsTitle).visibility === 'hidden';
                if (connectHidden || projectsHidden) {
                    forceShowPrimarySections();
                }
            }, 1400);
        };

        // Run animation when fonts load or after timeout.
        // Keep it resilient for browsers where document.fonts is unavailable.
        const fontsReadyPromise = (document.fonts && document.fonts.ready)
            ? document.fonts.ready
            : Promise.resolve();

        Promise.race([
            fontsReadyPromise,
            new Promise(resolve => setTimeout(resolve, 1000))
        ]).then(runIntroSequence).catch(() => {
            runIntroSequence();
        });

    }

    const spotifyWidget = document.getElementById('spotify-now-playing');
    const spotifyTitle = document.querySelector('.spotify-title');
    const apiUrl = 'https://spotify-show-last-68db402e666c.herokuapp.com/api/now-playing';

    if (spotifyTitle) {
        spotifyTitle.classList.add('loading');
    }

    async function fetchJsonWithFallback(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(url, {
                    cache: 'no-store',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                if (i === retries - 1) {
                    console.error('Fetch failed after retries:', error);
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        return null;
    }

    let currentTrackId = null;
    let currentIframe = null;
    let isFetching = false;

    function updateTitleText(newText) {
        if (!spotifyTitle || spotifyTitle.textContent === newText) return;

        spotifyTitle.classList.add('fade-out');

        setTimeout(() => {
            spotifyTitle.textContent = newText;
            spotifyTitle.classList.remove('fade-out');
            spotifyTitle.classList.add('fade-in');

            if (newText !== 'Loading...') {
                spotifyTitle.classList.remove('loading');
            }

            setTimeout(() => {
                spotifyTitle.classList.remove('fade-in');
            }, 500);
        }, 200);
    }

    if (spotifyWidget) {
        const placeholder = document.createElement('div');
        placeholder.className = 'np-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.innerHTML = '<div></div>';
        spotifyWidget.appendChild(placeholder);
    }

    function showTrack(html) {
        if (!spotifyWidget) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newIframe = tempDiv.querySelector('iframe');

        if (!newIframe) return;

        if (currentIframe) {
            currentIframe.remove();
        }
        currentIframe = newIframe;

        newIframe.title = 'Spotify player';
        newIframe.loading = 'lazy';

        spotifyWidget.appendChild(currentIframe);

        currentIframe.onload = () => {
            spotifyWidget.classList.add('is-loaded');
        };

        currentIframe.onerror = () => {
            console.error('Failed to load Spotify iframe');
            showPlaceholder();
        };
    }

    function showPlaceholder() {
        if (spotifyWidget) {
            spotifyWidget.classList.remove('is-loaded');
        }
    }

    async function fetchNowPlaying() {
        if (isFetching) return;
        isFetching = true;

        try {
            const data = await fetchJsonWithFallback(apiUrl);

            if (!data) {
                throw new Error('No data received');
            }

            const newTitle = data?.isPlaying ? 'Now Playing' : 'Last Played';
            updateTitleText(newTitle);

            if (!data?.trackId) {
                if (currentTrackId !== null) {
                    currentTrackId = null;
                    showPlaceholder();
                }
                return;
            }

            if (data.trackId === currentTrackId) {
                return;
            }

            currentTrackId = data.trackId;
            const spotifyTrackUrl = `https://open.spotify.com/track/${encodeURIComponent(data.trackId)}`;
            const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyTrackUrl)}`;
            const oembedData = await fetchJsonWithFallback(oembedUrl);

            if (oembedData?.html) {
                showTrack(oembedData.html);
            } else {
                throw new Error('Invalid oEmbed data');
            }
        } catch (error) {
            console.error('Error fetching Spotify data:', error);
            currentTrackId = null;
            updateTitleText('Loading...');
            if (spotifyTitle) {
                spotifyTitle.classList.add('loading');
            }
            showPlaceholder();
        } finally {
            isFetching = false;
        }
    }

    if (spotifyWidget) {
        fetchNowPlaying();
        setInterval(fetchNowPlaying, 15000);
    }

    window.masonryLayout = function () {
        const container = document.querySelector('.projects-row');
        if (!container) return;

        const items = Array.from(container.children);
        if (items.length === 0) return;

        // Reset styles if mobile
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

        const gap = 16;
        const containerWidth = container.offsetWidth;
        const itemMinWidth = 280;
        const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemMinWidth + gap)));
        const itemWidth = (containerWidth - (gap * (columns - 1))) / columns;

        const columnHeights = new Array(columns).fill(0);

        items.forEach((item, index) => {
            item.style.width = `${itemWidth}px`;
            item.style.position = 'absolute';

            // Find the column with the smallest height to create a true masonry layout
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
    }

    window.addEventListener('load', window.masonryLayout);
    setTimeout(window.masonryLayout, 500);

    window.masonryLayout();

    // Проверяем, показывать ли entry screen
    const entryScreen = document.getElementById('entry-screen');
    const shouldShowEntry = entryScreen && !entryScreen.classList.contains('hidden');

    if (!shouldShowEntry) {
        // Если entry screen не показывается, запускаем анимации сразу
        initPageAnimations();
    } else {
        // Ждем события от slider (once: true - удаляет listener после первого срабатывания)
        window.addEventListener('entryCompleted', initPageAnimations, { once: true });
    }

    function initScrollAnimations() {
        const projectCards = document.querySelectorAll('.project-card');
        const scrollRevealSelector = '.project-card:not([data-entry-revealed="true"])';
        const scrollRevealCards = document.querySelectorAll(scrollRevealSelector);
        gsap.set(scrollRevealCards, {
            autoAlpha: 0,
            y: 26,
            filter: 'blur(8px)'
        });

        // Используем более раннюю активацию для мобильных устройств
        const isMobile = window.innerWidth <= 768;
        const startPosition = isMobile ? 'top 105%' : 'top 90%';

        const projectsRow = document.querySelector('.projects-row');
        let revealedCount = projectCards.length - scrollRevealCards.length;

        function markInteractiveIfDone() {
            if (!projectsRow || projectCards.length === 0) return;
            if (revealedCount >= projectCards.length) {
                projectsRow.classList.add('is-interactive');
            }
        }

        if (scrollRevealCards.length > 0) {
            ScrollTrigger.batch(scrollRevealSelector, {
                start: startPosition,
                once: true,
                onEnter: (batch) => gsap.to(batch, {
                    duration: 0.6,
                    autoAlpha: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    stagger: 0.08,
                    ease: 'power3.out',
                    overwrite: 'auto'
                }).then(() => {
                    batch.forEach(el => {
                        gsap.set(el, { clearProps: 'transform,filter' });
                        if (!el.dataset.revealed) {
                            el.dataset.revealed = 'true';
                            revealedCount += 1;
                        }
                    });
                    markInteractiveIfDone();
                    setTimeout(() => {
                        if (window.masonryLayout) window.masonryLayout();
                    }, 100);
                })
            });
        }

        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => markInteractiveIfDone());
        } else {
            setTimeout(markInteractiveIfDone, 500);
        }

        window.addEventListener('beforeunload', () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        });
    }

    let resizeTimeout;
    let lastWidth = window.innerWidth;

    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;

        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            window.masonryLayout();
            ScrollTrigger.refresh(); // Manually refresh only on width change
        }, 150);
    });

    const observer = new MutationObserver(() => {
        window.masonryLayout();
    });

    const projectsContainer = document.querySelector('.projects-row');
    if (projectsContainer) {
        observer.observe(projectsContainer, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

    if (window.matchMedia('(pointer: fine)').matches) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

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

        // Общий список интерактивных элементов для кастомного курсора
        window.INTERACTIVE_ELEMENTS = 'a, button, input, textarea, select, .link-card, .project-card, .theme-toggle, .slide-button-handle, .playlist-card';

        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(window.INTERACTIVE_ELEMENTS)) {
                cursor.classList.add('cursor-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            // Не убираем hover если идет драг слайдера
            if (document.body.classList.contains('slider-dragging')) {
                return;
            }
            if (e.target.closest(window.INTERACTIVE_ELEMENTS)) {
                cursor.classList.remove('cursor-hover');
            }
        });
    }

    // Project Preview Modal
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
            }

            hideTimer = setTimeout(() => {
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
            }, 40);
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

        window.addEventListener('scroll', () => hidePreview(true), { passive: true });
        window.addEventListener('blur', () => hidePreview(true));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') {
                hidePreview(true);
            }
        });
    }

    // Only on non-touch devices
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        initProjectPreview();

        // Preload screenshot images to avoid lag on first hover
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

    // Projects "Show more" toggle (mobile)
    const showMoreBtn = document.getElementById('projects-show-more');
    if (showMoreBtn) {
        const projectsRow = document.querySelector('.projects-row');
        const btnText = showMoreBtn.querySelector('.projects-show-more__text');
        const totalCount = projectsRow ? projectsRow.children.length : 0;
        const VISIBLE_COUNT = 5;

        if (totalCount <= VISIBLE_COUNT) {
            showMoreBtn.style.display = 'none';
        } else {
            showMoreBtn.addEventListener('click', () => {
                const isExpanding = !projectsRow.classList.contains('is-expanded');
                const hiddenItems = Array.from(projectsRow.children).slice(VISIBLE_COUNT);

                if (isExpanding) {
                    projectsRow.classList.add('is-expanded');
                    showMoreBtn.setAttribute('aria-expanded', 'true');
                    btnText.textContent = 'Show less';

                    gsap.fromTo(hiddenItems, {
                        autoAlpha: 0,
                        y: 20,
                    }, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.4,
                        stagger: 0.06,
                        ease: 'power3.out',
                        onComplete: () => {
                            gsap.set(hiddenItems, { clearProps: 'transform,opacity,visibility' });
                        }
                    });

                } else {
                    // Scroll to projects section first, then collapse
                    const projectsSection = projectsRow.closest('.projects');
                    if (projectsSection) {
                        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }

                    // Wait for scroll to settle, then collapse
                    setTimeout(() => {
                        gsap.to(hiddenItems.reverse(), {
                            autoAlpha: 0,
                            y: -10,
                            duration: 0.2,
                            stagger: 0.02,
                            ease: 'power2.in',
                            onComplete: () => {
                                projectsRow.classList.remove('is-expanded');
                                showMoreBtn.setAttribute('aria-expanded', 'false');
                                btnText.textContent = `Show all projects (${totalCount})`;
                                gsap.set(hiddenItems, { clearProps: 'transform,opacity,visibility' });
                            }
                        });
                    }, 400);
                }
            });
            btnText.textContent = `Show all projects (${totalCount})`;
        }
    }

    // Graph scroll fade hint (mobile) — start scrolled to the right (latest contributions)
    const graphContent = document.querySelector('.graph-card .card-content');
    if (graphContent) {
        const scrollToEnd = () => { graphContent.scrollLeft = graphContent.scrollWidth; };

        // Scroll to right once images load
        const graphImgs = graphContent.querySelectorAll('img');
        if (graphImgs.length) {
            graphImgs.forEach(img => {
                if (img.complete) return;
                img.addEventListener('load', scrollToEnd, { once: true });
            });
        }
        scrollToEnd();

        // Fade edges based on scroll position
        const updateFade = () => {
            const atLeft = graphContent.scrollLeft <= 10;
            const atRight = graphContent.scrollLeft + graphContent.clientWidth >= graphContent.scrollWidth - 10;

            graphContent.classList.remove('fade-left', 'fade-right', 'fade-both');
            if (!atLeft && !atRight) graphContent.classList.add('fade-both');
            else if (!atLeft) graphContent.classList.add('fade-left');
            else if (!atRight) graphContent.classList.add('fade-right');
        };
        graphContent.addEventListener('scroll', updateFade, { passive: true });
        updateFade();
    }

    // Playlist stack carousel (mobile)
    function initPlaylistStack(container) {
        const items = Array.from(container.children);
        if (items.length === 0) return;

        let current = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        let touchDeltaX = 0;
        let isSwiping = false;

        // Create dots
        const dotsWrapper = document.createElement('div');
        dotsWrapper.className = 'stack-dots';
        items.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'stack-dot';
            dot.setAttribute('aria-label', `Playlist ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsWrapper.appendChild(dot);
        });
        container.parentNode.appendChild(dotsWrapper);
        const dots = dotsWrapper.querySelectorAll('.stack-dot');

        // Set initial container height from first item
        function updateHeight() {
            const activeItem = items[current];
            if (activeItem) {
                container.style.height = activeItem.offsetHeight + 'px';
            }
        }

        function applyStack() {
            items.forEach((item, i) => {
                item.classList.remove('stack-active', 'stack-next', 'stack-after', 'stack-hidden', 'stack-exit-left', 'stack-exit-right');

                const offset = ((i - current) + items.length) % items.length;
                if (offset === 0) {
                    item.classList.add('stack-active');
                } else if (offset === 1) {
                    item.classList.add('stack-next');
                } else if (offset === 2) {
                    item.classList.add('stack-after');
                } else {
                    item.classList.add('stack-hidden');
                }
            });
            dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
            updateHeight();
        }

        function goTo(index, direction) {
            if (index === current) return;
            const exitClass = direction === 'right' ? 'stack-exit-right' : 'stack-exit-left';
            const exitingItem = items[current];

            exitingItem.classList.remove('stack-active');
            exitingItem.classList.add(exitClass);

            current = index;

            // Apply stack to non-exiting items immediately
            items.forEach((item, i) => {
                if (item === exitingItem) return;
                item.classList.remove('stack-active', 'stack-next', 'stack-after', 'stack-hidden');
                const offset = ((i - current) + items.length) % items.length;
                if (offset === 0) item.classList.add('stack-active');
                else if (offset === 1) item.classList.add('stack-next');
                else if (offset === 2) item.classList.add('stack-after');
                else item.classList.add('stack-hidden');
            });
            dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
            updateHeight();

            // Clean up exit class after animation
            setTimeout(() => {
                exitingItem.classList.remove(exitClass);
                const offset = ((items.indexOf(exitingItem) - current) + items.length) % items.length;
                if (offset === 1) exitingItem.classList.add('stack-next');
                else if (offset === 2) exitingItem.classList.add('stack-after');
                else exitingItem.classList.add('stack-hidden');
            }, 450);
        }

        function next() { goTo((current + 1) % items.length, 'left'); }
        function prev() { goTo((current - 1 + items.length) % items.length, 'right'); }

        // Touch swipe
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchDeltaX = 0;
            isSwiping = false;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            touchDeltaX = e.touches[0].clientX - touchStartX;
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
            if (!isSwiping && Math.abs(touchDeltaX) > 15 && Math.abs(touchDeltaX) > deltaY) {
                isSwiping = true;
            }
        }, { passive: true });

        container.addEventListener('touchend', () => {
            if (isSwiping && Math.abs(touchDeltaX) > 50) {
                if (touchDeltaX < 0) next();
                else prev();
            }
            isSwiping = false;
        }, { passive: true });

        // Intercept clicks on active card to allow navigation
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                if (!item.classList.contains('stack-active')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });

        applyStack();
    }

    // Fetch and render playlists
    async function fetchPlaylists() {
        const container = document.getElementById('playlists-container');
        if (!container) return;

        try {
            const response = await fetch('https://spotify-show-last-68db402e666c.herokuapp.com/api/playlists');
            if (!response.ok) throw new Error('Failed to fetch playlists');

            const playlists = await response.json();

            container.innerHTML = playlists.map(playlist => `
                <li>
                    <a class="playlist-card" href="${playlist.url}" target="_blank" rel="noopener noreferrer">
                        <div class="vinyl-wrapper">
                            <div class="vinyl-record">
                                <div class="vinyl-rotator">
                                    <div class="vinyl-label" style="background-image: url('${playlist.image}')"></div>
                                </div>
                            </div>
                            <div class="playlist-cover-art">
                                <img src="${playlist.image}" alt="${playlist.name}" loading="lazy" />
                            </div>
                        </div>
                        <div class="playlist-content">
                            <span class="playlist-meta">${playlist.tracks} Tracks</span>
                            <div class="playlist-header">
                                <h3>${playlist.name}</h3>
                            </div>
                            <p class="playlist-description">${playlist.description || 'A curated Spotify playlist.'}</p>
                        </div>
                    </a>
                </li>
            `).join('');

            // Mobile: stacked card carousel with swipe
            if (window.matchMedia('(max-width: 768px)').matches) {
                initPlaylistStack(container);
            } else {
                // Desktop: tap-to-animate-then-navigate on touch devices
                const cards = container.querySelectorAll('.playlist-card');
                cards.forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (!window.matchMedia('(max-width: 768px)').matches) return;
                        e.preventDefault();
                        if (card.classList.contains('is-active')) return;
                        const url = card.href;
                        cards.forEach(c => c.classList.remove('is-active'));
                        card.classList.add('is-active');
                        setTimeout(() => {
                            window.open(url, '_blank');
                            setTimeout(() => card.classList.remove('is-active'), 100);
                        }, 1000);
                    });
                });
            }

            // Trigger scroll animations for new elements
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        } catch (error) {
            console.error('Error loading playlists:', error);
            container.innerHTML = '<p style="color: var(--muted); padding: 20px;">Unable to load playlists at the moment.</p>';
        }
    }

    fetchPlaylists();

});
