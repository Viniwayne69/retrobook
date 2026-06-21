import { Header } from "./components/Header.js";
import { Home } from "./pages/Home.js";
import { Login } from "./pages/Login.js";
import { Register } from "./pages/Register.js";
import { Feed } from "./pages/Feed.js";
import { Tribes } from "./pages/Tribes.js";
import { TribeDetails } from "./pages/TribeDetails.js";
import { Author } from "./pages/Author.js";
import { Discussion } from "./pages/Discussion.js";
import { Profile } from "./pages/Profile.js";
import { Publish } from "./pages/Publish.js";
import { Search } from "./pages/Search.js";
import { Messages } from "./pages/Messages.js";
import { getProfile, getSession, hasSupabaseConfig, signOutUser, supabase } from "./supabase.js";
import { escapeHtml } from "./utils.js";

const app = document.querySelector("#app");

const routes = [
  { pattern: /^\/$/, page: Home, public: true, redirectIfAuth: true },
  { pattern: /^\/login\/?$/, page: Login, public: true, redirectIfAuth: true },
  { pattern: /^\/cadastro\/?$/, page: Register, public: true, redirectIfAuth: true },
  { pattern: /^\/register\/?$/, page: Register, public: true, redirectIfAuth: true },
  { pattern: /^\/feed\/?$/, page: Feed, protected: true },
  { pattern: /^\/publicar\/?$/, page: Publish, protected: true },
  { pattern: /^\/pesquisar\/?$/, page: Search, protected: true },
  { pattern: /^\/mensagens\/?$/, page: Messages, protected: true },
  { pattern: /^\/tribos\/?$/, page: Tribes, protected: true },
  { pattern: /^\/tribos\/([^/]+)\/?$/, page: TribeDetails, protected: true, params: ["slug"] },
  { pattern: /^\/autor\/?$/, page: Author, protected: true },
  { pattern: /^\/discussao\/?$/, page: Discussion, protected: true },
  { pattern: /^\/discussao\/([^/]+)\/?$/, page: Discussion, protected: true, params: ["id"] },
  { pattern: /^\/perfil\/?$/, page: Profile, protected: true },
  { pattern: /^\/perfil\/([^/]+)\/?$/, page: Profile, protected: true, params: ["id"] }
];

const state = {
  session: null,
  user: null,
  profile: null,
  savedPosts: loadSavedPosts()
};

export async function initRouter() {
  await syncAuth();
  bindGlobalEvents();

  if (supabase) {
    supabase.auth.onAuthStateChange(async () => {
      await syncAuth();
      await renderRoute();
    });
  }

  await renderRoute();
}

export function navigate(path) {
  window.history.pushState({}, "", path);
  renderRoute();
}

async function syncAuth() {
  state.session = await getSession();
  state.user = state.session?.user || null;
  state.profile = state.user ? await getProfile(state.user.id) : null;
}

function currentPath() {
  const path = window.location.pathname.replace(/\/index.html$/, "/");
  return path || "/";
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.pattern);

    if (match) {
      const params = {};
      (route.params || []).forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });

      return { ...route, params };
    }
  }

  return null;
}

async function renderRoute() {
  const path = currentPath();
  const route = matchRoute(path);

  if (!route) {
    app.innerHTML = layout(`<section class="empty-state"><h1>Página não encontrada</h1><p>Este corredor da biblioteca ainda não existe.</p></section>`, path);
    bindShellEvents();
    return;
  }

  if (route.redirectIfAuth && state.user) {
    navigate("/feed");
    return;
  }

  if (route.protected && !state.user) {
    window.history.replaceState({}, "", "/login");
    await renderRoute();
    toast("Entre na sua conta para acessar essa área do Retrobook.");
    return;
  }

  const ctx = createContext(route.params || {});

  try {
    app.innerHTML = layout(`<section class="loading-state"><span></span><p>Abrindo a biblioteca...</p></section>`, path);
    bindShellEvents();

    const content = await route.page.render(ctx);
    app.innerHTML = layout(content, currentPath());
    bindShellEvents();
    await route.page.afterRender?.(ctx);
  } catch (error) {
    app.innerHTML = layout(`
      <section class="empty-state">
        <p class="eyebrow">Algo saiu do lugar</p>
        <h1>Não foi possível carregar esta página</h1>
        <p>${escapeHtml(error.message || "Tente novamente em alguns instantes.")}</p>
      </section>
    `, currentPath());
    bindShellEvents();
  }
}

function layout(content, path) {
  const theme = state.user ? "social-shell" : "theme-light";
  const isAuthRoute = path === "/login" || path === "/cadastro" || path === "/register";

  return `
    <div class="app-shell ${theme} ${isAuthRoute ? "auth-shell" : ""}">
      ${isAuthRoute ? "" : Header({ user: state.user, profile: state.profile, path })}
      <main class="app-main">${content}</main>
      <div class="toast" role="status" aria-live="polite"></div>
    </div>
  `;
}

function createContext(params) {
  return {
    params,
    state,
    user: state.user,
    profile: state.profile,
    hasSupabaseConfig,
    navigate,
    toast,
    refresh: async () => {
      await syncAuth();
      await renderRoute();
    },
    toggleSavedPost: (postId) => {
      if (state.savedPosts.has(postId)) {
        state.savedPosts.delete(postId);
      } else {
        state.savedPosts.add(postId);
      }

      saveSavedPosts(state.savedPosts);
      renderRoute();
    }
  };
}

function bindGlobalEvents() {
  window.addEventListener("popstate", renderRoute);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-link]");

    if (!link) {
      return;
    }

    const url = new URL(link.href);
    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    navigate(url.pathname);
  });
}

function bindShellEvents() {
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector(".main-nav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
  }

  const logout = document.querySelector("[data-logout]");
  if (logout) {
    logout.addEventListener("click", async () => {
      await signOutUser();
      await syncAuth();
      navigate("/login");
      toast("Você saiu do Retrobook.");
    });
  }
}

function toast(message) {
  const element = document.querySelector(".toast");

  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.add("is-visible");

  window.clearTimeout(toast.timeout);
  toast.timeout = window.setTimeout(() => {
    element.classList.remove("is-visible");
  }, 3400);
}

function loadSavedPosts() {
  try {
    return new Set(JSON.parse(localStorage.getItem("retrobooks:savedPosts") || "[]"));
  } catch {
    return new Set();
  }
}

function saveSavedPosts(posts) {
  localStorage.setItem("retrobooks:savedPosts", JSON.stringify([...posts]));
}
