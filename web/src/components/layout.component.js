// src/components/layout.component.js
import { authStore } from '../stores/auth.store.js';
import { toastStore } from '../stores/toast.store.js';
import { go } from '../router.js';
export function Layout({ contentHtml }) {
    return `
  <div class="min-h-screen flex flex-col bg-slate-50" x-data>
    <header class="bg-white border-b shrink-0">
      <div class=" mx-auto px-4 py-3 flex items-center justify-between">
        <div class="font-semibold">Gamers ERP — Backoffice Abonnés</div>

        <div class="flex items-center gap-3">
          <div class="text-sm text-slate-600">${authStore.email || ''}</div>
          <button
            class="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800"
            @click="window.__appLogout()"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    <!-- main doit être flex-col sinon ton container ne peut pas "flex-1" -->
    <main class="flex-1 min-h-0 flex flex-col w-screen">
      <!-- container prend tout l'espace du main -->
      <div class="w-screen mx-auto px-4 py-4 flex flex-col flex-1 min-h-0">

        <template x-if="window.__toast.show">
          <div class="mb-4 p-3 rounded border bg-white shrink-0"
            :class="window.__toast.type==='error' ? 'border-red-300' : 'border-emerald-300'">
            <div class="font-medium" x-text="window.__toast.message"></div>
          </div>
        </template>

        <div class="flex gap-6 flex-1 min-h-0">
          <aside class="w-60 bg-white rounded-xl border shadow-sm p-3 shrink-0 self-stretch">
            <div class="text-xs uppercase tracking-wide text-slate-500 px-2 mb-2">Menu</div>
            <nav class="flex flex-col gap-1">
              <button class="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
                @click="window.__nav('/users')">
                Utilisateurs
              </button>
              <button class="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
                @click="window.__nav('/subscriptions')">
                Abonnements
              </button>
                <button class="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
                @click="window.__nav('/invoices')">
                Factures
              </button>
            </nav>
          </aside>

          <!-- content doit être flex-col si ta page veut "h-full" -->
          <div class="flex-1 min-w-0 min-h-0 flex flex-col">
            ${contentHtml}
          </div>
        </div>

      </div>
    </main>
  </div>
  `;
}

export function bindLayoutGlobals() {
    window.__toast = toastStore;
    window.__nav = (p) => go(p);
    window.__appLogout = () => {
        authStore.logout();
        toastStore.notify('Déconnecté.');
        go('/login');
    };
}
