import { Button } from "../components/Button.js";
import { PostCard } from "../components/PostCard.js";
import { createPost, listPosts, samplePosts, togglePostLike } from "../supabase.js";
import { formDataToObject } from "../utils.js";

export const Feed = {
  async render(ctx) {
    const postsFromDatabase = await listPosts(ctx.user.id);
    const posts = postsFromDatabase.length ? postsFromDatabase : samplePosts;
    ctx.currentPosts = posts;

    const sampleNote = postsFromDatabase.length ? "" : `
      <div class="setup-note">
        <strong>Feed inicial simulado.</strong>
        <span>O banco ainda não tem posts, então o Retrobooks mostra algumas reflexões de exemplo até a primeira publicação real.</span>
      </div>
    `;

    return `
      <section class="dashboard-layout">
        <div class="content-column">
          <div class="page-intro">
            <p class="eyebrow">Feed literário</p>
            <h1>Reflexões da comunidade</h1>
            <p>Escreva sobre o livro que está em suas mãos agora e encontre leitores que reconhecem a mesma luz entre as páginas.</p>
          </div>

          <section class="paper-card composer">
            <h2>Nova reflexão</h2>
            <form class="stacked-form" data-post-form>
              <label for="book-title">Livro relacionado</label>
              <input id="book-title" name="book_title" type="text" placeholder="Crime e Castigo" required>

              <label for="content">Reflexão</label>
              <textarea id="content" name="content" rows="5" placeholder="Escreva o que este trecho abriu em você." required></textarea>

              ${Button({ label: "Publicar reflexão", type: "submit", variant: "primary" })}
            </form>
          </section>

          ${sampleNote}

          <section class="post-list" aria-label="Posts literários">
            ${posts.map((post) => PostCard(post, ctx.state.savedPosts.has(post.id))).join("")}
          </section>
        </div>

        <aside class="side-panel">
          <h2>Ritual de leitura</h2>
          <ul class="quiet-list">
            <li>Publique uma reflexão breve sobre o livro atual.</li>
            <li>Curta posts para marcar afinidade literária.</li>
            <li>Salve textos que merecem voltar depois.</li>
            <li>Entre em tribos para conversas mais profundas.</li>
          </ul>
        </aside>
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

        if (post.is_sample) {
          ctx.toast("Este é um post simulado. Publique o primeiro post real para curtir no banco.");
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
        ctx.toast("Estado de salvamento atualizado neste navegador.");
      });
    });
  }
};
