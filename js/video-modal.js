/* =========================================
   JS VIDEO MODAL - Hero Video Lightbox Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    console.log('Video modal script loaded');

    // --- 1. Select DOM Elements ---
    const heroVideoTrigger = document.getElementById('hero-video-trigger');
    const videoModal = document.getElementById('video-modal');
    const closeVideoModalBtn = document.getElementById('close-video-modal');
    const vimeoPlayerIframe = document.getElementById('vimeo-player');
    const bodyElement = document.body;

    // Check if elements exist
    if (!heroVideoTrigger) {
        console.error('Hero video trigger not found!');
    }
    if (!videoModal) {
        console.error('Video modal not found!');
    }
    if (!vimeoPlayerIframe) {
        console.error('Vimeo player iframe not found!');
    }

    // Store the base Vimeo URL to reset the iframe when closed
    // This ensures the video stops playing and audio cuts off when the modal is closed
    const baseVimeoUrl = "https://player.vimeo.com/video/1190794803?autoplay=1&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479";
    const emptyUrl = "about:blank";


    // --- 2. Define Open Modal Function ---
    function openVideoModal() {
        console.log('Opening video modal...');
        
        if (!videoModal || !vimeoPlayerIframe) {
            console.error('Cannot open modal - elements not found');
            return;
        }

        // Remove 'hidden' and add 'flex' to make the modal visible and center its content
        videoModal.classList.remove('hidden');
        videoModal.classList.add('flex');

        // Force reflow to ensure transition works
        void videoModal.offsetWidth;

        // Add opacity class for smooth transition
        setTimeout(function() {
            videoModal.style.opacity = '1';
        }, 10);

        // Prevent background scrolling while modal is open
        bodyElement.style.overflow = 'hidden';

        // Set the iframe source to the Vimeo URL with autoplay enabled
        console.log('Loading Vimeo video...');
        setTimeout(function() {
            vimeoPlayerIframe.src = baseVimeoUrl;
            console.log('Vimeo video loaded');
        }, 300);
    }


    // --- 3. Define Close Modal Function ---
    function closeVideoModal() {
        console.log('Closing video modal...');
        
        if (!videoModal || !vimeoPlayerIframe) {
            console.error('Cannot close modal - elements not found');
            return;
        }

        // Remove opacity for smooth transition
        videoModal.style.opacity = '0';

        // Add 'hidden' and remove 'flex' to hide the modal after transition
        setTimeout(function() {
            videoModal.classList.add('hidden');
            videoModal.classList.remove('flex');
            console.log('Modal hidden');
        }, 300);

        // Restore background scrolling
        bodyElement.style.overflow = '';

        // Clear the iframe source to immediately stop the video and audio
        vimeoPlayerIframe.src = emptyUrl;
        console.log('Video stopped');
    }


    // --- 4. Attach Event Listeners ---

    // Open modal when clicking the hero video trigger (the play button area)
    if (heroVideoTrigger) {
        heroVideoTrigger.addEventListener('click', function(event) {
            console.log('Video trigger clicked!');
            event.preventDefault();
            event.stopPropagation();
            openVideoModal();
        });

        // Also add cursor pointer to indicate it's clickable
        heroVideoTrigger.style.cursor = 'pointer';
    }

    // Close modal when clicking the close button (X icon)
    if (closeVideoModalBtn) {
        closeVideoModalBtn.addEventListener('click', function(event) {
            console.log('Close button clicked');
            event.preventDefault();
            event.stopPropagation();
            closeVideoModal();
        });
    }

    // Close modal when clicking outside the video player (on the dark background overlay)
    if (videoModal) {
        videoModal.addEventListener('click', function(event) {
            // Check if the click target is the modal container itself, not the video inside it
            if (event.target === videoModal) {
                console.log('Modal background clicked');
                closeVideoModal();
            }
        });
    }

    // Close modal when pressing the Escape key (Accessibility best practice)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && videoModal && !videoModal.classList.contains('hidden')) {
            console.log('Escape key pressed');
            closeVideoModal();
        }
    });

    console.log('All event listeners attached');
});
