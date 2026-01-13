// src/components/layout.component.js
import { authStore } from '../stores/auth.store.js';
import { toastStore } from '../stores/toast.store.js';
import { go } from '../router.js';

export function Layout({ contentHtml }) {
    return `
  <div class="min-h-screen" x-data>
    <!-- Header -->
    <header class="bg-white border-b">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="font-semibold">Gamers ERP — Backoffice Abonnés</div>

        <div class="flex items-center gap-3">
          <div class="text-sm text-slate-600">${authStore.email || ''}</div>
          <button
            class="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800"
            @click="${'window.__appLogout()'}"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    <!-- Toast -->
    <div class="max-w-6xl mx-auto px-4 py-4">
      <template x-if="window.__toast.show">
        <div class="mb-4 p-3 rounded border bg-white"
          :class="window.__toast.type==='error' ? 'border-red-300' : 'border-emerald-300'">
          <div class="font-medium" x-text="window.__toast.message"></div>
        </div>
      </template>

      <div class="flex gap-6">
        <!-- Sidebar -->
        <aside class="w-60 bg-white rounded-xl border shadow-sm p-3 h-fit">
          <div class="text-xs uppercase tracking-wide text-slate-500 px-2 mb-2">Menu</div>
          <nav class="flex flex-col gap-1">
            <button class="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
              @click="${"window.__nav('/users')"}">
              Utilisateurs
            </button>
            <button class="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
              @click="${"window.__nav('/subscriptions')"}">
              Abonnements
            </button>
          </nav>
        </aside>

        <!-- Content -->
        <div class="flex-1 space-y-6">
          ${contentHtml}
        </div>
      </div>
    </div>
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
