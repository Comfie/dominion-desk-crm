'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

/**
 * Component that ensures the theme always follows system preferences
 * This runs on mount and ensures localStorage theme is set to "system"
 */
export function SystemThemeEnforcer() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Clear any non-system theme from localStorage on mount
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && storedTheme !== 'system' && storedTheme !== '"system"') {
      localStorage.setItem('theme', 'system');
      setTheme('system');
    } else if (!storedTheme) {
      // If no theme is stored, set it to system
      localStorage.setItem('theme', 'system');
      setTheme('system');
    }

    // Listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // When system theme changes, ensure we're using system theme
      const currentStoredTheme = localStorage.getItem('theme');
      if (currentStoredTheme !== 'system') {
        localStorage.setItem('theme', 'system');
        setTheme('system');
      }
    };

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
