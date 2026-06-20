import { escapeHtml } from "../utils.js";

export function Button({ label, href = "", variant = "primary", type = "button", className = "", attrs = "" }) {
  const classes = `btn btn-${variant} ${className}`.trim();

  if (href) {
    return `<a class="${classes}" href="${href}" data-link ${attrs}>${escapeHtml(label)}</a>`;
  }

  return `<button class="${classes}" type="${type}" ${attrs}>${escapeHtml(label)}</button>`;
}
