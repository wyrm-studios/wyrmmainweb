/* ==============================================================================
   WYRM.studios — Main Application Logic
   Global initialization, scroll effects, reveal animations, and shop interactions.
   ============================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // --- 1. Header Scroll Effect ---
    const headerElement = document.querySelector('header');
    const scrollThreshold = 50;

    function handleHeaderScroll() {
        if (!headerElement) return;
        if (window.scrollY > scrollThreshold) {
            headerElement.classList.add('scrolled');
        } else {
            headerElement.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();


    // --- 2. Scroll Reveal Animations (Intersection Observer) ---
    const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-from-left, .reveal-from-right, .reveal-scale');
    
    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(function(el) {
            revealObserver.observe(el);
        });
    } else {
        // Fallback for older browsers
        revealElements.forEach(function(el) {
            el.classList.add('is-visible');
        });
    }


    // --- 3. Centralized Shop Button Interactions ---
    function initShopButton(buttonElement, textSelector) {
        if (!buttonElement) return;
        const textElement = buttonElement.querySelector(textSelector) || buttonElement;
        let isAnimating = false;

        buttonElement.addEventListener('click', function(e) {
            e.preventDefault();
            if (isAnimating) return;
            isAnimating = true;

            // Fade out current text
            textElement.style.transition = 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
            textElement.style.opacity = '0';
            textElement.style.transform = 'translateY(-8px)';

            setTimeout(function() {
                textElement.textContent = 'Soon';
                textElement.style.opacity = '1';
                textElement.style.transform = 'translateY(0)';

                setTimeout(function() {
                    textElement.style.opacity = '0';
                    textElement.style.transform = 'translateY(8px)';

                    setTimeout(function() {
                        textElement.textContent = 'Shop';
                        textElement.style.opacity = '1';
                        textElement.style.transform = 'translateY(0)';
                        isAnimating = false;
                    }, 250);
                }, 2600);
            }, 250);
        });
    }

    // Initialize desktop and mobile shop triggers
    initShopButton(document.getElementById('shop-button'), '.shop-text');
    initShopButton(document.getElementById('mobile-shop-button'), '.mobile-shop-text');
    document.querySelectorAll('.shop-button').forEach(function(btn) {
        initShopButton(btn, '.button-text');
    });


    // --- 4. Global Window Resize Handler ---
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth >= 768) {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenu.classList.remove('flex');
                    document.body.style.overflow = '';
                }
            }
        }, 200);
    });


    // --- 5. Studio Console Identity ---
    console.log(
        '%c WYRM.studios %c Creative Studio // Identity • Motion • Digital ',
        'background: #111; color: #3E88FF; font-weight: 700; font-size: 13px; padding: 6px 10px; border-radius: 4px;',
        'background: #222; color: #eee; font-size: 12px; padding: 6px 10px; border-radius: 4px;'
    );
});
