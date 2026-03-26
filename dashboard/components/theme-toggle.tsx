"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "td-theme";

function readInitialDark(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  try {
    window.localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readInitialDark();
    setDark(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyTheme(dark);
  }, [dark, ready]);

  return (
    <button
      type="button"
      className="td-theme-toggle"
      onClick={() => setDark((d) => !d)}
      disabled={!ready}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className="td-theme-toggle-track" aria-hidden>
        <span className="td-theme-toggle-knob" data-on={dark ? "true" : "false"} />
      </span>
      <span className="td-theme-toggle-text">{dark ? "Dark" : "Light"}</span>
    </button>
  );
}
