// src/config.js
const KEY = 'http://localhost:3000';

export const config = {
    get API() {
        return localStorage.getItem(KEY) || 'http://localhost:3000';
    },
    set API(v) {
        localStorage.setItem(KEY, v);
    },
};
