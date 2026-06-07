/* =========================================
   JS MOBILE MENU - Hamburger Toggle & Overlay Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Select DOM Elements ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMobileMenuBtn = document.getElementById('close-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('nav a') : [];
    const bodyElement = document.body;


    // --- 2. Define Open Menu Function ---
    function openMobileMenu() {
        if (!mobileMenu) return;

        // Remove the 'hidden' class to make it visible
        mobileMenu.classList.remove('hidden');
        
        // Add 'flex' to ensure the layout displays correctly as a column
        mobileMenu.classList.add('flex');

        // Prevent the background page from scrolling while the menu is open
        bodyElement.style.overflow = 'hidden';
        
        // Optional: Add a class to the body for specific styling when menu is open
        bodyElement.classList.add('menu-open');
    }


    // --- 3. Define Close Menu Function ---
    function closeMobileMenu() {
        if (!mobileMenu) return;

        // Add the 'hidden' class to hide it
        mobileMenu.classList.add('hidden');
        
        // Remove 'flex'
        mobileMenu.classList.remove('flex');

        // Restore background page scrolling
        bodyElement.style.overflow = '';
        
        // Remove the body class
        bodyElement.classList.remove('menu-open');
    }


    // --- 4. Attach Event Listeners ---

    // Open button click (Hamburger icon)
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function(event) {
            event.preventDefault();
            openMobileMenu();
        });
    }

    // Close button click (X icon)
    if (closeMobileMenuBtn) {
        closeMobileMenuBtn.addEventListener('click', function(event) {
            event.preventDefault();
            closeMobileMenu();
        });
    }

    // Close menu when a navigation link is clicked
    // This ensures that when a user selects "Work" or "About", the menu closes 
    // before or as the page navigates, providing a smooth experience.
    mobileMenuLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            // We use a slight timeout to allow the click to register and the 
            // page transition to begin before closing the menu visually.
            setTimeout(function() {
                closeMobileMenu();
            }, 150);
        });
    });

    // Close menu when pressing the Escape key (Accessibility best practice)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && mobileMenu && !mobileMenu.classList.contains('hidden')) {
            closeMobileMenu();
        }
    });

});
