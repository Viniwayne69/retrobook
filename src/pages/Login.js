import { AuthFrame } from "../components/AuthFrame.js";
import { Button } from "../components/Button.js";
import { formDataToObject } from "../utils.js";
import { resendConfirmationEmail, signInUser } from "../supabase.js";

export const Login = {
  async render(ctx) {
    const setup = ctx.hasSupabaseConfig ? "" : `
      <div class="setup-note">
        <strong>Supabase ainda não configurado.</strong>
        <span>Configure VITE_SUPABASE_URL e uma chave VITE_SUPABASE para ativar login e cadastro.</span>
      </div>
    `;

    return AuthFrame({
      mode: "login",
      setup,
      children: `
        <div class="auth-heading">
          <p class="eyebrow">Entre na sua conta</p>
          <p>A rede social dos pensadores.</p>
        </div>

        <div class="auth-alert" data-confirmation-alert hidden>
          <strong>Email ainda não confirmado</strong>
          <span>Confirme seu email pela mensagem enviada pelo Supabase. Se ela não chegou, peça um novo envio.</span>
          <button class="small-btn" type="button" data-resend-confirmation>Reenviar confirmação</button>
        </div>

        <form class="stacked-form auth-form" data-login-form>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" placeholder="seu@email.com" required>

          <label for="password">Senha</label>
          <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required>

          ${Button({ label: "Entrar", type: "submit", variant: "primary", className: "full" })}
        </form>

        <p class="form-note">Ainda não tem perfil? <a href="/cadastro" data-link>Faça seu cadastro</a>.</p>
      `
    });
  },

  async afterRender(ctx) {
    const form = document.querySelector("[data-login-form]");
    const confirmationAlert = document.querySelector("[data-confirmation-alert]");
    const resendButton = document.querySelector("[data-resend-confirmation]");
    let lastEmail = "";

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const payload = formDataToObject(form);
        lastEmail = payload.email;
        confirmationAlert.hidden = true;
        await signInUser(payload.email, payload.password);
        await ctx.refresh();
        ctx.navigate("/feed");
        ctx.toast("Você voltou para o Retrobook.");
      } catch (error) {
        if (isEmailNotConfirmed(error)) {
          confirmationAlert.hidden = false;
          ctx.toast("Seu email ainda não foi confirmado.");
          return;
        }

        ctx.toast(error.message || "Não foi possível entrar.");
      }
    });

    resendButton?.addEventListener("click", async () => {
      const email = lastEmail || document.querySelector("#email")?.value;

      if (!email) {
        ctx.toast("Digite seu email antes de reenviar a confirmação.");
        return;
      }

      try {
        await resendConfirmationEmail(email, `${window.location.origin}/login`);
        ctx.toast("Enviamos um novo email de confirmação.");
      } catch (error) {
        ctx.toast(error.message || "Não foi possível reenviar a confirmação.");
      }
    });
  }
};

function isEmailNotConfirmed(error) {
  return String(error?.message || "")
    .toLowerCase()
    .includes("email not confirmed");
}
