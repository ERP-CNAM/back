// src/components/users.component.js
import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function UsersComponent() {
    return `
  <section class="bg-white rounded-xl border shadow-sm p-4" x-data="usersPage()" x-init="init()">
    <div class="flex items-center justify-between gap-4 mb-4">
      <div>
        <h2 class="text-lg font-semibold">Utilisateurs</h2>
      </div>

      <div class="flex gap-2 items-end">
        <div>
          <select class="border rounded-lg px-3 py-2" x-model="filterStatus">
            <option value="">Tous</option>
            <option value="OK">OK</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="DELETED">DELETED</option>
          </select>
        </div>

        <button class="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          :disabled="loading" @click="load()">
          Rafraîchir
        </button>
      </div>
    </div>

    <div class="overflow-auto border rounded-lg">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-100">
          <tr>
            <th class="text-left p-2">Nom</th>
            <th class="text-left p-2">Email</th>
            <th class="text-left p-2">Status</th>
            <th class="text-left p-2">Paiement</th>
            <th class="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template x-for="u in users" :key="u.id">
            <tr class="border-t">
              <td class="p-2" x-text="u.firstName + ' ' + u.lastName"></td>
              <td class="p-2" x-text="u.email"></td>
              <td class="p-2">
                <span class="px-2 py-1 rounded bg-slate-100" x-text="u.status"></span>
              </td>
              <td class="p-2" x-text="formatPayment(u.paymentMethod)"></td>
              <td class="p-2">
                <div class="flex gap-2 flex-wrap">
                  <button class="px-2 py-1 rounded border hover:bg-slate-50" @click="setStatus(u.id,'OK')">OK</button>
                  <button class="px-2 py-1 rounded border hover:bg-slate-50" @click="setStatus(u.id,'SUSPENDED')">Suspend</button>
                  <button class="px-2 py-1 rounded border hover:bg-slate-50" @click="setStatus(u.id,'BLOCKED')">Block</button>
                  <button class="px-2 py-1 rounded border hover:bg-slate-50" @click="goSubs(u.id)">Voir abonnements</button>
                </div>
              </td>
            </tr>
          </template>

          <template x-if="users.length===0 && !loading">
            <tr><td class="p-3 text-slate-500" colspan="5">Aucun utilisateur.</td></tr>
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

        formatPayment(pm) {
            if (!pm) return '-';
            if (pm.type === 'SEPA') return `SEPA (${pm.iban ?? 'IBAN masqué'})`;
            if (pm.type === 'CARD') return `CB (**** ${pm.cardLast4 ?? '----'})`;
            return pm.type ?? '-';
        },
    }));
}
