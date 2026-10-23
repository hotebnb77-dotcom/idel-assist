import "@testing-library/jest-dom/vitest";

// jsdom n'implémente pas window.scrollTo
window.scrollTo = (() => {}) as typeof window.scrollTo;
