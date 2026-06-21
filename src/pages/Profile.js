import { Button } from "../components/Button.js";
import { PostCard } from "../components/PostCard.js";
import { ProfileCard } from "../components/ProfileCard.js";
import {
  getFriendshipStatus,
  getOrCreateConversation,
  getProfile,
  getProfileStats,
  listPostsByUser,
  saveProfile,
  searchBooks,
  sendFriendRequest,
  setCurrentBook,
  togglePostLike
} from "../supabase.js";
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
      current_book_id: "",
      favorite_author: "",
      avatar_url: ""
    };
    const [stats, posts, friendship] = await Promise.all([
      getProfileStats(profileId),
      listPostsByUser(profileId, ctx.user.id),
      isOwnProfile ? Promise.resolve(null) : getFriendshipStatus(ctx.user.id, profileId)
    ]);
    ctx.currentPosts = posts;
    ctx.isOwnProfile = isOwnProfile;
    ctx.profilePageUserId = profileId;
    ctx.bookSearchResults = [];

    const postList = posts.length
      ? posts.map((post) => PostCard(post, ctx.state.savedPosts.has(post.id))).join("")
      : `
        <section class="social-empty app-card">
          <h2>Nenhum post publicado ainda</h2>
          <p>Quando você publicar no feed, seus textos também aparecem aqui no perfil.</p>
          ${isOwnProfile ? `<a class="btn btn-primary primary-button" href="/publicar" data-link>Publicar agora</a>` : ""}
        </section>
      `;

    return `
      <section class="profile-social-page">
        ${ProfileCard(profile, stats)}

        ${isOwnProfile ? ReaderShelf(profile) : PublicReaderActions(profile, friendship)}

        ${isOwnProfile ? ProfileEditor(profile) : ""}

        <section class="profile-posts">
          <div class="section-heading paper-heading">
            <h2 class="section-title">Publicações</h2>
            ${isOwnProfile ? `<a href="/publicar" data-link>Novo post</a>` : ""}
          </div>
          <div class="post-list social-post-list">
            ${postList}
          </div>
        </section>
      </section>
    `;
  },

  async afterRender(ctx) {
    bindProfileForm(ctx);
    bindBookSearch(ctx);
    bindExternalProfileActions(ctx);
    bindPostActions(ctx);
  }
};

function ReaderShelf(profile) {
  const currentBook = profile.current_book || "Nenhum livro atual escolhido";

  return `
    <section class="profile-reading app-card reader-shelf">
      <div>
        <span>Leitura atual</span>
        <strong>${escapeHtml(currentBook)}</strong>
        <p>Escolha um livro real para encontrar leitores com afinidade.</p>
      </div>

      <form class="book-search-form" data-book-search-form>
        <label for="book-search">Buscar livro</label>
        <div class="search-row">
          <input id="book-search" name="query" type="search" placeholder="Digite título, autor ou tema">
          <button class="btn btn-secondary secondary-button" type="submit">Buscar</button>
        </div>
        <div class="book-results" data-book-results></div>
      </form>
    </section>
  `;
}

function PublicReaderActions(profile, friendship) {
  const status = friendship?.status || "";
  const friendshipLabel = status === "accepted"
    ? "Amigos"
    : status === "pending"
      ? "Pedido enviado"
      : "Adicionar amigo";

  return `
    <section class="profile-reading app-card public-reader-actions">
      <div>
        <span>Leitura atual</span>
        <strong>${escapeHtml(profile.name || "Leitor")} está lendo ${escapeHtml(profile.current_book || "um livro ainda não informado")}</strong>
      </div>
      <div class="reader-action-row">
        <button class="btn btn-primary primary-button" type="button" data-message-profile="${escapeHtml(profile.id)}">Conversar</button>
        <button class="btn btn-secondary secondary-button" type="button" data-friend-request="${escapeHtml(profile.id)}" ${status ? "disabled" : ""}>${friendshipLabel}</button>
      </div>
    </section>
  `;
}

function ProfileEditor(profile) {
  return `
    <section class="profile-editor app-card">
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
    </section>
  `;
}

function bindProfileForm(ctx) {
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

function bindBookSearch(ctx) {
  const form = document.querySelector("[data-book-search-form]");
  const results = document.querySelector("[data-book-results]");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = new FormData(form).get("query");

    try {
      results.innerHTML = `<div class="muted-result">Buscando livros...</div>`;
      ctx.bookSearchResults = await searchBooks(query);
      results.innerHTML = ctx.bookSearchResults.length
        ? ctx.bookSearchResults.map((book, index) => BookResult(book, index)).join("")
        : `<div class="muted-result">Nenhum livro encontrado.</div>`;
      bindBookResultButtons(ctx);
    } catch (error) {
      results.innerHTML = `<div class="muted-result">${escapeHtml(error.message || "Não foi possível buscar livros.")}</div>`;
    }
  });
}

function bindBookResultButtons(ctx) {
  document.querySelectorAll("[data-set-book]").forEach((button) => {
    button.addEventListener("click", async () => {
      const book = ctx.bookSearchResults[Number(button.dataset.setBook)];

      if (!book) {
        return;
      }

      try {
        await setCurrentBook(ctx.user.id, book);
        ctx.toast("Livro atual atualizado.");
        await ctx.refresh();
      } catch (error) {
        ctx.toast(error.message || "Não foi possível salvar este livro.");
      }
    });
  });
}

function bindExternalProfileActions(ctx) {
  document.querySelectorAll("[data-friend-request]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await sendFriendRequest(ctx.user.id, button.dataset.friendRequest);
        button.textContent = "Pedido enviado";
        button.disabled = true;
        ctx.toast("Pedido de amizade enviado.");
      } catch (error) {
        ctx.toast(error.message || "Não foi possível enviar o pedido.");
      }
    });
  });

  document.querySelectorAll("[data-message-profile]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const conversation = await getOrCreateConversation(ctx.user.id, button.dataset.messageProfile, ctx.profile?.current_book_id || null);
        ctx.navigate(`/mensagens?conversation=${conversation.id}`);
      } catch (error) {
        ctx.toast(error.message || "Não foi possível abrir a conversa.");
      }
    });
  });
}

function bindPostActions(ctx) {
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

function BookResult(book, index) {
  const cover = book.cover_url
    ? `<img src="${escapeHtml(book.cover_url)}" alt="">`
    : `<span>${escapeHtml((book.title || "L").slice(0, 1))}</span>`;

  return `
    <article class="book-result">
      <div class="book-cover-mini">${cover}</div>
      <div>
        <strong>${escapeHtml(book.title)}</strong>
        <span>${escapeHtml(book.author || "Autor não informado")}</span>
      </div>
      <button class="btn btn-primary primary-button" type="button" data-set-book="${index}">Estou lendo</button>
    </article>
  `;
}
