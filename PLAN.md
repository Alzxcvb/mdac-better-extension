# MDAC Better Chrome Extension — Plan

## Architecture

Manifest V3 Chrome extension with three components:

1. **Popup** (`popup.html` + `popup.js`) — Profile management UI. Users save their traveler details once (stored in `chrome.storage.local`). Shows profile summary with one-click "Fill MDAC" button.

2. **Background Service Worker** (`background.js`) — Handles messages from popup, manages tab creation/navigation to the official MDAC site, stores pending fill data for the content script.

3. **Content Script** (`content.js`) — Injected on `imigresen-online.imi.gov.my/mdac/*`. Reads pending fill data from storage, maps profile fields to MDAC form field names, sets values via DOM manipulation + event dispatch (native + jQuery).

### Data Flow
```
User clicks "Fill MDAC" in popup
  -> popup.js resolves country/state/transport codes
  -> sends message to background.js
  -> background.js stores enriched profile in chrome.storage
  -> background.js opens/activates MDAC tab
  -> content.js loads on MDAC page
  -> reads pending data from chrome.storage
  -> fills form fields via querySelector('[name="..."]')
  -> dispatches change/input events (native + jQuery)
  -> waits for city dropdown AJAX, selects city
  -> shows confirmation banner
```

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save profile + pending fill data locally |
| `activeTab` | Inject script into the active MDAC tab |
| `scripting` | Programmatic script injection if needed |
| `host_permissions: imigresen-online.imi.gov.my` | Content script runs on official MDAC site |

No remote code, no `<all_urls>`, no background network requests.

## DOM Selectors (Official MDAC Form)

The official form at `https://imigresen-online.imi.gov.my/mdac/main?registerMain` uses `input[name="..."]` and `select[name="..."]` attributes. Key field names:

### Text Inputs
- `name` — Full name (uppercase, max 60)
- `passNo` — Passport number (uppercase alphanumeric, max 12)
- `dob` — Date of birth (DD/MM/YYYY)
- `passExpDte` — Passport expiry (DD/MM/YYYY)
- `email` — Email address
- `confirmEmail` — Email confirmation (same value)
- `region` — Phone country code (digits only, no +)
- `mobile` — Phone number (digits only, max 12)
- `arrDt` — Arrival date (DD/MM/YYYY)
- `depDt` — Departure date (DD/MM/YYYY)
- `vesselNm` — Flight/vehicle number (max 30)
- `accommodationAddress1` — Hotel/accommodation name (max 100)
- `accommodationAddress2` — Street address (max 100)
- `accommodationPostcode` — Postal code (5 digits)

### Dropdowns (select)
- `nationality` — ISO 3166-1 alpha-3 code
- `pob` — Place of birth, ISO3 code
- `sex` — `1` (Male) or `2` (Female)
- `trvlMode` — `1` (Air), `2` (Land), `3` (Sea)
- `embark` — Country of last departure, ISO3 code
- `accommodationStay` — `01` (Hotel)
- `accommodationState` — State code `01`-`16`
- `accommodationCity` — City code (loaded via AJAX after state selection)

### Important: jQuery Dependency
The official site uses jQuery + Bootstrap 3. After setting `.value`, we must also:
```js
$(el).trigger('change').trigger('input');
```
This ensures cascading dropdowns (state -> city) and internal validators fire correctly.

## Differentiation from Competitors

| Feature | hunglun/autofill-mdac | MDAC Express | MDAC Better Extension |
|---|---|---|---|
| Profile storage | Extension only | Extension only | Extension + web app sync (planned) |
| Code mapping | Manual element ID matching | Unknown | Full ISO3/state/transport code resolution |
| City handling | Unknown | Unknown | Waits for AJAX cascade, auto-selects |
| Passport scan | No | No | Planned (via web app camera) |
| Mobile support | No (Chrome ext) | No (Chrome ext) | Web app covers mobile |
| Open source | Yes | No | Yes |
| Active maintenance | Last update unknown | Unknown | Active |

### Key differentiator
MDAC Better is a **companion extension** to the web app at mdac-better.vercel.app. The web app handles mobile users (passport scan, better UX). The extension handles desktop users who want one-click autofill without leaving the official site.

## Chrome Web Store Submission Checklist

- [ ] Create placeholder icon PNGs: 16x16, 48x48, 128x128 (in `icons/`)
- [ ] Create Chrome Web Store listing assets: 1280x800 screenshot, 440x280 tile
- [ ] Write store description (< 132 chars for short, detailed for long)
- [ ] Set privacy policy URL (can host on mdac-better.vercel.app/privacy)
- [ ] Justify permissions in the store submission form
- [ ] Register Chrome Web Store developer account ($5 one-time fee)
- [ ] Test on Chrome, Edge, Brave (all Chromium-based)
- [ ] Test with official MDAC form end-to-end
- [ ] Verify no remote code execution (Manifest V3 requirement)
- [ ] Submit for review (typically 1-3 business days)

## Future Enhancements

1. **Web app sync** — Import/export profile between extension and web app via shared storage format
2. **Multi-profile** — Support self + family members (like hunglun's approach)
3. **Auto-detect MDAC page** — Badge icon changes when on MDAC site
4. **Passport scan bridge** — Scan passport in web app, push to extension
