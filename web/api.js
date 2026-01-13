export const API_BASE_URL = 'http://localhost:3000'; // même domaine. Sinon "http://localhost:3000"

function getToken() {
    return localStorage.getItem('admin_token');
}

export function setToken(token) {
    localStorage.setItem('admin_token', token);
}

export function clearToken() {
    localStorage.removeItem('admin_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // ton API retourne BaseAPIResponse { success, message, payload }
}

/** AUTH */
export const api = {
    adminLogin: (email, password) =>
        request('/auth/admin/login', { method: 'POST', body: { email, password }, auth: false }),

    /** USERS */
    listUsers: (status) => {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        return request(`/users${qs}`);
    },
    updateUserStatus: (userId, status) => request(`/users/${userId}/status`, { method: 'PATCH', body: { status } }),

    /** SUBSCRIPTIONS */
    listSubscriptions: ({ userId, status } = {}) => {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        if (status) params.set('status', status);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return request(`/subscriptions${qs}`);
    },
    cancelSubscription: (subscriptionId) => request(`/subscriptions/${subscriptionId}`, { method: 'DELETE' }),
};
