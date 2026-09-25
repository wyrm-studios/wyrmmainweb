/* ==============================================================================
   WYRM.studios — cursor aura + trailing dot
   A soft pollen glow follows the pointer with easing; a tiny dot rides it.
   Fine pointers only, skipped entirely for reduced-motion. Zero dependencies.
   ============================================================================== */
(function () {
    'use strict';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var aura = document.createElement('div');
    aura.className = 'wyrm-cursor-aura';
    var dot = document.createElement('div');
    dot.className = 'wyrm-cursor-dot';
    document.addEventListener('DOMContentLoaded', append) || append();
    function append() { document.body.appendChild(aura); document.body.appendChild(dot); }

    var x = -100, y = -100;      /* real pointer */
    var ax = -100, ay = -100;    /* eased aura */
    var dx = -100, dy = -100;    /* eased dot (tighter) */
    var raf = null;

    document.addEventListener('mousemove', function (e) {
        x = e.clientX; y = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
        aura.style.opacity = '0';
        dot.style.opacity = '0';
    });

    document.addEventListener('mouseenter', function () {
        aura.style.opacity = '1';
        dot.style.opacity = '1';
    });

    function tick() {
        ax += (x - ax) * 0.10;
        ay += (y - ay) * 0.10;
        dx += (x - dx) * 0.32;
        dy += (y - dy) * 0.32;

        aura.style.transform = 'translate(' + (ax - 110) + 'px,' + (ay - 110) + 'px)';
        dot.style.transform = 'translate(' + (dx - 3.5) + 'px,' + (dy - 3.5) + 'px)';

        /* keep the loop alive only while the pointer is near the last frame */
        if (Math.abs(x - ax) > 0.2 || Math.abs(y - ay) > 0.2) {
            raf = requestAnimationFrame(tick);
        } else {
            raf = null;
        }
    }
})();
