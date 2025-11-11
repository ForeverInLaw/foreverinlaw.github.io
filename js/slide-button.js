(function() {
    function initSlideButton() {
        // Константы конфигурации
        const DRAG_THRESHOLD = 0.9;
        const ANIMATION_DURATION = 2000;
        const HANDLE_OFFSET = -16; // left offset для handle (-1rem = -16px)
        const TRACK_WIDTH_OFFSET = 10; // дополнительная ширина track
        const DRAG_ANIMATION_DURATION = 0.3;
        const SNAP_ANIMATION_DURATION = 0.25;
        
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        let targetDragX = 0;
        let maxDragDistance = 0;
        
        // Объект для GSAP анимаций (один на весь lifecycle)
        const animState = { x: 0 };
        
        const entryScreen = document.getElementById('entry-screen');
        const container = document.getElementById('slide-container');
        const handle = document.getElementById('slide-handle');
        const track = document.getElementById('slide-track');
        const statusElement = document.getElementById('slide-status');
        
        if (!entryScreen || !container || !handle || !track || !statusElement) {
            console.error('Slide button elements not found');
            return;
        }
        
        if (typeof gsap === 'undefined') {
            console.error('GSAP not loaded');
            return;
        }
    
        // Helper функция для получения позиции курсора
        function getClientX(e) {
            return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        }
        
        function calculateMaxDragDistance() {
            const containerWidth = container.offsetWidth;
            maxDragDistance = containerWidth + HANDLE_OFFSET;
        }
        
        function updatePosition(x) {
            gsap.set(handle, {
                x: x
            });
            gsap.set(track, {
                width: x + TRACK_WIDTH_OFFSET
            });
        }
        
        function animateToPosition(targetX, onComplete) {
            animState.x = currentX;
            gsap.to(animState, {
                x: targetX,
                duration: SNAP_ANIMATION_DURATION,
                ease: "power2.out",
                onUpdate: function() {
                    currentX = animState.x;
                    updatePosition(currentX);
                },
                onComplete: onComplete
            });
        }
        
        function handleDragStart(e) {
            if (container.classList.contains('completed')) return;
            
            isDragging = true;
            
            // Останавливаем все анимации
            gsap.killTweensOf(animState);
            
            startX = getClientX(e) - currentX;
            
            // Отправляем событие о начале драга для кастомного курсора
            document.body.classList.add('slider-dragging');
            
            e.preventDefault();
        }
        
        function handleDragMove(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            targetDragX = Math.max(0, Math.min(getClientX(e) - startX, maxDragDistance));
            
            animState.x = currentX;
            gsap.to(animState, {
                x: targetDragX,
                duration: DRAG_ANIMATION_DURATION,
                ease: "power2.out",
                overwrite: true,
                onUpdate: function() {
                    currentX = animState.x;
                    updatePosition(currentX);
                }
            });
        }
        
        function handleDragEnd() {
            if (!isDragging) return;
            
            isDragging = false;
            
            // Останавливаем все текущие анимации
            gsap.killTweensOf(animState);
            
            // Отправляем событие об окончании драга
            document.body.classList.remove('slider-dragging');
            
            // Используем реальную позицию handle, а не target
            const progress = currentX / maxDragDistance;
            
            if (progress >= DRAG_THRESHOLD) {
                completeSlide();
            } else {
                animateToPosition(0);
            }
        }
        
        function completeSlide() {
            gsap.killTweensOf(animState);
            container.classList.add('completed');
            
            setTimeout(() => {
                entryScreen.classList.add('hidden');
                // Оповещаем что entry screen завершен
                window.dispatchEvent(new Event('entryCompleted'));
                
                // Пересчитываем позиции ScrollTrigger после скрытия entry screen
                if (typeof ScrollTrigger !== 'undefined') {
                    setTimeout(() => {
                        ScrollTrigger.refresh();
                    }, 100);
                }
            }, ANIMATION_DURATION);
        }
        
        handle.addEventListener('mousedown', handleDragStart);
        handle.addEventListener('touchstart', handleDragStart, { passive: false });
        
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchend', handleDragEnd);
        
        window.addEventListener('resize', () => {
            if (!container.classList.contains('completed')) {
                calculateMaxDragDistance();
                updatePosition(0);
            }
        });
    
        calculateMaxDragDistance();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSlideButton);
    } else {
        initSlideButton();
    }
})();
