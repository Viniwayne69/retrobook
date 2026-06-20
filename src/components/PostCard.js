import { escapeHtml, formatDate, initials } from "../utils.js";

export function PostCard(post, saved = false) {
  const author = post.profiles?.name || "Leitor Retrobooks";
  const username = post.profiles?.username || "leitor";
  const likedClass = post.user_liked ? " is-active" : "";
  const savedClass = saved ? " is-active" : "";

  return `
    <article class="post-card clean-post" data-post-card="${escapeHtml(post.id)}">
      <header class="clean-post-header">
        <div class="post-author">
          <div class="avatar">${escapeHtml(initials(author))}</div>
          <div>
            <h3>${escapeHtml(author)}</h3>
            <p>@${escapeHtml(username)} · ${formatDate(post.created_at)}</p>
          </div>
        </div>
        <span class="book-chip">${escapeHtml(post.book_title)}</span>
      </header>

      <p class="clean-post-content">${escapeHtml(post.content)}</p>

      <footer class="clean-post-actions">
        <button class="icon-action${likedClass}" type="button" data-like-post="${escapeHtml(post.id)}" aria-pressed="${post.user_liked ? "true" : "false"}">
          <span>Curtir</span>
          <strong>${post.likes_count || 0}</strong>
        </button>
        <button class="icon-action${savedClass}" type="button" data-save-post="${escapeHtml(post.id)}" aria-pressed="${saved ? "true" : "false"}">
          <span>${saved ? "Salvo" : "Salvar"}</span>
        </button>
      </footer>
    </article>
  `;
}
