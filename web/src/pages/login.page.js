import { apiRequest } from '../api/client.js';
import { authStore } from '../stores/auth.store.js';
import { toastStore } from '../stores/toast.store.js';
import { config } from '../config.js';
import { go } from '../router.js';

export function LoginPage() {
    return `
    <section class="max-w-md bg-white p-6 rounded-xl border shadow-sm mx-auto mt-10"
      x-data="loginPage()"
      @keydown.enter.prevent="submit()"
    >
      <h1 class="text-xl font-semibold mb-1">Connexion admin</h1>
      <p class="text-sm text-slate-600 mb-4">Accès au backoffice abonnés.</p>

      <div class="space-y-3">
        <div>
          <label class="block text-xs text-slate-600 mb-1">Email</label>
          <input class="w-full border rounded-lg px-3 py-2"
            type="email"
            placeholder="admin@gamers-erp.com"
            x-model.trim="email" />
        </div>

        <div>
          <label class="block text-xs text-slate-600 mb-1">Mot de passe</label>
          <input class="w-full border rounded-lg px-3 py-2"
            type="password"
            placeholder="••••••••"
            x-model="password" />
        </div>

        <template x-if="error">
          <div class="text-sm text-red-600" x-text="error"></div>
        </template>

        <button class="w-full px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          :disabled="loading"
          @click="submit()">
          <span x-show="!loading">Se connecter</span>
          <span x-show="loading">Connexion…</span>
        </button>
      </div>
    </section>
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
