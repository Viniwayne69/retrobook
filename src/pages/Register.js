import { Button } from "../components/Button.js";
import { formDataToObject, normalizeUsername } from "../utils.js";
import { registerUser } from "../supabase.js";

export const Register = {
  async render(ctx) {
    const setup = ctx.hasSupabaseConfig ? "" : `
      <div class="setup-note">
        <strong>Supabase ainda não configurado.</strong>
        <span>O cadastro será ativado depois que as variáveis do .env forem preenchidas.</span>
      </div>
    `;

    return `
      <section class="auth-layout wide">
        <div class="auth-copy">
          <p class="eyebrow">Nova conta</p>
          <h1>Crie seu perfil de leitor</h1>
          <p>Conte ao Retrobooks que livros caminham com você, que autor sempre volta ao seu pensamento e que tipo de conversa você procura.</p>
        </div>

        <div class="paper-card form-panel">
          ${setup}
          <h2>Cadastro</h2>
          <form class="stacked-form two-columns" data-register-form>
            <div>
              <label for="name">Nome</label>
              <input id="name" name="name" type="text" autocomplete="name" placeholder="Ana Martins" required>
            </div>

            <div>
              <label for="username">Username</label>
              <input id="username" name="username" type="text" autocomplete="username" placeholder="anamartins" required>
            </div>

            <div>
              <label for="email">Email</label>
              <input id="email" name="email" type="email" autocomplete="email" placeholder="ana@email.com" required>
            </div>

            <div>
              <label for="password">Senha</label>
              <input id="password" name="password" type="password" autocomplete="new-password" placeholder="Crie uma senha" minlength="6" required>
            </div>

            <div>
              <label for="current-book">Livro atual</label>
              <input id="current-book" name="current_book" type="text" placeholder="Crime e Castigo" required>
            </div>

            <div>
              <label for="favorite-author">Autor favorito</label>
              <input id="favorite-author" name="favorite_author" type="text" placeholder="Fiódor Dostoiévski" required>
            </div>

            <div class="span-columns">
              <label for="bio">Bio</label>
              <textarea id="bio" name="bio" rows="5" placeholder="Escreva um pequeno retrato da sua vida entre livros."></textarea>
            </div>

            ${Button({ label: "Criar perfil", type: "submit", variant: "primary", className: "full span-columns" })}
          </form>
          <p class="form-note">Já tem conta? <a href="/login" data-link>Entre no Retrobooks</a>.</p>
        </div>
      </section>
    `;
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-register-form]");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        payload.username = normalizeUsername(payload.username);
        await registerUser(payload, `${window.location.origin}/login`);
        await ctx.refresh();

        if (ctx.state.user) {
          ctx.navigate("/feed");
          ctx.toast("Seu perfil literário nasceu no Retrobooks.");
        } else {
          ctx.navigate("/login");
          ctx.toast("Cadastro criado. Se o Supabase pedir confirmação por email, confirme antes de entrar.");
        }
      } catch (error) {
        ctx.toast(error.message || "Não foi possível criar sua conta.");
      }
    });
  }
};
