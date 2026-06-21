import { escapeHtml, initials } from "../utils.js";

export function ProfileCard(profile, stats = { posts: 0, tribes: 0 }) {
  const name = profile?.name || "Leitor Retrobook";
  const username = profile?.username || "leitor";
  const avatar = profile?.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="">`
    : `<span>${escapeHtml(initials(name))}</span>`;

  return `
    <section class="profile-panel app-card">
      <div class="profile-photo">${avatar}</div>
      <div class="profile-copy">
        <p class="eyebrow">Perfil</p>
        <h1>${escapeHtml(name)}</h1>
        <p class="username">@${escapeHtml(username)}</p>
        <p>${escapeHtml(profile?.bio || "Uma pessoa descobrindo o Retrobook entre livros, ideias e conversas.")}</p>
      </div>
      <div class="profile-stats">
        <article>
          <strong>${stats.posts}</strong>
          <span>posts</span>
        </article>
        <article>
          <strong>0</strong>
          <span>amigos</span>
        </article>
        <article>
          <strong>${stats.tribes}</strong>
          <span>clubes</span>
        </article>
      </div>
    </section>
  `;
}
