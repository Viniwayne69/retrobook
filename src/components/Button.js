import { escapeHtml } from "../utils.js";

export function Button({ label, href = "", variant = "primary", type = "button", className = "", attrs = "" }) {
  const themeClass = variant === "primary"
    ? "primary-button"
    : variant === "secondary"
      ? "secondary-button"
      : "";
  const classes = `btn btn-${variant} ${themeClass} ${className}`.trim();

  if (href) {
    return `<a class="${classes}" href="${href}" data-link ${attrs}>${escapeHtml(label)}</a>`;
  }

  return `<button class="${classes}" type="${type}" ${attrs}>${escapeHtml(label)}</button>`;
}
