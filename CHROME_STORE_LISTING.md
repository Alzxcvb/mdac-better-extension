# Chrome Web Store — MDAC Better Listing Copy

## Extension Name (max 50 chars)

MDAC Better — Malaysia Arrival Card Autofill (47 chars)

## Short Description (<132 chars, ideally <100)

1. One-click autofill for Malaysia's Digital Arrival Card. Save your profile once, fill the official form instantly. (113 chars)
2. Save your traveler profile once and autofill Malaysia's Digital Arrival Card on the official site. (98 chars)
3. Autofill the Malaysia MDAC form from a saved profile — passport, dates, accommodation, all in one click. (104 chars)

## Detailed Description

The official Malaysia Digital Arrival Card (MDAC) form at imigresen-online.imi.gov.my is slow, easy to mistype, and silently rejects dates if the format is wrong. If you re-enter your country code, passport number, and accommodation details every trip — or every time the session expires — you've felt it. MDAC Better fixes that without changing the form you're submitting to: it's still the official site, still the official submission, just filled correctly the first time.

Save your traveler profile once in the popup — passport, nationality, date of birth, contact, arrival/departure dates, flight number, and accommodation. Click "Fill MDAC". The extension opens (or activates) the official MDAC tab, maps your profile to the form's exact field names, sets values, and dispatches the change events the page's jQuery handlers expect. Cascading dropdowns like state-then-city are handled correctly: it waits for the city list to load over AJAX before selecting your city. You review, you submit. Nothing else changes.

There's also a companion web app at https://mdac-better.vercel.app that handles mobile users and gives you the same profile-management experience without an extension. The two are independent — use whichever suits the device you're on.

Features:
- One-click autofill for the official MDAC form
- Profile stored locally in chrome.storage — never leaves your machine
- Correct DD/MM/YYYY date formatting for DOB, passport expiry, arrival, departure
- ISO 3166 alpha-3 nationality and place-of-birth code resolution
- State-to-city cascade handled (waits for AJAX, selects your city)
- Works alongside the mdac-better.vercel.app web app
- Open source, no remote code, no analytics, no servers

Privacy: your profile is stored only in chrome.storage.local on your own machine. There is no backend, no telemetry, and no remote code execution — required by Manifest V3 and verified in the source. The project is open source.

## Single Purpose Statement

MDAC Better autofills the official Malaysia Digital Arrival Card form at imigresen-online.imi.gov.my using a traveler profile the user has saved locally.

## Category

Recommended: Productivity
Backup: Tools

## Permissions Justifications

- `storage` — Persist the user's traveler profile (passport, dates, accommodation) and the pending fill payload locally between the popup and the content script via chrome.storage.local.
- `activeTab` — Allow the popup's "Fill MDAC" button to act on the currently focused MDAC tab when the user explicitly clicks it.
- `scripting` — Programmatically inject the fill logic into the official MDAC page when the user triggers a fill from the popup, in addition to the static content script.
- `tabs` — Locate an existing MDAC tab to reuse, or open a new one at the official MDAC URL when the user clicks "Fill MDAC", so the user is not forced to navigate manually.
- Host permission `https://imigresen-online.imi.gov.my/*` — The content script must run on the official Malaysian Immigration MDAC domain to read form field names and write the user's saved values; this is the only site the extension touches.

## Privacy Practices Disclosure

- Personally identifiable information — Yes. The extension stores the user's name, passport number, date of birth, nationality, email, phone, and accommodation address locally in chrome.storage.local so it can be written back into the official MDAC form. It is never transmitted off-device by this extension.
- Health information — No. Not collected.
- Financial and payment information — No. Not collected.
- Authentication information — No. The extension does not handle MDAC accounts, passwords, or session tokens.
- Personal communications — No. Not collected.
- Location — No. The extension does not read device location; "place of birth" and "country of departure" are user-typed profile fields, not geolocation.
- Web history — No. Not collected.
- User activity — No. Not collected; no analytics or telemetry.
- Website content — Yes, narrowly. The content script reads and writes form field values on imigresen-online.imi.gov.my/mdac/* solely to perform the autofill. Page content is not transmitted off-device.

- Does the extension sell or share user data with third parties? No.
- Does the extension use data for purposes unrelated to the single purpose? No.
- Does the extension use data to determine creditworthiness or for lending purposes? No.

## Privacy Policy URL

https://mdac-better.vercel.app/privacy

## Support / Homepage URL

https://mdac-better.vercel.app

## Suggested Tags / Keywords

- malaysia digital arrival card
- mdac
- autofill
- travel forms
- imigresen
- arrival card malaysia
- one-click form fill
- passport autofill

## Submission Checklist

- [ ] Privacy policy live and reachable at https://mdac-better.vercel.app/privacy
- [ ] Production .zip uploaded (manifest.json, popup.html, popup.js, background.js, content.js, icons/)
- [ ] 128x128 store tile and at least one 1280x800 screenshot uploaded
- [ ] Every permission in manifest.json (storage, activeTab, scripting, tabs, host_permissions) has a justification entered in the developer dashboard matching the section above
- [ ] Single purpose statement entered in the dashboard matches what the code actually does (fills the MDAC form on imigresen-online.imi.gov.my)
- [ ] Privacy practices disclosure form answered as above (PII = Yes, everything else = No except narrow Website content)
- [ ] "Sells/shares data" set to No; "uses data outside single purpose" set to No
- [ ] Category set to Productivity
- [ ] Support and homepage URLs set to https://mdac-better.vercel.app
- [ ] Source confirmed Manifest V3 with no remote code (no eval, no remote script tags, no fetched JS)
