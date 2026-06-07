/* =========================================
   JS THEME TOGGLE - Light/Dark Mode Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Select DOM Elements ---
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle');

    // --- 2. Define the Toggle Function ---
    function toggleTheme() {
        // Check if the 'dark' class is currently on the html element
        const isDarkMode = htmlElement.classList.contains('dark');

        if (isDarkMode) {
            // Switch to Light Mode
            htmlElement.classList.remove('dark');
            htmlElement.classList.add('light');
            
            // Save preference to Local Storage
            localStorage.setItem('hrwl-theme', 'light');
            
            // Update body style attribute for color scheme (helps with browser UI like scrollbars)
            document.body.style.colorScheme = 'light';
        } else {
            // Switch to Dark Mode
            htmlElement.classList.remove('light');
            htmlElement.classList.add('dark');
            
            // Save preference to Local Storage
            localStorage.setItem('hrwl-theme', 'dark');
            
            // Update body style attribute for color scheme
            document.body.style.colorScheme = 'dark';
        }
    }

    // --- 3. Attach Event Listeners to Buttons ---
    
    // Desktop Theme Toggle Button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent any default link behavior if it's an <a> tag
            toggleTheme();
        });
    }

    // Mobile Theme Toggle Button
    if (mobileThemeToggleBtn) {
        mobileThemeToggleBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent any default link behavior
            toggleTheme();
        });
    }

    // --- 4. Initial State Setup on Page Load ---
    // This ensures that if the user refreshes the page, the correct theme is applied 
    // immediately without a flash of the wrong theme.
    
    const savedTheme = localStorage.getItem('hrwl-theme');
    
    // If there is a saved theme, apply it. If not, default to light mode.
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
        document.body.style.colorScheme = 'dark';
    } else {
        htmlElement.classList.add('light');
        htmlElement.classList.remove('dark');
        document.body.style.colorScheme = 'light';
    }

});
