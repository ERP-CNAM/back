export const toastStore = {
    show: false,
    type: 'ok',
    message: '',

    notify(message, type = 'ok') {
        this.show = true;
        this.type = type;
        this.message = message;
        setTimeout(() => (this.show = false), 2500);
    },
};
