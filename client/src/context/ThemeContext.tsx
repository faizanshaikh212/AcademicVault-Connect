// In client/src/context/ThemeContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the shape of your context
interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use the theme context easily
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// The provider component that does all the work
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state by reading from localStorage, defaulting to 'system'
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "system";
    }
    return "system";
  });

  // This useEffect hook runs whenever the 'theme' state changes.
  // It's responsible for applying the .dark class to the <html> element.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // If theme is 'system', check the OS preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      // Otherwise, use the chosen theme
      root.classList.add(theme);
    }
  }, [theme]); // Re-run this effect when the theme changes

  const setTheme = (newTheme: string) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  };

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
