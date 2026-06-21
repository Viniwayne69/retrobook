export function AuthFrame({ mode = "login", setup = "", children = "" }) {
  const isLogin = mode === "login";

  return `
    <section class="auth-experience">
      <div class="auth-card-shell">
        <aside class="auth-visual" aria-label="Autores que inspiram o Retrobook">
          <div class="auth-slider" aria-hidden="true">
            ${Slide("/auth/cs-lewis.jpg", "C. S. Lewis", "Leitura, imaginação e fé")}
            ${Slide("/auth/clarice.jpg", "Clarice Lispector", "Intimidade, linguagem e espanto")}
            ${Slide("/auth/dostoievski.jpg", "Fiódor Dostoiévski", "Consciência, culpa e liberdade")}
            ${Slide("/auth/oscar-wilde.jpg", "Oscar Wilde", "Beleza, ironia e pensamento")}
          </div>

          <div class="auth-slider-dots">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </aside>

        <div class="auth-form-side">
          <div class="auth-form-card">
            <nav class="auth-choice" aria-label="Escolha de autenticação">
              <a class="${isLogin ? "active" : ""}" href="/login" data-link>Entrar</a>
              <a class="${isLogin ? "" : "active"}" href="/cadastro" data-link>Faça seu cadastro</a>
            </nav>

            ${setup}
            ${children}
          </div>
        </div>
      </div>
    </section>
  `;
}

function Slide(src, name, text) {
  return `
    <figure class="auth-slide">
      <img src="${src}" alt="">
      <figcaption>
        <strong>${name}</strong>
        <span>${text}</span>
      </figcaption>
    </figure>
  `;
}
