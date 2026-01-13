function testApp() {
    return {
        result: '1) Login admin, 2) List users.',
        token: localStorage.getItem('admin_token') || '',

        email: 'admin@gamers-erp.com', // mets un vrai admin si tu en as un
        password: 'Admin123!', // idem

        API: 'http://localhost:3000', // ajuste si besoin

        async adminLogin() {
            try {
                const r = await fetch(`${this.API}/auth/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: this.email, password: this.password }),
                });

                const text = await r.text();
                this.result = `LOGIN status: ${r.status}\n\n${text}`;

                if (r.ok) {
                    const data = JSON.parse(text);
                    const token = data?.payload?.token;
                    if (token) {
                        this.token = token;
                        localStorage.setItem('admin_token', token);
                        this.result += '\n\n✅ Token saved.';
                    } else {
                        this.result += '\n\n⚠️ Pas de token dans payload.token';
                    }
                }
            } catch (e) {
                this.result = `Erreur login: ${e?.message ?? e}`;
            }
        },

        async listUsers() {
            try {
                const r = await fetch(`${this.API}/users`, {
                    method: 'GET',
                    headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
                });

                const text = await r.text();
                this.result = `USERS status: ${r.status}\n\n${text}`;
            } catch (e) {
                this.result = `Erreur users: ${e?.message ?? e}`;
            }
        },

        clear() {
            localStorage.removeItem('admin_token');
            this.token = '';
            this.result = 'Token cleared.';
        },
    };
}

window.testApp = testApp;
