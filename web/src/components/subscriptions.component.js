// src/components/subscriptions.component.js
import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function SubscriptionsComponent() {
    return `
<section
  class="bg-white rounded-xl border shadow-sm p-4 h-full min-h-0 flex flex-col"
  x-data="subscriptionsPage()"
  x-init="init()"
>
  <!-- Header -->
  <div class="flex items-center justify-between gap-4 mb-4 shrink-0">
    <h2 class="text-lg font-semibold">Abonnements</h2>

    <div class="flex gap-2 items-end flex-wrap">
      <input
        class="border rounded-lg px-3 py-2 w-72"
        placeholder="UUID userId (optionnel)"
        x-model="filterUserId"
      />

      <select class="border rounded-lg px-3 py-2" x-model="filterStatus">
        <option value="">Tous</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="CANCELLED">CANCELLED</option>
        <option value="PENDING_CANCEL">PENDING_CANCEL</option>
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
          <th class="text-left p-2">Contract</th>
          <th class="text-left p-2">Utilisateur</th>
          <th class="text-left p-2">Début</th>
          <th class="text-left p-2">Fin</th>
          <th class="text-left p-2">Montant</th>
          <th class="text-left p-2">Status</th>
          <th class="p-2 ">Factures</th>
          <th class="text-left p-2 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        <template x-for="s in subscriptions" :key="s.id">
          <tr class="border-t">
            <td class="p-2" x-text="s.contractCode"></td>
            <td class="p-2" x-text="formatUser(s)"></td>
            <td class="p-2" x-text="s.startDate"></td>
            <td class="p-2" x-text="s.endDate ?? '-'"></td>
            <td class="p-2" x-text="formatMoney(s.monthlyAmount)"></td>
            <td class="p-2">
              <span class="px-2 py-1 rounded bg-slate-100" x-text="s.status"></span>
            </td>
            <td class="p-2 text-center">
               <button
                  class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  :disabled="loading"
                  @click="goInvoices(s.id)"
                >
                  Voir factures
                </button>
            </td>
            <td class="p-2 text-right">
              <div class="flex justify-end items-center gap-2">
                <div class="relative" x-data="{ open: false }">
                  <button
                    class="px-2 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    :disabled="loading"
                    @click="open = !open"
                    @click.outside="open = false"
                  >
                    ⋯
                  </button>

                  <div
                    x-show="open"
                    x-transition
                    class="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg z-20"
                  >
                    <button
                      class="w-full text-left px-3 py-2 hover:bg-red-50 text-red-700 disabled:opacity-50"
                      :disabled="loading || s.status === 'CANCELLED'"
                      @click="open=false; confirmCancel(s.id)"
                    >
                      🗑 Résilier
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>

        <template x-if="subscriptions.length === 0 && !loading">
          <tr>
            <td class="p-3 text-slate-500 text-center" colspan="7">
              Aucun abonnement.
            </td>
          </tr>
        </template>

        <template x-if="loading">
          <tr>
            <td class="p-3 text-slate-500 text-center" colspan="7">
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

export function registerSubscriptionsAlpine(Alpine) {
    Alpine.data('subscriptionsPage', () => ({
        loading: false,
        subscriptions: [],
        filterUserId: '',
        filterStatus: '',

        init() {
            this.applyHashParams();
            this.load();
        },

        formatUser(s) {
            const u = s?.user;
            if (u?.firstName || u?.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
            return s?.userId ?? '-';
        },

        applyHashParams() {
            try {
                const hash = location.hash || '';
                const parts = hash.split('?');
                if (parts.length < 2) return;
                const params = new URLSearchParams(parts[1]);
                const userId = params.get('userId');
                if (userId) this.filterUserId = userId;
            } catch {}
        },

        async load() {
            this.loading = true;
            try {
                const params = new URLSearchParams();
                if (this.filterUserId) params.set('userId', this.filterUserId);
                if (this.filterStatus) params.set('status', this.filterStatus);

                const qs = params.toString() ? `?${params.toString()}` : '';
                const res = await apiRequest(`/subscriptions${qs}`);
                this.subscriptions = res?.payload ?? [];
            } catch (e) {
                toastStore.notify(e.message || 'Erreur chargement abonnements', 'error');
            } finally {
                this.loading = false;
            }
        },

        goInvoices(subscriptionId) {
            location.hash = `#/invoices?subscriptionId=${encodeURIComponent(subscriptionId)}`;
        },

        copyId(id) {
            try {
                navigator.clipboard?.writeText(id);
                toastStore.notify('ID copié.');
            } catch {
                toastStore.notify('Impossible de copier (clipboard).', 'error');
            }
        },

        async confirmCancel(subscriptionId) {
            if (!confirm('Confirmer la résiliation de cet abonnement ?')) return;
            await this.cancel(subscriptionId);
        },

        async cancel(subscriptionId) {
            this.loading = true;
            try {
                await apiRequest(`/subscriptions/${subscriptionId}`, { method: 'DELETE' });
                toastStore.notify('Abonnement résilié.');
                await this.load();
            } catch (e) {
                toastStore.notify(e.message || 'Erreur résiliation', 'error');
            } finally {
                this.loading = false;
            }
        },

        formatMoney(v) {
            if (typeof v !== 'number') return '-';
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
        },
    }));
}
