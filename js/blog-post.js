/* ==============================================================================
   WYRM.studios — Blog Post Motion
   Reading progress bar + editorial scroll choreography for blog articles.
   Safe by design: elements are never pre-hidden in CSS. JS only adds a
   "will-reveal" class (slight offset + fade) and removes it when the element
   enters the viewport. No JS → no class → everything simply shows.
   ============================================================================== */
(function () {
    'use strict';

    /* ── Reading progress bar ── */
    var bar = document.createElement('div');
    bar.id = 'wp-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0%;' +
        'background:linear-gradient(90deg,#316CD3,#3E88FF);z-index:80;' +
        'transition:width .08s linear;pointer-events:none;';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }, { passive: true });

    var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Reveal targets: opted-in via [data-wp-reveal] ── */
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-wp-reveal]'));
    if (!els.length || REDUCED) return;

    var pending = els.slice();

    function show(el) {
        el.classList.remove('wp-will-reveal');
        el.classList.add('wp-revealed');
        var i = pending.indexOf(el);
        if (i > -1) pending.splice(i, 1);
    }

    function check() {
        if (!pending.length) return;
        var vh = window.innerHeight;
        for (var i = pending.length - 1; i >= 0; i--) {
            var el = pending[i];
            var r = el.getBoundingClientRect();
            if (r.height === 0 && r.width === 0) continue;
            if (r.top < vh * 0.92 && r.bottom > 0) show(el);
        }
    }

    /* inject the tiny stylesheet once */
    var css = document.createElement('style');
    css.textContent =
        '.wp-will-reveal{opacity:0;transform:translateY(26px);}' +
        '.wp-revealed{opacity:1;transform:none;' +
        'transition:opacity .8s cubic-bezier(0.16,1,0.3,1),transform .8s cubic-bezier(0.16,1,0.3,1);}';
    document.head.appendChild(css);

    /* arm elements with their stagger delay */
    pending.forEach(function (el) {
        var d = parseFloat(el.getAttribute('data-wp-delay') || 0);
        if (d) el.style.transitionDelay = d + 'ms';
        el.classList.add('wp-will-reveal');
    });

    /* failsafe: IO + synchronous scroll check + chained timer */
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
        });
    }, { threshold: 0.05 }) : null;
    if (io) pending.forEach(function (el) { io.observe(el); });

    window.addEventListener('scroll', check, { passive: true });
    (function tick() {
        check();
        if (pending.length) setTimeout(tick, 450);
    })();
    setTimeout(check, 200);
})();
