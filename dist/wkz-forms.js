/* ============================================
   WkzForms — Config-Driven Form Runtime
   ============================================
   Single IIFE. No build step. No modules.
   Exposes window.WkzForms with .register() API.

   Usage:
     WkzForms.register('my-form', { ... config ... });
     <div data-wkz-form="my-form"></div>
   ============================================ */
(function () {
    'use strict';

    /* ==========================================================================
       Registry & State
       ========================================================================== */
    var registry = {};   // id -> config
    var instances = {};  // id -> { root, form, iti, currentStep, ... }

    /* ==========================================================================
       Constants
       ========================================================================== */
    var COOKIE_MAP = [
        { cookie: 'utm_device', field: 'utm_device' },
        { cookie: '_ga', field: 'GAID' },
        { cookie: 'entry', field: 'entry' },
        { cookie: 'fbclid', field: 'fbclid' },
        { cookie: 'friend_referrer_user_id', field: 'friend_referrer_user_id' },
        { cookie: 'utm_source', field: 'utm_source' },
        { cookie: 'utm_medium', field: 'utm_medium' }
    ];

    var KNOWN_INDUSTRIES = [
        'HVAC', 'Plumbing', 'Electrical', 'Garage Door', 'Garage Doors',
        'Appliance Repair', 'Locksmith',
        'Air Duct Cleaning', 'Alarm & Smart Home', 'Auto Glass', 'Automotive',
        'Carpet Cleaning', 'Chimney Sweep', 'Construction', 'Fencing', 'Flooring',
        'General Contracting', 'Handyman', 'Home Remodeling', 'Insulation', 'IT Services',
        'Janitorial Service', 'Junk Removal', 'Landscaping', 'Lawn Care',
        'Maid & Cleaning', 'Moving', 'Painting', 'Pest Control', 'Pool & Spa Services',
        'Power Generation', 'Pressure Washing', 'Restoration', 'Roofing',
        'Sliding Doors & Windows', 'Snow Removal', 'Tree Care', 'Water treatment', 'Other'
    ];

    var DEFAULT_INDUSTRY_CHIPS = [
        { value: 'HVAC', label: 'HVAC' },
        { value: 'Plumbing', label: 'Plumbing' },
        { value: 'Electrical', label: 'Electrical' },
        { value: 'Garage Door', label: 'Garage Door' },
        { value: 'Appliance Repair', label: 'Appliance Repair' },
        { value: 'Locksmith', label: 'Locksmith' }
    ];

    var DEFAULT_INDUSTRY_OTHER = [
        'Air Duct Cleaning', 'Alarm & Smart Home', 'Auto Glass', 'Automotive',
        'Carpet Cleaning', 'Chimney Sweep', 'Construction', 'Fencing', 'Flooring',
        'General Contracting', 'Handyman', 'Home Remodeling', 'Insulation', 'IT Services',
        'Janitorial Service', 'Junk Removal', 'Landscaping', 'Lawn Care',
        'Maid & Cleaning', 'Moving', 'Painting', 'Pest Control', 'Pool & Spa Services',
        'Power Generation', 'Pressure Washing', 'Restoration', 'Roofing',
        'Sliding Doors & Windows', 'Snow Removal', 'Tree Care', 'Water treatment', 'Other'
    ];

    var DEFAULT_COMPANY_SIZES = [
        { value: '1', label: 'Only me' },
        { value: '2', label: '2 techs' },
        { value: '3_5', label: '3 - 5 techs' },
        { value: '6_10', label: '6 - 10 techs' },
        { value: '11+', label: '11 - 20 techs' },
        { value: '21 - 30 techs', label: '21 - 30 techs' },
        { value: '31 techs or more', label: '31 techs or more' }
    ];

    var DEFAULT_SOURCES = [
        'TikTok', 'Chat GPT/ AI tools', 'Apple App Store/ Google Play',
        'Linkedin', 'Podcast', 'Online Search', 'Instagram', 'Reddit/Quora',
        'Facebook', 'YouTube', 'Twitter', 'TV', 'Other', 'From a friend',
        'Google/Bing', 'Friend/referral', 'My distributor', 'Google', 'Wizz'
    ];

    var DEFAULT_REVENUE_OPTIONS = [
        { value: "It's a new business", label: "It's a new business" },
        { value: '$0 - $10,000', label: '$0 - $10,000' },
        { value: '$10,000 - $50,000', label: '$10,000 - $50,000' },
        { value: '$50,000 - $100,000', label: '$50,000 - $100,000' },
        { value: '$100,000 - $250,000', label: '$100,000 - $250,000' },
        { value: 'More than $250,000', label: 'More than $250,000' },
        { value: 'Rather not say', label: 'Rather not say' }
    ];

    var DEFAULT_CONTACT_METHODS = [
        { value: 'Book a video meeting', label: 'Book a video meeting' },
        { value: 'Get a phone call', label: 'Get a phone call' }
    ];

    /* ==========================================================================
       Utilities
       ========================================================================== */
    function esc(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : '';
    }

    function uid(formId, name) {
        return 'wkz-' + formId + '-' + name;
    }

    /* ==========================================================================
       Dropdown Arrow SVG (reusable)
       ========================================================================== */
    var ARROW_SVG = '<svg class="hs-dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var BACK_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 3.5L5 7L8.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    /* ==========================================================================
       Default Options Resolver
       ========================================================================== */

    function getDefaultOptions(fieldName) {
        switch (fieldName) {
            case 'companySize':
                return DEFAULT_COMPANY_SIZES;
            case 'source_picklist':
                return DEFAULT_SOURCES.map(function (s) { return { value: s, label: s }; });
            case 'monthly_volume_range':
                return DEFAULT_REVENUE_OPTIONS;
            case 'preferred_demo_contact_method':
                return DEFAULT_CONTACT_METHODS;
            default:
                return [];
        }
    }

    /* ==========================================================================
       Field Renderers
       ========================================================================== */

    function renderTextField(field, formId) {
        var id = uid(formId, field.name);
        var type = field.inputType || 'text';
        var inputmode = field.inputMode || '';
        var autocomplete = field.autocomplete || '';
        var inputmodeAttr = inputmode ? ' inputmode="' + inputmode + '"' : '';
        var autocompleteAttr = autocomplete ? ' autocomplete="' + autocomplete + '"' : '';
        var requiredAttr = field.required ? ' required' : '';

        return '<div class="hs-field">' +
            '<label class="hs-label" for="' + id + '"><span>' + esc(field.label) + '</span></label>' +
            '<input class="hs-input" type="' + type + '" id="' + id + '" name="' + field.name + '"' +
            inputmodeAttr + autocompleteAttr + requiredAttr +
            ' aria-describedby="err-' + id + '" />' +
            '<div class="hs-error" id="err-' + id + '" data-for="' + field.name + '" aria-live="polite"></div>' +
            '</div>';
    }

    function renderDropdownField(field, formId) {
        var id = uid(formId, field.name);
        var ddId = id + '-dropdown';
        var selectId = id + '-select';
        var toggleId = id + '-toggle';
        var placeholder = field.placeholder || 'Select one\u2026';
        var options = field.options || getDefaultOptions(field.name);

        var optionsHtml = '';
        var selectOptionsHtml = '<option value="">' + esc(placeholder) + '</option>';

        for (var i = 0; i < options.length; i++) {
            var opt = typeof options[i] === 'string' ? { value: options[i], label: options[i] } : options[i];
            optionsHtml += '<li class="hs-dropdown-item" role="option" tabindex="-1" data-value="' + esc(opt.value) + '">' + esc(opt.label) + '</li>';
            selectOptionsHtml += '<option value="' + esc(opt.value) + '">' + esc(opt.label) + '</option>';
        }

        return '<div class="hs-field">' +
            '<label class="hs-label" for="' + toggleId + '"><span>' + esc(field.label) + '</span></label>' +
            '<div class="hs-dropdown" id="' + ddId + '">' +
            '<button type="button" class="hs-dropdown-toggle placeholder" id="' + toggleId + '" aria-haspopup="listbox" aria-expanded="false" aria-describedby="err-' + id + '">' +
            '<span>' + esc(placeholder) + '</span>' + ARROW_SVG +
            '</button>' +
            '<div class="hs-dropdown-panel">' +
            '<ul class="hs-dropdown-list" role="listbox">' + optionsHtml + '</ul>' +
            '</div>' +
            '</div>' +
            '<select class="hs-select" id="' + selectId + '" name="' + field.name + '" style="display:none;">' + selectOptionsHtml + '</select>' +
            '<div class="hs-error" id="err-' + id + '" data-for="' + field.name + '" aria-live="polite"></div>' +
            '</div>';
    }

    function renderIndustryField(field, formId) {
        var id = uid(formId, 'industry');
        var chips = field.chips || DEFAULT_INDUSTRY_CHIPS;
        var otherItems = field.otherItems || DEFAULT_INDUSTRY_OTHER;

        var chipsHtml = '';
        for (var i = 0; i < chips.length; i++) {
            chipsHtml += '<button type="button" class="hs-industry-pill" data-value="' + esc(chips[i].value) + '" aria-pressed="false">' + esc(chips[i].label) + '</button>';
        }
        chipsHtml += '<button type="button" class="hs-industry-pill hs-industry-pill--other" aria-pressed="false" aria-expanded="false">Other</button>';

        var otherHtml = '';
        for (var j = 0; j < otherItems.length; j++) {
            var val = typeof otherItems[j] === 'string' ? otherItems[j] : otherItems[j].value;
            var label = typeof otherItems[j] === 'string' ? otherItems[j] : otherItems[j].label;
            otherHtml += '<li class="hs-industry-other-item" role="option" tabindex="-1" data-value="' + esc(val) + '">' + esc(label) + '</li>';
        }

        return '<div class="hs-field">' +
            '<label class="hs-label"><span>' + esc(field.label || 'Industry') + '</span></label>' +
            '<input type="hidden" id="' + id + '" name="industry" value="" />' +
            '<div class="hs-industry-pills">' + chipsHtml + '</div>' +
            '<div class="hs-industry-other-panel" style="display:none;">' +
            '<input type="text" class="hs-industry-search" placeholder="Search industries\u2026" />' +
            '<ul class="hs-industry-other-list" role="listbox">' + otherHtml + '</ul>' +
            '</div>' +
            '<div class="hs-error" id="err-' + id + '" data-for="industry" aria-live="polite"></div>' +
            '</div>';
    }

    function renderConsentField(formId) {
        var id = uid(formId, 'consent');
        return '<div class="hs-field hs-consent-field">' +
            '<label class="hs-consent-label">' +
            '<input type="checkbox" id="' + id + '" name="consent" checked />' +
            '<span class="hs-consent-checkmark"></span>' +
            '<span class="hs-consent-text">By submitting this form, you consent to receive communications from Workiz via phone, SMS, and email. Msg &amp; data rates may apply. Msg frequency may vary. Reply STOP to unsubscribe. See our <a href="https://www.workiz.com/privacy-policy/" target="_blank" rel="noopener">Privacy Policy</a> &amp; <a href="https://www.workiz.com/terms-and-conditions/" target="_blank" rel="noopener">Terms &amp; Conditions</a>.</span>' +
            '</label>' +
            '</div>';
    }

    /* ==========================================================================
       Render Form HTML
       ========================================================================== */

    function renderFieldHtml(field, formId) {
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
                return renderTextField(field, formId);
            case 'dropdown':
                return renderDropdownField(field, formId);
            case 'industryChips':
                return renderIndustryField(field, formId);
            case 'consent':
                return renderConsentField(formId);
            default:
                return '';
        }
    }

    function buildFormHtml(formId, config) {
        var fields = config.fields || [];
        var steps = config.steps || 1;

        var formInner = '';

        if (steps === 2) {
            // Split fields by step
            var step1Fields = [];
            var step2Fields = [];
            for (var i = 0; i < fields.length; i++) {
                if (fields[i].type === 'consent') continue; // consent goes in step 2
                if (fields[i].step === 2) {
                    step2Fields.push(fields[i]);
                } else {
                    step1Fields.push(fields[i]);
                }
            }

            // Step 1
            formInner += '<div class="hs-step active" data-step="1">';
            for (var s1 = 0; s1 < step1Fields.length; s1++) {
                formInner += renderFieldHtml(step1Fields[s1], formId);
            }
            formInner += '<div class="hs-submit-row">' +
                '<button type="button" class="hs-submit hs-continue-btn" id="' + uid(formId, 'continue') + '">Continue</button>' +
                '</div>';
            formInner += '</div>';

            // Step 2
            formInner += '<div class="hs-step" data-step="2">';
            for (var s2 = 0; s2 < step2Fields.length; s2++) {
                formInner += renderFieldHtml(step2Fields[s2], formId);
            }
            formInner += renderConsentField(formId);
            formInner += '<div class="hs-step-footer">' +
                '<button type="button" class="hs-back-btn" id="' + uid(formId, 'back') + '">' + BACK_SVG + ' Back</button>' +
                '<button type="submit" class="hs-submit" id="' + uid(formId, 'submit') + '">' + esc(config.submitText || 'Submit') + '</button>' +
                '</div>';
            formInner += '</div>';

        } else {
            // Single step
            for (var f = 0; f < fields.length; f++) {
                if (fields[f].type === 'consent') continue;
                formInner += renderFieldHtml(fields[f], formId);
            }
            formInner += renderConsentField(formId);
            formInner += '<div class="hs-submit-row">' +
                '<button type="submit" class="hs-submit" id="' + uid(formId, 'submit') + '">' + esc(config.submitText || 'Submit') + '</button>' +
                '</div>';
        }

        var successCtaHtml = '';
        if (config.successCta) {
            successCtaHtml = '<a href="' + esc(config.successCta.url) + '" target="_blank" rel="noopener" class="hs-success-cta">' + esc(config.successCta.text) + '</a>';
        }

        var html = '<div class="wkz-form" data-wkz-theme="' + (config.theme || 'light') + '">' +
            '<form id="' + uid(formId, 'form') + '" class="wkz-form-inner" novalidate>' +
            formInner +
            '</form>' +
            '<div id="' + uid(formId, 'success') + '" class="hs-form-success">' +
            '<div class="hs-success-icon">\u2713</div>' +
            '<h3 class="hs-success-title">' + esc(config.successTitle || 'Thank you!') + '</h3>' +
            '<p class="hs-success-text">' + esc(config.successText || '') + '</p>' +
            successCtaHtml +
            '</div>' +
            '<div id="' + uid(formId, 'error') + '" class="hs-form-error">Something went wrong. Please try again.</div>' +
            '</div>';

        return html;
    }

    /* ==========================================================================
       Content Panel Builder (optional right-side marketing panel in modals)
       ========================================================================== */

    function buildContentPanelHtml(config) {
        if (!config || !config.contentPanel) return '';
        var cp = config.contentPanel;

        var logoHtml = '';
        if (cp.logo) {
            if (cp.logo.indexOf('<svg') === 0) {
                logoHtml = '<div class="wkz-cp-logo">' + cp.logo + '</div>';
            } else {
                logoHtml = '<div class="wkz-cp-logo"><img src="' + cp.logo + '" alt="Logo" /></div>';
            }
        }

        var headingHtml = cp.heading ? '<h2 class="wkz-cp-heading">' + cp.heading + '</h2>' : '';
        var subtitleHtml = cp.subtitle ? '<p class="wkz-cp-subtitle">' + cp.subtitle + '</p>' : '';

        var bulletsHtml = '';
        if (cp.bullets && cp.bullets.length) {
            var checkSvg = '<img class="wkz-cp-check" src="https://cdn.prod.website-files.com/626f8f4af1df65572fcaeb58/69af2ca70f05855d389a3954_checkmark.svg" alt="" width="20" height="20" />';
            bulletsHtml = '<ul class="wkz-cp-bullets">';
            for (var i = 0; i < cp.bullets.length; i++) {
                bulletsHtml += '<li class="wkz-cp-bullet">' + checkSvg + '<span>' + cp.bullets[i] + '</span></li>';
            }
            bulletsHtml += '</ul>';
        }

        var badgesHtml = cp.badgesImage ? '<img class="wkz-cp-badges" src="' + cp.badgesImage + '" alt="Trust badges" />' : '';

        return '<div class="wkz-content-panel">' +
            logoHtml + headingHtml + subtitleHtml + bulletsHtml + badgesHtml +
            '</div>';
    }

    /* ==========================================================================
       Modal Wrapper
       ========================================================================== */

    function wrapInModal(formId, innerHtml) {
        var config = registry[formId];
        var hasPanel = config.contentPanel ? ' has-content-panel' : '';
        var contentPanelHtml = buildContentPanelHtml(config);
        var overlayStyle = config.overlayBg
            ? ' style="background:url(\'' + config.overlayBg + '\') center/cover no-repeat;"'
            : '';

        return '<div class="wkz-overlay" id="' + uid(formId, 'overlay') + '"' + overlayStyle + '>' +
            '<div class="wkz-overlay-panel' + hasPanel + '" data-wkz-theme="' + (config.theme || 'light') + '">' +
            '<button class="wkz-overlay-close" aria-label="Close"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.351562 1.51172C0 1.19531 0 0.632812 0.351562 0.316406C0.667969 0 1.19531 0 1.51172 0.316406L6.82031 5.625L12.1289 0.316406C12.4805 0 13.0078 0 13.3242 0.316406C13.6758 0.667969 13.6758 1.19531 13.3242 1.51172L8.01562 6.82031L13.3242 12.1289C13.6758 12.4453 13.6758 13.0078 13.3242 13.3242C13.0078 13.6406 12.4805 13.6406 12.1289 13.3242L6.82031 8.01562L1.51172 13.3242C1.19531 13.6406 0.667969 13.6406 0.351562 13.3242C0 13.0078 0 12.4453 0.351562 12.1289L5.66016 6.82031L0.351562 1.51172Z" fill="currentColor"/></svg></button>' +
            '<div class="wkz-overlay-body">' + innerHtml + '</div>' +
            contentPanelHtml +
            '</div>' +
            '</div>';
    }

    function showEbookSuccess(successDiv, inst) {
        if (!successDiv) return;

        // Update title with book name
        if (inst.ebookName) {
            var titleEl = successDiv.querySelector('.hs-success-title');
            if (titleEl) titleEl.textContent = 'Your copy of ' + inst.ebookName + ' is ready!';
        }

        // Update text
        var textEl = successDiv.querySelector('.hs-success-text');
        if (textEl) textEl.textContent = inst.ebookUrl
            ? 'Click the button below to download your free copy.'
            : 'Your free copy is on its way. Check your email.';

        // Add/replace download button
        if (inst.ebookUrl) {
            var existingCta = successDiv.querySelector('.hs-success-cta');
            if (existingCta) existingCta.remove();
            var dlLink = document.createElement('a');
            dlLink.href = inst.ebookUrl;
            dlLink.target = '_blank';
            dlLink.rel = 'noopener';
            dlLink.className = 'hs-success-cta';
            dlLink.textContent = 'Download your ebook';
            successDiv.appendChild(dlLink);
        }
    }

    function resetFormState(formId) {
        var inst = instances[formId];
        var config = registry[formId];
        if (!inst) return;

        var successDiv = inst.successDiv;
        if (successDiv && successDiv.classList.contains('visible')) {
            successDiv.classList.remove('visible');
            // Remove dynamically injected download CTA
            var dlCta = successDiv.querySelector('.hs-success-cta');
            if (dlCta) dlCta.remove();
        }

        if (inst.form) {
            inst.form.style.display = '';
            inst.form.reset();
        }

        if (inst.submitBtn) {
            inst.submitBtn.disabled = false;
            inst.submitBtn.textContent = config.submitText || 'Submit';
        }

        // Reset dropdowns to placeholder
        var dropdowns = inst.root.querySelectorAll('.hs-dropdown-toggle span');
        dropdowns.forEach(function (span) {
            var fieldRow = span.closest('.hs-field-row');
            if (!fieldRow) return;
            var select = fieldRow.querySelector('select');
            if (select) {
                select.value = '';
                var placeholder = select.querySelector('option[value=""]');
                if (placeholder) span.textContent = placeholder.textContent;
            }
        });

        // Reset to step 1 if multi-step
        if ((config.steps || 1) > 1 && inst.currentStep !== 1) {
            inst.currentStep = 1;
            var step1 = inst.root.querySelector('.wkz-step-1');
            var step2 = inst.root.querySelector('.wkz-step-2');
            if (step1) step1.style.display = '';
            if (step2) step2.style.display = 'none';
        }

        // Clear errors
        clearAllErrors(inst.root);

        inst.ebookUrl = null;
        inst.ebookName = null;
    }

    function openPopup(formId) {
        var overlay = document.getElementById(uid(formId, 'overlay'));
        if (!overlay) return;

        var inst = instances[formId];
        if (inst && inst.closeTimer) {
            clearTimeout(inst.closeTimer);
            inst.closeTimer = null;
        }

        // Reset form to initial state if it was previously submitted
        resetFormState(formId);

        overlay.style.display = 'flex';
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                overlay.classList.add('is-open');
            });
        });

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    function closePopup(formId) {
        var overlay = document.getElementById(uid(formId, 'overlay'));
        if (!overlay || !overlay.classList.contains('is-open')) return;

        overlay.classList.remove('is-open');

        var inst = instances[formId];
        inst.closeTimer = setTimeout(function () {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }, 250);
    }

    /* ==========================================================================
       Dropdown Initialization
       ========================================================================== */

    function initDropdown(dropdownEl, selectEl, root) {
        if (!dropdownEl || !selectEl) return;

        var toggle = dropdownEl.querySelector('.hs-dropdown-toggle');
        var list = dropdownEl.querySelector('.hs-dropdown-list');
        var toggleText = toggle ? toggle.querySelector('span') : null;

        if (!toggle || !list) return;

        function open() {
            closeAllDropdownsIn(root, dropdownEl);
            dropdownEl.classList.add('open');
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
        }

        function close() {
            dropdownEl.classList.remove('open');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            if (dropdownEl.classList.contains('open')) {
                close();
            } else {
                open();
                var focused = list.querySelector('.hs-dropdown-item.selected') || list.querySelector('.hs-dropdown-item');
                setTimeout(function () { if (focused) focused.focus(); }, 0);
            }
        });

        // Keyboard support on toggle
        toggle.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                open();
                var items = list.querySelectorAll('.hs-dropdown-item');
                if (items.length) {
                    setTimeout(function () {
                        (e.key === 'ArrowDown' ? items[0] : items[items.length - 1]).focus();
                    }, 0);
                }
            }
        });

        // Keyboard support on items
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
                    close();
                    toggle.focus();
                }
            } else if (e.key === 'Escape') {
                close();
                toggle.focus();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (document.activeElement && document.activeElement.classList.contains('hs-dropdown-item')) {
                    document.activeElement.click();
                }
            }
        });

        // Select item
        list.addEventListener('click', function (e) {
            var item = e.target.closest('.hs-dropdown-item');
            if (!item) return;

            var value = item.getAttribute('data-value');
            var label = item.textContent;

            selectEl.value = value;
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));

            if (toggleText) toggleText.textContent = label;
            toggle.classList.remove('placeholder');

            var items = dropdownEl.querySelectorAll('.hs-dropdown-item');
            items.forEach(function (i) { i.classList.remove('selected'); });
            item.classList.add('selected');

            close();
            toggle.focus();
        });
    }

    function closeAllDropdownsIn(root, except) {
        var dropdowns = root.querySelectorAll('.hs-dropdown');
        dropdowns.forEach(function (d) {
            if (d !== except) {
                d.classList.remove('open');
                var t = d.querySelector('.hs-dropdown-toggle');
                if (t) {
                    t.classList.remove('active');
                    t.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    /* ==========================================================================
       Industry Chips Initialization
       ========================================================================== */

    function initIndustryChips(root, formId) {
        var inst = instances[formId];
        var industryInp = root.querySelector('input[name="industry"]');
        if (!industryInp) return;
        inst.industryInp = industryInp;

        var pills = root.querySelectorAll('.hs-industry-pill');
        var otherBtn = root.querySelector('.hs-industry-pill--other');
        var otherPanel = root.querySelector('.hs-industry-other-panel');
        var searchInp = root.querySelector('.hs-industry-search');
        var otherItems = root.querySelectorAll('.hs-industry-other-item');

        if (!otherBtn || !otherPanel) return;

        function setAllInactive() {
            pills.forEach(function (p) {
                p.classList.remove('active');
                p.setAttribute('aria-pressed', 'false');
            });
        }

        function closeOther() {
            otherPanel.style.display = 'none';
            otherBtn.setAttribute('aria-expanded', 'false');
        }

        function openOther() {
            otherPanel.style.display = 'block';
            otherBtn.setAttribute('aria-expanded', 'true');
            if (searchInp) {
                searchInp.value = '';
                otherItems.forEach(function (i) { i.style.display = ''; });
                setTimeout(function () { searchInp.focus(); }, 50);
            }
        }

        pills.forEach(function (pill) {
            if (pill === otherBtn) return;
            pill.addEventListener('click', function () {
                setAllInactive();
                pill.classList.add('active');
                pill.setAttribute('aria-pressed', 'true');
                otherBtn.textContent = 'Other';
                closeOther();
                otherItems.forEach(function (i) { i.classList.remove('active'); });
                industryInp.value = pill.getAttribute('data-value');
                // Clear error
                clearFieldError(root, 'industry');
            });
        });

        otherBtn.addEventListener('click', function () {
            if (otherPanel.style.display !== 'none') {
                closeOther();
            } else {
                openOther();
            }
        });

        otherItems.forEach(function (item) {
            item.addEventListener('click', function () {
                setAllInactive();
                otherBtn.classList.add('active');
                otherBtn.setAttribute('aria-pressed', 'true');
                otherBtn.textContent = item.textContent.trim();
                otherItems.forEach(function (i) { i.classList.remove('active'); });
                item.classList.add('active');
                closeOther();
                industryInp.value = item.getAttribute('data-value');
                clearFieldError(root, 'industry');
            });
        });

        if (searchInp) {
            searchInp.addEventListener('input', function () {
                var q = searchInp.value.toLowerCase();
                otherItems.forEach(function (item) {
                    item.style.display = item.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
                });
            });
        }

        // Outside click is handled by the global handler
    }

    /* ==========================================================================
       Phone Input Initialization
       ========================================================================== */

    function initPhoneInput(root, formId) {
        var phoneInput = root.querySelector('input[type="tel"]');
        if (!phoneInput) return;

        if (typeof window.intlTelInput === 'undefined') {
            phoneInput.classList.add('hs-input');
            return;
        }

        var config = registry[formId];
        var phoneConfig = (config && config.phoneOptions) || {};

        var itiInstance = window.intlTelInput(phoneInput, {
            initialCountry: 'us',
            separateDialCode: true,
            formatAsYouType: true,
            autoPlaceholder: 'aggressive',
            customPlaceholder: function (selectedCountryPlaceholder) {
                return selectedCountryPlaceholder;
            },
            countrySearch: true,
            onlyCountries: phoneConfig.onlyCountries || ['us', 'ca'],
            useFullscreenPopup: window.innerWidth <= 767
        });

        instances[formId].iti = itiInstance;
    }

    /* ==========================================================================
       Validation
       ========================================================================== */

    function showError(root, name, msg) {
        var el = root.querySelector('.hs-error[data-for="' + name + '"]');
        if (el) { el.textContent = msg; el.classList.add('visible'); }

        var inp = root.querySelector('[name="' + name + '"]');
        if (inp && inp.type !== 'hidden') {
            inp.classList.add('has-error');
            inp.setAttribute('aria-invalid', 'true');
        }

        // Phone input (intl-tel-input wrapper)
        if (name === 'phoneNumber') {
            var telInput = root.querySelector('.iti__tel-input');
            if (telInput) {
                telInput.classList.add('has-error');
                telInput.setAttribute('aria-invalid', 'true');
            }
        }

        // Custom dropdown error state
        var dropdown = root.querySelector('.hs-dropdown[id$="-' + name + '-dropdown"]');
        if (!dropdown) {
            // Try finding by field name mapping
            var selectEl = root.querySelector('select[name="' + name + '"]');
            if (selectEl) {
                dropdown = selectEl.previousElementSibling;
                while (dropdown && !dropdown.classList.contains('hs-dropdown')) {
                    dropdown = dropdown.previousElementSibling;
                }
            }
        }
        if (dropdown && dropdown.classList.contains('hs-dropdown')) {
            dropdown.classList.add('has-error');
        }
    }

    function clearFieldError(root, name) {
        var el = root.querySelector('.hs-error[data-for="' + name + '"]');
        if (el) { el.textContent = ''; el.classList.remove('visible'); }

        var inp = root.querySelector('[name="' + name + '"]');
        if (inp) {
            inp.classList.remove('has-error');
            inp.removeAttribute('aria-invalid');
        }

        if (name === 'phoneNumber') {
            var telInput = root.querySelector('.iti__tel-input');
            if (telInput) {
                telInput.classList.remove('has-error');
                telInput.removeAttribute('aria-invalid');
            }
        }

        // Dropdown
        root.querySelectorAll('.hs-dropdown.has-error').forEach(function (d) {
            var sel = d.nextElementSibling;
            while (sel && sel.tagName !== 'SELECT') sel = sel.nextElementSibling;
            if (sel && sel.name === name) d.classList.remove('has-error');
        });
    }

    function clearAllErrors(root) {
        root.querySelectorAll('.hs-error').forEach(function (el) {
            el.textContent = '';
            el.classList.remove('visible');
        });
        root.querySelectorAll('.has-error').forEach(function (el) {
            el.classList.remove('has-error');
        });
        root.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
            el.removeAttribute('aria-invalid');
        });
        var errDiv = root.querySelector('.hs-form-error');
        if (errDiv) errDiv.style.display = 'none';
    }

    function validateFields(fields, root, formId) {
        var valid = true;
        var inst = instances[formId];

        for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            if (f.type === 'consent') continue;

            if (f.type === 'text' || f.type === 'email' || f.type === 'tel') {
                var inp = root.querySelector('[name="' + f.name + '"]');
                if (f.required && inp && !inp.value.trim()) {
                    showError(root, f.name, f.label + ' is required.');
                    valid = false;
                    continue;
                }
                // Email format
                if (f.type === 'email' && inp && inp.value.trim()) {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) {
                        showError(root, f.name, 'Please enter a valid email address.');
                        valid = false;
                    }
                }
                // Phone validation
                if (f.type === 'tel' && inp && inp.value.trim() && inst.iti) {
                    if (!inst.iti.isValidNumber()) {
                        showError(root, f.name, 'Please enter a valid phone number.');
                        valid = false;
                    }
                }
            } else if (f.type === 'industryChips') {
                var indInp = inst.industryInp;
                if (f.required && (!indInp || !indInp.value || !indInp.value.trim())) {
                    showError(root, 'industry', 'Please select an industry.');
                    valid = false;
                }
            } else if (f.type === 'dropdown') {
                var selId = uid(formId, f.name) + '-select';
                var sel = document.getElementById(selId);
                if (f.required && (!sel || !sel.value || !sel.value.trim())) {
                    showError(root, f.name, f.errorMessage || ('Please select ' + f.label.toLowerCase() + '.'));
                    valid = false;
                }
            }
        }

        return valid;
    }

    /* ==========================================================================
       Submission
       ========================================================================== */

    function submitForm(formId, e) {
        e.preventDefault();

        var config = registry[formId];
        var inst = instances[formId];
        var root = inst.root;
        var formEl = inst.form;
        var submitBtn = inst.submitBtn;

        var fields = config.fields || [];
        var steps = config.steps || 1;

        // Validation
        clearAllErrors(root);

        if (steps === 2) {
            var isMobile = window.matchMedia('(max-width: 767px)').matches;
            var isModal = config.mode === 'modal';

            if (isMobile && isModal) {
                // All steps visible — validate everything
                var allValid = validateFields(fields, root, formId);
                if (!allValid) {
                    var firstErr = formEl.querySelector('.has-error');
                    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            } else {
                // Only validate step 2 (step 1 was validated on Continue)
                var step2Fields = fields.filter(function (f) { return f.step === 2; });
                if (!validateFields(step2Fields, root, formId)) return;
            }
        } else {
            if (!validateFields(fields, root, formId)) return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting\u2026';

        // Extract field values
        var hsFields = [];

        for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            if (f.type === 'consent') continue;

            if (f.type === 'text' || f.type === 'email') {
                var inp = root.querySelector('[name="' + f.name + '"]');
                var val = inp ? inp.value.trim() : '';
                if (f.hsFields) {
                    // Multiple HubSpot mappings
                    for (var m = 0; m < f.hsFields.length; m++) {
                        hsFields.push({ name: f.hsFields[m], value: val });
                    }
                } else {
                    hsFields.push({ name: f.hsField || f.name, value: val });
                }
            } else if (f.type === 'tel') {
                var phoneVal = inst.iti ? inst.iti.getNumber() : (root.querySelector('[name="' + f.name + '"]') || {}).value || '';
                hsFields.push({ name: f.hsField || 'phone', value: phoneVal.trim() });
            } else if (f.type === 'industryChips') {
                var indVal = inst.industryInp ? inst.industryInp.value : '';
                hsFields.push({ name: 'industry_select', value: indVal });
                hsFields.push({ name: 'industry', value: indVal });
            } else if (f.type === 'dropdown') {
                var selId = uid(formId, f.name) + '-select';
                var sel = document.getElementById(selId);
                var dVal = sel ? sel.value : '';
                hsFields.push({ name: f.hsField || f.name, value: dVal });
            }
        }

        // Hidden fields
        var hidden = config.hiddenFields || {};
        for (var key in hidden) {
            if (hidden.hasOwnProperty(key)) {
                hsFields.push({ name: key, value: hidden[key] });
            }
        }

        // Dynamic ebook_name from trigger button
        if (inst.ebookName) {
            hsFields.push({ name: 'ebook_name', value: inst.ebookName });
        }

        // Cookies
        COOKIE_MAP.forEach(function (c) {
            var cv = getCookie(c.cookie);
            if (cv) hsFields.push({ name: c.field, value: cv });
        });

        // Build payload
        var hs = config.hubspot || {};
        var portalId = hs.portalId || '4770265';
        var hsFormId = hs.formId || 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0';
        var apiUrl = 'https://api.hsforms.com/submissions/v3/integration/submit/' + portalId + '/' + hsFormId;

        var payload = {
            fields: hsFields,
            context: {
                pageUri: window.location.href,
                pageName: document.title
            }
        };

        // Consent
        var consentCb = root.querySelector('input[name="consent"]');
        if (consentCb && consentCb.checked) {
            payload.legalConsentOptions = {
                consent: {
                    consentToProcess: true,
                    text: "By submitting this form, you consent to receive communications from Workiz via phone, SMS, and email. Msg & data rates may apply. Msg frequency may vary. Reply STOP to unsubscribe."
                }
            };
        }

        // HubSpot tracking cookie
        var hutk = getCookie('hubspotutk');
        if (hutk) payload.context.hutk = hutk;

        // Capture data for RevenueHero before hiding form
        var rhData = {};
        hsFields.forEach(function (f) { rhData[f.name] = f.value; });

        // Capture industry for GTM before form hides
        var selectedIndustry = inst.industryInp ? inst.industryInp.value : '';
        var isKnownIndustry = KNOWN_INDUSTRIES.indexOf(selectedIndustry) !== -1;

        var successDiv = inst.successDiv;
        var errorDiv = inst.errorDiv;

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                return res.text().then(function (text) {
                    if (res.ok) {
                        formEl.style.display = 'none';
                        if (errorDiv) errorDiv.style.display = 'none';

                        // GTM events
                        if (window.dataLayer) {
                            window.dataLayer.push({
                                event: config.gtmEvent || 'book_demo_form_submit',
                                formId: hsFormId,
                                portalId: portalId
                            });
                            if (isKnownIndustry && selectedIndustry) {
                                window.dataLayer.push({
                                    event: selectedIndustry,
                                    formId: hsFormId,
                                    portalId: portalId
                                });
                            }
                        }

                        // Dynamic ebook success message and download button
                        showEbookSuccess(successDiv, inst);

                        // Save form data for session reuse
                        if (config.reuseSession) {
                            try {
                                // Filter out ebook_name — it changes per book
                                var reusableFields = hsFields.filter(function (f) { return f.name !== 'ebook_name'; });
                                sessionStorage.setItem('wkzEbookData', JSON.stringify(reusableFields));
                            } catch (e) { /* sessionStorage unavailable */ }
                        }

                        successDiv.classList.add('visible');

                        // RevenueHero
                        if (config.postSubmit === 'revenueHero' && inst.hero) {
                            inst.hero.submit(rhData).then(function (sessionData) {
                                if (sessionData) {
                                    inst.hero.dialog.open(sessionData);
                                }
                            }).catch(function (err) {
                                console.error('[WkzForms] RevenueHero error:', err);
                            });
                        }
                    } else {
                        console.error('[WkzForms] HubSpot API Error:', res.status, text);
                        throw new Error('HTTP ' + res.status);
                    }
                });
            })
            .catch(function (err) {
                console.error('[WkzForms] Submission error:', err);
                if (errorDiv) errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = config.submitText || 'Submit';
            });
    }

    /* ==========================================================================
       Initialize Form Instance
       ========================================================================== */

    function initFormInstance(formId, config, containerEl) {
        var root = containerEl;
        var formEl = root.querySelector('form');
        if (!formEl) return;

        var inst = {
            root: root,
            form: formEl,
            submitBtn: root.querySelector('.hs-submit[type="submit"]'),
            continueBtn: root.querySelector('.hs-continue-btn'),
            backBtn: root.querySelector('.hs-back-btn'),
            successDiv: root.querySelector('.hs-form-success'),
            errorDiv: root.querySelector('.hs-form-error'),
            industryInp: null,
            iti: null,
            hero: null,
            currentStep: 1,
            closeTimer: null
        };

        instances[formId] = inst;

        // Init dropdown fields
        var fields = config.fields || [];
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].type === 'dropdown') {
                var ddId = uid(formId, fields[i].name) + '-dropdown';
                var selId = uid(formId, fields[i].name) + '-select';
                initDropdown(
                    document.getElementById(ddId),
                    document.getElementById(selId),
                    root
                );
            }
        }

        // Init industry chips
        var hasIndustry = fields.some(function (f) { return f.type === 'industryChips'; });
        if (hasIndustry) {
            initIndustryChips(root, formId);
        }

        // Init phone
        var hasTel = fields.some(function (f) { return f.type === 'tel'; });
        if (hasTel) {
            initPhoneInput(root, formId);
        }

        // Step navigation
        if (config.steps === 2) {
            if (inst.continueBtn) {
                inst.continueBtn.addEventListener('click', function () {
                    clearAllErrors(root);
                    var step1Fields = fields.filter(function (f) { return f.step !== 2 && f.type !== 'consent'; });
                    if (validateFields(step1Fields, root, formId)) {
                        goToStep(formId, 2);
                    }
                });
            }
            if (inst.backBtn) {
                inst.backBtn.addEventListener('click', function () {
                    goToStep(formId, 1);
                });
            }
        }

        // Form submit
        formEl.addEventListener('submit', function (e) {
            submitForm(formId, e);
        });

        // Clear errors on input
        root.querySelectorAll('.hs-input, .hs-select, .iti__tel-input').forEach(function (inp) {
            var eventType = inp.nodeName === 'SELECT' ? 'change' : 'input';
            inp.addEventListener(eventType, function () {
                var name = inp.getAttribute('name');
                if (name) clearFieldError(root, name);
                // Also handle phone wrapper
                if (inp.classList.contains('iti__tel-input')) {
                    clearFieldError(root, 'phoneNumber');
                }
            });
        });

        // Hidden selects fire change events from dropdown logic — clear errors on change
        root.querySelectorAll('select.hs-select').forEach(function (sel) {
            sel.addEventListener('change', function () {
                var name = sel.getAttribute('name');
                if (name) clearFieldError(root, name);
            });
        });

        // Load RevenueHero if needed
        if (config.revenueHeroRouter) {
            var rhScript = document.createElement('script');
            rhScript.src = 'https://assets.revenuehero.io/scheduler.min.js';
            rhScript.onload = function () {
                if (typeof RevenueHero !== 'undefined') {
                    inst.hero = new RevenueHero({ routerId: config.revenueHeroRouter });
                }
            };
            document.head.appendChild(rhScript);
        }

        // Modal mode: triggers, close, ESC
        if (config.mode === 'modal') {
            var trigger = config.trigger;
            if (trigger) {
                document.querySelectorAll(trigger).forEach(function (el) {
                    el.addEventListener('click', function (e) {
                        e.preventDefault();
                        // Capture dynamic data attributes from trigger button
                        var ebookName = e.currentTarget.getAttribute('data-ebook-name');
                        var ebookUrl = e.currentTarget.getAttribute('data-ebook-url');

                        // Fast-path: skip form if session data exists
                        if (config.reuseSession) {
                            try {
                                var saved = sessionStorage.getItem('wkzEbookData');
                                if (saved) {
                                    var savedFields = JSON.parse(saved);
                                    if (ebookName) savedFields.push({ name: 'ebook_name', value: ebookName });
                                    COOKIE_MAP.forEach(function (c) {
                                        var cv = getCookie(c.cookie);
                                        if (cv) savedFields.push({ name: c.field, value: cv });
                                    });
                                    // Submit to HubSpot in background
                                    var hs = config.hubspot || {};
                                    var apiUrl = 'https://api.hsforms.com/submissions/v3/integration/submit/' + (hs.portalId || '4770265') + '/' + (hs.formId || 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0');
                                    var payload = { fields: savedFields, context: { pageUri: window.location.href, pageName: document.title } };
                                    var hutk = getCookie('hubspotutk');
                                    if (hutk) payload.context.hutk = hutk;
                                    fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(function () {});
                                    if (window.dataLayer) {
                                        window.dataLayer.push({ event: config.gtmEvent || 'book_demo_form_submit', formId: hs.formId, portalId: hs.portalId });
                                    }
                                    // Open modal, then set ebook data (openPopup resets state)
                                    openPopup(formId);
                                    var inst = instances[formId];
                                    inst.ebookName = ebookName;
                                    inst.ebookUrl = ebookUrl;
                                    inst.form.style.display = 'none';
                                    showEbookSuccess(inst.successDiv, inst);
                                    inst.successDiv.classList.add('visible');
                                    return;
                                }
                            } catch (ex) { /* sessionStorage unavailable */ }
                        }

                        // Normal path: open popup, then set ebook data after reset
                        openPopup(formId);
                        var inst = instances[formId];
                        if (ebookName) inst.ebookName = ebookName;
                        if (ebookUrl) inst.ebookUrl = ebookUrl;
                    });
                });
            }

            var overlay = document.getElementById(uid(formId, 'overlay'));
            if (overlay) {
                // Close button
                var closeBtn = overlay.querySelector('.wkz-overlay-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function () {
                        closePopup(formId);
                    });
                }

                // Backdrop click
                overlay.addEventListener('click', function (e) {
                    if (e.target === overlay) closePopup(formId);
                });
            }

            // ESC key
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closePopup(formId);
            });
        }
    }

    function goToStep(formId, n) {
        var inst = instances[formId];
        inst.currentStep = n;

        var steps = inst.root.querySelectorAll('.hs-step');
        steps.forEach(function (s) {
            s.classList.toggle('active', parseInt(s.getAttribute('data-step')) === n);
        });

        clearAllErrors(inst.root);
    }

    /* ==========================================================================
       Outside-Click Handler (global, covers all instances)
       ========================================================================== */

    function initGlobalOutsideClick() {
        document.addEventListener('click', function (e) {
            // Close all open dropdowns not containing the click target
            document.querySelectorAll('.hs-dropdown.open').forEach(function (d) {
                if (!d.contains(e.target)) {
                    d.classList.remove('open');
                    var t = d.querySelector('.hs-dropdown-toggle');
                    if (t) {
                        t.classList.remove('active');
                        t.setAttribute('aria-expanded', 'false');
                    }
                }
            });

            // Close industry "Other" panels
            document.querySelectorAll('.hs-industry-other-panel').forEach(function (panel) {
                if (panel.style.display !== 'none') {
                    var otherBtn = panel.parentElement.querySelector('.hs-industry-pill--other');
                    if (!panel.contains(e.target) && e.target !== otherBtn) {
                        panel.style.display = 'none';
                        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    }

    /* ==========================================================================
       Boot
       ========================================================================== */

    function bootAll() {
        initGlobalOutsideClick();

        for (var formId in registry) {
            if (!registry.hasOwnProperty(formId)) continue;

            var config = registry[formId];
            var target = document.querySelector('[data-wkz-form="' + formId + '"]');
            if (!target) continue;

            var formHtml = buildFormHtml(formId, config);

            if (config.mode === 'modal') {
                // Create overlay, append to body
                var overlayHtml = wrapInModal(formId, formHtml);
                var wrapper = document.createElement('div');
                wrapper.innerHTML = overlayHtml;
                var overlayEl = wrapper.firstChild;
                document.body.appendChild(overlayEl);

                // The theme attribute needs to be on the panel (which contains the form)
                var panel = overlayEl.querySelector('.wkz-overlay-panel');
                var formContainer = overlayEl.querySelector('.wkz-form');

                // Init from the form container inside the overlay
                initFormInstance(formId, config, formContainer);

                // Clean up the original target placeholder
                target.style.display = 'none';

            } else {
                // Inline mode
                target.innerHTML = formHtml;
                var formContainer = target.querySelector('.wkz-form');
                initFormInstance(formId, config, formContainer);
            }
        }
    }

    /* ==========================================================================
       Public API
       ========================================================================== */
    window.WkzForms = {
        register: function (id, config) {
            registry[id] = config;
        },
        open: function (id) {
            openPopup(id);
        },
        close: function (id) {
            closePopup(id);
        }
    };

    /* ==========================================================================
       Auto-Init
       ========================================================================== */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootAll);
    } else {
        // If script loads after DOM ready, boot on next tick
        // (allows register() calls that follow this script tag)
        setTimeout(bootAll, 0);
    }

})();
