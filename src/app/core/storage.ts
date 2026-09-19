/**
 * localStorage is unavailable during prerendering and can throw in private
 * windows, so every access goes through here and degrades to "no preference".
 */
export const readStored = (key: string): string | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStored = (key: string, value: string): void => {
  try {
    localStorage?.setItem(key, value);
  } catch {
    // Storage full, blocked, or prerendering: the app works without it.
  }
};
