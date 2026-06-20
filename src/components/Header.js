import { escapeHtml } from "../utils.js";

const navItems = [
  { label: "Feed", path: "/feed" },
  { label: "Tribos", path: "/tribos" },
  { label: "Autor", path: "/autor" },
  { label: "Discussão", path: "/discussao" },
  { label: "Perfil", path: "/perfil" }
];

export function Header({ user, profile, path }) {
  const isAuthed = Boolean(user);
  const name = profile?.name || user?.email || "Leitor";
  const nav = isAuthed
    ? navItems.map((item) => {
        const active = path === item.path || path.startsWith(`${item.path}/`);
        return `<a class="${active ? "active" : ""}" href="${item.path}" data-link>${item.label}</a>`;
      }).join("")
    : "";

  const actions = isAuthed
    ? `
      <span class="header-user">${escapeHtml(name)}</span>
      <button class="header-action" type="button" data-logout>Sair</button>
    `
    : `
      <a class="header-action" href="/login" data-link>Entrar</a>
      <a class="header-action accent" href="/cadastro" data-link>Criar conta</a>
    `;

  return `
    <header class="site-header">
      <a class="brand" href="/" data-link aria-label="Retrobooks">
        <span class="brand-mark">R</span>
        <span>Retrobooks</span>
      </a>

      <button class="nav-toggle" type="button" aria-label="Abrir navegação" aria-expanded="false" data-menu-toggle>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="main-nav" aria-label="Navegação principal">
        ${nav}
      </nav>

      <div class="header-actions">
        ${actions}
      </div>
    </header>
  `;
}
