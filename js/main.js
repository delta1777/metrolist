import routes from './routes.js';

function getInitialDarkMode() {
    const stored = localStorage.getItem('dark');
    if (stored !== null) {
        return JSON.parse(stored);
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const store = Vue.reactive({
    dark: getInitialDarkMode(),
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
});

const app = Vue.createApp({
    data: () => ({ store }),
});
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);

app.mount('#app');
