/* =========================================
   JS PAGE TRANSITIONS - Premium Navigation Logic
   =========================================
   
   This script creates cinematic, smooth page transitions that feel
   expensive and deliberate. It manages:
   - Fade in/out on navigation
   - Loading states during transitions
   - Scroll position reset
   - Browser history handling
   - Edge case prevention
   
   Dependencies: css/animations.css for animation classes and timing
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    console.log('🎬 Page Transitions: Initialized');

    // --- 1. Configuration & State ---
    
    const CONFIG = {
        // Transition timing (matches CSS animations.css)
        FADE_OUT_DURATION: 600,      // ms - How long fade-out takes
        FADE_IN_DURATION: 800,       // ms - How long fade-in takes
        NAVIGATION_DELAY: 650,       // ms - Wait before actual navigation
        
        // Scroll behavior
        SCROLL_TO_TOP: true,         // Reset scroll on new page
        SCROLL_BEHAVIOR: 'smooth',   // 'smooth' or 'instant'
        
        // Loading state
        SHOW_LOADING_INDICATOR: true,
        LOADING_INDICATOR_DELAY: 300 // ms before showing loader
    };

    // State management to prevent race conditions
    const state = {
        isTransitioning: false,
        currentPage: window.location.pathname,
        loadingTimeout: null
    };


    // --- 2. DOM Elements ---
    
    const bodyElement = document.body;
    const allLinks = document.querySelectorAll('a[href]');
    
    // Create loading indicator element
    let loadingIndicator = null;
    if (CONFIG.SHOW_LOADING_INDICATOR) {
        loadingIndicator = createLoadingIndicator();
    }


    // --- 3. Loading Indicator ---
    
    /**
     * Creates a minimal, premium loading indicator
     * that appears during page transitions
     */
    function createLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'page-transition-loader';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        `;
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        indicator.appendChild(spinner);
        
        document.body.appendChild(indicator);
        return indicator;
    }

    /**
     * Shows the loading indicator with a delay
     * to avoid flashing on fast connections
     */
    function showLoadingIndicator() {
        if (!loadingIndicator) return;
        
        state.loadingTimeout = setTimeout(() => {
            loadingIndicator.style.opacity = '1';
        }, CONFIG.LOADING_INDICATOR_DELAY);
    }

    /**
     * Hides the loading indicator
     */
    function hideLoadingIndicator() {
        if (!loadingIndicator) return;
        
        clearTimeout(state.loadingTimeout);
        loadingIndicator.style.opacity = '0';
    }


    // --- 4. Page Load Fade-In ---
    
    /**
     * Triggers the fade-in animation on page load
     * Uses the animate-fade-in class from animations.css
     */
    function triggerPageFadeIn() {
        console.log('✨ Page Transitions: Fade in triggered');
        
        // Remove fade-out class if present
        bodyElement.classList.remove('animate-fade-out');
        
        // Add fade-in class
        bodyElement.classList.add('animate-fade-in');
        
        // Scroll to top if configured
        if (CONFIG.SCROLL_TO_TOP && window.scrollY > 0) {
            window.scrollTo({
                top: 0,
                behavior: CONFIG.SCROLL_BEHAVIOR
            });
        }
        
        // Reset transition state
        state.isTransitioning = false;
    }

    // Run fade-in on initial load
    triggerPageFadeIn();


    // --- 5. Link Validation ---
    
    /**
     * Determines if a link should trigger a page transition
     * Filters out anchors, external links, downloads, etc.
     */
    function shouldTransitionLink(link) {
        const href = link.getAttribute('href');
        
        // Ignore empty or invalid links
        if (!href || href === '') return false;
        
        // Ignore anchor links (same page navigation)
        if (href.startsWith('#')) return false;
        
        // Ignore special protocols
        if (href.startsWith('mailto:') || 
            href.startsWith('tel:') || 
            href.startsWith('javascript:')) {
            return false;
        }
        
        // Ignore links that open in new tab
        if (link.getAttribute('target') === '_blank') return false;
        
        // Ignore download links
        if (link.hasAttribute('download')) return false;
        
        // Ignore links with data-no-transition attribute
        if (link.hasAttribute('data-no-transition')) return false;
        
        // Parse the URL to check if it's internal
        try {
            const linkUrl = new URL(href, window.location.origin);
            const currentUrl = window.location;
            
            // Only transition for same-origin HTML pages
            if (linkUrl.origin !== currentUrl.origin) return false;
            
            // Check if it's an HTML file (or no extension = index)
            const pathname = linkUrl.pathname;
            return pathname.endsWith('.html') || 
                   pathname.endsWith('/') || 
                   !pathname.includes('.');
        } catch (error) {
            console.warn('Page Transitions: Invalid URL', href);
            return false;
        }
    }


    // --- 6. Navigation Handler ---
    
    /**
     * Handles the actual navigation after fade-out completes
     */
    function navigateToUrl(url) {
        console.log('🚀 Page Transitions: Navigating to', url);
        
        // Update current page state
        state.currentPage = url;
        
        // Perform the navigation
        window.location.href = url;
    }

    /**
     * Initiates the page transition sequence
     */
    function initiatePageTransition(targetUrl) {
        // Prevent multiple transitions
        if (state.isTransitioning) {
            console.log('⚠️ Page Transitions: Already transitioning');
            return;
        }
        
        state.isTransitioning = true;
        
        // Show loading indicator
        showLoadingIndicator();
        
        // Trigger fade-out animation
        bodyElement.classList.remove('animate-fade-in');
        bodyElement.classList.add('animate-fade-out');
        
        console.log('🌑 Page Transitions: Fade out started');
        
        // Wait for fade-out to complete, then navigate
        setTimeout(() => {
            hideLoadingIndicator();
            navigateToUrl(targetUrl);
        }, CONFIG.NAVIGATION_DELAY);
    }


    // --- 7. Event Listeners ---
    
    /**
     * Attach click handlers to all links
     */
    allLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            
            // Check if this link should trigger a transition
            if (shouldTransitionLink(this)) {
                event.preventDefault();
                
                const targetUrl = this.getAttribute('href');
                
                console.log('🔗 Page Transitions: Link clicked', targetUrl);
                
                // Add visual feedback to the clicked link
                this.style.opacity = '0.7';
                
                // Initiate the transition
                initiatePageTransition(targetUrl);
            }
        });
    });


    // --- 8. Browser History Handling ---
    
    /**
     * Handle browser back/forward buttons
     * Ensures fade-in triggers correctly on cached pages
     */
    window.addEventListener('pageshow', function(event) {
        console.log('📖 Page Transitions: Page shown', event.persisted ? '(from cache)' : '(fresh)');
        
        // If loaded from bfcache (back-forward cache)
        if (event.persisted) {
            // Reset opacity and trigger fade-in
            bodyElement.style.opacity = '1';
            triggerPageFadeIn();
        }
    });

    /**
     * Handle page hide (when navigating away)
     * Clean up any pending timeouts
     */
    window.addEventListener('pagehide', function() {
        console.log('👋 Page Transitions: Page hiding');
        hideLoadingIndicator();
        clearTimeout(state.loadingTimeout);
    });


    // --- 9. Error Handling ---
    
    /**
     * Global error handler to prevent stuck transitions
     */
    window.addEventListener('error', function(event) {
        console.error('❌ Page Transitions: Error occurred', event.error);
        
        // Reset state if something goes wrong
        state.isTransitioning = false;
        hideLoadingIndicator();
        bodyElement.classList.remove('animate-fade-out');
        bodyElement.classList.add('animate-fade-in');
    });


    // --- 10. Performance Optimization ---
    
    /**
     * Preload next page on hover (optional, for faster perceived navigation)
     * Only enable if you want to prefetch pages
     */
    if (false) { // Set to true to enable prefetching
        allLinks.forEach(function(link) {
            if (shouldTransitionLink(link)) {
                link.addEventListener('mouseenter', function() {
                    const href = this.getAttribute('href');
                    const preloadLink = document.createElement('link');
                    preloadLink.rel = 'prefetch';
                    preloadLink.href = href;
                    document.head.appendChild(preloadLink);
                });
            }
        });
    }


    console.log('✅ Page Transitions: Ready');
});
