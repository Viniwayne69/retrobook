import { AuthFrame } from "../components/AuthFrame.js";
import { Button } from "../components/Button.js";
import { formDataToObject } from "../utils.js";
import { resendConfirmationEmail, signInUser } from "../supabase.js";

export const Login = {
  async render(ctx) {
    const setup = ctx.hasSupabaseConfig ? "" : `
      <div class="setup-note">
        <strong>Supabase ainda nao configurado.</strong>
        <span>Configure VITE_SUPABASE_URL e uma chave VITE_SUPABASE para ativar login e cadastro.</span>
      </div>
    `;

    return AuthFrame({
      mode: "login",
      setup,
      children: `
        <div class="auth-heading">
          <p class="eyebrow">Entre na sua conta</p>
          <h1>Volte para a sua estante.</h1>
          <p>Continue suas conversas, seus clubes e suas leituras em um lugar simples, calmo e bem organizado.</p>
        </div>

        <div class="auth-alert" data-confirmation-alert hidden>
          <strong>Email ainda nao confirmado</strong>
          <span>Confirme seu email pela mensagem enviada pelo Supabase. Se ela nao chegou, peca um novo envio.</span>
          <button class="small-btn" type="button" data-resend-confirmation>Reenviar confirmacao</button>
        </div>

        <form class="stacked-form auth-form" data-login-form>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" placeholder="voce@email.com" required>

          <label for="password">Senha</label>
          <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required>

          ${Button({ label: "Entrar", type: "submit", variant: "primary", className: "full" })}
        </form>

        <p class="form-note">Ainda nao tem perfil? <a href="/cadastro" data-link>Faca seu cadastro</a>.</p>
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
        ctx.toast("Voce voltou para o Retrobook.");
      } catch (error) {
        if (isEmailNotConfirmed(error)) {
          confirmationAlert.hidden = false;
          ctx.toast("Seu email ainda nao foi confirmado.");
          return;
        }

        ctx.toast(error.message || "Nao foi possivel entrar.");
      }
    });

    resendButton?.addEventListener("click", async () => {
      const email = lastEmail || document.querySelector("#email")?.value;

      if (!email) {
        ctx.toast("Digite seu email antes de reenviar a confirmacao.");
        return;
      }

      try {
        await resendConfirmationEmail(email, `${window.location.origin}/login`);
        ctx.toast("Enviamos um novo email de confirmacao.");
      } catch (error) {
        ctx.toast(error.message || "Nao foi possivel reenviar a confirmacao.");
      }
    });
  }
};

function isEmailNotConfirmed(error) {
  return String(error?.message || "")
    .toLowerCase()
    .includes("email not confirmed");
}
