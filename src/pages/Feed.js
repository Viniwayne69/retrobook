import { Button } from "../components/Button.js";
import { PostCard } from "../components/PostCard.js";
import { createPost, listPosts, listRecentDiscussions, togglePostLike } from "../supabase.js";
import { escapeHtml, formDataToObject } from "../utils.js";

const categories = [
  { label: "Classicos", accent: "city" },
  { label: "Poesia", accent: "poetry" },
  { label: "Fantasia", accent: "fantasy" },
  { label: "Nao ficcao", accent: "essay" },
  { label: "Misterio", accent: "mystery" }
];

export const Feed = {
  async render(ctx) {
    const [posts, discussions] = await Promise.all([
      listPosts(ctx.user.id),
      listRecentDiscussions(3)
    ]);
    ctx.currentPosts = posts;

    const currentBook = ctx.profile?.current_book?.trim();
    const name = getFirstName(ctx.profile?.name || ctx.user?.email || "leitor(a)");
    const greeting = `${getGreeting()}, ${escapeHtml(name)}!`;

    const postList = posts.length
      ? posts.map((post) => PostCard(post, ctx.state.savedPosts.has(post.id))).join("")
      : `
        <section class="empty-feed app-card">
          <span class="empty-icon">${Icon("book")}</span>
          <h2>Seu feed ainda esta silencioso</h2>
          <p>Quando voce ou outros leitores publicarem reflexoes reais, elas aparecem aqui. Nada sera preenchido com livros ou posts de enfeite.</p>
        </section>
      `;

    const discussionsHtml = discussions.length
      ? discussions.map((discussion) => `
          <a class="discussion-card mini-discussion" href="/discussao/${escapeHtml(discussion.id)}" data-link>
            <span class="reader-avatar tiny">${escapeHtml(getInitials(discussion.profiles?.name || "Leitor"))}</span>
            <span>
              <strong>${escapeHtml(discussion.title)}</strong>
              <small>${escapeHtml(discussion.tribes?.name || discussion.book_title || "Discussao literaria")}</small>
            </span>
            ${Icon("discussion")}
          </a>
        `).join("")
      : `
        <div class="empty-feed compact">
          <p>Nenhuma discussao ativa por enquanto.</p>
        </div>
      `;

    return `
      <section class="mobile-feed">
        <header class="feed-hero">
          <div>
            <p class="feed-greeting">${greeting}</p>
            <h1>Que tal uma boa leitura hoje?</h1>
          </div>
          <a class="feed-profile-shortcut reader-avatar" href="/perfil" data-link>
            ${escapeHtml(getInitials(ctx.profile?.name || "Leitor"))}
          </a>
        </header>

        <nav class="category-row" aria-label="Categorias literarias">
          ${categories.map((category) => `
            <a class="category-pill ${category.accent}" href="/tribos" data-link>
              <span>${CategoryIcon(category.accent)}</span>
              <small>${category.label}</small>
            </a>
          `).join("")}
        </nav>

        <section class="feed-section">
          <div class="section-heading">
            <h2 class="section-title">Seu feed</h2>
            <a href="/tribos" data-link>Ver tudo</a>
          </div>

          <section class="feed-composer app-card">
            <form class="composer-form" data-post-form>
              <div class="composer-topline">
                <span class="reader-avatar compact">${escapeHtml(getInitials(ctx.profile?.name || "Leitor"))}</span>
                <div>
                  <h3>Nova reflexao</h3>
                  <p>Publique apenas o que voce esta lendo ou pensando agora.</p>
                </div>
              </div>

              <label for="book-title">Livro relacionado</label>
              <input id="book-title" name="book_title" type="text" placeholder="Digite o livro relacionado" value="${escapeHtml(currentBook || "")}" required>

              <label for="content">Reflexao</label>
              <textarea id="content" name="content" rows="4" placeholder="O que essa leitura abriu em voce?" required></textarea>

              <div class="composer-actions">
                ${currentBook ? `<span>Seu perfil informa: ${escapeHtml(currentBook)}</span>` : `<a href="/perfil" data-link>Adicionar livro atual no perfil</a>`}
                ${Button({ label: "Publicar", type: "submit", variant: "primary" })}
              </div>
            </form>
          </section>

          <div class="post-list">
            ${postList}
          </div>
        </section>

        <section class="feed-section discussions-block">
          <div class="section-heading">
            <h2 class="section-title">Discussoes ativas</h2>
            <a href="/discussao" data-link>Ver tudo</a>
          </div>
          <div class="discussion-list compact-list">
            ${discussionsHtml}
          </div>
        </section>
      </section>
    `;
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-post-form]");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        await createPost(ctx.user.id, payload);
        ctx.toast("Sua reflexao entrou no feed.");
        await ctx.refresh();
      } catch (error) {
        ctx.toast(error.message || "Nao foi possivel publicar.");
      }
    });

    document.querySelectorAll("[data-like-post]").forEach((button) => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.likePost;
        const post = ctx.currentPosts.find((item) => item.id === postId);

        if (!post) {
          return;
        }

        try {
          await togglePostLike(ctx.user.id, post);
          await ctx.refresh();
        } catch (error) {
          ctx.toast(error.message || "Nao foi possivel curtir este post.");
        }
      });
    });

    document.querySelectorAll("[data-save-post]").forEach((button) => {
      button.addEventListener("click", () => {
        ctx.toggleSavedPost(button.dataset.savePost);
        ctx.toast("Post salvo neste navegador.");
      });
    });
  }
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Bom dia";
  }

  if (hour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

function getFirstName(name) {
  return String(name).split(" ")[0] || "leitor(a)";
}

function getInitials(name = "Leitor") {
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
    book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"></path><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H20"></path></svg>`,
    discussion: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H8l-3 3V5Z"></path><path d="M8 9h8"></path><path d="M8 12h5"></path></svg>`
  };

  return icons[name] || "";
}

function CategoryIcon(type) {
  const titles = {
    city: "C",
    poetry: "P",
    fantasy: "F",
    essay: "N",
    mystery: "M"
  };

  return titles[type] || "R";
}
