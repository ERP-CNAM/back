import { apiRequest } from '../api/client.js';
import { toastStore } from '../stores/toast.store.js';

export function SubscriptionsComponent() {
    return `
<section
  class="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] p-4 h-full min-h-0 flex flex-col text-slate-100"
  x-data="subscriptionsPage()"
  x-init="init()"
>
  <!-- Header -->
  <div class="flex items-center justify-between gap-4 mb-4 shrink-0">
    <div>
      <h2 class="text-lg font-semibold text-white">Abonnements</h2>
      <p class="text-xs text-slate-400">Filtrer, consulter et résilier.</p>
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

      <div class="relative flex flex-col gap-1" x-data="{ open: false }">
        <label class="text-[11px] text-slate-400">Statut</label>

        <button
          type="button"
          class="border border-white/10 bg-white/5 text-slate-100 rounded-lg px-3 py-2 w-52
                flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          @click="open = !open"
          @click.outside="open = false"
        >
          <span x-text="filterStatus || 'Tous'"></span>
          <svg class="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          x-show="open"
          x-transition
          class="absolute top-full mt-2 left-0 w-52 z-20 overflow-hidden rounded-xl border border-white/10
                bg-slate-950/95 backdrop-blur shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)]"
        >
          <button class="w-full text-left px-3 py-2 hover:bg-white/10"
            @click="filterStatus=''; open=false; load()"
          >Tous</button>

          <button class="w-full text-left px-3 py-2 hover:bg-white/10"
            @click="filterStatus='ACTIVE'; open=false; load()"
          >ACTIVE</button>

          <button class="w-full text-left px-3 py-2 hover:bg-white/10"
            @click="filterStatus='PENDING_CANCEL'; open=false; load()"
          >PENDING_CANCEL</button>

          <button class="w-full text-left px-3 py-2 hover:bg-white/10"
            @click="filterStatus='CANCELLED'; open=false; load()"
          >CANCELLED</button>
        </div>
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
          <th class="text-left p-2 font-medium">Contract</th>
          <th class="text-left p-2 font-medium">Utilisateur</th>
          <th class="text-left p-2 font-medium">Début</th>
          <th class="text-left p-2 font-medium">Fin</th>
          <th class="text-left p-2 font-medium">Montant</th>
          <th class="text-left p-2 font-medium">Status</th>
          <th class="p-2 font-medium text-center">Factures</th>
          <th class="text-right p-2 font-medium">Actions</th>
        </tr>
      </thead>

      <tbody class="text-slate-100">
        <template x-for="s in subscriptions" :key="s.id">
          <tr class="border-t border-white/10 hover:bg-white/5">
            <td class="p-2">
              <span class="font-mono text-xs text-slate-200" x-text="s.contractCode"></span>
            </td>

            <td class="p-2 text-slate-200" x-text="formatUser(s)"></td>

            <td class="p-2 text-slate-200" x-text="s.startDate"></td>

            <td class="p-2 text-slate-200" x-text="s.endDate ?? '-'"></td>

            <td class="p-2 text-slate-100 font-medium" x-text="formatMoney(s.monthlyAmount)"></td>

            <td class="p-2">
              <span
                class="px-2 py-1 rounded text-xs font-medium border border-white/10"
                :class="statusClass(s.status)"
                x-text="s.status"
              ></span>
            </td>

            <td class="p-2 text-center">
              <button
                class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/10 text-slate-100 hover:bg-white/15 disabled:opacity-50"
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
                    class="absolute right-0 mt-2 w-56 bg-slate-950/95 backdrop-blur border border-white/10 rounded-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] z-20 overflow-hidden"
                  >
                    <button
                      class="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-200 disabled:opacity-50"
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
            <td class="p-4 text-slate-400 text-center" colspan="8">
              Aucun abonnement.
            </td>
          </tr>
        </template>

        <template x-if="loading">
          <tr>
            <td class="p-4 text-slate-400 text-center" colspan="8">
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

        statusClass(status) {
            switch (status) {
                case 'ACTIVE':
                    return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20';
                case 'PENDING_CANCEL':
                    return 'bg-amber-500/15 text-amber-200 border-amber-400/20';
                case 'CANCELLED':
                    return 'bg-red-500/15 text-red-200 border-red-400/20';
                default:
                    return 'bg-white/10 text-slate-200 border-white/10';
            }
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
