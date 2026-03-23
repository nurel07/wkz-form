# WkzForms

Config-driven form system for the Workiz marketing site. One engine, multiple form variants defined purely through config.

## Quick Start

Add these to your Webflow page:

```html
<!-- In <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/css/intlTelInput.css" />
<link rel="stylesheet" href="https://nurel07.github.io/wkz-form/dist/wkz-forms.css" />

<!-- Before </body> -->
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/intlTelInputWithUtils.min.js"></script>
<script src="https://nurel07.github.io/wkz-form/dist/wkz-forms.js"></script>
<script src="https://nurel07.github.io/wkz-form/dist/wkz-forms-configs.js"></script>
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

| Variant | Mode | Theme | Steps | Post-Submit | Content Panel |
|---|---|---|---|---|---|
| `free-book` | inline | dark | 1 | Thank you | — |
| `book-a-demo` | modal | light | 1 | Thank you | — |
| `frm-ebook-01` | modal | light | 1 | Download ebook | — |
| `frm-book-a-demo-modale-01` | modal | light | 2 | RevenueHero (5125) | Yes |
| `frm-expert-consultation-01` | inline | light | 1 | RevenueHero (5348) | — |

## RevenueHero — Meeting Scheduler After Submit

To show a RevenueHero meeting scheduler instead of the thank-you screen after form submission, set these two options in the form config:

```js
postSubmit: 'revenueHero',
revenueHeroRouter: '5125',   // your RevenueHero router ID
```

That's it — the engine automatically loads the RevenueHero script and opens the scheduler after a successful submission. No extra scripts needed in Webflow.

If RevenueHero fails to load, the form falls back to the standard thank-you screen.

## Ebook Form — Dynamic ebook_name

The `frm-ebook-01` variant supports multiple ebooks through a single form. Each button passes an `ebook_name` to HubSpot and an optional `ebook_url` for the post-submit download button:

```html
<button data-action="frm-ebook-01"
        data-ebook-name="the-hvac-success-formula"
        data-ebook-url="https://example.com/hvac-ebook.pdf">Download</button>

<button data-action="frm-ebook-01"
        data-ebook-name="scaling-your-business"
        data-ebook-url="https://example.com/scaling-ebook.pdf">Download</button>
```

When `data-ebook-url` is provided, the success screen shows a "Download your ebook" button linking directly to the file. If omitted, the standard thank-you message is shown instead.

### Session reuse (fill form once)

The ebook form has `reuseSession: true` — after the user fills the form once, all subsequent "Download" clicks in the same browser session skip the form and immediately show the download button. Each download still submits to HubSpot in the background so every ebook is tracked.

The success screen dynamically shows the book title from `data-ebook-name` (e.g. "Your copy of The HVAC Success Formula is ready!").

### HubSpot email personalization setup

The full book title and download link are mapped server-side in HubSpot (not exposed in frontend code):

1. **Contact properties** — create `ebook_title` (single-line text) and `ebook_link` (single-line text)
2. **Workflow** — trigger on form submission (`ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0`), use if/then branches by `ebook_name` to set `ebook_title` and `ebook_link`
3. **Email tokens** — use `{{ contact.ebook_title }}` for the title and `{{ contact.ebook_link }}` for the download button URL

Note: properties get overwritten on each download, but emails are sent immediately via the workflow so the correct values are always used.

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
    overlayBg: 'https://example.com/bg.webp',  // optional: replaces dark overlay with image

    // Optional: right-side marketing panel (modal only)
    contentPanel: {
        logo: 'https://example.com/logo.svg',   // URL or inline <svg> string
        heading: 'Your heading here',
        bullets: ['Bullet 1', 'Bullet 2', 'Bullet 3'],
        badgesImage: 'https://example.com/badges.png'
    },

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

Files are served via GitHub Pages — updates go live ~1 minute after pushing.

1. Push your changes to `main` (any file in `dist/`)
2. GitHub Pages automatically deploys the update
3. A GitHub Action creates a version tag for history

## Local Testing

Open `dist/test.html` in a browser to test all form variants locally.
