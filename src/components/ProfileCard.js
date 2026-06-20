import { escapeHtml, initials } from "../utils.js";

export function ProfileCard(profile, stats = { posts: 0, tribes: 0 }) {
  const name = profile?.name || "Leitor Retrobooks";
  const username = profile?.username || "leitor";

  return `
    <section class="profile-panel">
      <div class="profile-avatar">${escapeHtml(initials(name))}</div>
      <div class="profile-copy">
        <p class="eyebrow">Perfil do leitor</p>
        <h1>${escapeHtml(name)}</h1>
        <p class="username">@${escapeHtml(username)}</p>
        <p>${escapeHtml(profile?.bio || "Uma presença nova entre as estantes do Retrobooks.")}</p>
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
