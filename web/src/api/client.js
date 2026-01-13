import { authStore } from '../stores/auth.store.js';
import { config } from '../config.js';

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';

    const token = authStore.token;
    if (auth && token) headers['Authorization'] = `Bearer ${token}`;

    const r = await fetch(`${config.API}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await r.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {}

    if (!r.ok) {
        const msg = data?.message || `HTTP ${r.status}`;
        const err = new Error(msg);
        err.status = r.status;
        err.data = data;
        throw err;
    }

    return data;
}
