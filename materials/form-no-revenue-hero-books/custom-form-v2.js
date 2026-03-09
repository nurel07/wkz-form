/* ============================================
   Custom HubSpot Form V2 — JS
   ============================================
   Handles:
   1. Industry chip selector interactions
   2. Client-side validation for V2 fields
   3. Form submission via HubSpot API (Portal 4770265)
   4. Cookie extraction and submission
   5. GTM dataLayer events on success

   Note: Revenue Hero scheduler integration was
   removed on 2026-02-26. The form now submits
   directly to HubSpot and shows a thank-you
   message without launching a scheduling overlay.
   ============================================ */
(function () {
    'use strict';

    /* ---------- Config ---------- */
    var PORTAL_ID = '4770265';
    var FORM_ID = 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0';
    var API_URL = 'https://api.hsforms.com/submissions/v3/integration/submit/' + PORTAL_ID + '/' + FORM_ID;
    var DEBUG = false; // Production mode

    function log() {
        if (DEBUG) console.log.apply(console, ['[HS Form V2]'].concat(Array.prototype.slice.call(arguments)));
    }

    /* ---------- DOM refs (set in init) ---------- */
    var form, submitBtn, successDiv, errorDiv, industryInp;
    var iti; // intl-tel-input instance

    /* ---------- Industry chip selector ---------- */
    function initIndustry() {
        var pills = document.querySelectorAll('.hs-industry-pill');
        var otherBtn = document.querySelector('.hs-industry-pill--other');
        var otherPanel = document.querySelector('.hs-industry-other-panel');
        var searchInp = document.querySelector('.hs-industry-search');
        var otherItems = document.querySelectorAll('.hs-industry-other-item');
        var otherOpen = false;

        if (!otherBtn || !otherPanel) {
            return;
        }

        // Main pill click
        pills.forEach(function (pill) {
            if (pill === otherBtn) return;
            pill.addEventListener('click', function () {
                pills.forEach(function (p) { p.classList.remove('active'); });
                pill.classList.add('active');
                otherBtn.textContent = 'Other';
                otherOpen = false;
                otherPanel.style.display = 'none';
                otherItems.forEach(function (i) { i.classList.remove('active'); });
                industryInp.value = pill.getAttribute('data-value');
            });
        });

        // "Other" toggle
        otherBtn.addEventListener('click', function () {
            otherOpen = !otherOpen;
            otherPanel.style.display = otherOpen ? 'block' : 'none';
            if (otherOpen && searchInp) {
                searchInp.value = '';
                otherItems.forEach(function (i) { i.style.display = ''; });
                setTimeout(function () { searchInp.focus(); }, 50);
            }
        });

        // Other item click
        otherItems.forEach(function (item) {
            item.addEventListener('click', function () {
                var val = item.getAttribute('data-value');
                pills.forEach(function (p) { p.classList.remove('active'); });
                otherBtn.classList.add('active');
                otherBtn.textContent = item.textContent.trim();
                otherItems.forEach(function (i) { i.classList.remove('active'); });
                item.classList.add('active');
                otherOpen = false;
                otherPanel.style.display = 'none';
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

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (otherOpen && otherPanel && !otherPanel.contains(e.target) && e.target !== otherBtn) {
                otherOpen = false;
                otherPanel.style.display = 'none';
            }
        });
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
            preferredCountries: ['us', 'ca', 'gb', 'au'],
            separateDialCode: true,
            formatAsYouType: true,
            autoPlaceholder: 'aggressive',
            customPlaceholder: function (selectedCountryPlaceholder) {
                return selectedCountryPlaceholder;
            },
            countrySearch: true
        });
    }

    /* ---------- Validation ---------- */
    function showError(name, msg) {
        var el = document.querySelector('.hs-error[data-for="' + name + '"]');
        if (el) { el.textContent = msg; el.classList.add('visible'); }
        var inp = form.querySelector('[name="' + name + '"]');
        if (inp) inp.classList.add('has-error');
        // Also handle intl-tel-input wrapped phone input
        if (name === 'phoneNumber') {
            var telInput = form.querySelector('.iti__tel-input');
            if (telInput) telInput.classList.add('has-error');
        }
        // Handle Company Size custom dropdown
        if (name === 'companySize') {
            var dropdown = document.getElementById('company_size_dropdown');
            if (dropdown) dropdown.classList.add('has-error');
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
        if (errorDiv) errorDiv.style.display = 'none';
    }

    function validate() {
        clearErrors();
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
        if (phoneInp && phoneInp.value.trim() && iti) {
            if (!iti.isValidNumber()) {
                showError('phoneNumber', 'Please enter a valid phone number.');
                valid = false;
            }
        }

        // Industry validation (required field)
        if (!industryInp || !industryInp.value || !industryInp.value.trim()) {
            showError('industry', 'Please select an industry.');
            valid = false;
        }

        // Company Size validation
        var compSize = document.getElementById('hs-company-size');
        if (!compSize || !compSize.value || !compSize.value.trim()) {
            showError('companySize', 'Please select a company size.');
            valid = false;
        }

        // Source Picklist validation
        var sourcePicklist = document.getElementById('hs-source-picklist');
        if (!sourcePicklist || !sourcePicklist.value || !sourcePicklist.value.trim()) {
            showError('source_picklist', 'Please tell us how you heard about us.');
            valid = false;
        }

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
        if (!validate()) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';

        // Base fields

        var fields = [
            { name: 'firstname', value: form.querySelector('[name="ownerFirstName"]').value.trim() },
            { name: 'lastname', value: form.querySelector('[name="ownerLastName"]').value.trim() },
            { name: 'email', value: form.querySelector('[name="emailAddress"]').value.trim() },
            { name: 'phone', value: iti ? iti.getNumber() : form.querySelector('[name="phoneNumber"]').value.trim() },
            { name: 'company', value: form.querySelector('[name="businessName"]').value.trim() },
            { name: 'company_size_range', value: form.querySelector('[name="companySize"]').value },
            { name: 'industry_select', value: (industryInp && industryInp.value) ? industryInp.value : '' },
            { name: 'industry', value: (industryInp && industryInp.value) ? industryInp.value : '' },
            // Required hidden fields (based on form definition)
            { name: 'plumbing_dealership', value: 'none' },
            { name: 'hvac_dealership', value: 'none' },
            { name: 'source_picklist', value: form.querySelector('[name="source_picklist"]') ? form.querySelector('[name="source_picklist"]').value : 'Online Search' },
            { name: 'hs_lead_status', value: 'New' },
            { name: 'lead_type', value: 'DEMO' }
        ];

        // Cookies to capture
        var cookieMap = [
            { cookie: 'utm_device', field: 'utm_device' }, // Check actual field name in HS
            { cookie: '_ga', field: 'GAID' }, // Mapping _ga cookie to GAID field
            { cookie: 'entry', field: 'entry' },
            { cookie: 'fbclid', field: 'fbclid' }, // Often HS handles this automatically if 'Collected forms' is on, but explicit doesn't hurt
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

        // Add HubSpot tracking cookie if available (Essential for associating page views)
        var hutk = getCookie('hubspotutk');
        if (hutk) {
            payload.context.hutk = hutk;
        }

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                return res.text().then(function (text) {
                    if (res.ok) {
                        // Hide the form and show success
                        form.style.display = 'none';
                        errorDiv.style.display = 'none';

                        // Fire dataLayer event for GTM
                        if (window.dataLayer) {
                            window.dataLayer.push({
                                event: 'book_demo_form_submit',
                                formId: FORM_ID,
                                portalId: PORTAL_ID
                            });
                            // Secondary industry-specific event
                            var industryVal = (industryInp && industryInp.value) ? industryInp.value : '';
                            if (industryVal) {
                                window.dataLayer.push({
                                    event: industryVal,
                                    formId: FORM_ID,
                                    portalId: PORTAL_ID
                                });
                            }
                        }

                        // Show thank you message and scroll into view
                        successDiv.style.display = 'block';
                        successDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        console.error('HubSpot API Error:', text);
                        throw new Error('HTTP ' + res.status);
                    }
                });
            })
            .catch(function (err) {
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Get My Free Copy';
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

        // Toggle dropdown
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            closeAllDropdowns(dropdown); // Close others
            dropdown.classList.toggle('open');
            toggle.classList.toggle('active');
        });

        // Select item
        list.addEventListener('click', function (e) {
            var item = e.target.closest('.hs-dropdown-item');
            if (!item) return;

            var value = item.getAttribute('data-value');
            var label = item.textContent;

            // Update hidden select
            hiddenSelect.value = value;
            var event = new Event('change', { bubbles: true });
            hiddenSelect.dispatchEvent(event);

            // Update toggle text
            if (toggleText) toggleText.textContent = label;
            toggle.classList.remove('placeholder');

            // Update UI state
            var items = dropdown.querySelectorAll('.hs-dropdown-item');
            items.forEach(function (i) { i.classList.remove('selected'); });
            item.classList.add('selected');

            // Close dropdown
            dropdown.classList.remove('open');
            toggle.classList.remove('active');
        });

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
                toggle.classList.remove('active');
            }
        });
    }

    function closeAllDropdowns(exceptDropdown) {
        var dropdowns = document.querySelectorAll('.hs-dropdown');
        dropdowns.forEach(function (d) {
            if (d !== exceptDropdown) {
                d.classList.remove('open');
                var t = d.querySelector('.hs-dropdown-toggle');
                if (t) t.classList.remove('active');
            }
        });
    }

    /* ---------- Init ---------- */
    function init() {
        try {
            // Grab DOM refs AFTER DOM is ready
            form = document.getElementById('hs-custom-form');
            submitBtn = document.getElementById('hs-submit-btn');
            successDiv = document.getElementById('hs-form-success');
            errorDiv = document.getElementById('hs-form-error');
            industryInp = document.getElementById('hs-industry');

            if (!form) {
                return;
            }

            // Setup Company Size Dropdown
            setupGenericDropdown('company_size_dropdown', 'hs-company-size');

            // Setup new custom dropdowns
            setupGenericDropdown('source_picklist_dropdown', 'hs-source-picklist');

            initIndustry();
            initPhone();

            form.addEventListener('submit', submitForm);

            // Clear field errors on input/change
            form.querySelectorAll('.hs-input, .hs-select').forEach(function (inp) {
                var clearErrorFn = function () {
                    inp.classList.remove('has-error');
                    var name = inp.getAttribute('name');
                    if (name === 'phoneNumber') {
                        var telInput = form.querySelector('.iti__tel-input');
                        if (telInput) telInput.classList.remove('has-error');
                    }
                    if (name === 'companySize') {
                        var dropdown = document.getElementById('company_size_dropdown');
                        if (dropdown) dropdown.classList.remove('has-error');
                    }
                    if (name === 'source_picklist') {
                        var dropdown = document.getElementById('source_picklist_dropdown');
                        if (dropdown) dropdown.classList.remove('has-error');
                    }
                    var err = document.querySelector('.hs-error[data-for="' + name + '"]');
                    if (err) { err.textContent = ''; err.classList.remove('visible'); }
                };
                inp.addEventListener('input', clearErrorFn);
                inp.addEventListener('change', clearErrorFn);
            });

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
