import { Button } from "../components/Button.js";
import { PostCard } from "../components/PostCard.js";
import { createPost, listPosts, togglePostLike } from "../supabase.js";
import { escapeHtml, formDataToObject } from "../utils.js";

export const Feed = {
  async render(ctx) {
    const posts = await listPosts(ctx.user.id);
    ctx.currentPosts = posts;

    const currentBook = ctx.profile?.current_book?.trim();
    const profileHint = currentBook
      ? `<span class="feed-profile-pill">Livro atual: ${escapeHtml(currentBook)}</span>`
      : `<a class="feed-profile-pill" href="/perfil" data-link>Adicionar livro atual no perfil</a>`;

    const postList = posts.length
      ? posts.map((post) => PostCard(post, ctx.state.savedPosts.has(post.id))).join("")
      : `
        <section class="empty-feed">
          <h2>Nenhuma reflexão publicada ainda</h2>
          <p>Quando você ou outros leitores publicarem algo, os posts aparecerão aqui. Por enquanto, o feed está limpo porque não há conteúdo real no banco.</p>
        </section>
      `;

    return `
      <section class="feed-minimal">
        <header class="feed-minimal-header">
          <div>
            <p class="eyebrow">Feed literário</p>
            <h1>Reflexões</h1>
            <p>Publique pensamentos sobre livros e acompanhe apenas conteúdos reais da comunidade.</p>
          </div>

          <div class="feed-header-meta">
            ${profileHint}
            <span class="feed-profile-pill">${posts.length} ${posts.length === 1 ? "post" : "posts"}</span>
          </div>
        </header>

        <section class="feed-composer">
          <form class="composer-form" data-post-form>
            <label for="book-title">Livro</label>
            <input id="book-title" name="book_title" type="text" placeholder="Digite o livro relacionado" value="${escapeHtml(currentBook || "")}" required>

            <label for="content">Reflexão</label>
            <textarea id="content" name="content" rows="4" placeholder="Escreva sua reflexão de leitura" required></textarea>

            <div class="composer-actions">
              <span>Seu post será salvo no Supabase e aparecerá no feed.</span>
              ${Button({ label: "Publicar", type: "submit", variant: "primary" })}
            </div>
          </form>
        </section>

        <section class="post-list minimal-post-list" aria-label="Posts literários">
          ${postList}
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
        ctx.toast("Sua reflexão entrou no feed.");
        await ctx.refresh();
      } catch (error) {
        ctx.toast(error.message || "Não foi possível publicar.");
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
          ctx.toast(error.message || "Não foi possível curtir este post.");
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
