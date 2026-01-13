import { authStore } from './stores/auth.store.js';

export function getRoute() {
    const hash = location.hash || '#/login';
    return hash.replace('#', '');
}

export function go(path) {
    location.hash = `#${path}`;
}

export function requireAuth(path) {
    if (!authStore.isAuthed) {
        go('/login');
        return false;
    }
    return true;
}
