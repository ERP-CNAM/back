import { authStore } from '../stores/auth.store.js';
import { toastStore } from '../stores/toast.store.js';
import { go } from '../router.js';

export function Layout({ contentHtml }) {
    return `
  <div
    class="relative min-h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100"
    x-data="{
      activeRoute: '',
      setActive() {
        const h = location.hash || '';
        const clean = h.startsWith('#') ? h.slice(1) : h;
        this.activeRoute = (clean.split('?')[0] || '/users') || '/users';
      }
    }"
    x-init="setActive(); window.addEventListener('hashchange', () => setActive())"
  >
    <!-- Background layers (match login) -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl"></div>
      <div class="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-3xl"></div>

      <div class="absolute inset-0 opacity-[0.14]"
        style="background-image:
          linear-gradient(to right, rgba(148,163,184,.35) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,.35) 1px, transparent 1px);
        background-size: 48px 48px;">
      </div>

      <div class="absolute inset-0 opacity-[0.08]"
        style="background-image: repeating-linear-gradient(
          135deg,
          rgba(255,255,255,.9) 0px,
          rgba(255,255,255,.9) 1px,
          transparent 1px,
          transparent 14px
        );">
      </div>

      <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent animate-[scan_6s_linear_infinite]"></div>

      <div class="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22400%22 height=%22400%22 filter=%22url(%23n)%22 opacity=%220.35%22/></svg>');">
      </div>
    </div>

    <header class="relative bg-white/5 backdrop-blur border-b border-white/10 shrink-0">
      <div class="mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <div class="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-cyan-300" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 7h18M3 12h18M3 17h18M7 3v18" />
                </svg>
            </div>

            <div class="leading-tight">
                <div class="text-sm font-semibold text-slate-100">Gamers ERP</div>
                <div class="text-[11px] text-slate-400">Backoffice abonnés</div>
            </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-sm text-slate-300">${authStore.email || ''}</div>
          <button
            class="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-slate-100 hover:bg-white/15"
            @click="window.__appLogout()"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    <main class="relative flex-1 min-h-0 flex flex-col w-screen">
      <div class="w-screen mx-auto px-4 py-4 flex flex-col flex-1 min-h-0">

        <template x-if="window.__toast.show">
          <div
            class="mb-4 p-3 rounded-xl border backdrop-blur bg-white/8 shrink-0"
            :class="window.__toast.type==='error'
              ? 'border-red-400/30'
              : 'border-emerald-400/30'"
          >
            <div class="font-medium text-slate-100" x-text="window.__toast.message"></div>
          </div>
        </template>

        <div class="flex gap-6 flex-1 min-h-0">
          <aside class="w-60 shrink-0 self-stretch rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] p-3">
            <div class="text-xs uppercase tracking-wide text-slate-400 px-2 mb-2">Menu</div>

            <nav class="flex flex-col gap-1">
              <button
                class="text-left px-3 py-2 rounded-lg transition-colors"
                :class="activeRoute === '/users'
                  ? 'bg-white/15 text-white border border-white/10'
                  : 'hover:bg-white/10 text-slate-200'"
                @click="window.__nav('/users'); setActive()"
              >
                Utilisateurs
              </button>

              <button
                class="text-left px-3 py-2 rounded-lg transition-colors"
                :class="activeRoute === '/subscriptions'
                  ? 'bg-white/15 text-white border border-white/10'
                  : 'hover:bg-white/10 text-slate-200'"
                @click="window.__nav('/subscriptions'); setActive()"
              >
                Abonnements
              </button>

              <button
                class="text-left px-3 py-2 rounded-lg transition-colors"
                :class="activeRoute === '/invoices'
                  ? 'bg-white/15 text-white border border-white/10'
                  : 'hover:bg-white/10 text-slate-200'"
                @click="window.__nav('/invoices'); setActive()"
              >
                Factures
              </button>

              <button
                class="text-left px-3 py-2 rounded-lg transition-colors"
                :class="activeRoute === '/revenue'
                  ? 'bg-white/15 text-white border border-white/10'
                  : 'hover:bg-white/10 text-slate-200'"
                @click="window.__nav('/revenue'); setActive()"
              >
                Chiffre d’affaires
              </button>
            </nav>
          </aside>

          <div class="flex-1 min-w-0 min-h-0 flex flex-col">
            ${contentHtml}
          </div>
        </div>

      </div>
    </main>

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

export function bindLayoutGlobals() {
    window.__toast = toastStore;
    window.__nav = (p) => go(p);
    window.__appLogout = () => {
        authStore.logout();
        toastStore.notify('Déconnecté.');
        go('/login');
    };
}
