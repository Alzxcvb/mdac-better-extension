/**
 * MDAC Better — Content Script
 *
 * Runs on: https://imigresen-online.imi.gov.my/mdac/*
 * Reads the pending profile from chrome.storage and fills the official MDAC form.
 *
 * Field names are derived from the official form's input[name] attributes:
 *   name, passNo, dob, nationality, pob, sex, passExpDte,
 *   email, confirmEmail, region, mobile, arrDt, depDt,
 *   vesselNm, trvlMode, embark,
 *   accommodationStay, accommodationAddress1, accommodationAddress2,
 *   accommodationState, accommodationCity, accommodationPostcode
 *
 * The official form uses jQuery + Bootstrap 3 with server-rendered dropdowns.
 * Dropdowns require both setting .value AND dispatching change events so that
 * dependent cascading fields (state -> city) load correctly.
 */

(async function mdacBetterFill() {
  // Check for pending fill data
  const result = await chrome.storage.local.get("mdac_pending_fill");
  const profile = result.mdac_pending_fill;

  if (!profile) return; // No pending fill — do nothing

  // Clear pending flag so we don't re-fill on page reload
  await chrome.storage.local.remove("mdac_pending_fill");

  // Wait for the form to be ready (official site can be slow)
  await waitForForm();

  // Map profile fields to MDAC field names + codes
  const payload = mapProfileToMdac(profile);

  // Fill text inputs
  const textFields = [
    "name", "passNo", "dob", "passExpDte",
    "email", "confirmEmail", "region", "mobile",
    "arrDt", "depDt", "vesselNm",
    "accommodationAddress1", "accommodationAddress2",
    "accommodationPostcode"
  ];

  for (const fieldName of textFields) {
    if (payload[fieldName]) {
      setFieldValue(fieldName, payload[fieldName]);
    }
  }

  // Fill select/dropdown fields (order matters — state must come before city)
  const selectFields = [
    "nationality", "pob", "sex", "trvlMode",
    "embark", "accommodationStay", "accommodationState"
  ];

  for (const fieldName of selectFields) {
    if (payload[fieldName]) {
      setFieldValue(fieldName, payload[fieldName]);
    }
  }

  // City depends on state — wait for AJAX to populate the dropdown
  if (payload.sCity) {
    await waitAndSetCity(payload.sCity);
  }

  // Show confirmation badge
  showFillConfirmation();
})();

/**
 * Wait for the main form to be present in the DOM.
 */
function waitForForm(timeoutMs = 15000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const nameField = document.querySelector('[name="name"]');
      if (nameField) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve(); // proceed anyway
        return;
      }
      setTimeout(check, 300);
    };
    check();
  });
}

/**
 * Set a form field value and dispatch change/input events.
 * Works for both <input> and <select> elements.
 * Also triggers jQuery events if jQuery is present (the official site uses it).
 */
function setFieldValue(name, value) {
  const el = document.querySelector(`[name="${name}"]`);
  if (!el) return;

  el.value = value;

  // Dispatch native events
  ["change", "input"].forEach((eventType) => {
    el.dispatchEvent(new Event(eventType, { bubbles: true }));
  });

  // Trigger jQuery events if available (official site uses jQuery extensively)
  if (window.jQuery) {
    window.jQuery(el).trigger("change").trigger("input");
  }
}

/**
 * Wait for the city dropdown to populate (it loads via AJAX after state is set),
 * then select the matching city.
 */
function waitAndSetCity(cityName, maxAttempts = 30) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      const cityEl = document.querySelector('[name="accommodationCity"]');
      if (!cityEl) {
        if (++attempts > maxAttempts) {
          clearInterval(interval);
          resolve();
        }
        return;
      }

      // Wait for options to load
      if (cityEl.options.length <= 1) {
        if (++attempts > maxAttempts) {
          clearInterval(interval);
          resolve();
        }
        return;
      }

      // Find matching city option
      for (let i = 0; i < cityEl.options.length; i++) {
        if (cityEl.options[i].text.toLowerCase().includes(cityName.toLowerCase())) {
          cityEl.value = cityEl.options[i].value;
          cityEl.dispatchEvent(new Event("change", { bubbles: true }));
          if (window.jQuery) window.jQuery(cityEl).trigger("change");
          clearInterval(interval);
          resolve();
          return;
        }
      }

      // No match found
      clearInterval(interval);
      resolve();
    }, 500);
  });
}

/**
 * Show a small confirmation banner at the top of the page.
 */
function showFillConfirmation() {
  const banner = document.createElement("div");
  banner.id = "mdac-better-banner";
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #003893; color: white; text-align: center;
    padding: 12px 16px; font-family: system-ui, sans-serif; font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    <strong>MDAC Better:</strong> Form filled!
    Please verify your details, solve the CAPTCHA, and click Submit.
    <button onclick="this.parentElement.remove()" style="
      margin-left: 16px; background: rgba(255,255,255,0.2); border: none;
      color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer;
      font-size: 12px;
    ">Dismiss</button>
  `;
  document.body.prepend(banner);

  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    const el = document.getElementById("mdac-better-banner");
    if (el) el.remove();
  }, 15000);
}

/**
 * Map a profile object (from web app or popup) to MDAC field values.
 *
 * Country/state/transport code mappings are inlined here to keep the content
 * script self-contained (no module imports in content scripts).
 */
function mapProfileToMdac(profile) {
  // These are the most common nationality->ISO3 mappings.
  // The full list (275 entries) lives in the web app at lib/mdac-codes.ts.
  // For the extension, we include a lookup from the profile which should
  // already have been resolved to ISO3 codes by the popup or web app.

  return {
    name: (profile.fullName || "").toUpperCase().slice(0, 60),
    passNo: (profile.passportNumber || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12),
    dob: toMdacDate(profile.dateOfBirth || ""),
    nationality: profile.nationalityCode || "",
    pob: profile.pobCode || profile.nationalityCode || "",
    sex: profile.sexCode || "",
    passExpDte: toMdacDate(profile.passportExpiry || ""),
    email: profile.email || "",
    confirmEmail: profile.email || "",
    region: (profile.phoneCountryCode || "").replace(/^\+/, ""),
    mobile: (profile.phoneNumber || "").replace(/\D/g, "").slice(0, 12),
    arrDt: toMdacDate(profile.arrivalDate || ""),
    depDt: toMdacDate(profile.departureDate || ""),
    vesselNm: (profile.flightNumber || "").slice(0, 30),
    trvlMode: profile.transportCode || "",
    embark: profile.embarkCode || "",
    accommodationStay: "01",
    accommodationAddress1: (profile.hotelName || "").slice(0, 100),
    accommodationAddress2: (profile.addressInMalaysia || "").slice(0, 100),
    accommodationState: profile.stateCode || "",
    accommodationPostcode: (profile.postalCode || "").replace(/\D/g, "").slice(0, 5),
    sCity: profile.cityInMalaysia || "",
  };
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY (official MDAC date format).
 */
function toMdacDate(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
