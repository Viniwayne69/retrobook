import { escapeHtml } from "../utils.js";

export function TribeCard(tribe) {
  const joined = Boolean(tribe.user_joined);
  const members = tribe.members_count || 0;

  return `
    <article class="paper-card tribe-card">
      <span class="badge">${escapeHtml(tribe.category || "Literatura")}</span>
      <h3>${escapeHtml(tribe.name)}</h3>
      <p>${escapeHtml(tribe.description)}</p>
      <dl class="mini-meta">
        <div>
          <dt>Foco</dt>
          <dd>${escapeHtml(tribe.main_book_or_author || "Leituras compartilhadas")}</dd>
        </div>
        <div>
          <dt>Membros</dt>
          <dd>${members}</dd>
        </div>
      </dl>
      <div class="card-actions">
        <a class="text-link" href="/tribos/${escapeHtml(tribe.slug)}" data-link>Abrir tribo</a>
        <button class="small-btn ${joined ? "is-joined" : ""}" type="button" data-join-tribe="${escapeHtml(tribe.id)}">
          ${joined ? "Membro" : "Entrar"}
        </button>
      </div>
    </article>
  `;
}
