import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform, StatusBar, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  darkColors,
  darkGradients,
  lightColors,
  lightGradients,
  type ThemeColors,
  type ThemeGradients,
} from "./revibe-theme";

export type ThemePreference = "system" | "light" | "dark";
export type ThemeScheme = "light" | "dark";

const STORAGE_KEY = "revibe.themePreference";

async function loadPreference(): Promise<ThemePreference | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? globalThis.localStorage?.getItem(STORAGE_KEY)
        : await SecureStore.getItemAsync(STORAGE_KEY);
    return raw === "light" || raw === "dark" || raw === "system" ? raw : null;
  } catch {
    return null;
  }
}

function savePreference(preference: ThemePreference) {
  try {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(STORAGE_KEY, preference);
    } else {
      void SecureStore.setItemAsync(STORAGE_KEY, preference);
    }
  } catch {
    // Persisting the preference is best-effort.
  }
}

type ThemeContextValue = {
  colors: ThemeColors;
  gradients: ThemeGradients;
  scheme: ThemeScheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  gradients: lightGradients,
  scheme: "light",
  preference: "system",
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let mounted = true;
    loadPreference().then((stored) => {
      if (mounted && stored) setPreferenceState(stored);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    savePreference(next);
  }, []);

  const scheme: ThemeScheme =
    preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === "dark" ? darkColors : lightColors,
      gradients: scheme === "dark" ? darkGradients : lightGradients,
      scheme,
      preference,
      setPreference,
    }),
    [scheme, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Memoized themed StyleSheet helper.
 *
 *   const makeStyles = (colors: ThemeColors) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
