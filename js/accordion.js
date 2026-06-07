/* =========================================
   JS ACCORDION - FAQ & About Page Expand/Collapse Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. FAQ Accordion Logic (Home Page) ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function(item) {
        const header = item; // The whole card is clickable in the design
        const content = item.querySelector('.faq-content');
        const icon = item.querySelector('.faq-icon');

        header.addEventListener('click', function() {
            const isActive = item.classList.contains('active');

            // Close all other FAQ items in the same grid/container
            const parentContainer = item.parentElement;
            const siblingItems = parentContainer.querySelectorAll('.faq-item');
            
            siblingItems.forEach(function(sibling) {
                if (sibling !== item) {
                    closeFaqItem(sibling);
                }
            });

            // Toggle the current item
            if (isActive) {
                closeFaqItem(item);
            } else {
                openFaqItem(item);
            }
        });
    });

    function openFaqItem(item) {
        item.classList.add('active');
        const content = item.querySelector('.faq-content');
        const icon = item.querySelector('.faq-icon');
        
        // Set max-height for smooth CSS transition
        content.style.maxHeight = content.scrollHeight + "px";
        
        // Change icon from + to -
        if (icon) {
            icon.textContent = '−'; // Using minus sign
        }
    }

    function closeFaqItem(item) {
        item.classList.remove('active');
        const content = item.querySelector('.faq-content');
        const icon = item.querySelector('.faq-icon');
        
        // Reset max-height to 0
        content.style.maxHeight = "0px";
        
        // Change icon back to +
        if (icon) {
            icon.textContent = '+';
        }
    }


    // --- 2. About Page Accordion Logic ---
    const aboutAccordionItems = document.querySelectorAll('.accordion-item');

    aboutAccordionItems.forEach(function(item) {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');

        if (header) {
            header.addEventListener('click', function() {
                const isActive = item.classList.contains('active');

                // Close all other accordion items on the About page
                const parentContainer = item.parentElement;
                const siblingItems = parentContainer.querySelectorAll('.accordion-item');
                
                siblingItems.forEach(function(sibling) {
                    if (sibling !== item) {
                        closeAboutAccordion(sibling);
                    }
                });

                // Toggle the current item
                if (isActive) {
                    closeAboutAccordion(item);
                } else {
                    openAboutAccordion(item);
                }
            });
        }
    });

    function openAboutAccordion(item) {
        item.classList.add('active');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');
        
        // Set max-height for smooth CSS transition
        content.style.maxHeight = content.scrollHeight + "px";
        
        // Rotate icon (handled by CSS transform, but we can add class if needed)
        if (icon) {
            icon.style.transform = 'rotate(180deg)';
        }
    }

    function closeAboutAccordion(item) {
        item.classList.remove('active');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');
        
        // Reset max-height to 0
        content.style.maxHeight = "0px";
        
        // Reset icon rotation
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
    }

    // --- 3. Handle Window Resize for Accordions ---
    // If the user resizes the window while an accordion is open, 
    // we need to recalculate the max-height so it doesn't get cut off.
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const activeFaqs = document.querySelectorAll('.faq-item.active .faq-content');
            activeFaqs.forEach(function(content) {
                content.style.maxHeight = content.scrollHeight + "px";
            });

            const activeAbout = document.querySelectorAll('.accordion-item.active .accordion-content');
            activeAbout.forEach(function(content) {
                content.style.maxHeight = content.scrollHeight + "px";
            });
        }, 250);
    });

});
