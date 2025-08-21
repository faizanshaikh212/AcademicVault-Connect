// In client/src/components/ThemeToggleButton.tsx

import { useState, useEffect } from "react";
import { Lightbulb } from "@theme-toggles/react";
import "@theme-toggles/react/css/Lightbulb.css";

const ThemeToggleButton = () => {
  // 1. Get the initial theme from localStorage or default to 'light'
  const [isToggled, setIsToggled] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // 2. This useEffect hook runs whenever `isToggled` changes.
  //    It is the engine that applies the theme.
  useEffect(() => {
    const root = window.document.documentElement;
    const newTheme = isToggled ? "dark" : "light";

    // Add the correct class to the <html> tag
    root.classList.remove("dark", "light");
    root.classList.add(newTheme);

    // Save the user's choice for the next visit
    localStorage.setItem("theme", newTheme);
  }, [isToggled]); // Re-run this effect when the toggle state changes

  // 3. This function is called when the user clicks the button
  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  return (
    <Lightbulb
      duration={750}
      toggled={isToggled}
      onToggle={handleToggle}
      className="text-3xl pb-1"
    />
  );
};

export default ThemeToggleButton;
