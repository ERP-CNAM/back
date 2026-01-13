import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function InvoicesComponent() {
    return `
<section
  class="bg-white rounded-xl border shadow-sm p-4 h-full min-h-0 flex flex-col"
  x-data="invoicesPage()"
  x-init="init()"
>
  <div class="flex items-center justify-between gap-4 mb-4">
    <div>
      <h2 class="text-lg font-semibold">Factures</h2>
    </div>

    <div class="flex gap-2 items-end flex-wrap">
      <input
        class="border rounded-lg px-3 py-2 w-72"
        placeholder="UUID userId (optionnel)"
        x-model="filterUserId"
      />

      <input
        class="border rounded-lg px-3 py-2 w-72"
        placeholder="UUID subscriptionId (optionnel)"
        x-model="filterSubscriptionId"
      />

      <select class="border rounded-lg px-3 py-2" x-model="filterStatus">
        <option value="">Tous</option>
        <option value="PENDING">PENDING</option>
        <option value="SENT">SENT</option>
        <option value="PAID">PAID</option>
        <option value="FAILED">FAILED</option>
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

  <div class="flex-1 min-h-0 overflow-auto border rounded-lg">
    <table class="min-w-full text-sm">
      <thead class="bg-slate-100 sticky top-0 z-10">
        <tr>
          <th class="text-left p-2">Réf</th>
          <th class="text-left p-2">Période</th>
          <th class="text-left p-2">Date facture</th>
          <th class="text-left p-2">Utilisateur</th>
          <th class="text-left p-2">Abonnement</th>
          <th class="text-left p-2 text-right">TTC</th>
          <th class="text-left p-2">Statut</th>
        </tr>
      </thead>

      <tbody>
        <template x-for="inv in invoices" :key="inv.id">
          <tr class="border-t">
            <td class="p-2" x-text="inv.invoiceRef ?? inv.id"></td>

            <td class="p-2" x-text="formatPeriod(inv)"></td>

            <td class="p-2" x-text="inv.billingDate ?? '-'"></td>

            <td class="p-2" x-text="formatUser(inv)"></td>

            <td class="p-2" x-text="formatSub(inv)"></td>

            <td class="p-2 text-right" x-text="formatMoney(inv.amountInclVat)"></td>

            <td class="p-2">
              <span
                class="px-2 py-1 rounded text-xs font-medium transition-colors"
                :class="statusClass(inv.status)"
                x-text="inv.status"
                ></span>
            </td>
          </tr>
        </template>

        <template x-if="invoices.length===0 && !loading">
          <tr>
            <td class="p-3 text-slate-500 text-center" colspan="7">Aucune facture.</td>
          </tr>
        </template>

        <template x-if="loading">
          <tr>
            <td class="p-3 text-slate-500 text-center" colspan="7">Chargement…</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</section>
  `;
}

export function registerInvoicesAlpine(Alpine) {
    Alpine.data('invoicesPage', () => ({
        loading: false,
        invoices: [],

        filterUserId: '',
        filterSubscriptionId: '',
        filterStatus: '',

        init() {
            this.applyHashParams();
            this.load();
        },

        applyHashParams() {
            try {
                const hash = location.hash || '';
                const parts = hash.split('?');
                if (parts.length < 2) return;
                const params = new URLSearchParams(parts[1]);
                const userId = params.get('userId');
                const subscriptionId = params.get('subscriptionId');
                if (userId) this.filterUserId = userId;
                if (subscriptionId) this.filterSubscriptionId = subscriptionId;
            } catch {}
        },
        statusClass(status) {
            switch (status) {
                case 'PAID':
                    return 'bg-emerald-100 text-emerald-800';
                case 'SENT':
                    return 'bg-indigo-100 text-indigo-800';
                case 'PENDING':
                    return 'bg-amber-100 text-amber-800';
                case 'FAILED':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-slate-100 text-slate-700';
            }
        },

        async load() {
            this.loading = true;
            try {
                const params = new URLSearchParams();
                if (this.filterUserId) params.set('userId', this.filterUserId);
                if (this.filterSubscriptionId) params.set('subscriptionId', this.filterSubscriptionId);
                if (this.filterStatus) params.set('status', this.filterStatus);

                const qs = params.toString() ? `?${params.toString()}` : '';
                const res = await apiRequest(`/invoices${qs}`);
                this.invoices = res?.payload ?? [];
            } catch (e) {
                toastStore.notify(e.message || 'Erreur chargement factures', 'error');
            } finally {
                this.loading = false;
            }
        },

        formatPeriod(inv) {
            const a = inv?.periodStart ?? '-';
            const b = inv?.periodEnd ?? '-';
            return `${a} → ${b}`;
        },

        formatUser(inv) {
            // si ton API renvoie InvoiceDetailed.subscription.user
            const u = inv?.subscription?.user;
            if (u?.firstName || u?.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
            return inv?.userId ?? '-';
        },

        formatSub(inv) {
            const s = inv?.subscription;
            if (!s) return inv?.subscriptionId ?? '-';
            return s.contractCode ? `${s.contractCode}` : (s.id ?? inv?.subscriptionId ?? '-');
        },

        formatMoney(v) {
            if (typeof v !== 'number') return '-';
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
        },
    }));
}
