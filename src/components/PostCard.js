import { escapeHtml, formatDate, initials } from "../utils.js";

export function PostCard(post, saved = false) {
  const author = post.profiles?.name || "Leitor Retrobooks";
  const username = post.profiles?.username || "leitor";
  const likedClass = post.user_liked ? " is-active" : "";
  const savedClass = saved ? " is-active" : "";
  const sampleAttr = post.is_sample ? "data-sample-post=\"true\"" : "";

  return `
    <article class="paper-card post-card" data-post-card="${escapeHtml(post.id)}">
      <div class="post-heading">
        <div class="avatar">${escapeHtml(initials(author))}</div>
        <div>
          <h3>${escapeHtml(author)}</h3>
          <p>@${escapeHtml(username)} escrevendo sobre ${escapeHtml(post.book_title)}</p>
        </div>
      </div>

      <p class="post-content">${escapeHtml(post.content)}</p>

      <div class="post-footer">
        <span>${formatDate(post.created_at)}</span>
        <div class="post-actions">
          <button class="icon-action${likedClass}" type="button" data-like-post="${escapeHtml(post.id)}" ${sampleAttr} aria-pressed="${post.user_liked ? "true" : "false"}">
            <span>♥</span>
            <span>${post.likes_count || 0}</span>
          </button>
          <button class="icon-action${savedClass}" type="button" data-save-post="${escapeHtml(post.id)}" aria-pressed="${saved ? "true" : "false"}">
            <span>✦</span>
            <span>${saved ? "Salvo" : "Salvar"}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}
