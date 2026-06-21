import { findReaderMatches, getOrCreateConversation, joinTribe, searchRetrobook } from "../supabase.js";
import { escapeHtml, initials } from "../utils.js";

export const Search = {
  async render(ctx) {
    let matches = { sameBook: [], similarBooks: [], similarIdeas: [] };

    try {
      matches = await findReaderMatches(ctx.user.id);
    } catch {
      matches = { sameBook: [], similarBooks: [], similarIdeas: [] };
    }

    return `
      <section class="search-page">
        <header class="social-page-head">
          <div>
            <p class="eyebrow">Pesquisar</p>
            <h1>Encontre leitores e clubes.</h1>
            <p>Busque pessoas, tribos e conversas, ou comece por leitores com afinidade ao seu livro atual.</p>
          </div>
        </header>

        ${ReaderMatches(matches)}

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

    bindMatchActions(ctx);

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

function ReaderMatches(matches) {
  const total = matches.sameBook.length + matches.similarBooks.length + matches.similarIdeas.length;

  if (!total) {
    return `
      <section class="match-board app-card">
        <div>
          <span class="mini-label">Afinidades</span>
          <h2>Escolha seu livro atual</h2>
          <p>Quando sua estante tiver um livro atual salvo, o Retrobook começa a sugerir leitores próximos.</p>
        </div>
        <a class="btn btn-secondary secondary-button" href="/perfil" data-link>Atualizar perfil</a>
      </section>
    `;
  }

  return `
    <section class="match-board app-card">
      <div class="section-heading paper-heading">
        <h2 class="section-title">Leitores com afinidade</h2>
        <a href="/perfil" data-link>Editar livro atual</a>
      </div>
      ${MatchSection("Lendo o mesmo livro", matches.sameBook)}
      ${MatchSection("Livros parecidos", matches.similarBooks)}
      ${MatchSection("Ideias parecidas", matches.similarIdeas)}
    </section>
  `;
}

function MatchSection(title, readers) {
  if (!readers.length) {
    return "";
  }

  return `
    <div class="match-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="match-list">
        ${readers.map((reader) => ReaderMatchCard(reader)).join("")}
      </div>
    </div>
  `;
}

function ReaderMatchCard(profile) {
  const avatar = profile.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="">`
    : `<span>${escapeHtml(initials(profile.name || profile.username || "Leitor"))}</span>`;

  return `
    <article class="reader-match-card">
      <div class="profile-photo small">${avatar}</div>
      <div>
        <strong>${escapeHtml(profile.name || "Leitor Retrobook")}</strong>
        <span>@${escapeHtml(profile.username || "leitor")}</span>
        <small>${escapeHtml(profile.current_book || "Livro atual não informado")}</small>
      </div>
      <em>${profile.affinity_score || 18}%</em>
      <div class="reader-match-actions">
        <a class="btn btn-secondary secondary-button" href="/perfil/${escapeHtml(profile.id)}" data-link>Perfil</a>
        <button class="btn btn-primary primary-button" type="button" data-start-conversation="${escapeHtml(profile.id)}" data-book-id="${escapeHtml(profile.current_book_id || "")}">Conversar</button>
      </div>
    </article>
  `;
}

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
        <button class="btn btn-primary primary-button" type="button" data-start-conversation="${escapeHtml(profile.id)}" data-book-id="${escapeHtml(profile.current_book_id || "")}">Mensagem</button>
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

function bindMatchActions(ctx) {
  document.querySelectorAll("[data-start-conversation]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const conversation = await getOrCreateConversation(ctx.user.id, button.dataset.startConversation, button.dataset.bookId || null);
        ctx.navigate(`/mensagens?conversation=${conversation.id}`);
      } catch (error) {
        ctx.toast(error.message || "Não foi possível abrir a conversa.");
      }
    });
  });
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

  bindMatchActions(ctx);
}
