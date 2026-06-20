import { Button } from "../components/Button.js";
import { getDostoevskyTribe, joinTribe } from "../supabase.js";

export const Author = {
  async render() {
    return `
      <section class="author-layout">
        <div class="author-seal">FD</div>
        <div class="author-copy">
          <p class="eyebrow">Autor em destaque</p>
          <h1>Fiódor Dostoiévski</h1>
          <p>Romancista russo de intensidade moral rara, Dostoiévski escreveu sobre culpa, fé, liberdade, miséria e a estranha beleza das consciências em conflito.</p>
          <div class="hero-actions">
            ${Button({ label: "Entrar na Tribo Dostoiévski", variant: "primary", attrs: "data-dostoevsky-join" })}
            ${Button({ label: "Ver discussões", href: "/discussao", variant: "secondary" })}
          </div>
        </div>
      </section>

      <section class="split-grid">
        <article class="paper-card">
          <h2>Obras em destaque</h2>
          <ul class="book-list">
            <li>
              <strong>Crime e Castigo</strong>
              <span>culpa, pobreza, delírio e redenção</span>
            </li>
            <li>
              <strong>Os Irmãos Karamázov</strong>
              <span>fé, família, liberdade e abismo moral</span>
            </li>
            <li>
              <strong>O Idiota</strong>
              <span>pureza, beleza e fragilidade diante do mundo</span>
            </li>
          </ul>
        </article>

        <article class="paper-card quote-panel">
          <h2>Citações</h2>
          <blockquote>A beleza salvará o mundo.</blockquote>
          <blockquote>O homem é infeliz porque não sabe que é feliz.</blockquote>
          <p>Na leitura coletiva, cada frase parece ganhar outra respiração, como se o livro encontrasse novas margens em cada leitor.</p>
        </article>
      </section>
    `;
  },

  async afterRender(ctx) {
    const button = document.querySelector("[data-dostoevsky-join]");

    button?.addEventListener("click", async () => {
      try {
        const tribe = await getDostoevskyTribe(ctx.user.id);
        await joinTribe(tribe.id, ctx.user.id);
        ctx.toast("Você entrou na Tribo Dostoiévski.");
        ctx.navigate(`/tribos/${tribe.slug}`);
      } catch (error) {
        ctx.toast(error.message || "Não foi possível entrar na tribo.");
      }
    });
  }
};
