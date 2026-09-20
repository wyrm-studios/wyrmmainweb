/**
 * Liquid Glass Shader & Interactive Mirror Overlay
 * Ported from LiquidGlassCluster / Glass Icon (Originkit)
 * Upgraded with:
 * - Dynamic Text Backdrop Texture (rendering the statement text directly behind & into the glass)
 * - Powerful Mirror Reflection + Caustic Specular Highlights & Chromatic Refraction
 * - Enhanced 3D Rotation Angles & Smooth Inertia
 * - Interactive Hover to Dissipate / Disappear smoothly
 */

(function () {
    const BEVEL = 0.035;
    const CORE_REFRACT = 1.0;
    const IOR = 1.52;
    const THICKNESS = 2.4;
    const IDLE_FLOAT = 0.06;
    const TILT_RANGE = 0.65;

    const TILT_RATE = 5.5;
    const DRAG_GAIN = 0.012;
    const SPIN_YAW = 0.42;
    const SPIN_PITCH = 0.28;
    const FOV = (45 * Math.PI) / 180;
    const CAM_DIST = 5.0;
    const DEG = Math.PI / 180;

    function parseColor(input, fallback) {
        if (!input) return fallback;
        const s = input.trim();
        if (s[0] === "#") {
            let h = s.slice(1);
            if (h.length === 3 || h.length === 4)
                h = h.split("").map((c) => c + c).join("");
            if (h.length >= 6) {
                const r = parseInt(h.slice(0, 2), 16) / 255;
                const g = parseInt(h.slice(2, 4), 16) / 255;
                const b = parseInt(h.slice(4, 6), 16) / 255;
                if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
            }
            return fallback;
        }
        const m = s.match(/rgba?\(([^)]+)\)/i);
        if (m) {
            const p = m[1].split(",").map((v) => parseFloat(v));
            if (p.length >= 3) return [p[0] / 255, p[1] / 255, p[2] / 255];
        }
        return fallback;
    }

    function rotYX(yaw, pitch) {
        const cy = Math.cos(yaw);
        const sy = Math.sin(yaw);
        const cx = Math.cos(pitch);
        const sx = Math.sin(pitch);
        const m = new Float32Array(9);

        m[0] = cy;
        m[1] = 0;
        m[2] = -sy;

        m[3] = sy * sx;
        m[4] = cx;
        m[5] = cy * sx;

        m[6] = sy * cx;
        m[7] = -sx;
        m[8] = cy * cx;
        return m;
    }

    function transpose3(m) {
        const o = new Float32Array(9);
        o[0] = m[0]; o[1] = m[3]; o[2] = m[6];
        o[3] = m[1]; o[4] = m[4]; o[5] = m[7];
        o[6] = m[2]; o[7] = m[5]; o[8] = m[8];
        return o;
    }

    function mul3(a, b) {
        const o = new Float32Array(9);
        for (let c = 0; c < 3; c++) {
            for (let r = 0; r < 3; r++) {
                o[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2];
            }
        }
        return o;
    }

    function rotYXZ(yaw, pitch, roll) {
        const base = rotYX(yaw, pitch);
        if (roll === 0) return base;
        const c = Math.cos(roll);
        const s = Math.sin(roll);
        const rz = new Float32Array([c, s, 0, -s, c, 0, 0, 0, 1]);
        return mul3(base, rz);
    }

    function buildEnvCanvas() {
        if (typeof document === "undefined") return null;
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#0c0d12";
        ctx.fillRect(0, 0, 1024, 512);

        // High dynamic range studio lights for mirror reflections
        const softbox = (x, y, w, h, intensity, colorStop) => {
            const grd = ctx.createLinearGradient(x, y, x, y + h);
            grd.addColorStop(0, colorStop || `rgba(255, 255, 255, ${intensity})`);
            grd.addColorStop(0.4, `rgba(230, 240, 255, ${intensity * 0.8})`);
            grd.addColorStop(1, `rgba(20, 25, 35, 0.05)`);
            ctx.fillStyle = grd;
            ctx.shadowColor = "#818cf8";
            ctx.shadowBlur = 100;
            ctx.beginPath();
            if (typeof ctx.roundRect === "function") {
                ctx.roundRect(x, y, w, h, 50);
            } else {
                ctx.rect(x, y, w, h);
            }
            ctx.fill();
        };

        softbox(30, 80, 340, 350, 1.0, "rgba(255, 255, 255, 1)");
        softbox(650, 80, 340, 350, 1.0, "rgba(220, 240, 255, 1)");
        softbox(330, -70, 360, 200, 1.0, "rgba(255, 255, 255, 1)");
        // Extra mirror rim specular strip
        softbox(200, 380, 620, 100, 0.7, "rgba(165, 180, 252, 0.8)");
        ctx.shadowBlur = 0;
        return canvas;
    }

    const FULLSCREEN_VS = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

    const GLASS_FS = `
    precision highp float;

    uniform vec2 uRes;
    uniform float uAspect;
    uniform float uTanHalf;

    uniform sampler2D uPlate;
    uniform vec2 uPlateFit;
    uniform float uHasPlate;
    uniform sampler2D uEnv;

    uniform mat3 uRot;
    uniform mat3 uRotT;
    uniform vec3 uCenter;
    uniform float uScale;
    uniform float uBoundR;

    uniform float uShape;
    uniform float uHalfDepth;
    uniform float uBevel;
    uniform float uTorusTube;

    uniform float uDisp;
    uniform float uFrost;
    uniform vec3 uTint;

    const float PI = 3.14159265359;
    const float CORE_REFRACT = ${CORE_REFRACT.toFixed(4)};
    const float IOR = ${IOR.toFixed(4)};
    const float THICKNESS = ${THICKNESS.toFixed(4)};

    float sdCross(vec2 p, vec2 b) {
        p = abs(p);
        p = (p.y > p.x) ? p.yx : p.xy;
        vec2 q = p - b;
        float k = max(q.y, q.x);
        vec2 w = (k > 0.0) ? q : vec2(b.y - p.x, -k);
        return sign(k) * length(max(w, 0.0));
    }

    vec2 r45(vec2 p) {
        const float c = 0.7071067811865476;
        return vec2((p.x + p.y) * c, (p.y - p.x) * c);
    }

    float extrudeRound(float d2, float pz, float hd, float r) {
        vec2 q = vec2(d2 + r, abs(pz) - hd + r);
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    float map(vec3 p) {
        if (uShape < 0.5) {
            return extrudeRound(sdCross(r45(p.xy), vec2(1.3, 0.35)), p.z, uHalfDepth, uBevel);
        } else if (uShape < 1.5) {
            vec2 q = vec2(length(p.xy) - 0.85, p.z);
            return length(q) - uTorusTube;
        }
        return length(p) - 1.25;
    }

    vec3 mapNormal(vec3 p) {
        const float e = 0.0015;
        vec2 k = vec2(1.0, -1.0);
        return normalize(
            k.xyy * map(p + k.xyy * e) +
            k.yyx * map(p + k.yyx * e) +
            k.yxy * map(p + k.yxy * e) +
            k.xxx * map(p + k.xxx * e)
        );
    }

    vec4 samplePlate(vec2 screenUv) {
        if (uHasPlate < 0.5) return vec4(0.0);
        vec2 uv = (screenUv - 0.5) * uPlateFit + 0.5;
        return texture2D(uPlate, clamp(uv, 0.0, 1.0));
    }

    float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        vec2 screenUv = gl_FragCoord.xy / uRes;
        vec2 ndc = screenUv * 2.0 - 1.0;

        vec3 D = normalize(vec3(ndc.x * uTanHalf * uAspect, ndc.y * uTanHalf, -1.0));
        vec3 rd = normalize(uRotT * D);
        vec3 ro = (uRotT * -uCenter) / uScale;

        float bb = dot(ro, rd);
        float cc = dot(ro, ro) - uBoundR * uBoundR;
        float hh = bb * bb - cc;
        if (hh < 0.0) discard;
        hh = sqrt(hh);
        float t = max(-bb - hh, 0.0);
        float tMax = -bb + hh;

        bool hit = false;
        for (int i = 0; i < 80; i++) {
            if (t > tMax) break;
            float d = map(ro + rd * t);
            if (d < 0.0008) { hit = true; break; }
            t += d * 0.88;
        }
        if (!hit) discard;

        vec3 pObj = ro + rd * t;
        vec3 nObj = mapNormal(pObj);

        vec3 vP = uCenter + uScale * (uRot * pObj);
        vec3 normal = normalize(uRot * nObj);
        vec3 viewDir = normalize(-vP);

        // Powerful mirror & metallic-specular Fresnel curve
        float NdotV = max(dot(normal, viewDir), 0.0);
        float fresnel = pow(1.0 - NdotV, 3.0);
        float mirrorReflectionFactor = clamp(0.40 + fresnel * 0.60, 0.0, 1.0);

        // Refraction offset with chromatic dispersion
        float coreFactor = pow(NdotV, 2.0);
        vec2 lensOffset = (screenUv - 0.5) * (CORE_REFRACT * 0.22) * coreFactor;
        vec3 refractView = refract(-viewDir, normal, 1.0 / IOR);
        vec2 offset = refractView.xy * (THICKNESS * 0.12) - lensOffset;

        // Mirror Reflection calculation (mirroring environment + backdrop text)
        vec3 reflectDir = reflect(-viewDir, normal);
        vec2 equirectUv = vec2(
            atan(reflectDir.z, reflectDir.x) / (2.0 * PI) + 0.5,
            asin(clamp(reflectDir.y, -1.0, 1.0)) / PI + 0.5
        );
        vec3 envReflection = texture2D(uEnv, equirectUv).rgb * 3.2;

        // Mirror reflection of the text backdrop itself!
        // When facing viewer/text, the mirror ray reflects backward toward the text plane
        vec2 mirrorTextUv = screenUv - reflectDir.xy * 0.35;
        vec4 reflectedText = samplePlate(mirrorTextUv);

        // Combine mirror reflection: studio HDRI reflections + reflected typography
        vec3 mirrorColor = envReflection + reflectedText.rgb * 1.8;

        // Chromatic dispersion transmission
        vec2 uvR = screenUv + offset * (1.0 + uDisp);
        vec2 uvG = screenUv + offset;
        vec2 uvB = screenUv + offset * (1.0 - uDisp);

        vec3 transmission = vec3(0.0);
        float bgAlpha = 0.0;

        if (uFrost > 0.001) {
            float rnd = rand(screenUv) * 6.2831853;
            const int SAMPLES = 16;
            const float GOLDEN_ANGLE = 2.39996323;
            float radius = 0.0;
            float radiusStep = 1.0 / float(SAMPLES);
            float blurMultiplier = uFrost * 0.015;
            for (int i = 0; i < SAMPLES; i++) {
                float theta = float(i) * GOLDEN_ANGLE + rnd;
                radius += radiusStep;
                vec2 bo = vec2(cos(theta), sin(theta)) * radius * blurMultiplier;
                transmission.r += samplePlate(uvR + bo).r;
                vec4 g = samplePlate(uvG + bo);
                transmission.g += g.g;
                bgAlpha += g.a;
                transmission.b += samplePlate(uvB + bo).b;
            }
            transmission /= float(SAMPLES);
            bgAlpha /= float(SAMPLES);
        } else {
            transmission.r = samplePlate(uvR).r;
            vec4 g = samplePlate(uvG);
            transmission.g = g.g;
            bgAlpha = g.a;
            transmission.b = samplePlate(uvB).b;
        }

        transmission *= uTint;

        // Highly reflective mirror & glossy liquid glass composite
        vec3 finalColor = mix(transmission * 0.7, mirrorColor, mirrorReflectionFactor);

        // Specular caustic gloss streak
        float specHighlight = pow(max(dot(reflectDir, vec3(0.0, 0.7, 0.7)), 0.0), 32.0) * 2.5;
        finalColor += vec3(specHighlight);

        float outAlpha = clamp(0.55 + fresnel * 0.45, 0.0, 1.0);

        gl_FragColor = vec4(finalColor, outAlpha);
    }`;

    function compile(gl, type, src) {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn("LiquidGlass compile:", gl.getShaderInfoLog(s));
            gl.deleteShader(s);
            return null;
        }
        return s;
    }

    function link(gl, vs, fs) {
        const v = compile(gl, gl.VERTEX_SHADER, vs);
        const f = compile(gl, gl.FRAGMENT_SHADER, fs);
        if (!v || !f) return null;
        const p = gl.createProgram();
        if (!p) return null;
        gl.attachShader(p, v);
        gl.attachShader(p, f);
        gl.linkProgram(p);
        gl.deleteShader(v);
        gl.deleteShader(f);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.warn("LiquidGlass link:", gl.getProgramInfoLog(p));
            return null;
        }
        return p;
    }

    function initLiquidGlass() {
        const hostEl = document.getElementById("liquid-glass-container");
        const canvasEl = document.getElementById("liquid-glass-canvas");
        const sectionEl = document.getElementById("hero-brand-statement");
        if (!hostEl || !canvasEl) return;

        const opts = { antialias: true, alpha: true, premultipliedAlpha: true };
        const gl = canvasEl.getContext("webgl2", opts) || canvasEl.getContext("webgl", opts);
        if (!gl) {
            console.warn("WebGL not supported for LiquidGlassCluster");
            return;
        }

        const glassProg = link(gl, FULLSCREEN_VS, GLASS_FS);
        if (!glassProg) return;

        const u = {
            res: gl.getUniformLocation(glassProg, "uRes"),
            aspect: gl.getUniformLocation(glassProg, "uAspect"),
            tanHalf: gl.getUniformLocation(glassProg, "uTanHalf"),
            plate: gl.getUniformLocation(glassProg, "uPlate"),
            plateFit: gl.getUniformLocation(glassProg, "uPlateFit"),
            hasPlate: gl.getUniformLocation(glassProg, "uHasPlate"),
            env: gl.getUniformLocation(glassProg, "uEnv"),
            rot: gl.getUniformLocation(glassProg, "uRot"),
            rotT: gl.getUniformLocation(glassProg, "uRotT"),
            center: gl.getUniformLocation(glassProg, "uCenter"),
            scale: gl.getUniformLocation(glassProg, "uScale"),
            boundR: gl.getUniformLocation(glassProg, "uBoundR"),
            shape: gl.getUniformLocation(glassProg, "uShape"),
            halfDepth: gl.getUniformLocation(glassProg, "uHalfDepth"),
            bevel: gl.getUniformLocation(glassProg, "uBevel"),
            torusTube: gl.getUniformLocation(glassProg, "uTorusTube"),
            disp: gl.getUniformLocation(glassProg, "uDisp"),
            frost: gl.getUniformLocation(glassProg, "uFrost"),
            tint: gl.getUniformLocation(glassProg, "uTint"),
        };
        const aGlassPos = gl.getAttribLocation(glassProg, "aPos");

        const quadBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

        function makeTex(wrap) {
            const t = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, t);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            return t;
        }

        const envTex = makeTex(gl.REPEAT);
        const envCanvas = buildEnvCanvas();
        if (envCanvas) {
            gl.bindTexture(gl.TEXTURE_2D, envTex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, envCanvas);
        }

        const plateTex = makeTex(gl.CLAMP_TO_EDGE);

        let vw = 1, vh = 1;
        let dprCur = 1;
        let plateReady = false;
        let plateAspect = 1;

        // Render the statement text into an offscreen canvas texture so the liquid glass can refract & mirror it like real glass
        function bakeStatementPlate() {
            const isDark = document.documentElement.classList.contains("dark");
            const w = Math.max(2, vw);
            const h = Math.max(2, vh);
            const c = document.createElement("canvas");
            c.width = w;
            c.height = h;
            const ctx2d = c.getContext("2d");
            if (!ctx2d) return;

            ctx2d.clearRect(0, 0, w, h);

            const isMobile = w < 768 * dprCur;
            const textColor = isDark ? "#ffffff" : "#0f0f14";
            const subColor = isDark ? "#94a3b8" : "#475569";

            ctx2d.textAlign = "center";
            ctx2d.textBaseline = "middle";

            const cy = h * 0.46;

            // Slogan
            const sloganPx = (isMobile ? 18 : 24) * dprCur;
            ctx2d.font = `700 ${sloganPx}px 'Space Grotesk', system-ui, sans-serif`;
            ctx2d.fillStyle = textColor;
            ctx2d.fillText("We build brands people remember.", w / 2, cy - (isMobile ? 80 : 100) * dprCur);

            // Title Line 1 & Line 2
            const titlePx = (isMobile ? 32 : 54) * dprCur;
            ctx2d.font = `800 ${titlePx}px 'Space Grotesk', system-ui, sans-serif`;
            ctx2d.fillStyle = textColor;
            ctx2d.fillText("Cinematic Brand Experiences", w / 2, cy - (isMobile ? 24 : 32) * dprCur);
            ctx2d.fillText("That make your brand impossible to ignore", w / 2, cy + (isMobile ? 24 : 32) * dprCur);

            // Paragraph
            const paraPx = (isMobile ? 13 : 17) * dprCur;
            ctx2d.font = `500 ${paraPx}px 'Inter', system-ui, sans-serif`;
            ctx2d.fillStyle = subColor;
            if (!isMobile) {
                ctx2d.fillText("Full-service creative studio crafting brand identities, motion design, video editing, logos,", w / 2, cy + 95 * dprCur);
                ctx2d.fillText("and web experiences for companies that refuse to blend in.", w / 2, cy + 122 * dprCur);
            }

            plateAspect = w / h;
            gl.bindTexture(gl.TEXTURE_2D, plateTex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
            plateReady = true;
        }

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            dprCur = dpr;
            const cw = hostEl.clientWidth || 1;
            const ch = hostEl.clientHeight || 1;
            const w = Math.max(1, Math.round(cw * dpr));
            const h = Math.max(1, Math.round(ch * dpr));
            if (w === vw && h === vh) return;
            vw = w;
            vh = h;
            canvasEl.width = w;
            canvasEl.height = h;
            bakeStatementPlate();
        }

        const ro = new ResizeObserver(resize);
        ro.observe(hostEl);
        resize();

        // Listen for dark/light mode toggle to re-bake text colors
        const observer = new MutationObserver(() => {
            bakeStatementPlate();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        let baseYaw = 0.25;
        let basePitch = 0.15;
        let tiltX = 0;
        let tiltY = 0;
        let tiltTargetX = 0;
        let tiltTargetY = 0;
        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        // Hover disappear logic
        let isHovered = false;
        let opacityVal = 1.0;

        function onPointerMove(e) {
            // The ring is fully autonomous: cursor movement never tilts, drags or
            // steers it. The ONLY cursor interaction is the button-hover check —
            // hovering the hero CTAs dissipates the ring, everything else is ignored.
            isHovered = checkButtonProximity(e.clientX, e.clientY);
        }

        function onPointerDown(e) {
            // drag-to-rotate intentionally disabled: the ring must not react to the cursor
        }

        function onPointerUp() {
            dragging = false;
        }

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);

        // Disappear when cursor is near/over the two CTA buttons.
        // We use a document-level pointermove (NOT events on the buttons) because the
        // glass canvas sits above everything in z-order and would swallow events if
        // pointer-events were ever enabled. Instead we check the raw cursor position
        // against each button's bounding rect with a small expansion padding.
        const buttonTriggers = document.querySelectorAll(".hero-liquid-glass-trigger");
        const BTN_PAD = 18; // px expansion around button rect that triggers dissipation

        function checkButtonProximity(clientX, clientY) {
            for (const btn of buttonTriggers) {
                const r = btn.getBoundingClientRect();
                if (
                    clientX >= r.left - BTN_PAD &&
                    clientX <= r.right + BTN_PAD &&
                    clientY >= r.top - BTN_PAD &&
                    clientY <= r.bottom + BTN_PAD
                ) {
                    return true;
                }
            }
            return false;
        }

        // Keyboard focus on the buttons should also hide the ring
        buttonTriggers.forEach((btn) => {
            btn.addEventListener("focus", () => { isHovered = true; });
            btn.addEventListener("blur", () => { isHovered = false; });
        });

        // Touch support
        document.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                isHovered = checkButtonProximity(t.clientX, t.clientY);
            }
        }, { passive: true });
        document.addEventListener("touchend", () => { isHovered = false; }, { passive: true });

        // Clear hover when mouse leaves window
        document.addEventListener("mouseleave", () => {
            isHovered = false;
            tiltTargetX = 0;
            tiltTargetY = 0;
        });

        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        let raf = 0;
        let prev = performance.now();
        let elapsed = 0;

        // Enhanced powerful mirror rotation & appearance settings
        const p = {
            shape: 1, // Torus ring
            depth: 42,
            size: 78,
            speed: 48,
            direction: 1,
            chromatic: 38,
            frost: 12, // Crisp mirror clarity
            tint: "#ffffff",
            angleX: 68,  // Adjusted sleek isometric mirror angle
            angleY: 35,  // Dramatic oblique 3D tilt revealing mirror reflections
            angleZ: 14,  // Dynamic twist
            offsetX: 0,
            offsetY: -3
        };

        function frame(now) {
            raf = requestAnimationFrame(frame);
            const dt = Math.min((now - prev) / 1000, 0.05);
            prev = now;
            elapsed += dt;

            // Smoothly disappear on hover (fade out and slightly expand/dissipate)
            const targetOpacity = isHovered ? 0.0 : 1.0;
            opacityVal += (targetOpacity - opacityVal) * (1 - Math.exp(-7 * dt));

            if (hostEl) {
                hostEl.style.opacity = opacityVal.toFixed(4);
                hostEl.style.transform = `scale(${(1.0 + (1.0 - opacityVal) * 0.15).toFixed(3)})`;
                // Always keep pointer-events:none so the glass never blocks clicks/hovers on content below
                hostEl.style.pointerEvents = "none";
            }

            if (opacityVal < 0.005) {
                gl.clear(gl.COLOR_BUFFER_BIT);
                return;
            }

            const k = 1 - Math.exp(-TILT_RATE * dt);
            tiltX += (tiltTargetX - tiltX) * k;
            tiltY += (tiltTargetY - tiltY) * k;

            const spin = (p.speed / 50) * p.direction;
            baseYaw += spin * SPIN_YAW * dt;
            basePitch += spin * SPIN_PITCH * dt;

            const yaw = baseYaw + tiltX + p.angleY * DEG;
            const pitch = Math.max(-1.45, Math.min(1.45, basePitch - tiltY)) + p.angleX * DEG;
            const rot = rotYXZ(yaw, pitch, p.angleZ * DEG);
            const rotT = transpose3(rot);

            const camDist = CAM_DIST;
            const halfFrame = camDist * Math.tan(FOV / 2);
            const targetHalf = Math.max(0.02, p.size / 100) * halfFrame;

            const nativeDepth = Math.max(0, p.depth / 100);
            const torusTube = Math.max(0.02, nativeDepth * 0.5);
            const refHalf = 0.85 + torusTube;
            const boundR = 0.85 + torusTube;
            const halfDepth = nativeDepth * 0.5;
            const bevel = BEVEL;

            const scale = targetHalf / refHalf;
            const floatY = Math.sin(elapsed * 2.2) * IDLE_FLOAT;
            const screenAspect = vw / vh;

            const fitX = screenAspect > plateAspect ? 1 : screenAspect / plateAspect;
            const fitY = screenAspect > plateAspect ? plateAspect / screenAspect : 1;

            gl.viewport(0, 0, vw, vh);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);

            gl.useProgram(glassProg);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, plateTex);
            gl.uniform1i(u.plate, 0);
            gl.uniform2f(u.plateFit, fitX, fitY);
            gl.uniform1f(u.hasPlate, plateReady ? 1.0 : 0.0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, envTex);
            gl.uniform1i(u.env, 1);

            gl.uniform2f(u.res, vw, vh);
            gl.uniform1f(u.aspect, screenAspect);
            gl.uniform1f(u.tanHalf, Math.tan(FOV / 2));

            gl.uniformMatrix3fv(u.rot, false, rot);
            gl.uniformMatrix3fv(u.rotT, false, rotT);

            gl.uniform3f(
                u.center,
                (p.offsetX / 100) * halfFrame * screenAspect,
                floatY + (p.offsetY / 100) * halfFrame,
                -camDist
            );
            gl.uniform1f(u.scale, scale);
            gl.uniform1f(u.boundR, boundR);

            gl.uniform1f(u.shape, p.shape);
            gl.uniform1f(u.halfDepth, halfDepth);
            gl.uniform1f(u.bevel, bevel);
            gl.uniform1f(u.torusTube, torusTube);

            gl.uniform1f(u.disp, p.chromatic / 1000);
            gl.uniform1f(u.frost, p.frost / 100);
            const tint = parseColor(p.tint, [1, 1, 1]);
            gl.uniform3f(u.tint, tint[0], tint[1], tint[2]);

            gl.enableVertexAttribArray(aGlassPos);
            gl.vertexAttribPointer(aGlassPos, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        raf = requestAnimationFrame(frame);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLiquidGlass);
    } else {
        initLiquidGlass();
    }
})();
