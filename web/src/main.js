// src/main.js
import { getRoute, requireAuth, go } from './router.js';
import { authStore } from './stores/auth.store.js';
import { toastStore } from './stores/toast.store.js';

import { Layout, bindLayoutGlobals } from './components/layout.component.js';
import { LoginPage, registerLoginAlpine } from './pages/login.page.js';
import { DashboardPage, registerDashboardAlpine } from './pages/dashboard.page.js';

const app = document.getElementById('app');

window.__toast = toastStore;

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
        registerLoginAlpine();
        registerDashboardAlpine(Alpine);
    }

    return Alpine;
}

function parseRoute() {
    const raw = getRoute();
    const [path, query] = raw.split('?');
    const params = new URLSearchParams(query || '');
    return { path, params };
}
async function render() {
    const { path } = parseRoute();
    const Alpine = await ensureAlpineReady();

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

console.log('[main] loaded');
