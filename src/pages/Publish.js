import { Button } from "../components/Button.js";
import { createPost } from "../supabase.js";
import { escapeHtml, formDataToObject } from "../utils.js";

export const Publish = {
  async render(ctx) {
    const currentBook = ctx.profile?.current_book || "";

    return `
      <section class="publish-page">
        <header class="social-page-head">
          <div>
            <p class="eyebrow">Publicar</p>
            <h1>Compartilhe uma leitura.</h1>
            <p>Escreva como quem deixa uma anotação na margem de um livro.</p>
          </div>
        </header>

        <form class="publish-card app-card" data-publish-form>
          <label for="content">O que você quer dizer?</label>
          <textarea id="content" name="content" rows="7" placeholder="Escreva sua reflexão sobre o livro que está lendo." required></textarea>

          <div class="two-columns">
            <div>
              <label for="book-title">Livro relacionado</label>
              <input id="book-title" name="book_title" type="text" value="${escapeHtml(currentBook)}" placeholder="Nome do livro" required>
            </div>

            <div>
              <label for="author-name">Autor opcional</label>
              <input id="author-name" name="author_name" type="text" placeholder="Nome do autor">
            </div>
          </div>

          <label for="image-url">Foto opcional</label>
          <input id="image-url" name="image_url" type="url" placeholder="Cole a URL de uma imagem">

          <div class="publish-actions">
            <a class="btn btn-secondary secondary-button" href="/feed" data-link>Cancelar</a>
            ${Button({ label: "Publicar no feed", type: "submit", variant: "primary" })}
          </div>
        </form>
      </section>
    `;
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-publish-form]");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        await createPost(ctx.user.id, payload);
        ctx.toast("Sua publicação entrou no feed.");
        ctx.navigate("/feed");
      } catch (error) {
        ctx.toast(error.message || "Não foi possível publicar.");
      }
    });
  }
};
