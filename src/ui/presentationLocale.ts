import type { UiLocale } from "../content/uiCopy";

export const UI_LOCALE_STORAGE_KEY = "ember-maradsz.ui-locale";

export function loadPresentationLocale(storage: Storage = window.localStorage): UiLocale {
  try {
    const storedLocale = storage.getItem(UI_LOCALE_STORAGE_KEY);
    return storedLocale === "hu" || storedLocale === "en" ? storedLocale : "en";
  } catch {
    return "en";
  }
}

export function savePresentationLocale(
  locale: UiLocale,
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(UI_LOCALE_STORAGE_KEY, locale);
  } catch {
    // A nyelvváltás tárolás nélkül is maradjon használható az aktuális munkamenetben.
  }
}
