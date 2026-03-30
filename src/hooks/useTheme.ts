import { useAppContext } from "@/context/AppContext";

/** Returns the global dark mode state and toggle action. */
export function useTheme() {
  const { isDarkMode, toggleDarkMode } = useAppContext();

  return { isDarkMode, toggleDarkMode };
}
