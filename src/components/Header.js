import { escapeHtml } from "../utils.js";

const navItems = [
  { label: "Feed", path: "/feed", icon: "home" },
  { label: "Pesquisar", path: "/pesquisar", icon: "search" },
  { label: "Publicar", path: "/publicar", icon: "plus" },
  { label: "Mensagens", path: "/mensagens", icon: "messages" },
  { label: "Perfil", path: "/perfil", icon: "profile" }
];

const bottomItems = [
  { label: "Feed", path: "/feed", icon: "home" },
  { label: "Pesquisar", path: "/pesquisar", icon: "search" },
  { label: "Publicar", path: "/publicar", icon: "plus", action: true },
  { label: "Mensagens", path: "/mensagens", icon: "messages" },
  { label: "Perfil", path: "/perfil", icon: "profile" }
];

export function Header({ user, profile, path }) {
  const isAuthed = Boolean(user);
  const name = profile?.name || user?.email || "Leitor";
  const nav = isAuthed
    ? navItems.map((item) => {
        const active = path === item.path || path.startsWith(`${item.path}/`);
        return `
          <a class="${active ? "active" : ""}" href="${item.path}" data-link>
            ${Icon(item.icon)}
            <span>${item.label}</span>
          </a>
        `;
      }).join("")
    : "";

  const actions = isAuthed
    ? `
      <span class="header-user reader-avatar compact" title="${escapeHtml(name)}">${escapeHtml(initialLetters(name))}</span>
      <button class="header-action" type="button" data-logout>Sair</button>
    `
    : `
      <a class="header-action" href="/login" data-link>Entrar</a>
      <a class="header-action accent" href="/cadastro" data-link>Criar conta</a>
    `;

  const bottomNav = isAuthed
    ? `
      <nav class="bottom-nav" aria-label="Navegacao inferior">
        ${bottomItems.map((item) => {
          const active = !item.action && (path === item.path || path.startsWith(`${item.path}/`));
          return `
            <a class="${active ? "active" : ""} ${item.action ? "is-action" : ""}" href="${item.path}" data-link>
              ${Icon(item.icon)}
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `
    : "";

  return `
    <header class="app-header site-header">
      <a class="brand" href="${isAuthed ? "/feed" : "/"}" data-link aria-label="Retrobook">
        <span class="brand-mark">${Icon("leafbook")}</span>
        <span>Retrobook</span>
      </a>

      <button class="nav-toggle" type="button" aria-label="Abrir navegacao" aria-expanded="false" data-menu-toggle>
        ${Icon("menu")}
      </button>

      <button class="header-icon-button" type="button" aria-label="Notificacoes">
        ${Icon("bell")}
      </button>

      <nav class="main-nav" aria-label="Navegacao principal">
        ${nav}
      </nav>

      <div class="header-actions">
        ${actions}
      </div>
    </header>
    ${bottomNav}
  `;
}

function initialLetters(name = "Leitor") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Icon(name) {
  const icons = {
    leafbook: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6.8c4.8 0 7 1.7 7 4.4v7.4c0-2.7-2.2-4.3-7-4.3H3V6.8h2Z"></path>
        <path d="M19 6.8c-4.8 0-7 1.7-7 4.4v7.4c0-2.7 2.2-4.3 7-4.3h2V6.8h-2Z"></path>
        <path d="M14.4 6.7c1-2.2 2.9-3.5 5.6-4.1-.6 2.6-1.9 4.4-4 5.4"></path>
      </svg>
    `,
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9Z"></path></svg>`,
    tribes: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M4 20c.6-3.2 2-5 4-5s3.4 1.8 4 5"></path><path d="M12 20c.6-3.2 2-5 4-5s3.4 1.8 4 5"></path></svg>`,
    book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"></path><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H20"></path></svg>`,
    discussion: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H8l-3 3V5Z"></path><path d="M8 9h8"></path><path d="M8 12h5"></path></svg>`,
    profile: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path><path d="M4 21c.8-4.2 3.4-6.3 8-6.3s7.2 2.1 8 6.3"></path></svg>`,
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z"></path><path d="m16 16 4.4 4.4"></path></svg>`,
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>`,
    messages: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v11H7l-3 3V6Z"></path><path d="M8 10h8"></path><path d="M8 13h6"></path></svg>`,
    menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14"></path><path d="M5 12h14"></path><path d="M5 17h14"></path></svg>`,
    bell: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 10a6 6 0 0 0-12 0c0 4-2 5-2 5h16s-2-1-2-5Z"></path><path d="M9.7 19a2.4 2.4 0 0 0 4.6 0"></path></svg>`
  };

  return icons[name] || "";
}
