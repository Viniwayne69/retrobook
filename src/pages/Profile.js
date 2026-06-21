import { Button } from "../components/Button.js";
import { PostCard } from "../components/PostCard.js";
import { ProfileCard } from "../components/ProfileCard.js";
import { getProfile, getProfileStats, listPostsByUser, saveProfile, togglePostLike } from "../supabase.js";
import { escapeHtml, formDataToObject, normalizeUsername } from "../utils.js";

export const Profile = {
  async render(ctx) {
    const profileId = ctx.params.id || ctx.user.id;
    const isOwnProfile = profileId === ctx.user.id;
    const loadedProfile = isOwnProfile ? ctx.profile : await getProfile(profileId);

    if (!loadedProfile && !isOwnProfile) {
      return `
        <section class="social-empty app-card">
          <h1>Perfil não encontrado</h1>
          <p>Esse leitor ainda não tem um perfil público no Retrobook.</p>
          <a class="btn btn-primary primary-button" href="/pesquisar" data-link>Voltar para pesquisa</a>
        </section>
      `;
    }

    const profile = loadedProfile || {
      name: ctx.user.email,
      username: "leitor",
      bio: "",
      current_book: "",
      favorite_author: "",
      avatar_url: ""
    };
    const [stats, posts] = await Promise.all([
      getProfileStats(profileId),
      listPostsByUser(profileId, ctx.user.id)
    ]);
    ctx.currentPosts = posts;
    ctx.isOwnProfile = isOwnProfile;

    const postList = posts.length
      ? posts.map((post) => PostCard(post, ctx.state.savedPosts.has(post.id))).join("")
      : `
        <section class="social-empty app-card">
          <h2>Nenhum post publicado ainda</h2>
          <p>Quando você publicar no feed, seus textos também aparecem aqui no perfil.</p>
          <a class="btn btn-primary primary-button" href="/publicar" data-link>Publicar agora</a>
        </section>
      `;

    return `
      <section class="profile-social-page">
        ${ProfileCard(profile, stats)}

        <section class="profile-reading app-card">
          <span>Leitura atual</span>
          <strong>${escapeHtml(profile.name || "Leitor")} está lendo ${escapeHtml(profile.current_book || "um livro ainda não informado")}</strong>
        </section>

        ${isOwnProfile ? `<section class="profile-editor app-card">
          <details>
            <summary>Editar perfil</summary>
            <form class="stacked-form two-columns" data-profile-form>
              <div>
                <label for="name">Nome</label>
                <input id="name" name="name" type="text" value="${escapeHtml(profile.name || "")}" required>
              </div>

              <div>
                <label for="username">ID de usuário</label>
                <input id="username" name="username" type="text" value="${escapeHtml(profile.username || "")}" required>
              </div>

              <div>
                <label for="current-book">Livro atual</label>
                <input id="current-book" name="current_book" type="text" value="${escapeHtml(profile.current_book || "")}">
              </div>

              <div>
                <label for="favorite-author">Autor favorito</label>
                <input id="favorite-author" name="favorite_author" type="text" value="${escapeHtml(profile.favorite_author || "")}">
              </div>

              <div class="span-columns">
                <label for="avatar-url">Foto de perfil opcional</label>
                <input id="avatar-url" name="avatar_url" type="url" value="${escapeHtml(profile.avatar_url || "")}" placeholder="https://exemplo.com/foto.jpg">
              </div>

              <div class="span-columns">
                <label for="bio">Biografia</label>
                <textarea id="bio" name="bio" rows="4">${escapeHtml(profile.bio || "")}</textarea>
              </div>

              ${Button({ label: "Salvar perfil", type: "submit", variant: "primary", className: "full span-columns" })}
            </form>
          </details>
        </section>` : ""}

        <section class="profile-posts">
          <div class="section-heading paper-heading">
            <h2 class="section-title">Publicações</h2>
            <a href="/publicar" data-link>Novo post</a>
          </div>
          <div class="post-list social-post-list">
            ${postList}
          </div>
        </section>
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

    document.querySelectorAll("[data-like-post]").forEach((button) => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.likePost;
        const post = ctx.currentPosts.find((item) => item.id === postId);

        if (!post) {
          return;
        }

        try {
          await togglePostLike(ctx.user.id, post);
          await ctx.refresh();
        } catch (error) {
          ctx.toast(error.message || "Não foi possível curtir este post.");
        }
      });
    });

    document.querySelectorAll("[data-save-post]").forEach((button) => {
      button.addEventListener("click", () => {
        ctx.toggleSavedPost(button.dataset.savePost);
        ctx.toast("Post salvo neste navegador.");
      });
    });
  }
};
