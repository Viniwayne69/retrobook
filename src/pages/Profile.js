import { Button } from "../components/Button.js";
import { ProfileCard } from "../components/ProfileCard.js";
import { getProfileStats, saveProfile } from "../supabase.js";
import { escapeHtml, formDataToObject, normalizeUsername } from "../utils.js";

export const Profile = {
  async render(ctx) {
    const profile = ctx.profile || {
      name: ctx.user.email,
      username: "leitor",
      bio: "",
      current_book: "",
      favorite_author: ""
    };
    const stats = await getProfileStats(ctx.user.id);

    return `
      ${ProfileCard(profile, stats)}

      <section class="split-grid profile-grid">
        <article class="paper-card">
          <h2>Estante atual</h2>
          <dl class="reader-details">
            <div>
              <dt>Livro atual</dt>
              <dd>${escapeHtml(profile.current_book || "Ainda não informado")}</dd>
            </div>
            <div>
              <dt>Autor favorito</dt>
              <dd>${escapeHtml(profile.favorite_author || "Ainda não informado")}</dd>
            </div>
          </dl>
        </article>

        <article class="paper-card form-panel">
          <h2>Editar perfil</h2>
          <form class="stacked-form" data-profile-form>
            <label for="name">Nome</label>
            <input id="name" name="name" type="text" value="${escapeHtml(profile.name || "")}" required>

            <label for="username">Username</label>
            <input id="username" name="username" type="text" value="${escapeHtml(profile.username || "")}" required>

            <label for="current-book">Livro atual</label>
            <input id="current-book" name="current_book" type="text" value="${escapeHtml(profile.current_book || "")}">

            <label for="favorite-author">Autor favorito</label>
            <input id="favorite-author" name="favorite_author" type="text" value="${escapeHtml(profile.favorite_author || "")}">

            <label for="avatar-url">Avatar URL opcional</label>
            <input id="avatar-url" name="avatar_url" type="url" value="${escapeHtml(profile.avatar_url || "")}" placeholder="https://exemplo.com/avatar.jpg">

            <label for="bio">Bio</label>
            <textarea id="bio" name="bio" rows="5">${escapeHtml(profile.bio || "")}</textarea>

            ${Button({ label: "Salvar perfil", type: "submit", variant: "primary", className: "full" })}
          </form>
        </article>
      </section>
    `;
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-profile-form]");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        payload.username = normalizeUsername(payload.username);
        await saveProfile(ctx.user.id, payload);
        ctx.toast("Perfil atualizado.");
        await ctx.refresh();
      } catch (error) {
        ctx.toast(error.message || "Não foi possível salvar o perfil.");
      }
    });
  }
};
