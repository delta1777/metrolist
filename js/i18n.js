export const translations = {
    en: {
        nav: {
            list: 'List',
            leaderboard: 'Leaderboard',
            futureList: 'Future List',
            submitRecord: 'Submit Record'
        },
        list: {
            legacy: 'Legacy',
            pointsWhenCompleted: 'Points when completed',
            id: 'ID',
            password: 'Password',
            freeToCopy: 'Free to Copy',
            records: 'Records',
            qualifyText: 'or better to qualify',
            noRecords: 'This level does not accept new records.'
        },
        leaderboard: {
            verified: 'Verified',
            completed: 'Completed',
            progressed: 'Progressed',
            errorText: 'Leaderboard may be incorrect, as the following levels could not be loaded:'
        },
        futureList: {
            title: 'Future List',
            description: 'Levels that are currently being verified',
            bestProgress: 'Best Progress',
            creator: 'Creator',
            verifier: 'Verifier'
        },
        common: {
            loading: 'Loading...',
            error: 'Error'
        }
    },
    ru: {
        nav: {
            list: 'Список',
            leaderboard: 'Лидеры',
            futureList: 'Будущие Уровни',
            submitRecord: 'Подать прохождение'
        },
        list: {
            legacy: 'Легаси',
            pointsWhenCompleted: 'Очки за прохождение',
            id: 'ID',
            password: 'Пароль',
            freeToCopy: 'Свободно копировать',
            records: 'Рекорды',
            qualifyText: 'или больше для квалификации',
            noRecords: 'Этот уровень больше не принимает новые рекорды.'
        },
        leaderboard: {
            verified: 'Верифицированные',
            completed: 'Завершённые',
            progressed: 'В прогрессе',
            errorText: 'Таблица лидеров может быть неточной, так как следующие уровни не удалось загрузить:'
        },
        futureList: {
            title: 'Будущие Уровни',
            description: 'Уровни, которые сейчас верифицируются',
            bestProgress: 'Лучший прогресс',
            creator: 'Создатель',
            verifier: 'Верификатор'
        },
        common: {
            loading: 'Загрузка...',
            error: 'Ошибка'
        }
    }
};

export function createI18n() {
    return {
        locale: localStorage.getItem('locale') || 'ru',
        setLocale(locale) {
            this.locale = locale;
            localStorage.setItem('locale', locale);
        },
        t(key) {
            const keys = key.split('.');
            let value = translations[this.locale];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        }
    };
}
