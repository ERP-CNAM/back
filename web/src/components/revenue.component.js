import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function RevenueComponent() {
    return `
<section
  class="bg-white rounded-xl border shadow-sm p-4 h-full min-h-0 flex flex-col"
  x-data="revenuePage()"
  x-init="init()"
>
  <!-- Header -->
  <div class="flex items-center justify-between gap-4 mb-4 shrink-0">
    <div>
      <h2 class="text-lg font-semibold">Chiffre d’affaires</h2>
    </div>

    <div class="flex gap-2 items-end flex-wrap">
      <select class="border rounded-lg px-3 py-2" x-model="range" @change="load()">
        <option value="ALL">Tout</option>
        <option value="30D">30 derniers jours</option>
        <option value="THIS_MONTH">Ce mois-ci</option>
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

  <!-- KPI cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 shrink-0">
    <div class="rounded-xl border p-4">
      <div class="text-sm text-slate-500">CA encaissé</div>
      <div class="text-2xl font-semibold mt-1" x-text="formatMoney(kpi.paidTotal)"></div>
      <div class="text-sm text-slate-500 mt-1">
        <span x-text="kpi.paidCount"></span> facture(s) payée(s)
      </div>
    </div>

    <div class="rounded-xl border p-4">
      <div class="text-sm text-slate-500">À encaisser</div>
      <div class="text-2xl font-semibold mt-1" x-text="formatMoney(kpi.unpaidTotal)"></div>
      <div class="text-sm text-slate-500 mt-1">
        <span x-text="kpi.unpaidCount"></span> facture(s) (PENDING/SENT)
      </div>
    </div>

    <div class="rounded-xl border p-4">
      <div class="text-sm text-slate-500">Échecs</div>
      <div class="text-2xl font-semibold mt-1" x-text="formatMoney(kpi.failedTotal)"></div>
      <div class="text-sm text-slate-500 mt-1">
        <span x-text="kpi.failedCount"></span> facture(s) FAILED
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
    <!-- Mini chart / breakdown -->
    <div class="min-h-0 rounded-xl border p-4 flex flex-col">
      <div class="flex items-center justify-between mb-3 shrink-0">
        <h3 class="font-semibold">CA encaissé par mois</h3>
        <span class="text-sm text-slate-500" x-text="paidByMonth.length ? (paidByMonth.length + ' mois') : '—'"></span>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <template x-if="paidByMonth.length === 0 && !loading">
          <div class="text-slate-500 text-sm">Aucune donnée sur la période.</div>
        </template>

        <div class="space-y-2">
          <template x-for="row in paidByMonth" :key="row.key">
            <div class="flex items-center gap-3">
              <div class="w-20 text-sm text-slate-700" x-text="row.label"></div>
              <div class="flex-1">
                <div class="h-2 rounded bg-slate-100 overflow-hidden">
                  <div
                    class="h-2 rounded bg-emerald-500"
                    :style="'width:' + (row.pct) + '%'"
                  ></div>
                </div>
              </div>
              <div class="w-28 text-right text-sm font-medium" x-text="formatMoney(row.total)"></div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Recent unpaid list -->
    <div class="min-h-0 rounded-xl border p-4 flex flex-col">
      <div class="flex items-center justify-between mb-3 shrink-0">
        <h3 class="font-semibold">Factures à encaisser</h3>
        <button
          class="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50 disabled:opacity-50"
          :disabled="loading || unpaidTop.length === 0"
          @click="goInvoicesUnpaid()"
        >
          Voir dans Factures
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-auto border rounded-lg">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th class="text-left p-2">Réf</th>
              <th class="text-left p-2">Date</th>
              <th class="text-right p-2">TTC</th>
              <th class="text-left p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            <template x-for="inv in unpaidTop" :key="inv.id">
              <tr class="border-t">
                <td class="p-2" x-text="inv.invoiceRef ?? inv.id"></td>
                <td class="p-2" x-text="inv.billingDate ?? '-'"></td>
                <td class="p-2 text-right" x-text="formatMoney(inv.amountInclVat)"></td>
                <td class="p-2">
                  <span
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="statusClass(inv.status)"
                    x-text="inv.status"
                  ></span>
                </td>
              </tr>
            </template>

            <template x-if="unpaidTop.length === 0 && !loading">
              <tr>
                <td class="p-3 text-slate-500 text-center" colspan="4">Rien à encaisser 🎉</td>
              </tr>
            </template>

            <template x-if="loading">
              <tr>
                <td class="p-3 text-slate-500 text-center" colspan="4">Chargement…</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-slate-500 mt-2">
        Liste limitée aux 20 plus récentes PENDING/SENT (sur la période sélectionnée).
      </p>
    </div>
  </div>
</section>
  `;
}

export function registerRevenueAlpine(Alpine) {
    Alpine.data('revenuePage', () => ({
        loading: false,

        range: 'ALL', // ALL | 30D | THIS_MONTH

        // Data
        paid: [],
        unpaid: [],
        failed: [],

        // Computed
        kpi: {
            paidTotal: 0,
            paidCount: 0,
            unpaidTotal: 0,
            unpaidCount: 0,
            failedTotal: 0,
            failedCount: 0,
        },

        paidByMonth: [],
        unpaidTop: [],

        init() {
            this.load();
        },

        async load() {
            this.loading = true;
            try {
                const { from, to } = this.getDateRange();

                // PAID
                const paidRes = await this.fetchInvoices({ status: 'PAID', from, to });
                // Unpaid = PENDING + SENT
                const pendingRes = await this.fetchInvoices({ status: 'PENDING', from, to });
                const sentRes = await this.fetchInvoices({ status: 'SENT', from, to });
                // FAILED
                const failedRes = await this.fetchInvoices({ status: 'FAILED', from, to });

                this.paid = paidRes;
                this.unpaid = [...pendingRes, ...sentRes];
                this.failed = failedRes;

                this.recompute();
            } catch (e) {
                toastStore.notify(e.message || "Erreur chargement chiffre d'affaires", 'error');
            } finally {
                this.loading = false;
            }
        },

        async fetchInvoices({ status, from, to }) {
            const params = new URLSearchParams();
            if (status) params.set('status', status);

            // ✅ Si ton API supporte un filtre date (sinon ça sera ignoré côté back => pas grave)
            if (from) params.set('from', from);
            if (to) params.set('to', to);

            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await apiRequest(`/invoices${qs}`);
            return res?.payload ?? [];
        },

        recompute() {
            const sum = (arr) =>
                arr.reduce((acc, x) => acc + (typeof x?.amountInclVat === 'number' ? x.amountInclVat : 0), 0);

            this.kpi.paidTotal = sum(this.paid);
            this.kpi.paidCount = this.paid.length;

            this.kpi.unpaidTotal = sum(this.unpaid);
            this.kpi.unpaidCount = this.unpaid.length;

            this.kpi.failedTotal = sum(this.failed);
            this.kpi.failedCount = this.failed.length;

            // paid by month
            const byMonth = new Map(); // key YYYY-MM
            for (const inv of this.paid) {
                const d =
                    this.parseAnyDate(inv?.billingDate) ||
                    this.parseAnyDate(inv?.periodEnd) ||
                    this.parseAnyDate(inv?.periodStart);
                if (!d) continue;
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const prev = byMonth.get(key) ?? 0;
                const amt = typeof inv?.amountInclVat === 'number' ? inv.amountInclVat : 0;
                byMonth.set(key, prev + amt);
            }

            const rows = Array.from(byMonth.entries())
                .map(([key, total]) => {
                    const [y, m] = key.split('-');
                    return { key, y: Number(y), m: Number(m), total };
                })
                .sort((a, b) => a.y - b.y || a.m - b.m);

            const max = rows.reduce((acc, r) => Math.max(acc, r.total), 0) || 1;
            this.paidByMonth = rows.map((r) => ({
                key: r.key,
                label: `${String(r.m).padStart(2, '0')}/${String(r.y).slice(2)}`,
                total: r.total,
                pct: Math.round((r.total / max) * 100),
            }));

            // unpaid top (recent first)
            this.unpaidTop = [...this.unpaid]
                .sort(
                    (a, b) =>
                        (this.parseAnyDate(b?.billingDate)?.getTime() ?? 0) -
                        (this.parseAnyDate(a?.billingDate)?.getTime() ?? 0),
                )
                .slice(0, 20);
        },

        // Utils
        getDateRange() {
            if (this.range === 'ALL') return { from: '', to: '' };

            const now = new Date();
            const start = new Date(now);

            if (this.range === '30D') {
                start.setDate(now.getDate() - 30);
            } else if (this.range === 'THIS_MONTH') {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
            }

            // YYYY-MM-DD
            const fmt = (d) =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            return { from: fmt(start), to: fmt(now) };
        },

        parseAnyDate(v) {
            if (!v) return null;
            // Support "YYYY-MM-DD" (API typical) or ISO.
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
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

        formatMoney(v) {
            if (typeof v !== 'number') return '-';
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
        },

        goInvoicesUnpaid() {
            // ton écran Factures filtre déjà par status unique, donc on envoie PENDING par défaut
            // (tu peux faire un bouton "SENT" à côté si tu veux)
            location.hash = `#/invoices?status=PENDING`;
        },
    }));
}
