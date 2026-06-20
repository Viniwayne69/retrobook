import { Button } from "../components/Button.js";
import { addComment, ensureInitialDiscussion, getDiscussion, listComments } from "../supabase.js";
import { escapeHtml, formDataToObject, formatDate, initials } from "../utils.js";

export const Discussion = {
  async render(ctx) {
    const discussion = ctx.params.id
      ? await getDiscussion(ctx.params.id)
      : await ensureInitialDiscussion(ctx.user.id);

    if (!discussion) {
      return `
        <section class="empty-state">
          <p class="eyebrow">Discussão indisponível</p>
          <h1>Nenhuma conversa foi encontrada</h1>
          <p>Crie uma tribo ou abra uma nova discussão para começar.</p>
          ${Button({ label: "Ver tribos", href: "/tribos", variant: "primary" })}
        </section>
      `;
    }

    const comments = await listComments(discussion.id);
    ctx.currentDiscussion = discussion;

    const commentsHtml = comments.length
      ? comments.map((comment) => {
          const author = comment.profiles?.name || "Leitor Retrobooks";
          return `
            <article class="comment-card">
              <div class="avatar small">${escapeHtml(initials(author))}</div>
              <div>
                <div class="comment-heading">
                  <strong>${escapeHtml(author)}</strong>
                  <span>${formatDate(comment.created_at)}</span>
                </div>
                <p>${escapeHtml(comment.content)}</p>
              </div>
            </article>
          `;
        }).join("")
      : `<div class="empty-card">Ainda não há comentários. A primeira resposta pode dar forma à conversa.</div>`;

    return `
      <section class="discussion-hero">
        <p class="eyebrow">${escapeHtml(discussion.book_title || "Discussão literária")}</p>
        <h1>${escapeHtml(discussion.title)}</h1>
        <p>${escapeHtml(discussion.question)}</p>
        <div class="tag-row">
          <span>${escapeHtml(discussion.chapter || "Sem capítulo definido")}</span>
          <span>${escapeHtml(discussion.tribes?.name || "Tribo literária")}</span>
        </div>
      </section>

      <section class="dashboard-layout align-start">
        <div class="content-column">
          <h2 class="section-title">Comentários</h2>
          <div class="comment-list">
            ${commentsHtml}
          </div>
        </div>

        <aside class="paper-card form-panel compact-panel">
          <h2>Comentar</h2>
          <form class="stacked-form" data-comment-form>
            <label for="comment">Sua leitura</label>
            <textarea id="comment" name="content" rows="6" placeholder="Escreva sua resposta com cuidado." required></textarea>
            ${Button({ label: "Adicionar comentário", type: "submit", variant: "primary", className: "full" })}
          </form>
        </aside>
      </section>
    `;
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-comment-form]");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        await addComment(ctx.user.id, ctx.currentDiscussion.id, payload.content);
        ctx.toast("Comentário publicado.");
        await ctx.refresh();
      } catch (error) {
        ctx.toast(error.message || "Não foi possível comentar.");
      }
    });
  }
};
