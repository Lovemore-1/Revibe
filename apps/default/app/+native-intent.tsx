/**
 * Returning null prevents the Expo Router sandbox from intercepting
 * Universal Links / deep links that should be handled elsewhere.
 */
export function handleURL(): null {
  return null;
}
