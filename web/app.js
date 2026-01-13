function testApp() {
    return {
        result: 'Clique sur Ping pour tester.',
        async ping() {
            try {
                // Mets ici l’URL EXACTE de ton API
                const API = 'http://localhost:3000';

                const r = await fetch(`${API}/users`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const text = await r.text();
                this.result = `Status: ${r.status}\n\nBody:\n${text}`;
            } catch (e) {
                this.result = `Erreur:\n${e?.message ?? e}`;
            }
        },
    };
}

// 🔥 rendre la fonction visible pour Alpine
window.testApp = testApp;
