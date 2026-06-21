import { AuthFrame } from "../components/AuthFrame.js";
import { Button } from "../components/Button.js";
import { formDataToObject, normalizeUsername } from "../utils.js";
import { registerUser } from "../supabase.js";

export const Register = {
  async render(ctx) {
    const setup = ctx.hasSupabaseConfig ? "" : `
      <div class="setup-note">
        <strong>Supabase ainda não configurado.</strong>
        <span>O cadastro será ativado depois que as variáveis do ambiente forem preenchidas.</span>
      </div>
    `;

    return AuthFrame({
      mode: "register",
      setup,
      children: `
        <div class="auth-heading compact">
          <p>A rede social dos pensadores.</p>
        </div>

        <form class="stacked-form two-columns auth-form" data-register-form>
          <div>
            <label for="name">Nome</label>
            <input id="name" name="name" type="text" autocomplete="name" placeholder="Vinicius Ribeiro" required>
          </div>

          <div>
            <label for="username">ID de usuário</label>
            <input id="username" name="username" type="text" autocomplete="username" placeholder="vinicius" required>
          </div>

          <div>
            <label for="email">Email</label>
            <input id="email" name="email" type="email" autocomplete="email" placeholder="seu@email.com" required>
          </div>

          <div>
            <label for="password">Senha</label>
            <input id="password" name="password" type="password" autocomplete="new-password" placeholder="Crie uma senha" minlength="6" required>
          </div>

          <div>
            <label for="avatar-url">Foto de perfil opcional</label>
            <input id="avatar-url" name="avatar_url" type="url" placeholder="https://exemplo.com/foto.jpg">
          </div>

          <div>
            <label for="current-book">Livro que está lendo</label>
            <input id="current-book" name="current_book" type="text" placeholder="Abolição do homem" required>
          </div>

          <div class="span-columns">
            <label for="bio">Biografia</label>
            <textarea id="bio" name="bio" rows="4" placeholder="Conte um pouco sobre sua vida entre livros."></textarea>
          </div>

          ${Button({ label: "Fazer cadastro", type: "submit", variant: "primary", className: "full span-columns" })}
        </form>

        <p class="form-note">Já tem uma conta? <a href="/login" data-link>Entrar no Retrobook</a>.</p>
      `
    });
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-register-form]");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        payload.username = normalizeUsername(payload.username);
        payload.favorite_author = "";
        await registerUser(payload, `${window.location.origin}/login`);
        await ctx.refresh();

        if (ctx.state.user) {
          ctx.navigate("/feed");
          ctx.toast("Seu perfil nasceu no Retrobook.");
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
