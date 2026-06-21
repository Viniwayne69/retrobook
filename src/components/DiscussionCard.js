import { escapeHtml, formatDate, initials } from "../utils.js";

export function DiscussionCard(discussion) {
  const author = discussion.profiles?.name || "Leitor Retrobook";

  return `
    <article class="discussion-card app-card">
      <header class="discussion-card-header">
        <span class="reader-avatar small">${escapeHtml(initials(author))}</span>
        <div>
          <span class="badge green">${escapeHtml(discussion.book_title || "Livro")}</span>
          <h3>${escapeHtml(discussion.title)}</h3>
        </div>
      </header>
      <p>${escapeHtml(discussion.question)}</p>
      <div class="discussion-meta">
        <span>${escapeHtml(discussion.chapter || "Discussao aberta")}</span>
        <span>${escapeHtml(author)}</span>
        <span>${formatDate(discussion.created_at)}</span>
      </div>
      <a class="text-link" href="/discussao/${escapeHtml(discussion.id)}" data-link>Abrir discussao</a>
    </article>
  `;
}
