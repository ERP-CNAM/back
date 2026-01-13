// src/main.js
import { getRoute, requireAuth, go } from './router.js';
import { authStore } from './stores/auth.store.js';
import { toastStore } from './stores/toast.store.js';

import { Layout, bindLayoutGlobals } from './components/layout.component.js';
import { LoginPage, registerLoginAlpine } from './pages/login.page.js';
import { DashboardPage, registerDashboardAlpine } from './pages/dashboard.page.js';

const app = document.getElementById('app');

// expose toast store au layout (utilisé dans template x-if)
window.__toast = toastStore;

// ---- Alpine: attendre qu'il soit réellement dispo, puis register une seule fois
let alpineRegistered = false;

function waitForAlpine() {
    return new Promise((resolve) => {
        if (window.Alpine) return resolve(window.Alpine);

        const t = setInterval(() => {
            if (window.Alpine) {
                clearInterval(t);
                resolve(window.Alpine);
            }
        }, 10);
    });
}

async function ensureAlpineReady() {
    const Alpine = await waitForAlpine();

    if (!alpineRegistered) {
        alpineRegistered = true;
        registerLoginAlpine(); // OK car window.loginPage
        registerDashboardAlpine(Alpine); // IMPORTANT: passe Alpine ici
    }

    return Alpine;
}

function parseRoute() {
    const raw = getRoute(); // "/login" etc.
    const [path, query] = raw.split('?');
    const params = new URLSearchParams(query || '');
    return { path, params };
}
async function render() {
    const { path } = parseRoute();
    const Alpine = await ensureAlpineReady();

    // ✅ clean l’ancien arbre Alpine avant de remplacer le DOM
    Alpine.destroyTree(app);

    // inject HTML
    if (path === '/login') {
        app.innerHTML = LoginPage();
    } else {
        if (!requireAuth(path)) return;
        bindLayoutGlobals();
        app.innerHTML = Layout({ contentHtml: DashboardPage(path) });
    }

    // re-init
    Alpine.initTree(app);
}

window.addEventListener('hashchange', () => {
    render();
});

window.addEventListener('load', () => {
    if (!location.hash) {
        go(authStore.isAuthed ? '/users' : '/login');
    }
    render();
});

// 🔥 Debug: vérifie que le module est bien exécuté
console.log('[main] loaded');
