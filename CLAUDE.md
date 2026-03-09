# WkzForms — Project Instructions

## What This Is
Config-driven form system for the Workiz marketing site (Webflow). One JS engine + one CSS file + config objects per form variant. No build step — plain IIFE JS, directly injectable via CDN.

## Architecture
```
dist/
  wkz-forms.js          — Form engine (IIFE, exposes window.WkzForms)
  wkz-forms.css         — All form styles (dark/light themes, modal, inline)
  wkz-forms-configs.js  — Form variant configs (one register() call per variant)
  test.html             — Local test page with all variants
```

## Key Rules
- **Config-only changes** for new form variants — add a new `WkzForms.register()` call in `wkz-forms-configs.js`
- **Never add a build step** — files must stay as plain JS/CSS loadable via `<script>` and `<link>` tags
- **HubSpot portal**: 4770265, default form: ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0
- **CDN**: jsDelivr from GitHub using `@latest` tag — URLs never change: `https://cdn.jsdelivr.net/gh/nurel07/wkz-form@latest/dist/`
- **After pushing**, a GitHub Action auto-creates a new version tag and purges the `@latest` CDN cache. No manual steps needed.
- **Themes**: `data-wkz-theme="dark|light"` on container; CSS variables handle all theming
- **intl-tel-input** v25.3.1 from CDN for phone fields
- **RevenueHero** integration is optional per config (router ID in config)

## Config Options Reference
| Option | Values | Notes |
|---|---|---|
| `mode` | `'inline'` / `'modal'` | Inline embeds in page; modal needs trigger + placeholder div |
| `theme` | `'dark'` / `'light'` | |
| `steps` | `1` / `2` | Multi-step ignored on mobile (<=767px) |
| `postSubmit` | `'thankYou'` / `'revenueHero'` | revenueHero requires `revenueHeroRouter` |
| `trigger` | CSS selector string | For modals: `'[data-action="variant-name"]'` |

## Field Types
`text`, `email`, `tel`, `dropdown`, `industryChips`, `consent`

## Adding a New Form Variant
1. Add `WkzForms.register('variant-name', { ... })` in `wkz-forms-configs.js`
2. For modals: add `<div data-wkz-form="variant-name"></div>` placeholder on page
3. For modals: trigger with `<button data-action="variant-name">`
4. For inline: just `<div data-wkz-form="variant-name"></div>`

## User Context
- User is not a developer — explain things simply
- Working on Workiz marketing site hosted on Webflow
