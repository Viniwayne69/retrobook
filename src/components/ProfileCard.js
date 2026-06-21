import { escapeHtml, initials } from "../utils.js";

export function ProfileCard(profile, stats = { posts: 0, tribes: 0 }) {
  const name = profile?.name || "Leitor Retrobook";
  const username = profile?.username || "leitor";

  return `
    <section class="profile-panel app-card">
      <div class="profile-avatar reader-avatar large">${escapeHtml(initials(name))}</div>
      <div class="profile-copy">
        <p class="eyebrow">Estante pessoal</p>
        <h1>${escapeHtml(name)}</h1>
        <p class="username">@${escapeHtml(username)}</p>
        <p>${escapeHtml(profile?.bio || "Uma presenca nova entre as estantes do Retrobook.")}</p>
      </div>
      <div class="profile-stats">
        <article>
          <strong>${stats.posts}</strong>
          <span>posts</span>
        </article>
        <article>
          <strong>${stats.tribes}</strong>
          <span>tribos criadas</span>
        </article>
      </div>
    </section>
  `;
}
