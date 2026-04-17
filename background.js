/**
 * MDAC Better — Background Service Worker (Manifest V3)
 *
 * Handles:
 * 1. "Fill MDAC" action from popup — opens official site + injects content script
 * 2. Message relay between popup and content script
 */

const MDAC_URL = "https://imigresen-online.imi.gov.my/mdac/main?registerMain";

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fillMdac") {
    handleFillMdac(message.profile);
    sendResponse({ status: "started" });
    return true; // keep channel open for async
  }

  if (message.action === "getProfile") {
    chrome.storage.local.get("mdac_profile", (result) => {
      sendResponse({ profile: result.mdac_profile || null });
    });
    return true;
  }

  if (message.action === "saveProfile") {
    chrome.storage.local.set({ mdac_profile: message.profile }, () => {
      sendResponse({ status: "saved" });
    });
    return true;
  }

  if (message.action === "clearProfile") {
    chrome.storage.local.remove("mdac_profile", () => {
      sendResponse({ status: "cleared" });
    });
    return true;
  }
});

/**
 * Open the MDAC form and inject the autofill content script.
 * If the tab is already on the MDAC site, just inject.
 */
async function handleFillMdac(profile) {
  // Store profile so content script can pick it up
  await chrome.storage.local.set({ mdac_pending_fill: profile });

  // Find existing MDAC tab or create new one
  const tabs = await chrome.tabs.query({ url: "https://imigresen-online.imi.gov.my/mdac/*" });

  if (tabs.length > 0) {
    // Activate existing tab and reload to trigger content script
    const tab = tabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.tabs.reload(tab.id);
  } else {
    // Open new tab
    await chrome.tabs.create({ url: MDAC_URL });
  }
}
