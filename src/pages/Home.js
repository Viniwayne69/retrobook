import { Button } from "../components/Button.js";

export const Home = {
  async render() {
    return `
      <section class="hero-shell">
        <div class="hero-copy">
          <p class="eyebrow">Rede social literária</p>
          <h1>Retrobooks</h1>
          <p class="hero-slogan">A rede social para leitores</p>
          <p class="hero-text">Encontre pessoas que estão lendo o mesmo mundo que você, participe de tribos literárias e transforme cada leitura em conversa viva.</p>
          <div class="hero-actions">
            ${Button({ label: "Entrar", href: "/login", variant: "primary" })}
            ${Button({ label: "Criar conta", href: "/cadastro", variant: "secondary" })}
          </div>
        </div>

        <div class="hero-visual">
          <img src="/retrobooks-library.png" alt="Ilustração vintage de uma biblioteca do Retrobooks">
          <div class="reading-ticket">
            <span>Leitura em comum</span>
            <strong>Crime e Castigo</strong>
            <p>28 leitores atravessando o mesmo capítulo agora.</p>
          </div>
        </div>
      </section>

      <section class="feature-grid">
        <article>
          <span>01</span>
          <h2>Encontros por livro</h2>
          <p>Descubra quem está lendo o mesmo título e encontre leitores por afinidade, ritmo e curiosidade.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Tribos literárias</h2>
          <p>Crie ou entre em clubes de leitura com identidade própria, temas claros e discussões que respiram.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Reflexões e comentários</h2>
          <p>Publique pensamentos, curta posts, salve reflexões e participe de conversas sobre capítulos específicos.</p>
        </article>
      </section>
    `;
  }
};
