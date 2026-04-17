/**
 * MDAC Better — Popup Script
 *
 * Manages three states:
 *   1. state-profile: User has saved profile, show summary + "Fill MDAC" button
 *   2. state-empty: No profile saved, prompt to create or import
 *   3. state-form: Edit/create profile form
 */

// Country -> ISO3 code mapping (subset for the extension; full list in web app)
// This maps the most common nationalities. Users can also enter ISO3 codes directly.
const COUNTRY_TO_ISO3 = {
  "United States": "USA", "United Kingdom": "GBR", "Canada": "CAN",
  "Australia": "AUS", "Singapore": "SGP", "China": "CHN",
  "Japan": "JPN", "South Korea": "KOR", "India": "IND",
  "Indonesia": "IDN", "Thailand": "THA", "Philippines": "PHL",
  "Germany": "DEU", "France": "FRA", "Italy": "ITA",
  "Spain": "ESP", "Netherlands": "NLD", "Sweden": "SWE",
  "Norway": "NOR", "Denmark": "DNK", "Switzerland": "CHE",
  "New Zealand": "NZL", "Taiwan": "TWN", "Hong Kong": "HKG",
  "Vietnam": "VNM", "Malaysia": "MYS", "Brazil": "BRA",
  "Mexico": "MEX", "Russia": "RUS", "Turkey": "TUR",
  "Pakistan": "PAK", "Bangladesh": "BGD", "Brunei": "BRN",
  "Ireland": "IRL", "Belgium": "BEL", "Austria": "AUT",
  "Portugal": "PRT", "Poland": "POL", "Czech Republic": "CZE",
  "Finland": "FIN", "Romania": "ROU", "Hungary": "HUN",
  "Saudi Arabia": "SAU", "United Arab Emirates": "ARE",
  "Israel": "ISR", "Egypt": "EGY", "South Africa": "ZAF",
  "Argentina": "ARG", "Colombia": "COL", "Chile": "CHL",
  "Peru": "PER", "Cambodia": "KHM", "Myanmar": "MMR",
  "Laos": "LAO", "Nepal": "NPL", "Sri Lanka": "LKA",
};

const STATE_TO_CODE = {
  "Johor": "01", "Kedah": "02", "Kelantan": "03",
  "WP Kuala Lumpur": "04", "WP Labuan": "05", "Melaka": "06",
  "Negeri Sembilan": "07", "Pahang": "08", "Pulau Pinang": "09",
  "Perak": "10", "Perlis": "11", "WP Putrajaya": "12",
  "Sabah": "13", "Sarawak": "14", "Selangor": "15",
  "Terengganu": "16",
};

const TRANSPORT_TO_CODE = { "Air": "1", "Land": "2", "Sea": "3" };
const SEX_TO_CODE = { "Male": "1", "Female": "2" };

// All form field IDs (must match popup.html)
const PROFILE_FIELDS = [
  "fullName", "passportNumber", "nationality", "dateOfBirth", "sex",
  "passportExpiry", "placeOfBirth", "countryOfPassportIssuance",
  "email", "phoneCountryCode", "phoneNumber",
  "arrivalDate", "departureDate", "modeOfTransport", "flightNumber",
  "departureCountry", "hotelName", "addressInMalaysia",
  "stateInMalaysia", "cityInMalaysia", "postalCode"
];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Load profile
  const result = await chrome.storage.local.get("mdac_profile");
  const profile = result.mdac_profile;

  if (profile && profile.fullName) {
    showState("profile");
    renderProfile(profile);
  } else {
    showState("empty");
  }

  // Wire up buttons
  document.getElementById("btn-fill").addEventListener("click", handleFill);
  document.getElementById("btn-edit").addEventListener("click", () => {
    loadProfileIntoForm();
    showState("form");
  });
  document.getElementById("btn-clear").addEventListener("click", handleClear);
  document.getElementById("btn-show-form").addEventListener("click", () => showState("form"));
  document.getElementById("btn-import").addEventListener("click", handleImport);
  document.getElementById("btn-save").addEventListener("click", handleSave);
  document.getElementById("btn-cancel").addEventListener("click", async () => {
    const r = await chrome.storage.local.get("mdac_profile");
    if (r.mdac_profile && r.mdac_profile.fullName) {
      showState("profile");
    } else {
      showState("empty");
    }
  });
}

function showState(state) {
  document.querySelectorAll(".state").forEach((el) => el.classList.remove("active"));
  document.getElementById(`state-${state}`).classList.add("active");
}

function renderProfile(profile) {
  document.getElementById("profile-name").textContent = profile.fullName || "—";
  document.getElementById("profile-passport").textContent = profile.passportNumber || "—";
  document.getElementById("profile-nationality").textContent = profile.nationality || "—";
  document.getElementById("profile-dob").textContent = profile.dateOfBirth || "—";
}

async function handleFill() {
  const result = await chrome.storage.local.get("mdac_profile");
  const profile = result.mdac_profile;
  if (!profile) return;

  // Resolve codes for the content script
  const enriched = {
    ...profile,
    nationalityCode: COUNTRY_TO_ISO3[profile.nationality] || profile.nationality || "",
    pobCode: COUNTRY_TO_ISO3[profile.placeOfBirth] || COUNTRY_TO_ISO3[profile.nationality] || "",
    sexCode: SEX_TO_CODE[profile.sex] || "",
    transportCode: TRANSPORT_TO_CODE[profile.modeOfTransport] || "",
    embarkCode: COUNTRY_TO_ISO3[profile.departureCountry] || "",
    stateCode: STATE_TO_CODE[profile.stateInMalaysia] || "",
  };

  chrome.runtime.sendMessage({ action: "fillMdac", profile: enriched }, (response) => {
    const statusEl = document.getElementById("fill-status");
    statusEl.className = "status-msg success";
    statusEl.textContent = "Opening MDAC form and filling your details...";
    setTimeout(() => window.close(), 2000);
  });
}

async function handleClear() {
  if (!confirm("Clear your saved profile?")) return;
  await chrome.storage.local.remove("mdac_profile");
  showState("empty");
}

function handleImport() {
  // Try to read from web app's localStorage key via a content script
  // For now, show the form with a note
  alert(
    "To import from the web app:\n\n" +
    "1. Open mdac-better.vercel.app\n" +
    "2. Fill and save your profile there\n" +
    "3. Your profile is stored locally — copy the fields here\n\n" +
    "Direct import is planned for a future version."
  );
  showState("form");
}

async function handleSave() {
  const profile = {};
  for (const field of PROFILE_FIELDS) {
    const el = document.getElementById(`f-${field}`);
    if (el) profile[field] = el.value.trim();
  }

  if (!profile.fullName) {
    alert("Full name is required.");
    return;
  }

  await chrome.storage.local.set({ mdac_profile: profile });
  renderProfile(profile);
  showState("profile");
}

async function loadProfileIntoForm() {
  const result = await chrome.storage.local.get("mdac_profile");
  const profile = result.mdac_profile || {};

  for (const field of PROFILE_FIELDS) {
    const el = document.getElementById(`f-${field}`);
    if (el && profile[field]) {
      el.value = profile[field];
    }
  }
}
