/* ============================================
   Custom HubSpot Form V2 — JS (2-Step Wizard)
   ============================================
   Handles:
   1. 2-step wizard navigation
   2. Industry chip selector interactions
   3. Per-step client-side validation
   4. Form submission via HubSpot API (Portal 4770265)
   5. Cookie extraction and submission
   ============================================ */
(function () {
    'use strict';

    /* ---------- Config ---------- */
    var PORTAL_ID = '4770265';
    var FORM_ID = 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0';
    var API_URL = 'https://api.hsforms.com/submissions/v3/integration/submit/' + PORTAL_ID + '/' + FORM_ID;
    var DEBUG = false; // Production mode
    var REVENUE_HERO_ROUTER_ID = '5125';

    // Known industry values — used to sanitize GTM event names and prevent
    // arbitrary user-controlled strings from being pushed to the dataLayer.
    var KNOWN_INDUSTRIES = [
        'HVAC', 'Plumbing', 'Electrical', 'Garage Doors', 'Appliance Repair', 'Locksmith',
        'Air Duct Cleaning', 'Alarm & Smart Home', 'Auto Glass', 'Automotive',
        'Carpet Cleaning', 'Chimney Sweep', 'Construction', 'Fencing', 'Flooring',
        'General Contracting', 'Handyman', 'Home Remodeling', 'Insulation', 'IT Services',
        'Janitorial Service', 'Junk Removal', 'Landscaping', 'Lawn Care',
        'Maid & Cleaning', 'Moving', 'Painting', 'Pest Control', 'Pool & Spa Services',
        'Power Generation', 'Pressure Washing', 'Restoration', 'Roofing',
        'Sliding Doors & Windows', 'Snow Removal', 'Tree Care', 'Water treatment', 'Other'
    ];

    /* ---------- Load RevenueHero Scheduler ---------- */
    (function loadRevenueHero() {
        var script = document.createElement('script');
        script.src = 'https://assets.revenuehero.io/scheduler.min.js';
        script.onload = function () {
            window.hero = new RevenueHero({ routerId: REVENUE_HERO_ROUTER_ID });
            log('RevenueHero loaded, routerId:', REVENUE_HERO_ROUTER_ID);
        };
        script.onerror = function () {
            console.warn('[HS Form V2] RevenueHero script failed to load');
        };
        document.head.appendChild(script);
    })();

    function log() {
        if (DEBUG) console.log.apply(console, ['[HS Form V2]'].concat(Array.prototype.slice.call(arguments)));
    }

    /* ---------- DOM refs (set in init) ---------- */
    var form, submitBtn, continueBtn, backBtn, successDiv, errorDiv, industryInp;
    var iti; // intl-tel-input instance
    var currentStep = 1;

    /* ---------- Step Navigation ---------- */
    function goToStep(n) {
        currentStep = n;

        // Toggle step panels
        var steps = document.querySelectorAll('.hs-step');
        steps.forEach(function (s) {
            s.classList.toggle('active', parseInt(s.getAttribute('data-step')) === n);
        });

        // Clear errors when switching steps
        clearErrors();

        log('Navigated to step', n);
    }

    /* ---------- Industry chip selector ---------- */
    function initIndustry() {
        var pills = document.querySelectorAll('.hs-industry-pill');
        var otherBtn = document.querySelector('.hs-industry-pill--other');
        var otherPanel = document.querySelector('.hs-industry-other-panel');
        var searchInp = document.querySelector('.hs-industry-search');
        var otherItems = document.querySelectorAll('.hs-industry-other-item');

        if (!otherBtn || !otherPanel) {
            return;
        }

        function isOtherOpen() {
            return otherPanel.style.display !== 'none';
        }

        function openOtherPanel() {
            otherPanel.style.display = 'block';
            otherBtn.setAttribute('aria-expanded', 'true');
            if (searchInp) {
                searchInp.value = '';
                otherItems.forEach(function (i) { i.style.display = ''; });
                setTimeout(function () { searchInp.focus(); }, 50);
            }
        }

        function closeOtherPanel() {
            otherPanel.style.display = 'none';
            otherBtn.setAttribute('aria-expanded', 'false');
        }

        function setAllPillsInactive() {
            pills.forEach(function (p) {
                p.classList.remove('active');
                p.setAttribute('aria-pressed', 'false');
            });
        }

        // Main pill click
        pills.forEach(function (pill) {
            if (pill === otherBtn) return;
            pill.addEventListener('click', function () {
                setAllPillsInactive();
                pill.classList.add('active');
                pill.setAttribute('aria-pressed', 'true');
                otherBtn.textContent = 'Other';
                closeOtherPanel();
                otherItems.forEach(function (i) { i.classList.remove('active'); });
                industryInp.value = pill.getAttribute('data-value');
            });
        });

        // "Other" toggle
        otherBtn.addEventListener('click', function () {
            if (isOtherOpen()) {
                closeOtherPanel();
            } else {
                openOtherPanel();
            }
        });

        // Other item click
        otherItems.forEach(function (item) {
            item.addEventListener('click', function () {
                var val = item.getAttribute('data-value');
                setAllPillsInactive();
                otherBtn.classList.add('active');
                otherBtn.setAttribute('aria-pressed', 'true');
                otherBtn.textContent = item.textContent.trim();
                otherItems.forEach(function (i) { i.classList.remove('active'); });
                item.classList.add('active');
                closeOtherPanel();
                industryInp.value = val;
            });
        });

        // Search filter
        if (searchInp) {
            searchInp.addEventListener('input', function () {
                var q = searchInp.value.toLowerCase();
                otherItems.forEach(function (item) {
                    item.style.display = item.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
                });
            });
        }

        // Outside-click is handled by the consolidated initOutsideClickHandler
    }

    /* ---------- International Phone Input ---------- */
    function initPhone() {
        var phoneInput = document.getElementById('hs-phone');
        if (!phoneInput) {
            return;
        }

        if (typeof window.intlTelInput === 'undefined') {
            phoneInput.classList.add('hs-input');
            return;
        }

        iti = window.intlTelInput(phoneInput, {
            initialCountry: 'auto',
            geoIpLookup: function (callback) {
                fetch('https://ipapi.co/json/')
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        var countryCode = (data && data.country) ? data.country : 'us';
                        callback(countryCode);
                    })
                    .catch(function () {
                        callback('us');
                    });
            },

            separateDialCode: true,
            formatAsYouType: true,
            autoPlaceholder: 'aggressive',
            customPlaceholder: function (selectedCountryPlaceholder) {
                return selectedCountryPlaceholder;
            },
            countrySearch: true,
            onlyCountries: ['us', 'ca'],
            useFullscreenPopup: window.innerWidth <= 767
        });
    }

    /* ---------- Validation ---------- */
    function showError(name, msg) {
        var el = document.querySelector('.hs-error[data-for="' + name + '"]');
        if (el) { el.textContent = msg; el.classList.add('visible'); }
        var inp = form.querySelector('[name="' + name + '"]');
        if (inp && inp.type !== 'hidden') {
            inp.classList.add('has-error');
            inp.setAttribute('aria-invalid', 'true');
        }
        // Also handle intl-tel-input wrapped phone input
        if (name === 'phoneNumber') {
            var telInput = form.querySelector('.iti__tel-input');
            if (telInput) {
                telInput.classList.add('has-error');
                telInput.setAttribute('aria-invalid', 'true');
            }
        }
        // Handle custom dropdown for company size
        if (name === 'companySize') {
            var companyDropdown = document.getElementById('company_size_dropdown');
            if (companyDropdown) companyDropdown.classList.add('has-error');
        }
        // Handle custom dropdown for monthly revenue
        if (name === 'monthly_volume_range') {
            var revenueDropdown = document.getElementById('monthly_volume_dropdown');
            if (revenueDropdown) revenueDropdown.classList.add('has-error');
        }
        // Handle custom dropdown for source picklist
        if (name === 'source_picklist') {
            var sourceDropdown = document.getElementById('source_picklist_dropdown');
            if (sourceDropdown) sourceDropdown.classList.add('has-error');
        }
    }

    function clearErrors() {
        document.querySelectorAll('.hs-error').forEach(function (el) {
            el.textContent = '';
            el.classList.remove('visible');
        });
        document.querySelectorAll('.has-error').forEach(function (el) {
            el.classList.remove('has-error');
        });
        document.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
            el.removeAttribute('aria-invalid');
        });
        if (errorDiv) errorDiv.style.display = 'none';
    }

    /* --- Step 1 validation: personal info --- */
    function validateStep1(skipClear) {
        if (!skipClear) clearErrors();
        var valid = true;

        var fields = [
            { name: 'ownerFirstName', label: 'First Name' },
            { name: 'ownerLastName', label: 'Last Name' },
            { name: 'emailAddress', label: 'Email' },
            { name: 'phoneNumber', label: 'Phone Number' },
            { name: 'businessName', label: 'Company Name' }
        ];

        fields.forEach(function (f) {
            var inp = form.querySelector('[name="' + f.name + '"]');
            if (inp && !inp.value.trim()) {
                showError(f.name, f.label + ' is required.');
                valid = false;
            }
        });

        // Email format
        var emailInp = form.querySelector('[name="emailAddress"]');
        if (emailInp && emailInp.value.trim()) {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInp.value.trim())) {
                showError('emailAddress', 'Please enter a valid email address.');
                valid = false;
            }
        }

        // Phone validation via intl-tel-input
        var phoneInp = form.querySelector('[name="phoneNumber"]');
        if (phoneInp && phoneInp.value.trim()) {
            if (iti) {
                if (!iti.isValidNumber()) {
                    showError('phoneNumber', 'Please enter a valid phone number.');
                    valid = false;
                }
            } else {
                // Fallback: basic digit-count check when intl-tel-input is unavailable
                var digits = phoneInp.value.replace(/\D/g, '');
                if (digits.length < 7 || digits.length > 15) {
                    showError('phoneNumber', 'Please enter a valid phone number.');
                    valid = false;
                }
            }
        }

        return valid;
    }

    /* --- Step 2 validation: business info --- */
    function validateStep2(skipClear) {
        if (!skipClear) clearErrors();
        var valid = true;

        // Industry validation (required field)
        if (!industryInp || !industryInp.value || !industryInp.value.trim()) {
            showError('industry', 'Please select an industry.');
            valid = false;
        }

        // Company Size validation (required field)
        var compSize = document.getElementById('hs-company-size');
        if (!compSize || !compSize.value || !compSize.value.trim()) {
            showError('companySize', 'Please select a company size.');
            valid = false;
        }

        // Monthly Volume Range validation
        var monthlyVol = document.getElementById('hs-monthly-volume');
        if (!monthlyVol || !monthlyVol.value || !monthlyVol.value.trim()) {
            showError('monthly_volume_range', 'Please select an estimated monthly revenue.');
            valid = false;
        }

        // Source Picklist validation (required by HS API)
        var sourcePick = document.getElementById('hs-source-picklist');
        if (!sourcePick || !sourcePick.value || !sourcePick.value.trim()) {
            showError('source_picklist', 'Please select how you heard about us.');
            valid = false;
        }

        // preferred_demo_contact_method is intentionally optional — no validation needed

        return valid;
    }

    /* ---------- Cookie helper ---------- */
    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : '';
    }

    /* ---------- Submit to HubSpot ---------- */
    function submitForm(e) {
        e.preventDefault();

        // On mobile (≤767px), all steps are shown at once (CSS forces .hs-step { display:flex })
        // and the Continue/Back buttons are hidden. Match the exact CSS breakpoint.
        var isOneStep = window.matchMedia('(max-width: 767px)').matches;

        if (isOneStep) {
            clearErrors();
            var s1Valid = validateStep1(true);
            var s2Valid = validateStep2(true);
            if (!s1Valid || !s2Valid) {
                // Scroll to the first error so the user sees it
                var firstError = form.querySelector('.has-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
        } else {
            if (!validateStep2()) return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';

        // Note: both 'industry' and 'industry_select' are submitted — the HS form definition
        // requires both field names to be populated for pipeline routing to work correctly.
        var fields = [
            { name: 'firstname', value: form.querySelector('[name="ownerFirstName"]').value.trim() },
            { name: 'lastname', value: form.querySelector('[name="ownerLastName"]').value.trim() },
            { name: 'email', value: form.querySelector('[name="emailAddress"]').value.trim() },
            { name: 'phone', value: iti ? iti.getNumber() : form.querySelector('[name="phoneNumber"]').value.trim() },
            { name: 'company', value: form.querySelector('[name="businessName"]').value.trim() },
            { name: 'company_size_range', value: form.querySelector('[name="companySize"]').value },
            { name: 'monthly_volume_range', value: form.querySelector('[name="monthly_volume_range"]').value },
            { name: 'source_picklist', value: form.querySelector('[name="source_picklist"]').value },
            { name: 'preferred_demo_contact_method', value: form.querySelector('[name="preferred_demo_contact_method"]').value },
            { name: 'industry_select', value: (industryInp && industryInp.value) ? industryInp.value : '' },
            { name: 'industry', value: (industryInp && industryInp.value) ? industryInp.value : '' },
            // Required hidden fields (based on form definition)
            { name: 'plumbing_dealership', value: 'none' },
            { name: 'hvac_dealership', value: 'none' },
            { name: 'hs_lead_status', value: 'New' },
            { name: 'lead_type', value: 'DEMO' }
        ];

        // Cookies to capture
        var cookieMap = [
            { cookie: 'utm_device', field: 'utm_device' },
            { cookie: '_ga', field: 'GAID' },
            { cookie: 'entry', field: 'entry' },
            { cookie: 'fbclid', field: 'fbclid' },
            { cookie: 'friend_referrer_user_id', field: 'friend_referrer_user_id' },
            { cookie: 'utm_source', field: 'utm_source' },
            { cookie: 'utm_medium', field: 'utm_medium' }
        ];

        cookieMap.forEach(function (c) {
            var val = getCookie(c.cookie);
            if (val) {
                fields.push({ name: c.field, value: val });
            }
        });

        var payload = {
            fields: fields,
            context: {
                pageUri: window.location.href,
                pageName: document.title
            }
        };

        // Legal Consent (GDPR)
        var consentCheckbox = document.getElementById('hs-consent');
        if (consentCheckbox && consentCheckbox.checked) {
            payload.legalConsentOptions = {
                consent: {
                    consentToProcess: true,
                    text: "By submitting this form, you consent to receive communications from Workiz via phone, SMS, and email. Msg & data rates may apply. Msg frequency may vary. Reply STOP to unsubscribe."
                }
            };
        }

        // Add HubSpot tracking cookie if available
        var hutk = getCookie('hubspotutk');
        if (hutk) {
            payload.context.hutk = hutk;
        }

        // Capture all form data BEFORE hiding the form (prevents DOM read issues on hidden elements)
        var rhData = {
            email: form.querySelector('[name="emailAddress"]').value.trim(),
            firstname: form.querySelector('[name="ownerFirstName"]').value.trim(),
            lastname: form.querySelector('[name="ownerLastName"]').value.trim(),
            phone: iti ? iti.getNumber() : form.querySelector('[name="phoneNumber"]').value.trim(),
            company: form.querySelector('[name="businessName"]').value.trim(),
            company_size_range: form.querySelector('[name="companySize"]').value,
            industry: (industryInp && industryInp.value) ? industryInp.value : '',
            monthly_volume_range: form.querySelector('[name="monthly_volume_range"]').value,
            source_picklist: form.querySelector('[name="source_picklist"]').value,
            preferred_demo_contact_method: form.querySelector('[name="preferred_demo_contact_method"]').value,
            lead_type: 'DEMO',
            plumbing_dealership: 'none',
            hvac_dealership: 'none',
            hs_lead_status: 'New'
        };

        // Capture industry value for dataLayer before form is hidden.
        // Only push known industry values as GTM event names to prevent arbitrary
        // user-controlled strings from being injected into the dataLayer.
        var selectedIndustryValue = (industryInp && industryInp.value) ? industryInp.value : '';
        var isKnownIndustry = KNOWN_INDUSTRIES.indexOf(selectedIndustryValue) !== -1;

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                return res.text().then(function (text) {
                    if (res.ok) {
                        // Success — hide form
                        form.style.display = 'none';
                        errorDiv.style.display = 'none';

                        var formTitle = document.querySelector('.c-st1-form-title');
                        if (formTitle) formTitle.style.display = 'none';

                        // Fire dataLayer event for GTM
                        if (window.dataLayer) {
                            window.dataLayer.push({
                                event: 'book_demo_form_submit',
                                formId: FORM_ID,
                                portalId: PORTAL_ID
                            });

                            // Secondary industry-specific event (only for known values)
                            if (isKnownIndustry) {
                                window.dataLayer.push({
                                    event: selectedIndustryValue,
                                    formId: FORM_ID,
                                    portalId: PORTAL_ID
                                });
                            }
                        }

                        // Always show thank you message as base state
                        successDiv.style.display = 'block';

                        // Trigger RevenueHero scheduler overlay on top (two-step pattern per spec)
                        if (window.hero) {
                            window.hero.submit(rhData).then(function (sessionData) {
                                if (sessionData) {
                                    window.hero.dialog.open(sessionData); // Opens the calendar overlay
                                    log('RevenueHero scheduler opened');
                                }
                            }).catch(function (rhErr) {
                                console.error('[HS Form V2] RevenueHero error:', rhErr);
                            });
                        }
                    } else {
                        console.error('[HS Form V2] HubSpot API Error:', res.status, text);
                        throw new Error('HTTP ' + res.status);
                    }
                });
            })
            .catch(function (err) {
                console.error('[HS Form V2] Catch Block Error:', err);
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Book a demo now';
            });
    }

    /* ==========================================================================
       Generic Dropdown Logic
       ========================================================================== */
    function setupGenericDropdown(dropdownId, selectId) {
        var dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        var toggle = dropdown.querySelector('.hs-dropdown-toggle');
        var list = dropdown.querySelector('.hs-dropdown-list');
        var hiddenSelect = document.getElementById(selectId);
        var toggleText = toggle.querySelector('span');

        if (!toggle || !list || !hiddenSelect) return;

        function openDropdown() {
            closeAllDropdowns(dropdown);
            dropdown.classList.add('open');
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
        }

        function closeDropdown() {
            dropdown.classList.remove('open');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }

        // Toggle dropdown
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            if (dropdown.classList.contains('open')) {
                closeDropdown();
            } else {
                openDropdown();
                // Focus the selected item or first item for keyboard users
                var focused = list.querySelector('.hs-dropdown-item.selected') || list.querySelector('.hs-dropdown-item');
                setTimeout(function () { if (focused) focused.focus(); }, 0);
            }
        });

        // Keyboard support on the toggle button
        toggle.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                openDropdown();
                var items = list.querySelectorAll('.hs-dropdown-item');
                if (items.length) {
                    setTimeout(function () {
                        (e.key === 'ArrowDown' ? items[0] : items[items.length - 1]).focus();
                    }, 0);
                }
            }
        });

        // Keyboard support on list items
        list.addEventListener('keydown', function (e) {
            var items = Array.prototype.slice.call(list.querySelectorAll('.hs-dropdown-item'));
            var idx = items.indexOf(document.activeElement);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (idx < items.length - 1) items[idx + 1].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (idx > 0) {
                    items[idx - 1].focus();
                } else {
                    closeDropdown();
                    toggle.focus();
                }
            } else if (e.key === 'Escape') {
                closeDropdown();
                toggle.focus();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                var active = document.activeElement;
                if (active && active.classList.contains('hs-dropdown-item')) {
                    active.click();
                }
            }
        });

        // Select item
        list.addEventListener('click', function (e) {
            var item = e.target.closest('.hs-dropdown-item');
            if (!item) return;

            var value = item.getAttribute('data-value');
            var label = item.textContent;

            // Update hidden select
            hiddenSelect.value = value;
            var changeEvent = new Event('change', { bubbles: true });
            hiddenSelect.dispatchEvent(changeEvent);

            // Update toggle text
            if (toggleText) toggleText.textContent = label;
            toggle.classList.remove('placeholder');

            // Update UI state
            var items = dropdown.querySelectorAll('.hs-dropdown-item');
            items.forEach(function (i) { i.classList.remove('selected'); });
            item.classList.add('selected');

            // Close dropdown and return focus to toggle
            closeDropdown();
            toggle.focus();
        });
    }

    function closeAllDropdowns(exceptDropdown) {
        var dropdowns = document.querySelectorAll('.hs-dropdown');
        dropdowns.forEach(function (d) {
            if (d !== exceptDropdown) {
                d.classList.remove('open');
                var t = d.querySelector('.hs-dropdown-toggle');
                if (t) {
                    t.classList.remove('active');
                    t.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    /* ---------- Consolidated outside-click handler ---------- */
    // A single document listener covers all dropdowns and the industry "Other" panel,
    // replacing the per-dropdown listeners that would otherwise accumulate on document.
    function initOutsideClickHandler() {
        document.addEventListener('click', function (e) {
            // Close generic dropdowns
            var dropdowns = document.querySelectorAll('.hs-dropdown');
            dropdowns.forEach(function (d) {
                if (!d.contains(e.target)) {
                    d.classList.remove('open');
                    var t = d.querySelector('.hs-dropdown-toggle');
                    if (t) {
                        t.classList.remove('active');
                        t.setAttribute('aria-expanded', 'false');
                    }
                }
            });

            // Close industry "Other" panel
            var otherPanel = document.querySelector('.hs-industry-other-panel');
            var otherBtn = document.querySelector('.hs-industry-pill--other');
            if (otherPanel && otherPanel.style.display !== 'none') {
                if (!otherPanel.contains(e.target) && e.target !== otherBtn) {
                    otherPanel.style.display = 'none';
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    /* ---------- Init ---------- */
    function init() {
        try {
            // Grab DOM refs AFTER DOM is ready
            form = document.getElementById('hs-custom-form');
            submitBtn = document.getElementById('hs-submit-btn');
            continueBtn = document.getElementById('hs-continue-btn');
            backBtn = document.getElementById('hs-back-btn');
            successDiv = document.getElementById('hs-form-success');
            errorDiv = document.getElementById('hs-form-error');
            industryInp = document.getElementById('hs-industry');

            if (!form) {
                return;
            }

            // Step navigation
            if (continueBtn) {
                continueBtn.addEventListener('click', function () {
                    if (validateStep1()) {
                        goToStep(2);
                    }
                });
            }

            if (backBtn) {
                backBtn.addEventListener('click', function () {
                    goToStep(1);
                });
            }

            // Setup Company Size Dropdown
            setupGenericDropdown('company_size_dropdown', 'hs-company-size');

            // Setup Estimated Monthly Revenue Dropdown
            setupGenericDropdown('monthly_volume_dropdown', 'hs-monthly-volume');

            // Setup How did you hear about us? Dropdown
            setupGenericDropdown('source_picklist_dropdown', 'hs-source-picklist');

            // Setup Preferred Demo Contact Method Dropdown
            setupGenericDropdown('preferred_contact_dropdown', 'hs-preferred-contact');

            initIndustry();
            initPhone();
            initOutsideClickHandler();

            form.addEventListener('submit', submitForm);

            // Clear field errors on input
            form.querySelectorAll('.hs-input, .hs-select').forEach(function (inp) {
                var eventType = inp.nodeName === 'SELECT' ? 'change' : 'input';
                inp.addEventListener(eventType, function () {
                    inp.classList.remove('has-error');
                    inp.removeAttribute('aria-invalid');
                    var name = inp.getAttribute('name');
                    if (name === 'phoneNumber') {
                        var telInput = form.querySelector('.iti__tel-input');
                        if (telInput) {
                            telInput.classList.remove('has-error');
                            telInput.removeAttribute('aria-invalid');
                        }
                    }
                    if (name === 'companySize') {
                        var companyDropdown = document.getElementById('company_size_dropdown');
                        if (companyDropdown) companyDropdown.classList.remove('has-error');
                    }
                    if (name === 'monthly_volume_range') {
                        var revenueDropdown = document.getElementById('monthly_volume_dropdown');
                        if (revenueDropdown) revenueDropdown.classList.remove('has-error');
                    }
                    if (name === 'source_picklist') {
                        var sourceDropdown = document.getElementById('source_picklist_dropdown');
                        if (sourceDropdown) sourceDropdown.classList.remove('has-error');
                    }
                    var err = document.querySelector('.hs-error[data-for="' + name + '"]');
                    if (err) { err.textContent = ''; err.classList.remove('visible'); }
                });
            });

            // Start on step 1
            goToStep(1);

        } catch (error) {
            console.error('[HS Form V2] CRITICAL INITIALIZATION ERROR:', error);
            console.error('Stack trace:', error.stack);

            // Try to show user-friendly error
            var formContainer = document.getElementById('custom-hs-form');
            if (formContainer) {
                formContainer.innerHTML = '<div style="color: #d32f2f; padding: 20px; border: 2px solid #d32f2f; border-radius: 8px; background: #ffebee; font-family: sans-serif;">' +
                    '<h3 style="margin-top: 0;">⚠️ Form Initialization Error</h3>' +
                    '<p>The form failed to load properly. Please try refreshing the page.</p>' +
                    '<p style="font-size: 12px; color: #666;">Error: ' + error.message + '</p>' +
                    '</div>';
            }
        }
    }

    /* ---------- Scroll Lock when popup is open ---------- */
    function initScrollLock() {
        var popup = document.querySelector('.section_bokademo-popup');
        if (!popup) return;

        function lockIfVisible() {
            var computed = window.getComputedStyle(popup);
            var isVisible = computed.display !== 'none' && computed.visibility !== 'hidden' && computed.opacity !== '0';
            document.body.style.overflow = isVisible ? 'hidden' : '';
            document.documentElement.style.overflow = isVisible ? 'hidden' : '';
        }

        var observer = new MutationObserver(lockIfVisible);
        observer.observe(popup, { attributes: true, childList: true, subtree: true });

        // Also observe parent in case Webflow toggles a wrapper
        if (popup.parentElement) {
            observer.observe(popup.parentElement, { attributes: true, attributeFilter: ['style', 'class'] });
        }

        // Initial check
        lockIfVisible();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { init(); initScrollLock(); });
    } else {
        init();
        initScrollLock();
    }
})();
