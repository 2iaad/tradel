"use client";

// Importing the home script here puts it in the page's initial script graph,
// so it initializes before the window load event — same timing as the
// deferred module script it replaced. The script guards itself against
// running twice and skips execution during server rendering.
import "../scripts/home";

export function HomeInit() {
  return null;
}
