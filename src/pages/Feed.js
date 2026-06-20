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
      <div class="feed-note">
        <strong>Primeiras páginas abertas</strong>
        <span>Enquanto a comunidade cresce, o Retrobooks mostra algumas reflexões de exemplo para deixar o salão vivo.</span>
      </div>
    `;

    return `
      <section class="feed-shell">
        <header class="feed-masthead">
          <div>
            <p class="eyebrow">Feed literário</p>
            <h1>Reflexões da comunidade</h1>
            <p>Publique uma leitura, encontre ecos em outros leitores e acompanhe conversas que nascem entre livros.</p>
          </div>

          <div class="feed-stats" aria-label="Resumo do feed">
            <article>
              <strong>${posts.length}</strong>
              <span>posts agora</span>
            </article>
            <article>
              <strong>6</strong>
              <span>tribos ativas</span>
            </article>
            <article>
              <strong>24</strong>
              <span>leitores online</span>
            </article>
          </div>
        </header>

        <section class="feed-layout">
          <aside class="left-rail" aria-label="Navegação literária">
            <div class="rail-card">
              <span class="mini-label">Sua estante</span>
              <h2>${ctx.profile?.current_book || "Livro atual"}</h2>
              <p>${ctx.profile?.favorite_author ? `Autor favorito: ${ctx.profile.favorite_author}` : "Complete seu perfil para receber encontros melhores."}</p>
            </div>

            <nav class="feed-tabs" aria-label="Filtros do feed">
              <button class="is-active" type="button">Todos</button>
              <button type="button">Meus livros</button>
              <button type="button">Minhas tribos</button>
              <button type="button">Populares</button>
            </nav>
          </aside>

          <div class="feed-center">
            <section class="composer composer-compact">
              <div class="composer-heading">
                <div class="avatar">${(ctx.profile?.name || "Leitor").slice(0, 2).toUpperCase()}</div>
                <div>
                  <h2>Nova reflexão</h2>
                  <p>Escreva uma nota breve, como uma anotação na margem de um livro.</p>
                </div>
              </div>

              <form class="composer-form" data-post-form>
                <input id="book-title" name="book_title" type="text" placeholder="Livro relacionado, exemplo: Crime e Castigo" required>
                <textarea id="content" name="content" rows="3" placeholder="O que essa leitura abriu em você?" required></textarea>
                <div class="composer-actions">
                  <span>Reflexões curtas funcionam melhor no feed.</span>
                  ${Button({ label: "Publicar", type: "submit", variant: "primary" })}
                </div>
              </form>
            </section>

            ${sampleNote}

            <section class="post-list" aria-label="Posts literários">
              ${posts.map((post) => PostCard(post, ctx.state.savedPosts.has(post.id))).join("")}
            </section>
          </div>

          <aside class="right-rail" aria-label="Atividade literária">
            <section class="rail-card dark-rail">
              <span class="mini-label">Ao vivo</span>
              <h2>Salão aberto</h2>
              <p>Leitores estão comentando Dostoiévski, Machado, Woolf e poesia brasileira neste momento.</p>
            </section>

            <section class="rail-card">
              <h2>Tribos em destaque</h2>
              <ul class="activity-list">
                <li>
                  <strong>Tribo Dostoiévski</strong>
                  <span>128 comentários hoje</span>
                </li>
                <li>
                  <strong>Clube Machado de Assis</strong>
                  <span>42 leitores ativos</span>
                </li>
                <li>
                  <strong>Poesia e Devaneios</strong>
                  <span>18 novas notas</span>
                </li>
              </ul>
            </section>

            <section class="rail-card">
              <h2>Lendo agora</h2>
              <div class="book-stack-list">
                <span>Crime e Castigo</span>
                <span>Dom Casmurro</span>
                <span>O Idiota</span>
                <span>Mrs. Dalloway</span>
              </div>
            </section>
          </aside>
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
