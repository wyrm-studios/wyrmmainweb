/* =========================================
   JS PAGE TRANSITIONS - Fade In/Out Navigation Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Select DOM Elements ---
    const bodyElement = document.body;
    const allInternalLinks = document.querySelectorAll('a[href]');

    // --- 2. Initial Page Load Fade-In ---
    // Adds a class to the body immediately to trigger the CSS fade-in animation
    // defined in css/animations.css
    function triggerPageFadeIn() {
        bodyElement.classList.add('animate-fade-in');
        bodyElement.classList.remove('animate-fade-out');
    }

    // Run fade-in on initial load
    triggerPageFadeIn();


    // --- 3. Helper Functions ---

    // Check if a link is an internal page link that should trigger a transition
    function isInternalLink(link) {
        const href = link.getAttribute('href');
        
        // Ignore empty links, anchors, mailto, tel, and external links
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return false;
        }
        
        // Ignore links that open in a new tab
        if (link.getAttribute('target') === '_blank') {
            return false;
        }

        // Check if the link points to an HTML file in the same domain
        const linkUrl = new URL(href, window.location.origin);
        const currentUrl = window.location;

        return linkUrl.origin === currentUrl.origin && 
               linkUrl.pathname.endsWith('.html');
    }


    // --- 4. Attach Event Listeners to Links ---
    
    allInternalLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            
            // Only apply transition logic to valid internal links
            if (isInternalLink(this)) {
                event.preventDefault();
                
                const targetUrl = this.getAttribute('href');

                // Trigger the fade-out animation
                bodyElement.classList.remove('animate-fade-in');
                bodyElement.classList.add('animate-fade-out');

                // Wait for the CSS transition to complete before navigating
                // The duration matches the 0.4s defined in css/animations.css
                setTimeout(function() {
                    window.location.href = targetUrl;
                }, 350); // Slightly less than 400ms to make it feel snappy
            }
        });
    });


    // --- 5. Handle Browser Back/Forward Buttons ---
    // When the user uses the browser's back button, we want to ensure the 
    // fade-in animation triggers correctly on the cached page.
    window.addEventListener('pageshow', function(event) {
        // If the page is loaded from the bfcache (back-forward cache)
        if (event.persisted) {
            triggerPageFadeIn();
        }
    });

});
