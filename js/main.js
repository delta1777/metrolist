import routes from './routes.js';
import { createI18n } from './i18n.js';

function getInitialDarkMode() {
    const stored = localStorage.getItem('dark');
    if (stored !== null) {
        return JSON.parse(stored);
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const i18n = createI18n();

export const store = Vue.reactive({
    dark: getInitialDarkMode(),
    locale: i18n.locale,
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
    setLocale(locale) {
        i18n.setLocale(locale);
        this.locale = locale;
    },
    t(key) {
        return i18n.t(key);
    }
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
