import { Button } from "../components/Button.js";
import { createPost, saveBookFromOpenLibrary, searchBooks, uploadPostImage } from "../supabase.js";
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
            <p>Publique uma reflexão, uma imagem da leitura ou uma pergunta que mereça conversa.</p>
          </div>
        </header>

        <form class="publish-card app-card" data-publish-form>
          <label for="content">O que você quer dizer?</label>
          <textarea id="content" name="content" rows="7" placeholder="Escreva sua reflexão sobre o livro que está lendo."></textarea>

          <div class="book-linker">
            <label for="book-query">Livro relacionado</label>
            <div class="search-row">
              <input id="book-query" name="book_query" type="search" value="${escapeHtml(currentBook)}" placeholder="Busque o livro pelo título ou autor">
              <button class="btn btn-secondary secondary-button" type="button" data-post-book-search>Buscar livro</button>
            </div>
            <input name="book_title" type="hidden" value="${escapeHtml(currentBook)}" data-post-book-title>
            <input name="book_id" type="hidden" data-post-book-id>
            <div class="selected-book" data-selected-book>${currentBook ? `Livro selecionado: ${escapeHtml(currentBook)}` : "Nenhum livro selecionado ainda."}</div>
            <div class="book-results" data-post-book-results></div>
          </div>

          <div>
            <label for="author-name">Autor opcional</label>
            <input id="author-name" name="author_name" type="text" placeholder="Nome do autor">
          </div>

          <div>
            <label for="post-image">Imagem opcional</label>
            <input id="post-image" name="image_file" type="file" accept="image/jpeg,image/png,image/webp">
            <div class="image-preview" data-image-preview hidden></div>
          </div>

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
    const imageInput = form?.querySelector("[name='image_file']");
    const preview = document.querySelector("[data-image-preview]");
    ctx.postBookResults = [];

    bindPostBookSearch(ctx);

    imageInput?.addEventListener("change", () => {
      const file = imageInput.files?.[0];

      if (!file) {
        preview.hidden = true;
        preview.innerHTML = "";
        return;
      }

      const url = URL.createObjectURL(file);
      preview.hidden = false;
      preview.innerHTML = `<img src="${url}" alt="Prévia da imagem selecionada">`;
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        const file = imageInput?.files?.[0] || null;

        if (!String(payload.content || "").trim() && !file) {
          ctx.toast("Escreva uma reflexão ou adicione uma imagem.");
          return;
        }

        if (!payload.book_title && payload.book_query) {
          payload.book_title = payload.book_query;
        }

        payload.image_url = file ? await uploadPostImage(file, ctx.user.id) : "";
        await createPost(ctx.user.id, payload);
        ctx.toast("Sua publicação entrou no feed.");
        ctx.navigate("/feed");
      } catch (error) {
        ctx.toast(error.message || "Não foi possível publicar.");
      }
    });
  }
};

function bindPostBookSearch(ctx) {
  const button = document.querySelector("[data-post-book-search]");
  const input = document.querySelector("[name='book_query']");
  const results = document.querySelector("[data-post-book-results]");

  button?.addEventListener("click", async () => {
    try {
      results.innerHTML = `<div class="muted-result">Buscando livros...</div>`;
      ctx.postBookResults = await searchBooks(input.value);
      results.innerHTML = ctx.postBookResults.length
        ? ctx.postBookResults.map((book, index) => BookChoice(book, index)).join("")
        : `<div class="muted-result">Nenhum livro encontrado.</div>`;
      bindPostBookChoices(ctx);
    } catch (error) {
      results.innerHTML = `<div class="muted-result">${escapeHtml(error.message || "Não foi possível buscar livros.")}</div>`;
    }
  });
}

function bindPostBookChoices(ctx) {
  document.querySelectorAll("[data-choose-post-book]").forEach((button) => {
    button.addEventListener("click", async () => {
      const book = ctx.postBookResults[Number(button.dataset.choosePostBook)];

      if (!book) {
        return;
      }

      try {
        const savedBook = await saveBookFromOpenLibrary(book);
        document.querySelector("[data-post-book-title]").value = savedBook.title;
        document.querySelector("[data-post-book-id]").value = savedBook.id;
        document.querySelector("[data-selected-book]").textContent = `Livro selecionado: ${savedBook.title}`;
        document.querySelector("[data-post-book-results]").innerHTML = "";
      } catch (error) {
        ctx.toast(error.message || "Não foi possível selecionar este livro.");
      }
    });
  });
}

function BookChoice(book, index) {
  const cover = book.cover_url
    ? `<img src="${escapeHtml(book.cover_url)}" alt="">`
    : `<span>${escapeHtml((book.title || "L").slice(0, 1))}</span>`;

  return `
    <article class="book-result">
      <div class="book-cover-mini">${cover}</div>
      <div>
        <strong>${escapeHtml(book.title)}</strong>
        <span>${escapeHtml(book.author || "Autor não informado")}</span>
      </div>
      <button class="btn btn-primary primary-button" type="button" data-choose-post-book="${index}">Selecionar</button>
    </article>
  `;
}
