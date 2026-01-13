// src/components/users.component.js
import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function UsersComponent() {
    return `
<section
  class="bg-white rounded-xl border shadow-sm p-4 h-full min-h-0 flex flex-col"
  x-data="usersPage()"
  x-init="init()"
>
  <!-- Header -->
  <div class="flex items-center justify-between gap-4 mb-4 shrink-0">
    <h2 class="text-lg font-semibold">Utilisateurs</h2>

    <div class="flex gap-2 items-end">
      <select class="border rounded-lg px-3 py-2" x-model="filterStatus">
        <option value="">Tous</option>
        <option value="OK">OK</option>
        <option value="SUSPENDED">SUSPENDED</option>
        <option value="BLOCKED">BLOCKED</option>
        <option value="DELETED">DELETED</option>
      </select>

      <button
        class="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
        :disabled="loading"
        @click="load()"
      >
        Rafraîchir
      </button>
    </div>
  </div>

  <!-- Table container (prend toute la hauteur restante) -->
  <div class="flex-1 min-h-0 overflow-auto border rounded-lg">
    <table class="min-w-full text-sm">
      <thead class="bg-slate-100 sticky top-0 z-10">
        <tr>
          <th class="text-left p-2">Nom</th>
          <th class="text-left p-2">Email</th>
          <th class="text-left p-2">Status</th>
          <th class="text-left p-2">Paiement</th>
          <th class="text-left p-2">Abonnement</th>
          <th class="text-left p-2 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        <template x-for="u in users" :key="u.id">
          <tr class="border-t">
            <td class="p-2" x-text="u.firstName + ' ' + u.lastName"></td>
            <td class="p-2" x-text="u.email"></td>
            <td class="p-2">
                <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="statusClass(u.status)"
                x-text="u.status"
                ></span>
            </td>
            <td class="p-2" x-text="formatPayment(u.paymentMethod)"></td>
            <td class="p-2" >
                <button
                    class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    @click="goSubs(u.id)"
                    >
                    Voir abonnement
                </button>
            </td>

            <td class="p-2 text-right">
                <div class="flex justify-end items-center gap-2">
                    <div class="relative" x-data="{ open: false }">
                    <button
                        class="px-2 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-100"
                        @click="open = !open"
                        @click.outside="open = false"
                    >
                        ⋯
                    </button>

                    <div
                        x-show="open"
                        x-transition
                        class="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-20"
                    >
                        <button
                        class="w-full text-left px-3 py-2 hover:bg-emerald-50 text-emerald-700"
                        :disabled="u.status === 'OK'"
                        @click="open=false; setStatus(u.id,'OK')"
                        >
                        ✔ Mettre OK
                        </button>

                        <button
                        class="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-700"
                        :disabled="u.status === 'SUSPENDED'"
                        @click="open=false; setStatus(u.id,'SUSPENDED')"
                        >
                        ⏸ Suspendre
                        </button>

                        <button
                        class="w-full text-left px-3 py-2 hover:bg-red-50 text-red-700"
                        :disabled="u.status === 'BLOCKED'"
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
            <td class="p-3 text-slate-500 text-center" colspan="5">
              Aucun utilisateur.
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
