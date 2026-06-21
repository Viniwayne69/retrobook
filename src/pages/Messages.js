import { listConversations, listMessages, sendMessage } from "../supabase.js";
import { escapeHtml, formatDate, initials } from "../utils.js";

export const Messages = {
  async render(ctx) {
    const conversations = await listConversations(ctx.user.id);
    ctx.currentConversations = conversations;

    const list = conversations.length
      ? conversations.map((conversation) => ConversationItem(conversation)).join("")
      : `
        <div class="message-empty">
          <h2>Nenhuma conversa ainda</h2>
          <p>Quando as conversas individuais ou de clubes forem criadas, elas aparecem aqui.</p>
        </div>
      `;

    return `
      <section class="messages-page">
        <header class="social-page-head">
          <div>
            <p class="eyebrow">Mensagens</p>
            <h1>Conversas entre leitores.</h1>
            <p>Mensagens individuais e conversas de clubes ficam no mesmo lugar.</p>
          </div>
        </header>

        <div class="messages-shell app-card">
          <aside class="conversation-list" aria-label="Lista de conversas">
            ${list}
          </aside>

          <section class="conversation-panel" data-conversation-panel>
            <div class="conversation-placeholder">
              <h2>Escolha uma conversa</h2>
              <p>Abra uma conversa individual ou de clube para ler e enviar mensagens.</p>
            </div>
          </section>
        </div>
      </section>
    `;
  },

  async afterRender(ctx) {
    document.querySelectorAll("[data-conversation]").forEach((button) => {
      button.addEventListener("click", async () => {
        const conversation = ctx.currentConversations.find((item) => item.id === button.dataset.conversation);

        if (!conversation) {
          return;
        }

        await openConversation(ctx, conversation);
      });
    });
  }
};

function ConversationItem(conversation) {
  const title = conversation.title || conversation.tribes?.name || "Conversa";
  const type = conversation.type === "club" ? "Clube" : "Individual";

  return `
    <button class="conversation-item" type="button" data-conversation="${escapeHtml(conversation.id)}">
      <span class="club-icon small">${escapeHtml(initials(title))}</span>
      <span>
        <strong>${escapeHtml(title)}</strong>
        <small>${type} · ${formatDate(conversation.updated_at)}</small>
      </span>
      ${conversation.unread_count ? `<em>${conversation.unread_count}</em>` : ""}
    </button>
  `;
}

async function openConversation(ctx, conversation) {
  const panel = document.querySelector("[data-conversation-panel]");
  const messages = await listMessages(conversation.id);
  const title = conversation.title || conversation.tribes?.name || "Conversa";

  panel.innerHTML = `
    <header class="conversation-head">
      <div>
        <h2>${escapeHtml(title)}</h2>
        <p>${conversation.type === "club" ? `${conversation.tribes?.members_count || 0} membros` : "Conversa individual"}</p>
      </div>
    </header>

    <div class="message-thread" data-message-thread>
      ${messages.length ? messages.map((message) => MessageBubble(message, ctx.user.id)).join("") : `
        <div class="message-empty inline">
          <p>A conversa ainda não tem mensagens.</p>
        </div>
      `}
    </div>

    <form class="message-compose" data-message-form>
      <input name="content" type="text" placeholder="Escreva uma mensagem" required>
      <button class="btn btn-primary primary-button" type="submit">Enviar</button>
    </form>
  `;

  const form = panel.querySelector("[data-message-form]");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const content = new FormData(form).get("content");
      await sendMessage(conversation.id, ctx.user.id, content);
      ctx.toast("Mensagem enviada.");
      await openConversation(ctx, conversation);
    } catch (error) {
      ctx.toast(error.message || "Não foi possível enviar a mensagem.");
    }
  });
}

function MessageBubble(message, userId) {
  const mine = message.sender_id === userId;
  const author = message.profiles?.name || "Leitor";

  return `
    <article class="message-bubble ${mine ? "mine" : ""}">
      <strong>${escapeHtml(author)}</strong>
      <p>${escapeHtml(message.content)}</p>
      <span>${formatDate(message.created_at)}</span>
    </article>
  `;
}
