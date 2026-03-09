# WkzForms

Config-driven form system for the Workiz marketing site. One engine, multiple form variants defined purely through config.

## Quick Start

Add these to your Webflow page:

```html
<!-- In <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/css/intlTelInput.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/nurel07/wkz-form@main/dist/wkz-forms.css" />

<!-- Before </body> -->
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/intlTelInputWithUtils.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/nurel07/wkz-form@main/dist/wkz-forms.js"></script>
<script src="https://cdn.jsdelivr.net/gh/nurel07/wkz-form@main/dist/wkz-forms-configs.js"></script>
```

## Usage

### Inline Form
```html
<div data-wkz-form="free-book"></div>
```

### Modal Form
```html
<!-- Trigger button (anywhere on page) -->
<button data-action="book-a-demo">Book a Demo</button>

<!-- Placeholder (anywhere on page, engine moves it to overlay) -->
<div data-wkz-form="book-a-demo"></div>
```

## Available Variants

| Variant | Mode | Theme | Steps | Post-Submit |
|---|---|---|---|---|
| `free-book` | inline | dark | 1 | Thank you |
| `book-a-demo` | modal | light | 2 | RevenueHero |
| `frm-ebook-01` | modal | light | 1 | Thank you |

## Creating a New Variant

Add a `WkzForms.register()` call in `dist/wkz-forms-configs.js`:

```js
WkzForms.register('my-new-form', {
    mode: 'modal',        // 'inline' or 'modal'
    theme: 'light',       // 'dark' or 'light'
    steps: 1,             // 1 or 2
    trigger: '[data-action="my-new-form"]',
    submitText: 'Submit',
    successTitle: 'Thank you!',
    successText: 'We will be in touch.',
    postSubmit: 'thankYou',  // 'thankYou' or 'revenueHero'

    hubspot: {
        portalId: '4770265',
        formId: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0'
    },

    fields: [
        { type: 'text', name: 'ownerFirstName', hsField: 'firstname', label: 'First name', required: true },
        { type: 'email', name: 'emailAddress', hsField: 'email', label: 'Email', required: true },
        // ... add more fields
        { type: 'consent' }
    ]
});
```

## Project Structure

```
dist/
  wkz-forms.js            — Form engine (IIFE, no dependencies except intl-tel-input)
  wkz-forms.css            — Styles for all themes and modes
  wkz-forms-configs.js     — All form variant configs
  test.html                — Local test page
```

## Updating After Changes

After pushing to `main`, purge the jsDelivr cache for instant updates:

```
https://purge.jsdelivr.net/gh/nurel07/wkz-form@main/dist/wkz-forms.css
https://purge.jsdelivr.net/gh/nurel07/wkz-form@main/dist/wkz-forms.js
https://purge.jsdelivr.net/gh/nurel07/wkz-form@main/dist/wkz-forms-configs.js
```

Otherwise, cache refreshes automatically within ~24 hours.

## Local Testing

Open `dist/test.html` in a browser to test all form variants locally.
