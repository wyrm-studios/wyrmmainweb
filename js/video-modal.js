/* =========================================
   JS VIDEO MODAL — Cinematic lightbox
   ========================================= */

document.addEventListener('DOMContentLoaded', function () {

    const heroVideoTrigger  = document.getElementById('hero-video-trigger');
    const videoModal        = document.getElementById('video-modal');
    const closeBtn          = document.getElementById('close-video-modal');
    const iframe            = document.getElementById('vimeo-player');
    const VIMEO_SRC         = 'https://player.vimeo.com/video/1190794803?autoplay=1&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479';
    const TRANSITION_MS     = 500; // must match CSS duration

    if (!heroVideoTrigger || !videoModal || !iframe) return;

    // ── Open ──────────────────────────────────────────────────────────
    function openModal() {
        videoModal.removeAttribute('data-closed'); // triggers CSS open state
        document.body.style.overflow = 'hidden';
        // Load video slightly after open animation starts so it's smooth
        setTimeout(function () {
            iframe.src = VIMEO_SRC;
        }, TRANSITION_MS * 0.6);
    }

    // ── Close ─────────────────────────────────────────────────────────
    function closeModal() {
        iframe.src = 'about:blank'; // stop audio immediately
        videoModal.setAttribute('data-closed', ''); // triggers CSS close state
        document.body.style.overflow = '';
    }

    // ── Events ────────────────────────────────────────────────────────
    heroVideoTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
    });

    closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeModal();
    });

    // Click on dim backdrop
    videoModal.addEventListener('click', function (e) {
        if (e.target === videoModal) closeModal();
    });

    // Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !videoModal.hasAttribute('data-closed')) closeModal();
    });
});
