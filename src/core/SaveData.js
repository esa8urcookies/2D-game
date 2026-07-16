// Persistent save data, stored in the browser's localStorage.
// Survives page reloads and browser restarts. If localStorage is
// unavailable (some private-browsing modes), the game still works —
// progress just won't persist.

const SAVE_KEY = 'swarmSurvivorsSave';

/** A brand-new save. */
function defaultSave() {
  return {
    totalCoins: 0,
    shop: {}, // shop upgrade id -> level purchased
  };
}

/** Load the save, falling back to a fresh one on any problem. */
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    // Merge onto defaults so old saves gain new fields gracefully.
    return { ...defaultSave(), ...JSON.parse(raw) };
  } catch {
    return defaultSave();
  }
}

/** Write the save. Safe to call often. */
export function persistSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Storage unavailable — play on without persistence.
  }
}

/** Wipe everything (the shop's reset button). Returns a fresh save. */
export function resetSave() {
  const fresh = defaultSave();
  persistSave(fresh);
  return fresh;
}
