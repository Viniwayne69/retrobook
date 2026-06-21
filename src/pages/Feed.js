import { PostCard } from "../components/PostCard.js";
import { listPosts, listRecentDiscussions, togglePostLike } from "../supabase.js";
import { escapeHtml } from "../utils.js";

export const Feed = {
  async render(ctx) {
    const [posts, discussions] = await Promise.all([
      listPosts(ctx.user.id),
      listRecentDiscussions(3)
    ]);
    ctx.currentPosts = posts;

    const name = getFirstName(ctx.profile?.name || ctx.user?.email || "leitor");
    const currentBook = ctx.profile?.current_book?.trim();
    const postList = posts.length
      ? posts.map((post) => PostCard(post, ctx.state.savedPosts.has(post.id))).join("")
      : `
        <section class="social-empty app-card">
          <h2>O feed ainda esta em silencio</h2>
          <p>Quando voce ou outros leitores publicarem reflexoes reais, elas aparecem aqui.</p>
          <a class="btn btn-primary primary-button" href="/publicar" data-link>Publicar agora</a>
        </section>
      `;

    const discussionsHtml = discussions.length
      ? discussions.map((discussion) => `
          <a class="compact-thread app-card" href="/discussao/${escapeHtml(discussion.id)}" data-link>
            <strong>${escapeHtml(discussion.title)}</strong>
            <span>${escapeHtml(discussion.tribes?.name || discussion.book_title || "Discussao literaria")}</span>
          </a>
        `).join("")
      : `<div class="compact-thread muted app-card">Nenhuma discussao ativa por enquanto.</div>`;

    return `
      <section class="social-layout">
        <div class="social-feed-column">
          <header class="social-page-head">
            <div>
              <p class="eyebrow">Feed</p>
              <h1>${getGreeting()}, ${escapeHtml(name)}.</h1>
              <p>Pessoas se conectam pelos livros que estao lendo.</p>
            </div>
            <a class="btn btn-primary primary-button" href="/publicar" data-link>Publicar</a>
          </header>

          ${currentBook ? `
            <section class="reading-status app-card">
              <span>Voce esta lendo</span>
              <strong>${escapeHtml(currentBook)}</strong>
            </section>
          ` : `
            <section class="reading-status app-card">
              <span>Seu perfil ainda nao informa um livro atual</span>
              <a href="/perfil" data-link>Adicionar no perfil</a>
            </section>
          `}

          <div class="post-list social-post-list">
            ${postList}
          </div>
        </div>

        <aside class="social-side-column">
          <section class="side-widget app-card">
            <h2>Pesquisar</h2>
            <p>Encontre leitores pelo ID ou clubes pelo nome.</p>
            <a class="secondary-button btn btn-secondary full" href="/pesquisar" data-link>Abrir pesquisa</a>
          </section>

          <section class="side-widget app-card">
            <h2>Discussoes ativas</h2>
            <div class="compact-list">
              ${discussionsHtml}
            </div>
          </section>
        </aside>
      </section>
    `;
  },

  async afterRender(ctx) {
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

    document.querySelectorAll("[data-comment-post]").forEach((button) => {
      button.addEventListener("click", () => {
        ctx.toast("Comentarios por post entram na proxima evolucao do banco.");
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
  return String(name).split(" ")[0] || "leitor";
}
