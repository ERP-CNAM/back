import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function InvoicesComponent() {
    return `
<section
  class="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] p-4 h-full min-h-0 flex flex-col text-slate-100"
  x-data="invoicesPage()"
  x-init="init()"
>
  <div class="flex items-center justify-between gap-4 mb-4 shrink-0">
    <div>
      <h2 class="text-lg font-semibold text-white">Factures</h2>
    </div>

    <div class="flex gap-2 items-end flex-wrap">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-slate-400">userId (optionnel)</label>
        <input
          class="border border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          placeholder="UUID userId"
          x-model.trim="filterUserId"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-slate-400">subscriptionId (optionnel)</label>
        <input
          class="border border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          placeholder="UUID subscriptionId"
          x-model.trim="filterSubscriptionId"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-slate-400">Statut</label>
        <select
          class="border border-white/10 bg-white/5 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          x-model="filterStatus"
        >
          <option value="">Tous</option>
          <option value="PENDING">PENDING</option>
          <option value="SENT">SENT</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
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

  <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-white/10 bg-white/5">
    <table class="min-w-full text-sm">
      <thead class="sticky top-0 z-10 bg-slate-950/70 backdrop-blur border-b border-white/10">
        <tr class="text-slate-300">
          <th class="text-left p-2 font-medium">Réf</th>
          <th class="text-left p-2 font-medium">Période</th>
          <th class="text-left p-2 font-medium">Date facture</th>
          <th class="text-left p-2 font-medium">Utilisateur</th>
          <th class="text-left p-2 font-medium">Abonnement</th>
          <th class="text-right p-2 font-medium">TTC</th>
          <th class="text-left p-2 font-medium">Statut</th>
        </tr>
      </thead>

      <tbody class="text-slate-100">
        <template x-for="inv in invoices" :key="inv.id">
          <tr class="border-t border-white/10 hover:bg-white/5">
            <td class="p-2">
              <span class="font-mono text-xs text-slate-200" x-text="inv.invoiceRef ?? inv.id"></span>
            </td>

            <td class="p-2 text-slate-200" x-text="formatPeriod(inv)"></td>

            <td class="p-2 text-slate-200" x-text="inv.billingDate ?? '-'"></td>

            <td class="p-2 text-slate-200" x-text="formatUser(inv)"></td>

            <td class="p-2 text-slate-200" x-text="formatSub(inv)"></td>

            <td class="p-2 text-right text-slate-100 font-medium" x-text="formatMoney(inv.amountInclVat)"></td>

            <td class="p-2">
              <span
                class="px-2 py-1 rounded text-xs font-medium border border-white/10"
                :class="statusClass(inv.status)"
                x-text="inv.status"
              ></span>
            </td>
          </tr>
        </template>

        <template x-if="invoices.length===0 && !loading">
          <tr>
            <td class="p-4 text-slate-400 text-center" colspan="7">Aucune facture.</td>
          </tr>
        </template>

        <template x-if="loading">
          <tr>
            <td class="p-4 text-slate-400 text-center" colspan="7">Chargement…</td>
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
                    return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20';
                case 'SENT':
                    return 'bg-indigo-500/15 text-indigo-200 border-indigo-400/20';
                case 'PENDING':
                    return 'bg-amber-500/15 text-amber-200 border-amber-400/20';
                case 'FAILED':
                    return 'bg-red-500/15 text-red-200 border-red-400/20';
                default:
                    return 'bg-white/10 text-slate-200 border-white/10';
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
