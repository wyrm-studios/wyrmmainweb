/* =========================================
   JS FORM ENGINE - 11-Step Inquiry Form Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Select DOM Elements ---
    const formSteps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.form-progress-bar');
    const continueBtn = document.getElementById('form-continue-btn');
    const prevBtn = document.getElementById('form-prev-btn'); // Up arrow
    const nextBtn = document.getElementById('form-next-btn'); // Down arrow
    const formEngineContainer = document.querySelector('.form-engine-card');
    
    // --- 2. State Variables ---
    let currentStep = 1;
    const totalSteps = 11;
    const formData = {};

    // --- 3. Helper Functions ---

    // Update the UI based on the current step
    function updateFormUI() {
        // Hide all steps and show the current one
        formSteps.forEach(function(step, index) {
            if (index + 1 === currentStep) {
                step.classList.add('active');
                step.style.display = 'block';
            } else {
                step.classList.remove('active');
                step.style.display = 'none';
            }
        });

        // Update progress bar width
        if (progressBar) {
            const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
            progressBar.style.width = progressPercentage + '%';
        }

        // Update step number text (e.g., "PROTOCOL STEP 1/11")
        const stepIndicator = document.querySelector('.protocol-step-indicator');
        if (stepIndicator) {
            stepIndicator.textContent = 'PROTOCOL STEP ' + currentStep + '/' + totalSteps;
        }

        // Update Continue button text for the last step
        if (continueBtn) {
            if (currentStep === totalSteps) {
                continueBtn.innerHTML = 'Submit <span class="btn-icon-arrow">→</span>';
            } else {
                continueBtn.innerHTML = 'Continue <span class="btn-icon-arrow">→</span>';
            }
        }

        // Validate current step to set initial button state
        validateCurrentStep();
    }

    // Validate the current step's inputs
    function validateCurrentStep() {
        let isValid = false;
        const currentStepElement = document.querySelector('.form-step.active');
        
        if (!currentStepElement) return false;

        // Step 1: Brand Name (Text input required)
        if (currentStep === 1) {
            const input = currentStepElement.querySelector('input[type="text"]');
            isValid = input && input.value.trim().length > 0;
        }
        // Step 2: Industry (Single select required)
        else if (currentStep === 2) {
            const selected = currentStepElement.querySelectorAll('.form-selector.selected');
            isValid = selected.length > 0;
        }
        // Step 3: Services (Multi-select, at least one required)
        else if (currentStep === 3) {
            const selected = currentStepElement.querySelectorAll('.form-selector.selected');
            isValid = selected.length > 0;
        }
        // Step 4: Project Debut (Date required)
        else if (currentStep === 4) {
            const input = currentStepElement.querySelector('input[type="date"]');
            isValid = input && input.value !== '';
        }
        // Step 5: Business Problems (Multi-select, at least one required)
        else if (currentStep === 5) {
            const selected = currentStepElement.querySelectorAll('.form-selector.selected');
            isValid = selected.length > 0;
        }
        // Step 6: How did you hear (Single select required)
        else if (currentStep === 6) {
            const selected = currentStepElement.querySelectorAll('.form-selector.selected');
            isValid = selected.length > 0;
        }
        // Step 7: Contact Info (First name, last name, email required)
        else if (currentStep === 7) {
            const firstName = currentStepElement.querySelector('input[name="first_name"]');
            const lastName = currentStepElement.querySelector('input[name="last_name"]');
            const email = currentStepElement.querySelector('input[name="email"]');
            
            isValid = firstName && firstName.value.trim().length > 0 &&
                      lastName && lastName.value.trim().length > 0 &&
                      email && email.value.trim().length > 0 &&
                      email.value.includes('@');
        }
        // Step 8: Specific prompt (Textarea required)
        else if (currentStep === 8) {
            const textarea = currentStepElement.querySelector('textarea');
            isValid = textarea && textarea.value.trim().length > 0;
        }
        // Step 9: Estimated Budget (Single select required)
        else if (currentStep === 9) {
            const selected = currentStepElement.querySelectorAll('.form-selector.selected');
            isValid = selected.length > 0;
        }
        // Step 10: Project Timeline (Single select required)
        else if (currentStep === 10) {
            const selected = currentStepElement.querySelectorAll('.form-selector.selected');
            isValid = selected.length > 0;
        }
        // Step 11: Anything else (Textarea optional, so always valid to proceed)
        else if (currentStep === 11) {
            isValid = true;
        }

        // Update Continue button state
        if (continueBtn) {
            if (isValid) {
                continueBtn.classList.remove('btn-disabled');
                continueBtn.disabled = false;
            } else {
                continueBtn.classList.add('btn-disabled');
                continueBtn.disabled = true;
            }
        }

        return isValid;
    }

    // Trigger shake animation on the Continue button
    function triggerShake() {
        if (continueBtn) {
            continueBtn.classList.add('btn-shake-error');
            setTimeout(function() {
                continueBtn.classList.remove('btn-shake-error');
            }, 400);
        }
    }

    // --- 4. Event Listeners for Form Inputs ---

    // Listen for input changes to dynamically enable the Continue button
    document.addEventListener('input', function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            validateCurrentStep();
        }
    });

    // Handle Form Selectors (The A, B, C, D options)
    const allSelectors = document.querySelectorAll('.form-selector');
    
    allSelectors.forEach(function(selector) {
        selector.addEventListener('click', function() {
            const parentStep = this.closest('.form-step');
            const isMultiSelect = parentStep && parentStep.getAttribute('data-multi-select') === 'true';

            if (isMultiSelect) {
                // Toggle selection for multi-select steps (Steps 3, 5)
                this.classList.toggle('selected');
            } else {
                // Single select behavior for other steps (Steps 2, 6, 9, 10)
                const siblings = parentStep.querySelectorAll('.form-selector');
                siblings.forEach(function(sibling) {
                    sibling.classList.remove('selected');
                });
                this.classList.add('selected');
            }

            // Re-validate after selection change
            validateCurrentStep();
        });
    });

    // --- 5. Navigation Button Listeners ---

    // Continue / Next Step Button
    if (continueBtn) {
        continueBtn.addEventListener('click', function(event) {
            event.preventDefault();
            
            if (validateCurrentStep()) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateFormUI();
                    // Scroll to top of form container smoothly
                    if (formEngineContainer) {
                        formEngineContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                    // Final submission logic would go here
                    console.log('Form Submitted:', formData);
                    alert('Thank you! Your inquiry has been submitted.');
                }
            } else {
                triggerShake();
            }
        });
    }

    // Up Arrow (Previous Step)
    if (prevBtn) {
        prevBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if (currentStep > 1) {
                currentStep--;
                updateFormUI();
            }
        });
    }

    // Down Arrow (Next Step)
    if (nextBtn) {
        nextBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if (validateCurrentStep()) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateFormUI();
                }
            } else {
                triggerShake();
            }
        });
    }

    // --- 6. Initialize Form on Load ---
    updateFormUI();

});
