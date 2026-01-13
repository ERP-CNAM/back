const TOKEN_KEY = 'admin_token';
const EMAIL_KEY = 'admin_email';

export const authStore = {
    token: localStorage.getItem(TOKEN_KEY) || '',
    email: localStorage.getItem(EMAIL_KEY) || '',

    get isAuthed() {
        return !!this.token;
    },

    login({ token, email }) {
        this.token = token;
        this.email = email || '';
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(EMAIL_KEY, this.email);
    },

    logout() {
        this.token = '';
        this.email = '';
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
    },
};
