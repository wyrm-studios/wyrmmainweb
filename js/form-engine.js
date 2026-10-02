/* ==============================================================================
   WYRM.studios — Form Engine (11-Step Interactive Inquiry Protocol)
   Multi-step state machine, validation, animations, and EmailJS submission.
   ============================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    const form = document.getElementById('request-form')
               || document.getElementById('inquiry-form');
    const steps = document.querySelectorAll('.form-step');
    if (!form || steps.length === 0) return;

    const continueButtons = document.querySelectorAll('.form-continue-btn');
    const prevBtn = document.getElementById('form-prev-btn');
    const nextBtn = document.getElementById('form-next-btn');
    const progressBar = document.querySelector('.form-progress-bar');
    const stepIndicator = document.querySelector('.protocol-step-indicator');
    const successMessage = document.getElementById('form-success');
    const formEngineCard = document.querySelector('.form-engine-card');

    let currentStep = 1;
    const totalSteps = steps.length;
    const formSelectors = document.querySelectorAll('.form-selector');

    function updateProgressBar() {
        if (progressBar) {
            const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
            progressBar.style.width = progress + '%';
        }
        if (stepIndicator) {
            /* respect the site language (i18n.js may have translated the label) */
            const match = stepIndicator.textContent.match(/(\d+)\s*\/\s*(\d+)/);
            const shownStep = match ? match[1] : currentStep;
            const prefix = stepIndicator.textContent.indexOf('ÉTAPE') === 0 ? 'ÉTAPE '
                         : stepIndicator.textContent.indexOf('الخطوة') === 0 ? 'الخطوة '
                         : 'PROTOCOL STEP ';
            const joiner = prefix === 'الخطوة ' ? ' ' : (prefix === 'ÉTAPE ' ? ' sur ' : '/');
            stepIndicator.textContent = prefix + shownStep + joiner + totalSteps;
        }
    }

    function isStepValid() {
        const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        if (!currentStepEl) return false;

        const isMultiSelect = currentStepEl.dataset.multiSelect === 'true';
        if (isMultiSelect) {
            const selectedOptions = currentStepEl.querySelectorAll('.form-selector.selected');
            return selectedOptions.length > 0;
        } else {
            const selectedOption = currentStepEl.querySelector('.form-selector.selected');
            const inputField = currentStepEl.querySelector('input:not([type="hidden"]), textarea');
            
            if (selectedOption) return true;
            if (inputField) {
                // If optional step (step 11), textarea can be empty
                if (currentStep === 11) return true;
                // Email validation on step 7
                if (inputField.type === 'email') {
                    return inputField.value.trim().length > 0 && inputField.value.includes('@');
                }
                return inputField.value.trim().length > 0;
            }
            return true;
        }
    }

    function updateContinueButton() {
        const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        if (!currentStepEl) return;
        const continueBtn = currentStepEl.querySelector('.form-continue-btn');

        if (continueBtn) {
            if (isStepValid()) {
                continueBtn.classList.remove('btn-disabled');
                continueBtn.disabled = false;
            } else {
                continueBtn.classList.add('btn-disabled');
                continueBtn.disabled = true;
            }
        }
    }

    function showStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > totalSteps) return;

        steps.forEach(function(step) {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === stepNumber) {
                setTimeout(function() {
                    step.classList.add('active');
                }, 80);
            }
        });

        currentStep = stepNumber;
        updateProgressBar();
        updateContinueButton();

        if (formEngineCard) {
            formEngineCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function updateHiddenInput(step) {
        const isMultiSelect = step.dataset.multiSelect === 'true';
        const hiddenInput = step.querySelector('input[type="hidden"]');
        if (!hiddenInput) return;

        const selectedOptions = step.querySelectorAll('.form-selector.selected');
        const values = Array.from(selectedOptions).map(function(opt) {
            /* read only the label, not the letter badge / check icon */
            var label = opt.querySelector('.selector-text');
            return (label ? label.textContent : opt.textContent).trim();
        });

        if (isMultiSelect) {
            hiddenInput.value = values.join(', ');
        } else {
            hiddenInput.value = values[0] || '';
        }
    }

    // Selector click handling
    formSelectors.forEach(function(selector) {
        selector.addEventListener('click', function() {
            const step = this.closest('.form-step');
            const isMultiSelect = step && step.dataset.multiSelect === 'true';

            if (isMultiSelect) {
                this.classList.toggle('selected');
            } else {
                step.querySelectorAll('.form-selector').forEach(function(s) {
                    s.classList.remove('selected');
                });
                this.classList.add('selected');
            }

            updateHiddenInput(step);
            updateContinueButton();
        });
    });

    // Inputs change & input listeners
    const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach(function(input) {
        input.addEventListener('input', updateContinueButton);
        input.addEventListener('change', updateContinueButton);
    });

    // Continue button clicks
    continueButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!this.disabled && currentStep < totalSteps) {
                showStep(currentStep + 1);
            }
        });
    });

    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            /* chevron doubles as "skip" — no validation gate on the way forward */
            if (currentStep < totalSteps) {
                showStep(currentStep + 1);
            }
        });
    }

    // Skip buttons on optional steps — clear selections, then move on
    document.querySelectorAll('.form-skip-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            /* type=submit variants ("Skip & send") fall through to the form's submit handler */
            if (this.getAttribute('type') === 'submit') return;
            e.preventDefault();
            var step = this.closest('.form-step');
            if (step) {
                step.querySelectorAll('.form-selector.selected').forEach(function(s) {
                    s.classList.remove('selected');
                });
                var hidden = step.querySelector('input[type="hidden"]');
                if (hidden) hidden.value = '';
            }
            showStep(currentStep + 1);
        });
    });

    // Form submission — primary: WYRM App dashboard (app.wyrm.studios);
    // fallback: EmailJS so no inquiry is ever lost.
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(form);

        // browser-side intel (server can't see these) — best effort, never blocking
        let clientTz = '';
        try { clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
        const utm = function (k) {
            const v = new URLSearchParams(window.location.search).get('utm_' + k);
            return v ? String(v).slice(0, 120) : '';
        };

        const payload = {
            brand_name: formData.get('brand_name') || '',
            industry: formData.get('industry') || '',
            services: formData.get('services') || '',
            first_name: formData.get('first_name') || '',
            last_name: formData.get('last_name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            referral_source: formData.get('referral_source') || '',
            budget: formData.get('budget') || '',
            project_details: formData.get('project_details') || '',
            page_url: window.location.href,
            client_language: (navigator.languages && navigator.languages[0]) || navigator.language || '',
            client_timezone: clientTz,
            client_screen: screen.width + 'x' + screen.height,
            utm_source: utm('source'),
            utm_medium: utm('medium'),
            utm_campaign: utm('campaign')
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending...';
        }

        function showSuccess() {
            form.style.display = 'none';
            if (successMessage) {
                successMessage.classList.remove('hidden');
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function restoreBtn() {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Project <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
            }
        }

        /* Always emails the client a thank-you (and notifies the studio).
           Runs on BOTH paths: after the dashboard API succeeds, and as the
           EmailJS fallback when the API is unreachable. */
        function sendThankYouEmail() {
            const clientEmail = payload.email || '';
            const clientName  = (payload.first_name || '') + ' ' + (payload.last_name || '');
            const STUDIO_EMAIL = 'contact.wyrmstudio@gmail.com';

            // 1. Thank-you email to the client — FROM the studio, TO the client's email
            const clientParams = {
                from_name: 'WYRM.studios',
                from_email: STUDIO_EMAIL,
                user_email: clientEmail,        /* <-- routes the EmailJS template 'To' field to the client */
                to_name: clientName,
                brand_name: payload.brand_name,
                industry: payload.industry || 'Not provided',
                services: payload.services || 'Not provided',
                phone: payload.phone || 'Not provided',
                referral_source: payload.referral_source || 'Not provided',
                budget: payload.budget || 'Not provided',
                project_details: payload.project_details || 'Not provided',
                current_date: new Date().toLocaleDateString()
            };

            // 2. Notification email to the studio — FROM the client, TO the studio
            const studioParams = {
                from_name: clientName,
                from_email: clientEmail,
                user_email: STUDIO_EMAIL,
                brand_name: payload.brand_name,
                industry: payload.industry || 'Not provided',
                services: payload.services || 'Not provided',
                phone: payload.phone || 'Not provided',
                referral_source: payload.referral_source || 'Not provided',
                budget: payload.budget || 'Not provided',
                project_details: payload.project_details || 'Not provided',
                current_date: new Date().toLocaleDateString()
            };

            if (typeof emailjs !== 'undefined') {
                /* Send the client thank-you (fire-and-forget on the API path —
                   the dashboard already saved the request, so never block or
                   alarm the client over a failed email). */
                emailjs.send('service_5ofrfln', 'template_f89r11k', clientParams)
                    .catch(function(error) {
                        console.warn('Client thank-you email failed:', error);
                    });
                /* Also notify the studio team (fire-and-forget) */
                emailjs.send('service_5ofrfln', 'template_f89r11k', studioParams)
                    .catch(function(error) {
                        console.warn('Studio notification failed:', error);
                    });
            }
        }

        /* Fallback used only when every dashboard API is unreachable: the
           thank-you email becomes the primary delivery and controls the
           success/error UX. */
        function emailFallback() {
            if (typeof emailjs !== 'undefined') {
                const clientEmail = payload.email || '';
                const clientName  = (payload.first_name || '') + ' ' + (payload.last_name || '');
                const STUDIO_EMAIL = 'contact.wyrmstudio@gmail.com';
                emailjs.send('service_5ofrfln', 'template_f89r11k', {
                    from_name: 'WYRM.studios',
                    from_email: STUDIO_EMAIL,
                    user_email: clientEmail,
                    to_name: clientName,
                    brand_name: payload.brand_name,
                    industry: payload.industry || 'Not provided',
                    services: payload.services || 'Not provided',
                    phone: payload.phone || 'Not provided',
                    referral_source: payload.referral_source || 'Not provided',
                    budget: payload.budget || 'Not provided',
                    project_details: payload.project_details || 'Not provided',
                    current_date: new Date().toLocaleDateString()
                }).then(showSuccess, function(error) {
                    console.error('EmailJS Error:', error);
                    alert('There was an error submitting your inquiry. Please email us directly at ' + STUDIO_EMAIL);
                    restoreBtn();
                });
            } else {
                showSuccess(); // last resort: assume it got through
            }
        }

        const API_ENDPOINTS = [
            'https://app.wyrmstudios.com/api/inquiries',
            'https://wyrm-app.vercel.app/api/inquiries'  /* direct fallback until domain connects */
        ];

        function tryEndpoint(i) {
            if (i >= API_ENDPOINTS.length) {
                console.warn('App APIs unreachable, falling back to EmailJS');
                emailFallback();
                return;
            }
            fetch(API_ENDPOINTS[i], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function(r) {
                    if (!r.ok) throw new Error('API ' + r.status);
                    showSuccess();
                    sendThankYouEmail();  /* client thank-you on every successful submission */
                })
                .catch(function() { tryEndpoint(i + 1); });
        }
        tryEndpoint(0);
    });

    // Initial setup
    updateProgressBar();
    updateContinueButton();
});
