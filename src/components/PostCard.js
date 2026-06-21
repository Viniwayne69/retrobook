import { escapeHtml, formatDate, initials } from "../utils.js";

export function PostCard(post, saved = false) {
  const profile = post.profiles || {};
  const book = post.books || {};
  const author = profile.name || "Leitor Retrobook";
  const username = profile.username || "leitor";
  const bookTitle = book.title || post.book_title || profile.current_book || "";
  const likedClass = post.user_liked ? " is-active" : "";
  const savedClass = saved ? " is-active" : "";
  const image = post.image_url ? `
    <img class="post-image" src="${escapeHtml(post.image_url)}" alt="Imagem anexada ao post">
  ` : "";
  const avatar = profile.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="">`
    : `<span>${escapeHtml(initials(author))}</span>`;
  const authorLine = bookTitle
    ? `${escapeHtml(author)} está lendo ${escapeHtml(bookTitle)}`
    : `${escapeHtml(author)} compartilhou uma leitura`;
  const authorName = post.author_name || book.author
    ? `<span class="post-meta-dot">Autor: ${escapeHtml(post.author_name || book.author)}</span>`
    : "";
  const content = String(post.content || "").trim()
    ? `<p class="post-content">${escapeHtml(post.content)}</p>`
    : "";

  return `
    <article class="social-post app-card" data-post-card="${escapeHtml(post.id)}">
      <header class="social-post-header">
        <a class="post-avatar" href="/perfil/${escapeHtml(post.user_id)}" data-link>${avatar}</a>
        <div class="post-author-copy">
          <strong>${escapeHtml(author)}</strong>
          <span>@${escapeHtml(username)} · ${formatDate(post.created_at)}</span>
        </div>
      </header>

      <p class="reading-line">${authorLine}</p>
      ${content}
      ${image}

      <div class="post-meta-row">
        <span>${escapeHtml(bookTitle || "Livro não informado")}</span>
        ${authorName}
      </div>

      <footer class="social-post-actions">
        <button class="icon-action${likedClass}" type="button" data-like-post="${escapeHtml(post.id)}" aria-pressed="${post.user_liked ? "true" : "false"}">
          ${Icon("heart")}
          <span>Curtir</span>
          <strong>${post.likes_count || 0}</strong>
        </button>
        <button class="icon-action" type="button" data-comment-post="${escapeHtml(post.id)}">
          ${Icon("comment")}
          <span>Comentar</span>
        </button>
        <button class="icon-action" type="button" data-converse-post="${escapeHtml(post.id)}">
          ${Icon("message")}
          <span>Conversar</span>
        </button>
        <button class="icon-action bookmark${savedClass}" type="button" data-save-post="${escapeHtml(post.id)}" aria-pressed="${saved ? "true" : "false"}">
          ${Icon("bookmark")}
          <span>${saved ? "Salvo" : "Salvar"}</span>
        </button>
      </footer>
    </article>
  `;
}

function Icon(name) {
  const icons = {
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 8.6c0 5.4-8.5 10.2-8.5 10.2S3.5 14 3.5 8.6A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.5 2.1Z"></path></svg>`,
    comment: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H8l-3 3V5Z"></path><path d="M8 9h8"></path><path d="M8 12h5"></path></svg>`,
    message: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v11H7l-3 3V6Z"></path><path d="M8 10h8"></path><path d="M8 13h5"></path></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-3-5 3V4Z"></path></svg>`
  };

  return icons[name] || "";
}
