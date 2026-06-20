import { Button } from "../components/Button.js";

export const Home = {
  async render() {
    return `
      <section class="home-hero">
        <div class="hero-copy">
          <p class="eyebrow">Rede social literária</p>
          <h1>Retrobooks</h1>
          <p class="hero-slogan">A rede social para leitores</p>
          <p class="hero-text">Encontre pessoas que estão lendo o mesmo mundo que você, entre em tribos literárias e transforme cada leitura em conversa viva.</p>
          <div class="hero-actions">
            ${Button({ label: "Entrar", href: "/login", variant: "primary" })}
            ${Button({ label: "Criar conta", href: "/cadastro", variant: "secondary" })}
          </div>

          <div class="hero-metrics" aria-label="Comunidade Retrobooks">
            <article>
              <strong>2.8k</strong>
              <span>reflexões publicadas</span>
            </article>
            <article>
              <strong>148</strong>
              <span>tribos literárias</span>
            </article>
            <article>
              <strong>36</strong>
              <span>livros em conversa hoje</span>
            </article>
          </div>
        </div>

        <div class="home-product-preview" aria-label="Prévia do Retrobooks">
          <div class="preview-topline">
            <span>Salão de leitura</span>
            <strong>ao vivo</strong>
          </div>

          <article class="preview-post">
            <div class="preview-avatar">AM</div>
            <div>
              <span class="book-chip">Crime e Castigo</span>
              <h2>A culpa parece uma cidade inteira dentro dele.</h2>
              <p>Raskólnikov caminha como quem tenta escapar de si, mas cada rua devolve a mesma pergunta.</p>
              <div class="preview-actions">
                <span>18 curtidas</span>
                <span>12 comentários</span>
                <span>Tribo Dostoiévski</span>
              </div>
            </div>
          </article>

          <div class="preview-columns">
            <article>
              <span class="mini-label">Lendo agora</span>
              <strong>Dom Casmurro</strong>
              <p>42 leitores no mesmo capítulo.</p>
            </article>
            <article>
              <span class="mini-label">Discussão quente</span>
              <strong>O sonho do cavalo</strong>
              <p>Capítulo 5, 128 respostas.</p>
            </article>
          </div>

          <div class="library-strip" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>

      <section class="home-band" aria-label="O que acontece no Retrobooks">
        <article>
          <span>01</span>
          <h2>Leitores por afinidade</h2>
          <p>Encontre pessoas por livro, autor, gênero, capítulo e modo de ler.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Tribos com atmosfera</h2>
          <p>Crie círculos de leitura com identidade própria, temas claros e conversas contínuas.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Reflexões que ficam</h2>
          <p>Publique pensamentos, salve trechos, comente discussões e construa sua presença como leitor.</p>
        </article>
      </section>
    `;
  }
};
