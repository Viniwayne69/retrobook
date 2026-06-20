import { escapeHtml, formatDate, initials } from "../utils.js";

export function PostCard(post, saved = false) {
  const author = post.profiles?.name || "Leitor Retrobooks";
  const username = post.profiles?.username || "leitor";
  const likedClass = post.user_liked ? " is-active" : "";
  const savedClass = saved ? " is-active" : "";
  const sampleAttr = post.is_sample ? "data-sample-post=\"true\"" : "";

  return `
    <article class="post-card rich-post" data-post-card="${escapeHtml(post.id)}">
      <header class="rich-post-header">
        <div class="post-author">
          <div class="avatar">${escapeHtml(initials(author))}</div>
          <div>
            <h3>${escapeHtml(author)}</h3>
            <p>@${escapeHtml(username)} publicou uma nota de leitura</p>
          </div>
        </div>
        <span class="book-chip">${escapeHtml(post.book_title)}</span>
      </header>

      <div class="post-note">
        <span class="quote-mark">“</span>
        <p>${escapeHtml(post.content)}</p>
      </div>

      <div class="post-context">
        <span>${formatDate(post.created_at)}</span>
        <span>Tribo sugerida: leitores de clássicos</span>
      </div>

      <footer class="rich-post-footer">
        <div class="post-actions">
          <button class="icon-action${likedClass}" type="button" data-like-post="${escapeHtml(post.id)}" ${sampleAttr} aria-pressed="${post.user_liked ? "true" : "false"}">
            <span>Curtir</span>
            <strong>${post.likes_count || 0}</strong>
          </button>
          <button class="icon-action" type="button">
            <span>Comentar</span>
            <strong>0</strong>
          </button>
          <button class="icon-action${savedClass}" type="button" data-save-post="${escapeHtml(post.id)}" aria-pressed="${saved ? "true" : "false"}">
            <span>${saved ? "Salvo" : "Salvar"}</span>
          </button>
        </div>
      </footer>
    </article>
  `;
}
