/* ============================================
   WkzForms — Form Variant Configs
   ============================================
   Each register() call defines one form variant.
   Add new forms by copying and modifying a config.
   ============================================ */

/* ------------------------------------------------------------------
   Form 1: Free Book Download (inline, dark theme, single step)
   Replaces: materials/form-no-revenue-hero-books/
   ------------------------------------------------------------------ */
WkzForms.register('free-book', {
    mode: 'inline',
    theme: 'dark',
    steps: 1,
    submitText: 'Get My Free Copy',
    successTitle: 'Thank you!',
    successText: 'Your free copy is on its way. Check your email.',
    gtmEvent: 'book_demo_form_submit',
    postSubmit: 'thankYou',

    hubspot: {
        portalId: '4770265',
        formId: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0'
    },

    hiddenFields: {
        plumbing_dealership: 'none',
        hvac_dealership: 'none',
        hs_lead_status: 'New',
        lead_type: 'DEMO'
    },

    fields: [
        {
            type: 'text',
            name: 'ownerFirstName',
            hsField: 'firstname',
            label: 'First name',
            required: true,
            autocomplete: 'given-name'
        },
        {
            type: 'text',
            name: 'ownerLastName',
            hsField: 'lastname',
            label: 'Last name',
            required: true,
            autocomplete: 'family-name'
        },
        {
            type: 'email',
            name: 'emailAddress',
            hsField: 'email',
            label: 'Email',
            required: true,
            inputType: 'email',
            inputMode: 'email',
            autocomplete: 'email'
        },
        {
            type: 'tel',
            name: 'phoneNumber',
            hsField: 'phone',
            label: 'Phone number',
            required: true,
            inputType: 'tel',
            autocomplete: 'tel'
        },
        {
            type: 'text',
            name: 'businessName',
            hsField: 'company',
            label: 'Company name',
            required: true,
            autocomplete: 'organization'
        },
        {
            type: 'industryChips',
            name: 'industry',
            label: 'Industry',
            required: true
            // Uses default chips and "Other" list
        },
        {
            type: 'dropdown',
            name: 'companySize',
            hsField: 'company_size_range',
            label: 'Company size range',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please select a company size.'
            // Uses default options (set below)
        },
        {
            type: 'dropdown',
            name: 'source_picklist',
            hsField: 'source_picklist',
            label: 'How did you hear about us?',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please tell us how you heard about us.'
            // Uses default options (set below)
        },
        {
            type: 'consent'
        }
    ]
});

/* ------------------------------------------------------------------
   Form 2: Book a Demo Popup (modal, light theme, 2-step wizard)
   Replaces: materials/book-a-demo-popup/
   ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   Form 3: eBook Download Popup (modal, light theme, single step)
   ------------------------------------------------------------------ */
WkzForms.register('frm-ebook-01', {
    mode: 'modal',
    theme: 'light',
    steps: 1,
    trigger: '[data-action="frm-ebook-01"]',
    submitText: 'Get my free copy',
    successTitle: 'Your ebook is ready!',
    successText: 'Click the button below to download your free copy.',
    gtmEvent: 'book_demo_form_submit',
    postSubmit: 'thankYou',
    reuseSession: true,

    hubspot: {
        portalId: '4770265',
        formId: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0'
    },

    hiddenFields: {
        plumbing_dealership: 'none',
        hvac_dealership: 'none',
        source_picklist: 'Other',
        lead_type: 'DEMO',
        interest: 'eBook General',
        sms_consent: 'Yes',
        gtm_initiative: 'eBook Submission (March 2026)',
        ebook_flag: 'true',
        form_id: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0'
    },

    fields: [
        {
            type: 'text',
            name: 'ownerFirstName',
            hsField: 'firstname',
            label: 'First name',
            required: true,
            autocomplete: 'given-name'
        },
        {
            type: 'text',
            name: 'ownerLastName',
            hsField: 'lastname',
            label: 'Last name',
            required: true,
            autocomplete: 'family-name'
        },
        {
            type: 'email',
            name: 'emailAddress',
            hsField: 'email',
            label: 'Email',
            required: true,
            inputType: 'email',
            inputMode: 'email',
            autocomplete: 'email'
        },
        {
            type: 'tel',
            name: 'phoneNumber',
            hsField: 'phone',
            label: 'Phone number',
            required: true,
            inputType: 'tel',
            autocomplete: 'tel'
        },
        {
            type: 'text',
            name: 'businessName',
            hsField: 'company',
            label: 'Company name',
            required: true,
            autocomplete: 'organization'
        },
        {
            type: 'industryChips',
            name: 'industry',
            label: 'Industry',
            required: true
        },
        {
            type: 'dropdown',
            name: 'companySize',
            hsField: 'company_size_range',
            label: 'Company size range',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please select a company size.'
        },
        {
            type: 'consent'
        }
    ]
});

/* ------------------------------------------------------------------
   Form 4: Book a Demo with Content Panel (modal, light, 2-step)
   Two-column layout: form left, marketing panel right
   ------------------------------------------------------------------ */
WkzForms.register('frm-book-a-demo-modale-01', {
    mode: 'modal',
    theme: 'light',
    steps: 2,
    trigger: '[data-action="frm-book-a-demo-modale-01"]',
    overlayBg: 'https://cdn.prod.website-files.com/626f8f4af1df65572fcaeb58/69af315308c0ce45fbad29d0_bg-product.webp',
    submitText: 'Book a demo now',
    continueText: 'Continue',
    successTitle: 'Thank you!',
    successText: "We'll be in touch shortly. In the meantime, explore the full product with a 7-day free trial \u2014 no credit card needed. 30 jobs per week stay free, forever.",
    successCta: {
        text: 'Start Free Trial',
        url: 'https://www.workiz.com/signup/join-workiz/'
    },
    gtmEvent: 'book_demo_form_submit',
    postSubmit: 'revenueHero',
    revenueHeroRouter: '5125',

    contentPanel: {
        logo: 'https://cdn.prod.website-files.com/626f8f4af1df65572fcaeb58/69af2ca7e68439d0b67157ec_workiz-logo-80.svg',
        heading: 'See how pros like you win 3x more jobs',
        bullets: [
            'A walkthrough built around your workflow',
            'See how Genius AI books jobs from missed calls \u2014 24/7',
            'How teams your size cut 20+ hours of admin a week'
        ],
        badgesImage: 'https://cdn.prod.website-files.com/626f8f4af1df65572fcaeb58/699ef59cd293d7e6d2dd3c1a_badges-popup.png'
    },

    hubspot: {
        portalId: '4770265',
        formId: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0'
    },

    hiddenFields: {
        plumbing_dealership: 'none',
        hvac_dealership: 'none',
        hs_lead_status: 'New',
        lead_type: 'DEMO'
    },

    fields: [
        // --- Step 1: About You ---
        {
            type: 'text',
            name: 'ownerFirstName',
            hsField: 'firstname',
            label: 'First Name',
            required: true,
            autocomplete: 'given-name',
            step: 1
        },
        {
            type: 'text',
            name: 'ownerLastName',
            hsField: 'lastname',
            label: 'Last Name',
            required: true,
            autocomplete: 'family-name',
            step: 1
        },
        {
            type: 'email',
            name: 'emailAddress',
            hsField: 'email',
            label: 'Email',
            required: true,
            inputType: 'email',
            inputMode: 'email',
            autocomplete: 'email',
            step: 1
        },
        {
            type: 'tel',
            name: 'phoneNumber',
            hsField: 'phone',
            label: 'Phone Number',
            required: true,
            inputType: 'tel',
            autocomplete: 'tel',
            step: 1
        },
        {
            type: 'text',
            name: 'businessName',
            hsField: 'company',
            label: 'Company Name',
            required: true,
            autocomplete: 'organization',
            step: 1
        },

        // --- Step 2: About Your Business ---
        {
            type: 'industryChips',
            name: 'industry',
            label: 'Industry',
            required: true,
            step: 2
        },
        {
            type: 'dropdown',
            name: 'companySize',
            hsField: 'company_size_range',
            label: 'Company size range',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please select a company size.',
            step: 2
        },
        {
            type: 'dropdown',
            name: 'source_picklist',
            hsField: 'source_picklist',
            label: 'How did you hear about us?',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please select how you heard about us.',
            step: 2
        },
        {
            type: 'dropdown',
            name: 'preferred_demo_contact_method',
            hsField: 'preferred_demo_contact_method',
            label: 'How would you prefer to be contacted?',
            required: false,
            placeholder: 'Select one\u2026',
            step: 2,
            options: [
                { value: 'Book a video meeting', label: 'Book a video meeting' },
                { value: 'Get a phone call', label: 'Get a phone call' }
            ]
        },
        {
            type: 'consent'
        }
    ]
});

/* ------------------------------------------------------------------
   Form 5: Expert Consultation (inline, light theme, single step)
   HubSpot: TODO — connect later
   ------------------------------------------------------------------ */
WkzForms.register('frm-expert-consultation-01', {
    mode: 'inline',
    theme: 'light',
    steps: 1,
    submitText: 'Book My Consultation',
    successTitle: 'Thank you!',
    successText: 'We\'ve received your request. An expert will reach out to you shortly.',
    gtmEvent: 'expert_consultation_form_submit',
    postSubmit: 'revenueHero',
    revenueHeroRouter: '5348',

    hubspot: {
        portalId: '4770265',
        formId: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0'
    },

    hiddenFields: {
        plumbing_dealership: 'none',
        hvac_dealership: 'none',
        source_picklist: 'Other',
        lead_type: 'DEMO',
        gtm_initiative: 'Consultation Demo (March 2026)',
        form_id: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0'
    },

    fields: [
        {
            type: 'text',
            name: 'ownerFirstName',
            hsField: 'firstname',
            label: 'First Name',
            required: true,
            autocomplete: 'given-name'
        },
        {
            type: 'text',
            name: 'ownerLastName',
            hsField: 'lastname',
            label: 'Last Name',
            required: true,
            autocomplete: 'family-name'
        },
        {
            type: 'email',
            name: 'emailAddress',
            hsField: 'email',
            label: 'Email',
            required: true,
            inputType: 'email',
            inputMode: 'email',
            autocomplete: 'email'
        },
        {
            type: 'tel',
            name: 'phoneNumber',
            hsField: 'phone',
            label: 'Phone number',
            required: true,
            inputType: 'tel',
            autocomplete: 'tel'
        },
        {
            type: 'text',
            name: 'businessName',
            hsField: 'company',
            label: 'Company Name',
            required: true,
            autocomplete: 'organization'
        },
        {
            type: 'industryChips',
            name: 'industry',
            label: 'Industry',
            required: true
        },
        {
            type: 'dropdown',
            name: 'companySize',
            hsField: 'company_size_range',
            label: 'Company Size',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please select a company size.'
        },
        {
            type: 'text',
            name: 'mainConcern',
            hsField: 'consultation_reason',
            label: 'What\'s your main concern?',
            required: false
        },
        {
            type: 'consent'
        }
    ]
});

WkzForms.register('book-a-demo', {
    mode: 'modal',
    theme: 'light',
    steps: 1,
    trigger: '[data-action="book-a-demo"], [click="book-a-demo"]',
    submitText: 'Book a demo now',
    successTitle: 'Thank you!',
    successText: "We'll be in touch shortly. In the meantime, explore the full product with a 7-day free trial \u2014 no credit card needed. 30 jobs per week stay free, forever.",
    successCta: {
        text: 'Start Free Trial',
        url: 'https://www.workiz.com/signup/join-workiz/'
    },
    gtmEvent: 'book_demo_form_submit',
    postSubmit: 'thankYou',

    hubspot: {
        portalId: '4770265',
        formId: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0'
    },

    hiddenFields: {
        plumbing_dealership: 'none',
        hvac_dealership: 'none',
        hs_lead_status: 'New',
        lead_type: 'DEMO'
    },

    fields: [
        // --- Step 1: About You ---
        {
            type: 'text',
            name: 'ownerFirstName',
            hsField: 'firstname',
            label: 'First Name',
            required: true,
            autocomplete: 'given-name',
            step: 1
        },
        {
            type: 'text',
            name: 'ownerLastName',
            hsField: 'lastname',
            label: 'Last Name',
            required: true,
            autocomplete: 'family-name',
            step: 1
        },
        {
            type: 'email',
            name: 'emailAddress',
            hsField: 'email',
            label: 'Email',
            required: true,
            inputType: 'email',
            inputMode: 'email',
            autocomplete: 'email',
            step: 1
        },
        {
            type: 'tel',
            name: 'phoneNumber',
            hsField: 'phone',
            label: 'Phone Number',
            required: true,
            inputType: 'tel',
            autocomplete: 'tel',
            step: 1
        },
        {
            type: 'text',
            name: 'businessName',
            hsField: 'company',
            label: 'Company Name',
            required: true,
            autocomplete: 'organization',
            step: 1
        },

        // --- Step 2: About Your Business ---
        {
            type: 'industryChips',
            name: 'industry',
            label: 'Industry',
            required: true,
            step: 2
        },
        {
            type: 'dropdown',
            name: 'companySize',
            hsField: 'company_size_range',
            label: 'Company size range',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please select a company size.',
            step: 2
        },
        {
            type: 'dropdown',
            name: 'monthly_volume_range',
            hsField: 'monthly_volume_range',
            label: 'Estimated monthly revenue',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please select an estimated monthly revenue.',
            step: 2,
            options: [
                { value: "It's a new business", label: "It's a new business" },
                { value: '$0 - $10,000', label: '$0 - $10,000' },
                { value: '$10,000 - $50,000', label: '$10,000 - $50,000' },
                { value: '$50,000 - $100,000', label: '$50,000 - $100,000' },
                { value: '$100,000 - $250,000', label: '$100,000 - $250,000' },
                { value: 'More than $250,000', label: 'More than $250,000' },
                { value: 'Rather not say', label: 'Rather not say' }
            ]
        },
        {
            type: 'dropdown',
            name: 'source_picklist',
            hsField: 'source_picklist',
            label: 'How did you hear about us?',
            required: true,
            placeholder: 'Select one\u2026',
            errorMessage: 'Please select how you heard about us.',
            step: 2
        },
        {
            type: 'dropdown',
            name: 'preferred_demo_contact_method',
            hsField: 'preferred_demo_contact_method',
            label: 'How would you prefer to be contacted?',
            required: false,
            placeholder: 'Select one\u2026',
            step: 2,
            options: [
                { value: 'Book a video meeting', label: 'Book a video meeting' },
                { value: 'Get a phone call', label: 'Get a phone call' }
            ]
        },
        {
            type: 'consent'
        }
    ]
});
