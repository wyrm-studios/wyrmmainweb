/* =========================================
   JS VIDEO MODAL - Hero Video Lightbox Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Select DOM Elements ---
    const heroVideoTrigger = document.getElementById('hero-video-trigger');
    const videoModal = document.getElementById('video-modal');
    const closeVideoModalBtn = document.getElementById('close-video-modal');
    const vimeoPlayerIframe = document.getElementById('vimeo-player');
    const bodyElement = document.body;

    // Store the base Vimeo URL to reset the iframe when closed
    // This ensures the video stops playing and audio cuts off when the modal is closed
    const baseVimeoUrl = "https://player.vimeo.com/video/1190794803?autoplay=1&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479";
    const emptyUrl = "about:blank";


    // --- 2. Define Open Modal Function ---
    function openVideoModal() {
        if (!videoModal || !vimeoPlayerIframe) return;

        // Remove 'hidden' and add 'flex' to make the modal visible and center its content
        videoModal.classList.remove('hidden');
        videoModal.classList.add('flex');

        // Prevent background scrolling while modal is open
        bodyElement.style.overflow = 'hidden';

        // Set the iframe source to the Vimeo URL with autoplay enabled
        // We use a slight timeout to allow the modal transition to start before loading the heavy iframe
        setTimeout(function() {
            vimeoPlayerIframe.src = baseVimeoUrl;
        }, 100);
    }


    // --- 3. Define Close Modal Function ---
    function closeVideoModal() {
        if (!videoModal || !vimeoPlayerIframe) return;

        // Add 'hidden' and remove 'flex' to hide the modal
        videoModal.classList.add('hidden');
        videoModal.classList.remove('flex');

        // Restore background scrolling
        bodyElement.style.overflow = '';

        // Clear the iframe source to immediately stop the video and audio
        vimeoPlayerIframe.src = emptyUrl;
    }


    // --- 4. Attach Event Listeners ---

    // Open modal when clicking the hero video trigger (the play button area)
    if (heroVideoTrigger) {
        heroVideoTrigger.addEventListener('click', function(event) {
            event.preventDefault();
            openVideoModal();
        });
    }

    // Close modal when clicking the close button (X icon)
    if (closeVideoModalBtn) {
        closeVideoModalBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation(); // Prevent the click from bubbling to the modal background
            closeVideoModal();
        });
    }

    // Close modal when clicking outside the video player (on the dark background overlay)
    if (videoModal) {
        videoModal.addEventListener('click', function(event) {
            // Check if the click target is the modal container itself, not the video inside it
            if (event.target === videoModal) {
                closeVideoModal();
            }
        });
    }

    // Close modal when pressing the Escape key (Accessibility best practice)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && videoModal && !videoModal.classList.contains('hidden')) {
            closeVideoModal();
        }
    });

});
