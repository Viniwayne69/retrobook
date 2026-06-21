import { joinTribe, searchRetrobook } from "../supabase.js";
import { escapeHtml, initials } from "../utils.js";

export const Search = {
  async render() {
    return `
      <section class="search-page">
        <header class="social-page-head">
          <div>
            <p class="eyebrow">Pesquisar</p>
            <h1>Encontre leitores e clubes.</h1>
            <p>Busque pelo ID de uma pessoa, nome de clube ou tribo literária.</p>
          </div>
        </header>

        <form class="search-box app-card" data-search-form>
          <label for="search-query">Pesquisar no Retrobook</label>
          <div class="search-row">
            <input id="search-query" name="query" type="search" placeholder="Digite um ID, nome ou clube" required>
            <button class="btn btn-primary primary-button" type="submit">Pesquisar</button>
          </div>
        </form>

        <section class="search-results" data-search-results>
          <div class="social-empty app-card">
            <h2>Comece uma busca</h2>
            <p>Os resultados de pessoas e clubes aparecem aqui.</p>
          </div>
        </section>
      </section>
    `;
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-search-form]");
    const results = document.querySelector("[data-search-results]");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const query = new FormData(form).get("query");

      try {
        results.innerHTML = `<div class="loading-inline app-card">Pesquisando...</div>`;
        const data = await searchRetrobook(query, ctx.user.id);
        results.innerHTML = renderResults(data);
        bindResultActions(ctx);
      } catch (error) {
        results.innerHTML = `
          <div class="social-empty app-card">
            <h2>Não foi possível pesquisar</h2>
            <p>${escapeHtml(error.message || "Tente novamente em instantes.")}</p>
          </div>
        `;
      }
    });
  }
};

function renderResults(data) {
  const people = data.profiles.length
    ? data.profiles.map((profile) => PersonResult(profile)).join("")
    : `<div class="muted-result">Nenhum leitor encontrado.</div>`;

  const tribes = data.tribes.length
    ? data.tribes.map((tribe) => TribeResult(tribe)).join("")
    : `<div class="muted-result">Nenhum clube encontrado.</div>`;

  return `
    <div class="result-section">
      <h2>Leitores</h2>
      <div class="result-list">${people}</div>
    </div>
    <div class="result-section">
      <h2>Clubes e tribos</h2>
      <div class="result-list">${tribes}</div>
    </div>
  `;
}

function PersonResult(profile) {
  const avatar = profile.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="">`
    : `<span>${escapeHtml(initials(profile.name || profile.username || "Leitor"))}</span>`;

  return `
    <article class="result-card app-card">
      <div class="profile-photo small">${avatar}</div>
      <div>
        <h3>${escapeHtml(profile.name || "Leitor Retrobook")}</h3>
        <p>@${escapeHtml(profile.username || "leitor")}</p>
        <span>${escapeHtml(profile.current_book || "Livro atual não informado")}</span>
      </div>
      <div class="result-actions">
        <a class="btn btn-secondary secondary-button" href="/perfil/${escapeHtml(profile.id)}" data-link>Ver perfil</a>
        <button class="btn btn-primary primary-button" type="button" data-message-person="${escapeHtml(profile.id)}">Mensagem</button>
      </div>
    </article>
  `;
}

function TribeResult(tribe) {
  return `
    <article class="result-card app-card">
      <div class="club-icon">${escapeHtml(initials(tribe.name || "Clube"))}</div>
      <div>
        <h3>${escapeHtml(tribe.name)}</h3>
        <p>${escapeHtml(tribe.description || "Clube literário")}</p>
        <span>${tribe.members_count || 0} membros</span>
      </div>
      <div class="result-actions">
        <button class="btn btn-primary primary-button" type="button" data-join-tribe="${escapeHtml(tribe.id)}">${tribe.user_joined ? "Membro" : "Entrar"}</button>
        <a class="btn btn-secondary secondary-button" href="/tribos/${escapeHtml(tribe.slug)}" data-link>Ver clube</a>
      </div>
    </article>
  `;
}

function bindResultActions(ctx) {
  document.querySelectorAll("[data-join-tribe]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await joinTribe(button.dataset.joinTribe, ctx.user.id);
        ctx.toast("Você entrou no clube.");
        button.textContent = "Membro";
      } catch (error) {
        ctx.toast(error.message || "Não foi possível entrar.");
      }
    });
  });

  document.querySelectorAll("[data-message-person]").forEach((button) => {
    button.addEventListener("click", () => {
      ctx.navigate("/mensagens");
      ctx.toast("Abra ou crie uma conversa para enviar mensagem.");
    });
  });
}
