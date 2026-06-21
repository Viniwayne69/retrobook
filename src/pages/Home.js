import { Button } from "../components/Button.js";

export const Home = {
  async render() {
    return `
      <section class="home-clean">
        <div class="home-clean-copy">
          <p class="eyebrow">Rede social literária</p>
          <h1>Retrobook</h1>
          <p class="hero-slogan">Um lugar para leitores encontrarem leitores.</p>
          <p class="hero-text">Crie seu perfil, publique reflexões reais sobre os livros que você está lendo, entre em tribos literárias e participe de discussões com outras pessoas.</p>
          <div class="hero-actions">
            ${Button({ label: "Entrar", href: "/login", variant: "primary" })}
            ${Button({ label: "Criar conta", href: "/cadastro", variant: "secondary" })}
          </div>
        </div>

        <div class="home-clean-panel">
          <span class="mini-label">Como funciona</span>
          <ol class="product-steps">
            <li>
              <strong>Crie seu perfil de leitor</strong>
              <span>Informe seu livro atual, autor favorito e uma bio curta.</span>
            </li>
            <li>
              <strong>Publique reflexões</strong>
              <span>O feed mostra apenas posts reais salvos no banco.</span>
            </li>
            <li>
              <strong>Entre em tribos</strong>
              <span>Participe de comunidades literárias criadas por leitores.</span>
            </li>
          </ol>
        </div>
      </section>
    `;
  }
};
