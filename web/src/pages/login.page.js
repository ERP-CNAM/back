import { apiRequest } from '../api/client.js';
import { authStore } from '../stores/auth.store.js';
import { toastStore } from '../stores/toast.store.js';
import { config } from '../config.js';
import { go } from '../router.js';

export function LoginPage() {
    return `
  <div class="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-slate-950 text-slate-100">
    <!-- Background layers -->
    <div class="pointer-events-none absolute inset-0">
      <!-- Soft radial glows -->
      <div class="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl"></div>
      <div class="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-3xl"></div>

      <!-- Subtle grid -->
      <div class="absolute inset-0 opacity-[0.14]"
        style="background-image:
          linear-gradient(to right, rgba(148,163,184,.35) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,.35) 1px, transparent 1px);
        background-size: 48px 48px;">
      </div>

      <!-- Diagonal “code lines” -->
      <div class="absolute inset-0 opacity-[0.08]"
        style="background-image: repeating-linear-gradient(
          135deg,
          rgba(255,255,255,.9) 0px,
          rgba(255,255,255,.9) 1px,
          transparent 1px,
          transparent 14px
        );">
      </div>

      <!-- Animated scanner bar -->
      <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent animate-[scan_6s_linear_infinite]"></div>

      <!-- Tiny noise (makes it less “empty”) -->
      <div class="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22400%22 height=%22400%22 filter=%22url(%23n)%22 opacity=%220.35%22/></svg>');">
      </div>
    </div>

    <!-- Card -->
    <section class="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] p-6"
      x-data="loginPage()"
      @keydown.enter.prevent="submit()"
    >
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <div class="h-2 w-2 rounded-full bg-emerald-400/80"></div>
          <h1 class="text-xl font-semibold text-white">Connexion admin</h1>
        </div>
        <p class="text-sm text-slate-300">Accès au backoffice abonnés.</p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs text-slate-300 mb-1">Email</label>
          <input class="w-full border border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            type="email"
            placeholder="admin@gamers-erp.com"
            x-model.trim="email" />
        </div>

        <div>
          <label class="block text-xs text-slate-300 mb-1">Mot de passe</label>
          <input class="w-full border border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            type="password"
            placeholder="••••••••"
            x-model="password" />
        </div>

        <template x-if="error">
          <div class="text-sm text-red-300" x-text="error"></div>
        </template>

        <button class="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-slate-100 to-white text-slate-950 font-medium hover:opacity-95 disabled:opacity-50"
          :disabled="loading"
          @click="submit()">
          <span x-show="!loading">Se connecter</span>
          <span x-show="loading">Connexion…</span>
        </button>

        <!-- Tiny footer “code vibe” -->
        <div class="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
          <span class="font-mono opacity-80">ENV: backoffice</span>
          <span class="font-mono opacity-80">API: <span x-text="apiUrl"></span></span>
        </div>
      </div>
    </section>

    <!-- Tailwind keyframes -->
    <style>
      @keyframes scan {
        0% { transform: translateY(-20vh); opacity: .0; }
        10% { opacity: .9; }
        50% { opacity: .35; }
        100% { transform: translateY(120vh); opacity: .0; }
      }
    </style>
  </div>
  `;
}

export function registerLoginAlpine() {
    window.loginPage = function () {
        return {
            loading: false,
            error: '',
            apiUrl: config.API || 'http://localhost:3000',
            email: 'admin@gamers-erp.com',
            password: 'Password123!',

            async submit() {
                if (this.loading) return;

                // validations rapides
                if (!this.apiUrl?.trim()) {
                    this.error = "L'URL API est obligatoire.";
                    toastStore.notify(this.error, 'error');
                    return;
                }
                if (!this.email?.trim() || !this.password) {
                    this.error = 'Email et mot de passe requis.';
                    toastStore.notify(this.error, 'error');
                    return;
                }

                this.error = '';
                this.loading = true;

                try {
                    // on force la base URL runtime
                    config.API = this.apiUrl.trim();

                    const res = await apiRequest('/auth/admin/login', {
                        method: 'POST',
                        body: { email: this.email.trim(), password: this.password },
                        auth: false,
                    });

                    // adapte selon ton format API
                    const token = res?.payload?.token ?? res?.token;
                    const admin = res?.payload?.admin ?? res?.admin;

                    if (!token) throw new Error('Token manquant (payload.token)');

                    authStore.login({
                        token,
                        email: admin?.email || this.email.trim(),
                    });

                    toastStore.notify('Connecté.');
                    go('/users');
                } catch (e) {
                    const msg = e?.message || 'Erreur login';
                    this.error = msg;
                    toastStore.notify(msg, 'error');
                } finally {
                    this.loading = false;
                }
            },
        };
    };
}
