import { escapeHtml, formatDate } from "../utils.js";

export function DiscussionCard(discussion) {
  const author = discussion.profiles?.name || "Leitor Retrobooks";

  return `
    <article class="paper-card discussion-card">
      <span class="badge green">${escapeHtml(discussion.book_title || "Livro")}</span>
      <h3>${escapeHtml(discussion.title)}</h3>
      <p>${escapeHtml(discussion.question)}</p>
      <div class="discussion-meta">
        <span>${escapeHtml(discussion.chapter || "Discussão aberta")}</span>
        <span>${escapeHtml(author)}</span>
        <span>${formatDate(discussion.created_at)}</span>
      </div>
      <a class="text-link" href="/discussao/${escapeHtml(discussion.id)}" data-link>Abrir discussão</a>
    </article>
  `;
}
