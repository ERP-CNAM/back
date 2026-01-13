import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function UsersComponent() {
    return `
<section
  class="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] p-4 h-full min-h-0 flex flex-col text-slate-100"
  x-data="usersPage()"
  x-init="init()"
>
  <!-- Header -->
  <div class="flex items-center justify-between gap-4 mb-4 shrink-0">
    <div>
      <h2 class="text-lg font-semibold text-white">Utilisateurs</h2>
      <p class="text-xs text-slate-400">Gestion des statuts et accès aux abonnements.</p>
    </div>

    <div class="flex gap-2 items-end flex-wrap">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-slate-400">Statut</label>
        <select
          class="border border-white/10 bg-white/5 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          x-model="filterStatus"
        >
          <option value="">Tous</option>
          <option value="OK">OK</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="BLOCKED">BLOCKED</option>
          <option value="DELETED">DELETED</option>
        </select>
      </div>

      <button
        class="px-3 py-2 rounded-lg bg-gradient-to-r from-slate-100 to-white text-slate-950 font-medium hover:opacity-95 disabled:opacity-50"
        :disabled="loading"
        @click="load()"
      >
        <span x-show="!loading">Rafraîchir</span>
        <span x-show="loading">Chargement…</span>
      </button>
    </div>
  </div>

  <!-- Table container -->
  <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-white/10 bg-white/5">
    <table class="min-w-full text-sm">
      <thead class="sticky top-0 z-10 bg-slate-950/70 backdrop-blur border-b border-white/10">
        <tr class="text-slate-300">
          <th class="text-left p-2 font-medium">Nom</th>
          <th class="text-left p-2 font-medium">Email</th>
          <th class="text-left p-2 font-medium">Status</th>
          <th class="text-left p-2 font-medium">Paiement</th>
          <th class="text-left p-2 font-medium">Abonnement</th>
          <th class="text-right p-2 font-medium">Actions</th>
        </tr>
      </thead>

      <tbody class="text-slate-100">
        <template x-for="u in users" :key="u.id">
          <tr class="border-t border-white/10 hover:bg-white/5">
            <td class="p-2 text-slate-100" x-text="(u.firstName ?? '') + ' ' + (u.lastName ?? '')"></td>

            <td class="p-2 text-slate-200">
              <span class="font-mono text-xs" x-text="u.email"></span>
            </td>

            <td class="p-2">
              <span
                class="px-2 py-1 rounded text-xs font-medium border border-white/10"
                :class="statusClass(u.status)"
                x-text="u.status"
              ></span>
            </td>

            <td class="p-2 text-slate-200" x-text="formatPayment(u.paymentMethod)"></td>

            <td class="p-2">
              <button
                class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/10 text-slate-100 hover:bg-white/15"
                @click="goSubs(u.id)"
              >
                Voir abonnement
              </button>
            </td>

            <td class="p-2 text-right">
              <div class="flex justify-end items-center gap-2">
                <div class="relative" x-data="{ open: false }">
                  <button
                    class="px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-50"
                    :disabled="loading"
                    @click="open = !open"
                    @click.outside="open = false"
                    aria-label="Actions"
                  >
                    ⋯
                  </button>

                  <div
                    x-show="open"
                    x-transition
                    class="absolute right-0 mt-2 w-52 bg-slate-950/95 backdrop-blur border border-white/10 rounded-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] z-20 overflow-hidden"
                  >
                    <button
                      class="w-full text-left px-3 py-2 hover:bg-emerald-500/10 text-emerald-200 disabled:opacity-50"
                      :disabled="loading || u.status === 'OK'"
                      @click="open=false; setStatus(u.id,'OK')"
                    >
                      ✔ Mettre OK
                    </button>

                    <button
                      class="w-full text-left px-3 py-2 hover:bg-amber-500/10 text-amber-200 disabled:opacity-50"
                      :disabled="loading || u.status === 'SUSPENDED'"
                      @click="open=false; setStatus(u.id,'SUSPENDED')"
                    >
                      ⏸ Suspendre
                    </button>

                    <button
                      class="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-200 disabled:opacity-50"
                      :disabled="loading || u.status === 'BLOCKED'"
                      @click="open=false; setStatus(u.id,'BLOCKED')"
                    >
                      ⛔ Bloquer
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>

        <template x-if="users.length === 0 && !loading">
          <tr>
            <td class="p-4 text-slate-400 text-center" colspan="6">
              Aucun utilisateur.
            </td>
          </tr>
        </template>

        <template x-if="loading">
          <tr>
            <td class="p-4 text-slate-400 text-center" colspan="6">
              Chargement…
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</section>
  `;
}

export function registerUsersAlpine() {
    Alpine.data('usersPage', () => ({
        loading: false,
        users: [],
        filterStatus: '',

        async init() {
            await this.load();
        },

        async load() {
            this.loading = true;
            try {
                const qs = this.filterStatus ? `?status=${encodeURIComponent(this.filterStatus)}` : '';
                const res = await apiRequest(`/users${qs}`);
                this.users = res?.payload ?? [];
            } catch (e) {
                toastStore.notify(e.message || 'Erreur chargement users', 'error');
            } finally {
                this.loading = false;
            }
        },

        async setStatus(userId, status) {
            this.loading = true;
            try {
                await apiRequest(`/users/${userId}/status`, { method: 'PATCH', body: { status } });
                toastStore.notify(`Statut mis à jour: ${status}`);
                await this.load();
            } catch (e) {
                toastStore.notify(e.message || 'Erreur update statut', 'error');
            } finally {
                this.loading = false;
            }
        },

        goSubs(userId) {
            location.hash = `#/subscriptions?userId=${encodeURIComponent(userId)}`;
        },

        statusClass(status) {
            switch (status) {
                case 'OK':
                    return 'bg-emerald-100 text-emerald-800';
                case 'SUSPENDED':
                    return 'bg-amber-100 text-amber-800';
                case 'BLOCKED':
                    return 'bg-red-100 text-red-800';
                case 'DELETED':
                    return 'bg-slate-200 text-slate-600';
                default:
                    return 'bg-slate-100 text-slate-700';
            }
        },

        formatPayment(pm) {
            if (!pm) return '-';
            if (pm.type === 'SEPA') return `SEPA (${pm.iban ?? 'IBAN masqué'})`;
            if (pm.type === 'CARD') return `CB (**** ${pm.cardLast4 ?? '----'})`;
            return pm.type ?? '-';
        },
    }));
}
