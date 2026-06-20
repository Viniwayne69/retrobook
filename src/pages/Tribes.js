import { Button } from "../components/Button.js";
import { TribeCard } from "../components/TribeCard.js";
import { createTribe, ensureInitialTribes, joinTribe, listTribes } from "../supabase.js";
import { formDataToObject } from "../utils.js";

export const Tribes = {
  async render(ctx) {
    await ensureInitialTribes(ctx.user.id);
    const tribes = await listTribes(ctx.user.id);
    ctx.currentTribes = tribes;

    return `
      <section class="page-intro centered">
        <p class="eyebrow">Comunidades</p>
        <h1>Tribos literárias</h1>
        <p>Cada tribo é uma mesa de leitura com perfume próprio, onde livros, autores e perguntas encontram uma comunidade.</p>
      </section>

      <section class="dashboard-layout align-start">
        <div class="content-column">
          <section class="card-grid" aria-label="Tribos disponíveis">
            ${tribes.map((tribe) => TribeCard(tribe)).join("")}
          </section>
        </div>

        <aside class="paper-card form-panel compact-panel">
          <h2>Criar tribo</h2>
          <form class="stacked-form" data-tribe-form>
            <label for="name">Nome</label>
            <input id="name" name="name" type="text" placeholder="Clube das Cartas Antigas" required>

            <label for="description">Descrição</label>
            <textarea id="description" name="description" rows="4" placeholder="Conte que tipo de leitura esta tribo acolhe." required></textarea>

            <label for="main-book">Livro ou autor principal</label>
            <input id="main-book" name="main_book_or_author" type="text" placeholder="Clarice Lispector" required>

            <label for="category">Categoria</label>
            <input id="category" name="category" type="text" placeholder="Literatura brasileira" required>

            ${Button({ label: "Criar tribo", type: "submit", variant: "primary", className: "full" })}
          </form>
        </aside>
      </section>
    `;
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-tribe-form]");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        const tribe = await createTribe(ctx.user.id, payload);
        ctx.toast("Sua tribo foi criada.");
        ctx.navigate(`/tribos/${tribe.slug}`);
      } catch (error) {
        ctx.toast(error.message || "Não foi possível criar a tribo.");
      }
    });

    document.querySelectorAll("[data-join-tribe]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await joinTribe(button.dataset.joinTribe, ctx.user.id);
          ctx.toast("Você entrou na tribo.");
          await ctx.refresh();
        } catch (error) {
          ctx.toast(error.message || "Não foi possível entrar na tribo.");
        }
      });
    });
  }
};
