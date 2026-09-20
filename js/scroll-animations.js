/* ==============================================================================
   WYRM.studios — Premium Scroll Animation Engine
   16 animation types, zero dependencies, respects prefers-reduced-motion.
   ============================================================================== */
(function () {
    'use strict';

    /* runtime version marker: lets any page probe prove which build is live */
    window.__WYRM_ENGINE = 'v3-failsafe';

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Utility: observe once, unobserve after fire.
    // Failsafe: some embedded browsers never dispatch IntersectionObserver
    // callbacks, which would leave pre-hidden elements invisible forever.
    // A scroll/interval rect-check mirrors IO semantics and fires the same
    // callback — whichever path runs first wins; the other is a no-op.
    var pendingReveals = [];

    function fireReveal(entry) {
        if (entry.fired) return;
        entry.fired = true;
        var i = pendingReveals.indexOf(entry);
        if (i > -1) pendingReveals.splice(i, 1);
        entry.fn(entry.el);
    }

    var fallbackRuns = 0;

    function fallbackCheck() {
        fallbackRuns++;
        try {
        if (!pendingReveals.length) return;
        var vh = window.innerHeight;
        for (var i = pendingReveals.length - 1; i >= 0; i--) {
            var p = pendingReveals[i];
            var r = p.el.getBoundingClientRect();
            if (r.height === 0 && r.width === 0) continue; /* collapsed (e.g. closed accordion) */
            var visible = (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.max(r.height, 1);
            if (visible >= p.threshold * 0.9) fireReveal(p);
        }
        if (!pendingReveals.length && fallbackTimer) {
            clearInterval(fallbackTimer);
            fallbackTimer = null;
        }
        } catch (e) {
            if (window.console) console.error('wyrm-fallback error:', e);
        }
    }

    /* observability: pages/tests can verify the fail-safe is alive */
    window.__WYRM_STATE = function () {
        return { engine: window.__WYRM_ENGINE, pending: pendingReveals.length, fallbackRuns: fallbackRuns, ioSupported: typeof IntersectionObserver };
    };

    var fallbackTimer = null;
    window.addEventListener('scroll', function () {
        /* synchronous on purpose: rAF is suspended in occluded/embedded
           views, and this rect-check is cheap (only pending elements) */
        fallbackCheck();
    }, { passive: true });

    function ensureFallbackTimer() {
        if (fallbackTimer) return;
        /* setTimeout chain rather than setInterval: background-tab throttling
           still lets chained timeouts run at ~1s, intervals can starve */
        var tick = function () {
            fallbackCheck();
            if (pendingReveals.length) fallbackTimer = setTimeout(tick, 500);
            else fallbackTimer = null;
        };
        fallbackTimer = setTimeout(tick, 500);
        setTimeout(fallbackCheck, 350); /* catch elements already in view at load */
    }

    function once(el, threshold, rootMargin, fn) {
        if (REDUCED) { fn(el); return; }
        var entry = { el: el, fn: fn, threshold: threshold, fired: false };
        pendingReveals.push(entry);
        ensureFallbackTimer();
        var ob = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { fireReveal(entry); ob.unobserve(el); }
            });
        }, { threshold: threshold, rootMargin: rootMargin });
        ob.observe(el);
    }

    // Easing
    function outExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SCROLL PROGRESS BAR (top edge, fills as page scrolls)
    // ─────────────────────────────────────────────────────────────────────────
    function initScrollProgress() {
        if (REDUCED) return;
        var bar = document.createElement('div');
        bar.id = 'wyrm-scroll-progress';
        bar.setAttribute('aria-hidden', 'true');
        bar.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'height:2px', 'width:0%',
            'background:linear-gradient(90deg,hsl(var(--foreground)/0.5),hsl(var(--foreground)))',
            'z-index:9999', 'pointer-events:none',
            'transition:width 0.1s linear'
        ].join(';');
        document.body.appendChild(bar);
        var ticking = false;
        function update() {
            var s = window.scrollY;
            var h = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.width = (h > 0 ? (s / h) * 100 : 0).toFixed(2) + '%';
            ticking = false;
        }
        window.addEventListener('scroll', function() {
            if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. FADE-IN FAMILY  [data-scroll="fade-up|fade-down|fade-left|fade-right|fade"]
    // ─────────────────────────────────────────────────────────────────────────
    function initFadeAnimations() {
        var map = {
            'fade-up':    [0, 56],
            'fade-down':  [0, -56],
            'fade-left':  [56, 0],
            'fade-right': [-56, 0],
            'fade':       [0, 0]
        };
        document.querySelectorAll('[data-scroll]').forEach(function(el) {
            var type = el.getAttribute('data-scroll');
            if (!map[type]) return;
            var tx = map[type][0], ty = map[type][1];
            var delay    = parseFloat(el.getAttribute('data-scroll-delay')    || 0);
            var duration = parseFloat(el.getAttribute('data-scroll-duration') || 920);
            if (!REDUCED) {
                el.style.opacity    = '0';
                el.style.transform  = 'translate(' + tx + 'px,' + ty + 'px)';
                el.style.willChange = 'opacity,transform';
                el.style.transition =
                    'opacity ' + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + delay + 'ms,' +
                    'transform ' + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + delay + 'ms';
            }
            once(el, 0.1, '0px 0px -50px 0px', function() {
                el.style.opacity   = '1';
                el.style.transform = 'translate(0,0)';
                setTimeout(function() {
                    el.style.willChange = 'auto';
                    el.style.transition = '';
                }, delay + duration + 150);
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. STAGGERED CHILDREN  [data-scroll-stagger] on parent
    // ─────────────────────────────────────────────────────────────────────────
    function initStagger() {
        document.querySelectorAll('[data-scroll-stagger]').forEach(function(parent) {
            var dir      = parent.getAttribute('data-scroll-stagger') || 'up';
            var base     = parseFloat(parent.getAttribute('data-scroll-stagger-base') || 90);
            var duration = parseFloat(parent.getAttribute('data-scroll-stagger-dur')  || 860);
            var sel      = parent.getAttribute('data-scroll-stagger-sel') || ':scope > *';
            // A bad selector here must never break the whole init chain — fall back to direct children.
            var children;
            try {
                children = Array.from(parent.querySelectorAll(sel));
            } catch (err) {
                children = Array.from(parent.children);
            }
            var offsets  = { up:[0,44], down:[0,-44], left:[44,0], right:[-44,0] };
            var off = offsets[dir] || offsets.up;
            if (!REDUCED) {
                children.forEach(function(c) {
                    c.style.opacity    = '0';
                    c.style.transform  = 'translate(' + off[0] + 'px,' + off[1] + 'px)';
                    c.style.willChange = 'opacity,transform';
                });
            }
            once(parent, 0.07, '0px 0px -30px 0px', function() {
                children.forEach(function(c, i) {
                    var d = i * base;
                    c.style.transition =
                        'opacity ' + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + d + 'ms,' +
                        'transform ' + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + d + 'ms';
                    c.style.opacity   = '1';
                    c.style.transform = 'translate(0,0)';
                    setTimeout(function() {
                        c.style.willChange = 'auto';
                        c.style.transition = '';
                    }, d + duration + 150);
                });
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CLIP REVEAL  [data-scroll-clip="clip-left|clip-right|clip-up|clip-down"]
    // ─────────────────────────────────────────────────────────────────────────
    function initClipReveal() {
        var clips = {
            'clip-left':  ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
            'clip-right': ['inset(0 0 0 100%)',  'inset(0 0 0 0%)'],
            'clip-up':    ['inset(100% 0 0 0)',  'inset(0% 0 0 0)'],
            'clip-down':  ['inset(0 0 100% 0)',  'inset(0 0 0% 0)']
        };
        document.querySelectorAll('[data-scroll-clip]').forEach(function(el) {
            var type = el.getAttribute('data-scroll-clip');
            if (!clips[type]) return;
            var from = clips[type][0], to = clips[type][1];
            var delay    = parseFloat(el.getAttribute('data-scroll-delay')    || 0);
            var duration = parseFloat(el.getAttribute('data-scroll-duration') || 1050);
            if (!REDUCED) {
                el.style.clipPath   = from;
                el.style.willChange = 'clip-path';
                el.style.transition = 'clip-path ' + duration + 'ms cubic-bezier(0.76,0,0.24,1) ' + delay + 'ms';
            }
            once(el, 0.05, '0px 0px -30px 0px', function() {
                el.style.clipPath = to;
                setTimeout(function() {
                    el.style.willChange = 'auto';
                    el.style.transition = '';
                    el.style.clipPath   = '';
                }, delay + duration + 200);
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. SCALE REVEAL  [data-scroll-scale]
    // ─────────────────────────────────────────────────────────────────────────
    function initScaleReveal() {
        document.querySelectorAll('[data-scroll-scale]').forEach(function(el) {
            var from     = parseFloat(el.getAttribute('data-scroll-scale-from') || 0.86);
            var delay    = parseFloat(el.getAttribute('data-scroll-delay')      || 0);
            var duration = parseFloat(el.getAttribute('data-scroll-duration')   || 950);
            if (!REDUCED) {
                el.style.opacity    = '0';
                el.style.transform  = 'scale(' + from + ')';
                el.style.willChange = 'opacity,transform';
                el.style.transition =
                    'opacity ' + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + delay + 'ms,' +
                    'transform ' + duration + 'ms cubic-bezier(0.34,1.4,0.64,1) '  + delay + 'ms';
            }
            once(el, 0.10, '0px 0px -40px 0px', function() {
                el.style.opacity   = '1';
                el.style.transform = 'scale(1)';
                setTimeout(function() {
                    el.style.willChange = 'auto';
                    el.style.transition = '';
                }, delay + duration + 150);
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. WORD-BY-WORD REVEAL  [data-scroll-words]
    // ─────────────────────────────────────────────────────────────────────────
    function initWordReveal() {
        document.querySelectorAll('[data-scroll-words]').forEach(function(el) {
            if (REDUCED) return;
            var base      = parseFloat(el.getAttribute('data-scroll-words-base') || 50);
            var duration  = parseFloat(el.getAttribute('data-scroll-duration')   || 780);
            var initDelay = parseFloat(el.getAttribute('data-scroll-delay')      || 0);
            var words = el.textContent.trim().split(/\s+/);
            el.innerHTML = words.map(function(w, i) {
                var d = initDelay + i * base;
                return '<span style="display:inline-block;overflow:hidden;vertical-align:bottom;line-height:1.25em">' +
                       '<span style="display:inline-block;opacity:0;transform:translateY(105%);' +
                       'transition:opacity ' + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + d + 'ms,' +
                       'transform ' + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + d + 'ms">' +
                       w + '</span></span>&nbsp;';
            }).join('');
            once(el, 0.05, '0px 0px -20px 0px', function() {
                el.querySelectorAll('span > span').forEach(function(s) {
                    s.style.opacity   = '1';
                    s.style.transform = 'translateY(0)';
                });
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. PARALLAX  [data-scroll-parallax] — springy depth
    // ─────────────────────────────────────────────────────────────────────────
    function initParallax() {
        if (REDUCED) return;
        var els = Array.from(document.querySelectorAll('[data-scroll-parallax]'));
        if (!els.length) return;
        var state = els.map(function(el) {
            el.style.willChange = 'transform';
            return {
                el: el,
                speed: parseFloat(el.getAttribute('data-scroll-parallax-speed') || 0.1),
                cur: 0, target: 0
            };
        });
        var ticking = false;
        function update() {
            var sy = window.scrollY;
            state.forEach(function(s) {
                var rect = s.el.getBoundingClientRect();
                var center = rect.top + rect.height / 2 + sy;
                var viewC  = sy + window.innerHeight / 2;
                s.target = (viewC - center) * s.speed;
                s.cur   += (s.target - s.cur) * 0.08;
                s.el.style.transform = 'translateY(' + s.cur.toFixed(2) + 'px)';
            });
            ticking = false;
        }
        window.addEventListener('scroll', function() {
            if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
        update();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. COUNTER  [data-scroll-counter]
    // ─────────────────────────────────────────────────────────────────────────
    function initCounters() {
        document.querySelectorAll('[data-scroll-counter]').forEach(function(el) {
            var raw      = el.textContent.trim();
            var suffix   = raw.replace(/[\d.]/g, '');
            var target   = parseFloat(raw);
            var duration = parseFloat(el.getAttribute('data-scroll-duration') || 1800);
            var decimals = (raw.split('.')[1] || '').replace(/[^\d]/g, '').length;
            if (isNaN(target) || REDUCED) return;
            el.textContent = '0' + suffix;
            once(el, 0.4, '0px', function() {
                var start = performance.now();
                function step(now) {
                    var t = Math.min((now - start) / duration, 1);
                    el.textContent = (outExpo(t) * target).toFixed(decimals) + suffix;
                    if (t < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. BLUR REVEAL  [data-scroll-blur]
    // ─────────────────────────────────────────────────────────────────────────
    function initBlurReveal() {
        document.querySelectorAll('[data-scroll-blur]').forEach(function(el) {
            var amount   = parseFloat(el.getAttribute('data-scroll-blur-amount') || 16);
            var delay    = parseFloat(el.getAttribute('data-scroll-delay')        || 0);
            var duration = parseFloat(el.getAttribute('data-scroll-duration')     || 1100);
            if (!REDUCED) {
                el.style.opacity    = '0';
                el.style.filter     = 'blur(' + amount + 'px)';
                el.style.willChange = 'opacity,filter';
                el.style.transition =
                    'opacity ' + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + delay + 'ms,' +
                    'filter '  + duration + 'ms cubic-bezier(0.16,1,0.3,1) ' + delay + 'ms';
            }
            once(el, 0.1, '0px 0px -40px 0px', function() {
                el.style.opacity = '1';
                el.style.filter  = 'blur(0px)';
                setTimeout(function() {
                    el.style.willChange = 'auto';
                    el.style.transition = '';
                    el.style.filter     = '';
                }, delay + duration + 150);
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. CARD TILT  [data-scroll-tilt]
    // ─────────────────────────────────────────────────────────────────────────
    function initCardTilt() {
        if (REDUCED) return;
        document.querySelectorAll('[data-scroll-tilt]').forEach(function(card) {
            var max   = parseFloat(card.getAttribute('data-scroll-tilt-max')   || 6);
            var scale = parseFloat(card.getAttribute('data-scroll-tilt-scale') || 1.02);
            var curX = 0, curY = 0, tX = 0, tY = 0, rafId = null;
            function lerp(a, b, t) { return a + (b - a) * t; }
            function animate() {
                curX = lerp(curX, tX, 0.1);
                curY = lerp(curY, tY, 0.1);
                card.style.transform = 'perspective(900px) rotateX(' + curY.toFixed(3) + 'deg) rotateY(' + curX.toFixed(3) + 'deg) scale(' + scale + ')';
                rafId = (Math.abs(curX - tX) > 0.01 || Math.abs(curY - tY) > 0.01) ? requestAnimationFrame(animate) : null;
            }
            card.addEventListener('mousemove', function(e) {
                var r  = card.getBoundingClientRect();
                var nx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
                var ny = ((e.clientY - r.top)  / r.height - 0.5) * 2;
                tX =  nx * max; tY = -ny * max;
                if (!rafId) rafId = requestAnimationFrame(animate);
            });
            card.addEventListener('mouseleave', function() {
                tX = 0; tY = 0;
                card.style.transition = 'transform 0.65s cubic-bezier(0.16,1,0.3,1)';
                card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
                setTimeout(function() { card.style.transition = ''; }, 680);
                if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            });
            card.style.willChange = 'transform';
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 11. MAGNETIC BUTTON  [data-scroll-magnetic]
    // ─────────────────────────────────────────────────────────────────────────
    function initMagnetic() {
        if (REDUCED) return;
        document.querySelectorAll('[data-scroll-magnetic]').forEach(function(btn) {
            var str = parseFloat(btn.getAttribute('data-scroll-magnetic-strength') || 0.38);
            var cX = 0, cY = 0, tX = 0, tY = 0, rafId = null;
            function lerp(a, b, t) { return a + (b - a) * t; }
            function tick() {
                cX = lerp(cX, tX, 0.13); cY = lerp(cY, tY, 0.13);
                btn.style.transform = 'translate(' + cX.toFixed(2) + 'px,' + cY.toFixed(2) + 'px)';
                rafId = (Math.abs(cX - tX) > 0.05 || Math.abs(cY - tY) > 0.05) ? requestAnimationFrame(tick) : null;
            }
            btn.addEventListener('mousemove', function(e) {
                var r = btn.getBoundingClientRect();
                tX = (e.clientX - r.left - r.width  / 2) * str;
                tY = (e.clientY - r.top  - r.height / 2) * str;
                if (!rafId) rafId = requestAnimationFrame(tick);
            });
            btn.addEventListener('mouseleave', function() {
                tX = 0; tY = 0;
                if (!rafId) rafId = requestAnimationFrame(tick);
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 12. IMAGE COVER REVEAL  [data-scroll-img-reveal]
    // ─────────────────────────────────────────────────────────────────────────
    function initImageReveal() {
        if (REDUCED) return;
        document.querySelectorAll('[data-scroll-img-reveal]').forEach(function(wrapper) {
            var color    = wrapper.getAttribute('data-scroll-img-color') || 'hsl(var(--foreground))';
            var delay    = parseFloat(wrapper.getAttribute('data-scroll-delay')    || 0);
            var duration = parseFloat(wrapper.getAttribute('data-scroll-duration') || 1050);

            /* bare <img> targets: wipe the image itself via clip-path — no
               wrapper, no layout change, works on any image anywhere */
            if (wrapper.tagName === 'IMG') {
                if (REDUCED) return;
                var img = wrapper;
                img.style.clipPath = 'inset(0 100% 0 0)';
                img.style.willChange = 'clip-path';
                img.style.transition = 'clip-path ' + duration + 'ms cubic-bezier(0.76,0,0.24,1) ' + delay + 'ms';
                once(img, 0.08, '0px 0px -50px 0px', function() {
                    img.style.clipPath = 'inset(0 0 0 0)';
                    setTimeout(function() {
                        img.style.willChange = 'auto';
                        img.style.transition = '';
                        img.style.clipPath   = '';
                    }, delay + duration + 300);
                });
                return;
            }

            wrapper.style.position = 'relative';
            wrapper.style.overflow = 'hidden';
            var cover = document.createElement('div');
            cover.setAttribute('aria-hidden', 'true');
            cover.style.cssText = 'position:absolute;inset:0;background:' + color + ';z-index:2;' +
                'transform-origin:left center;transform:scaleX(1);pointer-events:none;' +
                'transition:transform ' + duration + 'ms cubic-bezier(0.76,0,0.24,1) ' + delay + 'ms';
            wrapper.appendChild(cover);
            once(wrapper, 0.08, '0px 0px -50px 0px', function() {
                cover.style.transformOrigin = 'right center';
                cover.style.transform = 'scaleX(0)';
                setTimeout(function() { cover.remove(); }, delay + duration + 300);
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 13. HORIZONTAL TICKER  [data-scroll-ticker]
    //     Wrap the items in [data-scroll-ticker-inner] inside [data-scroll-ticker]
    // ─────────────────────────────────────────────────────────────────────────
    function initTicker() {
        if (REDUCED) return;
        document.querySelectorAll('[data-scroll-ticker]').forEach(function(ticker) {
            var inner = ticker.querySelector('[data-scroll-ticker-inner]');
            if (!inner) return;
            var speed = parseFloat(ticker.getAttribute('data-scroll-ticker-speed') || 40);
            var dir   = ticker.getAttribute('data-scroll-ticker-dir') === 'right' ? 'reverse' : 'normal';
            var clone = inner.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            ticker.appendChild(clone);
            ticker.style.overflow = 'hidden';
            ticker.style.display  = 'flex';
            [inner, clone].forEach(function(el) {
                el.style.display   = 'flex';
                el.style.flexShrink = '0';
            });
            function setAnim() {
                var w = inner.offsetWidth;
                if (!w) return;
                var dur = (w / speed).toFixed(2) + 's';
                [inner, clone].forEach(function(el) {
                    el.style.animation          = 'wyrm-ticker ' + dur + ' linear infinite';
                    el.style.animationDirection = dir;
                });
            }
            setAnim();
            ticker.addEventListener('mouseenter', function() {
                [inner, clone].forEach(function(el) { el.style.animationPlayState = 'paused'; });
            });
            ticker.addEventListener('mouseleave', function() {
                [inner, clone].forEach(function(el) { el.style.animationPlayState = 'running'; });
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 14. SCROLL-SCRUB / SCROLL-DRIVEN TIMELINE ENGINE  [data-scroll-scrub]
    //     Scroll-Linked, Scroll-Controlled, View-Timeline Progress Animation.
    //     Continuously maps viewport scroll progress (0.0 -> 1.0) through RAF.
    //     Supported modes:
    //       - data-scroll-scrub="hero-video": Cinematic scroll scale, 3D tilt, subtle translation
    //       - data-scroll-scrub="parallax": Smooth scroll-linked Y translation (with data-scrub-speed)
    //       - data-scroll-scrub="scale": Progressively scales element as user scrolls
    //       - data-scroll-scrub="blur": Progressively softens / focuses blur based on scroll offset
    //       - data-scroll-scrub="header": Scroll-linked navbar backdrop & elevation progress
    // ─────────────────────────────────────────────────────────────────────────
    function initScrollScrub() {
        if (REDUCED) return;

        // Header scroll-linked progress
        var header = document.querySelector('header');
        if (header) {
            var tickingHeader = false;
            window.addEventListener('scroll', function() {
                if (!tickingHeader) {
                    requestAnimationFrame(function() {
                        var sy = window.scrollY;
                        var progress = Math.min(sy / 140, 1);
                        header.style.setProperty('--scroll-p', progress.toFixed(3));
                        if (progress > 0.05) {
                            header.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,' + (progress * 0.35).toFixed(2) + ')';
                            header.style.borderColor = 'hsl(var(--border) / ' + (0.3 + progress * 0.4).toFixed(2) + ')';
                        } else {
                            header.style.boxShadow = 'none';
                            header.style.borderColor = 'hsl(var(--border) / 0.3)';
                        }
                        tickingHeader = false;
                    });
                    tickingHeader = true;
                }
            }, { passive: true });
        }

        var scrubItems = Array.from(document.querySelectorAll('[data-scroll-scrub]'));
        if (!scrubItems.length) return;

        var items = scrubItems.map(function(el) {
            var mode = el.getAttribute('data-scroll-scrub');
            var speed = parseFloat(el.getAttribute('data-scrub-speed') || 0.15);
            return {
                el: el,
                mode: mode,
                speed: speed,
                currentProgress: 0,
                targetProgress: 0
            };
        });

        var ticking = false;

        function updateScrub() {
            var winH = window.innerHeight;
            var sy = window.scrollY;

            items.forEach(function(item) {
                var rect = item.el.getBoundingClientRect();
                // Check if element is reasonably within or near viewport
                if (rect.bottom < -100 || rect.top > winH + 100) return;

                // View Timeline Progress: 0 when element top hits bottom of viewport, 1 when bottom leaves top
                var totalDist = winH + rect.height;
                var currentDist = winH - rect.top;
                var p = Math.max(0, Math.min(1, currentDist / totalDist));
                item.targetProgress = p;

                // Soft damping lerp for buttery smooth scroll scrub
                item.currentProgress += (item.targetProgress - item.currentProgress) * 0.12;
                var cp = item.currentProgress;

                // Apply specific scroll-driven transforms
                if (item.mode === 'hero-video') {
                    // Start slightly scaled down and with slight perspective 3D pitch, scrubs to flat 1.0 as centered
                    // centered progress is ~0.5
                    var distFromCenter = (rect.top + rect.height / 2) - (winH / 2);
                    var normDist = Math.max(-1, Math.min(1, distFromCenter / (winH / 2)));
                    var scale = 1 + (1 - Math.abs(normDist)) * 0.04; // subtle zoom to 1.04 at center
                    var rotX = normDist * 4; // slight 3D rotation based on scroll position (-4deg to +4deg)
                    var translateY = -normDist * 18; // smooth vertical scrub parallax
                    item.el.style.transform = 'perspective(1200px) rotateX(' + rotX.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ') translateY(' + translateY.toFixed(1) + 'px)';
                } else if (item.mode === 'parallax') {
                    var yOffset = (0.5 - cp) * 120 * item.speed;
                    item.el.style.transform = 'translate3d(0,' + yOffset.toFixed(1) + 'px,0)';
                } else if (item.mode === 'scale') {
                    var sc = 0.95 + cp * 0.08;
                    item.el.style.transform = 'scale(' + sc.toFixed(3) + ')';
                } else if (item.mode === 'rotation') {
                    var rot = (cp - 0.5) * 12 * item.speed;
                    item.el.style.transform = 'rotate(' + rot.toFixed(2) + 'deg)';
                } else if (item.mode === 'fade') {
                    // Soft scroll-linked opacity fade
                    var op = Math.min(1, cp * 2.2);
                    item.el.style.opacity = op.toFixed(2);
                }
            });

            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateScrub);
                ticking = true;
            }
        }, { passive: true });

        // Initial compute
        updateScrub();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────
    function init() {
        initScrollProgress();
        initFadeAnimations();
        initStagger();
        initClipReveal();
        initScaleReveal();
        initWordReveal();
        initParallax();
        initCounters();
        initBlurReveal();
        initCardTilt();
        initMagnetic();
        initImageReveal();
        initTicker();
        initScrollScrub();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
