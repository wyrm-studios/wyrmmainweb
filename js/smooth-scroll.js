/* =========================================
   JS SMOOTH SCROLL - Anchor Links & Section Navigation
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Select DOM Elements ---
    const headerElement = document.querySelector('header');
    const allInternalLinks = document.querySelectorAll('a[href^="#"]');
    const scrollToTopBtn = document.querySelector('.scroll-to-top'); // If you add a back-to-top button later

    // --- 2. Helper Functions ---

    // Calculate the exact height of the fixed header plus a little extra breathing room
    function getHeaderOffset() {
        if (headerElement) {
            return headerElement.offsetHeight + 20; // 20px extra padding
        }
        return 80; // Fallback default height
    }

    // The core smooth scroll function
    function smoothScrollToTarget(targetId) {
        // Ignore empty hashes
        if (targetId === '#' || targetId.length < 2) {
            return;
        }

        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            // Calculate the target's position relative to the top of the document
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = targetPosition - getHeaderOffset();

            // Perform the smooth scroll
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Update the URL hash without causing the page to jump
            if (history.pushState) {
                history.pushState(null, null, targetId);
            } else {
                window.location.hash = targetId;
            }
        }
    }

    // --- 3. Attach Event Listeners ---

    // Handle clicks on all internal anchor links
    allInternalLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            // Get the href attribute
            const targetId = this.getAttribute('href');

            // Only prevent default and smooth scroll if it's an internal anchor link
            if (targetId && targetId.startsWith('#')) {
                event.preventDefault();
                smoothScrollToTarget(targetId);
            }
        });
    });

    // Handle "Scroll to Top" button if it exists
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function(event) {
            event.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- 4. Handle Initial Page Load with Hash ---
    // If the user loads a page with a hash in the URL (e.g., about.html#who-i-am), 
    // scroll them to that section smoothly after the page loads.
    if (window.location.hash) {
        // Wait a brief moment for the page layout to fully render before scrolling
        setTimeout(function() {
            smoothScrollToTarget(window.location.hash);
        }, 300);
    }

});
