import { escapeHtml, formatDate, initials } from "../utils.js";

export function PostCard(post, saved = false) {
  const author = post.profiles?.name || "Leitor Retrobook";
  const username = post.profiles?.username || "leitor";
  const likedClass = post.user_liked ? " is-active" : "";
  const savedClass = saved ? " is-active" : "";
  const bookTitle = post.book_title || "Livro";

  return `
    <article class="feed-card book-card app-card" data-post-card="${escapeHtml(post.id)}">
      <header class="feed-card-header">
        <div class="post-author">
          <div class="reader-avatar small">${escapeHtml(initials(author))}</div>
          <div>
            <h3>${escapeHtml(author)}</h3>
            <p>@${escapeHtml(username)} publicou uma reflexao</p>
          </div>
        </div>
        <button class="icon-only" type="button" aria-label="Mais opcoes">
          <span></span><span></span><span></span>
        </button>
      </header>

      <div class="book-card-body no-cover">
        <div class="book-copy">
          <span class="book-chip">${escapeHtml(bookTitle)}</span>
          <p>${escapeHtml(post.content)}</p>
        </div>
      </div>

      <footer class="feed-card-actions">
        <button class="icon-action${likedClass}" type="button" data-like-post="${escapeHtml(post.id)}" aria-pressed="${post.user_liked ? "true" : "false"}">
          ${Icon("heart")}
          <strong>${post.likes_count || 0}</strong>
        </button>
        <span class="post-date">${formatDate(post.created_at)}</span>
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
    bookmark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-3-5 3V4Z"></path></svg>`
  };

  return icons[name] || "";
}
