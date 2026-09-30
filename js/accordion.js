/* =========================================
   JS ACCORDION - FAQ & About Page Expand/Collapse Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. FAQ Accordion Logic (Home Page) ---
    // One question open at a time. Height is animated by the CSS grid
    // 0fr -> 1fr technique (see components.css), so no JS measuring:
    // it stays smooth at any content length and any font/zoom level.
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function(item, index) {
        const row = item.children.length ? item.children[0] : null;
        const answer = item.querySelector('.faq-content');
        const question = item.querySelector('h3');

        if (!answer) return;

        // Accessible disclosure semantics on the header row
        if (row && row !== answer) {
            row.classList.add('faq-header');
            row.setAttribute('tabindex', '0');
            row.setAttribute('role', 'button');
            row.setAttribute('aria-expanded', 'false');
        }
        if (question && !question.id) question.id = 'faq-question-' + (index + 1);
        if (!answer.id) answer.id = 'faq-answer-' + (index + 1);
        answer.setAttribute('role', 'region');
        if (question) answer.setAttribute('aria-labelledby', question.id);
        if (row) row.setAttribute('aria-controls', answer.id);

        const setExpanded = function(open) {
            item.classList.toggle('active', open);
            const itemRow = item.querySelector('.faq-header');
            if (itemRow) itemRow.setAttribute('aria-expanded', open ? 'true' : 'false');
        };

        const closeItem = function(other) {
            other.classList.remove('active');
            const otherRow = other.querySelector('.faq-header');
            if (otherRow) otherRow.setAttribute('aria-expanded', 'false');
        };

        const toggle = function() {
            const isOpen = item.classList.contains('active');

            // Exclusive: close every other question before opening this one
            faqItems.forEach(function(sibling) {
                if (sibling !== item) closeItem(sibling);
            });

            setExpanded(!isOpen);
        };

        // Whole card clickable, as in the original design
        item.addEventListener('click', toggle);

        // Keyboard support on the header row
        if (row) {
            row.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    toggle();
                }
            });
        }
    });


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
    // Only the About page still uses max-height animation; the FAQ reveal
    // is grid-based and adapts to any size automatically.
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const activeAbout = document.querySelectorAll('.accordion-item.active .accordion-content');
            activeAbout.forEach(function(content) {
                content.style.maxHeight = content.scrollHeight + "px";
            });
        }, 250);
    });

});
