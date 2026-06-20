import { Button } from "../components/Button.js";
import { DiscussionCard } from "../components/DiscussionCard.js";
import { createDiscussion, getTribeBySlug, joinTribe, listDiscussionsByTribe } from "../supabase.js";
import { escapeHtml, formDataToObject } from "../utils.js";

export const TribeDetails = {
  async render(ctx) {
    const tribe = await getTribeBySlug(ctx.params.slug, ctx.user.id);

    if (!tribe) {
      return `
        <section class="empty-state">
          <p class="eyebrow">Tribo não encontrada</p>
          <h1>Esta sala ainda não existe</h1>
          <p>Volte para a lista de tribos e escolha outra comunidade literária.</p>
          ${Button({ label: "Ver tribos", href: "/tribos", variant: "primary" })}
        </section>
      `;
    }

    const discussions = await listDiscussionsByTribe(tribe.id);
    ctx.currentTribe = tribe;

    const discussionList = discussions.length
      ? discussions.map((discussion) => DiscussionCard(discussion)).join("")
      : `<div class="empty-card">Ainda não há discussões nesta tribo. Abra a primeira pergunta e acenda a mesa.</div>`;

    return `
      <section class="tribe-hero">
        <div>
          <p class="eyebrow">${escapeHtml(tribe.category || "Tribo literária")}</p>
          <h1>${escapeHtml(tribe.name)}</h1>
          <p>${escapeHtml(tribe.description)}</p>
          <div class="tag-row">
            <span>${escapeHtml(tribe.main_book_or_author || "Leituras compartilhadas")}</span>
            <span>${tribe.members_count || 0} membros</span>
          </div>
        </div>
        <button class="btn btn-primary" type="button" data-join-current-tribe>
          ${tribe.user_joined ? "Você é membro" : "Entrar na tribo"}
        </button>
      </section>

      <section class="dashboard-layout align-start">
        <div class="content-column">
          <h2 class="section-title">Discussões</h2>
          <div class="discussion-list">
            ${discussionList}
          </div>
        </div>

        <aside class="paper-card form-panel compact-panel">
          <h2>Nova discussão</h2>
          <form class="stacked-form" data-discussion-form>
            <label for="title">Título</label>
            <input id="title" name="title" type="text" placeholder="Capítulo 5 e o sonho do cavalo" required>

            <label for="question">Pergunta</label>
            <textarea id="question" name="question" rows="4" placeholder="Que pergunta você quer abrir para a tribo?" required></textarea>

            <label for="book-title">Livro</label>
            <input id="book-title" name="book_title" type="text" placeholder="Crime e Castigo" required>

            <label for="chapter">Capítulo</label>
            <input id="chapter" name="chapter" type="text" placeholder="Capítulo 5">

            ${Button({ label: "Criar discussão", type: "submit", variant: "primary", className: "full" })}
          </form>
        </aside>
      </section>
    `;
  },

  async afterRender(ctx) {
    const joinButton = document.querySelector("[data-join-current-tribe]");
    joinButton?.addEventListener("click", async () => {
      try {
        await joinTribe(ctx.currentTribe.id, ctx.user.id);
        ctx.toast("Você entrou nesta tribo.");
        await ctx.refresh();
      } catch (error) {
        ctx.toast(error.message || "Não foi possível entrar nesta tribo.");
      }
    });

    const form = document.querySelector("[data-discussion-form]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        payload.tribe_id = ctx.currentTribe.id;
        const discussion = await createDiscussion(ctx.user.id, payload);
        ctx.toast("Discussão criada.");
        ctx.navigate(`/discussao/${discussion.id}`);
      } catch (error) {
        ctx.toast(error.message || "Não foi possível criar a discussão.");
      }
    });
  }
};
