/* =========================================
   JS MAIN - Global Initialization & Event Listeners
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Theme Initialization (Prevent Flash of Unstyled Content) ---
    // We add a 'no-transition' class to the body on load so the theme toggle 
    // doesn't animate when the page first loads. We remove it after a short delay.
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    // Check local storage for saved theme preference
    const savedTheme = localStorage.getItem('hrwl-theme');
    
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
    } else {
        htmlElement.classList.add('light');
        htmlElement.classList.remove('dark');
    }

    // Add no-transition class to prevent animation on load
    bodyElement.classList.add('no-transition');
    
    // Remove the class after 300ms to re-enable transitions
    setTimeout(function() {
        bodyElement.classList.remove('no-transition');
    }, 300);


    // --- 2. Header Scroll Effect ---
    // Adds a subtle shadow or border to the header when the user scrolls down
    const headerElement = document.querySelector('header');
    const scrollThreshold = 50; // Pixels to scroll before effect triggers

    function handleHeaderScroll() {
        if (window.scrollY > scrollThreshold) {
            headerElement.classList.add('scrolled');
            // You can add specific styles for .scrolled in your CSS if needed
            // For now, the backdrop-blur handles most of it, but this class is available
        } else {
            headerElement.classList.remove('scrolled');
        }
    }

    // Listen for scroll events
    window.addEventListener('scroll', handleHeaderScroll);
    // Run once on load to set initial state
    handleHeaderScroll();


    // --- 3. Smooth Scrolling for Anchor Links ---
    // Intercepts clicks on links starting with '#' and scrolls smoothly, 
    // accounting for the fixed header height.
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    const headerHeight = headerElement ? headerElement.offsetHeight : 80; // Fallback height

    anchorLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            const targetId = this.getAttribute('href');
            
            // Ignore if it's just "#" or if the target doesn't exist
            if (targetId === '#' || targetId.length < 2) return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                event.preventDefault();
                
                // Calculate position minus header height
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = targetPosition - headerHeight - 20; // 20px extra padding

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Update URL hash without jumping
                history.pushState(null, null, targetId);
            }
        });
    });


    // --- 4. Scroll Reveal Animations (Intersection Observer) ---
    // Fades in elements with the class 'reveal-on-scroll' as they enter the viewport
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    if (revealElements.length > 0) {
        const revealOptions = {
            threshold: 0.15, // Trigger when 15% of the element is visible
            rootMargin: "0px 0px -50px 0px" // Trigger slightly before it hits the bottom
        };

        const revealOnScroll = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) {
                    return; // Don't do anything if not intersecting
                } else {
                    // Add the visible class to trigger the CSS transition
                    entry.target.classList.add('is-visible');
                    // Stop observing once it's revealed (optional, but good for performance)
                    observer.unobserve(entry.target);
                }
            });
        }, revealOptions);

        revealElements.forEach(function(element) {
            revealOnScroll.observe(element);
        });
    }


    // --- 5. Global Window Resize Handler ---
    // Handles logic that needs to recalculate on window resize
    let resizeTimer;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        
        resizeTimer = setTimeout(function() {
            // Recalculate header height in case it changes
            const newHeaderHeight = headerElement ? headerElement.offsetHeight : 80;
            
            // Close mobile menu if resizing to desktop
            if (window.innerWidth >= 768) {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    document.body.style.overflow = ''; // Restore scrolling
                }
            }
        }, 250); // Debounce the resize event
    });


    // --- 6. Console Welcome Message ---
    // A nice touch for developers inspecting the site
    console.log('%c HRWL® Studio ', 'background: #000; color: #fff; font-size: 20px; padding: 10px; border-radius: 5px;');
    console.log('%c Built with precision. Same same. ', 'color: #888; font-size: 12px;');

});
// Shop Button Toggle Animation
document.addEventListener('DOMContentLoaded', function() {
    const shopButtons = document.querySelectorAll('.shop-button');
    
    shopButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add animation class
            this.classList.add('animating');
            
            // Toggle text after animation starts
            setTimeout(() => {
                const currentText = this.querySelector('.button-text');
                const newText = this.querySelector('.button-text-new');
                
                if (currentText.textContent === 'Shop') {
                    currentText.textContent = 'Soon';
                } else {
                    currentText.textContent = 'Shop';
                }
            }, 150);
            
            // Remove animation class after completion
            setTimeout(() => {
                this.classList.remove('animating');
            }, 600);
        });
    });
});
