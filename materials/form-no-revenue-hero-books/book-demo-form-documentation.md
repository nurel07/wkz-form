# Book a Demo Form Documentation

This document serves as the comprehensive guide to the custom lead generation form (`custom-form-v2.html` / `custom-form-v2.js`) used on the landing page, designed to submit data to the HubSpot Forms API (v3).

## 1. Form Details & Field Mapping

The form is completely custom-built using standard HTML elements and JS, stylized to match the site's branding. It bypasses the standard embeddable HubSpot script for more UI control.

### Current Field Schema

Below are the fields captured and mapped directly to HubSpot property internal names:
*   **First Name:** `firstname`
*   **Last Name:** `lastname`
*   **Email:** `email`
*   **Phone Number:** `phone` (uses intl-tel-input for formatting and country code)
*   **Company Name:** `company`

**Custom Dropdowns (UI lists updating hidden `<select>` elements):**

Here are the specific internal values sent to the HubSpot API depending on the user's selection:

*   **Company Size (`company_size_range`):**
    *   `1`
    *   `2`
    *   `3_5`
    *   `6_10`
    *   `11+`
    *   `21 - 30 techs`
    *   `31 techs or more`

*   **How did you hear about us? (`source_picklist`):**
    *   `TikTok`, `Chat GPT/ AI tools`, `Apple App Store/ Google Play`, `Linkedin`, `Podcast`, `Online Search`, `Instagram`, `Reddit/Quora`, `Facebook`, `YouTube`, `Twitter`, `TV`, `Other`, `From a friend`, `Google/Bing`, `Friend/referral`, `My distributor`, `Google`, `Wizz`

*   **Industry:** Map to two fields: `industry_select` and standard `industry`

**Hidden / Hardcoded Values:**
*   `hs_lead_status`: 'New'
*   `lead_type`: 'DEMO'
*   `plumbing_dealership`: 'none'
*   `hvac_dealership`: 'none'

**Cookies Captured & Sent:**
The form reads and maps UTM parameters and tracking cookies to properties in the HubSpot payload (`utm_device`, `GAID`, `entry`, `fbclid`, `friend_referrer_user_id`, `utm_source`, `utm_medium`, and the core associated HubSpot tracking cookie `hutk`).

---

## 2. Validation & Error Handling

Client-side JavaScript (`validate()`) runs before any API fetch occurs.

1.  **Required Text Fields:** First/Last Name, Email, Phone, Company.
2.  **Email/Phone Formatting:** Checked via regex (email) and the `intl-tel-input` library method `isValidNumber()` (phone).
3.  **Required Dropdowns:** Industry, Company Size, and Source Picklist (How did you hear about us). If left empty, custom UI error states apply `has-error` to the primary wrapper.

### Fixing HubSpot API 400 Bad Request Errors
If an HTTP `400 Bad Request` occurs, it almost universally means the payload JSON `fields` array either contains a property name that doesn't match the HubSpot schema, or the data being sent for a required property is null or empty (`""`).

**Common Culprit:** A custom dropdown has physical UI but its hidden `<select>` element was left out of the `validate()` checks, allowing an empty value to slip through to the API.

**To debug:**
1.  Check the `catch` block on the `fetch` statement in `custom-form-v2.js`.
2.  Log the raw `res.text()` if `!res.ok`. The API will return JSON detailing exactly *which* field caused the failure.

---

## 3. Event Tracking & GTM

When a user successfully submits the lead generation form (HTTP 200 OK from HubSpot), custom events are pushed to the `window.dataLayer` object.

### Primary Tag: `book_demo_form_submit`
This is the main event used for conversion tracking and initializing tags in Google Tag Manager (GTM) for Google Ads, Meta, etc.

**Payload:**
```javascript
window.dataLayer.push({
    event: 'book_demo_form_submit', // Identifies this specific form submission
    formId: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0', // HubSpot form GUID
    portalId: '4770265' // HubSpot Portal ID
});
```

### Secondary Tag: `[{Industry Name}]`
An optional secondary event is fired immediately following `book_demo_form_submit` that uses the explicitly selected industry name as the event name (e.g., `event: 'HVAC'`, `event: 'Plumbing'`).

**Payload:**
```javascript
window.dataLayer.push({
    event: 'HVAC', // Dynamically populates based on the selected industry pill
    formId: 'ca6e3f1a-2d59-444b-91df-40cd9b3f9cd0',
    portalId: '4770265'
});
```

**Usage:** This allows for specific triggers by vertically aligning different conversion pixels to the selected industry.

---

## 4. Post-Submission UI States

The submission button (`#hs-submit-btn`) dynamically handles feedback loops:

*   **Submitting**: `submitBtn.disabled = true; submitBtn.textContent = 'Submitting…';` prevents double-submission while awaiting fetch.
*   **Error**: `submitBtn.disabled = false; submitBtn.textContent = 'Get My Free Copy';` re-enables form if network/API failure occurs. An error message banner is shown.
*   **Success**: The `<form>` is hidden and the `#hs-form-success` block displays a "Thank you!" message.

---

## Changelog

| Date | Change |
|---|---|
| 2026-02-26 | Removed RevenueHero meeting scheduler integration (router `5125`). Form now submits directly to HubSpot and shows the thank-you message without launching a scheduling overlay. |
| 2026-03-02 | Removed "Estimated monthly revenue" (`monthly_volume_range`) and "How would you prefer to be contacted?" (`preferred_demo_contact_method`) fields from HTML, JS validation, and submission payload. |
