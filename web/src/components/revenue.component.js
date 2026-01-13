import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function RevenueComponent() {
    return `
<section
  class="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] p-4 h-full min-h-0 flex flex-col text-slate-100"
  x-data="revenuePage()"
  x-init="init()"
>
  <!-- Header -->
  <div class="flex items-center justify-between gap-4 mb-4 shrink-0">
    <div>
      <h2 class="text-lg font-semibold text-white">Chiffre d’affaires</h2>
      <p class="text-xs text-slate-400">Vue synthèse des paiements, impayés et échecs.</p>
    </div>

    <div class="flex gap-2 items-end flex-wrap">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-slate-400">Période</label>
        <select
          class="border border-white/10 bg-white/5 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          x-model="range"
          @change="load()"
        >
          <option value="ALL">Tout</option>
          <option value="30D">30 derniers jours</option>
          <option value="THIS_MONTH">Ce mois-ci</option>
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

  <!-- KPI cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 shrink-0">
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="text-sm text-slate-400">CA encaissé</div>
      <div class="text-2xl font-semibold mt-1 text-white" x-text="formatMoney(kpi.paidTotal)"></div>
      <div class="text-sm text-slate-400 mt-1">
        <span class="text-slate-200" x-text="kpi.paidCount"></span> facture(s) payée(s)
      </div>
    </div>

    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="text-sm text-slate-400">À encaisser</div>
      <div class="text-2xl font-semibold mt-1 text-white" x-text="formatMoney(kpi.unpaidTotal)"></div>
      <div class="text-sm text-slate-400 mt-1">
        <span class="text-slate-200" x-text="kpi.unpaidCount"></span> facture(s) (PENDING/SENT)
      </div>
    </div>

    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="text-sm text-slate-400">Échecs</div>
      <div class="text-2xl font-semibold mt-1 text-white" x-text="formatMoney(kpi.failedTotal)"></div>
      <div class="text-sm text-slate-400 mt-1">
        <span class="text-slate-200" x-text="kpi.failedCount"></span> facture(s) FAILED
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
    <!-- Mini chart / breakdown -->
    <div class="min-h-0 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col">
      <div class="flex items-center justify-between mb-3 shrink-0">
        <h3 class="font-semibold text-white">CA encaissé par mois</h3>
        <span class="text-sm text-slate-400" x-text="paidByMonth.length ? (paidByMonth.length + ' mois') : '—'"></span>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <template x-if="paidByMonth.length === 0 && !loading">
          <div class="text-slate-400 text-sm">Aucune donnée sur la période.</div>
        </template>

        <div class="space-y-2">
          <template x-for="row in paidByMonth" :key="row.key">
            <div class="flex items-center gap-3">
              <div class="w-20 text-sm text-slate-300" x-text="row.label"></div>

              <div class="flex-1">
                <div class="h-2 rounded bg-white/10 overflow-hidden border border-white/10">
                  <div
                    class="h-2 rounded bg-emerald-400/70"
                    :style="'width:' + (row.pct) + '%'"
                  ></div>
                </div>
              </div>

              <div class="w-28 text-right text-sm font-medium text-slate-100" x-text="formatMoney(row.total)"></div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Recent unpaid list -->
    <div class="min-h-0 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col">
      <div class="flex items-center justify-between mb-3 shrink-0">
        <h3 class="font-semibold text-white">Factures à encaisser</h3>
        <button
          class="text-sm px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-100"
          :disabled="loading || unpaidTop.length === 0"
          @click="goInvoicesUnpaid()"
        >
          Voir dans Factures
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-white/10 bg-white/5">
        <table class="min-w-full text-sm">
          <thead class="sticky top-0 z-10 bg-slate-950/70 backdrop-blur border-b border-white/10">
            <tr class="text-slate-300">
              <th class="text-left p-2 font-medium">Réf</th>
              <th class="text-left p-2 font-medium">Date</th>
              <th class="text-right p-2 font-medium">TTC</th>
              <th class="text-left p-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody class="text-slate-100">
            <template x-for="inv in unpaidTop" :key="inv.id">
              <tr class="border-t border-white/10 hover:bg-white/5">
                <td class="p-2">
                  <span class="font-mono text-xs text-slate-200" x-text="inv.invoiceRef ?? inv.id"></span>
                </td>
                <td class="p-2 text-slate-200" x-text="inv.billingDate ?? '-'"></td>
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

            <template x-if="unpaidTop.length === 0 && !loading">
              <tr>
                <td class="p-4 text-slate-400 text-center" colspan="4">Rien à encaisser 🎉</td>
              </tr>
            </template>

            <template x-if="loading">
              <tr>
                <td class="p-4 text-slate-400 text-center" colspan="4">Chargement…</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-slate-400 mt-2">
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

                const paidRes = await this.fetchInvoices({ status: 'PAID', from, to });
                const pendingRes = await this.fetchInvoices({ status: 'PENDING', from, to });
                const sentRes = await this.fetchInvoices({ status: 'SENT', from, to });
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

            const byMonth = new Map();
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

            this.unpaidTop = [...this.unpaid]
                .sort(
                    (a, b) =>
                        (this.parseAnyDate(b?.billingDate)?.getTime() ?? 0) -
                        (this.parseAnyDate(a?.billingDate)?.getTime() ?? 0),
                )
                .slice(0, 20);
        },

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

            const fmt = (d) =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            return { from: fmt(start), to: fmt(now) };
        },

        parseAnyDate(v) {
            if (!v) return null;
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
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

        formatMoney(v) {
            if (typeof v !== 'number') return '-';
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
        },

        goInvoicesUnpaid() {
            location.hash = `#/invoices?status=PENDING`;
        },
    }));
}
